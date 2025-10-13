import supabase from './supabaseClient';

export interface ArticleListItem {
  id: string;
  title: string;
  excerpt: string;
  coverImage?: string;
  featured: boolean;
  publishedAt?: string;
  likes: number;
  tags: string[];
  authorId: string;
}

export interface ArticleDetail extends ArticleListItem {
  contentHtml: string;
}

export const articlesService = {
  async listFeatured(): Promise<ArticleListItem[]> {
    const { data, error } = await supabase
      .from('articles')
      .select('id,title,excerpt,cover_image_url,featured,published_at,likes,tags,author_id')
      .eq('status', 'published')
      .eq('featured', true)
      .order('published_at', { ascending: false })
      .limit(12);
    if (error) throw error;
    return (data || []).map((row: any) => ({
      id: row.id,
      title: row.title,
      excerpt: row.excerpt,
      coverImage: row.cover_image_url || undefined,
      featured: !!row.featured,
      publishedAt: row.published_at || undefined,
      likes: row.likes ?? 0,
      tags: row.tags ?? [],
      authorId: row.author_id,
    }));
  },

  async listAll(): Promise<ArticleListItem[]> {
    const { data, error } = await supabase
      .from('articles')
      .select('id,title,excerpt,cover_image_url,featured,published_at,likes,tags,author_id')
      .eq('status', 'published')
      .order('published_at', { ascending: false })
      .limit(50);
    if (error) throw error;
    return (data || []).map((row: any) => ({
      id: row.id,
      title: row.title,
      excerpt: row.excerpt,
      coverImage: row.cover_image_url || undefined,
      featured: !!row.featured,
      publishedAt: row.published_at || undefined,
      likes: row.likes ?? 0,
      tags: row.tags ?? [],
      authorId: row.author_id,
    }));
  },

  async getById(id: string): Promise<ArticleDetail | null> {
    const { data, error } = await supabase
      .from('articles')
      .select('id,title,excerpt,content_html,cover_image_url,featured,published_at,likes,tags,author_id')
      .eq('id', id)
      .single();
    if (error) {
      if (error.code === 'PGRST116') return null; // row not found
      throw error;
    }
    return {
      id: data.id,
      title: data.title,
      excerpt: data.excerpt,
      contentHtml: data.content_html || '',
      coverImage: data.cover_image_url || undefined,
      featured: !!data.featured,
      publishedAt: data.published_at || undefined,
      likes: data.likes ?? 0,
      tags: data.tags ?? [],
      authorId: data.author_id,
    };
  },
};

export default articlesService;

