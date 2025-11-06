import supabase from './supabaseClient';
import { safeQuery } from './supabaseUtils';

export const likesService = {
  async likeArticle(articleId: string, userId: string): Promise<void> {
    const { error } = await safeQuery('likes/create', async () => {
      const res = await supabase
        .from('likes')
        .insert({ article_id: articleId, user_id: userId });
      if (res.error) throw res.error;
      return res.data;
    });
    if (error) throw error;
  },

  async unlikeArticle(articleId: string, userId: string): Promise<void> {
    const { error } = await safeQuery('likes/delete', async () => {
      const res = await supabase
        .from('likes')
        .delete()
        .eq('article_id', articleId)
        .eq('user_id', userId);
      if (res.error) throw res.error;
      return res.data;
    });
    if (error) throw error;
  },

  async checkIfLiked(articleId: string, userId: string): Promise<boolean> {
    try {
      const { data, error } = await safeQuery('likes/check', async () => {
        const res = await supabase
          .from('likes')
          .select('article_id')
          .eq('article_id', articleId)
          .eq('user_id', userId)
          .limit(1);
        if (res.error) throw res.error;
        return res.data;
      });
      
      if (error) throw error;
      return Array.isArray(data) && data.length > 0;
    } catch (error) {
      console.error('Failed to check if liked:', error);
      return false;
    }
  },

  async getUserLikedArticles(userId: string): Promise<string[]> {
    try {
      const { data, error } = await safeQuery('likes/userLikes', async () => {
        const res = await supabase
          .from('likes')
          .select('article_id')
          .eq('user_id', userId);
        if (res.error) throw res.error;
        return res.data;
      });
      
      if (error) throw error;
      
      // Ensure data is an array before mapping
      if (!Array.isArray(data)) {
        console.warn('getUserLikedArticles: data is not an array:', data);
        return [];
      }
      
      return data.map((row: any) => row.article_id);
    } catch (error) {
      console.error('Failed to get user liked articles:', error);
      return [];
    }
  }
};