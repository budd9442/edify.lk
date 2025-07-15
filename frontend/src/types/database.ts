export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          email: string;
          full_name: string | null;
          avatar_url: string | null;
          bio: string | null;
          website: string | null;
          location: string | null;
          twitter_handle: string | null;
          linkedin_url: string | null;
          github_url: string | null;
          is_verified: boolean;
          role: 'user' | 'admin' | 'moderator';
          followers_count: number;
          following_count: number;
          articles_count: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          email: string;
          full_name?: string | null;
          avatar_url?: string | null;
          bio?: string | null;
          website?: string | null;
          location?: string | null;
          twitter_handle?: string | null;
          linkedin_url?: string | null;
          github_url?: string | null;
          is_verified?: boolean;
          role?: 'user' | 'admin' | 'moderator';
          followers_count?: number;
          following_count?: number;
          articles_count?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          full_name?: string | null;
          avatar_url?: string | null;
          bio?: string | null;
          website?: string | null;
          location?: string | null;
          twitter_handle?: string | null;
          linkedin_url?: string | null;
          github_url?: string | null;
          is_verified?: boolean;
          role?: 'user' | 'admin' | 'moderator';
          followers_count?: number;
          following_count?: number;
          articles_count?: number;
          created_at?: string;
          updated_at?: string;
        };
      };
      articles: {
        Row: {
          id: string;
          title: string;
          slug: string;
          content: any; // JSON content
          excerpt: string | null;
          cover_image: string | null;
          author_id: string;
          status: 'draft' | 'published' | 'archived';
          featured: boolean;
          reading_time: number;
          views_count: number;
          likes_count: number;
          comments_count: number;
          published_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          title: string;
          slug: string;
          content: any;
          excerpt?: string | null;
          cover_image?: string | null;
          author_id: string;
          status?: 'draft' | 'published' | 'archived';
          featured?: boolean;
          reading_time?: number;
          views_count?: number;
          likes_count?: number;
          comments_count?: number;
          published_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          title?: string;
          slug?: string;
          content?: any;
          excerpt?: string | null;
          cover_image?: string | null;
          author_id?: string;
          status?: 'draft' | 'published' | 'archived';
          featured?: boolean;
          reading_time?: number;
          views_count?: number;
          likes_count?: number;
          comments_count?: number;
          published_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      article_tags: {
        Row: {
          id: string;
          article_id: string;
          tag_id: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          article_id: string;
          tag_id: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          article_id?: string;
          tag_id?: string;
          created_at?: string;
        };
      };
      tags: {
        Row: {
          id: string;
          name: string;
          slug: string;
          description: string | null;
          color: string | null;
          articles_count: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          slug: string;
          description?: string | null;
          color?: string | null;
          articles_count?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          slug?: string;
          description?: string | null;
          color?: string | null;
          articles_count?: number;
          created_at?: string;
          updated_at?: string;
        };
      };
      comments: {
        Row: {
          id: string;
          content: string;
          article_id: string;
          author_id: string;
          parent_id: string | null;
          likes_count: number;
          is_edited: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          content: string;
          article_id: string;
          author_id: string;
          parent_id?: string | null;
          likes_count?: number;
          is_edited?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          content?: string;
          article_id?: string;
          author_id?: string;
          parent_id?: string | null;
          likes_count?: number;
          is_edited?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
      likes: {
        Row: {
          id: string;
          user_id: string;
          article_id: string | null;
          comment_id: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          article_id?: string | null;
          comment_id?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          article_id?: string | null;
          comment_id?: string | null;
          created_at?: string;
        };
      };
      follows: {
        Row: {
          id: string;
          follower_id: string;
          following_id: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          follower_id: string;
          following_id: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          follower_id?: string;
          following_id?: string;
          created_at?: string;
        };
      };
      bookmarks: {
        Row: {
          id: string;
          user_id: string;
          article_id: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          article_id: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          article_id?: string;
          created_at?: string;
        };
      };
      notifications: {
        Row: {
          id: string;
          user_id: string;
          type: 'like' | 'comment' | 'follow' | 'article_published' | 'mention';
          title: string;
          message: string;
          data: any | null;
          read: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          type: 'like' | 'comment' | 'follow' | 'article_published' | 'mention';
          title: string;
          message: string;
          data?: any | null;
          read?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          type?: 'like' | 'comment' | 'follow' | 'article_published' | 'mention';
          title?: string;
          message?: string;
          data?: any | null;
          read?: boolean;
          created_at?: string;
        };
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      [_ in never]: never;
    };
  };
}