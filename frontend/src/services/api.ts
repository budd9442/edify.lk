import { Article, mockArticles, mockUsers, mockNotifications } from '../mock-data/articles';

// Simulate API delay
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export const api = {
  // Articles
  async getArticles(): Promise<Article[]> {
    await delay(800);
    return mockArticles;
  },

  async getArticle(id: string): Promise<Article | null> {
    await delay(600);
    return mockArticles.find(article => article.id === id) || null;
  },

  async getFeaturedArticles(): Promise<Article[]> {
    await delay(500);
    return mockArticles.filter(article => article.featured);
  },

  async likeArticle(id: string): Promise<boolean> {
    await delay(300);
    return Math.random() > 0.1; // 90% success rate
  },

  async addComment(articleId: string, content: string): Promise<boolean> {
    await delay(500);
    return Math.random() > 0.1; // 90% success rate
  },

  // Users
  async getUsers() {
    await delay(400);
    return mockUsers;
  },

  async followUser(userId: string): Promise<boolean> {
    await delay(400);
    return Math.random() > 0.1; // 90% success rate
  },

  async unfollowUser(userId: string): Promise<boolean> {
    await delay(400);
    return Math.random() > 0.1; // 90% success rate
  },

  // Notifications
  async getNotifications() {
    await delay(300);
    return mockNotifications;
  },

  // Auth
  async login(provider: 'google' | 'linkedin') {
    await delay(1000);
    return {
      id: '1',
      name: 'Alex Thompson',
      email: 'alex@example.com',
      avatar: 'https://media.licdn.com/dms/image/v2/D4E03AQFM2bia86LEpQ/profile-displayphoto-shrink_100_100/B4EZQ1W9ILHEAU-/0/1736062004138?e=1756944000&v=beta&t=NRca3iZVIMWnDQX4DSCf3jjF73JgMJJkV_QeUUxxPiY',
      bio: 'Technology enthusiast and creative writer exploring the intersection of innovation and human experience.',
      role: 'user' as const,
      followersCount: 1247,
      followingCount: 89,
      articlesCount: 12,
      verified: false,
    };
  },
};