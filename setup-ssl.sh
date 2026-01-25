#!/bin/bash

# SSL Certificate Setup Script for api.lastgenie.com
# Run this script on your Lightsail instance after adding the DNS A record

set -e  # Exit on any error

echo "🔧 SSL Certificate Setup for api.lastgenie.com"
echo "=============================================="

# Check if running as root
if [[ $EUID -eq 0 ]]; then
   echo "❌ This script should not be run as root. Run as ubuntu user with sudo."
   exit 1
fi

# Step 1: Install Certbot
echo "📦 Installing Certbot..."
sudo apt update
sudo apt install -y certbot python3-certbot-nginx

# Step 2: Check if Nginx is installed
if ! command -v nginx &> /dev/null; then
    echo "📦 Installing Nginx..."
    sudo apt install -y nginx
fi

# Step 3: Start and enable Nginx
echo "🚀 Starting Nginx..."
sudo systemctl start nginx
sudo systemctl enable nginx

# Step 4: Create basic Nginx configuration for api.lastgenie.com
echo "⚙️  Creating basic Nginx configuration..."
sudo tee /etc/nginx/sites-available/api.lastgenie.com > /dev/null << 'NGINXCONF'
server {
    listen 80;
    server_name api.lastgenie.com;
    
    # Temporary location for Let's Encrypt verification
    location /.well-known/acme-challenge/ {
        root /var/www/html;
    }
    
    # Proxy all other requests to Node.js
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

# Step 5: Enable the site
echo "🔗 Enabling Nginx site..."
sudo ln -sf /etc/nginx/sites-available/api.lastgenie.com /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx

# Step 6: Test DNS resolution
echo "🔍 Testing DNS resolution for api.lastgenie.com..."
if nslookup api.lastgenie.com > /dev/null 2>&1; then
    echo "✅ DNS resolution successful"
else
    echo "⚠️  DNS resolution failed. Please ensure you've added the A record:"
    echo "   Type: A"
    echo "   Name: api"
    echo "   Value: $(curl -4 -s ifconfig.me)"
    echo ""
    echo "Wait a few minutes for DNS propagation, then re-run this script."
    exit 1
fi

# Step 7: Get SSL certificate
echo "🔐 Obtaining SSL certificate from Let's Encrypt..."
sudo certbot --nginx -d api.lastgenie.com --non-interactive --agree-tos --email admin@lastgenie.com

# Step 8: Test certificate renewal
echo "🔄 Testing certificate auto-renewal..."
sudo certbot renew --dry-run

# Step 9: Update Nginx configuration with SSL optimizations
echo "⚙️  Updating Nginx configuration with SSL optimizations..."
sudo tee /etc/nginx/sites-available/api.lastgenie.com > /dev/null << 'NGINXSSLCONF'
server {
    listen 80;
    server_name api.lastgenie.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name api.lastgenie.com;
    
    # SSL Configuration
    ssl_certificate /etc/letsencrypt/live/api.lastgenie.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/api.lastgenie.com/privkey.pem;
    
    # SSL Security Headers
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES256-GCM-SHA512:DHE-RSA-AES256-GCM-SHA512:ECDHE-RSA-AES256-GCM-SHA384:DHE-RSA-AES256-GCM-SHA384;
    ssl_prefer_server_ciphers off;
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 10m;
    
    # Security Headers
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    add_header X-Frame-Options DENY always;
    add_header X-Content-Type-Options nosniff always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;
    
    # Proxy to Node.js API
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
        
        # Timeouts
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }
    
    # Health check endpoint
    location /health {
        proxy_pass http://localhost:3001/health;
        access_log off;
    }
}
NGINXSSLCONF

# Step 10: Test and reload Nginx
echo "🔄 Testing and reloading Nginx configuration..."
sudo nginx -t
sudo systemctl reload nginx

# Step 11: Test HTTPS endpoint
echo "🧪 Testing HTTPS endpoint..."
sleep 2
if curl -s -o /dev/null -w "%{http_code}" https://api.lastgenie.com/health | grep -q "200\|404"; then
    echo "✅ HTTPS endpoint is working!"
else
    echo "⚠️  HTTPS endpoint test failed. Check if your Node.js API is running on port 3001."
fi

echo ""
echo "🎉 SSL Certificate setup completed!"
echo "✅ Your API is now available at: https://api.lastgenie.com"
echo ""
echo "Next steps:"
echo "1. Start your Node.js API: cd /opt/lastgenie/server && npm start"
echo "2. Test the API: curl https://api.lastgenie.com/api/products"
echo "3. Update your frontend to use https://api.lastgenie.com"
echo ""
echo "Certificate will auto-renew. Check status with: sudo certbot certificates"