"use strict";
/**
 * Environment Configuration Loader
 *
 * This module MUST be imported first in any entry point to ensure
 * environment variables are loaded before any services are instantiated.
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.verifyEnvLoaded = verifyEnvLoaded;
const dotenv_1 = __importDefault(require("dotenv"));
const path_1 = __importDefault(require("path"));
// Load .env file from server directory
// This must execute before any service imports
dotenv_1.default.config({ path: path_1.default.join(__dirname, "../../.env") });
// Export a function to verify env vars are loaded (for debugging)
function verifyEnvLoaded() {
    console.log('[Config] Environment variables loaded:', {
        hasUSPSClientId: !!process.env.USPS_CLIENT_ID,
        hasUSPSClientSecret: !!process.env.USPS_CLIENT_SECRET,
        hasShippoToken: !!process.env.SHIPPO_API_TOKEN,
        uspsClientIdLength: process.env.USPS_CLIENT_ID?.length || 0,
        shippoTokenPrefix: process.env.SHIPPO_API_TOKEN?.substring(0, 10) || 'not set',
    });
}
