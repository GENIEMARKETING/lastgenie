"use strict";
/**
 * Shippo Service - Shipping Rate Calculation
 *
 * This service handles all Shippo-related operations including:
 * - Getting real-time shipping rates
 * - Address validation
 * - Creating shipping labels
 * - Tracking shipments
 */
Object.defineProperty(exports, "__esModule", { value: true });
class ShippoService {
    constructor() {
        this.baseUrl = 'https://api.goshippo.com';
        this.apiToken = process.env.SHIPPO_API_TOKEN || 'mock_token';
    }
    /**
     * Get warehouse address from environment variables
     */
    getWarehouseAddress() {
        return {
            name: process.env.WAREHOUSE_NAME || 'Genie Fulfillment Center',
            street1: process.env.WAREHOUSE_STREET1 || '123 Industrial Blvd',
            street2: process.env.WAREHOUSE_STREET2 || '',
            city: process.env.WAREHOUSE_CITY || 'Austin',
            state: process.env.WAREHOUSE_STATE || 'TX',
            zip: process.env.WAREHOUSE_ZIP || '78701',
            country: process.env.WAREHOUSE_COUNTRY || 'US',
            phone: process.env.WAREHOUSE_PHONE || '(555) 123-4567'
        };
    }
    /**
     * Check if Shippo service is properly configured
     */
    isConfigured() {
        return !!(this.apiToken && this.apiToken !== 'mock_token');
    }
    /**
     * Get shipping rates for a shipment
     */
    async getShippingRates(fromAddress, toAddress, parcels) {
        try {
            console.log('Getting shipping rates from Shippo:', {
                from: fromAddress.city,
                to: toAddress.city,
                parcelCount: parcels.length,
                isConfigured: this.isConfigured()
            });
            // If Shippo is not configured, fall back to enhanced mock rates
            if (!this.isConfigured()) {
                console.warn('Shippo API not configured, using enhanced mock rates');
                return this.getEnhancedMockRates(parcels, toAddress);
            }
            // Create shipment object for Shippo API
            const shipmentData = {
                address_from: this.formatAddressForShippo(fromAddress),
                address_to: this.formatAddressForShippo(toAddress),
                parcels: parcels.map(parcel => ({
                    length: parcel.length,
                    width: parcel.width,
                    height: parcel.height,
                    weight: parcel.weight,
                    distance_unit: parcel.distance_unit,
                    mass_unit: parcel.mass_unit
                })),
                async: false, // Get rates synchronously
                carrier_accounts: [] // Use all available carriers
            };
            console.log('Shippo API request:', shipmentData);
            const response = await fetch(`${this.baseUrl}/shipments/`, {
                method: 'POST',
                headers: {
                    'Authorization': `ShippoToken ${this.apiToken}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(shipmentData)
            });
            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                console.error('Shippo API error:', response.status, errorData);
                // Fall back to enhanced mock rates on API failure
                console.warn('Shippo API failed, falling back to enhanced mock rates');
                return this.getEnhancedMockRates(parcels, toAddress);
            }
            const data = await response.json();
            console.log('Shippo API response:', {
                hasRates: !!data.rates,
                rateCount: data.rates?.length || 0
            });
            if (!data.rates || data.rates.length === 0) {
                console.warn('No rates returned from Shippo, using enhanced mock rates');
                return this.getEnhancedMockRates(parcels, toAddress);
            }
            // Transform Shippo rates to our format
            const transformedRates = data.rates
                .filter((rate) => rate.amount && rate.currency === 'USD')
                .map((rate) => ({
                id: rate.object_id,
                provider: rate.provider,
                serviceName: rate.servicelevel.name,
                amount: parseFloat(rate.amount).toFixed(2),
                currency: rate.currency,
                estimatedDays: rate.estimated_days || rate.duration_terms || 'Unknown',
                attributes: this.determineRateAttributes(rate, data.rates)
            }))
                .sort((a, b) => parseFloat(a.amount) - parseFloat(b.amount)); // Sort by price
            return transformedRates.length > 0 ? transformedRates : this.getEnhancedMockRates(parcels, toAddress);
        }
        catch (error) {
            console.error('Shippo rate calculation failed:', error);
            // Fall back to enhanced mock rates on any error
            console.warn('Shippo API error, falling back to enhanced mock rates');
            return this.getEnhancedMockRates(parcels, toAddress);
        }
    }
    /**
     * Parse an unstructured address string into structured address components
     * Uses Shippo Address Parser API: https://docs.goshippo.com/docs/addressapi/address_parser/
     */
    async parseAddress(addressString) {
        try {
            // Check if API token is configured
            if (!this.apiToken || this.apiToken === 'mock_token') {
                return null;
            }
            const params = new URLSearchParams();
            params.append('address', addressString);
            const response = await fetch(`${this.baseUrl}/v2/addresses/parse?${params.toString()}`, {
                method: 'GET',
                headers: {
                    'Authorization': `ShippoToken ${this.apiToken}`,
                    'Content-Type': 'application/json',
                },
            });
            if (!response.ok) {
                return null;
            }
            const data = await response.json();
            return {
                name: data.name || '',
                street1: data.address_line_1 || '',
                street2: data.address_line_2 || '',
                city: data.city_locality || '',
                state: data.state_province || '',
                zip: data.postal_code || '',
                country: data.country_code || 'US',
                phone: data.phone || '',
            };
        }
        catch (error) {
            console.error('Shippo address parsing failed:', error);
            return null;
        }
    }
    /**
     * Generate unit number suggestions based on address characteristics
     * This works even when API validation is unavailable
     */
    generateUnitSuggestions(address, validatedAddress) {
        const suggestions = [];
        const messages = [];
        // Detect suspicious unit numbers like "000", "0", "00"
        const hasSuspiciousUnitNumber = address.street2 &&
            ['000', '0', '00'].includes(address.street2.trim());
        // Detect if unit number might be missing based on address type
        // When API is unavailable, we can only rely on user-provided addressType
        const mightNeedUnitNumber = 
        // Check for suspicious unit numbers when address type requires unit
        (hasSuspiciousUnitNumber && address.addressType &&
            ['apartment', 'condo', 'residential_complex'].includes(address.addressType)) ||
            // Check user-provided address type (most reliable when API unavailable)
            (address.addressType && ['apartment', 'condo', 'residential_complex'].includes(address.addressType) && !address.street2) ||
            // Check if street1 contains building indicators
            (address.street1.match(/\b(apt|apartment|unit|suite|ste|#)\b/i) && !address.street2);
        // Add message if suspicious unit number detected
        if (hasSuspiciousUnitNumber && address.addressType &&
            ['apartment', 'condo', 'residential_complex'].includes(address.addressType)) {
            messages.push(`Unit number "${address.street2}" appears to be invalid. Please select the correct unit number from the suggestions below.`);
        }
        // Generate address variations with common unit patterns if unit number might be missing
        // Also generate if suspicious unit number detected (like "000")
        if (mightNeedUnitNumber && (!address.street2 || hasSuspiciousUnitNumber)) {
            // Common unit number patterns to try
            const unitPatterns = [
                'Apt 1', 'Apt 2', 'Apt 3', 'Apt 4', 'Apt 5',
                'Unit A', 'Unit B', 'Unit C', 'Unit D', 'Unit E',
                'Suite 100', 'Suite 101', 'Suite 102', 'Suite 200', 'Suite 201',
                '#1', '#2', '#3', '#4', '#5'
            ];
            const baseAddress = validatedAddress || address;
            // Generate suggestions with unit patterns
            unitPatterns.forEach(pattern => {
                const variation = {
                    ...baseAddress,
                    street2: pattern,
                    addressType: address.addressType, // Preserve address type in suggestions
                };
                // Only add if it's different from existing suggestions
                const isDuplicate = suggestions.some(s => s.street1 === variation.street1 &&
                    s.street2 === variation.street2 &&
                    s.city === variation.city &&
                    s.state === variation.state &&
                    s.zip === variation.zip);
                if (!isDuplicate) {
                    suggestions.push(variation);
                }
            });
        }
        return {
            suggestions,
            messages,
            shouldGenerate: suggestions.length > 0,
        };
    }
    /**
     * Validate an address using Shippo API
     */
    async validateAddress(address) {
        try {
            // Log validation request for debugging
            console.log('Shippo validation request:', {
                hasToken: !!this.apiToken,
                tokenPrefix: this.apiToken?.substring(0, 10),
                address: { street1: address.street1, street2: address.street2, city: address.city, state: address.state, zip: address.zip, addressType: address.addressType }
            });
            // Check if API token is configured
            if (!this.apiToken || this.apiToken === 'mock_token') {
                console.warn('Shippo API token not configured. Using fallback validation.');
                // Generate suggestions even when API is unavailable
                const unitSuggestions = this.generateUnitSuggestions(address);
                const fallbackMessages = ['Address validation service is not configured. Please verify your address manually before proceeding.'];
                if (unitSuggestions.shouldGenerate) {
                    fallbackMessages.push('However, we found multiple possible unit numbers for this address.');
                    return {
                        isValid: false,
                        validatedAddress: undefined,
                        suggestions: unitSuggestions.suggestions,
                        confidence: 'low',
                        messages: [...fallbackMessages, ...unitSuggestions.messages]
                    };
                }
                return {
                    isValid: false,
                    validatedAddress: undefined,
                    suggestions: [],
                    confidence: 'low',
                    messages: fallbackMessages
                };
            }
            // Build query parameters for Shippo API
            const params = new URLSearchParams();
            params.append('address_line_1', address.street1);
            if (address.street2) {
                params.append('address_line_2', address.street2);
            }
            if (address.city) {
                params.append('city_locality', address.city);
            }
            if (address.state) {
                params.append('state_province', address.state);
            }
            if (address.zip) {
                params.append('postal_code', address.zip);
            }
            params.append('country_code', address.country || 'US');
            if (address.name) {
                params.append('name', address.name);
            }
            // Make API request to Shippo
            const response = await fetch(`${this.baseUrl}/v2/addresses/validate?${params.toString()}`, {
                method: 'GET',
                headers: {
                    'Authorization': `ShippoToken ${this.apiToken}`,
                    'Content-Type': 'application/json',
                },
            });
            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                console.error('Shippo API error:', response.status, errorData);
                // Generate suggestions even when API fails
                const unitSuggestions = this.generateUnitSuggestions(address);
                const errorMessages = ['Address validation service unavailable. Please verify your address manually.'];
                if (unitSuggestions.shouldGenerate) {
                    errorMessages.push('However, we found multiple possible unit numbers for this address.');
                }
                // Handle authentication errors gracefully
                if (response.status === 401 || response.status === 403) {
                    console.warn('Shippo API authentication failed. Check SHIPPO_API_TOKEN environment variable.');
                    // Return fallback with suggestions if available
                    return {
                        isValid: false,
                        validatedAddress: undefined,
                        suggestions: unitSuggestions.shouldGenerate ? unitSuggestions.suggestions : undefined,
                        confidence: 'low',
                        messages: [...errorMessages, ...unitSuggestions.messages]
                    };
                }
                // For other errors, return basic validation result with suggestions if available
                return {
                    isValid: false,
                    validatedAddress: undefined,
                    suggestions: unitSuggestions.shouldGenerate ? unitSuggestions.suggestions : undefined,
                    confidence: 'low',
                    messages: [...errorMessages, ...unitSuggestions.messages]
                };
            }
            const data = await response.json();
            // Log API response for debugging
            console.log('Shippo API response:', {
                status: response.status,
                hasData: !!data,
                analysis: !!data.analysis,
                validationResult: data.analysis?.validation_result,
                recommendedAddress: !!data.recommended_address,
                addressType: data.analysis?.address_type
            });
            // Handle case where response structure might be different
            if (!data || (!data.analysis && !data.validation_result)) {
                console.warn('Unexpected Shippo API response structure:', data);
                // Return the address as-is but mark as unvalidated
                return {
                    isValid: false,
                    validatedAddress: undefined,
                    suggestions: [],
                    confidence: 'low',
                    messages: ['Address validation returned unexpected response. Please verify your address manually.']
                };
            }
            // Correct API structure parsing according to Shippo API docs
            const analysis = data.analysis || {};
            const validationResult = analysis.validation_result || data.validation_result || {};
            const addressType = analysis.address_type; // e.g., "apartment", "residential", "unknown"
            const changedAttributes = analysis.changed_attributes || []; // e.g., ["address_line_2"]
            const validationReasons = validationResult.reasons || [];
            const recommendedAddress = data.recommended_address;
            const confidenceResult = recommendedAddress?.confidence_result || {};
            // Determine validation status
            const isValid = validationResult.value === 'valid' || validationResult.is_valid === true;
            // Map confidence level
            let confidence = 'low';
            if (confidenceResult.confidence === 'exact') {
                confidence = 'exact';
            }
            else if (confidenceResult.confidence === 'high') {
                confidence = 'high';
            }
            else if (confidenceResult.confidence === 'medium') {
                confidence = 'medium';
            }
            // Map validated address if available
            let validatedAddress;
            if (recommendedAddress) {
                validatedAddress = {
                    name: recommendedAddress.name || address.name,
                    street1: recommendedAddress.address_line_1 || address.street1,
                    street2: recommendedAddress.address_line_2 || address.street2,
                    city: recommendedAddress.city_locality || address.city,
                    state: recommendedAddress.state_province || address.state,
                    zip: recommendedAddress.postal_code || address.zip,
                    country: recommendedAddress.country_code || address.country,
                    phone: recommendedAddress.phone || address.phone,
                    addressType: address.addressType,
                };
            }
            else if (isValid) {
                validatedAddress = address;
            }
            // Extract messages from multiple sources
            const messages = [];
            // Extract from validation_result.messages if available
            if (validationResult.messages && Array.isArray(validationResult.messages)) {
                validationResult.messages.forEach((msg) => {
                    if (msg.text) {
                        messages.push(msg.text);
                    }
                });
            }
            // Also extract from validation reasons
            if (validationReasons && Array.isArray(validationReasons)) {
                validationReasons.forEach((reason) => {
                    if (reason && typeof reason === 'string') {
                        messages.push(reason);
                    }
                });
            }
            // Add confidence description if available
            if (confidenceResult.description) {
                messages.push(confidenceResult.description);
            }
            // Helper function to check if two addresses are different
            const addressesAreDifferent = (addr1, addr2) => {
                if (!addr1 || !addr2)
                    return false;
                return ((addr1.street1 || '').toLowerCase().trim() !== (addr2.street1 || '').toLowerCase().trim() ||
                    (addr1.street2 || '').toLowerCase().trim() !== (addr2.street2 || '').toLowerCase().trim() ||
                    (addr1.city || '').toLowerCase().trim() !== (addr2.city || '').toLowerCase().trim() ||
                    (addr1.state || '').toUpperCase().trim() !== (addr2.state || '').toUpperCase().trim() ||
                    (addr1.zip || '').trim() !== (addr2.zip || '').trim() ||
                    (addr1.country || 'US').toUpperCase().trim() !== (addr2.country || 'US').toUpperCase().trim());
            };
            // First, try parsing the input address string if it's unstructured
            // This helps extract unit numbers that might be embedded in street1
            let parsedAddress = null;
            let addressToValidate = { ...address };
            if (address.street1 && !address.street2) {
                // If user entered address as a single string, try parsing it
                const addressString = `${address.street1}, ${address.city}, ${address.state} ${address.zip}`;
                parsedAddress = await this.parseAddress(addressString);
                // If parser extracted a unit number, use it
                if (parsedAddress?.street2) {
                    addressToValidate.street2 = parsedAddress.street2;
                    addressToValidate.street1 = parsedAddress.street1;
                }
            }
            // Detect suspicious unit numbers like "000", "0", "00"
            const hasSuspiciousUnitNumber = address.street2 &&
                ['000', '0', '00'].includes(address.street2.trim());
            // Detect if unit number might be missing
            // Prioritize user-provided address type (most reliable)
            const mightNeedUnitNumber = 
            // Check for suspicious unit numbers when address type requires unit
            (hasSuspiciousUnitNumber && address.addressType &&
                ['apartment', 'condo', 'residential_complex'].includes(address.addressType)) ||
                // First check user-provided address type (most reliable)
                (address.addressType && ['apartment', 'condo', 'residential_complex'].includes(address.addressType) && !address.street2) ||
                // Then check Shippo-detected address type
                (addressType && ['apartment', 'residential_complex', 'multi_unit'].includes(addressType.toLowerCase())) ||
                // Check if address_line_2 was added during validation (indicates unit number might be needed)
                (changedAttributes.includes('address_line_2') && !address.street2) ||
                // Check validation reasons for unit-related keywords
                validationReasons.some((reason) => reason.toLowerCase().includes('unit') ||
                    reason.toLowerCase().includes('apartment') ||
                    reason.toLowerCase().includes('suite') ||
                    reason.toLowerCase().includes('secondary')) ||
                // Check validation messages for unit-related keywords
                messages.some(msg => msg.toLowerCase().includes('unit') ||
                    msg.toLowerCase().includes('apartment') ||
                    msg.toLowerCase().includes('suite') ||
                    msg.toLowerCase().includes('secondary')) ||
                // Check if recommended address has address_line_2 but original didn't
                (recommendedAddress?.address_line_2 && !address.street2) ||
                // Check if street1 contains building indicators
                (address.street1.match(/\b(apt|apartment|unit|suite|ste|#)\b/i) && !address.street2);
            // Build suggestions array
            const suggestions = [];
            // Always include recommended_address in suggestions if it exists and differs from original
            if (validatedAddress && addressesAreDifferent(address, validatedAddress)) {
                suggestions.push(validatedAddress);
            }
            else if (!isValid && validatedAddress) {
                // If address is invalid, still show recommended_address as suggestion
                suggestions.push(validatedAddress);
            }
            else if ((confidence === 'low' || confidence === 'medium') && validatedAddress) {
                // If confidence is low/medium, show recommended_address as suggestion
                suggestions.push(validatedAddress);
            }
            // Use helper method to generate unit suggestions when needed
            // The helper checks for suspicious unit numbers and addressType
            if (mightNeedUnitNumber && (!address.street2 || hasSuspiciousUnitNumber)) {
                const unitSuggestions = this.generateUnitSuggestions(address, validatedAddress);
                // Add messages from helper
                if (unitSuggestions.messages.length > 0) {
                    messages.push(...unitSuggestions.messages);
                }
                // Add unit variations to suggestions
                unitSuggestions.suggestions.forEach(variation => {
                    // Only add if it's different from existing suggestions
                    const isDuplicate = suggestions.some(s => s.street1 === variation.street1 &&
                        s.street2 === variation.street2 &&
                        s.city === variation.city &&
                        s.state === variation.state &&
                        s.zip === variation.zip);
                    if (!isDuplicate) {
                        suggestions.push(variation);
                    }
                });
            }
            return {
                isValid,
                validatedAddress,
                suggestions: suggestions.length > 0 ? suggestions : undefined,
                confidence,
                messages: messages.length > 0 ? messages : undefined,
            };
        }
        catch (error) {
            console.error('Shippo address validation failed:', error);
            // If it's a network error or API unavailable, allow fallback
            if (error.message?.includes('fetch') || error.message?.includes('network')) {
                // Generate suggestions even when network fails
                const unitSuggestions = this.generateUnitSuggestions(address);
                const errorMessages = ['Address validation service unavailable. Please verify your address manually.'];
                if (unitSuggestions.shouldGenerate) {
                    errorMessages.push('However, we found multiple possible unit numbers for this address.');
                    return {
                        isValid: false,
                        validatedAddress: undefined,
                        suggestions: unitSuggestions.suggestions,
                        confidence: 'low',
                        messages: [...errorMessages, ...unitSuggestions.messages]
                    };
                }
                return {
                    isValid: false,
                    validatedAddress: undefined,
                    suggestions: [],
                    confidence: 'low',
                    messages: errorMessages
                };
            }
            throw error;
        }
    }
    /**
     * Create a shipping label
     */
    async createLabel(fromAddress, toAddress, parcel, rateId) {
        try {
            // TODO: Implement Shippo label creation
            console.log('Creating shipping label:', {
                from: fromAddress.city,
                to: toAddress.city,
                rateId
            });
            // Mock label creation
            return {
                id: `label_mock_${Date.now()}`,
                tracking_number: `1Z999AA${Math.random().toString().substr(2, 10)}`,
                label_url: 'https://shippo-delivery.s3.amazonaws.com/mock-label.pdf',
                rate: rateId
            };
        }
        catch (error) {
            console.error('Shippo label creation failed:', error);
            throw new Error('Failed to create shipping label');
        }
    }
    /**
     * Track a shipment
     */
    async trackShipment(trackingNumber, carrier) {
        try {
            // TODO: Implement Shippo tracking
            console.log('Tracking shipment:', { trackingNumber, carrier });
            // Mock tracking info
            return {
                tracking_number: trackingNumber,
                carrier,
                tracking_status: 'DELIVERED',
                tracking_history: [
                    {
                        status: 'TRANSIT',
                        status_details: 'Package is in transit',
                        datetime: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
                        location: { city: 'Austin', state: 'TX' }
                    },
                    {
                        status: 'DELIVERED',
                        status_details: 'Package delivered',
                        datetime: new Date().toISOString(),
                        location: { city: 'New York', state: 'NY' }
                    }
                ]
            };
        }
        catch (error) {
            console.error('Shippo tracking failed:', error);
            throw new Error('Failed to track shipment');
        }
    }
    /**
     * Format address for Shippo API
     */
    formatAddressForShippo(address) {
        return {
            name: address.name || 'Customer',
            street1: address.street1,
            street2: address.street2 || '',
            city: address.city,
            state: address.state,
            zip: address.zip,
            country: address.country || 'US',
            phone: address.phone || ''
        };
    }
    /**
     * Determine rate attributes (CHEAPEST, FASTEST, etc.)
     */
    determineRateAttributes(rate, allRates) {
        const attributes = [];
        if (!allRates || allRates.length === 0)
            return attributes;
        const amounts = allRates.map(r => parseFloat(r.amount)).filter(a => !isNaN(a));
        const minAmount = Math.min(...amounts);
        // Mark cheapest rate
        if (parseFloat(rate.amount) === minAmount) {
            attributes.push('CHEAPEST');
        }
        // Mark fastest rate (lowest estimated days)
        const estimatedDays = this.parseEstimatedDays(rate.estimated_days || rate.duration_terms);
        if (estimatedDays <= 2) {
            attributes.push('FASTEST');
        }
        return attributes;
    }
    /**
     * Parse estimated days from various formats
     */
    parseEstimatedDays(daysStr) {
        if (!daysStr)
            return 7; // Default
        // Extract first number from strings like "2-3", "1 day", "3 business days"
        const match = daysStr.match(/(\d+)/);
        return match ? parseInt(match[1]) : 7;
    }
    /**
     * Get enhanced mock rates with realistic pricing
     */
    getEnhancedMockRates(parcels, toAddress) {
        const baseRate = this.calculateBaseRate(parcels, toAddress);
        return [
            {
                id: 'usps_ground_advantage',
                provider: 'USPS',
                serviceName: 'Ground Advantage',
                amount: baseRate.toFixed(2),
                currency: 'USD',
                estimatedDays: '5-7',
                attributes: ['CHEAPEST']
            },
            {
                id: 'usps_priority',
                provider: 'USPS',
                serviceName: 'Priority Mail',
                amount: (baseRate + 4.50).toFixed(2),
                currency: 'USD',
                estimatedDays: '2-3',
                attributes: ['FASTEST']
            },
            {
                id: 'fedex_ground',
                provider: 'FedEx',
                serviceName: 'Ground',
                amount: (baseRate + 2.00).toFixed(2),
                currency: 'USD',
                estimatedDays: '4-6',
                attributes: []
            }
        ];
    }
    /**
     * Calculate base shipping rate based on parcels and destination
     */
    calculateBaseRate(parcels, toAddress) {
        // Simple rate calculation based on weight and distance
        const totalWeight = parcels.reduce((sum, parcel) => {
            return sum + parseFloat(parcel.weight);
        }, 0);
        let baseRate = 5.00; // Base rate
        // Weight-based pricing
        if (totalWeight > 2) {
            baseRate += (totalWeight - 2) * 1.50;
        }
        // Zone-based pricing (mock)
        const isCoastal = ['CA', 'NY', 'FL', 'WA'].includes(toAddress.state);
        if (isCoastal) {
            baseRate += 2.00;
        }
        return Math.max(baseRate, 6.50); // Minimum rate
    }
    /**
     * Calculate packaging for cart items based on quantity and product dimensions
     */
    calculatePackaging(cartItems) {
        const parcels = [];
        // Calculate total bottles
        const totalBottles = cartItems.reduce((sum, item) => {
            // For 12-pack products, multiply by 12
            const bottleCount = item.product.packageSize === 'twelve_pack'
                ? item.quantity * 12
                : item.quantity;
            return sum + bottleCount;
        }, 0);
        console.log(`Calculating packaging for ${totalBottles} bottles`);
        if (totalBottles === 0) {
            return parcels;
        }
        // Packaging logic based on total bottle count
        if (totalBottles === 1) {
            // 1 bottle: 2" x 2" x 4" box, total weight 0.0066 lbs
            parcels.push({
                length: '2.0',
                width: '2.0',
                height: '4.0',
                weight: '0.0066',
                distance_unit: 'in',
                mass_unit: 'lb'
            });
        }
        else if (totalBottles <= 6) {
            // 2-6 bottles: 4" x 4" x 8" box
            const bottleWeight = totalBottles * 0.0022;
            const packagingWeight = 0.0044;
            const totalWeight = bottleWeight + packagingWeight;
            parcels.push({
                length: '4.0',
                width: '4.0',
                height: '8.0',
                weight: totalWeight.toFixed(4),
                distance_unit: 'in',
                mass_unit: 'lb'
            });
        }
        else if (totalBottles <= 11) {
            // 7-11 bottles: 6" x 4" x 8" box
            const bottleWeight = totalBottles * 0.0022;
            const packagingWeight = 0.0066;
            const totalWeight = bottleWeight + packagingWeight;
            parcels.push({
                length: '6.0',
                width: '4.0',
                height: '8.0',
                weight: totalWeight.toFixed(4),
                distance_unit: 'in',
                mass_unit: 'lb'
            });
        }
        else {
            // 12+ bottles: Use 12-pack boxes
            let remainingBottles = totalBottles;
            while (remainingBottles > 0) {
                if (remainingBottles >= 12) {
                    // Full 12-pack box: 6.5" x 5" x 3.5"
                    const bottleWeight = 12 * 0.0022;
                    const packagingWeight = 0.01;
                    const totalWeight = bottleWeight + packagingWeight;
                    parcels.push({
                        length: '6.5',
                        width: '5.0',
                        height: '3.5',
                        weight: totalWeight.toFixed(4),
                        distance_unit: 'in',
                        mass_unit: 'lb'
                    });
                    remainingBottles -= 12;
                }
                else if (remainingBottles === 1) {
                    // Single bottle box
                    parcels.push({
                        length: '2.0',
                        width: '2.0',
                        height: '4.0',
                        weight: '0.0066',
                        distance_unit: 'in',
                        mass_unit: 'lb'
                    });
                    remainingBottles = 0;
                }
                else {
                    // 2-11 remaining bottles: use appropriate smaller box
                    if (remainingBottles <= 6) {
                        const bottleWeight = remainingBottles * 0.0022;
                        const packagingWeight = 0.0044;
                        const totalWeight = bottleWeight + packagingWeight;
                        parcels.push({
                            length: '4.0',
                            width: '4.0',
                            height: '8.0',
                            weight: totalWeight.toFixed(4),
                            distance_unit: 'in',
                            mass_unit: 'lb'
                        });
                    }
                    else {
                        const bottleWeight = remainingBottles * 0.0022;
                        const packagingWeight = 0.0066;
                        const totalWeight = bottleWeight + packagingWeight;
                        parcels.push({
                            length: '6.0',
                            width: '4.0',
                            height: '8.0',
                            weight: totalWeight.toFixed(4),
                            distance_unit: 'in',
                            mass_unit: 'lb'
                        });
                    }
                    remainingBottles = 0;
                }
            }
        }
        console.log(`Created ${parcels.length} parcels for ${totalBottles} bottles:`, parcels.map(p => `${p.length}"x${p.width}"x${p.height}" (${p.weight}lbs)`));
        return parcels;
    }
    /**
     * Get standard parcel dimensions for products (deprecated - use calculatePackaging instead)
     */
    getStandardParcels() {
        return {
            single: {
                length: '2.0',
                width: '2.0',
                height: '4.0',
                weight: '0.0066',
                distance_unit: 'in',
                mass_unit: 'lb'
            },
            pack: {
                length: '6.5',
                width: '5.0',
                height: '3.5',
                weight: '0.0364', // 12 bottles + packaging
                distance_unit: 'in',
                mass_unit: 'lb'
            }
        };
    }
}
exports.default = new ShippoService();
