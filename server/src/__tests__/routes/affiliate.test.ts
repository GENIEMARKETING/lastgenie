import request from 'supertest';
import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import express from 'express';
import affiliateRouter from '../../routes/affiliate';
import { prisma } from '../../lib/prisma';
import { generateAccessToken } from '../../lib/jwt';

// Create test app
const app = express();
app.use(express.json());
app.use('/api/affiliate', affiliateRouter);

// Mock data
const mockUser = {
  id: 'test-user-123',
  email: 'test@example.com',
  passwordHash: 'hashed-password',
  firstName: 'Test',
  lastName: 'User'
};

const mockAffiliate = {
  id: 'test-affiliate-123',
  userId: mockUser.id,
  referralCode: 'GENIE1234TEST',
  status: 'active' as const,
  commissionRate: 0.10
};

describe('Affiliate API Routes', () => {
  let authToken: string;

  beforeEach(async () => {
    // Clean up test data
    await prisma.affiliateApplication.deleteMany({
      where: { userId: { startsWith: 'test-' } }
    });
    await prisma.affiliate.deleteMany({
      where: { id: { startsWith: 'test-' } }
    });
    await prisma.user.deleteMany({
      where: { id: { startsWith: 'test-' } }
    });

    // Create test user
    await prisma.user.create({ data: mockUser });

    // Generate auth token
    authToken = generateAccessToken({ sub: mockUser.id, email: mockUser.email });
  });

  afterEach(async () => {
    // Clean up test data
    await prisma.affiliateApplication.deleteMany({
      where: { userId: { startsWith: 'test-' } }
    });
    await prisma.affiliate.deleteMany({
      where: { id: { startsWith: 'test-' } }
    });
    await prisma.user.deleteMany({
      where: { id: { startsWith: 'test-' } }
    });
  });

  describe('POST /api/affiliate/apply', () => {
    it('should successfully submit affiliate application', async () => {
      const applicationData = {
        reason: 'I want to promote Genie products because I believe in their quality',
        experience: 'I have 2 years of affiliate marketing experience',
        marketingChannels: 'Social media, blog posts, email marketing'
      };

      const response = await request(app)
        .post('/api/affiliate/apply')
        .set('Cookie', `accessToken=${authToken}`)
        .send(applicationData);

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain('submitted successfully');
      expect(response.body.data.application.status).toBe('pending');

      // Verify application was created
      const application = await prisma.affiliateApplication.findUnique({
        where: { userId: mockUser.id }
      });
      expect(application).not.toBeNull();
      expect(application!.reason).toBe(applicationData.reason);
    });

    it('should reject duplicate applications', async () => {
      // Create existing application
      await prisma.affiliateApplication.create({
        data: {
          userId: mockUser.id,
          reason: 'Existing application',
          marketingChannels: 'Social media'
        }
      });

      const applicationData = {
        reason: 'Second application attempt',
        marketingChannels: 'Email marketing'
      };

      const response = await request(app)
        .post('/api/affiliate/apply')
        .set('Cookie', `accessToken=${authToken}`)
        .send(applicationData);

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('already submitted');
    });

    it('should require authentication', async () => {
      const response = await request(app)
        .post('/api/affiliate/apply')
        .send({
          reason: 'Test reason',
          marketingChannels: 'Social media'
        });

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });

    it('should validate required fields', async () => {
      const response = await request(app)
        .post('/api/affiliate/apply')
        .set('Cookie', `accessToken=${authToken}`)
        .send({
          reason: 'Short' // Too short
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Validation failed');
    });
  });

  describe('GET /api/affiliate/status', () => {
    it('should return affiliate status for approved affiliate', async () => {
      // Create affiliate
      await prisma.affiliate.create({ data: mockAffiliate });

      const response = await request(app)
        .get('/api/affiliate/status')
        .set('Cookie', `accessToken=${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.isAffiliate).toBe(true);
      expect(response.body.data.affiliate.referralCode).toBe(mockAffiliate.referralCode);
    });

    it('should return application status for pending application', async () => {
      // Create pending application
      await prisma.affiliateApplication.create({
        data: {
          userId: mockUser.id,
          reason: 'Test reason',
          marketingChannels: 'Social media',
          status: 'pending'
        }
      });

      const response = await request(app)
        .get('/api/affiliate/status')
        .set('Cookie', `accessToken=${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.isAffiliate).toBe(false);
      expect(response.body.data.application.status).toBe('pending');
    });

    it('should return no status for new user', async () => {
      const response = await request(app)
        .get('/api/affiliate/status')
        .set('Cookie', `accessToken=${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.isAffiliate).toBe(false);
      expect(response.body.data.application).toBeNull();
    });
  });

  describe('GET /api/affiliate/links', () => {
    beforeEach(async () => {
      // Create affiliate for link tests
      await prisma.affiliate.create({ data: mockAffiliate });
    });

    it('should return affiliate links', async () => {
      const response = await request(app)
        .get('/api/affiliate/links')
        .set('Cookie', `accessToken=${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.referralCode).toBe(mockAffiliate.referralCode);
      expect(response.body.data.links.homepage).toContain(`ref=${mockAffiliate.referralCode}`);
      expect(response.body.data.links.shop).toContain(`ref=${mockAffiliate.referralCode}`);
    });

    it('should return 404 for non-affiliate', async () => {
      // Remove affiliate
      await prisma.affiliate.delete({ where: { id: mockAffiliate.id } });

      const response = await request(app)
        .get('/api/affiliate/links')
        .set('Cookie', `accessToken=${authToken}`);

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Affiliate not found');
    });
  });

  describe('POST /api/affiliate/track-click', () => {
    beforeEach(async () => {
      // Create affiliate for tracking tests
      await prisma.affiliate.create({ data: mockAffiliate });
    });

    it('should successfully track a click', async () => {
      const response = await request(app)
        .post('/api/affiliate/track-click')
        .send({
          referralCode: mockAffiliate.referralCode
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Click tracked successfully');
      expect(response.body.data.cookieDuration).toBe(30);

      // Verify click was recorded
      const clicks = await prisma.affiliateClick.findMany({
        where: { affiliateId: mockAffiliate.id }
      });
      expect(clicks).toHaveLength(1);
    });

    it('should reject invalid referral code', async () => {
      const response = await request(app)
        .post('/api/affiliate/track-click')
        .send({
          referralCode: 'INVALID123'
        });

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Invalid referral code');
    });

    it('should require referral code', async () => {
      const response = await request(app)
        .post('/api/affiliate/track-click')
        .send({});

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Referral code is required');
    });
  });
});