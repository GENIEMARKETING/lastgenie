# LastGenie Server

Express backend server for the LastGenie ecommerce platform.

## Quick Start

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Set up environment variables:**
   ```bash
   cp env.example .env
   # Edit .env with your configuration
   ```

3. **Set up database:**
   ```bash
   npm run db:migrate
   npm run db:seed
   ```

4. **Start development server:**
   ```bash
   npm run dev
   ```

## Address Validation Setup

To enable real address validation (instead of synthetic suggestions):

1. **Verify current configuration:**
   ```bash
   npm run verify:address-validation
   ```

2. **Follow the setup guide:**
   - See `docs/ADDRESS_VALIDATION_SETUP.md` for detailed instructions
   - Get USPS credentials from https://developers.usps.com/
   - Add credentials to `.env` file

3. **Test address validation:**
   ```bash
   # Make sure server is running first
   npm run dev
   
   # In another terminal
   npm run test:address-validation
   ```

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
- `npm run test` - Run tests
- `npm run verify:address-validation` - Check address validation configuration
- `npm run test:address-validation` - Test address validation service

## Environment Variables

See `env.example` for all available environment variables.

Key variables for address validation:
- `USPS_CLIENT_ID` - USPS API Client ID
- `USPS_CLIENT_SECRET` - USPS API Client Secret
- `USPS_BASE_URL` - USPS API endpoint (testing or production)
- `SHIPPO_API_TOKEN` - Shippo API token (fallback)

## Documentation

- **Address Validation Setup**: `docs/ADDRESS_VALIDATION_SETUP.md`
- **API Documentation**: See `docs/` directory
