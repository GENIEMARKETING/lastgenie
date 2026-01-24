# Address Validation Service Setup Guide

This guide will help you configure the address validation service to get **real verified addresses** instead of synthetic suggestions.

## Overview

The system uses two address validation services:
1. **USPS Address Validation API** (Primary - Free) - Recommended
2. **Shippo API** (Fallback) - Already configured

## Step 1: Get USPS API Credentials

### 1.1 Sign Up for USPS Developer Account

1. Go to https://developers.usps.com/
2. Click "Sign Up" or "Get Started"
3. Create an account with your email

### 1.2 Register a New Application

1. After logging in, navigate to "My Applications" or "Applications"
2. Click "Create New Application" or "Register Application"
3. Fill in the application details:
   - **Application Name**: LastGenie Address Validation (or your preferred name)
   - **Description**: Address validation for ecommerce shipping
   - **API**: Select "Address API" or "Address Validation API"
4. Submit the application

### 1.3 Get Your Credentials

After your application is approved (usually instant for testing):
1. Go to your application dashboard
2. Find your **Client ID** and **Client Secret**
3. Copy both values (you'll need them in the next step)

**Note**: Keep these credentials secure and never commit them to git!

## Step 2: Configure Environment Variables

### 2.1 Locate Your .env File

The `.env` file is located at: `server/.env`

If it doesn't exist, copy from the example:
```bash
cd server
cp env.example .env
```

### 2.2 Add USPS Credentials

Open `server/.env` in a text editor and add/update these variables:

```bash
# ============================================
# ADDRESS VALIDATION (USPS)
# ============================================
USPS_CLIENT_ID="your_actual_client_id_from_usps"
USPS_CLIENT_SECRET="your_actual_client_secret_from_usps"
USPS_BASE_URL="https://apis-tem.usps.com"  # Testing endpoint
```

**Important**:
- Replace `your_actual_client_id_from_usps` with your actual Client ID
- Replace `your_actual_client_secret_from_usps` with your actual Client Secret
- Keep the quotes around the values
- Use `https://apis-tem.usps.com` for testing/development
- Use `https://apis.usps.com` for production

### 2.3 Verify Shippo Configuration

Check that `SHIPPO_API_TOKEN` is set in your `.env` file:

```bash
SHIPPO_API_TOKEN="shippo_test_..."  # Should start with shippo_test_ or shippo_live_
```

If it's set to `mock_token` or empty, you'll need to:
1. Go to https://apps.goshippo.com/api/
2. Sign in or create an account
3. Get your API token from the dashboard
4. Update the `.env` file

## Step 3: Restart Your Server

After updating the `.env` file, restart your development server:

```bash
# Stop the current server (Ctrl+C)
# Then restart it
pnpm dev
# or
npm run dev
```

The server needs to restart to load the new environment variables.

## Step 4: Test the Configuration

### 4.1 Test Address Validation

1. Go to your cart page: http://localhost:3000/cart
2. Enter an address in the "Get Shipping Estimate" form:
   - **Street Address**: `12720 university club dr`
   - **City**: `Tampa`
   - **State**: `FL`
   - **ZIP Code**: `33613`
   - **Address Type**: Select "Apartment" or "Condo"
3. Click "Get Shipping Estimate" or submit the form

### 4.2 Verify Real Address Suggestions

**Success indicators**:
- ✅ You should see real address suggestions (not synthetic patterns like "Apt 1", "Apt 2")
- ✅ The suggestions should be validated addresses from USPS
- ✅ If multiple addresses exist, you'll see actual unit numbers from USPS database
- ✅ No "Address validation service unavailable" warning

**If you still see synthetic suggestions**:
- Check that USPS credentials are correctly set in `.env`
- Verify there are no typos in the environment variable names
- Make sure the server was restarted after updating `.env`
- Check server logs for any USPS API errors

## Troubleshooting

### Issue: "Address validation service unavailable"

**Possible causes**:
1. USPS credentials not set in `.env`
2. Invalid credentials (typo or wrong values)
3. Server not restarted after updating `.env`
4. USPS API endpoint incorrect

**Solutions**:
- Double-check `USPS_CLIENT_ID` and `USPS_CLIENT_SECRET` in `.env`
- Verify `USPS_BASE_URL` is set to `https://apis-tem.usps.com` for testing
- Restart the server
- Check server console logs for specific error messages

### Issue: "Failed to obtain USPS access token"

**Possible causes**:
1. Invalid Client ID or Client Secret
2. USPS application not approved
3. Wrong API endpoint URL

**Solutions**:
- Verify credentials are correct (no extra spaces, correct format)
- Check USPS developer dashboard to ensure application is active
- Confirm you're using the testing endpoint (`apis-tem.usps.com`) for development

### Issue: Still seeing synthetic suggestions

**Possible causes**:
1. USPS API is working but returning correction codes that trigger synthetic suggestions
2. Both USPS and Shippo are failing

**Solutions**:
- Check server logs to see which service is being used
- Test with a known valid address to verify USPS is working
- Synthetic suggestions only appear when both services fail

## Production Setup

When deploying to production:

1. **Update USPS Base URL**:
   ```bash
   USPS_BASE_URL="https://apis.usps.com"  # Production endpoint
   ```

2. **Use Production Shippo Token**:
   ```bash
   SHIPPO_API_TOKEN="shippo_live_..."  # Production token
   ```

3. **Set Environment Variables**:
   - Add credentials to your hosting platform's environment variable settings
   - Never commit `.env` file to git
   - Use secure secret management (AWS Secrets Manager, etc.)

## How It Works

1. **USPS is tried first** (free, official USPS data)
   - Validates address against USPS database
   - Returns correction codes:
     - Code 31: Exact match (address is valid)
     - Code 32: Needs unit number
     - Code 22: Multiple addresses found
   - Generates real address suggestions based on USPS response

2. **Shippo falls back** if USPS unavailable
   - Uses Shippo's validation API
   - Returns validated addresses and suggestions

3. **Synthetic suggestions** only appear if both services fail
   - Generated unit number patterns (Apt 1, Unit A, etc.)
   - Based on address type and suspicious unit numbers

## Additional Resources

- USPS Developer Portal: https://developers.usps.com/
- USPS API Documentation: https://developers.usps.com/apis
- Shippo API Documentation: https://docs.goshippo.com/

## Support

If you encounter issues:
1. Check server console logs for error messages
2. Verify environment variables are set correctly
3. Test with a simple known address first
4. Ensure both services are properly configured for redundancy
