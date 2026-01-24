"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const zod_1 = require("zod");
const prisma_1 = require("../lib/prisma");
const shippo_1 = __importDefault(require("../services/shippo"));
const usps_1 = __importDefault(require("../services/usps"));
const router = express_1.default.Router();
// Validation schema
const shippingRatesSchema = zod_1.z.object({
    items: zod_1.z.array(zod_1.z.object({
        productId: zod_1.z.string(),
        quantity: zod_1.z.number().min(1)
    })),
    shippingAddress: zod_1.z.object({
        name: zod_1.z.string().optional(),
        street1: zod_1.z.string(),
        street2: zod_1.z.string().optional(),
        city: zod_1.z.string(),
        state: zod_1.z.string(),
        postalCode: zod_1.z.string(),
        country: zod_1.z.string(),
        addressType: zod_1.z.enum(['house', 'apartment', 'condo', 'townhouse', 'business', 'residential_complex', 'other']).optional()
    })
});
const validateAddressSchema = zod_1.z.object({
    address: zod_1.z.object({
        name: zod_1.z.string().optional(),
        street1: zod_1.z.string(),
        street2: zod_1.z.string().optional(),
        city: zod_1.z.string(),
        state: zod_1.z.string(),
        postalCode: zod_1.z.string(),
        country: zod_1.z.string(),
        phone: zod_1.z.string().optional(),
        addressType: zod_1.z.enum(['house', 'apartment', 'condo', 'townhouse', 'business', 'residential_complex', 'other']).optional()
    })
});
/**
 * POST /api/shipping/rates
 * Get real-time shipping rates using Shippo API
 */
router.post('/rates', async (req, res) => {
    try {
        const validatedData = shippingRatesSchema.parse(req.body);
        console.log('Shipping rates request:', {
            destination: validatedData.shippingAddress,
            itemCount: validatedData.items.length
        });
        // Fetch products with their dimensions from database
        const productIds = validatedData.items.map(item => item.productId);
        const products = await prisma_1.prisma.product.findMany({
            where: { id: { in: productIds } },
            select: {
                id: true,
                name: true,
                packageSize: true,
                weight: true,
                length: true,
                width: true,
                height: true
            }
        });
        if (products.length !== productIds.length) {
            return res.status(400).json({
                success: false,
                error: 'Some products not found'
            });
        }
        // Create cart items with product data for packaging calculation
        const cartItems = validatedData.items.map(item => {
            const product = products.find(p => p.id === item.productId);
            if (!product) {
                throw new Error(`Product ${item.productId} not found`);
            }
            return {
                quantity: item.quantity,
                product: product
            };
        });
        // Calculate packaging using Shippo service
        const parcels = shippo_1.default.calculatePackaging(cartItems);
        if (parcels.length === 0) {
            return res.status(400).json({
                success: false,
                error: 'No items to ship'
            });
        }
        // Get warehouse address
        const warehouseAddress = shippo_1.default.getWarehouseAddress();
        // Transform shipping address format
        const shippoToAddress = {
            name: validatedData.shippingAddress.name || 'Customer',
            street1: validatedData.shippingAddress.street1,
            street2: validatedData.shippingAddress.street2 || '',
            city: validatedData.shippingAddress.city,
            state: validatedData.shippingAddress.state,
            zip: validatedData.shippingAddress.postalCode,
            country: validatedData.shippingAddress.country || 'US'
        };
        console.log('Getting rates:', {
            from: warehouseAddress.city,
            to: shippoToAddress.city,
            parcels: parcels.length
        });
        // Get shipping rates from Shippo
        const rates = await shippo_1.default.getShippingRates(warehouseAddress, shippoToAddress, parcels);
        res.json({
            success: true,
            data: {
                rates: rates,
                fromAddress: {
                    city: warehouseAddress.city,
                    state: warehouseAddress.state,
                    country: warehouseAddress.country
                },
                toAddress: validatedData.shippingAddress,
                parcels: parcels.map(p => ({
                    dimensions: `${p.length}"×${p.width}"×${p.height}"`,
                    weight: `${p.weight} lbs`
                }))
            }
        });
    }
    catch (error) {
        if (error instanceof zod_1.z.ZodError) {
            return res.status(400).json({
                success: false,
                error: 'Validation failed',
                details: error.issues
            });
        }
        console.error('Shipping rates error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch shipping rates',
            details: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});
/**
 * POST /api/shipping/validate-address
 * Validate shipping address using Shippo API
 */
router.post('/validate-address', async (req, res) => {
    try {
        // Validate request body using Zod schema
        const validatedData = validateAddressSchema.parse(req.body);
        const { address } = validatedData;
        // Try USPS first (free, official USPS data)
        const uspsConfigured = usps_1.default.isConfigured();
        console.log('[Shipping Route] USPS configuration check:', { configured: uspsConfigured });
        const uspsResult = await usps_1.default.validateAddress({
            street1: address.street1,
            street2: address.street2,
            city: address.city,
            state: address.state,
            zip: address.postalCode,
        });
        if (uspsResult) {
            console.log('[Shipping Route] USPS validation successful, using USPS result');
            // Map USPS response to our format
            const hasCorrectionCode22 = uspsResult.corrections?.some(c => c.code === '22');
            const hasCorrectionCode32 = uspsResult.corrections?.some(c => c.code === '32');
            const isExactMatch = uspsResult.matches?.some(m => m.code === '31');
            // Check if unit number is required (correction codes 22 or 32)
            const requiresUnitNumber = hasCorrectionCode22 || hasCorrectionCode32;
            // Build messages array
            const messages = [];
            if (uspsResult.warnings && uspsResult.warnings.length > 0) {
                messages.push(...uspsResult.warnings);
            }
            if (hasCorrectionCode22) {
                messages.push('Multiple addresses were found for this location. Please enter your unit, apartment, or suite number.');
            }
            if (hasCorrectionCode32) {
                messages.push('This address requires a unit, apartment, or suite number. Please enter it below and we will validate the complete address.');
            }
            return res.json({
                success: true,
                data: {
                    isValid: !!isExactMatch && !requiresUnitNumber,
                    originalAddress: address,
                    validatedAddress: {
                        name: address.name,
                        street1: uspsResult.address.streetAddress,
                        street2: uspsResult.address.secondaryAddress || undefined,
                        city: uspsResult.address.city,
                        state: uspsResult.address.state,
                        postalCode: uspsResult.address.ZIPCode,
                        country: 'US',
                        addressType: address.addressType,
                    },
                    requiresUnitNumber: requiresUnitNumber || undefined,
                    suggestions: undefined, // No synthetic suggestions - user must enter actual unit number
                    messages: messages.length > 0 ? messages : undefined,
                }
            });
        }
        // Fallback to Shippo if USPS unavailable or returns null
        if (!uspsResult) {
            if (!uspsConfigured) {
                console.warn('[Shipping Route] USPS not configured - falling back to Shippo');
            }
            else {
                console.warn('[Shipping Route] USPS returned null (API error or address not found) - falling back to Shippo');
            }
        }
        // Transform frontend address format to ShippoService format
        const shippoAddress = {
            name: address.name || '',
            street1: address.street1,
            street2: address.street2,
            city: address.city,
            state: address.state,
            zip: address.postalCode,
            country: address.country || 'US',
            phone: address.phone,
            addressType: address.addressType,
        };
        // Validate address using ShippoService
        const validationResult = await shippo_1.default.validateAddress(shippoAddress);
        // Transform ShippoService response back to frontend format
        const responseData = {
            isValid: validationResult.isValid,
            originalAddress: address,
        };
        if (validationResult.validatedAddress) {
            responseData.validatedAddress = {
                name: validationResult.validatedAddress.name || address.name,
                street1: validationResult.validatedAddress.street1 || address.street1,
                street2: validationResult.validatedAddress.street2 || address.street2,
                city: validationResult.validatedAddress.city || address.city,
                state: validationResult.validatedAddress.state || address.state,
                postalCode: validationResult.validatedAddress.zip || address.postalCode,
                country: validationResult.validatedAddress.country || address.country || 'US',
                phone: validationResult.validatedAddress.phone || address.phone,
                addressType: validationResult.validatedAddress.addressType || address.addressType,
            };
        }
        if (validationResult.suggestions && validationResult.suggestions.length > 0) {
            responseData.suggestions = validationResult.suggestions.map((suggestion) => ({
                name: suggestion.name || address.name,
                street1: suggestion.street1 || address.street1,
                street2: suggestion.street2 || address.street2,
                city: suggestion.city || address.city,
                state: suggestion.state || address.state,
                postalCode: suggestion.zip || address.postalCode,
                country: suggestion.country || address.country || 'US',
                phone: suggestion.phone || address.phone,
                addressType: suggestion.addressType || address.addressType,
            }));
        }
        if (validationResult.confidence) {
            responseData.confidence = validationResult.confidence;
        }
        if (validationResult.messages && validationResult.messages.length > 0) {
            responseData.messages = validationResult.messages;
        }
        res.json({
            success: true,
            data: responseData
        });
    }
    catch (error) {
        console.error('Address validation error:', error);
        // Handle Zod validation errors
        if (error.name === 'ZodError') {
            return res.status(400).json({
                success: false,
                error: 'Invalid address data',
                details: error.errors
            });
        }
        // Return proper error response for other errors
        res.status(500).json({
            success: false,
            error: 'Address validation service error',
            details: process.env.NODE_ENV === 'development' ? error.message : undefined,
            data: {
                isValid: false,
                originalAddress: req.body.address || {},
                validatedAddress: undefined,
                suggestions: [],
                messages: ['Address validation service unavailable. Please verify your address manually.']
            }
        });
    }
});
/**
 * GET /api/shipping/validate-config
 * Health check endpoint to verify address validation service configuration
 */
router.get('/validate-config', async (req, res) => {
    try {
        const uspsConfigured = usps_1.default.isConfigured();
        const shippoConfigured = shippo_1.default.isConfigured();
        const results = {
            usps: {
                configured: uspsConfigured,
                status: 'unknown',
                error: null,
            },
            shippo: {
                configured: shippoConfigured,
                status: 'unknown',
                error: null,
            },
        };
        // Test USPS OAuth2 token acquisition if configured
        if (uspsConfigured) {
            try {
                // Try to get a token (this will test the credentials)
                const testAddress = {
                    street1: '1600 Pennsylvania Avenue NW',
                    city: 'Washington',
                    state: 'DC',
                    zip: '20500',
                };
                const testResult = await usps_1.default.validateAddress(testAddress);
                if (testResult !== null) {
                    results.usps.status = 'operational';
                    results.usps.message = 'Successfully connected to USPS API';
                }
                else {
                    results.usps.status = 'error';
                    results.usps.error = 'USPS API returned null (check server logs for details)';
                }
            }
            catch (error) {
                results.usps.status = 'error';
                results.usps.error = error.message || 'Failed to connect to USPS API';
            }
        }
        else {
            results.usps.status = 'not_configured';
            results.usps.error = 'USPS_CLIENT_ID and USPS_CLIENT_SECRET not set in environment variables';
        }
        // Test Shippo if configured
        if (shippoConfigured) {
            results.shippo.status = 'configured';
            results.shippo.message = 'Shippo API token is set (not tested)';
        }
        else {
            results.shippo.status = 'not_configured';
            results.shippo.error = 'SHIPPO_API_TOKEN not set in environment variables';
        }
        const allOperational = results.usps.status === 'operational' || results.shippo.status === 'configured';
        res.json({
            success: true,
            data: {
                ...results,
                summary: {
                    allOperational,
                    primaryService: uspsConfigured ? 'USPS' : (shippoConfigured ? 'Shippo' : 'None'),
                    fallbackAvailable: uspsConfigured && shippoConfigured,
                },
            },
        });
    }
    catch (error) {
        console.error('[Shipping Route] Config validation error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to validate configuration',
            message: error.message,
        });
    }
});
exports.default = router;
