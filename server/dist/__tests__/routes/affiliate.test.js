"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const supertest_1 = __importDefault(require("supertest"));
const globals_1 = require("@jest/globals");
const express_1 = __importDefault(require("express"));
const affiliate_1 = __importDefault(require("../../routes/affiliate"));
const prisma_1 = require("../../lib/prisma");
const jwt_1 = require("../../lib/jwt");
// Create test app
const app = (0, express_1.default)();
app.use(express_1.default.json());
app.use('/api/affiliate', affiliate_1.default);
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
    status: 'active',
    commissionRate: 0.10
};
(0, globals_1.describe)('Affiliate API Routes', () => {
    let authToken;
    (0, globals_1.beforeEach)(async () => {
        // Clean up test data
        await prisma_1.prisma.affiliateApplication.deleteMany({
            where: { userId: { startsWith: 'test-' } }
        });
        await prisma_1.prisma.affiliate.deleteMany({
            where: { id: { startsWith: 'test-' } }
        });
        await prisma_1.prisma.user.deleteMany({
            where: { id: { startsWith: 'test-' } }
        });
        // Create test user
        await prisma_1.prisma.user.create({ data: mockUser });
        // Generate auth token
        authToken = (0, jwt_1.generateAccessToken)({ sub: mockUser.id, email: mockUser.email });
    });
    (0, globals_1.afterEach)(async () => {
        // Clean up test data
        await prisma_1.prisma.affiliateApplication.deleteMany({
            where: { userId: { startsWith: 'test-' } }
        });
        await prisma_1.prisma.affiliate.deleteMany({
            where: { id: { startsWith: 'test-' } }
        });
        await prisma_1.prisma.user.deleteMany({
            where: { id: { startsWith: 'test-' } }
        });
    });
    (0, globals_1.describe)('POST /api/affiliate/apply', () => {
        (0, globals_1.it)('should successfully submit affiliate application', async () => {
            const applicationData = {
                reason: 'I want to promote Genie products because I believe in their quality',
                experience: 'I have 2 years of affiliate marketing experience',
                marketingChannels: 'Social media, blog posts, email marketing'
            };
            const response = await (0, supertest_1.default)(app)
                .post('/api/affiliate/apply')
                .set('Cookie', `accessToken=${authToken}`)
                .send(applicationData);
            (0, globals_1.expect)(response.status).toBe(201);
            (0, globals_1.expect)(response.body.success).toBe(true);
            (0, globals_1.expect)(response.body.message).toContain('submitted successfully');
            (0, globals_1.expect)(response.body.data.application.status).toBe('pending');
            // Verify application was created
            const application = await prisma_1.prisma.affiliateApplication.findUnique({
                where: { userId: mockUser.id }
            });
            (0, globals_1.expect)(application).not.toBeNull();
            (0, globals_1.expect)(application.reason).toBe(applicationData.reason);
        });
        (0, globals_1.it)('should reject duplicate applications', async () => {
            // Create existing application
            await prisma_1.prisma.affiliateApplication.create({
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
            const response = await (0, supertest_1.default)(app)
                .post('/api/affiliate/apply')
                .set('Cookie', `accessToken=${authToken}`)
                .send(applicationData);
            (0, globals_1.expect)(response.status).toBe(400);
            (0, globals_1.expect)(response.body.success).toBe(false);
            (0, globals_1.expect)(response.body.error).toContain('already submitted');
        });
        (0, globals_1.it)('should require authentication', async () => {
            const response = await (0, supertest_1.default)(app)
                .post('/api/affiliate/apply')
                .send({
                reason: 'Test reason',
                marketingChannels: 'Social media'
            });
            (0, globals_1.expect)(response.status).toBe(401);
            (0, globals_1.expect)(response.body.success).toBe(false);
        });
        (0, globals_1.it)('should validate required fields', async () => {
            const response = await (0, supertest_1.default)(app)
                .post('/api/affiliate/apply')
                .set('Cookie', `accessToken=${authToken}`)
                .send({
                reason: 'Short' // Too short
            });
            (0, globals_1.expect)(response.status).toBe(400);
            (0, globals_1.expect)(response.body.success).toBe(false);
            (0, globals_1.expect)(response.body.error).toBe('Validation failed');
        });
    });
    (0, globals_1.describe)('GET /api/affiliate/status', () => {
        (0, globals_1.it)('should return affiliate status for approved affiliate', async () => {
            // Create affiliate
            await prisma_1.prisma.affiliate.create({ data: mockAffiliate });
            const response = await (0, supertest_1.default)(app)
                .get('/api/affiliate/status')
                .set('Cookie', `accessToken=${authToken}`);
            (0, globals_1.expect)(response.status).toBe(200);
            (0, globals_1.expect)(response.body.success).toBe(true);
            (0, globals_1.expect)(response.body.data.isAffiliate).toBe(true);
            (0, globals_1.expect)(response.body.data.affiliate.referralCode).toBe(mockAffiliate.referralCode);
        });
        (0, globals_1.it)('should return application status for pending application', async () => {
            // Create pending application
            await prisma_1.prisma.affiliateApplication.create({
                data: {
                    userId: mockUser.id,
                    reason: 'Test reason',
                    marketingChannels: 'Social media',
                    status: 'pending'
                }
            });
            const response = await (0, supertest_1.default)(app)
                .get('/api/affiliate/status')
                .set('Cookie', `accessToken=${authToken}`);
            (0, globals_1.expect)(response.status).toBe(200);
            (0, globals_1.expect)(response.body.success).toBe(true);
            (0, globals_1.expect)(response.body.data.isAffiliate).toBe(false);
            (0, globals_1.expect)(response.body.data.application.status).toBe('pending');
        });
        (0, globals_1.it)('should return no status for new user', async () => {
            const response = await (0, supertest_1.default)(app)
                .get('/api/affiliate/status')
                .set('Cookie', `accessToken=${authToken}`);
            (0, globals_1.expect)(response.status).toBe(200);
            (0, globals_1.expect)(response.body.success).toBe(true);
            (0, globals_1.expect)(response.body.data.isAffiliate).toBe(false);
            (0, globals_1.expect)(response.body.data.application).toBeNull();
        });
    });
    (0, globals_1.describe)('GET /api/affiliate/links', () => {
        (0, globals_1.beforeEach)(async () => {
            // Create affiliate for link tests
            await prisma_1.prisma.affiliate.create({ data: mockAffiliate });
        });
        (0, globals_1.it)('should return affiliate links', async () => {
            const response = await (0, supertest_1.default)(app)
                .get('/api/affiliate/links')
                .set('Cookie', `accessToken=${authToken}`);
            (0, globals_1.expect)(response.status).toBe(200);
            (0, globals_1.expect)(response.body.success).toBe(true);
            (0, globals_1.expect)(response.body.data.referralCode).toBe(mockAffiliate.referralCode);
            (0, globals_1.expect)(response.body.data.links.homepage).toContain(`ref=${mockAffiliate.referralCode}`);
            (0, globals_1.expect)(response.body.data.links.shop).toContain(`ref=${mockAffiliate.referralCode}`);
        });
        (0, globals_1.it)('should return 404 for non-affiliate', async () => {
            // Remove affiliate
            await prisma_1.prisma.affiliate.delete({ where: { id: mockAffiliate.id } });
            const response = await (0, supertest_1.default)(app)
                .get('/api/affiliate/links')
                .set('Cookie', `accessToken=${authToken}`);
            (0, globals_1.expect)(response.status).toBe(404);
            (0, globals_1.expect)(response.body.success).toBe(false);
            (0, globals_1.expect)(response.body.error).toBe('Affiliate not found');
        });
    });
    (0, globals_1.describe)('POST /api/affiliate/track-click', () => {
        (0, globals_1.beforeEach)(async () => {
            // Create affiliate for tracking tests
            await prisma_1.prisma.affiliate.create({ data: mockAffiliate });
        });
        (0, globals_1.it)('should successfully track a click', async () => {
            const response = await (0, supertest_1.default)(app)
                .post('/api/affiliate/track-click')
                .send({
                referralCode: mockAffiliate.referralCode
            });
            (0, globals_1.expect)(response.status).toBe(200);
            (0, globals_1.expect)(response.body.success).toBe(true);
            (0, globals_1.expect)(response.body.message).toBe('Click tracked successfully');
            (0, globals_1.expect)(response.body.data.cookieDuration).toBe(30);
            // Verify click was recorded
            const clicks = await prisma_1.prisma.affiliateClick.findMany({
                where: { affiliateId: mockAffiliate.id }
            });
            (0, globals_1.expect)(clicks).toHaveLength(1);
        });
        (0, globals_1.it)('should reject invalid referral code', async () => {
            const response = await (0, supertest_1.default)(app)
                .post('/api/affiliate/track-click')
                .send({
                referralCode: 'INVALID123'
            });
            (0, globals_1.expect)(response.status).toBe(404);
            (0, globals_1.expect)(response.body.success).toBe(false);
            (0, globals_1.expect)(response.body.error).toBe('Invalid referral code');
        });
        (0, globals_1.it)('should require referral code', async () => {
            const response = await (0, supertest_1.default)(app)
                .post('/api/affiliate/track-click')
                .send({});
            (0, globals_1.expect)(response.status).toBe(400);
            (0, globals_1.expect)(response.body.success).toBe(false);
            (0, globals_1.expect)(response.body.error).toBe('Referral code is required');
        });
    });
});
