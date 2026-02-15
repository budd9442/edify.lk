import { marked } from 'marked';
import mammoth from 'mammoth';
import supabase from './supabaseClient';
import { safeQuery } from './supabaseUtils';
import { Draft } from '../types/payload';
import * as pdfjsLib from 'pdfjs-dist';

// Configure PDF.js worker using unpkg CDN (matches the package layout)
(pdfjsLib as any).GlobalWorkerOptions.workerSrc =
  `https://unpkg.com/pdfjs-dist@${(pdfjsLib as any).version}/build/pdf.worker.min.mjs`;

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

    const { data, error } = await safeQuery('drafts/list', () =>
      supabase
        .from('drafts')
        .select('id,title,content_html,cover_image_url,tags,status,created_at,updated_at,quiz_questions_json,custom_author,rejection_reason')
        .eq('user_id', userId)
        .order('updated_at', { ascending: false })
        .then((res: any) => {
          if (res.error) throw res.error;
          return res.data;
        })
    );
    if (error) throw error;
    return ((data as any) || []).map((row: any) => {
      const html = row.content_html || '';
      const metrics = this.extractMetricsFromHtml(html);
      const draftObj = {
        id: row.id,
        title: row.title,
        contentHtml: html,
        coverImage: row.cover_image_url || undefined,
        tags: row.tags || [],
        status: row.status || 'draft',
        customAuthor: row.custom_author || undefined,
        rejectionReason: row.rejection_reason || undefined,
        createdAt: row.created_at || new Date().toISOString(),
        updatedAt: row.updated_at || new Date().toISOString(),
        wordCount: metrics.wordCount,
        readingTime: metrics.readingTime,
      } as Draft;
      // Attach quiz questions to returned draft object (non-typed extension)
      (draftObj as any).quizQuestions = row.quiz_questions_json || [];
      return draftObj;
    });
  }

  async getDraft(id: string): Promise<Draft | null> {
    const { data, error } = await safeQuery('drafts/get', () =>
      supabase
        .from('drafts')
        .select('id,title,content_html,cover_image_url,tags,status,created_at,updated_at,quiz_questions_json,custom_author,rejection_reason')
        .eq('id', id)
        .single()
        .then((res: any) => {
          if (res.error) throw res.error;
          return res.data;
        })
    );
    if (error) {
      if ((error as any).code === 'PGRST116') return null;
      throw error;
    }
    const html = (data as any).content_html || '';
    const metrics = this.extractMetricsFromHtml(html);
    const draft: Draft = {
      id: (data as any).id,
      title: (data as any).title,
      contentHtml: html,
      coverImage: (data as any).cover_image_url || undefined,
      tags: (data as any).tags || [],
      status: (data as any).status || 'draft',
      customAuthor: (data as any).custom_author || undefined,
      rejectionReason: (data as any).rejection_reason || undefined,
      createdAt: (data as any).created_at || new Date().toISOString(),
      updatedAt: (data as any).updated_at || new Date().toISOString(),
      wordCount: metrics.wordCount,
      readingTime: metrics.readingTime,
    } as Draft;
    (draft as any).quizQuestions = (data as any).quiz_questions_json || [];
    return draft;
  }

  async saveDraft(draft: Omit<Draft, 'id' | 'createdAt' | 'updatedAt' | 'wordCount' | 'readingTime'> & { id?: string; userId?: string } & { quizQuestions?: any[] }): Promise<Draft> {
    const html = draft.contentHtml || '';
    const status = draft.status || 'draft';
    const payload: any = {
      title: draft.title,
      content_html: html,
      cover_image_url: draft.coverImage || null,
      tags: draft.tags || [],
      status,
      custom_author: draft.customAuthor || null,
      // Clear rejection reason when transitioning back to draft/submitted
      ...(status === 'draft' || status === 'submitted' ? { rejection_reason: null } : {}),
      // Optional: persist quiz questions if column exists
      quiz_questions_json: (draft as any).quizQuestions ?? undefined,
    };
    let saved: any;
    if (draft.id) {
      const { data, error } = await safeQuery('drafts/update', () =>
        supabase
          .from('drafts')
          .update({ ...payload, updated_at: new Date().toISOString() })
          .eq('id', draft.id)
          .select()
          .single()
          .then((res: any) => {
            if (res.error) throw res.error;
            return res.data;
          })
      );
      if (error) throw error;
      saved = data;
    } else {
      if (!draft.userId) {
        throw new Error('Missing userId for new draft');
      }
      const { data, error } = await safeQuery('drafts/insert', () =>
        supabase
          .from('drafts')
          .insert([{ ...payload, user_id: draft.userId }])
          .select()
          .single()
          .then((res: any) => {
            if (res.error) throw res.error;
            return res.data;
          })
      );
      if (error) throw error;
      saved = data;
    }
    const metrics = this.extractMetricsFromHtml(saved.content_html || '');
    const result: Draft = {
      id: saved.id,
      title: saved.title,
      contentHtml: saved.content_html || '',
      coverImage: saved.cover_image_url || undefined,
      tags: saved.tags || [],
      status: saved.status || 'draft',
      customAuthor: saved.custom_author || undefined,
      rejectionReason: saved.rejection_reason || undefined,
      createdAt: saved.created_at || new Date().toISOString(),
      updatedAt: saved.updated_at || new Date().toISOString(),
      wordCount: metrics.wordCount,
      readingTime: metrics.readingTime,
    } as Draft;
    (result as any).quizQuestions = saved.quiz_questions_json || (draft as any).quizQuestions || [];
    return result;
  }

  async deleteDraft(id: string): Promise<boolean> {
    const { error } = await supabase.from('drafts').delete().eq('id', id);
    if (error) throw error;
    return true;
  }

  async deleteDraftAndArticle(draftId: string, userId: string, title: string): Promise<boolean> {
    // 1. Try to find the article
    // We try ID first (for articles linked by ID), then author+title (for legacy articles)
    let articleIdToDelete: string | null = null;

    const { data: byId } = await supabase.from('articles').select('id').eq('id', draftId).maybeSingle();
    if (byId) {
      articleIdToDelete = byId.id;
    } else {
      const { data: byFuzzy } = await supabase
        .from('articles')
        .select('id')
        .eq('author_id', userId)
        .eq('title', title)
        .maybeSingle();
      if (byFuzzy) articleIdToDelete = byFuzzy.id;
    }

    if (articleIdToDelete) {
      // Delete associated quizzes first
      await supabase.from('quizzes').delete().eq('article_id', articleIdToDelete);

      // Delete associated likes
      await supabase.from('likes').delete().eq('article_id', articleIdToDelete);

      // Delete associated comments
      await supabase.from('comments').delete().eq('article_id', articleIdToDelete);

      const { error: articleError } = await supabase
        .from('articles')
        .delete()
        .eq('id', articleIdToDelete);

      if (articleError) {
        console.error('Failed to delete associated article:', articleError);
      }
    }

    // 2. Delete the draft
    return this.deleteDraft(draftId);
  }

  async submitForReview(id: string): Promise<boolean> {
    const { error } = await supabase
      .from('drafts')
      .update({ status: 'submitted', updated_at: new Date().toISOString(), rejection_reason: null })
      .eq('id', id);
    if (error) throw error;
    return true;
  }

  async getSubmittedDrafts(): Promise<Draft[]> {
    const { data, error } = await supabase
      .from('drafts')
      .select('id,title,content_html,cover_image_url,tags,status,created_at,updated_at,user_id,custom_author')
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
        customAuthor: row.custom_author || undefined,
        createdAt: row.created_at || new Date().toISOString(),
        updatedAt: row.updated_at || new Date().toISOString(),
        wordCount: metrics.wordCount,
        readingTime: metrics.readingTime,
      } as Draft;
    });
  }

  async approveDraft(id: string): Promise<boolean> {
    //console.log('Approving draft:', id);

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

    //console.log('Draft found:', draft.title);

    // Validate title is not empty
    if (!draft.title || draft.title.trim().length === 0) {
      throw new Error('Cannot approve draft: Title is required');
    }

    // Generate slug from title
    const slug = draft.title
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim('-');

    // Create article from draft
    const articleData = {
      id: draft.id, // Use draft ID as article ID for direct linking
      title: draft.title,
      slug: slug,
      excerpt: this.extractExcerpt(draft.content_html || ''),
      content_html: draft.content_html,
      cover_image_url: draft.cover_image_url,
      tags: draft.tags || [],
      author_id: draft.user_id,
      custom_author: draft.custom_author,
      status: 'published',
      featured: false,
      likes: 0,
      published_at: new Date().toISOString(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    //console.log('Inserting article:', articleData.title);

    const { error: articleError } = await supabase
      .from('articles')
      .insert([articleData]);

    if (articleError) {
      console.error('Failed to insert article:', articleError);
      throw articleError;
    }

    //console.log('Article inserted successfully');

    // If the draft has quiz questions, attempt to create a quiz for this article
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
          .insert([{ article_id: articleData.id, title: 'Article Quiz', questions_json: normalized }]);

        if (quizError) {
          console.warn('Quiz creation failed (non-fatal):', quizError);
        } else {
          //console.log('Quiz created for article');
        }
      }
    } catch (qerr) {
      console.warn('Quiz creation step failed (non-fatal):', qerr);
    }

    // Update draft status to published
    const { error: updateError } = await supabase
      .from('drafts')
      .update({ status: 'published', updated_at: new Date().toISOString() })
      .eq('id', id);

    if (updateError) {
      console.error('Failed to update draft status:', updateError);
      throw updateError;
    }

    //console.log('Draft status updated to published');
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
      .update({ status: 'rejected', updated_at: new Date().toISOString(), rejection_reason: reason || null })
      .eq('id', id);
    if (error) throw error;
    return true;
  }

  async importFromDocument(file: File): Promise<{ contentHtml: string; title: string }> {
    const fileName = file.name.replace(/\.[^/.]+$/, '');
    const fileExtension = file.name.toLowerCase().substring(file.name.lastIndexOf('.'));

    try {
      let contentHtml: string;

      switch (fileExtension) {
        case '.docx':
          // Parse Word document using mammoth
          const mammothResult = await mammoth.convertToHtml({ arrayBuffer: await file.arrayBuffer() });
          contentHtml = mammothResult.value;

          // Clean up mammoth's HTML output
          contentHtml = this.cleanWordHtml(contentHtml);
          break;

        case '.md':
          // Parse Markdown using marked
          const markdownText = await file.text();
          contentHtml = await Promise.resolve(marked(markdownText));
          break;

        case '.txt':
          // Parse plain text
          const textContent = await file.text();
          contentHtml = this.convertTextToHtml(textContent);
          break;

        case '.doc':
          // For .doc files, try to read as text (basic support)
          const docText = await file.text();
          contentHtml = this.convertTextToHtml(docText);
          break;

        case '.pdf':
          const pdfText = await this.parsePdf(file);
          contentHtml = this.convertTextToHtml(pdfText);
          break;

        default:
          throw new Error(`Unsupported file format: ${fileExtension}`);
      }

      return {
        contentHtml: contentHtml || `<p>${fileName}</p>`,
        title: fileName
      };

    } catch (error) {
      console.error('Document import error:', error);
      throw new Error(`Failed to import document: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private cleanWordHtml(html: string): string {
    // Remove Word-specific styling and clean up the HTML
    return html
      .replace(/<o:p\s*\/?>/g, '') // Remove Word's o:p tags
      .replace(/<w:[^>]*>/g, '') // Remove Word's w: tags
      .replace(/class="[^"]*"/g, '') // Remove classes
      .replace(/style="[^"]*"/g, '') // Remove inline styles
      .replace(/<p><\/p>/g, '') // Remove empty paragraphs
      .replace(/<p>\s*<\/p>/g, '') // Remove whitespace-only paragraphs
      .replace(/\s+/g, ' ') // Normalize whitespace
      .trim();
  }

  private convertTextToHtml(text: string): string {
    // Convert plain text to HTML with proper paragraph breaks
    return text
      .split(/\n\s*\n/) // Split on double newlines
      .map(paragraph => paragraph.trim())
      .filter(paragraph => paragraph.length > 0)
      .map(paragraph => `<p>${paragraph.replace(/\n/g, '<br>')}</p>`)
      .join('');
  }
  private async parsePdf(file: File): Promise<string> {
    try {
      const arrayBuffer = await file.arrayBuffer();
      const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
      let fullText = '';

      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const textContent = await page.getTextContent();
        const pageText = textContent.items
          .map((item: any) => item.str)
          .join(' ');
        fullText += pageText + '\n\n';
      }

      return fullText;
    } catch (error) {
      console.error('PDF parsing error:', error);
      throw new Error('Failed to parse PDF file');
    }
  }
}

export const draftService = new DraftService();