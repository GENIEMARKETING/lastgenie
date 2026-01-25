import express from 'express';
import { z } from 'zod';
import shippoService from '../services/shippo';
import { prisma } from '../lib/prisma';
import ShippoService from '../services/shippo';
import USPSService from '../services/usps';

const router = express.Router();

// Validation schema
const shippingRatesSchema = z.object({
  items: z.array(z.object({
    productId: z.string(),
    quantity: z.number().min(1)
  })),
  shippingAddress: z.object({
    name: z.string().optional(),
    street1: z.string(),
    street2: z.string().optional(),
    city: z.string(),
    state: z.string(),
    postalCode: z.string(),
    country: z.string(),
    addressType: z.enum(['house', 'apartment', 'condo', 'townhouse', 'business', 'residential_complex', 'other']).optional()
  })
});

const validateAddressSchema = z.object({
  address: z.object({
    name: z.string().optional(),
    street1: z.string(),
    street2: z.string().optional(),
    city: z.string(),
    state: z.string(),
    postalCode: z.string(),
    country: z.string(),
    phone: z.string().optional(),
    addressType: z.enum(['house', 'apartment', 'condo', 'townhouse', 'business', 'residential_complex', 'other']).optional()
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
    const productSkus = validatedData.items.map(item => item.productId);
    const products = await prisma.product.findMany({
      where: { sku: { in: productSkus } },
      select: {
        id: true,
        sku: true,
        name: true,
        packageSize: true,
        weight: true,
        length: true,
        width: true,
        height: true
      }
    });

    if (products.length !== productSkus.length) {
      return res.status(400).json({
        success: false,
        error: 'Some products not found'
      });
    }

    // Create cart items with product data for packaging calculation
    const cartItems = validatedData.items.map(item => {
      const product = products.find(p => p.sku === item.productId);
      if (!product) {
        throw new Error(`Product ${item.productId} not found`);
      }
      return {
        quantity: item.quantity,
        product: product
      };
    });

    // Calculate packaging using Shippo service
    const parcels = ShippoService.calculatePackaging(cartItems);
    
    if (parcels.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'No items to ship'
      });
    }

    // Get warehouse address
    const warehouseAddress = ShippoService.getWarehouseAddress();

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
    const rates = await ShippoService.getShippingRates(
      warehouseAddress,
      shippoToAddress,
      parcels
    );

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
  } catch (error) {
    if (error instanceof z.ZodError) {
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
      details: process.env.NODE_ENV === 'development' ? (error as any).message : undefined
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
    const uspsConfigured = USPSService.isConfigured();
    console.log('[Shipping Route] USPS configuration check:', { configured: uspsConfigured });
    
    // Normalize state to uppercase for USPS (required by USPS API)
    const normalizedAddress = {
      street1: address.street1,
      street2: address.street2,
      city: address.city,
      state: address.state?.toUpperCase() || address.state,
      zip: address.postalCode,
    };
    
    const uspsResult = await USPSService.validateAddress(normalizedAddress);

    if (uspsResult) {
      console.log('[Shipping Route] USPS validation successful, using USPS result');
      // Map USPS response to our format
      const hasCorrectionCode22 = uspsResult.corrections?.some(c => c.code === '22');
      const hasCorrectionCode32 = uspsResult.corrections?.some(c => c.code === '32');
      const isExactMatch = uspsResult.matches?.some(m => m.code === '31');

      // Check if unit number is required (correction codes 22 or 32)
      const requiresUnitNumber = hasCorrectionCode22 || hasCorrectionCode32;

      // Build messages array
      const messages: string[] = [];
      if (uspsResult.warnings && uspsResult.warnings.length > 0) {
        messages.push(...uspsResult.warnings);
      }
      if (hasCorrectionCode22) {
        messages.push('Multiple addresses were found for this location. Please enter your unit, apartment, or suite number.');
      }
      if (hasCorrectionCode32) {
        messages.push('This address requires a unit, apartment, or suite number. Please enter it below and we will validate the complete address.');
      }

      // Compare original vs validated address
      const originalAddr = {
        street1: address.street1?.toLowerCase().trim(),
        street2: address.street2?.toLowerCase().trim() || '',
        city: address.city?.toLowerCase().trim(),
        state: address.state?.toUpperCase().trim(),
        postalCode: address.postalCode?.trim()
      };

      const validatedAddr = {
        street1: uspsResult.address.streetAddress?.toLowerCase().trim(),
        street2: uspsResult.address.secondaryAddress?.toLowerCase().trim() || '',
        city: uspsResult.address.city?.toLowerCase().trim(),
        state: uspsResult.address.state?.toUpperCase().trim(),
        postalCode: uspsResult.address.ZIPCode?.trim()
      };

      const addressesAreDifferent = (
        originalAddr.street1 !== validatedAddr.street1 ||
        originalAddr.street2 !== validatedAddr.street2 ||
        originalAddr.city !== validatedAddr.city ||
        originalAddr.state !== validatedAddr.state ||
        originalAddr.postalCode !== validatedAddr.postalCode
      );

      // Build suggestions if addresses differ
      const suggestions = addressesAreDifferent ? [{
        name: address.name,
        street1: uspsResult.address.streetAddress,
        street2: uspsResult.address.secondaryAddress || undefined,
        city: uspsResult.address.city,
        state: uspsResult.address.state,
        postalCode: uspsResult.address.ZIPCode,
        country: 'US',
        addressType: address.addressType,
      }] : undefined;

      return res.json({
        success: true,
        data: {
          isValid: !!isExactMatch && !requiresUnitNumber && !addressesAreDifferent,
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
          suggestions: suggestions, // NOW PROVIDES SUGGESTIONS!
          messages: messages.length > 0 ? messages : undefined,
        }
      });
    }

    // Fallback to Shippo if USPS unavailable or returns null
    if (!uspsResult) {
      if (!uspsConfigured) {
        console.warn('[Shipping Route] USPS not configured - falling back to Shippo');
      } else {
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
    console.log('[Shipping Route] Attempting Shippo validation for address:', {
      street1: shippoAddress.street1,
      city: shippoAddress.city,
      state: shippoAddress.state,
      zip: shippoAddress.zip
    });
    
    let validationResult;
    try {
      validationResult = await ShippoService.validateAddress(shippoAddress);
      console.log('[Shipping Route] Shippo validation completed successfully');
    } catch (shippoError: any) {
      console.error('[Shipping Route] Shippo validation failed:', {
        error: shippoError.message,
        type: shippoError.constructor.name,
        stack: process.env.NODE_ENV === 'development' ? shippoError.stack : undefined
      });
      throw new Error(`Shippo validation failed: ${shippoError.message}`);
    }

    // Transform ShippoService response back to frontend format
    const responseData: any = {
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
  } catch (error: any) {
    // Enhanced error logging with full context
    console.error('Address validation error:', {
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
      type: error.constructor.name,
      address: req.body.address ? {
        street1: req.body.address.street1,
        city: req.body.address.city,
        state: req.body.address.state,
        postalCode: req.body.address.postalCode
      } : 'undefined',
      timestamp: new Date().toISOString(),
      requestId: req.headers['x-request-id'] || 'unknown'
    });
    
    // Handle Zod validation errors
    if (error.name === 'ZodError') {
      return res.status(400).json({
        success: false,
        error: 'Invalid address data',
        details: (error as any).errors
      });
    }
    
    // Determine specific error type and message with enhanced detection
    let errorMessage = 'Address validation service error';
    let userMessage = 'Address validation service unavailable. Please verify your address manually.';
    let statusCode = 500;
    
    // Check for specific error types
    if (error instanceof SyntaxError) {
      errorMessage = 'Address validation service returned invalid response';
      userMessage = 'Address validation service returned an invalid response. Please try again or verify your address manually.';
      statusCode = 502; // Bad Gateway
    } else if (error.message?.includes('not configured') || error.message?.includes('credentials') || error.message?.includes('API token')) {
      errorMessage = 'Address validation service not configured';
      userMessage = 'Address validation is currently unavailable. Please verify your address manually.';
      statusCode = 503; // Service Unavailable
    } else if (error.message?.includes('network') || error.message?.includes('fetch') || error.message?.includes('timeout') || error.message?.includes('ECONNREFUSED')) {
      errorMessage = 'Address validation service temporarily unavailable';
      userMessage = 'Address validation service is temporarily unavailable. Please try again or verify your address manually.';
      statusCode = 503; // Service Unavailable
    } else if (error.message?.includes('invalid') || error.message?.includes('not found') || error.message?.includes('malformed')) {
      errorMessage = 'Address not found or invalid';
      userMessage = 'The address could not be validated. Please check your address and try again.';
      statusCode = 400; // Bad Request
    } else if (error.message?.includes('Invalid response format') || error.message?.includes('JSON')) {
      errorMessage = 'Address validation service returned invalid response';
      userMessage = 'Address validation service returned an unexpected response. Please try again or verify your address manually.';
      statusCode = 502; // Bad Gateway
    } else if (error.message?.includes('Shippo validation failed')) {
      errorMessage = 'Shippo address validation service error';
      userMessage = 'Address validation service is experiencing issues. Please try again or verify your address manually.';
      statusCode = 503; // Service Unavailable
    } else if (error.message?.includes('USPS') || error.message?.includes('usps')) {
      errorMessage = 'USPS address validation service error';
      userMessage = 'Address validation service is experiencing issues. Please try again or verify your address manually.';
      statusCode = 503; // Service Unavailable
    } else if (error.message?.includes('shippo') || error.message?.includes('api')) {
      errorMessage = 'Address validation service temporarily unavailable';
      userMessage = 'Address validation service is experiencing issues. Please try again or verify your address manually.';
      statusCode = 503; // Service Unavailable
    }
    
    // Log configuration status for debugging
    const uspsConfigured = !!process.env.USPS_CLIENT_ID && !!process.env.USPS_CLIENT_SECRET;
    const shippoConfigured = !!process.env.SHIPPO_API_TOKEN && process.env.SHIPPO_API_TOKEN !== 'mock_token';
    
    console.warn('Address validation service status:', {
      uspsConfigured,
      shippoConfigured,
      errorType: error.constructor.name,
      errorMessage: error.message,
      statusCode,
      userMessage
    });
    
    // Return proper error response with specific messaging
    res.status(statusCode).json({
      success: false,
      error: errorMessage,
      details: process.env.NODE_ENV === 'development' ? {
        message: error.message,
        type: error.constructor.name,
        uspsConfigured,
        shippoConfigured
      } : undefined,
      data: {
        isValid: false,
        originalAddress: req.body.address || {},
        validatedAddress: undefined,
        suggestions: [],
        messages: [userMessage]
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
    // Get detailed configuration validation
    const uspsValidation = USPSService.validateConfiguration();
    const shippoValidation = ShippoService.validateConfiguration();
    
    const results: any = {
      usps: {
        configured: uspsValidation.isValid,
        status: 'unknown',
        error: null,
        validation: uspsValidation,
      },
      shippo: {
        configured: shippoValidation.isValid,
        status: 'unknown',
        error: null,
        validation: shippoValidation,
      },
    };

    // Test USPS OAuth2 token acquisition if configured
    if (uspsValidation.isValid) {
      try {
        // Try to get a token (this will test the credentials)
        const testAddress = {
          street1: '1600 Pennsylvania Avenue NW',
          city: 'Washington',
          state: 'DC',
          zip: '20500',
        };
        
        const testResult = await USPSService.validateAddress(testAddress);
        if (testResult !== null) {
          results.usps.status = 'operational';
          results.usps.message = 'Successfully connected to USPS API';
        } else {
          results.usps.status = 'error';
          results.usps.error = 'USPS API returned null (check server logs for details)';
        }
      } catch (error: any) {
        results.usps.status = 'error';
        results.usps.error = error.message || 'Failed to connect to USPS API';
      }
    } else {
      results.usps.status = 'not_configured';
      results.usps.error = uspsValidation.issues.join('; ');
    }

    // Test Shippo if configured
    if (shippoValidation.isValid) {
      results.shippo.status = 'configured';
      results.shippo.message = 'Shippo API token is properly formatted';
    } else {
      results.shippo.status = 'not_configured';
      results.shippo.error = shippoValidation.issues.join('; ');
    }

    const allOperational = results.usps.status === 'operational' || results.shippo.status === 'configured';
    
    res.json({
      success: true,
      data: {
        ...results,
        summary: {
          allOperational,
          primaryService: uspsValidation.isValid ? 'USPS' : (shippoValidation.isValid ? 'Shippo' : 'None'),
          fallbackAvailable: uspsValidation.isValid && shippoValidation.isValid,
          configurationIssues: [
            ...uspsValidation.issues.map(issue => `USPS: ${issue}`),
            ...shippoValidation.issues.map(issue => `Shippo: ${issue}`)
          ]
        },
      },
    });
  } catch (error: any) {
    console.error('[Shipping Route] Config validation error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to validate configuration',
      message: error.message,
    });
  }
});

export default router;