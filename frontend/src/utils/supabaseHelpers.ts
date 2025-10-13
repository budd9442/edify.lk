import { PostgrestError } from '@supabase/supabase-js';
import supabase from '../services/supabaseClient';
import { ProfileRow } from '../types/database';

/**
 * Custom error class for Supabase operations
 */
export class SupabaseError extends Error {
  constructor(
    message: string,
    public code?: string,
    public details?: string,
    public hint?: string
  ) {
    super(message);
    this.name = 'SupabaseError';
  }
}

/**
 * Handles Supabase errors and converts them to user-friendly messages
 */
export function handleSupabaseError(error: PostgrestError | Error): SupabaseError {
  if ('code' in error && 'details' in error) {
    const pgError = error as PostgrestError;
    
    // Handle common error codes
    switch (pgError.code) {
      case 'PGRST116':
        return new SupabaseError('Resource not found', pgError.code);
      case '23505':
        return new SupabaseError('This resource already exists', pgError.code);
      case '23503':
        return new SupabaseError('Referenced resource does not exist', pgError.code);
      case '42501':
        return new SupabaseError('You do not have permission to perform this action', pgError.code);
      default:
        return new SupabaseError(
          pgError.message || 'An error occurred',
          pgError.code,
          pgError.details,
          pgError.hint
        );
    }
  }
  
  return new SupabaseError(error.message || 'An unexpected error occurred');
}

/**
 * Gets the current authenticated user with proper error handling
 */
export async function getCurrentUser() {
  try {
    const { data, error } = await supabase.auth.getUser();
    
    if (error) {
      throw handleSupabaseError(error);
    }
    
    return data.user;
  } catch (error) {
    console.error('Failed to get current user:', error);
    return null;
  }
}

/**
 * Gets the current session with proper error handling
 */
export async function getCurrentSession() {
  try {
    const { data, error } = await supabase.auth.getSession();
    
    if (error) {
      throw handleSupabaseError(error);
    }
    
    return data.session;
  } catch (error) {
    console.error('Failed to get current session:', error);
    return null;
  }
}

/**
 * Fetches profile data for a single user with error handling
 */
export async function fetchProfile(userId: string): Promise<ProfileRow | null> {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('id, name, avatar_url, bio, role, followers_count, articles_count')
      .eq('id', userId)
      .single();
    
    if (error) {
      if (error.code === 'PGRST116') {
        // Profile not found - return default
        return {
          id: userId,
          name: 'Unknown User',
          avatar_url: null,
          bio: null,
          role: 'user',
          followers_count: 0,
          articles_count: 0,
        };
      }
      throw handleSupabaseError(error);
    }
    
    return data as ProfileRow;
  } catch (error) {
    console.error(`Failed to fetch profile for user ${userId}:`, error);
    // Return default profile on error
    return {
      id: userId,
      name: 'Unknown User',
      avatar_url: null,
      bio: null,
      role: 'user',
      followers_count: 0,
      articles_count: 0,
    };
  }
}

/**
 * Fetches multiple profiles efficiently with error handling
 */
export async function fetchProfiles(userIds: string[]): Promise<Map<string, ProfileRow>> {
  if (userIds.length === 0) {
    return new Map();
  }
  
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('id, name, avatar_url, bio, role, followers_count, articles_count')
      .in('id', userIds);
    
    if (error) {
      throw handleSupabaseError(error);
    }
    
    const profileMap = new Map<string, ProfileRow>();
    (data || []).forEach((profile: any) => {
      profileMap.set(profile.id, profile as ProfileRow);
    });
    
    // Fill in missing profiles with defaults
    userIds.forEach(userId => {
      if (!profileMap.has(userId)) {
        profileMap.set(userId, {
          id: userId,
          name: 'Unknown User',
          avatar_url: null,
          bio: null,
          role: 'user',
          followers_count: 0,
          articles_count: 0,
        });
      }
    });
    
    return profileMap;
  } catch (error) {
    console.error('Failed to fetch profiles:', error);
    // Return default profiles for all requested IDs
    const defaultMap = new Map<string, ProfileRow>();
    userIds.forEach(userId => {
      defaultMap.set(userId, {
        id: userId,
        name: 'Unknown User',
        avatar_url: null,
        bio: null,
        role: 'user',
        followers_count: 0,
        articles_count: 0,
      });
    });
    return defaultMap;
  }
}

/**
 * Maps profile data to author object format
 */
export function mapProfileToAuthor(profile: ProfileRow) {
  return {
    id: profile.id,
    name: profile.name || 'Unknown User',
    avatar: profile.avatar_url || '/logo.png',
    bio: profile.bio || '',
    followersCount: profile.followers_count ?? 0,
    articlesCount: profile.articles_count ?? 0,
  };
}

/**
 * Retry logic for failed requests
 */
export async function retryOperation<T>(
  operation: () => Promise<T>,
  maxRetries: number = 3,
  delayMs: number = 1000
): Promise<T> {
  let lastError: Error;
  
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error('Unknown error');
      
      if (attempt < maxRetries - 1) {
        // Wait before retrying (exponential backoff)
        await new Promise(resolve => setTimeout(resolve, delayMs * Math.pow(2, attempt)));
      }
    }
  }
  
  throw lastError!;
}

/**
 * Checks if user is authenticated
 */
export async function isAuthenticated(): Promise<boolean> {
  const user = await getCurrentUser();
  return user !== null;
}

/**
 * Ensures user is authenticated, throws error if not
 */
export async function requireAuth(): Promise<string> {
  const user = await getCurrentUser();
  
  if (!user) {
    throw new SupabaseError('You must be logged in to perform this action', 'AUTH_REQUIRED');
  }
  
  return user.id;
}
