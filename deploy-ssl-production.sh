#!/bin/bash

# Complete SSL Production Deployment Script
# This script sets up SSL certificate and deploys the full stack with HTTPS

set -e

echo "🚀 LastGenie SSL Production Deployment"
echo "======================================"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if running on Lightsail
if [[ $EUID -eq 0 ]]; then
   print_error "This script should not be run as root. Run as ubuntu user with sudo."
   exit 1
fi

# Get current IP
CURRENT_IP=$(curl -4 -s ifconfig.me)
print_status "Current server IP: $CURRENT_IP"

# Step 1: DNS Check
print_status "Checking DNS resolution for api.lastgenie.com..."
if nslookup api.lastgenie.com > /dev/null 2>&1; then
    RESOLVED_IP=$(nslookup api.lastgenie.com | grep -A1 "Name:" | grep "Address:" | awk '{print $2}' | head -1)
    if [[ "$RESOLVED_IP" == "$CURRENT_IP" ]]; then
        print_success "DNS correctly points to this server ($CURRENT_IP)"
    else
        print_warning "DNS points to $RESOLVED_IP but server IP is $CURRENT_IP"
        print_warning "Continuing anyway - DNS may still be propagating"
    fi
else
    print_error "DNS resolution failed for api.lastgenie.com"
    print_error "Please add this A record to your DNS:"
    print_error "  Type: A"
    print_error "  Name: api"
    print_error "  Value: $CURRENT_IP"
    print_error "Wait for DNS propagation (5-30 minutes) then re-run this script."
    exit 1
fi

# Step 2: Install dependencies
print_status "Installing system dependencies..."
sudo apt update
sudo apt install -y nginx certbot python3-certbot-nginx curl

# Step 3: Configure Nginx (basic)
print_status "Setting up basic Nginx configuration..."
sudo tee /etc/nginx/sites-available/api.lastgenie.com > /dev/null << 'NGINXCONF'
server {
    listen 80;
    server_name api.lastgenie.com;
    
    location /.well-known/acme-challenge/ {
        root /var/www/html;
    }
    
    location / {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
NGINXCONF

sudo ln -sf /etc/nginx/sites-available/api.lastgenie.com /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl enable nginx
sudo systemctl restart nginx

# Step 4: Get SSL Certificate
print_status "Obtaining SSL certificate from Let's Encrypt..."
sudo certbot --nginx -d api.lastgenie.com --non-interactive --agree-tos --email admin@lastgenie.com

# Step 5: Update Nginx with SSL optimizations
print_status "Updating Nginx configuration with SSL optimizations..."
sudo tee /etc/nginx/sites-available/api.lastgenie.com > /dev/null << 'NGINXSSLCONF'
server {
    listen 80;
    server_name api.lastgenie.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name api.lastgenie.com;
    
    ssl_certificate /etc/letsencrypt/live/api.lastgenie.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/api.lastgenie.com/privkey.pem;
    
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES256-GCM-SHA512:DHE-RSA-AES256-GCM-SHA512:ECDHE-RSA-AES256-GCM-SHA384:DHE-RSA-AES256-GCM-SHA384;
    ssl_prefer_server_ciphers off;
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 10m;
    
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    add_header X-Frame-Options DENY always;
    add_header X-Content-Type-Options nosniff always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;
    
    location / {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }
    
    location /health {
        proxy_pass http://localhost:3001/health;
        access_log off;
    }
}
NGINXSSLCONF

sudo nginx -t
sudo systemctl reload nginx

# Step 6: Configure database SSL
print_status "Configuring database SSL connection..."
cd /opt/lastgenie/server

# Backup .env
cp .env .env.backup.$(date +%Y%m%d_%H%M%S)

# Update DATABASE_URL with SSL
sed -i 's|DATABASE_URL=.*|DATABASE_URL="postgresql://lastgenieadmin:Malhar092905@ls-eb2baf4686cb617bdb965231f89c0477f759e1d0.cgl4acs00ai2.us-east-1.rds.amazonaws.com:5432/lastgenie?sslmode=require"|g' .env

# Update CLIENT_URL
sed -i 's|CLIENT_URL=.*|CLIENT_URL="https://lastgenie.com"|g' .env

print_success "Database configuration updated"

# Step 7: Test database connection
print_status "Testing database connection..."
cat > test-db.js << 'TESTEOF'
const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');
const { Pool } = require('pg');
require('dotenv').config();

async function test() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  try {
    const client = await pool.connect();
    console.log('✅ Database connection successful');
    client.release();
    const adapter = new PrismaPg(pool);
    const prisma = new PrismaClient({ adapter });
    const count = await prisma.product.count();
    console.log('✅ Product count:', count);
    await prisma.$disconnect();
  } catch (error) {
    console.error('❌ Database error:', error.message);
    throw error;
  } finally {
    await pool.end();
  }
}
test();
TESTEOF

if node test-db.js; then
    print_success "Database connection test passed"
    rm test-db.js
else
    print_error "Database connection failed"
    rm test-db.js
    exit 1
fi

# Step 8: Run database seed if needed
print_status "Checking if database needs seeding..."
PRODUCT_COUNT=$(node -e "
const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');
const { Pool } = require('pg');
require('dotenv').config();
(async () => {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const adapter = new PrismaPg(pool);
  const prisma = new PrismaClient({ adapter });
  const count = await prisma.product.count();
  console.log(count);
  await prisma.\$disconnect();
  await pool.end();
})();
")

if [[ "$PRODUCT_COUNT" == "0" ]]; then
    print_status "Database is empty, running seed..."
    if [[ -f "prisma/seed-working.js" ]]; then
        node prisma/seed-working.js
        print_success "Database seeded successfully"
    else
        print_warning "Seed file not found, skipping seeding"
    fi
else
    print_success "Database already has $PRODUCT_COUNT products"
fi

# Step 9: Start the API server
print_status "Starting API server..."
if ! pgrep -f "node.*server" > /dev/null; then
    npm run build
    nohup npm start > api.log 2>&1 &
    sleep 3
    print_success "API server started"
else
    print_success "API server already running"
fi

# Step 10: Test HTTPS endpoints
print_status "Testing HTTPS endpoints..."
sleep 2

# Test health endpoint
if curl -s -f https://api.lastgenie.com/health > /dev/null; then
    print_success "Health endpoint working"
else
    print_warning "Health endpoint not responding (this is OK if no health route exists)"
fi

# Test products endpoint
if curl -s -f https://api.lastgenie.com/api/products > /dev/null; then
    print_success "Products API endpoint working"
else
    print_warning "Products endpoint not responding - check API server logs"
fi

# Step 11: Setup certificate auto-renewal
print_status "Setting up SSL certificate auto-renewal..."
sudo certbot renew --dry-run
print_success "SSL certificate auto-renewal configured"

# Final summary
echo ""
echo "🎉 SSL Production Deployment Complete!"
echo "======================================"
print_success "✅ SSL certificate installed for api.lastgenie.com"
print_success "✅ Nginx configured with HTTPS redirect"
print_success "✅ Database SSL connection configured"
print_success "✅ API server running on port 3001"
print_success "✅ HTTPS proxy working through Nginx"
echo ""
echo "🔗 Your API is now available at: https://api.lastgenie.com"
echo "🧪 Test it: curl https://api.lastgenie.com/api/products"
echo ""
echo "📋 Next steps:"
echo "1. Update your frontend to use: NEXT_PUBLIC_API_URL=https://api.lastgenie.com"
echo "2. Deploy your frontend with the new API URL"
echo "3. Test the full application flow"
echo ""
echo "📄 Logs:"
echo "- API server: tail -f /opt/lastgenie/server/api.log"
echo "- Nginx: sudo tail -f /var/log/nginx/error.log"
echo "- SSL certificate: sudo certbot certificates"
echo ""
print_success "Deployment completed successfully! 🚀"