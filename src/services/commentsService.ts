import supabase from './supabaseClient';

export interface CommentRecord {
  id: string;
  article_id: string;
  user_id: string;
  content: string;
  created_at: string;
}

export interface CommentWithAuthor {
  id: string;
  content: string;
  author: {
    id: string;
    name: string;
    avatar: string;
  };
  createdAt: string;
}

export const commentsService = {
  async listByArticle(articleId: string): Promise<CommentWithAuthor[]> {
    try {
      // First get comments
      const { data: comments, error: commentsError } = await supabase
        .from('comments')
        .select('id,article_id,user_id,content,created_at')
        .eq('article_id', articleId)
        .order('created_at', { ascending: true });
      
      if (commentsError) {
        console.error('Failed to fetch comments:', commentsError);
        return [];
      }
      
      if (!comments || comments.length === 0) {
        return [];
      }
      
      // Get user IDs for profile lookup
      const userIds = comments.map(comment => comment.user_id);
      
      // Fetch user profiles
      const { data: profiles, error: profileError } = await supabase
        .from('profiles')
        .select('id, name, avatar_url')
        .in('id', userIds);
      
      if (profileError) {
        console.error('Failed to fetch user profiles:', profileError);
        // Return comments with default names if profile fetch fails
        return comments.map(comment => ({
          id: comment.id,
          content: comment.content,
          author: {
            id: comment.user_id,
            name: 'Anonymous',
            avatar: '/logo.png',
          },
          createdAt: comment.created_at,
        }));
      }
      
      // Create a map of user profiles for quick lookup
      const profileMap = new Map();
      (profiles || []).forEach((profile: any) => {
        profileMap.set(profile.id, profile);
      });
      
      // Map comments with profile data
      return comments.map(comment => {
        const profile = profileMap.get(comment.user_id);
        return {
          id: comment.id,
          content: comment.content,
          author: {
            id: comment.user_id,
            name: profile?.name || 'Anonymous',
            avatar: profile?.avatar_url || '/logo.png',
          },
          createdAt: comment.created_at,
        };
      });
    } catch (error) {
      console.error('Failed to fetch comments with profiles:', error);
      return [];
    }
  },

  async create(input: { articleId: string; userId: string; content: string }): Promise<CommentRecord> {
    const { data, error } = await supabase
      .from('comments')
      .insert([{ article_id: input.articleId, user_id: input.userId, content: input.content }])
      .select('id,article_id,user_id,content,created_at')
      .single();
    if (error) throw error;
    return data as CommentRecord;
  },

  async remove(id: string): Promise<void> {
    const { error } = await supabase.from('comments').delete().eq('id', id);
    if (error) throw error;
  },
};

export default commentsService;

