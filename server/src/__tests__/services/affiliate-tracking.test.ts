import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { 
  generateReferralCode, 
  validateReferralCode, 
  trackAffiliateClick,
  processAffiliateConversion,
  getAffiliateAnalytics
} from '../../services/affiliate-tracking';
import { prisma } from '../../lib/prisma';

// Mock data
const mockUserId = 'test-user-123';
const mockAffiliateId = 'test-affiliate-123';
const mockOrderId = 'test-order-123';

describe('Affiliate Tracking Service', () => {
  beforeEach(async () => {
    // Clean up test data before each test
    await prisma.affiliateConversion.deleteMany({
      where: { orderId: { startsWith: 'test-' } }
    });
    await prisma.affiliateClick.deleteMany({
      where: { affiliateId: { startsWith: 'test-' } }
    });
    await prisma.affiliate.deleteMany({
      where: { id: { startsWith: 'test-' } }
    });
    await prisma.user.deleteMany({
      where: { id: { startsWith: 'test-' } }
    });
  });

  afterEach(async () => {
    // Clean up test data after each test
    await prisma.affiliateConversion.deleteMany({
      where: { orderId: { startsWith: 'test-' } }
    });
    await prisma.affiliateClick.deleteMany({
      where: { affiliateId: { startsWith: 'test-' } }
    });
    await prisma.affiliate.deleteMany({
      where: { id: { startsWith: 'test-' } }
    });
    await prisma.user.deleteMany({
      where: { id: { startsWith: 'test-' } }
    });
  });

  describe('generateReferralCode', () => {
    it('should generate a valid referral code', async () => {
      const code = await generateReferralCode(mockUserId);
      expect(code).toMatch(/^GENIE[A-Z0-9]{8}$/);
      expect(code).toHaveLength(13);
    });

    it('should generate unique referral codes', async () => {
      const code1 = await generateReferralCode(mockUserId);
      const code2 = await generateReferralCode('different-user-id');
      expect(code1).not.toBe(code2);
    });
  });

  describe('validateReferralCode', () => {
    it('should validate correct referral code format', () => {
      expect(validateReferralCode('GENIE1234ABCD')).toBe(true);
      expect(validateReferralCode('GENIE123ABC12')).toBe(true);
    });

    it('should reject invalid referral code formats', () => {
      expect(validateReferralCode('INVALID123')).toBe(false);
      expect(validateReferralCode('GENIE123')).toBe(false);
      expect(validateReferralCode('genie1234abcd')).toBe(false);
      expect(validateReferralCode('GENIE1234ABCDE')).toBe(false);
      expect(validateReferralCode('')).toBe(false);
    });
  });

  describe('trackAffiliateClick', () => {
    beforeEach(async () => {
      // Create test user and affiliate
      await prisma.user.create({
        data: {
          id: mockUserId,
          email: 'test@example.com',
          passwordHash: 'hashed-password'
        }
      });

      await prisma.affiliate.create({
        data: {
          id: mockAffiliateId,
          userId: mockUserId,
          referralCode: 'GENIE1234TEST',
          status: 'active'
        }
      });
    });

    it('should successfully track a valid click', async () => {
      const result = await trackAffiliateClick('GENIE1234TEST', {
        ipAddress: '192.168.1.1',
        userAgent: 'Mozilla/5.0 Test Browser',
        referer: 'https://example.com'
      });

      expect(result.success).toBe(true);
      expect(result.message).toBe('Click tracked successfully');
      expect(result.cookieDuration).toBe(30);

      // Verify click was recorded
      const clicks = await prisma.affiliateClick.findMany({
        where: { affiliateId: mockAffiliateId }
      });
      expect(clicks).toHaveLength(1);
      expect(clicks[0].ipAddress).toBe('192.168.1.1');
    });

    it('should reject invalid referral code', async () => {
      const result = await trackAffiliateClick('INVALID123', {
        ipAddress: '192.168.1.1',
        userAgent: 'Mozilla/5.0 Test Browser'
      });

      expect(result.success).toBe(false);
      expect(result.message).toBe('Invalid referral code format');
    });

    it('should prevent duplicate clicks from same IP within 1 hour', async () => {
      const context = {
        ipAddress: '192.168.1.1',
        userAgent: 'Mozilla/5.0 Test Browser'
      };

      // First click should succeed
      const result1 = await trackAffiliateClick('GENIE1234TEST', context);
      expect(result1.success).toBe(true);

      // Second click from same IP should be rejected
      const result2 = await trackAffiliateClick('GENIE1234TEST', context);
      expect(result2.success).toBe(false);
      expect(result2.message).toBe('Duplicate click from same IP within 1 hour');
    });

    it('should reject suspicious user agents', async () => {
      const result = await trackAffiliateClick('GENIE1234TEST', {
        ipAddress: '192.168.1.1',
        userAgent: 'python-requests/2.28.1'
      });

      expect(result.success).toBe(false);
      expect(result.message).toBe('Suspicious user agent detected');
    });
  });

  describe('processAffiliateConversion', () => {
    beforeEach(async () => {
      // Create test user and affiliate
      await prisma.user.create({
        data: {
          id: mockUserId,
          email: 'test@example.com',
          passwordHash: 'hashed-password'
        }
      });

      await prisma.affiliate.create({
        data: {
          id: mockAffiliateId,
          userId: mockUserId,
          referralCode: 'GENIE1234TEST',
          status: 'active',
          commissionRate: 0.10
        }
      });
    });

    it('should successfully process a valid conversion', async () => {
      const result = await processAffiliateConversion('GENIE1234TEST', {
        orderId: mockOrderId,
        orderValue: 100.00,
        userId: 'different-user-id',
        ipAddress: '192.168.1.1'
      });

      expect(result.success).toBe(true);
      expect(result.message).toBe('Conversion tracked successfully');
      expect(result.commissionAmount).toBe(10.00);

      // Verify conversion was recorded
      const conversions = await prisma.affiliateConversion.findMany({
        where: { affiliateId: mockAffiliateId }
      });
      expect(conversions).toHaveLength(1);
      expect(conversions[0].orderValue).toBe(100.00);
      expect(conversions[0].commissionAmount).toBe(10.00);
    });

    it('should prevent self-referral', async () => {
      const result = await processAffiliateConversion('GENIE1234TEST', {
        orderId: mockOrderId,
        orderValue: 100.00,
        userId: mockUserId, // Same user as affiliate
        ipAddress: '192.168.1.1'
      });

      expect(result.success).toBe(false);
      expect(result.message).toBe('Self-referral not allowed');
    });

    it('should prevent duplicate conversions for same order', async () => {
      const conversionData = {
        orderId: mockOrderId,
        orderValue: 100.00,
        userId: 'different-user-id',
        ipAddress: '192.168.1.1'
      };

      // First conversion should succeed
      const result1 = await processAffiliateConversion('GENIE1234TEST', conversionData);
      expect(result1.success).toBe(true);

      // Second conversion for same order should fail
      const result2 = await processAffiliateConversion('GENIE1234TEST', conversionData);
      expect(result2.success).toBe(false);
      expect(result2.message).toBe('Conversion already tracked for this order');
    });
  });

  describe('getAffiliateAnalytics', () => {
    beforeEach(async () => {
      // Create test user and affiliate
      await prisma.user.create({
        data: {
          id: mockUserId,
          email: 'test@example.com',
          passwordHash: 'hashed-password'
        }
      });

      await prisma.affiliate.create({
        data: {
          id: mockAffiliateId,
          userId: mockUserId,
          referralCode: 'GENIE1234TEST',
          status: 'active'
        }
      });

      // Create test clicks and conversions
      await prisma.affiliateClick.createMany({
        data: [
          { affiliateId: mockAffiliateId, ipAddress: '192.168.1.1', userAgent: 'Test Browser 1' },
          { affiliateId: mockAffiliateId, ipAddress: '192.168.1.2', userAgent: 'Test Browser 2' },
          { affiliateId: mockAffiliateId, ipAddress: '192.168.1.3', userAgent: 'Test Browser 3' }
        ]
      });

      await prisma.affiliateConversion.create({
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

    it('should return correct analytics', async () => {
      const analytics = await getAffiliateAnalytics(mockAffiliateId);

      expect(analytics).not.toBeNull();
      expect(analytics!.clicks).toBe(3);
      expect(analytics!.conversions).toBe(1);
      expect(analytics!.earnings).toBe(10.00);
      expect(analytics!.conversionRate).toBe(33.33); // 1/3 * 100
    });

    it('should return null on error', async () => {
      const analytics = await getAffiliateAnalytics('non-existent-id');
      expect(analytics).toBeNull();
    });
  });
});