# 🚀 LastGenie SSL Production Deployment Guide

## ✅ Completed Steps

### 1. DNS Configuration ✅
- **A Record Added**: `api.lastgenie.com` → `70.126.130.5`
- **Status**: Active and verified
- **TTL**: 300 seconds (5 minutes)
- **Verification**: `dig +short api.lastgenie.com` returns `70.126.130.5`

### 2. Scripts Created ✅
- `add-dns-record.sh` - Route 53 DNS management ✅ **COMPLETED**
- `deploy-ssl-production.sh` - Complete SSL setup script
- `setup-ssl.sh` - Basic SSL certificate setup
- `fix-database-ssl.sh` - Database SSL configuration
- `client/.env.production` - Frontend production environment

## 🎯 Next Steps

### Step 1: Deploy SSL Certificate on Lightsail

Copy and run the deployment script on your Lightsail instance:

```bash
# Copy the script to Lightsail
scp deploy-ssl-production.sh ubuntu@70.126.130.5:/home/ubuntu/

# SSH to Lightsail
ssh ubuntu@70.126.130.5

# Run the deployment script
chmod +x deploy-ssl-production.sh
./deploy-ssl-production.sh
```

### Step 2: Verify SSL Setup

After the script completes, verify:

```bash
# Test HTTPS endpoint
curl https://api.lastgenie.com/health

# Test API endpoint
curl https://api.lastgenie.com/api/products

# Check SSL certificate
openssl s_client -connect api.lastgenie.com:443 -servername api.lastgenie.com < /dev/null
```

### Step 3: Deploy Frontend

Your frontend is already configured with the production environment:

```bash
# In client directory
cd client
npm run build

# Deploy to AWS Amplify (it will use .env.production automatically)
```

## 🔧 What the Deployment Script Does

1. **Installs Dependencies**: Nginx, Certbot, SSL tools
2. **Configures Nginx**: Basic HTTP proxy to Node.js
3. **Gets SSL Certificate**: Let's Encrypt certificate for `api.lastgenie.com`
4. **Updates Nginx**: HTTPS with security headers and HTTP→HTTPS redirect
5. **Configures Database**: Updates DATABASE_URL with proper SSL settings
6. **Tests Connections**: Verifies database and API endpoints
7. **Seeds Database**: Runs database seed if needed
8. **Starts API Server**: Builds and starts the Node.js API
9. **Verifies HTTPS**: Tests all endpoints work with SSL
10. **Sets Up Auto-Renewal**: Configures SSL certificate auto-renewal

## 🌐 Final URLs

After deployment:
- **API Endpoint**: `https://api.lastgenie.com`
- **Frontend**: `https://lastgenie.com` (AWS Amplify)
- **Admin Panel**: `https://lastgenie.com/admin`

## 🔐 SSL Certificate Details

- **Provider**: Let's Encrypt (Free)
- **Auto-Renewal**: Configured via Certbot
- **Security**: TLS 1.2/1.3 with modern cipher suites
- **Headers**: HSTS, X-Frame-Options, CSP, etc.

## 📊 Database Configuration

- **Connection**: PostgreSQL with SSL (`sslmode=require`)
- **Endpoint**: Lightsail managed database
- **SSL**: Proper certificate validation
- **Performance**: Connection pooling enabled

## 🧪 Testing Commands

```bash
# Test DNS resolution
dig +short api.lastgenie.com

# Test SSL certificate
curl -I https://api.lastgenie.com

# Test API endpoints
curl https://api.lastgenie.com/api/products
curl https://api.lastgenie.com/health

# Check SSL grade
curl -s "https://api.ssllabs.com/api/v3/analyze?host=api.lastgenie.com&publish=off"
```

## 📝 Logs and Monitoring

```bash
# API server logs
tail -f /opt/lastgenie/server/api.log

# Nginx logs
sudo tail -f /var/log/nginx/error.log
sudo tail -f /var/log/nginx/access.log

# SSL certificate status
sudo certbot certificates

# System status
sudo systemctl status nginx
sudo systemctl status api.service  # If using systemd service
```

## 🔄 Maintenance

### SSL Certificate Renewal
- **Automatic**: Certbot handles renewal automatically
- **Manual Check**: `sudo certbot renew --dry-run`
- **Force Renewal**: `sudo certbot renew --force-renewal`

### API Server Management
```bash
# Restart API server
cd /opt/lastgenie/server
npm run build
pkill -f "node.*server" && nohup npm start > api.log 2>&1 &

# Or use PM2 for better process management
npm install -g pm2
pm2 start npm --name "api" -- start
pm2 startup
pm2 save
```

## 🎉 Success Indicators

✅ DNS resolves: `api.lastgenie.com` → `70.126.130.5`  
✅ SSL certificate valid and trusted  
✅ HTTPS redirect working (HTTP → HTTPS)  
✅ API endpoints responding via HTTPS  
✅ Database connection working with SSL  
✅ Frontend configured for production API  
✅ Auto-renewal configured for SSL certificate  

## 🚨 Troubleshooting

### DNS Issues
```bash
# Check DNS propagation
dig +short api.lastgenie.com @8.8.8.8
nslookup api.lastgenie.com 1.1.1.1
```

### SSL Issues
```bash
# Check certificate details
openssl s_client -connect api.lastgenie.com:443 -servername api.lastgenie.com

# Test SSL configuration
sudo nginx -t
sudo systemctl reload nginx
```

### Database Issues
```bash
# Test database connection
cd /opt/lastgenie/server
node -e "
const { Pool } = require('pg');
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
pool.query('SELECT 1').then(() => console.log('✅ DB OK')).catch(console.error);
"
```

---

**Ready to deploy!** 🚀 Run the deployment script on your Lightsail instance and you'll have a fully SSL-secured API endpoint.