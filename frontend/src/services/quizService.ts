import { Quiz, QuizAttempt, LeaderboardEntry } from '../mock-data/quizData';
import supabase from './supabaseClient';

class QuizService {
  async getQuizByArticleId(articleId: string): Promise<Quiz | null> {
    const { data, error } = await supabase
      .from('quizzes')
      .select('id, article_id, title, questions_json')
      .eq('article_id', articleId)
      .single();
    if (error) {
      if ((error as any).code === 'PGRST116') return null;
      throw error;
    }
    const questions = (data.questions_json || []).map((q: any) => ({
      question: q.question,
      type: 'multiple-choice',
      options: q.options,
      correctAnswer: q.correctAnswer,
      explanation: q.explanation,
      points: q.points ?? 1,
    }));
    const quiz: Quiz = {
      id: data.id,
      title: data.title,
      description: '',
      author: {
        id: 'system',
        name: 'System',
        email: '',
        verified: false,
        stats: { followersCount: 0, followingCount: 0, articlesCount: 0 },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        role: 'user',
      } as any,
      status: 'published',
      questions,
      settings: { passingScore: 0, allowRetakes: true, showResults: true, randomizeQuestions: false },
      stats: { attempts: 0, averageScore: 0, completionRate: 0 },
      tags: [],
    };
    (quiz as any).articleId = data.article_id;
    return quiz;
  }

  async submitQuizAttempt(attempt: Omit<QuizAttempt, 'id' | 'completedAt'>): Promise<QuizAttempt> {
    const { data, error } = await supabase
      .from('quiz_attempts')
      .insert([{
        quiz_id: attempt.quizId,
        user_id: attempt.userId,
        article_id: attempt.articleId,
        score: attempt.score,
        total_questions: attempt.totalQuestions,
        time_spent: attempt.timeSpent,
      }])
      .select('id, created_at')
      .single();
    if (error) throw error;
    return {
      ...attempt,
      id: data.id,
      completedAt: data.created_at,
    } as QuizAttempt;
  }

  async getLeaderboard(articleId: string, limit: number = 10): Promise<LeaderboardEntry[]> {
    const { data, error } = await supabase
      .from('quiz_attempts')
      .select('id, user_id, article_id, score, total_questions, time_spent, created_at')
      .eq('article_id', articleId)
      .order('score', { ascending: false })
      .order('time_spent', { ascending: true })
      .limit(limit);
    if (error) throw error;
    return (data || [])
      .filter((r: any) => r.score === r.total_questions)
      .map((r: any, index: number) => ({
        id: r.id,
        userId: r.user_id,
        userName: 'User',
        userAvatar: '/logo.png',
        articleId: r.article_id,
        articleTitle: '',
        score: r.score,
        totalQuestions: r.total_questions,
        completedAt: r.created_at,
        timeSpent: r.time_spent,
        rank: index + 1,
      }));
  }

  async getUserAttempts(userId: string): Promise<QuizAttempt[]> {
    const { data, error } = await supabase
      .from('quiz_attempts')
      .select('id, quiz_id, user_id, article_id, score, total_questions, time_spent, created_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return (data || []).map((r: any) => ({
      id: r.id,
      quizId: r.quiz_id,
      userId: r.user_id,
      userName: 'User',
      userAvatar: '/logo.png',
      articleId: r.article_id,
      score: r.score,
      totalQuestions: r.total_questions,
      completedAt: r.created_at,
      timeSpent: r.time_spent,
    }));
  }
}

export const quizService = new QuizService();