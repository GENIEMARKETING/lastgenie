# LastGenie Deployment Guide

## Current Status ✅

### ✅ Frontend (AWS Amplify)
- **Status**: Fixed and deployed
- **URL**: https://lastgenie.com
- **Configuration**: Static export working correctly
- **Environment Variables**: Set to point to Lightsail backend

### ✅ Database (AWS Lightsail PostgreSQL)
- **Status**: Running and accessible
- **Endpoint**: `ls-eb2baf4686cb617bdb965231f89c0477f759e1d0.cgl4acs00ai2.us-east-1.rds.amazonaws.com`
- **Port**: 5432
- **Username**: `lastgenieadmin`
- **Database**: `postgres`

### ❌ Backend (AWS Lightsail Instance)
- **Status**: Instance running but Node.js server not deployed
- **Instance**: `lastgenie-api` (34.199.142.70)
- **Issue**: Backend code needs to be deployed and started

---

## Immediate Next Steps

### Step 1: Deploy Backend to Lightsail

You need to SSH into your Lightsail instance and set up the backend. Here's how:

#### Option A: Use Lightsail Browser SSH (Recommended)
1. Go to [AWS Lightsail Console](https://lightsail.aws.amazon.com/)
2. Click on your `lastgenie-api` instance
3. Click "Connect using SSH" (browser-based terminal)
4. Run the deployment commands below

#### Option B: Use Terminal SSH
```bash
# Download the SSH key from Lightsail console, then:
ssh -i /path/to/your/key.pem ubuntu@34.199.142.70
```

### Step 2: Backend Deployment Commands

Once connected to your Lightsail instance, run these commands:

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js 18.x
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install PM2 and Git
sudo npm install -g pm2
sudo apt-get install -y git

# Create app directory
sudo mkdir -p /opt/lastgenie
sudo chown ubuntu:ubuntu /opt/lastgenie
cd /opt/lastgenie

# Clone your repository
git clone https://github.com/vinnyfds/lastgenie.git .
cd server

# Install dependencies
npm ci --production

# Create environment file
cat > .env << 'EOF'
DATABASE_URL="postgresql://lastgenieadmin:YOUR_DB_PASSWORD@ls-eb2baf4686cb617bdb965231f89c0477f759e1d0.cgl4acs00ai2.us-east-1.rds.amazonaws.com:5432/postgres"
PORT=3001
NODE_ENV=production
CLIENT_URL=https://lastgenie.com
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_REFRESH_SECRET=your-super-secret-refresh-key-change-this-in-production
EOF

# Build the application
npm run build

# Start with PM2
pm2 start dist/server.js --name lastgenie-api
pm2 save
pm2 startup
```

### Step 3: Update Environment File

**IMPORTANT**: You need to replace `YOUR_DB_PASSWORD` in the `.env` file with your actual PostgreSQL password.

```bash
# Edit the environment file
nano /opt/lastgenie/server/.env

# Update the DATABASE_URL with your real password
# Then restart the service
pm2 restart lastgenie-api
```

### Step 4: Test Backend

```bash
# Check if the server is running
pm2 status

# Test the API locally
curl http://localhost:3001/api/products

# Check logs if there are issues
pm2 logs lastgenie-api
```

### Step 5: Seed Database

Once the backend is running, you can seed the database:

```bash
cd /opt/lastgenie/server
npm run db:migrate  # Run database migrations
npm run db:seed     # Seed with initial data
```

---

## Database Connection Details

To connect to your PostgreSQL database directly:

```bash
# From your local machine or the Lightsail instance
psql -h ls-eb2baf4686cb617bdb965231f89c0477f759e1d0.cgl4acs00ai2.us-east-1.rds.amazonaws.com \
     -p 5432 \
     -U lastgenieadmin \
     -d postgres
```

---

## Troubleshooting

### Backend Not Responding
1. Check PM2 status: `pm2 status`
2. Check logs: `pm2 logs lastgenie-api`
3. Check if port 3001 is open: `netstat -tlnp | grep :3001`
4. Restart service: `pm2 restart lastgenie-api`

### Database Connection Issues
1. Verify credentials in `.env` file
2. Test connection: `psql -h [endpoint] -U lastgenieadmin -d postgres`
3. Check database logs in AWS Lightsail console

### Frontend Not Loading Data
1. Check browser console for API errors
2. Verify `NEXT_PUBLIC_API_URL` in Amplify environment variables
3. Test API directly: `curl http://34.199.142.70:3001/api/products`

---

## Expected Results After Setup

Once everything is deployed:

✅ **Frontend**: https://lastgenie.com loads properly
✅ **Products**: Shop page shows 4 products (2 single, 2 12-packs)
✅ **API**: Backend responds at http://34.199.142.70:3001
✅ **Database**: Contains seeded products and admin users

---

## Next Steps After Backend Deployment

1. **Create Content**: Log into admin panel to create blog posts
2. **Add Reviews**: Customers can leave reviews (becomes testimonials)
3. **Configure APIs**: Add Stripe, SMTP, and other service keys
4. **SSL Setup**: Consider setting up SSL for the backend API
5. **Domain Setup**: Point api.lastgenie.com to your Lightsail instance

---

## Files Created

- `deploy-backend.sh` - Automated deployment script
- `DEPLOYMENT_GUIDE.md` - This guide
- Updated Amplify environment variables
- Fixed static export configuration