#!/bin/bash

# Local deployment script for testing
set -e

echo "🚀 Starting local deployment..."

# Build the project
echo "📦 Building project..."
npm run build

# Create release directory with timestamp
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
RELEASE_DIR="/var/www/edify.budd.systems/releases/$TIMESTAMP"
echo "📁 Creating release directory: $RELEASE_DIR"
mkdir -p $RELEASE_DIR

# Copy built files to release directory
echo "📋 Copying files to release directory..."
cp -r dist/* $RELEASE_DIR/

# Update symlink
echo "🔗 Updating symlink..."
ln -sfn $RELEASE_DIR /var/www/edify.budd.systems/current

# Set proper permissions
echo "🔐 Setting permissions..."
chown -R www-data:www-data /var/www/edify.budd.systems/current/
chmod -R 755 /var/www/edify.budd.systems/current/

# Reload nginx
echo "🔄 Reloading nginx..."
systemctl reload nginx

# Health check
echo "🏥 Running health check..."
if curl -f https://edify.budd.systems > /dev/null 2>&1; then
    echo "✅ Deployment successful! Site is accessible."
else
    echo "❌ Health check failed!"
    exit 1
fi

echo "🎉 Deployment completed successfully!"
