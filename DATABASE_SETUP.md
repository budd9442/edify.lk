# Database Setup Guide

## Steps to set up your Supabase database:

### 1. Create the database schema

1. Go to your Supabase project dashboard: https://supabase.com/dashboard/project/qrtushdezfmbfiajzgon
2. Navigate to the SQL Editor
3. Copy and paste the contents of `used_query.sql` and run it
4. This will create all the necessary tables and policies

### 2. Add sample data (optional)

1. After running the schema, you can add sample data by running `seed_data.sql`
2. This will create sample articles and tags for testing

### 3. Update your profile

1. Sign up or log in to your application
2. Your profile will be automatically created
3. You can then create articles and interact with the platform

## Key Features Now Available:

### ✅ Working Features:

- **Authentication**: Sign up, login, logout
- **Article Display**: View articles on homepage with mock data fallback
- **Navigation**: All pages are accessible
- **Profile Management**: User profiles are created automatically
- **Search**: Search functionality (basic)
- **Responsive Design**: Mobile-friendly interface

### 🚧 To Enable Full Database Functionality:

1. Run the SQL scripts in Supabase
2. Create some test articles through the write dashboard
3. The application will automatically switch from mock data to real data

### 📝 Pages Available:

- **Home** (`/`) - Featured articles and latest posts
- **Feed** (`/feed`) - Personalized feed (requires login)
- **Explore** (`/explore`) - Discover new content
- **Write** (`/write`) - Create new articles (requires login)
- **Search** (`/search`) - Search functionality
- **Article** (`/article/:slug`) - Individual article view

### 🔧 Database Tables Created:

- `profiles` - User profiles with extended information
- `articles` - Blog articles with rich content
- `tags` - Article categorization
- `article_tags` - Many-to-many relationship for tags
- `comments` - Threaded comments system
- `likes` - Like system for articles and comments
- `follows` - User following relationships
- `bookmarks` - User bookmarks for articles
- `notifications` - Notification system

All tables have proper Row Level Security (RLS) policies configured for security.
