#!/bin/bash

echo "🚀 Deploying TypeScript fixes to Lightsail instance..."

# Your Lightsail instance IP
LIGHTSAIL_IP="54.144.208.140"

# Copy the fix scripts to the instance
echo "📤 Copying fix scripts..."
scp fix-typescript-errors-comprehensive.js ubuntu@${LIGHTSAIL_IP}:/opt/lastgenie/
scp fix-imports-and-types.js ubuntu@${LIGHTSAIL_IP}:/opt/lastgenie/

# Connect and run the fixes
echo "🔧 Running TypeScript fixes on remote instance..."
ssh ubuntu@${LIGHTSAIL_IP} << 'REMOTE_COMMANDS'

cd /opt/lastgenie

echo "🔧 Running comprehensive TypeScript fixes..."
node fix-typescript-errors-comprehensive.js

echo "🔧 Running specific import and type fixes..."
node fix-imports-and-types.js

echo "🏗️ Attempting to build the server..."
cd server
npm run build

if [ $? -eq 0 ]; then
    echo "✅ Build successful! Starting the server..."
    
    # Kill any existing processes
    pkill -f "node.*server" 2>/dev/null || true
    
    # Start the server
    nohup npm start > ../api.log 2>&1 &
    
    # Wait a moment for startup
    sleep 3
    
    # Check if it's running
    if pgrep -f "node.*server" > /dev/null; then
        echo "✅ API server started successfully"
        echo "📋 Server PID: $(pgrep -f 'node.*server')"
        
        # Test the API
        echo "🧪 Testing API endpoint..."
        curl -s https://api.lastgenie.com/api/products | head -100
        
        echo ""
        echo "🎉 Deployment complete!"
        echo "🔗 API: https://api.lastgenie.com"
        echo "📊 Products: https://api.lastgenie.com/api/products"
    else
        echo "❌ Server failed to start. Check logs:"
        tail -20 ../api.log
    fi
else
    echo "❌ Build failed. There may be additional TypeScript errors to fix."
    echo "📄 Check the build output above for remaining issues."
fi

REMOTE_COMMANDS

echo "🏁 Deployment script completed!"