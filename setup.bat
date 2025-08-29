@echo off
echo 🚀 Setting up Edify Exposition Platform...
echo ==========================================

REM Check if Node.js is installed
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Node.js is not installed. Please install Node.js 18+ first.
    pause
    exit /b 1
)

REM Check Node.js version
for /f "tokens=1,2 delims=." %%a in ('node --version') do set NODE_VERSION=%%a
set NODE_VERSION=%NODE_VERSION:~1%
if %NODE_VERSION% LSS 18 (
    echo ❌ Node.js version 18+ is required. Current version: 
    node --version
    pause
    exit /b 1
)

echo ✅ Node.js version: 
node --version

REM Check if MongoDB is installed
mongod --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ⚠️  MongoDB is not installed. Please install MongoDB 5+ first.
    echo    You can download it from: https://www.mongodb.com/try/download/community
)

REM Backend setup
echo.
echo 📦 Setting up backend...
cd backend

if not exist "node_modules" (
    echo Installing backend dependencies...
    npm install
) else (
    echo Backend dependencies already installed.
)

REM Create .env if it doesn't exist
if not exist ".env" (
    echo Creating .env file...
    (
        echo # Server Configuration
        echo NODE_ENV=development
        echo HOST=0.0.0.0
        echo PORT=3000
        echo FRONTEND_URL=http://localhost:5173
        echo ADMIN_URL=http://localhost:3000
        echo.
        echo # PayloadCMS Configuration
        echo PAYLOAD_SECRET=your-super-secret-payload-key-change-this-in-production
        echo PAYLOAD_PUBLIC_SERVER_URL=http://localhost:3000
        echo.
        echo # Database Configuration ^(MongoDB^)
        echo MONGODB_URI=mongodb://localhost:27017/edify-exposition
        echo.
        echo # Email Configuration ^(for user verification and password reset^)
        echo SMTP_HOST=smtp.gmail.com
        echo SMTP_PORT=587
        echo SMTP_USER=your-email@gmail.com
        echo SMTP_PASS=your-app-password
        echo SMTP_FROM=noreply@edify.lk
        echo.
        echo # JWT Configuration
        echo JWT_SECRET=your-jwt-secret-key-change-this-in-production
        echo JWT_EXPIRES_IN=7d
        echo.
        echo # Rate Limiting
        echo RATE_LIMIT_WINDOW_MS=900000
        echo RATE_LIMIT_MAX_REQUESTS=100
        echo.
        echo # File Upload Limits
        echo MAX_FILE_SIZE=5000000
        echo ALLOWED_FILE_TYPES=image/*,video/*,application/pdf
        echo.
        echo # Logging
        echo LOG_LEVEL=debug
        echo LOG_FILE_PATH=logs
        echo.
        echo # Security
        echo CORS_ORIGINS=http://localhost:5173,http://localhost:3000
        echo HELMET_ENABLED=true
        echo COMPRESSION_ENABLED=true
    ) > .env
    echo ✅ Backend .env file created. Please update the configuration values.
) else (
    echo ✅ Backend .env file already exists.
)

cd ..

REM Frontend setup
echo.
echo 📦 Setting up frontend...
cd frontend

if not exist "node_modules" (
    echo Installing frontend dependencies...
    npm install
) else (
    echo Frontend dependencies already installed.
)

REM Create .env if it doesn't exist
if not exist ".env" (
    echo Creating .env file...
    (
        echo # API Configuration
        echo VITE_API_URL=http://localhost:3000
        echo.
        echo # App Configuration
        echo VITE_APP_NAME=Edify Exposition
        echo VITE_APP_DESCRIPTION=A modern platform for sharing knowledge and insights
        echo VITE_APP_VERSION=1.0.0
        echo.
        echo # Feature Flags
        echo VITE_ENABLE_ANALYTICS=false
        echo VITE_ENABLE_DEBUG=true
    ) > .env
    echo ✅ Frontend .env file created.
) else (
    echo ✅ Frontend .env file already exists.
)

cd ..

echo.
echo 🎉 Setup completed!
echo.
echo 📋 Next steps:
echo 1. Start MongoDB: mongod
echo 2. Start backend: cd backend ^&^& npm run dev
echo 3. Start frontend: cd frontend ^&^& npm run dev
echo 4. Seed database: cd backend ^&^& npm run seed
echo 5. Access admin panel: http://localhost:3000/admin
echo 6. Login with: admin@edify.lk / admin123
echo.
echo 🌐 URLs:
echo    Frontend: http://localhost:5173
echo    Backend API: http://localhost:3000
echo    Admin Panel: http://localhost:3000/admin
echo    Health Check: http://localhost:3000/health
echo.
echo 📚 For more information, see README.md
pause
