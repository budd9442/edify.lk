#!/bin/bash

# Edify Exposition Platform Deployment Script
# This script helps deploy the application to production

set -e

echo "🚀 Starting deployment of Edify Exposition Platform..."
echo "=================================================="

# Check if Docker and Docker Compose are installed
if ! command -v docker &> /dev/null; then
    echo "❌ Docker is not installed. Please install Docker first."
    exit 1
fi

if ! command -v docker-compose &> /dev/null; then
    echo "❌ Docker Compose is not installed. Please install Docker Compose first."
    exit 1
fi

echo "✅ Docker and Docker Compose are available"

# Check if .env.prod exists
if [ ! -f ".env.prod" ]; then
    echo "❌ .env.prod file not found. Please create it with production environment variables."
    echo "You can copy .env.example and update the values for production."
    exit 1
fi

echo "✅ Production environment file found"

# Build and start production services
echo ""
echo "📦 Building and starting production services..."

# Build the frontend
echo "Building frontend..."
cd frontend
npm run build
cd ..

# Build and start backend
echo "Building and starting backend..."
cd backend
npm run build
cd ..

# Start production services
echo "Starting production services with Docker Compose..."
docker-compose -f docker-compose.prod.yml --env-file .env.prod up -d --build

echo ""
echo "🎉 Deployment completed successfully!"
echo ""
echo "🌐 Your application is now running at:"
echo "   Frontend: https://your-domain.com"
echo "   Backend API: https://your-domain.com/api"
echo "   Admin Panel: https://your-domain.com/admin"
echo "   Health Check: https://your-domain.com/health"
echo ""
echo "📊 To monitor the services:"
echo "   docker-compose -f docker-compose.prod.yml logs -f"
echo ""
echo "🛑 To stop the services:"
echo "   docker-compose -f docker-compose.prod.yml down"
echo ""
echo "📚 For more information, see README.md"
