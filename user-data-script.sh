#!/bin/bash

# LastGenie Backend Auto-Deploy Script
# This script runs automatically when the instance starts

exec > >(tee /var/log/user-data.log) 2>&1
echo "Starting LastGenie backend deployment at $(date)"

# Update system
apt-get update -y
apt-get upgrade -y

# Install Node.js 18.x
curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
apt-get install -y nodejs

# Install PM2 globally
npm install -g pm2

# Install Git
apt-get install -y git

# Create application directory
mkdir -p /opt/lastgenie
chown ubuntu:ubuntu /opt/lastgenie

# Switch to ubuntu user for application setup
sudo -u ubuntu bash << 'EOF'
cd /opt/lastgenie

# Clone the repository
echo "Cloning repository..."
git clone https://github.com/vinnyfds/lastgenie.git .

# Navigate to server directory
cd server

# Install dependencies
echo "Installing dependencies..."
npm ci --production

# Create environment file
echo "Creating environment configuration..."
cat > .env << 'ENVEOF'
DATABASE_URL="postgresql://lastgenieadmin:REPLACE_WITH_ACTUAL_PASSWORD@ls-eb2baf4686cb617bdb965231f89c0477f759e1d0.cgl4acs00ai2.us-east-1.rds.amazonaws.com:5432/postgres"
PORT=3001
NODE_ENV=production
CLIENT_URL=https://lastgenie.com
JWT_SECRET=temp-jwt-secret-please-change-in-production
JWT_REFRESH_SECRET=temp-refresh-secret-please-change-in-production
STRIPE_SECRET_KEY=sk_test_your_stripe_key_here
ENVEOF

# Build the application
echo "Building application..."
npm run build

# Create PM2 ecosystem file
cat > ecosystem.config.js << 'ECOEOF'
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
    }
  }]
};
ECOEOF

# Start the application
echo "Starting application with PM2..."
pm2 start ecosystem.config.js
pm2 save
pm2 startup ubuntu -u ubuntu --hp /home/ubuntu

EOF

# Set up PM2 to start on boot
env PATH=$PATH:/usr/bin /usr/lib/node_modules/pm2/bin/pm2 startup ubuntu -u ubuntu --hp /home/ubuntu

echo "LastGenie backend deployment completed at $(date)"
echo "Application should be running on port 3001"

# Test the deployment
sleep 10
curl -f http://localhost:3001 && echo "Backend is responding!" || echo "Backend not responding yet"