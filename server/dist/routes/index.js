"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.apiRouter = void 0;
const express_1 = __importDefault(require("express"));
// Import all route modules
const products_1 = __importDefault(require("./products"));
const auth_1 = __importDefault(require("./auth"));
const checkout_1 = __importDefault(require("./checkout"));
const shipping_1 = __importDefault(require("./shipping"));
const age_verification_1 = __importDefault(require("./age-verification"));
const webhooks_1 = __importDefault(require("./webhooks"));
const testimonials_1 = __importDefault(require("./testimonials"));
const contact_1 = __importDefault(require("./contact"));
const cart_1 = __importDefault(require("./cart"));
const orders_1 = __importDefault(require("./orders"));
const subscriptions_1 = __importDefault(require("./subscriptions"));
const affiliate_1 = __importDefault(require("./affiliate"));
const affiliates_1 = __importDefault(require("./admin/affiliates"));
const users_1 = __importDefault(require("./admin/users"));
const inventory_1 = __importDefault(require("./admin/inventory"));
const products_2 = __importDefault(require("./admin/products"));
const orders_2 = __importDefault(require("./admin/orders"));
const events_1 = __importDefault(require("./admin/events"));
const dashboard_1 = __importDefault(require("./admin/dashboard"));
const analytics_1 = __importDefault(require("./admin/analytics"));
const audit_logs_1 = __importDefault(require("./admin/audit-logs"));
const stock_1 = __importDefault(require("./stock"));
const blog_1 = __importDefault(require("./blog"));
const addresses_1 = __importDefault(require("./addresses"));
const apiRouter = express_1.default.Router();
exports.apiRouter = apiRouter;
// Mount all routes
apiRouter.use('/products', products_1.default);
apiRouter.use('/auth', auth_1.default);
apiRouter.use('/checkout', checkout_1.default);
apiRouter.use('/shipping', shipping_1.default);
apiRouter.use('/age-verification', age_verification_1.default);
apiRouter.use('/webhooks', webhooks_1.default);
apiRouter.use('/testimonials', testimonials_1.default);
apiRouter.use('/contact', contact_1.default);
apiRouter.use('/cart', cart_1.default);
apiRouter.use('/orders', orders_1.default);
apiRouter.use('/subscriptions', subscriptions_1.default);
apiRouter.use('/affiliate', affiliate_1.default);
apiRouter.use('/admin/affiliates', affiliates_1.default);
apiRouter.use('/admin/users', users_1.default);
apiRouter.use('/admin/inventory', inventory_1.default);
apiRouter.use('/admin/products', products_2.default);
apiRouter.use('/admin/orders', orders_2.default);
apiRouter.use('/admin/events', events_1.default);
apiRouter.use('/admin/dashboard', dashboard_1.default);
apiRouter.use('/admin/analytics', analytics_1.default);
apiRouter.use('/admin/audit-logs', audit_logs_1.default);
apiRouter.use('/stock', stock_1.default);
apiRouter.use('/blog', blog_1.default);
apiRouter.use('/addresses', addresses_1.default);
// Root API endpoint
apiRouter.get('/', (req, res) => {
    res.json({
        message: 'LastGenie API Server',
        version: '1.0.0',
        endpoints: [
            '/api/products',
            '/api/auth',
            '/api/checkout',
            '/api/shipping',
            '/api/age-verification',
            '/api/webhooks',
            '/api/testimonials',
            '/api/contact',
            '/api/cart',
            '/api/orders',
            '/api/subscriptions',
            '/api/affiliate',
            '/api/admin/affiliates',
            '/api/admin/users',
            '/api/admin/inventory',
            '/api/admin/products',
            '/api/admin/orders',
            '/api/admin/events',
            '/api/admin/dashboard',
            '/api/admin/analytics',
            '/api/admin/audit-logs',
            '/api/stock',
            '/api/blog',
            '/api/addresses'
        ]
    });
});
