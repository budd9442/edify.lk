// Supabase Database Types
export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          name: string;
          avatar_url: string | null;
          bio: string | null;
          role: 'user' | 'editor' | 'admin';
          followers_count: number;
          articles_count: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          name: string;
          avatar_url?: string | null;
          bio?: string | null;
          role?: 'user' | 'editor' | 'admin';
          followers_count?: number;
          articles_count?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          avatar_url?: string | null;
          bio?: string | null;
          role?: 'user' | 'editor' | 'admin';
          followers_count?: number;
          articles_count?: number;
          updated_at?: string;
        };
      };
      articles: {
        Row: {
          id: string;
          title: string;
          excerpt: string;
          content_html: string;
          cover_image_url: string | null;
          author_id: string;
          status: 'draft' | 'published' | 'archived';
          featured: boolean;
          published_at: string | null;
          likes: number;
          tags: string[];
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          title: string;
          excerpt: string;
          content_html: string;
          cover_image_url?: string | null;
          author_id: string;
          status?: 'draft' | 'published' | 'archived';
          featured?: boolean;
          published_at?: string | null;
          likes?: number;
          tags?: string[];
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          title?: string;
          excerpt?: string;
          content_html?: string;
          cover_image_url?: string | null;
          status?: 'draft' | 'published' | 'archived';
          featured?: boolean;
          published_at?: string | null;
          likes?: number;
          tags?: string[];
          updated_at?: string;
        };
      };
      drafts: {
        Row: {
          id: string;
          user_id: string;
          title: string;
          content_html: string;
          cover_image_url: string | null;
          tags: string[];
          status: 'draft' | 'submitted' | 'published' | 'rejected';
          review_note: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          title: string;
          content_html: string;
          cover_image_url?: string | null;
          tags?: string[];
          status?: 'draft' | 'submitted' | 'published' | 'rejected';
          review_note?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          title?: string;
          content_html?: string;
          cover_image_url?: string | null;
          tags?: string[];
          status?: 'draft' | 'submitted' | 'published' | 'rejected';
          review_note?: string | null;
          updated_at?: string;
        };
      };
      comments: {
        Row: {
          id: string;
          article_id: string;
          user_id: string;
          content: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          article_id: string;
          user_id: string;
          content: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          content?: string;
          updated_at?: string;
        };
      };
      notifications: {
        Row: {
          id: string;
          user_id: string;
          type: 'like' | 'comment' | 'follow' | 'article_approved' | 'article_rejected' | 'badge_earned' | 'mention' | 'success' | 'error' | 'award';
          title: string;
          message: string;
          read: boolean;
          action_url: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          type: 'like' | 'comment' | 'follow' | 'article_approved' | 'article_rejected' | 'badge_earned' | 'mention' | 'success' | 'error' | 'award';
          title: string;
          message: string;
          read?: boolean;
          action_url?: string | null;
          created_at?: string;
        };
        Update: {
          read?: boolean;
        };
      };
      follows: {
        Row: {
          id: string;
          follower_id: string;
          followee_id: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          follower_id: string;
          followee_id: string;
          created_at?: string;
        };
      };
      quizzes: {
        Row: {
          id: string;
          article_id: string;
          title: string;
          questions_json: any[];
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          article_id: string;
          title: string;
          questions_json: any[];
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          title?: string;
          questions_json?: any[];
          updated_at?: string;
        };
      };
      quiz_attempts: {
        Row: {
          id: string;
          quiz_id: string;
          user_id: string;
          article_id: string;
          score: number;
          total_questions: number;
          time_spent: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          quiz_id: string;
          user_id: string;
          article_id: string;
          score: number;
          total_questions: number;
          time_spent: number;
          created_at?: string;
        };
      };
    };
  };
}

// Helper type for profiles with common fields
export interface ProfileRow {
  id: string;
  name: string;
  avatar_url: string | null;
  bio: string | null;
  role: 'user' | 'editor' | 'admin';
  followers_count: number;
  articles_count: number;
}
