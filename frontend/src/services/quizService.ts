import { Quiz, QuizAttempt, LeaderboardEntry, mockQuizzes, mockLeaderboardEntries } from '../mock-data/quizData';

// Simulate API delay
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

class QuizService {
  private attempts: QuizAttempt[] = [];
  private leaderboard: LeaderboardEntry[] = [...mockLeaderboardEntries];

  async getQuizByArticleId(articleId: string): Promise<Quiz | null> {
    await delay(400);
    return mockQuizzes.find(quiz => quiz.articleId === articleId) || null;
  }

  async submitQuizAttempt(attempt: Omit<QuizAttempt, 'id' | 'completedAt'>): Promise<QuizAttempt> {
    await delay(800);
    
    const newAttempt: QuizAttempt = {
      ...attempt,
      id: `attempt-${Date.now()}`,
      completedAt: new Date().toISOString()
    };

    this.attempts.push(newAttempt);

    // If perfect score, add to leaderboard
    if (attempt.score === attempt.totalQuestions) {
      await this.addToLeaderboard(newAttempt);
    }

    return newAttempt;
  }

  private async addToLeaderboard(attempt: QuizAttempt): Promise<void> {
    const quiz = mockQuizzes.find(q => q.id === attempt.quizId);
    if (!quiz) return;

    // Check if user already has a perfect score for this article
    const existingEntry = this.leaderboard.find(
      entry => entry.userId === attempt.userId && entry.articleId === attempt.articleId
    );

    if (existingEntry) {
      // Update if this attempt was faster
      if (attempt.timeSpent < existingEntry.timeSpent) {
        existingEntry.timeSpent = attempt.timeSpent;
        existingEntry.completedAt = attempt.completedAt;
        this.updateRanks(attempt.articleId);
      }
    } else {
      // Add new entry
      const newEntry: LeaderboardEntry = {
        id: `entry-${Date.now()}`,
        userId: attempt.userId,
        userName: attempt.userName,
        userAvatar: attempt.userAvatar,
        articleId: attempt.articleId,
        articleTitle: quiz.title,
        score: attempt.score,
        totalQuestions: attempt.totalQuestions,
        completedAt: attempt.completedAt,
        timeSpent: attempt.timeSpent,
        rank: 1
      };

      this.leaderboard.push(newEntry);
      this.updateRanks(attempt.articleId);
    }
  }

  private updateRanks(articleId: string): void {
    const articleEntries = this.leaderboard
      .filter(entry => entry.articleId === articleId)
      .sort((a, b) => {
        // Sort by score first (descending), then by time (ascending)
        if (a.score !== b.score) {
          return b.score - a.score;
        }
        return a.timeSpent - b.timeSpent;
      });

    articleEntries.forEach((entry, index) => {
      entry.rank = index + 1;
    });
  }

  async getLeaderboard(articleId: string, limit: number = 10): Promise<LeaderboardEntry[]> {
    await delay(300);
    
    return this.leaderboard
      .filter(entry => entry.articleId === articleId && entry.score === entry.totalQuestions)
      .sort((a, b) => {
        if (a.score !== b.score) {
          return b.score - a.score;
        }
        return a.timeSpent - b.timeSpent;
      })
      .slice(0, limit)
      .map((entry, index) => ({ ...entry, rank: index + 1 }));
  }

  async getUserAttempts(userId: string): Promise<QuizAttempt[]> {
    await delay(200);
    return this.attempts.filter(attempt => attempt.userId === userId);
  }

  // Development helper
  resetLeaderboard(): void {
    this.leaderboard = [...mockLeaderboardEntries];
    this.attempts = [];
  }
}

export const quizService = new QuizService();