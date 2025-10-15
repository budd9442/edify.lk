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
    '- Each option must be a short phrase of at most 6 words.',
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
      const paddedRaw = options.length < 4 ? [...options, ...new Array(4 - options.length).fill('N/A')].slice(0, 4) : options;
      // Enforce max 6 words per option
      const padded = paddedRaw.map((opt) => {
        const words = String(opt || '').trim().split(/\s+/);
        const limited = words.slice(0, 6).join(' ');
        return limited;
      });
      let correctIndex = Number.isInteger(q.correctAnswer) ? q.correctAnswer : 0;
      if (correctIndex < 0 || correctIndex > 3) correctIndex = 0;
      return {
        question: String(q.question || '').trim().slice(0, 280),
        options: padded.map((o) => (String(o || '').trim() || 'N/A')),
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
    'You are a helpful assistant that rewrites HTML content with proper Quill.js formatting and structure.',
    'Analyze the provided content and return ONLY valid JSON with the complete rewritten HTML and suggested tags.',
    'Return ONLY valid JSON matching this TypeScript type (no markdown, no code fences):',
    '{ "rewrittenHtml": string; "suggestedTags": string[] }',
    '',
    'Instructions for rewriting HTML:',
    '- Rewrite the entire HTML content with improved structure and formatting',
    '- Use proper Quill.js classes for all formatting',
    '- Apply consistent spacing and typography',
    '- Improve readability and visual hierarchy',
    '- Do not change the actual text content, only structure and formatting',
    '- CRITICAL: Preserve ALL images, videos, and media elements exactly as they are',
    '- CRITICAL: Keep all <img> tags with their src, alt, class, and style attributes intact',
    '- CRITICAL: Preserve all <figure> and <figcaption> elements if present',
    '- CRITICAL: Maintain the original positioning of media elements within the content',
    '',
    'Quill.js Classes to Use:',
    '- Headers: <h1 class="ql-header ql-header-1">, <h2 class="ql-header ql-header-2">, etc.',
    '- Lists: <ul class="ql-list"><li class="ql-list-item">, <ol class="ql-list"><li class="ql-list-item">',
    '- Blockquotes: <blockquote class="ql-blockquote">',
    '- Code: <code class="ql-code">, <pre class="ql-code-block">',
    '- Dividers: <hr class="ql-divider">',
    '- Bold: <strong class="ql-bold">',
    '- Italic: <em class="ql-italic">',
    '- Paragraphs: <p> with proper spacing',
    '',
    'Formatting Rules:',
    '- Add proper spacing between paragraphs (use <br><br> sparingly)',
    '- Use consistent heading hierarchy (h1 > h2 > h3)',
    '- Add visual breaks between major sections',
    '- Format lists properly with good spacing',
    '- Make blockquotes stand out',
    '- Ensure code blocks are properly formatted',
    '- Apply emphasis where appropriate',
    '',
    'For suggestedTags:',
    '- Generate 3-5 relevant tags based on content (lowercase, no spaces, use hyphens)',
    '- Focus on main topics, themes, and categories',
    '',
    'Content to rewrite (includes all HTML structure and media elements):',
    html.slice(0, 20000), // Use full HTML instead of plain text
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

  // Robust JSON extraction and parsing (handles fences, trailing commas, smart quotes, extra text)
  const tryParsers: Array<(s: string) => string> = [
    // as-is
    (s) => s,
    // strip code fences
    (s) => s.replace(/```json|```/gi, ''),
    // extract between first '{' and last '}'
    (s) => {
      const start = s.indexOf('{');
      const end = s.lastIndexOf('}');
      return start >= 0 && end > start ? s.slice(start, end + 1) : s;
    },
    // normalize smart quotes
    (s) => s.replace(/[“”]/g, '"').replace(/[‘’]/g, "'"),
    // remove trailing commas before } or ]
    (s) => s.replace(/,\s*([}\]])/g, '$1'),
  ];

  let parsed: any = null;
  let lastError: unknown = null;
  for (const transform of tryParsers) {
    const candidate = transform(text);
    try {
      parsed = JSON.parse(candidate);
      break;
    } catch (e) {
      lastError = e;
      continue;
    }
  }
  if (!parsed) {
    console.error('🧠 [AI DEBUG] Failed to parse AI JSON:', lastError);
    return { optimizedHtml: html };
  }

  const rewrittenHtml = parsed?.rewrittenHtml || html;
  const suggestedTags = Array.isArray(parsed?.suggestedTags) ? parsed.suggestedTags : [];
  
  return { 
    optimizedHtml: rewrittenHtml, 
    suggestedTags: suggestedTags.length > 0 ? suggestedTags : undefined 
  };
}



