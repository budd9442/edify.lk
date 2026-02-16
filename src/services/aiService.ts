import { supabase } from './supabaseClient';

export interface GeneratedQuizQuestion {
  question: string;
  options: string[];
  correctAnswer: number; // index into options
  explanation?: string;
}

export async function generateQuizFromHtml(html: string, numQuestions: number = 5): Promise<GeneratedQuizQuestion[]> {
  const { data, error } = await supabase.functions.invoke('gemini-api', {
    body: {
      action: 'generateQuiz',
      html,
      numQuestions,
    },
  });

  if (error) {
    console.error('Gemini API Error:', error);
    throw new Error(`Failed to generate quiz: ${error.message}`);
  }

  return data || [];
}

export async function organizeContentWithAI(html: string, userPrompt?: string): Promise<{ optimizedHtml: string; suggestedTags?: string[] }> {
  // Optional: fast client-side check if html is empty to save a call, but edge function handles it too.
  if (!html || !html.trim()) {
    return { optimizedHtml: html };
  }

  const { data, error } = await supabase.functions.invoke('gemini-api', {
    body: {
      action: 'organizeContent',
      html,
      userPrompt,
    },
  });

  if (error) {
    console.error('Gemini API Error:', error);
    // Fallback to original content on error
    return { optimizedHtml: html };
  }

  return data || { optimizedHtml: html };
}




