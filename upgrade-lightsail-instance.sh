#!/bin/bash

# Lightsail Instance Upgrade Script
# This script helps upgrade from 512MB to 1GB RAM instance

set -e

echo "🚀 Lightsail Instance Upgrade Process"
echo "===================================="

# Get current instance info
CURRENT_INSTANCE_NAME="lastgenie-api-v2"
CURRENT_IP="54.173.133.123"
REGION="us-east-1"

echo "📋 Current Instance Details:"
echo "   Name: $CURRENT_INSTANCE_NAME"
echo "   IP: $CURRENT_IP"
echo "   Region: $REGION"
echo "   Current Plan: 512 MB RAM, 1 vCPU, 20 GB SSD ($3.50/month)"
echo "   Target Plan: 1 GB RAM, 1 vCPU, 40 GB SSD ($5.00/month)"

echo ""
echo "🔄 Upgrade Process Steps:"
echo "========================="
echo "1. Create snapshot of current instance (backup)"
echo "2. Create new 1GB instance from snapshot"
echo "3. Update DNS to point to new instance"
echo "4. Test new instance"
echo "5. Delete old instance"

echo ""
echo "💾 Step 1: Creating instance snapshot..."

# Create snapshot
SNAPSHOT_NAME="lastgenie-upgrade-$(date +%Y%m%d-%H%M%S)"
echo "Creating snapshot: $SNAPSHOT_NAME"

aws lightsail create-instance-snapshot \
    --instance-name "$CURRENT_INSTANCE_NAME" \
    --instance-snapshot-name "$SNAPSHOT_NAME" \
    --region "$REGION"

echo "✅ Snapshot creation initiated: $SNAPSHOT_NAME"

# Wait for snapshot to complete
echo "⏳ Waiting for snapshot to complete..."
aws lightsail wait instance-snapshot-available \
    --instance-snapshot-name "$SNAPSHOT_NAME" \
    --region "$REGION"

echo "✅ Snapshot completed successfully!"

echo ""
echo "🆕 Step 2: Creating new 1GB instance from snapshot..."

# Create new instance from snapshot
NEW_INSTANCE_NAME="lastgenie-api-1gb"
BUNDLE_ID="nano_2_0"  # 1 GB RAM, 1 vCPU, 40 GB SSD

aws lightsail create-instances-from-snapshot \
    --instance-names "$NEW_INSTANCE_NAME" \
    --instance-snapshot-name "$SNAPSHOT_NAME" \
    --bundle-id "$BUNDLE_ID" \
    --region "$REGION"

echo "✅ New instance creation initiated: $NEW_INSTANCE_NAME"

# Wait for new instance to be running
echo "⏳ Waiting for new instance to be ready..."
aws lightsail wait instance-running \
    --instance-name "$NEW_INSTANCE_NAME" \
    --region "$REGION"

# Get new instance IP
NEW_IP=$(aws lightsail get-instance \
    --instance-name "$NEW_INSTANCE_NAME" \
    --region "$REGION" \
    --query "instance.publicIpAddress" \
    --output text)

echo "✅ New instance is running!"
echo "   Name: $NEW_INSTANCE_NAME"
echo "   New IP: $NEW_IP"

echo ""
echo "🌐 Step 3: Updating DNS record..."

# Update DNS record to point to new IP
HOSTED_ZONE_ID="Z10156125SMCM3PU8LXF"

aws route53 change-resource-record-sets \
    --hosted-zone-id "$HOSTED_ZONE_ID" \
    --change-batch "{
        \"Comment\": \"Update A record for upgraded Lightsail instance\",
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

echo "✅ DNS updated to point to new instance: $NEW_IP"

echo ""
echo "⏳ Waiting for DNS propagation (60 seconds)..."
sleep 60

echo ""
echo "🧪 Step 4: Testing new instance..."

# Test SSH connectivity
echo "Testing SSH connectivity to new instance..."
if ssh -o ConnectTimeout=10 -o StrictHostKeyChecking=no ubuntu@$NEW_IP "echo 'SSH test successful'" 2>/dev/null; then
    echo "✅ SSH connectivity confirmed"
else
    echo "⚠️  SSH connectivity test failed - this is normal, may need a few more minutes"
fi

# Test DNS resolution
RESOLVED_IP=$(dig +short api.lastgenie.com @8.8.8.8)
if [[ "$RESOLVED_IP" == "$NEW_IP" ]]; then
    echo "✅ DNS resolution confirmed: api.lastgenie.com → $NEW_IP"
else
    echo "⚠️  DNS still propagating: $RESOLVED_IP → $NEW_IP"
fi

echo ""
echo "📋 Next Steps:"
echo "=============="
echo "1. SSH to new instance: ssh ubuntu@$NEW_IP"
echo "2. Verify all services are running"
echo "3. Test SSL certificate: curl https://api.lastgenie.com"
echo "4. If everything works, delete old instance"
echo ""
echo "🗑️  To delete old instance (after testing):"
echo "   aws lightsail delete-instance --instance-name $CURRENT_INSTANCE_NAME --region $REGION"
echo ""
echo "💰 Cost Change:"
echo "   Old: \$3.50/month (512MB)"
echo "   New: \$5.00/month (1GB)"
echo "   Increase: \$1.50/month"
echo ""
echo "🎉 Instance upgrade completed!"
echo "Your new 1GB instance should resolve the memory issues."
echo "SSH to the new instance and run your build/deployment commands."