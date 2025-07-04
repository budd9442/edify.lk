import { StrapiBlock, StrapiTextNode } from '../mock-data/strapiBlocks';

export class StrapiBlockUtils {
  // Convert plain text to Strapi blocks
  static textToBlocks(text: string): StrapiBlock[] {
    const lines = text.split('\n').filter(line => line.trim());
    const blocks: StrapiBlock[] = [];

    for (const line of lines) {
      const trimmed = line.trim();
      
      // Detect headings
      if (trimmed.startsWith('#')) {
        const level = Math.min(trimmed.match(/^#+/)?.[0].length || 1, 6);
        const text = trimmed.replace(/^#+\s*/, '');
        blocks.push({
          type: 'heading',
          level,
          children: [{ text }]
        });
      }
      // Detect quotes
      else if (trimmed.startsWith('>')) {
        const text = trimmed.replace(/^>\s*/, '');
        blocks.push({
          type: 'quote',
          children: [{ text }]
        });
      }
      // Detect code blocks
      else if (trimmed.startsWith('```')) {
        const language = trimmed.replace('```', '');
        blocks.push({
          type: 'code',
          language: language || 'text',
          children: [{ text: '' }]
        });
      }
      // Regular paragraphs
      else if (trimmed) {
        blocks.push({
          type: 'paragraph',
          children: [{ text: trimmed }]
        });
      }
    }

    return blocks;
  }

  // Convert Markdown to Strapi blocks (simplified)
  static markdownToBlocks(markdown: string): StrapiBlock[] {
    const lines = markdown.split('\n');
    const blocks: StrapiBlock[] = [];
    let inCodeBlock = false;
    let codeContent = '';
    let codeLanguage = '';

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      
      // Handle code blocks
      if (line.startsWith('```')) {
        if (inCodeBlock) {
          blocks.push({
            type: 'code',
            language: codeLanguage,
            children: [{ text: codeContent.trim() }]
          });
          inCodeBlock = false;
          codeContent = '';
          codeLanguage = '';
        } else {
          inCodeBlock = true;
          codeLanguage = line.replace('```', '').trim();
        }
        continue;
      }

      if (inCodeBlock) {
        codeContent += line + '\n';
        continue;
      }

      // Handle headings
      if (line.startsWith('#')) {
        const level = Math.min(line.match(/^#+/)?.[0].length || 1, 6);
        const text = line.replace(/^#+\s*/, '');
        blocks.push({
          type: 'heading',
          level,
          children: [{ text }]
        });
      }
      // Handle quotes
      else if (line.startsWith('>')) {
        const text = line.replace(/^>\s*/, '');
        blocks.push({
          type: 'quote',
          children: [{ text }]
        });
      }
      // Handle lists
      else if (line.match(/^[\*\-\+]\s/)) {
        const text = line.replace(/^[\*\-\+]\s/, '');
        // Check if previous block is a list
        const lastBlock = blocks[blocks.length - 1];
        if (lastBlock && lastBlock.type === 'list') {
          lastBlock.children.push({
            type: 'list-item',
            children: [{ text }]
          });
        } else {
          blocks.push({
            type: 'list',
            format: 'unordered',
            children: [{
              type: 'list-item',
              children: [{ text }]
            }]
          });
        }
      }
      // Handle numbered lists
      else if (line.match(/^\d+\.\s/)) {
        const text = line.replace(/^\d+\.\s/, '');
        const lastBlock = blocks[blocks.length - 1];
        if (lastBlock && lastBlock.type === 'list' && lastBlock.format === 'ordered') {
          lastBlock.children.push({
            type: 'list-item',
            children: [{ text }]
          });
        } else {
          blocks.push({
            type: 'list',
            format: 'ordered',
            children: [{
              type: 'list-item',
              children: [{ text }]
            }]
          });
        }
      }
      // Regular paragraphs
      else if (line.trim()) {
        const children = this.parseInlineFormatting(line.trim());
        blocks.push({
          type: 'paragraph',
          children
        });
      }
    }

    return blocks;
  }

  // Parse inline formatting (bold, italic, etc.)
  private static parseInlineFormatting(text: string): StrapiTextNode[] {
    const nodes: StrapiTextNode[] = [];
    let currentText = '';
    let i = 0;

    while (i < text.length) {
      const char = text[i];
      const nextChar = text[i + 1];

      // Bold (**text**)
      if (char === '*' && nextChar === '*') {
        if (currentText) {
          nodes.push({ text: currentText });
          currentText = '';
        }
        i += 2;
        let boldText = '';
        while (i < text.length - 1 && !(text[i] === '*' && text[i + 1] === '*')) {
          boldText += text[i];
          i++;
        }
        if (boldText) {
          nodes.push({ text: boldText, bold: true });
        }
        i += 2;
      }
      // Italic (*text*)
      else if (char === '*') {
        if (currentText) {
          nodes.push({ text: currentText });
          currentText = '';
        }
        i++;
        let italicText = '';
        while (i < text.length && text[i] !== '*') {
          italicText += text[i];
          i++;
        }
        if (italicText) {
          nodes.push({ text: italicText, italic: true });
        }
        i++;
      }
      // Code (`text`)
      else if (char === '`') {
        if (currentText) {
          nodes.push({ text: currentText });
          currentText = '';
        }
        i++;
        let codeText = '';
        while (i < text.length && text[i] !== '`') {
          codeText += text[i];
          i++;
        }
        if (codeText) {
          nodes.push({ text: codeText, code: true });
        }
        i++;
      }
      else {
        currentText += char;
        i++;
      }
    }

    if (currentText) {
      nodes.push({ text: currentText });
    }

    return nodes.length > 0 ? nodes : [{ text }];
  }

  // Convert Strapi blocks to plain text
  static blocksToText(blocks: StrapiBlock[]): string {
    return blocks.map(block => this.blockToText(block)).join('\n\n');
  }

  private static blockToText(block: StrapiBlock): string {
    switch (block.type) {
      case 'heading':
        const hashes = '#'.repeat(block.level || 1);
        return `${hashes} ${this.childrenToText(block.children)}`;
      case 'quote':
        return `> ${this.childrenToText(block.children)}`;
      case 'code':
        return `\`\`\`${block.language || ''}\n${this.childrenToText(block.children)}\n\`\`\``;
      case 'list':
        return block.children.map((item, index) => {
          const prefix = block.format === 'ordered' ? `${index + 1}. ` : '- ';
          return `${prefix}${this.childrenToText(item.children)}`;
        }).join('\n');
      default:
        return this.childrenToText(block.children);
    }
  }

  private static childrenToText(children: (StrapiTextNode | StrapiBlock)[]): string {
    return children.map(child => {
      if ('text' in child) {
        return child.text;
      } else {
        return this.blockToText(child);
      }
    }).join('');
  }

  // Calculate reading time and word count
  static analyzeContent(blocks: StrapiBlock[]): { wordCount: number; readingTime: number } {
    const text = this.blocksToText(blocks);
    const words = text.split(/\s+/).filter(word => word.length > 0);
    const wordCount = words.length;
    const readingTime = Math.max(1, Math.ceil(wordCount / 200)); // 200 words per minute

    return { wordCount, readingTime };
  }

  // Validate Strapi blocks structure
  static validateBlocks(blocks: StrapiBlock[]): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    for (const block of blocks) {
      if (!block.type) {
        errors.push('Block missing type property');
      }

      if (!block.children || !Array.isArray(block.children)) {
        errors.push(`Block of type "${block.type}" missing children array`);
      }

      if (block.type === 'heading' && (!block.level || block.level < 1 || block.level > 6)) {
        errors.push('Heading block must have level between 1 and 6');
      }

      if (block.type === 'list' && !['ordered', 'unordered'].includes(block.format || '')) {
        errors.push('List block must have format "ordered" or "unordered"');
      }
    }

    return { valid: errors.length === 0, errors };
  }

  // Generate a preview excerpt from blocks
  static generateExcerpt(blocks: StrapiBlock[], maxLength: number = 160): string {
    const text = this.blocksToText(blocks);
    if (text.length <= maxLength) return text;
    
    const truncated = text.substring(0, maxLength);
    const lastSpace = truncated.lastIndexOf(' ');
    
    return lastSpace > 0 ? truncated.substring(0, lastSpace) + '...' : truncated + '...';
  }
}