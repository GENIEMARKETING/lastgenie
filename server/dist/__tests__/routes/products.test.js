"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const supertest_1 = __importDefault(require("supertest"));
const app_1 = __importDefault(require("../../app"));
describe('Products API', () => {
    describe('GET /api/products', () => {
        it('should return all products', async () => {
            const response = await (0, supertest_1.default)(app_1.default)
                .get('/api/products')
                .expect(200);
            expect(response.body.success).toBe(true);
            expect(response.body.data).toBeInstanceOf(Array);
            expect(response.body.data.length).toBeGreaterThan(0);
            // Check that we have the expected SKUs
            const skus = response.body.data.map((p) => p.sku);
            expect(skus).toContain('genie-for-him');
            expect(skus).toContain('genie-for-her');
        });
    });
    describe('GET /api/products/:slug', () => {
        it('should return products for valid slug', async () => {
            const response = await (0, supertest_1.default)(app_1.default)
                .get('/api/products/genie-for-him')
                .expect(200);
            expect(response.body.success).toBe(true);
            expect(response.body.data).toBeInstanceOf(Array);
            expect(response.body.data.length).toBeGreaterThan(0);
            // All products should have the same slug
            response.body.data.forEach((product) => {
                expect(product.slug).toBe('genie-for-him');
            });
        });
        it('should return 404 for invalid slug', async () => {
            const response = await (0, supertest_1.default)(app_1.default)
                .get('/api/products/nonexistent-product')
                .expect(404);
            expect(response.body.success).toBe(false);
            expect(response.body.error).toBe('Product not found');
        });
    });
    describe('GET /api/products/:id/reviews', () => {
        it('should return reviews for a product', async () => {
            const response = await (0, supertest_1.default)(app_1.default)
                .get('/api/products/genie-for-him/reviews')
                .expect(200);
            expect(response.body.success).toBe(true);
            expect(response.body.data).toBeInstanceOf(Array);
            // Check review structure
            if (response.body.data.length > 0) {
                const review = response.body.data[0];
                expect(review).toHaveProperty('id');
                expect(review).toHaveProperty('rating');
                expect(review).toHaveProperty('userName');
                expect(review).toHaveProperty('body');
                expect(review).toHaveProperty('isVerifiedPurchase');
            }
        });
    });
});
