"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateReferralCode = generateReferralCode;
exports.validateReferralCode = validateReferralCode;
exports.trackAffiliateClick = trackAffiliateClick;
exports.processAffiliateConversion = processAffiliateConversion;
exports.getAffiliateAttribution = getAffiliateAttribution;
exports.confirmConversion = confirmConversion;
exports.cancelConversion = cancelConversion;
exports.getAffiliateAnalytics = getAffiliateAnalytics;
const prisma_1 = require("../lib/prisma");
/**
 * Generate a unique referral code for an affiliate
 */
async function generateReferralCode(userId) {
    const generateCode = () => {
        const userIdSuffix = userId.slice(-4).toUpperCase();
        const random = Math.random().toString(36).substring(2, 6).toUpperCase();
        return `GENIE${userIdSuffix}${random}`;
    };
    let referralCode = generateCode();
    let attempts = 0;
    // Ensure referral code is unique
    while (attempts < 10) {
        const existing = await prisma_1.prisma.affiliate.findUnique({
            where: { referralCode }
        });
        if (!existing)
            break;
        referralCode = generateCode();
        attempts++;
    }
    if (attempts >= 10) {
        throw new Error('Failed to generate unique referral code');
    }
    return referralCode;
}
/**
 * Validate referral code format
 */
function validateReferralCode(code) {
    // GENIE followed by 4 uppercase alphanumeric chars (user ID) + 4 random chars
    const pattern = /^GENIE[A-Z0-9]{8}$/;
    return pattern.test(code);
}
/**
 * Track affiliate click with fraud detection
 */
async function trackAffiliateClick(referralCode, context) {
    try {
        // Validate referral code format
        if (!validateReferralCode(referralCode)) {
            return { success: false, message: 'Invalid referral code format' };
        }
        // Find affiliate by referral code
        const affiliate = await prisma_1.prisma.affiliate.findUnique({
            where: { referralCode }
        });
        if (!affiliate) {
            return { success: false, message: 'Invalid referral code' };
        }
        if (affiliate.status !== 'active') {
            return { success: false, message: 'Affiliate is not active' };
        }
        // Fraud detection checks
        const fraudCheck = await performFraudDetection(affiliate.id, context);
        if (!fraudCheck.isValid) {
            return { success: false, message: fraudCheck.reason };
        }
        // Create click record
        await prisma_1.prisma.affiliateClick.create({
            data: {
                affiliateId: affiliate.id,
                ipAddress: context.ipAddress,
                userAgent: context.userAgent,
                referer: context.referer,
                utm_source: context.utm_source,
                utm_medium: context.utm_medium,
                utm_campaign: context.utm_campaign
            }
        });
        // Update affiliate total clicks
        await prisma_1.prisma.affiliate.update({
            where: { id: affiliate.id },
            data: {
                totalClicks: {
                    increment: 1
                }
            }
        });
        return {
            success: true,
            message: 'Click tracked successfully',
            cookieDuration: affiliate.cookieDuration
        };
    }
    catch (error) {
        console.error('Track click error:', error);
        return { success: false, message: 'Failed to track click' };
    }
}
/**
 * Process affiliate conversion
 */
async function processAffiliateConversion(referralCode, conversionData) {
    try {
        // Find affiliate by referral code
        const affiliate = await prisma_1.prisma.affiliate.findUnique({
            where: { referralCode }
        });
        if (!affiliate) {
            return { success: false, message: 'Invalid referral code' };
        }
        if (affiliate.status !== 'active') {
            return { success: false, message: 'Affiliate is not active' };
        }
        // Check if conversion already exists for this order
        const existingConversion = await prisma_1.prisma.affiliateConversion.findUnique({
            where: { orderId: conversionData.orderId }
        });
        if (existingConversion) {
            return { success: false, message: 'Conversion already tracked for this order' };
        }
        // Self-referral check - prevent affiliates from earning commission on their own purchases
        if (affiliate.userId === conversionData.userId) {
            return { success: false, message: 'Self-referral not allowed' };
        }
        // Calculate commission
        const commissionAmount = conversionData.orderValue * affiliate.commissionRate;
        // Create conversion record
        await prisma_1.prisma.affiliateConversion.create({
            data: {
                affiliateId: affiliate.id,
                orderId: conversionData.orderId,
                orderValue: conversionData.orderValue,
                commissionRate: affiliate.commissionRate,
                commissionAmount,
                status: 'pending',
                ipAddress: conversionData.ipAddress
            }
        });
        // Update affiliate statistics
        await prisma_1.prisma.affiliate.update({
            where: { id: affiliate.id },
            data: {
                totalConversions: {
                    increment: 1
                },
                totalEarnings: {
                    increment: commissionAmount
                },
                pendingEarnings: {
                    increment: commissionAmount
                }
            }
        });
        return {
            success: true,
            message: 'Conversion tracked successfully',
            commissionAmount
        };
    }
    catch (error) {
        console.error('Process conversion error:', error);
        return { success: false, message: 'Failed to process conversion' };
    }
}
/**
 * Fraud detection for affiliate clicks
 */
async function performFraudDetection(affiliateId, context) {
    const oneHourAgo = new Date();
    oneHourAgo.setHours(oneHourAgo.getHours() - 1);
    // Check for duplicate clicks from same IP in last hour
    const recentClick = await prisma_1.prisma.affiliateClick.findFirst({
        where: {
            affiliateId,
            ipAddress: context.ipAddress,
            createdAt: {
                gte: oneHourAgo
            }
        }
    });
    if (recentClick) {
        return { isValid: false, reason: 'Duplicate click from same IP within 1 hour' };
    }
    // Check for excessive clicks from same IP (more than 10 per day)
    const oneDayAgo = new Date();
    oneDayAgo.setDate(oneDayAgo.getDate() - 1);
    const dailyClickCount = await prisma_1.prisma.affiliateClick.count({
        where: {
            affiliateId,
            ipAddress: context.ipAddress,
            createdAt: {
                gte: oneDayAgo
            }
        }
    });
    if (dailyClickCount >= 10) {
        return { isValid: false, reason: 'Excessive clicks from same IP' };
    }
    // Check for suspicious user agent patterns
    if (isSuspiciousUserAgent(context.userAgent)) {
        return { isValid: false, reason: 'Suspicious user agent detected' };
    }
    return { isValid: true };
}
/**
 * Check for suspicious user agent patterns
 */
function isSuspiciousUserAgent(userAgent) {
    const suspiciousPatterns = [
        /bot/i,
        /crawler/i,
        /spider/i,
        /scraper/i,
        /curl/i,
        /wget/i,
        /python/i,
        /php/i,
        /automated/i
    ];
    return suspiciousPatterns.some(pattern => pattern.test(userAgent));
}
/**
 * Get affiliate attribution from cookie or referral parameter
 */
function getAffiliateAttribution(cookies, referralParam) {
    // Check for new referral parameter first
    if (referralParam && validateReferralCode(referralParam)) {
        return { referralCode: referralParam, isNewAttribution: true };
    }
    // Check existing cookie
    const cookieReferralCode = cookies?.affiliate_ref;
    if (cookieReferralCode && validateReferralCode(cookieReferralCode)) {
        return { referralCode: cookieReferralCode, isNewAttribution: false };
    }
    return { referralCode: null, isNewAttribution: false };
}
/**
 * Confirm conversion (called when order is confirmed/shipped)
 */
async function confirmConversion(orderId) {
    try {
        const conversion = await prisma_1.prisma.affiliateConversion.findUnique({
            where: { orderId },
            include: { affiliate: true }
        });
        if (!conversion) {
            return false;
        }
        if (conversion.status !== 'pending') {
            return false;
        }
        // Update conversion status
        await prisma_1.prisma.affiliateConversion.update({
            where: { orderId },
            data: { status: 'confirmed' }
        });
        return true;
    }
    catch (error) {
        console.error('Confirm conversion error:', error);
        return false;
    }
}
/**
 * Cancel conversion (called when order is cancelled/refunded)
 */
async function cancelConversion(orderId) {
    try {
        const conversion = await prisma_1.prisma.affiliateConversion.findUnique({
            where: { orderId },
            include: { affiliate: true }
        });
        if (!conversion) {
            return false;
        }
        if (conversion.status === 'cancelled') {
            return true;
        }
        // Update conversion status and adjust affiliate earnings
        await prisma_1.prisma.$transaction([
            prisma_1.prisma.affiliateConversion.update({
                where: { orderId },
                data: { status: 'cancelled' }
            }),
            prisma_1.prisma.affiliate.update({
                where: { id: conversion.affiliateId },
                data: {
                    totalConversions: {
                        decrement: 1
                    },
                    totalEarnings: {
                        decrement: conversion.commissionAmount
                    },
                    pendingEarnings: {
                        decrement: conversion.commissionAmount
                    }
                }
            })
        ]);
        return true;
    }
    catch (error) {
        console.error('Cancel conversion error:', error);
        return false;
    }
}
/**
 * Get affiliate performance analytics
 */
async function getAffiliateAnalytics(affiliateId, startDate, endDate) {
    try {
        const where = { affiliateId };
        if (startDate || endDate) {
            where.createdAt = {};
            if (startDate)
                where.createdAt.gte = startDate;
            if (endDate)
                where.createdAt.lte = endDate;
        }
        const [clicks, conversions, earnings] = await Promise.all([
            prisma_1.prisma.affiliateClick.count({ where }),
            prisma_1.prisma.affiliateConversion.count({ where }),
            prisma_1.prisma.affiliateConversion.aggregate({
                where,
                _sum: { commissionAmount: true }
            })
        ]);
        const conversionRate = clicks > 0 ? (conversions / clicks * 100) : 0;
        return {
            clicks,
            conversions,
            earnings: earnings._sum.commissionAmount || 0,
            conversionRate: parseFloat(conversionRate.toFixed(2))
        };
    }
    catch (error) {
        console.error('Get analytics error:', error);
        return null;
    }
}
