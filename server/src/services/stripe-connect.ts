import Stripe from 'stripe';
import { prisma } from '../lib/prisma';

// Initialize Stripe with secret key
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

export interface ConnectAccountData {
  email: string;
  firstName: string;
  lastName: string;
  country?: string;
}

export interface PayoutData {
  affiliateId: string;
  amount: number;
  currency?: string;
}

/**
 * Create Stripe Connect Express account for affiliate
 */
export async function createConnectAccount(
  affiliateId: string,
  accountData: ConnectAccountData
): Promise<{ success: boolean; accountId?: string; error?: string }> {
  try {
    const affiliate = await prisma.affiliate.findUnique({
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
    await prisma.affiliate.update({
      where: { id: affiliateId },
      data: {
        stripeConnectId: account.id
      }
    });

    return { success: true, accountId: account.id };
  } catch (error) {
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
export async function createAccountLink(
  affiliateId: string,
  returnUrl: string,
  refreshUrl: string
): Promise<{ success: boolean; url?: string; error?: string }> {
  try {
    const affiliate = await prisma.affiliate.findUnique({
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
  } catch (error) {
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
export async function checkAccountStatus(
  affiliateId: string
): Promise<{ success: boolean; isOnboarded?: boolean; error?: string }> {
  try {
    const affiliate = await prisma.affiliate.findUnique({
      where: { id: affiliateId }
    });

    if (!affiliate || !affiliate.stripeConnectId) {
      return { success: false, error: 'No Stripe Connect account found' };
    }

    const account = await stripe.accounts.retrieve(affiliate.stripeConnectId);

    const isOnboarded = account.charges_enabled && account.payouts_enabled;

    return { success: true, isOnboarded };
  } catch (error) {
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
export async function processPayout(
  payoutData: PayoutData
): Promise<{ success: boolean; payoutId?: string; error?: string }> {
  try {
    const affiliate = await prisma.affiliate.findUnique({
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
    const payout = await prisma.affiliatePayout.create({
      data: {
        affiliateId: payoutData.affiliateId,
        amount: payoutData.amount,
        status: 'processing',
        method: 'stripe_connect',
        stripeTransferId: transfer.id
      }
    });

    // Update affiliate earnings
    await prisma.affiliate.update({
      where: { id: payoutData.affiliateId },
      data: {
        pendingEarnings: {
          decrement: payoutData.amount
        }
      }
    });

    return { success: true, payoutId: payout.id };
  } catch (error) {
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
export async function processAutomatedPayouts(): Promise<{
  success: boolean;
  processedCount: number;
  errors: string[];
}> {
  const errors: string[] = [];
  let processedCount = 0;

  try {
    // Find affiliates eligible for payout (pending earnings >= threshold)
    const eligibleAffiliates = await prisma.affiliate.findMany({
      where: {
        status: 'active',
        stripeConnectId: { not: null },
        pendingEarnings: { gte: prisma.affiliate.fields.payoutThreshold }
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
        } else {
          errors.push(`Affiliate ${affiliate.referralCode}: ${result.error}`);
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        errors.push(`Affiliate ${affiliate.referralCode}: ${errorMessage}`);
      }
    }

    return { success: true, processedCount, errors };
  } catch (error) {
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
export async function handleTransferWebhook(
  event: Stripe.Event
): Promise<{ success: boolean; error?: string }> {
  try {
    switch (event.type) {
      case 'transfer.created':
        // Transfer was created successfully
        break;
        
      case 'transfer.paid':
        // Transfer was successfully paid out
        const transferPaid = event.data.object as Stripe.Transfer;
        await updatePayoutStatus(transferPaid.id, 'completed');
        break;
        
      case 'transfer.failed':
        // Transfer failed
        const transferFailed = event.data.object as Stripe.Transfer;
        await updatePayoutStatus(transferFailed.id, 'failed', 'Transfer failed');
        break;
        
      case 'transfer.reversed':
        // Transfer was reversed
        const transferReversed = event.data.object as Stripe.Transfer;
        await updatePayoutStatus(transferReversed.id, 'failed', 'Transfer reversed');
        break;
        
      default:
        console.log(`Unhandled transfer event type: ${event.type}`);
    }

    return { success: true };
  } catch (error) {
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
async function updatePayoutStatus(
  stripeTransferId: string,
  status: 'completed' | 'failed',
  failureReason?: string
): Promise<void> {
  try {
    const payout = await prisma.affiliatePayout.findFirst({
      where: { stripeTransferId },
      include: { affiliate: true }
    });

    if (!payout) {
      console.error(`Payout not found for transfer ID: ${stripeTransferId}`);
      return;
    }

    if (status === 'completed') {
      // Update payout status and affiliate paid earnings
      await prisma.$transaction([
        prisma.affiliatePayout.update({
          where: { id: payout.id },
          data: {
            status: 'completed',
            processedAt: new Date()
          }
        }),
        prisma.affiliate.update({
          where: { id: payout.affiliateId },
          data: {
            paidEarnings: {
              increment: payout.amount
            }
          }
        })
      ]);
    } else {
      // Update payout status and restore pending earnings
      await prisma.$transaction([
        prisma.affiliatePayout.update({
          where: { id: payout.id },
          data: {
            status: 'failed',
            failureReason,
            processedAt: new Date()
          }
        }),
        prisma.affiliate.update({
          where: { id: payout.affiliateId },
          data: {
            pendingEarnings: {
              increment: payout.amount
            }
          }
        })
      ]);
    }
  } catch (error) {
    console.error('Update payout status error:', error);
  }
}

/**
 * Get payout history for affiliate
 */
export async function getPayoutHistory(
  affiliateId: string,
  limit: number = 20,
  offset: number = 0
) {
  try {
    const payouts = await prisma.affiliatePayout.findMany({
      where: { affiliateId },
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip: offset
    });

    return { success: true, payouts };
  } catch (error) {
    console.error('Get payout history error:', error);
    return { success: false, error: 'Failed to fetch payout history' };
  }
}

/**
 * Get Connect account dashboard link for affiliate
 */
export async function getConnectDashboardLink(
  affiliateId: string
): Promise<{ success: boolean; url?: string; error?: string }> {
  try {
    const affiliate = await prisma.affiliate.findUnique({
      where: { id: affiliateId }
    });

    if (!affiliate || !affiliate.stripeConnectId) {
      return { success: false, error: 'No Stripe Connect account found' };
    }

    const loginLink = await stripe.accounts.createLoginLink(affiliate.stripeConnectId);

    return { success: true, url: loginLink.url };
  } catch (error) {
    console.error('Get dashboard link error:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to create dashboard link' 
    };
  }
}