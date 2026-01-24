import express from 'express';

// Import all route modules
import productsRouter from './products';
import authRouter from './auth';
import checkoutRouter from './checkout';
import shippingRouter from './shipping';
import ageVerificationRouter from './age-verification';
import webhooksRouter from './webhooks';
import testimonialsRouter from './testimonials';
import contactRouter from './contact';
import cartRouter from './cart';
import ordersRouter from './orders';
import subscriptionsRouter from './subscriptions';
import affiliateRouter from './affiliate';
import adminAffiliatesRouter from './admin/affiliates';
import adminUsersRouter from './admin/users';
import adminInventoryRouter from './admin/inventory';
import adminProductsRouter from './admin/products';
import adminOrdersRouter from './admin/orders';
import adminEventsRouter from './admin/events';
import adminDashboardRouter from './admin/dashboard';
import adminAnalyticsRouter from './admin/analytics';
import adminAuditLogsRouter from './admin/audit-logs';
import stockRouter from './stock';
import blogRouter from './blog';
import addressesRouter from './addresses';
import reviewsRouter from './reviews';
import newsletterRouter from './newsletter';

const apiRouter = express.Router();

// Mount all routes
apiRouter.use('/products', productsRouter);
apiRouter.use('/auth', authRouter);
apiRouter.use('/checkout', checkoutRouter);
apiRouter.use('/shipping', shippingRouter);
apiRouter.use('/age-verification', ageVerificationRouter);
apiRouter.use('/webhooks', webhooksRouter);
apiRouter.use('/testimonials', testimonialsRouter);
apiRouter.use('/contact', contactRouter);
apiRouter.use('/cart', cartRouter);
apiRouter.use('/orders', ordersRouter);
apiRouter.use('/subscriptions', subscriptionsRouter);
apiRouter.use('/affiliate', affiliateRouter);
apiRouter.use('/admin/affiliates', adminAffiliatesRouter);
apiRouter.use('/admin/users', adminUsersRouter);
apiRouter.use('/admin/inventory', adminInventoryRouter);
apiRouter.use('/admin/products', adminProductsRouter);
apiRouter.use('/admin/orders', adminOrdersRouter);
apiRouter.use('/admin/events', adminEventsRouter);
apiRouter.use('/admin/dashboard', adminDashboardRouter);
apiRouter.use('/admin/analytics', adminAnalyticsRouter);
apiRouter.use('/admin/audit-logs', adminAuditLogsRouter);
apiRouter.use('/stock', stockRouter);
apiRouter.use('/blog', blogRouter);
apiRouter.use('/addresses', addressesRouter);
apiRouter.use('/reviews', reviewsRouter);
apiRouter.use('/newsletter', newsletterRouter);

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
      '/api/addresses',
      '/api/reviews',
      '/api/newsletter'
    ]
  });
});

export { apiRouter };