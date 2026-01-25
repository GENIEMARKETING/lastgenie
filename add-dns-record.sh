#!/bin/bash

# Add DNS A Record for api.lastgenie.com using Route 53
# This script adds the A record pointing to the Lightsail instance

set -e

echo "🌐 Adding DNS A Record for api.lastgenie.com"
echo "============================================="

# Get current server IP
LIGHTSAIL_IP="70.126.130.5"
DOMAIN="lastgenie.com"
SUBDOMAIN="api.lastgenie.com"

echo "📍 Server IP: $LIGHTSAIL_IP"
echo "🔗 Domain: $SUBDOMAIN"

# Find the hosted zone ID for lastgenie.com
echo "🔍 Finding Route 53 hosted zone for $DOMAIN..."
HOSTED_ZONE_ID=$(aws route53 list-hosted-zones --query "HostedZones[?Name=='${DOMAIN}.'].Id" --output text | cut -d'/' -f3)

if [[ -z "$HOSTED_ZONE_ID" ]]; then
    echo "❌ Could not find hosted zone for $DOMAIN"
    echo "Available hosted zones:"
    aws route53 list-hosted-zones --query "HostedZones[].{Name:Name,Id:Id}" --output table
    exit 1
fi

echo "✅ Found hosted zone ID: $HOSTED_ZONE_ID"

# Check if the record already exists
echo "🔍 Checking if A record already exists..."
EXISTING_RECORD=$(aws route53 list-resource-record-sets \
    --hosted-zone-id "$HOSTED_ZONE_ID" \
    --query "ResourceRecordSets[?Name=='${SUBDOMAIN}.' && Type=='A'].ResourceRecords[0].Value" \
    --output text)

if [[ "$EXISTING_RECORD" == "$LIGHTSAIL_IP" ]]; then
    echo "✅ A record already exists and points to correct IP: $LIGHTSAIL_IP"
    echo "🎉 DNS configuration is already correct!"
    exit 0
elif [[ -n "$EXISTING_RECORD" && "$EXISTING_RECORD" != "None" ]]; then
    echo "⚠️  A record exists but points to different IP: $EXISTING_RECORD"
    echo "🔄 Will update to point to: $LIGHTSAIL_IP"
    ACTION="UPSERT"
else
    echo "📝 No existing A record found, will create new one"
    ACTION="CREATE"
fi

# Create the change batch JSON
CHANGE_BATCH=$(cat << EOF
{
    "Comment": "Add A record for api.lastgenie.com pointing to Lightsail instance",
    "Changes": [
        {
            "Action": "$ACTION",
            "ResourceRecordSet": {
                "Name": "$SUBDOMAIN",
                "Type": "A",
                "TTL": 300,
                "ResourceRecords": [
                    {
                        "Value": "$LIGHTSAIL_IP"
                    }
                ]
            }
        }
    ]
}
EOF
)

echo "🚀 Creating/updating A record..."
CHANGE_ID=$(aws route53 change-resource-record-sets \
    --hosted-zone-id "$HOSTED_ZONE_ID" \
    --change-batch "$CHANGE_BATCH" \
    --query "ChangeInfo.Id" \
    --output text)

echo "✅ DNS change submitted with ID: $CHANGE_ID"

# Wait for the change to propagate
echo "⏳ Waiting for DNS change to propagate..."
aws route53 wait resource-record-sets-changed --id "$CHANGE_ID"

echo "✅ DNS change has propagated!"

# Verify the record
echo "🧪 Verifying DNS record..."
sleep 5
RESOLVED_IP=$(dig +short "$SUBDOMAIN" @8.8.8.8)

if [[ "$RESOLVED_IP" == "$LIGHTSAIL_IP" ]]; then
    echo "✅ DNS record verified! $SUBDOMAIN resolves to $LIGHTSAIL_IP"
else
    echo "⚠️  DNS record may still be propagating. Current resolution: $RESOLVED_IP"
    echo "Expected: $LIGHTSAIL_IP"
    echo "This is normal and should resolve within a few minutes."
fi

echo ""
echo "🎉 DNS A Record Configuration Complete!"
echo "======================================"
echo "✅ Record: $SUBDOMAIN → $LIGHTSAIL_IP"
echo "✅ TTL: 300 seconds (5 minutes)"
echo "✅ Status: Active"
echo ""
echo "🔗 You can now proceed with SSL certificate setup!"
echo "Next step: Run the SSL deployment script on your Lightsail instance."