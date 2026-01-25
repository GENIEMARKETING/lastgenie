#!/bin/bash

# Database SSL Configuration Fix
# Run this script on your Lightsail instance after SSL certificate is set up

set -e

echo "🔧 Fixing Database SSL Configuration"
echo "===================================="

cd /opt/lastgenie/server

# Backup current .env
echo "📄 Backing up current .env..."
cp .env .env.backup.$(date +%Y%m%d_%H%M%S)

# Update DATABASE_URL with proper SSL settings
echo "🔐 Updating DATABASE_URL with proper SSL configuration..."
sed -i 's|DATABASE_URL=.*|DATABASE_URL="postgresql://lastgenieadmin:Malhar092905@ls-eb2baf4686cb617bdb965231f89c0477f759e1d0.cgl4acs00ai2.us-east-1.rds.amazonaws.com:5432/lastgenie?sslmode=require"|g' .env

# Also update CLIENT_URL to use the new SSL endpoint
echo "🌐 Updating CLIENT_URL..."
sed -i 's|CLIENT_URL=.*|CLIENT_URL="https://lastgenie.com"|g' .env

# Verify the changes
echo "✅ Updated configuration:"
grep -E "(DATABASE_URL|CLIENT_URL)" .env

echo ""
echo "🧪 Testing database connection..."

# Create a simple test script
cat > test-db-connection.js << 'TESTEOF'
const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');
const { Pool } = require('pg');
const dotenv = require('dotenv');

dotenv.config();

async function testConnection() {
  console.log('🔍 Testing database connection with SSL...');
  
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
  });

  try {
    // Test basic connection
    const client = await pool.connect();
    console.log('✅ Database connection successful');
    client.release();

    // Test Prisma connection
    const adapter = new PrismaPg(pool);
    const prisma = new PrismaClient({ adapter });
    
    const result = await prisma.$queryRaw`SELECT 1 as test`;
    console.log('✅ Prisma connection successful:', result);
    
    // Test product count
    const count = await prisma.product.count();
    console.log('✅ Product count:', count);
    
    await prisma.$disconnect();
    await pool.end();
    
    console.log('🎉 Database connection test passed!');
    
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
    await pool.end();
    process.exit(1);
  }
}

testConnection();
TESTEOF

# Run the test
echo "🚀 Running database connection test..."
node test-db-connection.js

# Clean up test file
rm test-db-connection.js

echo ""
echo "🎉 Database SSL configuration completed!"
echo "✅ DATABASE_URL updated with proper SSL settings"
echo "✅ Database connection verified"
echo ""
echo "Now you can run the database seed:"
echo "  node prisma/seed-working.js"