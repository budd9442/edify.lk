import supabase from './supabaseClient';
import { safeQuery } from './supabaseUtils';
import { badgesService } from './badgesService';

export interface EditorStats {
  totalArticles: number;
  featuredArticles: number;
  pendingSubmissions: number;
  publishedToday: number;
  totalViews: number;
  totalLikes: number;
}

export interface ArticleManagementData {
  id: string;
  title: string;
  excerpt: string;
  author: {
    id: string;
    name: string;
    avatar?: string;
  };
  status: 'published' | 'draft' | 'submitted' | 'rejected';
  featured: boolean;
  publishedAt?: string;
  createdAt: string;
  updatedAt: string;
  likes: number;
  views: number;
  comments: number;
  tags: string[];
  coverImage?: string;
}

export const editorService = {
  // Get editor dashboard statistics
  async getEditorStats(): Promise<EditorStats> {
    const { data, error } = await safeQuery('editor/stats', async () => {
      // Get total articles
      const { count: totalArticles } = await supabase
        .from('articles')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'published');

      // Get featured articles count
      const { count: featuredArticles } = await supabase
        .from('articles')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'published')
        .eq('featured', true);

      // Get pending submissions
      const { count: pendingSubmissions } = await supabase
        .from('drafts')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'submitted');

      // Get articles published today
      const today = new Date().toISOString().split('T')[0];
      const { count: publishedToday } = await supabase
        .from('articles')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'published')
        .gte('published_at', `${today}T00:00:00.000Z`)
        .lte('published_at', `${today}T23:59:59.999Z`);

      // Get total views and likes
      const { data: statsData } = await supabase
        .from('articles')
        .select('views, likes')
        .eq('status', 'published');

      const totalViews = statsData?.reduce((sum, article) => sum + (article.views || 0), 0) || 0;
      const totalLikes = statsData?.reduce((sum, article) => sum + (article.likes || 0), 0) || 0;

      return {
        totalArticles: totalArticles || 0,
        featuredArticles: featuredArticles || 0,
        pendingSubmissions: pendingSubmissions || 0,
        publishedToday: publishedToday || 0,
        totalViews,
        totalLikes
      };
    });

    if (error) throw error;
    return data as EditorStats;
  },

  // Get all articles for management (published and drafts)
  async getAllArticlesForManagement(): Promise<ArticleManagementData[]> {
    const { data, error } = await safeQuery('editor/allArticles', async () => {
      // Get published articles
      const { data: articles } = await supabase
        .from('articles')
        .select(`
          id,
          title,
          excerpt,
          status,
          featured,
          published_at,
          created_at,
          updated_at,
          likes,
          views,
          tags,
          cover_image_url,
          author_id,
          custom_author,
          comments:comments(count)
        `)
        .eq('status', 'published')
        .order('published_at', { ascending: false });

      // Get author profiles
      const authorIds = articles?.map(a => a.author_id) || [];
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, name, avatar_url')
        .in('id', authorIds);

      const profileMap = new Map();
      profiles?.forEach(profile => {
        profileMap.set(profile.id, profile);
      });

      return articles?.map(article => {
        const author = profileMap.get(article.author_id);
        return {
          id: article.id,
          title: article.title,
          excerpt: article.excerpt,
          author: {
            id: article.author_id,
            name: author?.name || 'Unknown Author',
            avatar: author?.avatar_url
          },
          customAuthor: article.custom_author,
          status: 'published' as const,
          featured: !!article.featured,
          publishedAt: article.published_at,
          createdAt: article.created_at,
          updatedAt: article.updated_at,
          likes: article.likes || 0,
          views: article.views || 0,
          comments: article.comments?.[0]?.count || 0,
          tags: article.tags || [],
          coverImage: article.cover_image_url
        };
      }) || [];
    });

    if (error) throw error;
    return data as ArticleManagementData[];
  },

  // Feature/unfeature an article
  async toggleFeatured(articleId: string, featured: boolean): Promise<void> {
    const { error } = await safeQuery('editor/toggleFeatured', async () => {
      const { error } = await supabase
        .from('articles')
        .update({ featured })
        .eq('id', articleId);

      if (error) throw error;
      return true;
    });

    if (error) throw error;
  },

  // Update article metadata (title, excerpt, tags)
  async updateArticleMetadata(articleId: string, updates: {
    title?: string;
    excerpt?: string;
    tags?: string[];
  }): Promise<void> {
    const { error } = await safeQuery('editor/updateMetadata', async () => {
      const { error } = await supabase
        .from('articles')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', articleId);

      if (error) throw error;
      return true;
    });

    if (error) throw error;
  },

  // Delete an article (hard delete to actually remove it)
  async deleteArticle(articleId: string): Promise<void> {
    const { error } = await safeQuery('editor/deleteArticle', async () => {
      const { error } = await supabase
        .from('articles')
        .delete()
        .eq('id', articleId);

      if (error) throw error;
      return true;
    });

    if (error) throw error;
  },

  // Get pending submissions
  async getPendingSubmissions(): Promise<any[]> {
    const { data, error } = await safeQuery('editor/pendingSubmissions', async () => {
      // Get submitted drafts
      const { data: drafts, error: draftsError } = await supabase
        .from('drafts')
        .select(`
          id,
          title,
          content_html,
          tags,
          cover_image_url,
          status,
          created_at,
          updated_at,
          user_id,
          custom_author,
          quiz_questions_json
        `)
        .eq('status', 'submitted')
        .order('created_at', { ascending: false });

      if (draftsError) {
        throw draftsError;
      }

      // Get author profiles
      const authorIds = drafts?.map(d => d.user_id) || [];

      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, name, avatar_url')
        .in('id', authorIds);

      const profileMap = new Map();
      profiles?.forEach(profile => {
        profileMap.set(profile.id, profile);
      });

      const result = drafts?.map(draft => {
        const author = profileMap.get(draft.user_id);
        return {
          ...draft,
          excerpt: this.extractExcerpt(draft.content_html || ''),
          quiz_questions: draft.quiz_questions_json || [],
          customAuthor: draft.custom_author,
          author: {
            id: draft.user_id,
            name: author?.name || 'Unknown Author',
            avatar: author?.avatar_url
          }
        };
      }) || [];

      return result;
    });

    if (error) {
      throw error;
    }

    return data as any[];
  },

  // Approve a draft (publish it)
  async approveDraft(draftId: string): Promise<void> {
    const { error } = await safeQuery('editor/approveDraft', async () => {
      // Get the draft
      const { data: draft, error: fetchError } = await supabase
        .from('drafts')
        .select('*')
        .eq('id', draftId)
        .single();

      if (fetchError) throw fetchError;
      if (!draft) throw new Error('Draft not found');

      // Validate title is not empty
      if (!draft.title || draft.title.trim().length === 0) {
        throw new Error('Cannot approve draft: Title is required');
      }

      // Generate unique slug from title
      let baseSlug = draft.title
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .trim('-');

      // Ensure slug is unique
      let slug = baseSlug;
      let counter = 1;
      while (true) {
        const { data: existing, error: checkError } = await supabase
          .from('articles')
          .select('id')
          .eq('slug', slug)
          .maybeSingle();

        if (checkError) throw checkError;

        if (!existing) break;

        slug = `${baseSlug}-${counter}`;
        counter++;
      }

      // Create article from draft
      const articleData = {
        id: crypto.randomUUID(),
        title: draft.title,
        slug: slug,
        excerpt: draft.excerpt || this.extractExcerpt(draft.content_html || ''),
        content_html: draft.content_html,
        cover_image_url: draft.cover_image_url,
        tags: draft.tags || [],
        author_id: draft.user_id,
        custom_author: draft.custom_author,
        status: 'published',
        featured: false,
        likes: 0,
        views: 0,
        published_at: new Date().toISOString(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      // Insert article
      const { error: articleError } = await supabase
        .from('articles')
        .insert([articleData]);

      if (articleError) throw articleError;

      if (articleError) throw articleError;

      // Create quiz if exists
      try {
        const quizQuestions = (draft as any).quiz_questions_json || [];
        if (Array.isArray(quizQuestions) && quizQuestions.length > 0) {
          const normalized = (quizQuestions as any[]).slice(0, 10).map((q) => ({
            question: String(q.question || ''),
            options: Array.isArray(q.options) ? q.options.slice(0, 4) : [],
            correctAnswer: Number.isInteger(q.correctAnswer) ? q.correctAnswer : 0,
            explanation: q.explanation ? String(q.explanation) : undefined,
            points: 1,
          }));

          const { error: quizError } = await supabase
            .from('quizzes')
            .insert([{
              article_id: articleData.id,
              title: 'Article Quiz',
              questions_json: normalized
            }]);

          if (quizError) {
            console.warn('Quiz creation failed (non-fatal):', quizError);
          }
        }
      } catch (qerr) {
        console.warn('Quiz creation step failed (non-fatal):', qerr);
      }

      // Update draft status
      const { error: draftError } = await supabase
        .from('drafts')
        .update({
          status: 'published',
          updated_at: new Date().toISOString()
        })
        .eq('id', draftId);

      if (draftError) throw draftError;

      // Check for writer badges (async)
      // Retrieve current article count for author
      const { count } = await supabase
        .from('articles')
        .select('*', { count: 'exact', head: true })
        .eq('author_id', draft.user_id)
        .eq('status', 'published');

      if (count !== null) {
        badgesService.checkArticleBadges(draft.user_id, count);
      }

      return true;
    });

    if (error) throw error;
  },

  // Reject a draft
  async rejectDraft(draftId: string, reason?: string): Promise<void> {
    const { error } = await safeQuery('editor/rejectDraft', async () => {
      const { error } = await supabase
        .from('drafts')
        .update({
          status: 'rejected',
          rejection_reason: reason,
          updated_at: new Date().toISOString()
        })
        .eq('id', draftId);

      if (error) throw error;
      return true;
    });

    if (error) throw error;
  },

  // Get article analytics
  async getArticleAnalytics(articleId: string): Promise<{
    views: number;
    likes: number;
    comments: number;
    viewsByDay: Array<{ date: string; count: number }>;
  }> {
    const { data, error } = await safeQuery('editor/articleAnalytics', async () => {
      // Get basic stats
      const { data: article } = await supabase
        .from('articles')
        .select('views, likes')
        .eq('id', articleId)
        .single();

      // Get comment count
      const { count: comments } = await supabase
        .from('comments')
        .select('*', { count: 'exact', head: true })
        .eq('article_id', articleId);

      // Get views by day (last 30 days)
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const { data: viewsData } = await supabase
        .from('article_views')
        .select('view_date')
        .eq('article_id', articleId)
        .gte('view_date', thirtyDaysAgo.toISOString().split('T')[0]);

      // Group views by date
      const viewsByDay = viewsData?.reduce((acc: any, view: any) => {
        const date = view.view_date;
        acc[date] = (acc[date] || 0) + 1;
        return acc;
      }, {}) || {};

      const viewsByDayArray = Object.entries(viewsByDay).map(([date, count]) => ({
        date,
        count: count as number
      })).sort((a, b) => a.date.localeCompare(b.date));

      return {
        views: article?.views || 0,
        likes: article?.likes || 0,
        comments: comments || 0,
        viewsByDay: viewsByDayArray
      };
    });

    if (error) throw error;
    return data as any;
  },

  // Helper function to extract excerpt from HTML
  extractExcerpt(html: string, maxLength: number = 200): string {
    const text = html
      .replace(/<style[\s\S]*?<\/style>/gi, '')
      .replace(/<script[\s\S]*?<\/script>/gi, '')
      .replace(/<[^>]*>/g, '')
      .replace(/\s+/g, ' ')
      .trim();

    return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
  }
};
