# Edify Exposition Platform

A modern, production-ready knowledge sharing platform built with React, TypeScript, and PayloadCMS.

## 🚀 Features

### Frontend (React + TypeScript)
- **Modern UI/UX**: Built with Tailwind CSS and Framer Motion
- **Responsive Design**: Mobile-first approach with beautiful animations
- **Type Safety**: Full TypeScript implementation
- **State Management**: React Context for global state
- **Routing**: React Router for navigation
- **Rich Text Editor**: React Quill for content creation

### Backend (PayloadCMS + Express)
- **Headless CMS**: PayloadCMS for content management
- **Authentication**: JWT-based user authentication
- **File Management**: Media uploads with image optimization
- **Database**: MongoDB with Mongoose
- **API**: RESTful API with GraphQL support
- **Admin Panel**: Beautiful admin interface for content management

### Content Management
- **Articles**: Rich text content with categories and tags
- **Users**: Role-based access control (User, Author, Editor, Admin)
- **Comments**: Nested comment system
- **Media**: File uploads with multiple image sizes
- **Quizzes**: Interactive quiz system
- **Notifications**: Real-time user notifications

## 🛠️ Tech Stack

### Frontend
- React 18
- TypeScript
- Vite
- Tailwind CSS
- Framer Motion
- React Router
- React Quill
- Lucide React Icons

### Backend
- Node.js
- Express.js
- PayloadCMS
- MongoDB
- Mongoose
- JWT Authentication
- Winston Logging
- Helmet Security

## 📋 Prerequisites

- Node.js 18+ 
- MongoDB 5+
- npm or yarn

## 🚀 Quick Start

### 1. Clone the Repository

```bash
git clone <repository-url>
cd edify.lk
```

### 2. Backend Setup

```bash
cd backend

# Install dependencies
npm install

# Create environment file
cp .env.example .env

# Update environment variables in .env
# Set your MongoDB URI, JWT secrets, etc.

# Start MongoDB (if running locally)
mongod

# Seed the database with initial data
npm run seed

# Start development server
npm run dev
```

The backend will be available at:
- **API**: http://localhost:3000
- **Admin Panel**: http://localhost:3000/admin
- **Health Check**: http://localhost:3000/health

### 3. Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Create environment file
cp .env.example .env

# Update API URL in .env
VITE_API_URL=http://localhost:3000

# Start development server
npm run dev
```

The frontend will be available at:
- **Frontend**: http://localhost:5173

## 🔧 Environment Configuration

### Backend (.env)

```env
# Server Configuration
NODE_ENV=development
HOST=0.0.0.0
PORT=3000
FRONTEND_URL=http://localhost:5173
ADMIN_URL=http://localhost:3000

# PayloadCMS Configuration
PAYLOAD_SECRET=your-super-secret-payload-key-change-this-in-production
PAYLOAD_PUBLIC_SERVER_URL=http://localhost:3000

# Database Configuration
MONGODB_URI=mongodb://localhost:27017/edify-exposition

# Email Configuration
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
SMTP_FROM=noreply@edify.lk

# JWT Configuration
JWT_SECRET=your-jwt-secret-key-change-this-in-production
JWT_EXPIRES_IN=7d
```

### Frontend (.env)

```env
# API Configuration
VITE_API_URL=http://localhost:3000

# App Configuration
VITE_APP_NAME=Edify Exposition
VITE_APP_DESCRIPTION=A modern platform for sharing knowledge and insights
VITE_APP_VERSION=1.0.0
```

## 📚 Database Seeding

The backend includes a seed script that creates:
- Default categories (Technology, Business, Science, etc.)
- Default tags (AI, Machine Learning, Web Development, etc.)
- Admin user (admin@edify.lk / admin123)
- Sample author user (author@edify.lk / author123)

```bash
cd backend
npm run seed
```

## 🔐 Default Users

After seeding, you can login with:

- **Admin**: admin@edify.lk / admin123
- **Author**: author@edify.lk / author123

## 🏗️ Project Structure

```
edify.lk/
├── backend/                 # PayloadCMS Backend
│   ├── src/
│   │   ├── collections/    # PayloadCMS Collections
│   │   ├── access/         # Access Control
│   │   ├── payload.config.ts
│   │   ├── index.ts        # Express Server
│   │   └── seed.ts         # Database Seeding
│   ├── package.json
│   └── .env
├── frontend/               # React Frontend
│   ├── src/
│   │   ├── components/     # React Components
│   │   ├── pages/          # Page Components
│   │   ├── contexts/       # React Contexts
│   │   ├── services/       # API Services
│   │   ├── types/          # TypeScript Types
│   │   └── hooks/          # Custom Hooks
│   ├── package.json
│   └── .env
└── README.md
```

## 🚀 Production Deployment

### Backend

```bash
cd backend

# Build the project
npm run build

# Start production server
npm start

# Set NODE_ENV=production in your environment
```

### Frontend

```bash
cd frontend

# Build for production
npm run build

# Serve the built files with a web server
# The built files will be in the dist/ directory
```

## 🔒 Security Features

- **Helmet**: Security headers
- **CORS**: Cross-origin resource sharing
- **Rate Limiting**: API rate limiting
- **JWT**: Secure authentication
- **Input Validation**: Request validation
- **SQL Injection Protection**: MongoDB with Mongoose

## 📱 Responsive Design

The platform is fully responsive with:
- Mobile-first design approach
- Touch-friendly interfaces
- Adaptive layouts for all screen sizes
- Progressive Web App features

## 🎨 Customization

### Styling
- Tailwind CSS for styling
- CSS custom properties for theming
- Component-based design system

### Content
- PayloadCMS admin panel for content management
- Custom field types and validation
- Rich text editor with custom blocks

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

## 🆘 Support

For support and questions:
- Create an issue in the repository
- Check the documentation
- Review the code examples

## 🔄 Updates

Keep your dependencies updated:

```bash
# Backend
cd backend
npm update

# Frontend
cd frontend
npm update
```

## 📊 Performance

- **Frontend**: Optimized with Vite and code splitting
- **Backend**: Express.js with compression and caching
- **Database**: MongoDB with proper indexing
- **Images**: Automatic image optimization and resizing

---

**Built with ❤️ using modern web technologies**
