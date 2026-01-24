#!/usr/bin/env node

/**
 * Address Validation Test Script
 * 
 * Tests the address validation service with a sample address.
 * Run with: node scripts/test-address-validation.js
 * 
 * This script requires the server to be running or will test the service directly.
 */

require('dotenv').config({ path: require('path').join(__dirname, '../.env') });

const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

async function testAddressValidation() {
  log('\n🧪 Testing Address Validation Service\n', 'blue');
  log('=' .repeat(60), 'blue');
  
  // Check if services are configured
  const uspsConfigured = process.env.USPS_CLIENT_ID && 
                          process.env.USPS_CLIENT_SECRET &&
                          process.env.USPS_CLIENT_ID !== 'your_usps_client_id';
  const shippoConfigured = process.env.SHIPPO_API_TOKEN && 
                            process.env.SHIPPO_API_TOKEN !== 'mock_token' &&
                            !process.env.SHIPPO_API_TOKEN.includes('your_');
  
  if (!uspsConfigured && !shippoConfigured) {
    log('\n❌ Neither USPS nor Shippo is configured.', 'red');
    log('Please run: npm run verify:address-validation', 'yellow');
    log('Then follow the setup guide: server/docs/ADDRESS_VALIDATION_SETUP.md\n', 'yellow');
    process.exit(1);
  }
  
  log('\n📋 Test Configuration:', 'blue');
  log(`USPS: ${uspsConfigured ? '✅ Configured' : '❌ Not configured'}`, uspsConfigured ? 'green' : 'red');
  log(`Shippo: ${shippoConfigured ? '✅ Configured' : '❌ Not configured'}`, shippoConfigured ? 'green' : 'red');
  
  // Test address
  const testAddress = {
    street1: '12720 university club dr',
    street2: '000', // Suspicious unit number
    city: 'Tampa',
    state: 'FL',
    postalCode: '33613',
    country: 'US',
    addressType: 'apartment'
  };
  
  log('\n📮 Test Address:', 'blue');
  log(`Street: ${testAddress.street1}`, 'blue');
  log(`Unit: ${testAddress.street2}`, 'blue');
  log(`City: ${testAddress.city}, ${testAddress.state} ${testAddress.postalCode}`, 'blue');
  log(`Type: ${testAddress.addressType}`, 'blue');
  
  log('\n🔄 Testing validation...\n', 'blue');
  
  try {
    // Test via API endpoint (server must be running)
    const apiUrl = process.env.CLIENT_URL?.replace(':3000', ':3001') || 'http://localhost:3001';
    const response = await fetch(`${apiUrl}/api/shipping/validate-address`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        address: testAddress
      })
    });
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const result = await response.json();
    
    if (result.success) {
      const data = result.data;
      
      log('✅ Validation Response Received\n', 'green');
      log('📊 Results:', 'blue');
      log(`Valid: ${data.isValid ? '✅ Yes' : '❌ No'}`, data.isValid ? 'green' : 'yellow');
      
      if (data.validatedAddress) {
        log('\n✅ Validated Address:', 'green');
        log(`   ${data.validatedAddress.street1}`, 'blue');
        if (data.validatedAddress.street2) {
          log(`   ${data.validatedAddress.street2}`, 'blue');
        }
        log(`   ${data.validatedAddress.city}, ${data.validatedAddress.state} ${data.validatedAddress.postalCode}`, 'blue');
      }
      
      if (data.suggestions && data.suggestions.length > 0) {
        log(`\n💡 Suggestions: ${data.suggestions.length} found`, 'blue');
        
        // Check if suggestions are synthetic or real
        const syntheticPatterns = ['Apt 1', 'Unit A', 'Suite 100', '#1'];
        const firstSuggestion = data.suggestions[0];
        const isSynthetic = syntheticPatterns.some(pattern => 
          firstSuggestion.street2 === pattern
        );
        
        if (isSynthetic) {
          log('⚠️  Synthetic suggestions detected (validation service may not be fully configured)', 'yellow');
          log('   These are generated patterns, not verified real addresses.', 'yellow');
        } else {
          log('✅ Real address suggestions detected!', 'green');
          log('   These are validated addresses from the validation service.', 'green');
        }
        
        log('\n   First 3 suggestions:', 'blue');
        data.suggestions.slice(0, 3).forEach((suggestion, index) => {
          log(`   ${index + 1}. ${suggestion.street1}${suggestion.street2 ? `, ${suggestion.street2}` : ''}`, 'blue');
        });
      } else {
        log('\n💡 No suggestions provided', 'yellow');
      }
      
      if (data.messages && data.messages.length > 0) {
        log('\n📝 Messages:', 'blue');
        data.messages.forEach((msg, index) => {
          const isWarning = msg.toLowerCase().includes('unavailable') || 
                           msg.toLowerCase().includes('not configured');
          log(`   ${index + 1}. ${msg}`, isWarning ? 'yellow' : 'blue');
        });
      }
      
      log('\n✅ Test completed successfully!\n', 'green');
      
    } else {
      log('❌ Validation failed:', 'red');
      log(JSON.stringify(result, null, 2), 'red');
    }
    
  } catch (error) {
    log('\n❌ Error testing address validation:', 'red');
    log(error.message, 'red');
    
    if (error.message.includes('fetch')) {
      log('\n💡 Make sure the server is running:', 'yellow');
      log('   npm run dev', 'yellow');
      log('   or', 'yellow');
      log('   pnpm dev', 'yellow');
    }
    
    log('\n');
    process.exit(1);
  }
}

testAddressValidation().catch(error => {
  log('\n❌ Unexpected error:', 'red');
  log(error.message, 'red');
  process.exit(1);
});
