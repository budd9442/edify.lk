import { Draft } from '../mock-data/strapiBlocks';
import supabase from './supabaseClient';

class DraftService {
  private extractMetricsFromHtml(html: string) {
    const text = html
      .replace(/<style[\s\S]*?<\/style>/gi, '')
      .replace(/<script[\s\S]*?<\/script>/gi, '')
      .replace(/<[^>]+>/g, ' ')
      .replace(/&nbsp;/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
    const words = text.length ? text.split(/\s+/).length : 0;
    const readingTime = Math.max(1, Math.round(words / 200));
    return { wordCount: words, readingTime };
  }

  async getDrafts(userId: string): Promise<Draft[]> {
    // Ensure we have a valid session; attempt refresh if needed
    const { data: sessionData } = await supabase.auth.getSession();
    if (!sessionData.session) {
      // Try to recover from expired session
      await supabase.auth.getUser();
    }

    const { data, error } = await supabase
      .from('drafts')
      .select('id,title,content_html,cover_image_url,tags,status,created_at,updated_at')
      .eq('user_id', userId)
      .order('updated_at', { ascending: false });
    if (error) throw error;
    return (data || []).map((row: any) => {
      const html = row.content_html || '';
      const metrics = this.extractMetricsFromHtml(html);
      return {
        id: row.id,
        title: row.title,
        contentHtml: html,
        coverImage: row.cover_image_url || undefined,
        tags: row.tags || [],
        status: row.status || 'draft',
        createdAt: row.created_at || new Date().toISOString(),
        updatedAt: row.updated_at || new Date().toISOString(),
        wordCount: metrics.wordCount,
        readingTime: metrics.readingTime,
      } as Draft;
    });
  }

  async getDraft(id: string): Promise<Draft | null> {
    const { data, error } = await supabase
      .from('drafts')
      .select('id,title,content_html,cover_image_url,tags,status,created_at,updated_at')
      .eq('id', id)
      .single();
    if (error) {
      if ((error as any).code === 'PGRST116') return null;
      throw error;
    }
    const html = data.content_html || '';
    const metrics = this.extractMetricsFromHtml(html);
    return {
      id: data.id,
      title: data.title,
      contentHtml: html,
      coverImage: data.cover_image_url || undefined,
      tags: data.tags || [],
      status: data.status || 'draft',
      createdAt: data.created_at || new Date().toISOString(),
      updatedAt: data.updated_at || new Date().toISOString(),
      wordCount: metrics.wordCount,
      readingTime: metrics.readingTime,
    } as Draft;
  }

  async saveDraft(draft: Omit<Draft, 'id' | 'createdAt' | 'updatedAt' | 'wordCount' | 'readingTime'> & { id?: string; userId?: string }): Promise<Draft> {
    const html = draft.contentHtml || '';
    const payload: any = {
      title: draft.title,
      content_html: html,
      cover_image_url: draft.coverImage || null,
      tags: draft.tags || [],
      status: draft.status || 'draft',
    };
    let saved: any;
    if (draft.id) {
      const { data, error } = await supabase
        .from('drafts')
        .update({ ...payload, updated_at: new Date().toISOString() })
        .eq('id', draft.id)
        .select()
        .single();
      if (error) throw error;
      saved = data;
    } else {
      if (!draft.userId) {
        throw new Error('Missing userId for new draft');
      }
      const { data, error } = await supabase
        .from('drafts')
        .insert([{ ...payload, user_id: draft.userId }])
        .select()
        .single();
      if (error) throw error;
      saved = data;
    }
    const metrics = this.extractMetricsFromHtml(saved.content_html || '');
    return {
      id: saved.id,
      title: saved.title,
      contentHtml: saved.content_html || '',
      coverImage: saved.cover_image_url || undefined,
      tags: saved.tags || [],
      status: saved.status || 'draft',
      createdAt: saved.created_at || new Date().toISOString(),
      updatedAt: saved.updated_at || new Date().toISOString(),
      wordCount: metrics.wordCount,
      readingTime: metrics.readingTime,
    } as Draft;
  }

  async deleteDraft(id: string): Promise<boolean> {
    const { error } = await supabase.from('drafts').delete().eq('id', id);
    if (error) throw error;
    return true;
  }

  async submitForReview(id: string): Promise<boolean> {
    const { error } = await supabase
      .from('drafts')
      .update({ status: 'submitted', updated_at: new Date().toISOString() })
      .eq('id', id);
    if (error) throw error;
    return true;
  }

  async getSubmittedDrafts(): Promise<Draft[]> {
    const { data, error } = await supabase
      .from('drafts')
      .select('id,title,content_html,cover_image_url,tags,status,created_at,updated_at,user_id')
      .in('status', ['submitted', 'published', 'rejected'])
      .order('updated_at', { ascending: false });
    if (error) throw error;
    return (data || []).map((row: any) => {
      const html = row.content_html || '';
      const metrics = this.extractMetricsFromHtml(html);
      return {
        id: row.id,
        title: row.title,
        contentHtml: html,
        coverImage: row.cover_image_url || undefined,
        tags: row.tags || [],
        status: row.status || 'draft',
        createdAt: row.created_at || new Date().toISOString(),
        updatedAt: row.updated_at || new Date().toISOString(),
        wordCount: metrics.wordCount,
        readingTime: metrics.readingTime,
      } as Draft;
    });
  }

  async approveDraft(id: string): Promise<boolean> {
    console.log('Approving draft:', id);
    
    // Get the draft first
    const { data: draft, error: fetchError } = await supabase
      .from('drafts')
      .select('*')
      .eq('id', id)
      .single();
    
    if (fetchError) {
      console.error('Failed to fetch draft:', fetchError);
      throw fetchError;
    }
    if (!draft) throw new Error('Draft not found');

    console.log('Draft found:', draft.title);

    // Generate slug from title
    const slug = draft.title
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim('-');

    // Create article from draft
    const articleData = {
      id: crypto.randomUUID(),
      title: draft.title,
      slug: slug,
      excerpt: this.extractExcerpt(draft.content_html || ''),
      content_html: draft.content_html,
      cover_image_url: draft.cover_image_url,
      tags: draft.tags || [],
      author_id: draft.user_id,
      status: 'published',
      featured: false,
      likes: 0,
      published_at: new Date().toISOString(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    console.log('Inserting article:', articleData.title);

    const { error: articleError } = await supabase
      .from('articles')
      .insert([articleData]);

    if (articleError) {
      console.error('Failed to insert article:', articleError);
      throw articleError;
    }

    console.log('Article inserted successfully');

    // Update draft status to published
    const { error: updateError } = await supabase
      .from('drafts')
      .update({ status: 'published', updated_at: new Date().toISOString() })
      .eq('id', id);
    
    if (updateError) {
      console.error('Failed to update draft status:', updateError);
      throw updateError;
    }

    console.log('Draft status updated to published');
    return true;
  }

  private extractExcerpt(html: string): string {
    const text = html
      .replace(/<style[\s\S]*?<\/style>/gi, '')
      .replace(/<script[\s\S]*?<\/script>/gi, '')
      .replace(/<[^>]+>/g, ' ')
      .replace(/&nbsp;/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
    return text.length > 200 ? text.substring(0, 200) + '...' : text;
  }

  async rejectDraft(id: string, reason?: string): Promise<boolean> {
    const { error } = await supabase
      .from('drafts')
      .update({ status: 'rejected', updated_at: new Date().toISOString(), review_note: reason || null })
      .eq('id', id);
    if (error) throw error;
    return true;
  }

  async importFromDocument(file: File): Promise<{ contentHtml: string; title: string }> {
    const fileName = file.name.replace(/\.[^/.]+$/, '');
    const text = await file.text();
    // Basic markdown/plain conversion: paragraphs on blank lines, <br> on single newlines
    const paragraphs = text
      .split(/\n\s*\n/)
      .map(p => p.replace(/\n/g, '<br>'))
      .map(p => `<p>${p}</p>`) 
      .join('');
    const contentHtml = paragraphs || `<p>${fileName}</p>`;
    return { contentHtml, title: fileName };
  }
}

export const draftService = new DraftService();