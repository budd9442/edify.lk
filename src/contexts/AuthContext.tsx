import React, { createContext, useContext, useReducer, useEffect, ReactNode } from 'react';
import { User, LoginCredentials, RegisterData } from '../types/payload';
import supabase from '../services/supabaseClient';

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  loading: boolean;
  error: string | null;
}

type AuthAction =
  | { type: 'AUTH_START' }
  | { type: 'LOGIN_SUCCESS'; payload: User }
  | { type: 'REGISTER_SUCCESS'; payload: User }
  | { type: 'AUTH_FAILURE'; payload: string }
  | { type: 'LOGOUT' }
  | { type: 'UPDATE_USER'; payload: Partial<User> }
  | { type: 'CLEAR_ERROR' }
  | { type: 'AUTH_READY' };

const initialState: AuthState = {
  user: null,
  isAuthenticated: false,
  loading: true, // start loading to avoid signed-out flash on reload
  error: null,
};

const authReducer = (state: AuthState, action: AuthAction): AuthState => {
  switch (action.type) {
    case 'AUTH_START':
      return { ...state, loading: true, error: null };
    case 'LOGIN_SUCCESS':
    case 'REGISTER_SUCCESS':
      return {
        ...state,
        user: action.payload,
        isAuthenticated: true,
        loading: false,
        error: null,
      };
    case 'AUTH_FAILURE':
      return { ...state, loading: false, error: action.payload };
    case 'LOGOUT':
      return { ...state, user: null, isAuthenticated: false };
    case 'UPDATE_USER':
      return {
        ...state,
        user: state.user ? { ...state.user, ...action.payload } : null,
      };
    case 'CLEAR_ERROR':
      return { ...state, error: null };
    case 'AUTH_READY':
      return { ...state, loading: false };
    default:
      return state;
  }
};

const AuthContext = createContext<{
  state: AuthState;
  login: (credentials: LoginCredentials) => Promise<void>;
  register: (userData: RegisterData) => Promise<void>;
  logout: () => Promise<void>;
  updateUser: (updates: Partial<User>) => void;
  clearError: () => void;
} | null>(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialState);
  const didEnsureRef = React.useRef<{ [userId: string]: boolean }>({});
  const isEnrichingRef = React.useRef<{ [userId: string]: boolean }>({});

  const mapMinimalUser = (authUser: any): User => {
    return {
      id: authUser.id,
      createdAt: authUser.created_at ?? new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      name: (authUser.user_metadata?.name as string) || 'User',
      email: authUser.email || '',
      role: 'user',
      verified: !!authUser.email_confirmed_at,
      stats: { followersCount: 0, followingCount: 0, articlesCount: 0 },
    };
  };

  const enrichUserFromProfile = async (uid: string, fallbackMeta?: { name?: string; avatar_url?: string }) => {
    if (isEnrichingRef.current[uid]) return;
    isEnrichingRef.current[uid] = true;
    try {
      // First ensure profile exists with proper name (fire-and-forget)
      const { profilesService } = await import('../services/profilesService');
      if (!didEnsureRef.current[uid]) {
        didEnsureRef.current[uid] = true;
        profilesService.ensureProfileExists(uid, fallbackMeta?.name || 'User').catch(() => { });
      }

      console.log('🔐 [AUTH DEBUG] Enriching profile for user:', uid);
      const { data: prof, error } = await supabase
        .from('profiles')
        .select('role, name, bio, avatar_url, social_links, followers_count, following_count, badges')
        .eq('id', uid)
        .maybeSingle();

      console.log('🔐 [AUTH DEBUG] Profile data:', { prof, error });

      if (error) {
        console.error('🔐 [AUTH DEBUG] Profile fetch error:', error);
        // Fallback to auth metadata if profiles table fails
        if (fallbackMeta?.avatar_url) {
          dispatch({
            type: 'UPDATE_USER', payload: {
              name: fallbackMeta?.name || 'User',
              bio: '',
              avatar: fallbackMeta.avatar_url ? {
                id: 'avatar', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), filename: 'avatar', alt: 'avatar', mimeType: 'image/png', filesize: 0, url: fallbackMeta.avatar_url,
              } : undefined,
              badges: [],
            }
          });
        }
      } else if (prof) {
        console.log('🔐 [AUTH DEBUG] Updating user with profile data:', prof);
        dispatch({
          type: 'UPDATE_USER', payload: {
            name: prof.name || fallbackMeta?.name || 'User',
            bio: prof.bio,
            role: prof.role as any,
            badges: prof.badges || [],
            socialLinks: prof.social_links,
            stats: { followersCount: prof.followers_count ?? 0, followingCount: prof.following_count ?? 0, articlesCount: 0 },
            avatar: prof.avatar_url ? {
              id: 'avatar', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), filename: 'avatar', alt: 'avatar', mimeType: 'image/png', filesize: 0, url: prof.avatar_url,
            } : undefined,
          }
        });
      } else {
        console.log('🔐 [AUTH DEBUG] No profile found for user:', uid);
      }
    } catch (error) {
      console.error('🔐 [AUTH DEBUG] Profile enrichment error:', error);
      // non-fatal; keep minimal user
    } finally {
      isEnrichingRef.current[uid] = false;
    }
  };

  useEffect(() => {
    const init = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          console.log('🔐 [AUTH DEBUG] Found session via getSession');
          const minimal = mapMinimalUser(session.user);
          console.log('🔐 [AUTH DEBUG] Initial minimal user:', minimal);
          dispatch({ type: 'LOGIN_SUCCESS', payload: minimal });
          enrichUserFromProfile(session.user.id, { name: session.user.user_metadata?.name, avatar_url: session.user.user_metadata?.avatar_url });
        } else {
          console.log('🔐 [AUTH DEBUG] No session found, setting AUTH_READY');
          dispatch({ type: 'AUTH_READY' });
        }
      } catch (error) {
        console.error('🔐 [AUTH DEBUG] Error getting session:', error);
        dispatch({ type: 'AUTH_READY' });
      }

      // Set up auth state change listener
      const { data: sub } = supabase.auth.onAuthStateChange(async (event, session) => {
        console.log('Auth state change event:', event, 'Session:', !!session);

        // Only respond to SIGNED_OUT events to avoid unnecessary refreshes
        if (event === 'SIGNED_OUT') {
          dispatch({ type: 'LOGOUT' });
        }
        // Ignore SIGNED_IN events that happen after login (they're redundant)
        // Only respond to SIGNED_IN if we don't already have a user
        else if (event === 'SIGNED_IN' && !state.user && session?.user) {
          console.log('🔐 [AUTH DEBUG] Handling SIGNED_IN event');
          const minimal = mapMinimalUser(session.user);
          dispatch({ type: 'LOGIN_SUCCESS', payload: minimal });
          enrichUserFromProfile(session.user.id, { name: session.user.user_metadata?.name, avatar_url: session.user.user_metadata?.avatar_url });
        }
        // Ignore TOKEN_REFRESHED and INITIAL_SESSION events
      });

      return () => {
        sub.subscription.unsubscribe();
      };
    };

    init();
  }, []);

  // Session monitoring - check session health every 5 minutes

  const login = async (credentials: LoginCredentials) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: credentials.email,
        password: credentials.password,
      });
      if (error) throw error;
      const authUser = data.user;
      if (!authUser) throw new Error('No user returned');
      const mappedUser: User = {
        id: authUser.id,
        createdAt: authUser.created_at ?? new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        name: (authUser.user_metadata?.name as string) || 'User',
        email: authUser.email || '',
        role: 'user',
        verified: !!authUser.email_confirmed_at,
        stats: { followersCount: 0, followingCount: 0, articlesCount: 0 },
      };
      dispatch({ type: 'LOGIN_SUCCESS', payload: mappedUser });
      // Enrich user profile after login
      enrichUserFromProfile(authUser.id, { name: authUser.user_metadata?.name, avatar_url: authUser.user_metadata?.avatar_url });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Login failed';
      dispatch({ type: 'AUTH_FAILURE', payload: errorMessage });
      throw error; // Re-throw so LoginPage can handle it
    }
  };

  const register = async (userData: RegisterData) => {
    try {
      const { data, error } = await supabase.auth.signUp({
        email: userData.email,
        password: userData.password,
        options: { data: { name: userData.name } },
      });
      if (error) throw error;
      const sUser = data.user;
      if (!sUser) throw new Error('Registration did not return a user');
      // Create profile row for the new user
      const { error: profileError } = await supabase
        .from('profiles')
        .upsert({
          id: sUser.id,
          name: userData.name,
          bio: userData.bio || '',
        }, { onConflict: 'id' });
      if (profileError) throw profileError;
      const mapped: User = {
        id: sUser.id,
        createdAt: sUser.created_at ?? new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        name: (sUser.user_metadata?.name as string) || userData.name,
        email: sUser.email || userData.email,
        role: 'user',
        verified: !!sUser.email_confirmed_at,
        stats: { followersCount: 0, followingCount: 0, articlesCount: 0 },
      };
      dispatch({ type: 'REGISTER_SUCCESS', payload: mapped });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Registration failed';
      dispatch({ type: 'AUTH_FAILURE', payload: errorMessage });
      throw error; // Re-throw so RegisterPage can handle it
    }
  };

  const logout = async () => {
    try {
      // Clear session data first
      await supabase.auth.signOut();
    } catch (error) {
      console.warn('Logout request failed:', error);
    } finally {
      dispatch({ type: 'LOGOUT' });
    }
  };

  const updateUser = (updates: Partial<User>) => {
    dispatch({ type: 'UPDATE_USER', payload: updates });
  };

  const clearError = () => {
    dispatch({ type: 'CLEAR_ERROR' });
  };

  const value = {
    state,
    login,
    register,
    logout,
    updateUser,
    clearError,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};