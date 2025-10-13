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
    const { data, error } = await supabase
      .from('comments')
      .select('id,article_id,user_id,content,created_at')
      .eq('article_id', articleId)
      .order('created_at', { ascending: true });
    if (error) throw error;
    return data || [];
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

