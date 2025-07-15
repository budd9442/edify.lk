import { supabase } from '../lib/supabase';
import { Database } from '../types/database';

type Article = Database['public']['Tables']['articles']['Row'];
type ArticleInsert = Database['public']['Tables']['articles']['Insert'];
type ArticleUpdate = Database['public']['Tables']['articles']['Update'];

export interface ArticleWithAuthor extends Article {
  profiles: {
    id: string;
    full_name: string | null;
    avatar_url: string | null;
    bio: string | null;
    is_verified: boolean;
    followers_count: number;
    articles_count: number;
  };
  tags: {
    id: string;
    name: string;
    slug: string;
    color: string | null;
  }[];
  is_liked?: boolean;
  is_bookmarked?: boolean;
}

export const articleService = {
  async getPublishedArticles(limit = 10, offset = 0): Promise<ArticleWithAuthor[]> {
    const { data, error } = await supabase
      .from('articles')
      .select(`
        *,
        profiles:author_id (
          id,
          full_name,
          avatar_url,
          bio,
          is_verified,
          followers_count,
          articles_count
        ),
        article_tags (
          tags (
            id,
            name,
            slug,
            color
          )
        )
      `)
      .eq('status', 'published')
      .order('published_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) throw error;

    return data.map(article => ({
      ...article,
      tags: article.article_tags.map(at => at.tags).filter(Boolean)
    })) as ArticleWithAuthor[];
  },

  async getFeaturedArticles(): Promise<ArticleWithAuthor[]> {
    const { data, error } = await supabase
      .from('articles')
      .select(`
        *,
        profiles:author_id (
          id,
          full_name,
          avatar_url,
          bio,
          is_verified,
          followers_count,
          articles_count
        ),
        article_tags (
          tags (
            id,
            name,
            slug,
            color
          )
        )
      `)
      .eq('status', 'published')
      .eq('featured', true)
      .order('published_at', { ascending: false })
      .limit(6);

    if (error) throw error;

    return data.map(article => ({
      ...article,
      tags: article.article_tags.map(at => at.tags).filter(Boolean)
    })) as ArticleWithAuthor[];
  },

  async getArticleBySlug(slug: string, userId?: string): Promise<ArticleWithAuthor | null> {
    let query = supabase
      .from('articles')
      .select(`
        *,
        profiles:author_id (
          id,
          full_name,
          avatar_url,
          bio,
          is_verified,
          followers_count,
          articles_count
        ),
        article_tags (
          tags (
            id,
            name,
            slug,
            color
          )
        )
      `)
      .eq('slug', slug)
      .single();

    const { data, error } = await query;

    if (error) throw error;
    if (!data) return null;

    // Check if user has liked or bookmarked this article
    let isLiked = false;
    let isBookmarked = false;

    if (userId) {
      const [likeResult, bookmarkResult] = await Promise.all([
        supabase
          .from('likes')
          .select('id')
          .eq('user_id', userId)
          .eq('article_id', data.id)
          .single(),
        supabase
          .from('bookmarks')
          .select('id')
          .eq('user_id', userId)
          .eq('article_id', data.id)
          .single()
      ]);

      isLiked = !likeResult.error;
      isBookmarked = !bookmarkResult.error;
    }

    // Increment view count
    await supabase
      .from('articles')
      .update({ views_count: data.views_count + 1 })
      .eq('id', data.id);

    return {
      ...data,
      tags: data.article_tags.map(at => at.tags).filter(Boolean),
      is_liked: isLiked,
      is_bookmarked: isBookmarked
    } as ArticleWithAuthor;
  },

  async getUserArticles(userId: string, status?: string): Promise<ArticleWithAuthor[]> {
    let query = supabase
      .from('articles')
      .select(`
        *,
        profiles:author_id (
          id,
          full_name,
          avatar_url,
          bio,
          is_verified,
          followers_count,
          articles_count
        ),
        article_tags (
          tags (
            id,
            name,
            slug,
            color
          )
        )
      `)
      .eq('author_id', userId)
      .order('created_at', { ascending: false });

    if (status) {
      query = query.eq('status', status);
    }

    const { data, error } = await query;

    if (error) throw error;

    return data.map(article => ({
      ...article,
      tags: article.article_tags.map(at => at.tags).filter(Boolean)
    })) as ArticleWithAuthor[];
  },

  async createArticle(article: ArticleInsert, tagNames: string[] = []): Promise<Article> {
    const { data, error } = await supabase
      .from('articles')
      .insert(article)
      .select()
      .single();

    if (error) throw error;

    // Handle tags
    if (tagNames.length > 0) {
      await this.updateArticleTags(data.id, tagNames);
    }

    return data;
  },

  async updateArticle(id: string, updates: ArticleUpdate, tagNames?: string[]): Promise<Article> {
    const { data, error } = await supabase
      .from('articles')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    // Handle tags if provided
    if (tagNames) {
      await this.updateArticleTags(id, tagNames);
    }

    return data;
  },

  async deleteArticle(id: string): Promise<void> {
    const { error } = await supabase
      .from('articles')
      .delete()
      .eq('id', id);

    if (error) throw error;
  },

  async updateArticleTags(articleId: string, tagNames: string[]): Promise<void> {
    // Remove existing tags
    await supabase
      .from('article_tags')
      .delete()
      .eq('article_id', articleId);

    if (tagNames.length === 0) return;

    // Get or create tags
    const tagIds: string[] = [];
    
    for (const tagName of tagNames) {
      const slug = tagName.toLowerCase().replace(/\s+/g, '-');
      
      // Try to get existing tag
      let { data: tag, error } = await supabase
        .from('tags')
        .select('id')
        .eq('slug', slug)
        .single();

      if (error) {
        // Create new tag
        const { data: newTag, error: createError } = await supabase
          .from('tags')
          .insert({ name: tagName, slug })
          .select('id')
          .single();

        if (createError) throw createError;
        tag = newTag;
      }

      tagIds.push(tag.id);
    }

    // Create article-tag relationships
    const articleTags = tagIds.map(tagId => ({
      article_id: articleId,
      tag_id: tagId
    }));

    const { error } = await supabase
      .from('article_tags')
      .insert(articleTags);

    if (error) throw error;
  },

  async likeArticle(articleId: string, userId: string): Promise<void> {
    const { error } = await supabase
      .from('likes')
      .insert({ article_id: articleId, user_id: userId });

    if (error) throw error;
  },

  async unlikeArticle(articleId: string, userId: string): Promise<void> {
    const { error } = await supabase
      .from('likes')
      .delete()
      .eq('article_id', articleId)
      .eq('user_id', userId);

    if (error) throw error;
  },

  async bookmarkArticle(articleId: string, userId: string): Promise<void> {
    const { error } = await supabase
      .from('bookmarks')
      .insert({ article_id: articleId, user_id: userId });

    if (error) throw error;
  },

  async unbookmarkArticle(articleId: string, userId: string): Promise<void> {
    const { error } = await supabase
      .from('bookmarks')
      .delete()
      .eq('article_id', articleId)
      .eq('user_id', userId);

    if (error) throw error;
  },

  async searchArticles(query: string, limit = 10): Promise<ArticleWithAuthor[]> {
    const { data, error } = await supabase
      .from('articles')
      .select(`
        *,
        profiles:author_id (
          id,
          full_name,
          avatar_url,
          bio,
          is_verified,
          followers_count,
          articles_count
        ),
        article_tags (
          tags (
            id,
            name,
            slug,
            color
          )
        )
      `)
      .eq('status', 'published')
      .or(`title.ilike.%${query}%, excerpt.ilike.%${query}%`)
      .order('published_at', { ascending: false })
      .limit(limit);

    if (error) throw error;

    return data.map(article => ({
      ...article,
      tags: article.article_tags.map(at => at.tags).filter(Boolean)
    })) as ArticleWithAuthor[];
  },

  generateSlug(title: string): string {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim();
  },

  calculateReadingTime(content: any): number {
    // Extract text from Strapi blocks
    const extractText = (blocks: any[]): string => {
      return blocks.map(block => {
        if (block.children) {
          return block.children.map((child: any) => child.text || '').join('');
        }
        return '';
      }).join(' ');
    };

    const text = extractText(content);
    const wordsPerMinute = 200;
    const wordCount = text.split(/\s+/).length;
    return Math.max(1, Math.ceil(wordCount / wordsPerMinute));
  }
};