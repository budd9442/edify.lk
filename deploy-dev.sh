#!/bin/bash

# Simple dev deployment script - delete all and deploy new
set -e

echo "🚀 Starting simple dev deployment..."

# Build the project
echo "📦 Building project..."
npm run build

# Deploy directly to current directory
# File copy skipped as Nginx is configured to serve from /root/edify.lk/dist
# echo "📋 Deploying files..."
# cp -r dist/* /var/www/edify.budd.systems/current/

# Set proper permissions
# echo "🔐 Setting permissions..."
# chown -R www-data:www-data /var/www/edify.budd.systems/current/
# chmod -R 755 /var/www/edify.budd.systems/current/

# Reload nginx
echo "🔄 Reloading nginx..."
systemctl reload nginx

# Health check
echo "🏥 Running health check..."
if curl -f --max-time 10 https://edify.budd.codes > /dev/null 2>&1; then
    echo "✅ Deployment successful!"
else
    echo "❌ Health check failed!"
    exit 1
fi

echo "🎉 Dev deployment completed!"
