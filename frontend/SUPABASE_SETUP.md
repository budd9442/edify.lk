# Supabase Integration Setup Guide

This guide will help you set up the Supabase integration for the Edify application.

## Overview

The application has been updated with robust error handling and fallback mechanisms for Supabase integration. It will work in both development (with mock data) and production (with real Supabase) environments.

## Features Fixed

✅ **Configuration Management**
- Environment variable validation
- Mock client for development without Supabase
- Graceful fallback when Supabase is not configured

✅ **Authentication**
- Improved error handling in login/register flows
- Better user mapping and role management
- Session recovery mechanisms

✅ **Database Operations**
- Comprehensive error handling across all services
- Mock data fallbacks for development
- Proper error logging and user feedback

✅ **Services Updated**
- Articles Service
- Profiles Service
- Comments Service
- Quiz Service
- Notifications Service
- Draft Service

## Quick Start

### 1. Development Mode (No Supabase Required)

The application will work out of the box with mock data:

```bash
cd frontend
npm install
npm run dev
```

The app will show a warning in the console about Supabase not being configured but will continue to work with mock data.

### 2. Production Mode (With Supabase)

#### Step 1: Create Supabase Project

1. Go to [supabase.com](https://supabase.com)
2. Create a new project
3. Note your project URL and anon key

#### Step 2: Set Up Database Schema

Run the SQL from `SUPABASE_SCHEMA.md` in your Supabase SQL editor:

1. Go to your Supabase dashboard
2. Navigate to SQL Editor
3. Copy and paste the schema from `SUPABASE_SCHEMA.md`
4. Execute the SQL

#### Step 3: Configure Environment Variables

Update your `.env` file:

```env
VITE_SUPABASE_URL=https://your-project-ref.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

#### Step 4: Test the Integration

```bash
npm run dev
```

The app should now connect to your Supabase instance.

## Error Handling

The application now includes comprehensive error handling:

- **Network Errors**: Graceful fallback to mock data
- **Authentication Errors**: Clear error messages to users
- **Database Errors**: Proper logging and user feedback
- **Configuration Errors**: Helpful warnings and fallbacks

## Mock Data

When Supabase is not configured, the app provides mock data for:

- **Articles**: Sample articles with content
- **Quizzes**: Sample quiz questions
- **Notifications**: Empty notification list
- **Drafts**: Empty draft list
- **Comments**: Empty comment list

## Database Schema

The required database schema is documented in `SUPABASE_SCHEMA.md`. Key tables include:

- `profiles` - User profiles
- `articles` - Published articles
- `drafts` - Article drafts
- `comments` - Article comments
- `follows` - User follow relationships
- `quizzes` - Quiz data
- `quiz_attempts` - Quiz attempt records
- `notifications` - User notifications

## Row Level Security (RLS)

All tables have RLS policies configured for:
- Public read access where appropriate
- User-specific write access
- Proper data isolation

## Troubleshooting

### Common Issues

1. **"Supabase not configured" warnings**
   - This is normal in development mode
   - Configure your `.env` file for production

2. **Build errors**
   - Make sure all dependencies are installed: `npm install`
   - Check for TypeScript errors: `npm run build`

3. **Database connection issues**
   - Verify your Supabase URL and key
   - Check that the database schema is set up correctly
   - Ensure RLS policies are configured

### Debug Mode

Enable debug logging by opening browser dev tools and checking the console for detailed error messages.

## Production Deployment

1. Set up your Supabase project
2. Configure environment variables in your deployment platform
3. Run the database schema setup
4. Deploy the application

The application will automatically detect the Supabase configuration and switch to production mode.

## Support

If you encounter issues:

1. Check the browser console for error messages
2. Verify your Supabase configuration
3. Ensure the database schema is correctly set up
4. Check the RLS policies are enabled

The application is designed to be resilient and will provide helpful error messages to guide you through any setup issues.