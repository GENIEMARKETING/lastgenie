#!/bin/bash

# Simplified Lightsail Instance Upgrade Script
# This script creates the snapshot and new instance, then provides manual steps

set -e

echo "🚀 Lightsail Instance Upgrade Process"
echo "===================================="

CURRENT_INSTANCE_NAME="lastgenie-api-v2"
CURRENT_IP="54.173.133.123"
REGION="us-east-1"
SNAPSHOT_NAME="lastgenie-upgrade-$(date +%Y%m%d-%H%M%S)"
NEW_INSTANCE_NAME="lastgenie-api-1gb"
BUNDLE_ID="nano_2_0"  # 1 GB RAM, 1 vCPU, 40 GB SSD

echo "📋 Instance Details:"
echo "   Current: $CURRENT_INSTANCE_NAME ($CURRENT_IP)"
echo "   New: $NEW_INSTANCE_NAME"
echo "   Snapshot: $SNAPSHOT_NAME"

echo ""
echo "💾 Step 1: Creating snapshot..."
aws lightsail create-instance-snapshot \
    --instance-name "$CURRENT_INSTANCE_NAME" \
    --instance-snapshot-name "$SNAPSHOT_NAME" \
    --region "$REGION"

echo "✅ Snapshot creation started: $SNAPSHOT_NAME"

echo ""
echo "⏳ Checking snapshot status..."
while true; do
    STATUS=$(aws lightsail get-instance-snapshot \
        --instance-snapshot-name "$SNAPSHOT_NAME" \
        --region "$REGION" \
        --query "instanceSnapshot.state" \
        --output text 2>/dev/null || echo "pending")
    
    echo "   Snapshot status: $STATUS"
    
    if [[ "$STATUS" == "available" ]]; then
        echo "✅ Snapshot completed!"
        break
    elif [[ "$STATUS" == "error" ]]; then
        echo "❌ Snapshot failed!"
        exit 1
    fi
    
    echo "   Waiting 30 seconds..."
    sleep 30
done

echo ""
echo "🆕 Step 2: Creating new 1GB instance..."
aws lightsail create-instances-from-snapshot \
    --instance-names "$NEW_INSTANCE_NAME" \
    --instance-snapshot-name "$SNAPSHOT_NAME" \
    --bundle-id "$BUNDLE_ID" \
    --region "$REGION"

echo "✅ New instance creation started: $NEW_INSTANCE_NAME"

echo ""
echo "⏳ Waiting for new instance to be ready..."
while true; do
    STATUS=$(aws lightsail get-instance \
        --instance-name "$NEW_INSTANCE_NAME" \
        --region "$REGION" \
        --query "instance.state.name" \
        --output text 2>/dev/null || echo "pending")
    
    echo "   Instance status: $STATUS"
    
    if [[ "$STATUS" == "running" ]]; then
        echo "✅ New instance is running!"
        break
    elif [[ "$STATUS" == "terminated" || "$STATUS" == "stopping" ]]; then
        echo "❌ Instance creation failed!"
        exit 1
    fi
    
    echo "   Waiting 30 seconds..."
    sleep 30
done

# Get new instance IP
NEW_IP=$(aws lightsail get-instance \
    --instance-name "$NEW_INSTANCE_NAME" \
    --region "$REGION" \
    --query "instance.publicIpAddress" \
    --output text)

echo "🎉 New instance ready!"
echo "   Name: $NEW_INSTANCE_NAME"
echo "   IP: $NEW_IP"

echo ""
echo "🌐 Step 3: Updating DNS..."
aws route53 change-resource-record-sets \
    --hosted-zone-id "Z10156125SMCM3PU8LXF" \
    --change-batch "{
        \"Comment\": \"Update to upgraded instance\",
        \"Changes\": [
            {
                \"Action\": \"UPSERT\",
                \"ResourceRecordSet\": {
                    \"Name\": \"api.lastgenie.com\",
                    \"Type\": \"A\",
                    \"TTL\": 300,
                    \"ResourceRecords\": [
                        {
                            \"Value\": \"$NEW_IP\"
                        }
                    ]
                }
            }
        ]
    }" > /dev/null

echo "✅ DNS updated: api.lastgenie.com → $NEW_IP"

echo ""
echo "🎯 Next Steps:"
echo "=============="
echo "1. Wait 2-3 minutes for new instance to fully boot"
echo "2. SSH to new instance: ssh ubuntu@$NEW_IP"
echo "3. Your SSL certificate and database are preserved!"
echo "4. Test the API: curl https://api.lastgenie.com/api/products"
echo "5. Build should now work: npm run build"
echo ""
echo "🧪 Testing commands:"
echo "   ssh ubuntu@$NEW_IP"
echo "   cd /opt/lastgenie/server"
echo "   npm run build  # Should work now with 1GB RAM!"
echo "   npm start"
echo ""
echo "🗑️  After confirming everything works, delete old instance:"
echo "   aws lightsail delete-instance --instance-name $CURRENT_INSTANCE_NAME --region $REGION"
echo ""
echo "💰 Cost: \$3.50 → \$5.00/month (+\$1.50)"
echo "🎉 Upgrade completed! You now have 1GB RAM."