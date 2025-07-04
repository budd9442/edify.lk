import React, { createContext, useContext, useReducer, useEffect, ReactNode } from 'react';

interface User {
  id: string;
  name: string;
  email: string;
  avatar: string;
  bio: string;
  role: 'user' | 'admin';
  followersCount: number;
  followingCount: number;
  articlesCount: number;
  verified: boolean;
}

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  loading: boolean;
}

type AuthAction =
  | { type: 'LOGIN_START' }
  | { type: 'LOGIN_SUCCESS'; payload: User }
  | { type: 'LOGIN_FAILURE' }
  | { type: 'LOGOUT' }
  | { type: 'UPDATE_USER'; payload: Partial<User> };

const initialState: AuthState = {
  user: null,
  isAuthenticated: false,
  loading: false,
};

const authReducer = (state: AuthState, action: AuthAction): AuthState => {
  switch (action.type) {
    case 'LOGIN_START':
      return { ...state, loading: true };
    case 'LOGIN_SUCCESS':
      return {
        ...state,
        user: action.payload,
        isAuthenticated: true,
        loading: false,
      };
    case 'LOGIN_FAILURE':
      return { ...state, loading: false };
    case 'LOGOUT':
      return { ...state, user: null, isAuthenticated: false };
    case 'UPDATE_USER':
      return {
        ...state,
        user: state.user ? { ...state.user, ...action.payload } : null,
      };
    default:
      return state;
  }
};

const AuthContext = createContext<{
  state: AuthState;
  login: (provider: 'google' | 'linkedin') => Promise<void>;
  logout: () => void;
  updateUser: (updates: Partial<User>) => void;
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

  useEffect(() => {
    const savedUser = localStorage.getItem('edify-user');
    if (savedUser) {
      dispatch({ type: 'LOGIN_SUCCESS', payload: JSON.parse(savedUser) });
    }
  }, []);

  const login = async (provider: 'google' | 'linkedin') => {
    dispatch({ type: 'LOGIN_START' });
    
    // Simulate API call
    setTimeout(() => {
      const mockUser: User = {
        id: '1',
        name: 'Alex Thompson',
        email: 'alex@example.com',
        avatar: 'https://media.licdn.com/dms/image/v2/D4E03AQFM2bia86LEpQ/profile-displayphoto-shrink_100_100/B4EZQ1W9ILHEAU-/0/1736062004138?e=1756944000&v=beta&t=NRca3iZVIMWnDQX4DSCf3jjF73JgMJJkV_QeUUxxPiY',
        bio: 'Technology enthusiast and creative writer exploring the intersection of innovation and human experience.',
        role: 'user',
        followersCount: 1247,
        followingCount: 89,
        articlesCount: 12,
        verified: false,
      };
      
      localStorage.setItem('edify-user', JSON.stringify(mockUser));
      dispatch({ type: 'LOGIN_SUCCESS', payload: mockUser });
    }, 1000);
  };

  const logout = () => {
    localStorage.removeItem('edify-user');
    dispatch({ type: 'LOGOUT' });
  };

  const updateUser = (updates: Partial<User>) => {
    dispatch({ type: 'UPDATE_USER', payload: updates });
    if (state.user) {
      const updatedUser = { ...state.user, ...updates };
      localStorage.setItem('edify-user', JSON.stringify(updatedUser));
    }
  };

  return (
    <AuthContext.Provider value={{ state, login, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
};