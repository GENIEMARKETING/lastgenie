/**
 * Environment Configuration Loader
 * 
 * This module MUST be imported first in any entry point to ensure
 * environment variables are loaded before any services are instantiated.
 */

import dotenv from "dotenv";
import path from "path";

// Load .env file from server directory
// This must execute before any service imports
dotenv.config({ path: path.join(__dirname, "../../.env") });

// Export a function to verify env vars are loaded (for debugging)
export function verifyEnvLoaded(): void {
  console.log('[Config] Environment variables loaded:', {
    hasUSPSClientId: !!process.env.USPS_CLIENT_ID,
    hasUSPSClientSecret: !!process.env.USPS_CLIENT_SECRET,
    hasShippoToken: !!process.env.SHIPPO_API_TOKEN,
    uspsClientIdLength: process.env.USPS_CLIENT_ID?.length || 0,
    shippoTokenPrefix: process.env.SHIPPO_API_TOKEN?.substring(0, 10) || 'not set',
  });
}
