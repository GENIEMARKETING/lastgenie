# Address Validation Diagnostic Guide

## Quick Diagnosis

If address validation shows "service not configured" even after adding credentials:

### Step 1: Verify Configuration

Run the verification script:
```bash
cd server
npm run verify:address-validation
```

This checks if credentials are in `.env` file.

### Step 2: Check Health Endpoint

After restarting the server, test the health check endpoint:
```bash
curl http://localhost:3001/api/shipping/validate-config
```

Or open in browser: http://localhost:3001/api/shipping/validate-config

Expected response:
```json
{
  "success": true,
  "data": {
    "usps": {
      "configured": true,
      "status": "operational",
      "message": "Successfully connected to USPS API"
    },
    "shippo": {
      "configured": true,
      "status": "configured"
    },
    "summary": {
      "allOperational": true,
      "primaryService": "USPS",
      "fallbackAvailable": true
    }
  }
}
```

### Step 3: Check Server Logs

When you test address validation, check the server console for diagnostic logs:

**Good logs (USPS working):**
```
[USPS] Service configured successfully: { clientIdPrefix: 'jHnd...', baseUrl: 'https://apis-tem.usps.com' }
[USPS] Starting address validation: { street1: '...', city: '...', state: '...', zip: '...' }
[USPS] Requesting new OAuth2 access token...
[USPS] OAuth2 token acquired successfully: { tokenPrefix: '...', expiresIn: 3600 }
[USPS] API response: { status: 200, statusText: 'OK', ok: true }
[USPS] Address validation successful: { hasAddress: true, ... }
```

**Bad logs (USPS not configured):**
```
[USPS] Service not configured: { hasClientId: false, hasClientSecret: false, ... }
[USPS] Cannot validate address - credentials not configured
```

**Bad logs (OAuth2 error):**
```
[USPS] OAuth2 token error: { status: 401, statusText: 'Unauthorized', error: {...} }
```

## Common Issues

### Issue: "Service not configured" after adding credentials

**Cause:** Server wasn't restarted after updating `.env`

**Solution:**
1. Stop the server (Ctrl+C)
2. Restart: `npm run dev` or `pnpm dev`
3. Test again

### Issue: OAuth2 token error (401 Unauthorized)

**Causes:**
- Invalid credentials (typo in Client ID or Secret)
- Credentials not approved in USPS portal
- Wrong API endpoint (should be `https://apis-tem.usps.com` for testing)

**Solution:**
1. Verify credentials in USPS developer portal
2. Check `.env` file for typos
3. Ensure `USPS_BASE_URL` is correct
4. Restart server

### Issue: USPS returns null but credentials are set

**Causes:**
- API endpoint error (404, 500, etc.)
- Network connectivity issue
- Address not found (404 is normal)

**Solution:**
1. Check server logs for specific error
2. Test with a known valid address (e.g., "1600 Pennsylvania Avenue NW, Washington, DC 20500")
3. Check network connectivity

## Testing Commands

### Test Configuration
```bash
npm run verify:address-validation
```

### Test Health Endpoint
```bash
curl http://localhost:3001/api/shipping/validate-config | jq
```

### Test Address Validation
```bash
npm run test:address-validation
```

## Server Log Patterns

### Successful USPS Validation
- `[USPS] Service configured successfully`
- `[USPS] OAuth2 token acquired successfully`
- `[USPS] Address validation successful`

### Configuration Issue
- `[USPS] Service not configured`
- `hasClientId: false` or `hasClientSecret: false`

### API Error
- `[USPS] OAuth2 token error`
- `[USPS] API error: { status: 401/403/500, ... }`

## Next Steps

If health check shows USPS is operational but frontend still shows "not configured":
1. Check browser console for errors
2. Verify frontend is calling correct endpoint
3. Check CORS settings
4. Verify server is running on correct port
