# Genie Affiliate System

A comprehensive affiliate marketing system for the Genie ecommerce platform, featuring automated tracking, fraud detection, and Stripe Connect payouts.

## Features

### Core Functionality
- **Affiliate Applications**: Users can apply to become affiliates through a structured application process
- **Admin Review System**: Comprehensive admin panel for reviewing and managing affiliate applications
- **Referral Tracking**: Automatic tracking of clicks and conversions with fraud detection
- **Commission Management**: Flexible commission rates configurable per affiliate
- **Automated Payouts**: Integration with Stripe Connect for automated commission payouts
- **Real-time Analytics**: Detailed performance tracking and reporting

### Security Features
- **Rate Limiting**: Multiple rate limiting strategies to prevent abuse
- **Fraud Detection**: Advanced fraud detection including duplicate click prevention, suspicious user agent detection, and self-referral blocking
- **Input Validation**: Comprehensive input sanitization and validation
- **Security Headers**: Helmet.js integration for security headers
- **Audit Logging**: Detailed logging of all affiliate activities

## Architecture

### Database Models

#### AffiliateApplication
- Tracks user applications to become affiliates
- Includes application details, admin review status, and notes
- Status: pending, approved, rejected, suspended

#### Affiliate
- Core affiliate record with referral code and performance metrics
- Configurable commission rates and payout thresholds
- Stripe Connect integration for automated payouts

#### AffiliateClick
- Tracks individual clicks on affiliate links
- Includes fraud detection data (IP, user agent, referer)
- Used for analytics and fraud prevention

#### AffiliateConversion
- Records successful conversions from affiliate referrals
- Links to orders and calculates commission amounts
- Prevents duplicate conversions and self-referrals

#### AffiliatePayout
- Tracks payout history and status
- Integration with Stripe Connect for payment processing
- Handles failed payouts and retry logic

### API Endpoints

#### User Endpoints (`/api/affiliate/`)
- `POST /apply` - Submit affiliate application
- `GET /status` - Get current affiliate status
- `GET /dashboard` - Get affiliate performance data
- `GET /links` - Get affiliate referral links
- `POST /track-click` - Track affiliate clicks (public endpoint)

#### Admin Endpoints (`/api/admin/affiliates/`)
- `GET /applications` - List affiliate applications with filtering
- `POST /applications/:id/review` - Approve/reject applications
- `GET /` - List all affiliates with search and filtering
- `PUT /:id` - Update affiliate settings
- `GET /analytics` - Get program-wide analytics
- `POST /bulk-actions` - Perform bulk operations

### Frontend Components

#### User Interface
- **Affiliate Application Form**: Multi-step application with validation
- **Affiliate Dashboard**: Performance metrics, earnings, and referral links
- **Account Integration**: Seamless integration with existing user account system

#### Admin Interface
- **Application Review**: Comprehensive review interface with approval workflow
- **Affiliate Management**: Search, filter, and manage affiliate accounts
- **Analytics Dashboard**: Real-time program performance metrics
- **Bulk Operations**: Efficient management of multiple affiliates

## Security Measures

### Fraud Detection
1. **Click Fraud Prevention**
   - Duplicate click detection (same IP within 1 hour)
   - Excessive click monitoring (max 10 clicks per IP per day)
   - Suspicious user agent detection
   - Rate limiting on click tracking endpoints

2. **Conversion Fraud Prevention**
   - Self-referral blocking (affiliates can't earn from own purchases)
   - Duplicate conversion prevention (one conversion per order)
   - IP address validation and tracking

3. **Application Fraud Prevention**
   - Rate limiting on application submissions
   - Input validation and sanitization
   - Admin review process for all applications

### Rate Limiting
- **General API**: 100 requests per 15 minutes per IP
- **Authentication**: 5 attempts per 15 minutes per IP
- **Affiliate Clicks**: 10 requests per minute per IP
- **Applications**: 3 attempts per 24 hours per IP
- **Admin Operations**: 60 requests per minute per user

### Input Validation
- Comprehensive Zod schema validation
- XSS prevention with input sanitization
- SQL injection prevention
- Referral code format validation
- Email format validation

## Configuration

### Environment Variables
```bash
# Stripe Connect Configuration
STRIPE_CONNECT_CLIENT_ID=your_stripe_connect_id

# Affiliate System Settings
AFFILIATE_COOKIE_DURATION=30
AFFILIATE_MIN_PAYOUT=50
AFFILIATE_DEFAULT_COMMISSION=0.10

# Security Settings
NODE_ENV=production
API_URL=https://api.yourdomain.com
CLIENT_URL=https://yourdomain.com
```

### Affiliate System Configuration
- **Cookie Duration**: 30 days (configurable)
- **Minimum Payout**: $50 (configurable)
- **Default Commission**: 10% (configurable per affiliate)
- **Referral Code Format**: GENIE{USERID}{RANDOM} (e.g., GENIE1234ABCD)

## Usage

### For Users
1. **Becoming an Affiliate**
   - Navigate to Account → Affiliate
   - Complete the application form
   - Wait for admin approval (3-5 business days)

2. **Using Affiliate Links**
   - Access referral links from the affiliate dashboard
   - Share links on social media, blogs, or other channels
   - Track performance in real-time

3. **Getting Paid**
   - Set up Stripe Connect account when approved
   - Automatic payouts when earnings exceed threshold
   - View payout history in dashboard

### For Admins
1. **Reviewing Applications**
   - Access Admin Panel → Affiliates → Applications
   - Review application details and user history
   - Approve or reject with optional notes
   - Set custom commission rates

2. **Managing Affiliates**
   - Search and filter affiliate accounts
   - Update commission rates and settings
   - Suspend or reactivate accounts
   - Process bulk operations

3. **Monitoring Performance**
   - View program-wide analytics
   - Monitor for fraudulent activity
   - Track top performers
   - Generate reports

## Testing

### Running Tests
```bash
# Run all tests
npm test

# Run affiliate-specific tests
npm test -- --testPathPattern=affiliate

# Run with coverage
npm test -- --coverage
```

### Test Coverage
- Unit tests for affiliate tracking service
- Integration tests for API endpoints
- Fraud detection testing
- Security middleware testing

## Deployment

### Database Migration
```bash
# Generate and run Prisma migrations
npx prisma migrate dev --name affiliate-system
npx prisma generate
```

### Production Checklist
- [ ] Configure Stripe Connect webhook endpoints
- [ ] Set up proper CORS policies
- [ ] Configure rate limiting for production traffic
- [ ] Set up monitoring and alerting
- [ ] Configure backup and disaster recovery
- [ ] Test fraud detection systems
- [ ] Verify payout automation

## Monitoring and Maintenance

### Key Metrics to Monitor
- Application approval rate
- Click-to-conversion ratio
- Average commission per conversion
- Fraud detection accuracy
- Payout success rate
- System performance and uptime

### Regular Maintenance Tasks
- Review and approve pending applications
- Monitor for fraudulent activity
- Process failed payouts
- Update commission rates as needed
- Review and update fraud detection rules
- Backup affiliate data

## Support and Troubleshooting

### Common Issues
1. **Referral Links Not Working**
   - Check referral code format
   - Verify affiliate status is active
   - Check for JavaScript errors in tracking

2. **Conversions Not Tracking**
   - Verify checkout integration
   - Check webhook configuration
   - Review fraud detection logs

3. **Payouts Failing**
   - Verify Stripe Connect setup
   - Check account verification status
   - Review payout thresholds

### Getting Help
- Check the application logs for detailed error messages
- Review the fraud detection logs for blocked activities
- Contact system administrators for account-specific issues

## Future Enhancements

### Planned Features
- Multi-tier commission structures
- Affiliate recruitment bonuses
- Advanced analytics and reporting
- Mobile app integration
- Social media integration
- Automated marketing materials

### API Improvements
- GraphQL API support
- Webhook notifications for affiliates
- Real-time analytics via WebSockets
- Advanced filtering and search capabilities

---

## License

This affiliate system is proprietary software developed for the Genie ecommerce platform. All rights reserved.