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
    try {
      const { data, error } = await supabase
        .from('articles')
        .select('id,title,excerpt,cover_image_url,featured,published_at,likes,tags,author_id')
        .eq('status', 'published')
        .eq('featured', true)
        .order('published_at', { ascending: false })
        .limit(12);
      
      if (error) {
        console.error('Error fetching featured articles:', error);
        // Return mock data for development
        return [
          {
            id: 'mock-1',
            title: 'Sample Featured Article',
            excerpt: 'This is a sample featured article for development purposes.',
            coverImage: undefined,
            featured: true,
            publishedAt: new Date().toISOString(),
            likes: 0,
            tags: ['sample', 'featured'],
            authorId: 'mock-author',
          }
        ];
      }
      
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
    } catch (error) {
      console.error('Exception fetching featured articles:', error);
      return [];
    }
  },

  async listAll(): Promise<ArticleListItem[]> {
    try {
      const { data, error } = await supabase
        .from('articles')
        .select('id,title,excerpt,cover_image_url,featured,published_at,likes,tags,author_id')
        .eq('status', 'published')
        .order('published_at', { ascending: false })
        .limit(50);
      
      if (error) {
        console.error('Error fetching all articles:', error);
        // Return mock data for development
        return [
          {
            id: 'mock-1',
            title: 'Sample Article 1',
            excerpt: 'This is a sample article for development purposes.',
            coverImage: undefined,
            featured: false,
            publishedAt: new Date().toISOString(),
            likes: 5,
            tags: ['sample', 'development'],
            authorId: 'mock-author',
          },
          {
            id: 'mock-2',
            title: 'Sample Article 2',
            excerpt: 'Another sample article for development purposes.',
            coverImage: undefined,
            featured: true,
            publishedAt: new Date(Date.now() - 86400000).toISOString(),
            likes: 12,
            tags: ['sample', 'featured'],
            authorId: 'mock-author',
          }
        ];
      }
      
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
    } catch (error) {
      console.error('Exception fetching all articles:', error);
      return [];
    }
  },

  async getById(id: string): Promise<ArticleDetail | null> {
    try {
      const { data, error } = await supabase
        .from('articles')
        .select('id,title,excerpt,content_html,cover_image_url,featured,published_at,likes,tags,author_id')
        .eq('id', id)
        .single();
      
      if (error) {
        if (error.code === 'PGRST116') return null; // row not found
        console.error('Error fetching article by ID:', error);
        // Return mock data for development
        return {
          id: id,
          title: 'Sample Article',
          excerpt: 'This is a sample article for development purposes.',
          contentHtml: '<p>This is the full content of the sample article. It contains multiple paragraphs and demonstrates how the article content would be displayed.</p><p>You can add more content here to test the layout and functionality of the article page.</p>',
          coverImage: undefined,
          featured: false,
          publishedAt: new Date().toISOString(),
          likes: 0,
          tags: ['sample', 'development'],
          authorId: 'mock-author',
        };
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
    } catch (error) {
      console.error('Exception fetching article by ID:', error);
      return null;
    }
  },
};

export default articlesService;

