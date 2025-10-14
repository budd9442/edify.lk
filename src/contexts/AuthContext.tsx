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
        profilesService.ensureProfileExists(uid, fallbackMeta?.name || 'User').catch(() => {});
      }

      const { data: prof, error } = await supabase
        .from('profiles')
        .select('role, name, bio, avatar_url, social_links')
        .eq('id', uid)
        .maybeSingle();

      if (error) {
        // Fallback to auth metadata if profiles table fails
        if (fallbackMeta?.avatar_url) {
          dispatch({ type: 'UPDATE_USER', payload: {
            name: fallbackMeta?.name || 'User',
            bio: '',
            avatar: fallbackMeta.avatar_url ? {
              id: 'avatar', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), filename: 'avatar', alt: 'avatar', mimeType: 'image/png', filesize: 0, url: fallbackMeta.avatar_url,
            } : undefined,
          }});
        }
      } else if (prof) {
        dispatch({ type: 'UPDATE_USER', payload: {
          name: prof.name || fallbackMeta?.name || 'User',
          bio: prof.bio,
          role: prof.role as any,
          socialLinks: prof.social_links,
          avatar: prof.avatar_url ? {
            id: 'avatar', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), filename: 'avatar', alt: 'avatar', mimeType: 'image/png', filesize: 0, url: prof.avatar_url,
          } : undefined,
        }});
      }
    } catch (_e) {
      // non-fatal; keep minimal user
    } finally {
      isEnrichingRef.current[uid] = false;
    }
  };

  useEffect(() => {
    const init = async () => {
      // Seed from cached session to avoid flash
      const { data: { session } } = await supabase.auth.getSession();
      const cachedUser = session?.user;
      if (cachedUser) {
        const minimal = mapMinimalUser(cachedUser);
        dispatch({ type: 'LOGIN_SUCCESS', payload: minimal });
        // Enrich in background (non-blocking)
        enrichUserFromProfile(cachedUser.id, { name: cachedUser.user_metadata?.name, avatar_url: cachedUser.user_metadata?.avatar_url });
      } else {
        // no session - set loading to false
        dispatch({ type: 'AUTH_READY' });
      }

      const { data: sub } = supabase.auth.onAuthStateChange(async (_event, session) => {
        const sUser = session?.user;
        if (sUser) {
          const minimal = mapMinimalUser(sUser);
          dispatch({ type: 'LOGIN_SUCCESS', payload: minimal });
          enrichUserFromProfile(sUser.id, { name: sUser.user_metadata?.name, avatar_url: sUser.user_metadata?.avatar_url });
        } else {
          dispatch({ type: 'LOGOUT' });
        }
      });

      return () => {
        sub.subscription.unsubscribe();
      };
    };

    init();
  }, []);

  const login = async (credentials: LoginCredentials) => {
    dispatch({ type: 'AUTH_START' });
    
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
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Login failed';
      dispatch({ type: 'AUTH_FAILURE', payload: errorMessage });
    }
  };

  const register = async (userData: RegisterData) => {
    dispatch({ type: 'AUTH_START' });
    
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
    }
  };

  const logout = async () => {
    try {
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