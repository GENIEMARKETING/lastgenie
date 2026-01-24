"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const globals_1 = require("@jest/globals");
const affiliate_tracking_1 = require("../../services/affiliate-tracking");
const prisma_1 = require("../../lib/prisma");
// Mock data
const mockUserId = 'test-user-123';
const mockAffiliateId = 'test-affiliate-123';
const mockOrderId = 'test-order-123';
(0, globals_1.describe)('Affiliate Tracking Service', () => {
    (0, globals_1.beforeEach)(async () => {
        // Clean up test data before each test
        await prisma_1.prisma.affiliateConversion.deleteMany({
            where: { orderId: { startsWith: 'test-' } }
        });
        await prisma_1.prisma.affiliateClick.deleteMany({
            where: { affiliateId: { startsWith: 'test-' } }
        });
        await prisma_1.prisma.affiliate.deleteMany({
            where: { id: { startsWith: 'test-' } }
        });
        await prisma_1.prisma.user.deleteMany({
            where: { id: { startsWith: 'test-' } }
        });
    });
    (0, globals_1.afterEach)(async () => {
        // Clean up test data after each test
        await prisma_1.prisma.affiliateConversion.deleteMany({
            where: { orderId: { startsWith: 'test-' } }
        });
        await prisma_1.prisma.affiliateClick.deleteMany({
            where: { affiliateId: { startsWith: 'test-' } }
        });
        await prisma_1.prisma.affiliate.deleteMany({
            where: { id: { startsWith: 'test-' } }
        });
        await prisma_1.prisma.user.deleteMany({
            where: { id: { startsWith: 'test-' } }
        });
    });
    (0, globals_1.describe)('generateReferralCode', () => {
        (0, globals_1.it)('should generate a valid referral code', async () => {
            const code = await (0, affiliate_tracking_1.generateReferralCode)(mockUserId);
            (0, globals_1.expect)(code).toMatch(/^GENIE[A-Z0-9]{8}$/);
            (0, globals_1.expect)(code).toHaveLength(13);
        });
        (0, globals_1.it)('should generate unique referral codes', async () => {
            const code1 = await (0, affiliate_tracking_1.generateReferralCode)(mockUserId);
            const code2 = await (0, affiliate_tracking_1.generateReferralCode)('different-user-id');
            (0, globals_1.expect)(code1).not.toBe(code2);
        });
    });
    (0, globals_1.describe)('validateReferralCode', () => {
        (0, globals_1.it)('should validate correct referral code format', () => {
            (0, globals_1.expect)((0, affiliate_tracking_1.validateReferralCode)('GENIE1234ABCD')).toBe(true);
            (0, globals_1.expect)((0, affiliate_tracking_1.validateReferralCode)('GENIE123ABC12')).toBe(true);
        });
        (0, globals_1.it)('should reject invalid referral code formats', () => {
            (0, globals_1.expect)((0, affiliate_tracking_1.validateReferralCode)('INVALID123')).toBe(false);
            (0, globals_1.expect)((0, affiliate_tracking_1.validateReferralCode)('GENIE123')).toBe(false);
            (0, globals_1.expect)((0, affiliate_tracking_1.validateReferralCode)('genie1234abcd')).toBe(false);
            (0, globals_1.expect)((0, affiliate_tracking_1.validateReferralCode)('GENIE1234ABCDE')).toBe(false);
            (0, globals_1.expect)((0, affiliate_tracking_1.validateReferralCode)('')).toBe(false);
        });
    });
    (0, globals_1.describe)('trackAffiliateClick', () => {
        (0, globals_1.beforeEach)(async () => {
            // Create test user and affiliate
            await prisma_1.prisma.user.create({
                data: {
                    id: mockUserId,
                    email: 'test@example.com',
                    passwordHash: 'hashed-password'
                }
            });
            await prisma_1.prisma.affiliate.create({
                data: {
                    id: mockAffiliateId,
                    userId: mockUserId,
                    referralCode: 'GENIE1234TEST',
                    status: 'active'
                }
            });
        });
        (0, globals_1.it)('should successfully track a valid click', async () => {
            const result = await (0, affiliate_tracking_1.trackAffiliateClick)('GENIE1234TEST', {
                ipAddress: '192.168.1.1',
                userAgent: 'Mozilla/5.0 Test Browser',
                referer: 'https://example.com'
            });
            (0, globals_1.expect)(result.success).toBe(true);
            (0, globals_1.expect)(result.message).toBe('Click tracked successfully');
            (0, globals_1.expect)(result.cookieDuration).toBe(30);
            // Verify click was recorded
            const clicks = await prisma_1.prisma.affiliateClick.findMany({
                where: { affiliateId: mockAffiliateId }
            });
            (0, globals_1.expect)(clicks).toHaveLength(1);
            (0, globals_1.expect)(clicks[0].ipAddress).toBe('192.168.1.1');
        });
        (0, globals_1.it)('should reject invalid referral code', async () => {
            const result = await (0, affiliate_tracking_1.trackAffiliateClick)('INVALID123', {
                ipAddress: '192.168.1.1',
                userAgent: 'Mozilla/5.0 Test Browser'
            });
            (0, globals_1.expect)(result.success).toBe(false);
            (0, globals_1.expect)(result.message).toBe('Invalid referral code format');
        });
        (0, globals_1.it)('should prevent duplicate clicks from same IP within 1 hour', async () => {
            const context = {
                ipAddress: '192.168.1.1',
                userAgent: 'Mozilla/5.0 Test Browser'
            };
            // First click should succeed
            const result1 = await (0, affiliate_tracking_1.trackAffiliateClick)('GENIE1234TEST', context);
            (0, globals_1.expect)(result1.success).toBe(true);
            // Second click from same IP should be rejected
            const result2 = await (0, affiliate_tracking_1.trackAffiliateClick)('GENIE1234TEST', context);
            (0, globals_1.expect)(result2.success).toBe(false);
            (0, globals_1.expect)(result2.message).toBe('Duplicate click from same IP within 1 hour');
        });
        (0, globals_1.it)('should reject suspicious user agents', async () => {
            const result = await (0, affiliate_tracking_1.trackAffiliateClick)('GENIE1234TEST', {
                ipAddress: '192.168.1.1',
                userAgent: 'python-requests/2.28.1'
            });
            (0, globals_1.expect)(result.success).toBe(false);
            (0, globals_1.expect)(result.message).toBe('Suspicious user agent detected');
        });
    });
    (0, globals_1.describe)('processAffiliateConversion', () => {
        (0, globals_1.beforeEach)(async () => {
            // Create test user and affiliate
            await prisma_1.prisma.user.create({
                data: {
                    id: mockUserId,
                    email: 'test@example.com',
                    passwordHash: 'hashed-password'
                }
            });
            await prisma_1.prisma.affiliate.create({
                data: {
                    id: mockAffiliateId,
                    userId: mockUserId,
                    referralCode: 'GENIE1234TEST',
                    status: 'active',
                    commissionRate: 0.10
                }
            });
        });
        (0, globals_1.it)('should successfully process a valid conversion', async () => {
            const result = await (0, affiliate_tracking_1.processAffiliateConversion)('GENIE1234TEST', {
                orderId: mockOrderId,
                orderValue: 100.00,
                userId: 'different-user-id',
                ipAddress: '192.168.1.1'
            });
            (0, globals_1.expect)(result.success).toBe(true);
            (0, globals_1.expect)(result.message).toBe('Conversion tracked successfully');
            (0, globals_1.expect)(result.commissionAmount).toBe(10.00);
            // Verify conversion was recorded
            const conversions = await prisma_1.prisma.affiliateConversion.findMany({
                where: { affiliateId: mockAffiliateId }
            });
            (0, globals_1.expect)(conversions).toHaveLength(1);
            (0, globals_1.expect)(conversions[0].orderValue).toBe(100.00);
            (0, globals_1.expect)(conversions[0].commissionAmount).toBe(10.00);
        });
        (0, globals_1.it)('should prevent self-referral', async () => {
            const result = await (0, affiliate_tracking_1.processAffiliateConversion)('GENIE1234TEST', {
                orderId: mockOrderId,
                orderValue: 100.00,
                userId: mockUserId, // Same user as affiliate
                ipAddress: '192.168.1.1'
            });
            (0, globals_1.expect)(result.success).toBe(false);
            (0, globals_1.expect)(result.message).toBe('Self-referral not allowed');
        });
        (0, globals_1.it)('should prevent duplicate conversions for same order', async () => {
            const conversionData = {
                orderId: mockOrderId,
                orderValue: 100.00,
                userId: 'different-user-id',
                ipAddress: '192.168.1.1'
            };
            // First conversion should succeed
            const result1 = await (0, affiliate_tracking_1.processAffiliateConversion)('GENIE1234TEST', conversionData);
            (0, globals_1.expect)(result1.success).toBe(true);
            // Second conversion for same order should fail
            const result2 = await (0, affiliate_tracking_1.processAffiliateConversion)('GENIE1234TEST', conversionData);
            (0, globals_1.expect)(result2.success).toBe(false);
            (0, globals_1.expect)(result2.message).toBe('Conversion already tracked for this order');
        });
    });
    (0, globals_1.describe)('getAffiliateAnalytics', () => {
        (0, globals_1.beforeEach)(async () => {
            // Create test user and affiliate
            await prisma_1.prisma.user.create({
                data: {
                    id: mockUserId,
                    email: 'test@example.com',
                    passwordHash: 'hashed-password'
                }
            });
            await prisma_1.prisma.affiliate.create({
                data: {
                    id: mockAffiliateId,
                    userId: mockUserId,
                    referralCode: 'GENIE1234TEST',
                    status: 'active'
                }
            });
            // Create test clicks and conversions
            await prisma_1.prisma.affiliateClick.createMany({
                data: [
                    { affiliateId: mockAffiliateId, ipAddress: '192.168.1.1', userAgent: 'Test Browser 1' },
                    { affiliateId: mockAffiliateId, ipAddress: '192.168.1.2', userAgent: 'Test Browser 2' },
                    { affiliateId: mockAffiliateId, ipAddress: '192.168.1.3', userAgent: 'Test Browser 3' }
                ]
            });
            await prisma_1.prisma.affiliateConversion.create({
                data: {
                    affiliateId: mockAffiliateId,
                    orderId: mockOrderId,
                    orderValue: 100.00,
                    commissionRate: 0.10,
                    commissionAmount: 10.00,
                    status: 'pending',
                    ipAddress: '192.168.1.1'
                }
            });
        });
        (0, globals_1.it)('should return correct analytics', async () => {
            const analytics = await (0, affiliate_tracking_1.getAffiliateAnalytics)(mockAffiliateId);
            (0, globals_1.expect)(analytics).not.toBeNull();
            (0, globals_1.expect)(analytics.clicks).toBe(3);
            (0, globals_1.expect)(analytics.conversions).toBe(1);
            (0, globals_1.expect)(analytics.earnings).toBe(10.00);
            (0, globals_1.expect)(analytics.conversionRate).toBe(33.33); // 1/3 * 100
        });
        (0, globals_1.it)('should return null on error', async () => {
            const analytics = await (0, affiliate_tracking_1.getAffiliateAnalytics)('non-existent-id');
            (0, globals_1.expect)(analytics).toBeNull();
        });
    });
});
