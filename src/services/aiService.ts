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
    'You are a helpful assistant that improves HTML content structure and readability.',
    'Analyze the provided content and return ONLY valid JSON with HTML improvements and suggested tags.',
    'Return ONLY valid JSON matching this TypeScript type (no markdown, no code fences):',
    '{ "improvements": Array<{ selector: string; action: string; content?: string; description: string; }>; "suggestedTags": string[] }',
    'Actions available:',
    '- "add-spacing": Add <br><br> for better paragraph separation',
    '- "improve-headings": Enhance heading structure and hierarchy',
    '- "add-breaks": Add visual breaks between sections',
    '- "format-lists": Improve list formatting and structure',
    '- "enhance-text": Add emphasis, formatting, or structure to text',
    'Constraints:',
    '- selector: CSS selector (e.g., "p", "h1", "ul", ".content")',
    '- action: One of the available actions above',
    '- content: New HTML content (only for enhance-text action)',
    '- description: Brief explanation of the improvement',
    '- Focus on HTML structure, spacing, and readability',
    '- Do not change the actual text content, only structure and formatting',
    '- suggestedTags: 3-5 relevant tags based on content (lowercase, no spaces, use hyphens)',
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
      maxOutputTokens: 2000,
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
  
  // Apply the AI-generated improvements to the HTML
  const optimizedHtml = applyStructuralImprovements(html, improvements);
  
  return { 
    optimizedHtml, 
    suggestedTags: suggestedTags.length > 0 ? suggestedTags : undefined 
  };
}

function applyStructuralImprovements(html: string, improvements: Array<{ selector: string; action: string; content?: string; description: string }>): string {
  try {
    // Parse HTML
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');
    
    console.log('AI structural improvements received:', improvements);
    
    // Apply each improvement
    improvements.forEach(improvement => {
      try {
        const elements = doc.querySelectorAll(improvement.selector);
        console.log(`Applying ${improvement.action} to ${elements.length} elements:`, improvement.description);
        
        elements.forEach(element => {
          const htmlElement = element as HTMLElement;
          
          switch (improvement.action) {
            case 'add-spacing':
              // Add spacing after paragraphs
              if (htmlElement.tagName === 'P') {
                htmlElement.innerHTML += '<br><br>';
              }
              break;
              
            case 'improve-headings':
              // Ensure proper heading hierarchy
              if (htmlElement.tagName.match(/^H[1-6]$/)) {
                const level = parseInt(htmlElement.tagName.charAt(1));
                if (level > 1) {
                  htmlElement.innerHTML = `<strong>${htmlElement.innerHTML}</strong>`;
                }
              }
              break;
              
            case 'add-breaks':
              // Add visual breaks between sections
              if (htmlElement.tagName === 'H1' || htmlElement.tagName === 'H2') {
                const hr = doc.createElement('hr');
                hr.style.border = 'none';
                hr.style.borderTop = '2px solid #374151';
                hr.style.margin = '2rem 0';
                htmlElement.parentNode?.insertBefore(hr, htmlElement.nextSibling);
              }
              break;
              
            case 'format-lists':
              // Improve list formatting
              if (htmlElement.tagName === 'UL' || htmlElement.tagName === 'OL') {
                const items = htmlElement.querySelectorAll('li');
                items.forEach(li => {
                  if (!li.innerHTML.includes('<br>')) {
                    li.innerHTML += '<br>';
                  }
                });
              }
              break;
              
            case 'enhance-text':
              // Apply text enhancements
              if (improvement.content) {
                htmlElement.innerHTML = improvement.content;
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

function applyFallbackStructuralImprovements(doc: Document): void {
  // Add spacing between paragraphs
  const paragraphs = doc.querySelectorAll('p');
  paragraphs.forEach(p => {
    if (!p.innerHTML.includes('<br><br>')) {
      p.innerHTML += '<br><br>';
    }
  });
  
  // Improve heading structure
  const headings = doc.querySelectorAll('h1, h2, h3, h4, h5, h6');
  headings.forEach((heading, index) => {
    if (index > 0) {
      const hr = doc.createElement('hr');
      hr.style.border = 'none';
      hr.style.borderTop = '1px solid #374151';
      hr.style.margin = '1.5rem 0';
      heading.parentNode?.insertBefore(hr, heading);
    }
  });
  
  // Improve list formatting
  const lists = doc.querySelectorAll('ul, ol');
  lists.forEach(list => {
    const items = list.querySelectorAll('li');
    items.forEach(li => {
      if (!li.innerHTML.includes('<br>')) {
        li.innerHTML += '<br>';
      }
    });
  });
  
  // Add spacing around blockquotes
  const blockquotes = doc.querySelectorAll('blockquote');
  blockquotes.forEach(quote => {
    quote.innerHTML = `<br>${quote.innerHTML}<br>`;
  });
}


