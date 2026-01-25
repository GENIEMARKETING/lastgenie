#!/bin/bash
# Quick deployment script for LastGenie backend

# Update and install Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs git
sudo npm install -g pm2

# Setup application
sudo mkdir -p /opt/lastgenie
sudo chown ubuntu:ubuntu /opt/lastgenie
cd /opt/lastgenie

# Clone repository
git clone https://github.com/vinnyfds/lastgenie.git .
cd server

# Install dependencies
npm ci --production

# Create basic environment file (needs password update)
cat > .env << 'EOF'
DATABASE_URL="postgresql://lastgenieadmin:CHANGE_THIS_PASSWORD@ls-eb2baf4686cb617bdb965231f89c0477f759e1d0.cgl4acs00ai2.us-east-1.rds.amazonaws.com:5432/postgres"
PORT=3001
NODE_ENV=production
CLIENT_URL=https://lastgenie.com
JWT_SECRET=temp-secret-change-in-production
JWT_REFRESH_SECRET=temp-refresh-secret-change-in-production
EOF

# Build application
npm run build

# Start with PM2
pm2 start dist/server.js --name lastgenie-api
pm2 save
pm2 startup

echo "Deployment complete! Remember to update the database password in /opt/lastgenie/server/.env"