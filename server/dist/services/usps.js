"use strict";
/**
 * USPS Service - Address Validation
 *
 * This service handles USPS Address Validation API operations including:
 * - OAuth2 authentication
 * - Address validation and standardization
 * - Detecting multiple addresses and unit number requirements
 */
Object.defineProperty(exports, "__esModule", { value: true });
class USPSService {
    constructor() {
        this.accessToken = null;
        this.tokenExpiry = 0;
        this.clientId = process.env.USPS_CLIENT_ID || '';
        this.clientSecret = process.env.USPS_CLIENT_SECRET || '';
        this.baseUrl = process.env.USPS_BASE_URL || 'https://apis-tem.usps.com';
    }
    /**
     * Check if USPS service is properly configured
     */
    isConfigured() {
        const configured = !!(this.clientId && this.clientSecret);
        if (!configured) {
            console.warn('[USPS] Service not configured:', {
                hasClientId: !!this.clientId,
                hasClientSecret: !!this.clientSecret,
                clientIdLength: this.clientId?.length || 0,
                clientSecretLength: this.clientSecret?.length || 0,
            });
        }
        else {
            console.log('[USPS] Service configured successfully:', {
                clientIdPrefix: this.clientId.substring(0, 4) + '...',
                baseUrl: this.baseUrl,
            });
        }
        return configured;
    }
    /**
     * Get OAuth2 access token using client credentials flow
     */
    async getAccessToken() {
        // Check if token is still valid
        if (this.accessToken && Date.now() < this.tokenExpiry) {
            console.log('[USPS] Using cached access token');
            return this.accessToken;
        }
        console.log('[USPS] Requesting new OAuth2 access token...', {
            baseUrl: this.baseUrl,
            tokenEndpoint: `${this.baseUrl}/oauth2/v3/token`,
        });
        try {
            const response = await fetch(`${this.baseUrl}/oauth2/v3/token`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
                body: new URLSearchParams({
                    grant_type: 'client_credentials',
                    client_id: this.clientId,
                    client_secret: this.clientSecret,
                    scope: 'addresses',
                }),
            });
            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                console.error('[USPS] OAuth2 token error:', {
                    status: response.status,
                    statusText: response.statusText,
                    error: errorData,
                });
                throw new Error(`Failed to obtain USPS access token: ${response.status} ${response.statusText}`);
            }
            const data = await response.json();
            this.accessToken = data.access_token;
            // Set expiry 5 minutes before actual expiry for safety
            const expiresIn = data.expires_in || 3600; // Default to 1 hour if not provided
            this.tokenExpiry = Date.now() + (expiresIn - 300) * 1000;
            console.log('[USPS] OAuth2 token acquired successfully:', {
                tokenPrefix: this.accessToken.substring(0, 10) + '...',
                expiresIn: expiresIn,
                expiresAt: new Date(this.tokenExpiry).toISOString(),
            });
            return this.accessToken;
        }
        catch (error) {
            console.error('[USPS] OAuth2 token request failed:', {
                error: error.message,
                stack: error.stack,
            });
            throw error;
        }
    }
    /**
     * Validate and standardize an address using USPS API
     */
    async validateAddress(address) {
        console.log('[USPS] Starting address validation:', {
            street1: address.street1,
            street2: address.street2,
            city: address.city,
            state: address.state,
            zip: address.zip,
        });
        try {
            if (!this.isConfigured()) {
                console.warn('[USPS] Cannot validate address - credentials not configured');
                return null;
            }
            const token = await this.getAccessToken();
            const params = new URLSearchParams({
                streetAddress: address.street1,
                state: address.state,
            });
            if (address.street2) {
                params.append('secondaryAddress', address.street2);
            }
            if (address.city) {
                params.append('city', address.city);
            }
            if (address.zip) {
                params.append('ZIPCode', address.zip);
            }
            const apiUrl = `${this.baseUrl}/addresses/v3/address?${params.toString()}`;
            console.log('[USPS] Calling API:', {
                url: apiUrl.replace(/\?.*/, '?[params]'), // Don't log full URL with params
                hasToken: !!token,
            });
            const response = await fetch(apiUrl, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Accept': 'application/json',
                },
            });
            console.log('[USPS] API response:', {
                status: response.status,
                statusText: response.statusText,
                ok: response.ok,
            });
            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                console.error('[USPS] API error:', {
                    status: response.status,
                    statusText: response.statusText,
                    error: errorData,
                });
                // Handle 404 as "address not found" - return null to allow fallback
                if (response.status === 404) {
                    console.log('[USPS] Address not found (404) - allowing fallback to Shippo');
                    return null;
                }
                // For other errors, return null to allow fallback
                console.warn('[USPS] API error - allowing fallback to Shippo');
                return null;
            }
            const result = await response.json();
            console.log('[USPS] Address validation successful:', {
                hasAddress: !!result.address,
                hasCorrections: !!result.corrections?.length,
                hasMatches: !!result.matches?.length,
                corrections: result.corrections?.map((c) => c.code),
                matches: result.matches?.map((m) => m.code),
            });
            return result;
        }
        catch (error) {
            console.error('[USPS] Address validation failed:', {
                error: error.message,
                stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
                address: {
                    street1: address.street1,
                    city: address.city,
                    state: address.state,
                    zip: address.zip
                }
            });
            // Return null to allow fallback to Shippo, but log detailed error for debugging
            if (error.message.includes('access token')) {
                console.error('[USPS] OAuth2 token issue - check USPS credentials and API status');
            }
            else if (error.message.includes('network') || error.message.includes('fetch')) {
                console.error('[USPS] Network connectivity issue - check internet connection and USPS API status');
            }
            return null;
        }
    }
}
exports.default = new USPSService();
