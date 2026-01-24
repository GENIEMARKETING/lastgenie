"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createConnectAccount = createConnectAccount;
exports.createAccountLink = createAccountLink;
exports.checkAccountStatus = checkAccountStatus;
exports.processPayout = processPayout;
exports.processAutomatedPayouts = processAutomatedPayouts;
exports.handleTransferWebhook = handleTransferWebhook;
exports.getPayoutHistory = getPayoutHistory;
exports.getConnectDashboardLink = getConnectDashboardLink;
const stripe_1 = __importDefault(require("stripe"));
const prisma_1 = require("../lib/prisma");
// Initialize Stripe with secret key
const stripe = new stripe_1.default(process.env.STRIPE_SECRET_KEY, {
    apiVersion: '2024-12-18.acacia'
});
/**
 * Create Stripe Connect Express account for affiliate
 */
async function createConnectAccount(affiliateId, accountData) {
    try {
        const affiliate = await prisma_1.prisma.affiliate.findUnique({
            where: { id: affiliateId },
            include: { user: true }
        });
        if (!affiliate) {
            return { success: false, error: 'Affiliate not found' };
        }
        if (affiliate.stripeConnectId) {
            return { success: false, error: 'Stripe Connect account already exists' };
        }
        // Create Express account
        const account = await stripe.accounts.create({
            type: 'express',
            country: accountData.country || 'US',
            email: accountData.email,
            capabilities: {
                transfers: { requested: true }
            },
            business_type: 'individual',
            individual: {
                email: accountData.email,
                first_name: accountData.firstName,
                last_name: accountData.lastName
            }
        });
        // Update affiliate with Stripe Connect ID
        await prisma_1.prisma.affiliate.update({
            where: { id: affiliateId },
            data: {
                stripeConnectId: account.id
            }
        });
        return { success: true, accountId: account.id };
    }
    catch (error) {
        console.error('Create Connect account error:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Failed to create Connect account'
        };
    }
}
/**
 * Create account link for affiliate onboarding
 */
async function createAccountLink(affiliateId, returnUrl, refreshUrl) {
    try {
        const affiliate = await prisma_1.prisma.affiliate.findUnique({
            where: { id: affiliateId }
        });
        if (!affiliate) {
            return { success: false, error: 'Affiliate not found' };
        }
        if (!affiliate.stripeConnectId) {
            return { success: false, error: 'No Stripe Connect account found' };
        }
        const accountLink = await stripe.accountLinks.create({
            account: affiliate.stripeConnectId,
            refresh_url: refreshUrl,
            return_url: returnUrl,
            type: 'account_onboarding'
        });
        return { success: true, url: accountLink.url };
    }
    catch (error) {
        console.error('Create account link error:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Failed to create account link'
        };
    }
}
/**
 * Check if Connect account is fully onboarded
 */
async function checkAccountStatus(affiliateId) {
    try {
        const affiliate = await prisma_1.prisma.affiliate.findUnique({
            where: { id: affiliateId }
        });
        if (!affiliate || !affiliate.stripeConnectId) {
            return { success: false, error: 'No Stripe Connect account found' };
        }
        const account = await stripe.accounts.retrieve(affiliate.stripeConnectId);
        const isOnboarded = account.charges_enabled && account.payouts_enabled;
        return { success: true, isOnboarded };
    }
    catch (error) {
        console.error('Check account status error:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Failed to check account status'
        };
    }
}
/**
 * Process single payout to affiliate
 */
async function processPayout(payoutData) {
    try {
        const affiliate = await prisma_1.prisma.affiliate.findUnique({
            where: { id: payoutData.affiliateId }
        });
        if (!affiliate) {
            return { success: false, error: 'Affiliate not found' };
        }
        if (!affiliate.stripeConnectId) {
            return { success: false, error: 'No Stripe Connect account found' };
        }
        // Check if account is onboarded
        const accountStatus = await checkAccountStatus(payoutData.affiliateId);
        if (!accountStatus.success || !accountStatus.isOnboarded) {
            return { success: false, error: 'Stripe Connect account not fully onboarded' };
        }
        // Check if affiliate has sufficient pending earnings
        if (affiliate.pendingEarnings < payoutData.amount) {
            return { success: false, error: 'Insufficient pending earnings' };
        }
        // Convert amount to cents for Stripe
        const amountInCents = Math.round(payoutData.amount * 100);
        // Create transfer to Connect account
        const transfer = await stripe.transfers.create({
            amount: amountInCents,
            currency: payoutData.currency || 'usd',
            destination: affiliate.stripeConnectId,
            description: `Affiliate commission payout for ${affiliate.referralCode}`
        });
        // Create payout record
        const payout = await prisma_1.prisma.affiliatePayout.create({
            data: {
                affiliateId: payoutData.affiliateId,
                amount: payoutData.amount,
                status: 'processing',
                method: 'stripe_connect',
                stripeTransferId: transfer.id
            }
        });
        // Update affiliate earnings
        await prisma_1.prisma.affiliate.update({
            where: { id: payoutData.affiliateId },
            data: {
                pendingEarnings: {
                    decrement: payoutData.amount
                }
            }
        });
        return { success: true, payoutId: payout.id };
    }
    catch (error) {
        console.error('Process payout error:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Failed to process payout'
        };
    }
}
/**
 * Process automated payouts for all eligible affiliates
 */
async function processAutomatedPayouts() {
    const errors = [];
    let processedCount = 0;
    try {
        // Find affiliates eligible for payout (pending earnings >= threshold)
        const eligibleAffiliates = await prisma_1.prisma.affiliate.findMany({
            where: {
                status: 'active',
                stripeConnectId: { not: null },
                pendingEarnings: { gte: prisma_1.prisma.affiliate.fields.payoutThreshold }
            }
        });
        console.log(`Found ${eligibleAffiliates.length} affiliates eligible for payout`);
        for (const affiliate of eligibleAffiliates) {
            try {
                // Check if account is onboarded
                const accountStatus = await checkAccountStatus(affiliate.id);
                if (!accountStatus.success || !accountStatus.isOnboarded) {
                    errors.push(`Affiliate ${affiliate.referralCode}: Account not fully onboarded`);
                    continue;
                }
                // Process payout
                const result = await processPayout({
                    affiliateId: affiliate.id,
                    amount: affiliate.pendingEarnings
                });
                if (result.success) {
                    processedCount++;
                    console.log(`Processed payout for affiliate ${affiliate.referralCode}: $${affiliate.pendingEarnings}`);
                }
                else {
                    errors.push(`Affiliate ${affiliate.referralCode}: ${result.error}`);
                }
            }
            catch (error) {
                const errorMessage = error instanceof Error ? error.message : 'Unknown error';
                errors.push(`Affiliate ${affiliate.referralCode}: ${errorMessage}`);
            }
        }
        return { success: true, processedCount, errors };
    }
    catch (error) {
        console.error('Process automated payouts error:', error);
        return {
            success: false,
            processedCount,
            errors: [...errors, error instanceof Error ? error.message : 'Unknown error']
        };
    }
}
/**
 * Handle Stripe webhook for transfer events
 */
async function handleTransferWebhook(event) {
    try {
        switch (event.type) {
            case 'transfer.created':
                // Transfer was created successfully
                break;
            case 'transfer.paid':
                // Transfer was successfully paid out
                const transferPaid = event.data.object;
                await updatePayoutStatus(transferPaid.id, 'completed');
                break;
            case 'transfer.failed':
                // Transfer failed
                const transferFailed = event.data.object;
                await updatePayoutStatus(transferFailed.id, 'failed', 'Transfer failed');
                break;
            case 'transfer.reversed':
                // Transfer was reversed
                const transferReversed = event.data.object;
                await updatePayoutStatus(transferReversed.id, 'failed', 'Transfer reversed');
                break;
            default:
                console.log(`Unhandled transfer event type: ${event.type}`);
        }
        return { success: true };
    }
    catch (error) {
        console.error('Handle transfer webhook error:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Failed to handle webhook'
        };
    }
}
/**
 * Update payout status based on Stripe events
 */
async function updatePayoutStatus(stripeTransferId, status, failureReason) {
    try {
        const payout = await prisma_1.prisma.affiliatePayout.findFirst({
            where: { stripeTransferId },
            include: { affiliate: true }
        });
        if (!payout) {
            console.error(`Payout not found for transfer ID: ${stripeTransferId}`);
            return;
        }
        if (status === 'completed') {
            // Update payout status and affiliate paid earnings
            await prisma_1.prisma.$transaction([
                prisma_1.prisma.affiliatePayout.update({
                    where: { id: payout.id },
                    data: {
                        status: 'completed',
                        processedAt: new Date()
                    }
                }),
                prisma_1.prisma.affiliate.update({
                    where: { id: payout.affiliateId },
                    data: {
                        paidEarnings: {
                            increment: payout.amount
                        }
                    }
                })
            ]);
        }
        else {
            // Update payout status and restore pending earnings
            await prisma_1.prisma.$transaction([
                prisma_1.prisma.affiliatePayout.update({
                    where: { id: payout.id },
                    data: {
                        status: 'failed',
                        failureReason,
                        processedAt: new Date()
                    }
                }),
                prisma_1.prisma.affiliate.update({
                    where: { id: payout.affiliateId },
                    data: {
                        pendingEarnings: {
                            increment: payout.amount
                        }
                    }
                })
            ]);
        }
    }
    catch (error) {
        console.error('Update payout status error:', error);
    }
}
/**
 * Get payout history for affiliate
 */
async function getPayoutHistory(affiliateId, limit = 20, offset = 0) {
    try {
        const payouts = await prisma_1.prisma.affiliatePayout.findMany({
            where: { affiliateId },
            orderBy: { createdAt: 'desc' },
            take: limit,
            skip: offset
        });
        return { success: true, payouts };
    }
    catch (error) {
        console.error('Get payout history error:', error);
        return { success: false, error: 'Failed to fetch payout history' };
    }
}
/**
 * Get Connect account dashboard link for affiliate
 */
async function getConnectDashboardLink(affiliateId) {
    try {
        const affiliate = await prisma_1.prisma.affiliate.findUnique({
            where: { id: affiliateId }
        });
        if (!affiliate || !affiliate.stripeConnectId) {
            return { success: false, error: 'No Stripe Connect account found' };
        }
        const loginLink = await stripe.accounts.createLoginLink(affiliate.stripeConnectId);
        return { success: true, url: loginLink.url };
    }
    catch (error) {
        console.error('Get dashboard link error:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Failed to create dashboard link'
        };
    }
}
