#!/bin/bash

echo "🚀 Setting up Edify Exposition Platform..."
echo "=========================================="

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 18+ first."
    exit 1
fi

# Check Node.js version
NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    echo "❌ Node.js version 18+ is required. Current version: $(node -v)"
    exit 1
fi

echo "✅ Node.js version: $(node -v)"

# Check if MongoDB is running
if ! command -v mongod &> /dev/null; then
    echo "⚠️  MongoDB is not installed. Please install MongoDB 5+ first."
    echo "   You can download it from: https://www.mongodb.com/try/download/community"
fi

# Backend setup
echo ""
echo "📦 Setting up backend..."
cd backend

if [ ! -d "node_modules" ]; then
    echo "Installing backend dependencies..."
    npm install
else
    echo "Backend dependencies already installed."
fi

# Create .env if it doesn't exist
if [ ! -f ".env" ]; then
    echo "Creating .env file..."
    cat > .env << EOF
# Server Configuration
NODE_ENV=development
HOST=0.0.0.0
PORT=3000
FRONTEND_URL=http://localhost:5173
ADMIN_URL=http://localhost:3000

# PayloadCMS Configuration
PAYLOAD_SECRET=your-super-secret-payload-key-change-this-in-production
PAYLOAD_PUBLIC_SERVER_URL=http://localhost:3000

# Database Configuration (MongoDB)
MONGODB_URI=mongodb://localhost:27017/edify-exposition

# Email Configuration (for user verification and password reset)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
SMTP_FROM=noreply@edify.lk

# JWT Configuration
JWT_SECRET=your-jwt-secret-key-change-this-in-production
JWT_EXPIRES_IN=7d

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# File Upload Limits
MAX_FILE_SIZE=5000000
ALLOWED_FILE_TYPES=image/*,video/*,application/pdf

# Logging
LOG_LEVEL=debug
LOG_FILE_PATH=logs

# Security
CORS_ORIGINS=http://localhost:5173,http://localhost:3000
HELMET_ENABLED=true
COMPRESSION_ENABLED=true
EOF
    echo "✅ Backend .env file created. Please update the configuration values."
else
    echo "✅ Backend .env file already exists."
fi

cd ..

# Frontend setup
echo ""
echo "📦 Setting up frontend..."
cd frontend

if [ ! -d "node_modules" ]; then
    echo "Installing frontend dependencies..."
    npm install
else
    echo "Frontend dependencies already installed."
fi

# Create .env if it doesn't exist
if [ ! -f ".env" ]; then
    echo "Creating .env file..."
    cat > .env << EOF
# API Configuration
VITE_API_URL=http://localhost:3000

# App Configuration
VITE_APP_NAME=Edify Exposition
VITE_APP_DESCRIPTION=A modern platform for sharing knowledge and insights
VITE_APP_VERSION=1.0.0

# Feature Flags
VITE_ENABLE_ANALYTICS=false
VITE_ENABLE_DEBUG=true
EOF
    echo "✅ Frontend .env file created."
else
    echo "✅ Frontend .env file already exists."
fi

cd ..

echo ""
echo "🎉 Setup completed!"
echo ""
echo "📋 Next steps:"
echo "1. Start MongoDB: mongod"
echo "2. Start backend: cd backend && npm run dev"
echo "3. Start frontend: cd frontend && npm run dev"
echo "4. Seed database: cd backend && npm run seed"
echo "5. Access admin panel: http://localhost:3000/admin"
echo "6. Login with: admin@edify.lk / admin123"
echo ""
echo "🌐 URLs:"
echo "   Frontend: http://localhost:5173"
echo "   Backend API: http://localhost:3000"
echo "   Admin Panel: http://localhost:3000/admin"
echo "   Health Check: http://localhost:3000/health"
echo ""
echo "📚 For more information, see README.md"
