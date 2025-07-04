import React, { createContext, useContext, useReducer, ReactNode } from 'react';
import { Article, Comment } from '../mock-data/articles';

interface AppState {
  articles: Article[];
  followedUsers: string[];
  likedArticles: string[];
  notifications: any[];
  loading: boolean;
}

type AppAction =
  | { type: 'SET_ARTICLES'; payload: Article[] }
  | { type: 'LIKE_ARTICLE'; payload: string }
  | { type: 'UNLIKE_ARTICLE'; payload: string }
  | { type: 'FOLLOW_USER'; payload: string }
  | { type: 'UNFOLLOW_USER'; payload: string }
  | { type: 'ADD_COMMENT'; payload: { articleId: string; comment: Comment } }
  | { type: 'SET_LOADING'; payload: boolean };

const initialState: AppState = {
  articles: [],
  followedUsers: [],
  likedArticles: [],
  notifications: [],
  loading: false,
};

const appReducer = (state: AppState, action: AppAction): AppState => {
  switch (action.type) {
    case 'SET_ARTICLES':
      return { ...state, articles: action.payload };
    case 'LIKE_ARTICLE':
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

  return (
    <AppContext.Provider value={{ state, dispatch }}>
      {children}
    </AppContext.Provider>
  );
};