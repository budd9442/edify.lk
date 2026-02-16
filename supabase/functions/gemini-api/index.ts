import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
    // Handle CORS preflight requests
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY')
        if (!GEMINI_API_KEY) {
            throw new Error('Missing GEMINI_API_KEY environment variable')
        }

        const { action, ...data } = await req.json()

        if (action === 'generateQuiz') {
            const result = await handleGenerateQuiz(data, GEMINI_API_KEY)
            return result
        } else if (action === 'organizeContent') {
            const result = await handleOrganizeContent(data, GEMINI_API_KEY)
            return result
        } else {
            throw new Error(`Unknown action: ${action}`)
        }

    } catch (error) {
        return new Response(JSON.stringify({ error: error.message }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 400,
        })
    }
})

async function handleGenerateQuiz({ html, numQuestions = 5 }: { html: string; numQuestions?: number }, apiKey: string) {
    const plainText = extractPlainTextFromHtml(html)
    if (!plainText) {
        return new Response(JSON.stringify([]), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
    }

    const prompt = buildQuizPrompt(plainText, numQuestions)
    const resultText = await callGemini(prompt, apiKey, 0.3, 1200)

    // Parse and normalize logic similar to frontend
    const questions = parseQuizResponse(resultText)

    return new Response(JSON.stringify(questions), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
}

async function handleOrganizeContent({ html, userPrompt }: { html: string; userPrompt?: string }, apiKey: string) {
    const plainText = extractPlainTextFromHtml(html)
    if (!plainText) {
        return new Response(JSON.stringify({ optimizedHtml: html }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
    }

    const prompt = buildOrganizePrompt(html, userPrompt)

    const resultText = await callGemini(prompt, apiKey, 0.2, 3000)
    const parsed = parseOrganizeResponse(resultText, html)

    return new Response(JSON.stringify(parsed), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
}

// --- Helpers ---

async function callGemini(prompt: string, apiKey: string, temperature: number, maxOutputTokens: number) {
    const url = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent'
    const body = {
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { temperature, maxOutputTokens },
    }

    const resp = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-goog-api-key': apiKey },
        body: JSON.stringify(body),
    })

    if (!resp.ok) {
        const errText = await resp.text()
        throw new Error(`Gemini API error: ${resp.status} ${errText}`)
    }

    const data = await resp.json()
    return data?.candidates?.[0]?.content?.parts?.[0]?.text || ''
}

function extractPlainTextFromHtml(html: string): string {
    return (html || '')
        .replace(/<style[\s\S]*?<\/style>/gi, '')
        .replace(/<script[\s\S]*?<\/script>/gi, '')
        .replace(/<[^>]+>/g, ' ')
        .replace(/&nbsp;/g, ' ')
        .replace(/\s+/g, ' ')
        .trim()
}

function buildQuizPrompt(plainText: string, numQuestions: number): string {
    const safeCount = Math.min(Math.max(numQuestions || 5, 1), 10)
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
    ].join('\n')
}

function parseQuizResponse(text: string): any[] {
    if (!text) return []
    const jsonMatch = text.match(/\{[\s\S]*\}/)
    const jsonRaw = jsonMatch ? jsonMatch[0] : text

    let parsed: any
    try {
        parsed = JSON.parse(jsonRaw)
    } catch (e) {
        const sanitized = jsonRaw.replace(/```json|```/g, '').replace(/\n/g, '\n')
        try { parsed = JSON.parse(sanitized) } catch (e) { parsed = {} }
    }

    const questions = Array.isArray(parsed?.questions) ? parsed.questions : []

    // Normalize
    return questions.slice(0, 10).map((q: any) => {
        const options: string[] = Array.isArray(q.options) ? q.options.slice(0, 4) : []
        const paddedRaw = options.length < 4 ? [...options, ...new Array(4 - options.length).fill('N/A')].slice(0, 4) : options

        const padded = paddedRaw.map((opt) => {
            const words = String(opt || '').trim().split(/\s+/)
            return words.slice(0, 6).join(' ')
        })

        let correctIndex = Number.isInteger(q.correctAnswer) ? q.correctAnswer : 0
        if (correctIndex < 0 || correctIndex > 3) correctIndex = 0

        return {
            question: String(q.question || '').trim().slice(0, 280),
            options: padded.map((o) => (String(o || '').trim() || 'N/A')),
            correctAnswer: correctIndex,
            explanation: q.explanation ? String(q.explanation).trim().slice(0, 500) : undefined,
        }
    }).filter((q: any) => q.question && q.options.every(Boolean))
}

function buildOrganizePrompt(html: string, userPrompt?: string): string {
    return [
        'You are a strict HTML formatter and content organizer.',
        'Your ONLY job is to improve the structure, spacing, and readability of the provided HTML.',
        'DO NOT change the tone, style, or actual words of the content.',
        'DO NOT summarize or rewrite the content.',
        'Analyze the provided content and return ONLY valid JSON with the complete rewritten HTML and suggested tags.',
        'Return ONLY valid JSON matching this TypeScript type (no markdown, no code fences):',
        '{ "rewrittenHtml": string; "suggestedTags": string[] }',
        '',
        'User Instructions:',
        userPrompt ? `- ${userPrompt}` : '- Improve headings, spacing, and structure.',
        '',
        'Formatting Rules (STRICT):',
        '- Use proper HTML5 semantic tags (h1, h2, h3, p, ul, ol, blockquote)',
        '- Ensure proper heading hierarchy (h1 > h2 > h3)',
        '- Split long paragraphs for better readability',
        '- Add visual breaks between major sections using <hr> or spacing',
        '- Format lists properly',
        '- Ensure code blocks are wrapped in <pre><code>',
        '- CRITICAL: Preserve ALL images, videos, and media elements exactly as they are',
        '- CRITICAL: Keep all <img> tags with their src, alt, class, and style attributes intact',
        '- CRITICAL: Do NOT change the meaning or tone of the text',
        '',
        'Suggested Tags:',
        '- Generate 3-5 relevant tags based on content (lowercase, no spaces, use hyphens)',
        '',
        'Content to format:',
        html.slice(0, 20000),
    ].join('\n')
}

function parseOrganizeResponse(text: string, originalHtml: string): { optimizedHtml: string, suggestedTags?: string[] } {
    if (!text) return { optimizedHtml: originalHtml }

    const tryParsers: Array<(s: string) => string> = [
        (s) => s,
        (s) => s.replace(/```json|```/gi, ''),
        (s) => {
            const start = s.indexOf('{')
            const end = s.lastIndexOf('}')
            if (start < 0 || end <= start) return s
            return s.slice(start, end + 1)
        },
        (s) => s.replace(/[“”]/g, '"').replace(/[‘’]/g, "'"),
        (s) => s.replace(/,\s*([}\]])/g, '$1'),
    ]

    let parsed: any = null
    for (const transform of tryParsers) {
        const candidate = transform(text)
        try {
            parsed = JSON.parse(candidate)
            if (parsed && typeof parsed === 'object') break
        } catch (e) {
            continue
        }
    }

    if (!parsed || !parsed.rewrittenHtml) {
        return { optimizedHtml: originalHtml }
    }

    return {
        optimizedHtml: parsed.rewrittenHtml,
        suggestedTags: Array.isArray(parsed.suggestedTags) ? parsed.suggestedTags : undefined
    }
}
