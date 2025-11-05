import React, { createContext, useContext, useReducer, ReactNode, useEffect } from 'react';
import { Article, Comment } from '../types/payload';
import { useAuth } from './AuthContext';
import { likesService } from '../services/likesService';

interface AppState {
  articles: Article[];
  followedUsers: string[];
  likedArticles: string[];
  notifications: any[];
  loading: boolean;
  toasts: { id: string; message: string; type: 'info' | 'error' | 'success'; duration?: number }[];
}

type AppAction =
  | { type: 'SET_ARTICLES'; payload: Article[] }
  | { type: 'LIKE_ARTICLE'; payload: string }
  | { type: 'UNLIKE_ARTICLE'; payload: string }
  | { type: 'FOLLOW_USER'; payload: string }
  | { type: 'UNFOLLOW_USER'; payload: string }
  | { type: 'ADD_COMMENT'; payload: { articleId: string; comment: Comment } }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_TOAST'; payload: { id?: string; message: string; type?: 'info' | 'error' | 'success'; duration?: number } }
  | { type: 'DISMISS_TOAST'; payload: { id: string } }
  | { type: 'SET_LIKED_ARTICLES'; payload: string[] };

const initialState: AppState = {
  articles: [],
  followedUsers: [],
  likedArticles: [],
  notifications: [],
  loading: false,
  toasts: [],
};

const appReducer = (state: AppState, action: AppAction): AppState => {
  switch (action.type) {
    case 'SET_ARTICLES':
      return { ...state, articles: action.payload };
    case 'LIKE_ARTICLE':
      // Prevent duplicate likes
      if (state.likedArticles.includes(action.payload)) {
        return state;
      }
      return {
        ...state,
        likedArticles: [...state.likedArticles, action.payload],
        articles: state.articles.map(article =>
          article.id === action.payload
            ? { ...article, likes: article.likes + 1 }
            : article
        ),
      };
    case 'UNLIKE_ARTICLE':
      return {
        ...state,
        likedArticles: state.likedArticles.filter(id => id !== action.payload),
        articles: state.articles.map(article =>
          article.id === action.payload
            ? { ...article, likes: article.likes - 1 }
            : article
        ),
      };
    case 'FOLLOW_USER':
      return {
        ...state,
        followedUsers: [...state.followedUsers, action.payload],
      };
    case 'UNFOLLOW_USER':
      return {
        ...state,
        followedUsers: state.followedUsers.filter(id => id !== action.payload),
      };
    case 'ADD_COMMENT':
      return {
        ...state,
        articles: state.articles.map(article =>
          article.id === action.payload.articleId
            ? { ...article, comments: [...article.comments, action.payload.comment] }
            : article
        ),
      };
    case 'SET_LOADING':
      return { ...state, loading: action.payload };
    case 'SET_TOAST': {
      const id = action.payload.id || Math.random().toString(36).slice(2);
      const toast = { 
        id, 
        message: action.payload.message, 
        type: action.payload.type || 'info',
        duration: action.payload.duration || 4000
      };
      return { ...state, toasts: [...state.toasts, toast] };
    }
    case 'DISMISS_TOAST':
      return { ...state, toasts: state.toasts.filter(t => t.id !== action.payload.id) };
    case 'SET_LIKED_ARTICLES':
      return { ...state, likedArticles: action.payload };
    default:
      return state;
  }
};

const AppContext = createContext<{
  state: AppState;
  dispatch: React.Dispatch<AppAction>;
} | null>(null);

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(appReducer, initialState);
  const { state: authState } = useAuth();

  // Load user likes when user changes
  useEffect(() => {
    const loadUserLikes = async () => {
      if (!authState.user) return;
      
      try {
        const likedIds = await likesService.getUserLikedArticles(authState.user.id);
        dispatch({ type: 'SET_LIKED_ARTICLES', payload: likedIds });
      } catch (error) {
        console.error('Failed to load user likes:', error);
      }
    };
    
    loadUserLikes();
  }, [authState.user]);

  return (
    <AppContext.Provider value={{ state, dispatch }}>
      {children}
    </AppContext.Provider>
  );
};