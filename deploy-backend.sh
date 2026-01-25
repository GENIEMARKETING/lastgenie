#!/bin/bash

# LastGenie Backend Deployment Script for AWS Lightsail
# This script sets up the Node.js backend on Ubuntu Lightsail instance

set -e  # Exit on any error

echo "🚀 Starting LastGenie Backend Deployment..."

# Update system packages
echo "📦 Updating system packages..."
sudo apt update && sudo apt upgrade -y

# Install Node.js 18.x (LTS)
echo "📦 Installing Node.js..."
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install PM2 for process management
echo "📦 Installing PM2..."
sudo npm install -g pm2

# Install Git if not present
echo "📦 Installing Git..."
sudo apt-get install -y git

# Create application directory
echo "📁 Creating application directory..."
sudo mkdir -p /opt/lastgenie
sudo chown ubuntu:ubuntu /opt/lastgenie
cd /opt/lastgenie

# Clone the repository
echo "📥 Cloning repository..."
if [ -d ".git" ]; then
    echo "Repository already exists, pulling latest changes..."
    git pull origin main
else
    git clone https://github.com/vinnyfds/lastgenie.git .
fi

# Navigate to server directory
cd server

# Install dependencies
echo "📦 Installing server dependencies..."
npm ci --production

# Create environment file
echo "⚙️  Creating environment configuration..."
cat > .env << EOF
# Database Configuration
DATABASE_URL="postgresql://lastgenieadmin:PASSWORD@ls-eb2baf4686cb617bdb965231f89c0477f759e1d0.cgl4acs00ai2.us-east-1.rds.amazonaws.com:5432/postgres"

# Server Configuration
PORT=3001
NODE_ENV=production

# Frontend URL (for CORS)
CLIENT_URL=https://lastgenie.com

# JWT Secrets (you should change these)
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_REFRESH_SECRET=your-super-secret-refresh-key-change-this-in-production

# Stripe Configuration (add your keys)
STRIPE_SECRET_KEY=sk_test_your_stripe_secret_key
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret

# Email Configuration (add your SMTP settings)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password

# Other API Keys (add as needed)
SHIPPO_API_TOKEN=your_shippo_token
USPS_USER_ID=your_usps_user_id
EOF

echo "⚠️  IMPORTANT: You need to update the .env file with your actual credentials!"
echo "📝 Edit /opt/lastgenie/server/.env with your database password and API keys"

# Build the application
echo "🔨 Building the application..."
npm run build

# Set up PM2 ecosystem file
echo "⚙️  Setting up PM2 configuration..."
cat > ecosystem.config.js << EOF
module.exports = {
  apps: [{
    name: 'lastgenie-api',
    script: 'dist/server.js',
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    env: {
      NODE_ENV: 'production',
      PORT: 3001
    },
    error_file: '/var/log/pm2/lastgenie-api-error.log',
    out_file: '/var/log/pm2/lastgenie-api-out.log',
    log_file: '/var/log/pm2/lastgenie-api.log'
  }]
};
EOF

# Create log directory
sudo mkdir -p /var/log/pm2
sudo chown ubuntu:ubuntu /var/log/pm2

# Start the application with PM2
echo "🚀 Starting the application..."
pm2 start ecosystem.config.js
pm2 save
pm2 startup

echo "✅ Backend deployment completed!"
echo ""
echo "📋 Next Steps:"
echo "1. Update /opt/lastgenie/server/.env with your actual database password"
echo "2. Add your Stripe, SMTP, and other API keys to the .env file"
echo "3. Run: pm2 restart lastgenie-api"
echo "4. Test the API: curl http://localhost:3001/api/products"
echo ""
echo "📊 Useful PM2 commands:"
echo "- pm2 status                 # Check application status"
echo "- pm2 logs lastgenie-api     # View logs"
echo "- pm2 restart lastgenie-api  # Restart application"
echo "- pm2 stop lastgenie-api     # Stop application"