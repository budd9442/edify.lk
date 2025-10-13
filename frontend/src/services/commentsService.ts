import supabase from './supabaseClient';

export interface CommentRecord {
  id: string;
  article_id: string;
  user_id: string;
  content: string;
  created_at: string;
}

export const commentsService = {
  async listByArticle(articleId: string): Promise<CommentRecord[]> {
    try {
      const { data, error } = await supabase
        .from('comments')
        .select('id,article_id,user_id,content,created_at')
        .eq('article_id', articleId)
        .order('created_at', { ascending: true });
      
      if (error) {
        console.error('Error fetching comments:', error);
        return [];
      }
      
      return data || [];
    } catch (error) {
      console.error('Exception fetching comments:', error);
      return [];
    }
  },

  async create(input: { articleId: string; userId: string; content: string }): Promise<CommentRecord> {
    try {
      const { data, error } = await supabase
        .from('comments')
        .insert([{ article_id: input.articleId, user_id: input.userId, content: input.content }])
        .select('id,article_id,user_id,content,created_at')
        .single();
      
      if (error) {
        console.error('Error creating comment:', error);
        throw error;
      }
      
      return data as CommentRecord;
    } catch (error) {
      console.error('Exception creating comment:', error);
      throw error;
    }
  },

  async remove(id: string): Promise<void> {
    try {
      const { error } = await supabase.from('comments').delete().eq('id', id);
      if (error) {
        console.error('Error removing comment:', error);
        throw error;
      }
    } catch (error) {
      console.error('Exception removing comment:', error);
      throw error;
    }
  },
};

export default commentsService;

