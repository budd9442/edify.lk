# Edify - Modern Blog Platform

A modern, full-featured blog platform built with React, TypeScript, and Supabase. Features a clean, responsive design with advanced functionality for writers and readers.

## Features

### Core Features
- **User Authentication**: Email/password authentication with Supabase Auth
- **Article Management**: Create, edit, publish, and manage articles with rich content
- **Rich Text Editor**: Block-based editor supporting various content types
- **Comments System**: Threaded comments with likes and replies
- **Social Features**: Follow users, like articles, bookmark content
- **Search & Discovery**: Full-text search, trending articles, featured content
- **Responsive Design**: Mobile-first design that works on all devices
- **Real-time Updates**: Live notifications and real-time features

### Advanced Features
- **Tag System**: Categorize articles with tags
- **User Profiles**: Customizable user profiles with bio, social links
- **Reading Time**: Automatic reading time calculation
- **View Tracking**: Article view counts and analytics
- **Notifications**: Real-time notifications for interactions
- **Bookmarks**: Save articles for later reading
- **Feed System**: Personalized feed based on followed users

## Tech Stack

### Frontend
- **React 18** with TypeScript
- **Vite** for fast development and building
- **Tailwind CSS** for styling
- **Framer Motion** for animations
- **React Router** for navigation
- **Lucide React** for icons

### Backend
- **Supabase** for database and authentication
- **PostgreSQL** database with Row Level Security
- **Real-time subscriptions** for live updates

### Development Tools
- **ESLint** for code linting
- **TypeScript** for type safety
- **PostCSS** for CSS processing

## Getting Started

### Prerequisites
- Node.js 18+ 
- npm or yarn
- Supabase account

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd edify
```

2. Install dependencies:
```bash
cd frontend
npm install
```

3. Set up Supabase:
   - Create a new Supabase project
   - Run the migration file in `supabase/migrations/001_initial_schema.sql`
   - Copy your Supabase URL and anon key

4. Configure environment variables:
```bash
cp .env.example .env
```

Fill in your Supabase credentials:
```env
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
VITE_APP_URL=http://localhost:5173
```

5. Start the development server:
```bash
npm run dev
```

## Database Schema

The application uses the following main tables:

- **profiles**: User profiles and metadata
- **articles**: Blog articles with rich content
- **tags**: Article categorization tags
- **article_tags**: Many-to-many relationship between articles and tags
- **comments**: Article comments with threading support
- **likes**: Likes for articles and comments
- **follows**: User following relationships
- **bookmarks**: User bookmarks for articles
- **notifications**: User notification system

## Key Features Implementation

### Authentication
- Email/password authentication using Supabase Auth
- Automatic profile creation on user registration
- Protected routes and user session management

### Article System
- Block-based content editor supporting various content types
- Automatic slug generation and reading time calculation
- Draft, published, and archived status management
- Tag system for categorization

### Social Features
- Follow/unfollow users
- Like articles and comments
- Bookmark articles for later reading
- Real-time notifications for interactions

### Search & Discovery
- Full-text search across articles
- Trending articles based on engagement
- Featured articles curated by editors
- Tag-based filtering and discovery

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature-name`
3. Make your changes and commit: `git commit -m 'Add feature'`
4. Push to the branch: `git push origin feature-name`
5. Submit a pull request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Support

For support, please open an issue in the GitHub repository or contact the development team.