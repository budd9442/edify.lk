import supabase from './supabaseClient';
import { safeQuery } from './supabaseUtils';

export interface ArticleListItem {
  id: string;
  title: string;
  excerpt: string;
  coverImage?: string;
  featured: boolean;
  publishedAt?: string;
  likes: number;
  views: number;
  comments: number;
  tags: string[];
  authorId: string;
}

export interface ArticleDetail extends ArticleListItem {
  contentHtml: string;
}

export const articlesService = {
  async listFeatured(): Promise<ArticleListItem[]> {
    const { data, error } = await safeQuery('articles/listFeatured', async () => {
      const res = await supabase
        .from('articles')
        .select(`
          id,
          title,
          excerpt,
          cover_image_url,
          featured,
          published_at,
          likes,
          views,
          tags,
          author_id,
          comments:comments(count)
        `)
        .eq('status', 'published')
        .eq('featured', true)
        .order('published_at', { ascending: false })
        .limit(12);
      if (res.error) throw res.error;
      return res.data;
    });
    if (error) throw error;
    return ((data as any) || []).map((row: any) => ({
      id: row.id,
      title: row.title,
      excerpt: row.excerpt,
      coverImage: row.cover_image_url || undefined,
      featured: !!row.featured,
      publishedAt: row.published_at || undefined,
      likes: row.likes ?? 0,
      views: row.views ?? 0,
      comments: row.comments?.[0]?.count ?? 0,
      tags: row.tags ?? [],
      authorId: row.author_id,
    }));
  },

  async listAll(): Promise<ArticleListItem[]> {
    const { data, error } = await safeQuery('articles/listAll', async () => {
      const res = await supabase
        .from('articles')
        .select(`
          id,
          title,
          excerpt,
          cover_image_url,
          featured,
          published_at,
          likes,
          views,
          tags,
          author_id,
          comments:comments(count)
        `)
        .eq('status', 'published')
        .order('published_at', { ascending: false })
        .limit(50);
      if (res.error) throw res.error;
      return res.data;
    });
    if (error) throw error;
    return ((data as any) || []).map((row: any) => ({
      id: row.id,
      title: row.title,
      excerpt: row.excerpt,
      coverImage: row.cover_image_url || undefined,
      featured: !!row.featured,
      publishedAt: row.published_at || undefined,
      likes: row.likes ?? 0,
      views: row.views ?? 0,
      comments: row.comments?.[0]?.count ?? 0,
      tags: row.tags ?? [],
      authorId: row.author_id,
    }));
  },

  async getById(id: string): Promise<ArticleDetail | null> {
    const { data, error } = await safeQuery('articles/getById', async () => {
      const res = await supabase
        .from('articles')
        .select(`
          id,
          title,
          excerpt,
          content_html,
          cover_image_url,
          featured,
          published_at,
          likes,
          views,
          tags,
          author_id,
          comments:comments(count)
        `)
        .eq('id', id)
        .single();
      if (res.error) throw res.error;
      return res.data;
    });
    if (error) {
      if ((error as any).code === 'PGRST116') return null;
      throw error;
    }
    const row: any = data as any;
    return {
      id: row.id,
      title: row.title,
      excerpt: row.excerpt,
      contentHtml: row.content_html || '',
      coverImage: row.cover_image_url || undefined,
      featured: !!row.featured,
      publishedAt: row.published_at || undefined,
      likes: row.likes ?? 0,
      views: row.views ?? 0,
      comments: row.comments?.[0]?.count ?? 0,
      tags: row.tags ?? [],
      authorId: row.author_id,
    };
  },
};

export default articlesService;

