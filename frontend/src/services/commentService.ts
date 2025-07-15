import { supabase } from '../lib/supabase';
import { Database } from '../types/database';

type Comment = Database['public']['Tables']['comments']['Row'];
type CommentInsert = Database['public']['Tables']['comments']['Insert'];

export interface CommentWithAuthor extends Comment {
  profiles: {
    id: string;
    full_name: string | null;
    avatar_url: string | null;
    is_verified: boolean;
  };
  replies?: CommentWithAuthor[];
  is_liked?: boolean;
}

export const commentService = {
  async getArticleComments(articleId: string, userId?: string): Promise<CommentWithAuthor[]> {
    const { data, error } = await supabase
      .from('comments')
      .select(`
        *,
        profiles:author_id (
          id,
          full_name,
          avatar_url,
          is_verified
        )
      `)
      .eq('article_id', articleId)
      .is('parent_id', null)
      .order('created_at', { ascending: false });

    if (error) throw error;

    // Get replies for each comment
    const commentsWithReplies = await Promise.all(
      data.map(async (comment) => {
        const replies = await this.getCommentReplies(comment.id, userId);
        
        let isLiked = false;
        if (userId) {
          const { data: like } = await supabase
            .from('likes')
            .select('id')
            .eq('user_id', userId)
            .eq('comment_id', comment.id)
            .single();
          isLiked = !!like;
        }

        return {
          ...comment,
          replies,
          is_liked: isLiked
        };
      })
    );

    return commentsWithReplies as CommentWithAuthor[];
  },

  async getCommentReplies(parentId: string, userId?: string): Promise<CommentWithAuthor[]> {
    const { data, error } = await supabase
      .from('comments')
      .select(`
        *,
        profiles:author_id (
          id,
          full_name,
          avatar_url,
          is_verified
        )
      `)
      .eq('parent_id', parentId)
      .order('created_at', { ascending: true });

    if (error) throw error;

    // Check if user has liked each reply
    const repliesWithLikes = await Promise.all(
      data.map(async (reply) => {
        let isLiked = false;
        if (userId) {
          const { data: like } = await supabase
            .from('likes')
            .select('id')
            .eq('user_id', userId)
            .eq('comment_id', reply.id)
            .single();
          isLiked = !!like;
        }

        return {
          ...reply,
          is_liked: isLiked
        };
      })
    );

    return repliesWithLikes as CommentWithAuthor[];
  },

  async createComment(comment: CommentInsert): Promise<Comment> {
    const { data, error } = await supabase
      .from('comments')
      .insert(comment)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async updateComment(id: string, content: string): Promise<Comment> {
    const { data, error } = await supabase
      .from('comments')
      .update({ 
        content, 
        is_edited: true,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async deleteComment(id: string): Promise<void> {
    const { error } = await supabase
      .from('comments')
      .delete()
      .eq('id', id);

    if (error) throw error;
  },

  async likeComment(commentId: string, userId: string): Promise<void> {
    const { error } = await supabase
      .from('likes')
      .insert({ comment_id: commentId, user_id: userId });

    if (error) throw error;
  },

  async unlikeComment(commentId: string, userId: string): Promise<void> {
    const { error } = await supabase
      .from('likes')
      .delete()
      .eq('comment_id', commentId)
      .eq('user_id', userId);

    if (error) throw error;
  }
};