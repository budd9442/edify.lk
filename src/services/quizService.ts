import { SimpleQuiz as Quiz, QuizAttempt, LeaderboardEntry } from '../types/payload';
import supabase from './supabaseClient';
import { safeQuery } from './supabaseUtils';
import { badgesService } from './badgesService';

class QuizService {
  async getQuizByArticleId(articleId: string): Promise<Quiz | null> {
    console.log('Fetching quiz for article:', articleId);

    const { data, error } = await safeQuery('quizzes/getByArticle', () =>
      supabase
        .from('quizzes')
        .select('id, article_id, title, questions_json')
        .eq('article_id', articleId)
        .maybeSingle()
        .then((res: any) => { if (res.error) throw res.error; return res.data; })
    );

    if (error) {
      console.log('Quiz fetch error:', error);
      // For table not found or permission errors, return null instead of throwing
      if (error.message?.includes('relation "quizzes" does not exist') ||
        error.message?.includes('permission denied') ||
        error.message?.includes('406')) {
        console.log('Quizzes table not available, returning null');
        return null;
      }
      throw error;
    }

    if (!data) {
      console.log('No quiz found for article:', articleId);
      return null;
    }
    const questions = ((data as any).questions_json || []).map((q: any) => ({
      question: q.question,
      type: 'multiple-choice',
      options: q.options,
      correctAnswer: q.correctAnswer,
      explanation: q.explanation,
      points: q.points ?? 1,
    }));
    const quiz: Quiz = {
      id: (data as any).id,
      title: (data as any).title,
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
    (quiz as any).articleId = (data as any).article_id;
    return quiz;
  }

  async submitQuizAttempt(attempt: Omit<QuizAttempt, 'id' | 'completedAt'>): Promise<QuizAttempt> {
    console.log('Submitting quiz attempt for user:', attempt.userId, 'quiz:', attempt.quizId);

    try {
      // First check if user already has an attempt for this quiz
      const { data: existingAttempt, error: checkError } = await safeQuery('quiz_attempts/checkExisting', () =>
        supabase
          .from('quiz_attempts')
          .select('id, created_at')
          .eq('quiz_id', attempt.quizId)
          .eq('user_id', attempt.userId)
          .single()
          .then((res: any) => { if (res.error) throw res.error; return res.data; })
      );

      if (existingAttempt) {
        console.log('User already has an attempt for this quiz, returning existing:', existingAttempt.id);
        return {
          ...attempt,
          id: existingAttempt.id,
          completedAt: existingAttempt.created_at,
        } as QuizAttempt;
      }

      // If check failed due to table issues, try to insert anyway
      if (checkError && !checkError.message.includes('No rows found')) {
        console.log('Check failed, attempting direct insert:', checkError.message);
      }

      // Try to insert with minimal required fields first
      const insertData: any = {
        quiz_id: attempt.quizId,
        user_id: attempt.userId,
        score: attempt.score,
        total_questions: attempt.totalQuestions,
      };

      // Add optional fields if they exist
      if (attempt.answers) insertData.answers = attempt.answers;
      if (attempt.timeSpent) insertData.time_spent = attempt.timeSpent;
      if (attempt.articleId) insertData.article_id = attempt.articleId;

      const { data, error } = await safeQuery('quiz_attempts/insert', () =>
        supabase
          .from('quiz_attempts')
          .insert([insertData])
          .select('id, created_at')
          .single()
          .then((res: any) => { if (res.error) throw res.error; return res.data; })
      );

      if (error) {
        console.error('Failed to submit quiz attempt:', error);

        // If it's a duplicate constraint error, try to fetch existing attempt
        if (error.code === '23505' && error.message.includes('unique constraint')) {
          console.log('Duplicate constraint detected, fetching existing attempt...');
          const { data: existingData } = await safeQuery('quiz_attempts/getExistingAfterDuplicate', () =>
            supabase
              .from('quiz_attempts')
              .select('id, created_at')
              .eq('quiz_id', attempt.quizId)
              .eq('user_id', attempt.userId)
              .single()
              .then((res: any) => { if (res.error) throw res.error; return res.data; })
          );

          if (existingData) {
            console.log('Found existing attempt:', existingData.id);
            return {
              ...attempt,
              id: existingData.id,
              completedAt: existingData.created_at,
            } as QuizAttempt;
          }
        }

        // If it's a column error, try with even fewer fields
        if (error.message.includes('column') || error.message.includes('schema')) {
          console.log('Retrying with minimal fields...');
          const { data: minimalData, error: minimalError } = await safeQuery('quiz_attempts/insertMinimal', () =>
            supabase
              .from('quiz_attempts')
              .insert([{
                quiz_id: attempt.quizId,
                user_id: attempt.userId,
                score: attempt.score,
              }])
              .select('id, created_at')
              .single()
              .then((res: any) => { if (res.error) throw res.error; return res.data; })
          );

          if (minimalError) {
            throw minimalError;
          }

          return {
            ...attempt,
            id: minimalData.id,
            completedAt: minimalData.created_at,
          } as QuizAttempt;
        }
        throw error;
      }

      console.log('Quiz attempt submitted successfully:', data.id);

      // Check for quiz badges
      // Get rank
      const { data: rankData } = await supabase
        .from('quiz_attempts')
        .select('*', { count: 'exact', head: true })
        .eq('quiz_id', attempt.quizId)
        .gte('score', attempt.score)
        .lte('time_spent', attempt.timeSpent || 999999);

      badgesService.checkQuizBadges(attempt.userId, (rankData?.count || 0) + 1);

      return {
        ...attempt,
        id: data.id,
        completedAt: data.created_at,
      } as QuizAttempt;

    } catch (error) {
      console.error('Quiz submission failed completely:', error);
      // Return a mock attempt to prevent UI from hanging
      return {
        ...attempt,
        id: 'mock-' + Date.now(),
        completedAt: new Date().toISOString(),
      } as QuizAttempt;
    }
  }

  async getUserAttempt(articleId: string, userId: string): Promise<any | null> {
    console.log('Checking for existing attempt:', articleId, userId);

    try {
      // First get the quiz ID for this article
      const { data: quiz } = await safeQuery('quizzes/getIdForArticle', () =>
        supabase
          .from('quizzes')
          .select('id')
          .eq('article_id', articleId)
          .maybeSingle()
          .then((res: any) => { if (res.error) throw res.error; return res.data; })
      );

      if (!quiz) {
        console.log('No quiz found for article');
        return null;
      }

      // Check for existing attempt
      const { data: attempt, error } = await safeQuery('quiz_attempts/getOne', () =>
        supabase
          .from('quiz_attempts')
          .select('id, score, total_questions, time_spent, created_at')
          .eq('quiz_id', (quiz as any).id)
          .eq('user_id', userId)
          .maybeSingle()
          .then((res: any) => { if (res.error) throw res.error; return res.data; })
      );

      if (error) {
        console.error('Error checking for existing attempt:', error);
        return null;
      }

      if (!attempt) {
        console.log('No existing attempt found');
        return null;
      }

      console.log('Found existing attempt:', attempt.id);
      return attempt;
    } catch (error) {
      console.error('Failed to check for existing attempt:', error);
      return null;
    }
  }

  async getLeaderboard(articleId: string, limit: number = 10): Promise<LeaderboardEntry[]> {
    try {
      // First get the quiz ID for this article
      const { data: quiz } = await safeQuery('quizzes/getIdForArticle', () =>
        supabase
          .from('quizzes')
          .select('id')
          .eq('article_id', articleId)
          .maybeSingle()
          .then((res: any) => { if (res.error) throw res.error; return res.data; })
      );

      if (!quiz) {
        console.log('No quiz found for article');
        return [];
      }

      // Get quiz attempts first
      const { data: attempts, error } = await safeQuery('quiz_attempts/listForLeaderboard', () =>
        supabase
          .from('quiz_attempts')
          .select('id, user_id, score, total_questions, time_spent, created_at')
          .eq('quiz_id', (quiz as any).id)
          .order('score', { ascending: false })
          .order('time_spent', { ascending: true })
          .limit(limit)
          .then((res: any) => { if (res.error) throw res.error; return res.data; })
      );

      if (error) {
        console.error('Failed to fetch quiz attempts:', error);
        return [];
      }

      // Filter for perfect scores only
      const perfectAttempts = (attempts || []).filter((r: any) => r.score === r.total_questions);

      if (perfectAttempts.length === 0) {
        return [];
      }

      // Get user IDs for profile lookup
      const userIds = perfectAttempts.map((attempt: any) => attempt.user_id);

      // Fetch user profiles
      const { data: profiles, error: profileError } = await safeQuery('profiles/inForLeaderboard', () =>
        supabase
          .from('profiles')
          .select('id, name, avatar_url')
          .in('id', userIds)
          .then((res: any) => { if (res.error) throw res.error; return res.data; })
      );

      if (profileError) {
        console.error('Failed to fetch user profiles:', profileError);
        // Return attempts with default names if profile fetch fails
        return perfectAttempts.map((r: any, index: number) => ({
          id: r.id,
          userId: r.user_id,
          userName: 'Anonymous',
          userAvatar: '/logo.png',
          articleId: articleId,
          articleTitle: '',
          score: r.score,
          totalQuestions: r.total_questions,
          completedAt: r.created_at,
          timeSpent: r.time_spent,
          rank: index + 1,
        }));
      }

      // Create a map of user profiles for quick lookup
      const profileMap = new Map();
      (profiles || []).forEach((profile: any) => {
        profileMap.set(profile.id, profile);
      });

      // Map attempts with profile data
      return perfectAttempts.map((r: any, index: number) => {
        const profile = profileMap.get(r.user_id);
        return {
          id: r.id,
          userId: r.user_id,
          userName: profile?.name || 'Anonymous',
          userAvatar: profile?.avatar_url || '/logo.png',
          articleId: articleId,
          articleTitle: '',
          score: r.score,
          totalQuestions: r.total_questions,
          completedAt: r.created_at,
          timeSpent: r.time_spent,
          rank: index + 1,
        };
      });
    } catch (error) {
      console.error('Failed to fetch leaderboard:', error);
      return [];
    }
  }

  async getUserAttempts(userId: string): Promise<QuizAttempt[]> {
    const { data, error } = await safeQuery('quiz_attempts/listByUser', () =>
      supabase
        .from('quiz_attempts')
        .select('id, quiz_id, user_id, article_id, score, total_questions, time_spent, created_at')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .then((res: any) => { if (res.error) throw res.error; return res.data; })
    );
    if (error) throw error;
    return ((data as any) || []).map((r: any) => ({
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