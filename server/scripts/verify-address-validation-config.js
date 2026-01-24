#!/usr/bin/env node

/**
 * Address Validation Configuration Verification Script
 * 
 * This script checks if address validation services are properly configured.
 * Run with: node scripts/verify-address-validation-config.js
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

function checkEnvVar(name, description, required = true) {
  const value = process.env[name];
  const isSet = value && value !== '' && value !== `your_${name.toLowerCase()}`;
  
  if (required && !isSet) {
    log(`❌ ${name}: NOT SET - ${description}`, 'red');
    return false;
  } else if (!required && !isSet) {
    log(`⚠️  ${name}: NOT SET (Optional) - ${description}`, 'yellow');
    return true;
  } else if (value === `your_${name.toLowerCase()}` || value.includes('your_')) {
    log(`⚠️  ${name}: PLACEHOLDER VALUE - Please replace with actual credentials`, 'yellow');
    return false;
  } else {
    log(`✅ ${name}: SET - ${description}`, 'green');
    // Mask sensitive values
    const masked = value.length > 8 
      ? `${value.substring(0, 4)}...${value.substring(value.length - 4)}`
      : '***';
    log(`   Value: ${masked}`, 'blue');
    return true;
  }
}

function main() {
  log('\n🔍 Address Validation Configuration Check\n', 'blue');
  log('=' .repeat(60), 'blue');
  
  let allGood = true;
  
  // Check USPS Configuration
  log('\n📮 USPS Address Validation API:', 'blue');
  log('-'.repeat(60));
  const uspsClientId = checkEnvVar(
    'USPS_CLIENT_ID',
    'Get from https://developers.usps.com/ - Register an application'
  );
  const uspsClientSecret = checkEnvVar(
    'USPS_CLIENT_SECRET',
    'Get from https://developers.usps.com/ - Register an application'
  );
  const uspsBaseUrl = checkEnvVar(
    'USPS_BASE_URL',
    'Should be https://apis-tem.usps.com (testing) or https://apis.usps.com (production)',
    false
  );
  
  if (!uspsClientId || !uspsClientSecret) {
    allGood = false;
    log('\n⚠️  USPS is not fully configured. Address validation will fall back to Shippo.', 'yellow');
  }
  
  // Check Shippo Configuration
  log('\n📦 Shippo API (Fallback):', 'blue');
  log('-'.repeat(60));
  const shippoToken = checkEnvVar(
    'SHIPPO_API_TOKEN',
    'Get from https://apps.goshippo.com/api/',
    false
  );
  
  if (!shippoToken) {
    log('\n⚠️  Shippo is not configured. Only USPS will be used.', 'yellow');
  }
  
  // Summary
  log('\n' + '='.repeat(60), 'blue');
  log('\n📊 Summary:', 'blue');
  
  const uspsConfigured = uspsClientId && uspsClientSecret;
  const shippoConfigured = shippoToken;
  
  if (uspsConfigured && shippoConfigured) {
    log('✅ Both USPS and Shippo are configured. Address validation is fully operational!', 'green');
  } else if (uspsConfigured) {
    log('✅ USPS is configured. Address validation will work with USPS.', 'green');
    log('⚠️  Shippo is not configured (optional fallback).', 'yellow');
  } else if (shippoConfigured) {
    log('⚠️  USPS is not configured. Address validation will use Shippo only.', 'yellow');
    log('💡 Consider configuring USPS for free, official USPS address validation.', 'blue');
  } else {
    log('❌ Neither USPS nor Shippo is configured.', 'red');
    log('❌ Address validation will not work. Synthetic suggestions will be shown.', 'red');
    allGood = false;
  }
  
  // Next Steps
  if (!allGood) {
    log('\n📝 Next Steps:', 'blue');
    if (!uspsConfigured) {
      log('1. Sign up at https://developers.usps.com/', 'yellow');
      log('2. Register a new application', 'yellow');
      log('3. Get Client ID and Client Secret', 'yellow');
      log('4. Add them to server/.env file:', 'yellow');
      log('   USPS_CLIENT_ID="your_client_id"', 'yellow');
      log('   USPS_CLIENT_SECRET="your_client_secret"', 'yellow');
    }
    if (!shippoConfigured) {
      log('5. Sign up at https://apps.goshippo.com/api/', 'yellow');
      log('6. Get your API token', 'yellow');
      log('7. Add to server/.env file:', 'yellow');
      log('   SHIPPO_API_TOKEN="your_token"', 'yellow');
    }
    log('8. Restart your server after updating .env', 'yellow');
  }
  
  log('\n' + '='.repeat(60) + '\n', 'blue');
  
  process.exit(allGood ? 0 : 1);
}

main();
