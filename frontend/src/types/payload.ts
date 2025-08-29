// Base types
export interface BaseDocument {
  id: string;
  createdAt: string;
  updatedAt: string;
}

// User types
export interface User extends BaseDocument {
  name: string;
  email: string;
  avatar?: Media;
  bio?: string;
  role: 'user' | 'author' | 'editor' | 'admin';
  verified: boolean;
  socialLinks?: {
    linkedin?: string;
    twitter?: string;
    website?: string;
  };
  preferences?: {
    emailNotifications: boolean;
    pushNotifications: boolean;
  };
  stats: {
    followersCount: number;
    followingCount: number;
    articlesCount: number;
  };
}

// Article types
export interface Article extends BaseDocument {
  title: string;
  slug: string;
  excerpt: string;
  content: any; // Rich text content
  author: User;
  coverImage?: Media;
  status: 'draft' | 'pending' | 'published' | 'archived';
  featured: boolean;
  categories?: Category[];
  tags?: Tag[];
  readingTime?: number;
  seo?: {
    metaTitle?: string;
    metaDescription?: string;
    keywords?: string;
  };
  stats: {
    views: number;
    likes: number;
    comments: number;
  };
  publishedAt?: string;
}

// Comment types
export interface Comment extends BaseDocument {
  content: string;
  author: User;
  article: Article;
  parentComment?: Comment;
  likes: number;
  replies?: Comment[];
}

// Category types
export interface Category extends BaseDocument {
  name: string;
  slug: string;
  description?: string;
  icon?: string;
  color?: string;
  parent?: Category;
}

// Tag types
export interface Tag extends BaseDocument {
  name: string;
  slug: string;
  description?: string;
  usageCount: number;
}

// Media types
export interface Media extends BaseDocument {
  filename: string;
  alt: string;
  caption?: string;
  credit?: string;
  mimeType: string;
  filesize: number;
  width?: number;
  height?: number;
  url: string;
  tags?: Tag[];
  usage?: {
    articles?: Article[];
    users?: User[];
  };
}

// Quiz types
export interface Quiz extends BaseDocument {
  title: string;
  description?: string;
  author: User;
  status: 'draft' | 'published' | 'archived';
  questions: QuizQuestion[];
  settings: QuizSettings;
  stats: QuizStats;
  tags?: Tag[];
}

export interface QuizQuestion {
  question: string;
  type: 'multiple-choice' | 'true-false' | 'short-answer';
  options?: QuizOption[];
  correctAnswer?: string;
  explanation?: string;
  points: number;
}

export interface QuizOption {
  text: string;
  isCorrect: boolean;
}

export interface QuizSettings {
  timeLimit?: number;
  passingScore: number;
  allowRetakes: boolean;
  showResults: boolean;
  randomizeQuestions: boolean;
}

export interface QuizStats {
  attempts: number;
  averageScore: number;
  completionRate: number;
}

// Notification types
export interface Notification extends BaseDocument {
  title: string;
  message: string;
  recipient: User;
  type: 'info' | 'success' | 'warning' | 'error' | 'comment' | 'follow' | 'like' | 'system';
  read: boolean;
  actionUrl?: string;
  actionText?: string;
  metadata?: any;
  expiresAt?: string;
}

// API Response types
export interface PaginatedResponse<T> {
  docs: T[];
  totalDocs: number;
  totalPages: number;
  page: number;
  limit: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
  nextPage?: number;
  prevPage?: number;
}

export interface ApiError {
  message: string;
  status?: number;
  errors?: Record<string, string[]>;
}

// Auth types
export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  name: string;
  email: string;
  password: string;
  bio?: string;
}

export interface AuthResponse {
  user: User;
  token: string;
}

// Search and filter types
export interface ArticleFilters {
  category?: string;
  tag?: string;
  author?: string;
  status?: string;
  featured?: boolean;
}

export interface SearchParams {
  q: string;
  filters?: ArticleFilters;
  page?: number;
  limit?: number;
  sort?: string;
}
