// Lightweight AI service for generating quiz questions from article HTML using Google Gemini
// Reads API key from Vite env: VITE_GEMINI_API_KEY

type GeneratedOption = string;

export interface GeneratedQuizQuestion {
  question: string;
  options: GeneratedOption[];
  correctAnswer: number; // index into options
  explanation?: string;
}

function extractPlainTextFromHtml(html: string): string {
  return (html || '')
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function buildPrompt(plainText: string, numQuestions: number): string {
  const safeCount = Math.min(Math.max(numQuestions || 5, 1), 10);
  return [
    'You are a helpful assistant that creates multiple-choice quiz questions from provided article content.',
    `Create ${safeCount} questions that are factual and answerable strictly from the content.`,
    'Return ONLY valid JSON matching this TypeScript type (no markdown, no code fences):',
    '{ "questions": Array<{ question: string; options: string[]; correctAnswer: number; explanation?: string; }> }',
    'Constraints:',
    '- Each question must have 4 options.',
    '- correctAnswer is the 0-based index into options.',
    '- Keep questions concise; explanations optional but helpful.',
    '- Do not include any text outside the JSON object.',
    '',
    'Article content:',
    plainText.slice(0, 20000),
  ].join('\n');
}

export async function generateQuizFromHtml(html: string, numQuestions: number = 5): Promise<GeneratedQuizQuestion[]> {
  const apiKey = (import.meta as any).env?.VITE_GEMINI_API_KEY || (globalThis as any).VITE_GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('Missing VITE_GEMINI_API_KEY');
  }

  const plain = extractPlainTextFromHtml(html);
  if (!plain) {
    return [];
  }

  const prompt = buildPrompt(plain, numQuestions);

  // Gemini 2.0 Flash generateContent REST API
  const url = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent';

  const body = {
    contents: [
      {
        parts: [{ text: prompt }],
      },
    ],
    generationConfig: {
      temperature: 0.3,
      maxOutputTokens: 1200,
    },
  } as any;

  const resp = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-goog-api-key': apiKey },
    body: JSON.stringify(body),
  });

  if (!resp.ok) {
    const errText = await resp.text().catch(() => '');
    throw new Error(`Gemini API error: ${resp.status} ${errText}`);
  }

  const data = await resp.json();
  const text: string = data?.candidates?.[0]?.content?.parts?.[0]?.text || '';
  if (!text) return [];

  // Some models wrap JSON in fences or add text; try to extract JSON object
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  const jsonRaw = jsonMatch ? jsonMatch[0] : text;

  let parsed: any;
  try {
    parsed = JSON.parse(jsonRaw);
  } catch (e) {
    // As a fallback, attempt to sanitize common issues
    const sanitized = jsonRaw
      .replace(/```json|```/g, '')
      .replace(/\n/g, '\n');
    parsed = JSON.parse(sanitized);
  }

  const questions: GeneratedQuizQuestion[] = Array.isArray(parsed?.questions) ? parsed.questions : [];

  // Normalize and enforce constraints
  const normalized = questions
    .slice(0, 10)
    .map((q) => {
      const options: string[] = Array.isArray(q.options) ? q.options.slice(0, 4) : [];
      const padded = options.length < 4 ? [...options, ...new Array(4 - options.length).fill('N/A')].slice(0, 4) : options;
      let correctIndex = Number.isInteger(q.correctAnswer) ? q.correctAnswer : 0;
      if (correctIndex < 0 || correctIndex > 3) correctIndex = 0;
      return {
        question: String(q.question || '').trim().slice(0, 280),
        options: padded.map((o) => String(o || '').trim() || 'N/A'),
        correctAnswer: correctIndex,
        explanation: q.explanation ? String(q.explanation).trim().slice(0, 500) : undefined,
      } as GeneratedQuizQuestion;
    })
    .filter((q) => q.question && q.options.every(Boolean));

  return normalized;
}

export async function organizeContentWithAI(html: string): Promise<{ optimizedHtml: string; suggestedTags?: string[] }> {
  const apiKey = (import.meta as any).env?.VITE_GEMINI_API_KEY || (globalThis as any).VITE_GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('Missing VITE_GEMINI_API_KEY');
  }

  const plain = extractPlainTextFromHtml(html);
  if (!plain) {
    return { optimizedHtml: html };
  }

  const prompt = [
    'You are a helpful assistant that improves HTML content structure and readability for Quill.js editor.',
    'Analyze the provided content and return ONLY valid JSON with structural improvements and suggested tags.',
    'Return ONLY valid JSON matching this TypeScript type (no markdown, no code fences):',
    '{ "improvements": Array<{ selector: string; action: string; content?: string; description: string; }>; "suggestedTags": string[] }',
    '',
    'Available Actions:',
    '- "add-spacing": Add <br><br> for better paragraph separation (only if not already present)',
    '- "improve-headings": Enhance heading structure with Quill header classes (ql-header ql-header-1, etc.)',
    '- "add-breaks": Add visual breaks between sections using <hr class="ql-divider">',
    '- "format-lists": Improve list formatting with Quill classes (ql-list, ql-list-item)',
    '- "enhance-text": Add Quill-compatible formatting (ql-blockquote, ql-code, ql-bold, ql-italic)',
    '',
    'Constraints:',
    '- selector: CSS selector (e.g., "p", "h1", "ul", ".content")',
    '- action: One of the available actions above',
    '- content: New HTML content with Quill classes (only for enhance-text action)',
    '- description: Brief explanation of the improvement',
    '- Focus on Quill.js-compatible formatting and structure',
    '- Do not change the actual text content, only structure and formatting',
    '- Avoid duplicate improvements (check if already applied)',
    '- Use Quill classes: ql-header, ql-list, ql-blockquote, ql-code, ql-divider, ql-bold, ql-italic',
    '- CRITICAL: Preserve ALL images, videos, and media elements exactly as they are',
    '- CRITICAL: Keep all <img> tags with their src, alt, class, and style attributes intact',
    '- CRITICAL: Preserve all <figure> and <figcaption> elements if present',
    '',
    'For suggestedTags:',
    '- Generate 3-5 relevant tags based on content (lowercase, no spaces, use hyphens)',
    '- Focus on main topics, themes, and categories',
    '',
    'Content to optimize:',
    plain.slice(0, 15000),
  ].join('\n');

  const url = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent';

  const body = {
    contents: [
      {
        parts: [{ text: prompt }],
      },
    ],
    generationConfig: {
      temperature: 0.2,
      maxOutputTokens: 3000,
    },
  } as any;

  const resp = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-goog-api-key': apiKey },
    body: JSON.stringify(body),
  });

  if (!resp.ok) {
    const errText = await resp.text().catch(() => '');
    throw new Error(`Gemini API error: ${resp.status} ${errText}`);
  }

  const data = await resp.json();
  const text: string = data?.candidates?.[0]?.content?.parts?.[0]?.text || '';
  if (!text) return { optimizedHtml: html };

  // Extract JSON from response
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  const jsonRaw = jsonMatch ? jsonMatch[0] : text;

  let parsed: any;
  try {
    parsed = JSON.parse(jsonRaw);
  } catch (e) {
    const sanitized = jsonRaw
      .replace(/```json|```/g, '')
      .replace(/\n/g, '\n');
    parsed = JSON.parse(sanitized);
  }

  const improvements = Array.isArray(parsed?.improvements) ? parsed.improvements : [];
  const suggestedTags = Array.isArray(parsed?.suggestedTags) ? parsed.suggestedTags : [];

  const optimizedHtml = applyStructuralImprovements(html, improvements);
  
  return { 
    optimizedHtml, 
    suggestedTags: suggestedTags.length > 0 ? suggestedTags : undefined 
  };
}

function applyStructuralImprovements(html: string, improvements: Array<{ selector: string; action: string; content?: string; description: string }>): string {
  try {
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');
    
    console.log('AI structural improvements received:', improvements);
    
    // Track applied improvements to prevent duplicates
    const appliedImprovements = new Set<string>();
    
    // Apply each improvement
    improvements.forEach(improvement => {
      try {
        const elements = doc.querySelectorAll(improvement.selector);
        console.log(`Applying ${improvement.action} to ${elements.length} elements:`, improvement.description);
        
        elements.forEach(element => {
          const htmlElement = element as HTMLElement;
          const elementId = `${improvement.selector}-${improvement.action}-${htmlElement.tagName}`;
          
          // Skip if already applied to this element type
          if (appliedImprovements.has(elementId)) {
            return;
          }
          
          switch (improvement.action) {
            case 'add-spacing':
              // Only add spacing if not already present - comprehensive check
              if (htmlElement.tagName === 'P') {
                const innerHTML = htmlElement.innerHTML;
                const hasSpacing = innerHTML.includes('<br><br>') || 
                                 innerHTML.includes('<br><br><br>') ||
                                 innerHTML.endsWith('<br><br>') ||
                                 innerHTML.endsWith('<br><br><br>') ||
                                 innerHTML.includes('ql-spacing') ||
                                 htmlElement.classList.contains('ql-spacing');
                
                if (!hasSpacing) {
                  htmlElement.innerHTML += '<br><br>';
                  appliedImprovements.add(elementId);
                }
              }
              break;
              
            case 'improve-headings':
              // Use Quill-compatible formatting
              if (htmlElement.tagName.match(/^H[1-6]$/) && !htmlElement.classList.contains('ql-header')) {
                const level = parseInt(htmlElement.tagName.charAt(1));
                htmlElement.setAttribute('class', `ql-header ql-header-${level}`);
                appliedImprovements.add(elementId);
              }
              break;
              
            case 'add-breaks':
              // Add visual breaks between sections (only if not already present)
              if ((htmlElement.tagName === 'H1' || htmlElement.tagName === 'H2') && 
                  !htmlElement.nextElementSibling?.tagName?.includes('HR')) {
                const hr = doc.createElement('hr');
                hr.setAttribute('class', 'ql-divider');
                htmlElement.parentNode?.insertBefore(hr, htmlElement.nextSibling);
                appliedImprovements.add(elementId);
              }
              break;
              
            case 'format-lists':
              // Improve list formatting with Quill classes
              if ((htmlElement.tagName === 'UL' || htmlElement.tagName === 'OL') && 
                  !htmlElement.classList.contains('ql-list')) {
                htmlElement.setAttribute('class', 'ql-list');
                const items = htmlElement.querySelectorAll('li');
                items.forEach(li => {
                  if (!li.classList.contains('ql-list-item')) {
                    li.setAttribute('class', 'ql-list-item');
                    if (!li.innerHTML.includes('<br>')) {
                      li.innerHTML += '<br>';
                    }
                  }
                });
                appliedImprovements.add(elementId);
              }
              break;
              
            case 'enhance-text':
              // Apply Quill-compatible text enhancements
              if (improvement.content && !htmlElement.classList.contains('ql-enhanced')) {
                // Parse and apply Quill formatting
                const tempDiv = doc.createElement('div');
                tempDiv.innerHTML = improvement.content;
                const quillFormatted = convertToQuillFormat(tempDiv);
                htmlElement.innerHTML = quillFormatted;
                htmlElement.classList.add('ql-enhanced');
                appliedImprovements.add(elementId);
              }
              break;
          }
        });
      } catch (e) {
        console.warn('Failed to apply improvement:', improvement.selector, e);
      }
    });
    
    // If no improvements were applied, apply fallback structural improvements
    if (improvements.length === 0) {
      console.log('Applying fallback structural improvements');
      applyFallbackStructuralImprovements(doc);
    }
    
    return doc.body.innerHTML;
  } catch (error) {
    console.error('Failed to apply structural improvements:', error);
    return html;
  }
}

function convertToQuillFormat(element: HTMLElement): string {
  // Convert common HTML elements to Quill-compatible classes
  let html = element.innerHTML;
  
  // Convert headers to Quill header classes
  html = html.replace(/<h([1-6])/g, '<h$1 class="ql-header ql-header-$1"');
  
  // Convert lists to Quill list classes
  html = html.replace(/<ul/g, '<ul class="ql-list"');
  html = html.replace(/<ol/g, '<ol class="ql-list"');
  html = html.replace(/<li/g, '<li class="ql-list-item"');
  
  // Convert blockquotes to Quill blockquote
  html = html.replace(/<blockquote/g, '<blockquote class="ql-blockquote"');
  
  // Convert code blocks
  html = html.replace(/<pre/g, '<pre class="ql-code-block"');
  html = html.replace(/<code/g, '<code class="ql-code"');
  
  return html;
}

function applyFallbackStructuralImprovements(doc: Document): void {
  // Add spacing between paragraphs (only if not already present)
  const paragraphs = doc.querySelectorAll('p');
  paragraphs.forEach(p => {
    const innerHTML = p.innerHTML;
    const hasSpacing = innerHTML.includes('<br><br>') || 
                      innerHTML.includes('<br><br><br>') ||
                      innerHTML.endsWith('<br><br>') ||
                      innerHTML.endsWith('<br><br><br>') ||
                      innerHTML.includes('ql-spacing') ||
                      p.classList.contains('ql-spacing');
    if (!hasSpacing) {
      p.innerHTML += '<br><br>';
    }
  });
  
  // Improve heading structure with Quill classes
  const headings = doc.querySelectorAll('h1, h2, h3, h4, h5, h6');
  headings.forEach((heading, index) => {
    if (!heading.classList.contains('ql-header')) {
      const level = parseInt(heading.tagName.charAt(1));
      heading.setAttribute('class', `ql-header ql-header-${level}`);
      
      // Add visual breaks between major sections (only if not already present)
      if (index > 0 && (heading.tagName === 'H1' || heading.tagName === 'H2') && 
          !heading.previousElementSibling?.tagName?.includes('HR')) {
        const hr = doc.createElement('hr');
        hr.setAttribute('class', 'ql-divider');
        heading.parentNode?.insertBefore(hr, heading);
      }
    }
  });
  
  // Improve list formatting with Quill classes
  const lists = doc.querySelectorAll('ul, ol');
  lists.forEach(list => {
    if (!list.classList.contains('ql-list')) {
      list.setAttribute('class', 'ql-list');
      const items = list.querySelectorAll('li');
      items.forEach(li => {
        if (!li.classList.contains('ql-list-item')) {
          li.setAttribute('class', 'ql-list-item');
          if (!li.innerHTML.includes('<br>')) {
            li.innerHTML += '<br>';
          }
        }
      });
    }
  });
  
  // Add Quill classes to blockquotes
  const blockquotes = doc.querySelectorAll('blockquote');
  blockquotes.forEach(quote => {
    if (!quote.classList.contains('ql-blockquote')) {
      quote.setAttribute('class', 'ql-blockquote');
      if (!quote.innerHTML.startsWith('<br>')) {
        quote.innerHTML = `<br>${quote.innerHTML}<br>`;
      }
    }
  });
  
  // Add Quill classes to code blocks
  const codeBlocks = doc.querySelectorAll('pre');
  codeBlocks.forEach(pre => {
    if (!pre.classList.contains('ql-code-block')) {
      pre.setAttribute('class', 'ql-code-block');
    }
  });
  
  const inlineCode = doc.querySelectorAll('code');
  inlineCode.forEach(code => {
    if (!code.classList.contains('ql-code')) {
      code.setAttribute('class', 'ql-code');
    }
  });
}


