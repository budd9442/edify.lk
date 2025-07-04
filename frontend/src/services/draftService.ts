import { Draft, mockDrafts } from '../mock-data/strapiBlocks';
import { StrapiBlockUtils } from './strapiBlockUtils';

// Simulate API delay
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

class DraftService {
  private drafts: Draft[] = [...mockDrafts];

  async getDrafts(userId: string): Promise<Draft[]> {
    await delay(600);
    return this.drafts.filter(draft => draft.status === 'draft');
  }

  async getDraft(id: string): Promise<Draft | null> {
    await delay(400);
    return this.drafts.find(draft => draft.id === id) || null;
  }

  async saveDraft(draft: Omit<Draft, 'id' | 'createdAt' | 'updatedAt' | 'wordCount' | 'readingTime'>): Promise<Draft> {
    await delay(800);
    
    const { wordCount, readingTime } = StrapiBlockUtils.analyzeContent(draft.content);
    
    const existingDraft = this.drafts.find(d => d.title === draft.title);
    
    if (existingDraft) {
      // Update existing draft
      const updatedDraft: Draft = {
        ...existingDraft,
        ...draft,
        updatedAt: new Date().toISOString(),
        wordCount,
        readingTime
      };
      
      const index = this.drafts.findIndex(d => d.id === existingDraft.id);
      this.drafts[index] = updatedDraft;
      
      return updatedDraft;
    } else {
      // Create new draft
      const newDraft: Draft = {
        ...draft,
        id: `draft-${Date.now()}`,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        wordCount,
        readingTime
      };
      
      this.drafts.push(newDraft);
      return newDraft;
    }
  }

  async deleteDraft(id: string): Promise<boolean> {
    await delay(400);
    const index = this.drafts.findIndex(draft => draft.id === id);
    if (index !== -1) {
      this.drafts.splice(index, 1);
      return true;
    }
    return false;
  }

  async submitForReview(id: string): Promise<boolean> {
    await delay(600);
    const draft = this.drafts.find(d => d.id === id);
    if (draft) {
      draft.status = 'submitted';
      draft.updatedAt = new Date().toISOString();
      return true;
    }
    return false;
  }

  async importFromDocument(file: File): Promise<{ content: any; title: string }> {
    await delay(1200); // Simulate file processing
    
    // Mock document parsing
    const fileName = file.name.replace(/\.[^/.]+$/, '');
    const mockContent = `# ${fileName}

This is imported content from your document. The system has automatically converted it to structured blocks.

## Key Features
- Automatic heading detection
- Paragraph formatting
- List preservation
- **Bold** and *italic* text support

> This is a quote that was preserved from your original document.

\`\`\`javascript
// Code blocks are also supported
const example = "Hello World";
\`\`\`

The import process maintains the structure while converting to our block-based format for optimal editing and publishing.`;

    const blocks = StrapiBlockUtils.markdownToBlocks(mockContent);
    
    return {
      content: blocks,
      title: fileName
    };
  }

  // Development helper
  resetDrafts(): void {
    this.drafts = [...mockDrafts];
  }
}

export const draftService = new DraftService();