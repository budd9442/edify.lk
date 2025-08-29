import { Article, Comment, User, Category, Tag, Quiz, Notification } from '../types/payload';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

class PayloadAPI {
  private token: string | null = null;

  setToken(token: string) {
    this.token = token;
    localStorage.setItem('auth_token', token);
  }

  getToken(): string | null {
    if (!this.token) {
      this.token = localStorage.getItem('auth_token');
    }
    return this.token;
  }

  clearToken() {
    this.token = null;
    localStorage.removeItem('auth_token');
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${API_BASE_URL}${endpoint}`;
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    const token = this.getToken();
    if (token) {
      headers.Authorization = `JWT ${token}`;
    }

    const response = await fetch(url, {
      ...options,
      headers,
    });

    if (!response.ok) {
      if (response.status === 401) {
        this.clearToken();
        throw new Error('Unauthorized');
      }
      const error = await response.json().catch(() => ({}));
      throw new Error(error.message || `HTTP error! status: ${response.status}`);
    }

    return response.json();
  }

  // Authentication
  async login(email: string, password: string): Promise<{ user: User; token: string }> {
    const response = await this.request<{ user: User; token: string }>('/api/users/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    this.setToken(response.token);
    return response;
  }

  async register(userData: Partial<User>): Promise<{ user: User; token: string }> {
    const response = await this.request<{ user: User; token: string }>('/api/users', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
    this.setToken(response.token);
    return response;
  }

  async logout(): Promise<void> {
    try {
      await this.request('/api/users/logout', { method: 'POST' });
    } catch (error) {
      console.warn('Logout request failed:', error);
    } finally {
      this.clearToken();
    }
  }

  async getCurrentUser(): Promise<User> {
    return this.request<User>('/api/users/me');
  }

  // Articles
  async getArticles(params?: {
    page?: number;
    limit?: number;
    sort?: string;
    where?: any;
  }): Promise<{ docs: Article[]; totalDocs: number; totalPages: number }> {
    const searchParams = new URLSearchParams();
    if (params?.page) searchParams.append('page', params.page.toString());
    if (params?.limit) searchParams.append('limit', params.limit.toString());
    if (params?.sort) searchParams.append('sort', params.sort);
    if (params?.where) searchParams.append('where', JSON.stringify(params.where));

    const query = searchParams.toString();
    return this.request<{ docs: Article[]; totalDocs: number; totalPages: number }>(
      `/api/articles${query ? `?${query}` : ''}`
    );
  }

  async getArticle(id: string): Promise<Article> {
    return this.request<Article>(`/api/articles/${id}`);
  }

  async getFeaturedArticles(): Promise<Article[]> {
    return this.request<Article[]>('/api/articles/featured');
  }

  async createArticle(articleData: Partial<Article>): Promise<Article> {
    return this.request<Article>('/api/articles', {
      method: 'POST',
      body: JSON.stringify(articleData),
    });
  }

  async updateArticle(id: string, articleData: Partial<Article>): Promise<Article> {
    return this.request<Article>(`/api/articles/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(articleData),
    });
  }

  async deleteArticle(id: string): Promise<void> {
    return this.request<void>(`/api/articles/${id}`, {
      method: 'DELETE',
    });
  }

  async searchArticles(query: string, filters?: {
    category?: string;
    tag?: string;
    author?: string;
  }): Promise<{ docs: Article[]; totalDocs: number }> {
    const searchParams = new URLSearchParams({ q: query });
    if (filters?.category) searchParams.append('category', filters.category);
    if (filters?.tag) searchParams.append('tag', filters.tag);
    if (filters?.author) searchParams.append('author', filters.author);

    return this.request<{ docs: Article[]; totalDocs: number }>(
      `/api/articles/search?${searchParams.toString()}`
    );
  }

  // Comments
  async getComments(articleId: string): Promise<Comment[]> {
    return this.request<Comment[]>(`/api/comments?where[article][equals]=${articleId}`);
  }

  async createComment(commentData: Partial<Comment>): Promise<Comment> {
    return this.request<Comment>('/api/comments', {
      method: 'POST',
      body: JSON.stringify(commentData),
    });
  }

  async updateComment(id: string, commentData: Partial<Comment>): Promise<Comment> {
    return this.request<Comment>(`/api/comments/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(commentData),
    });
  }

  async deleteComment(id: string): Promise<void> {
    return this.request<void>(`/api/comments/${id}`, {
      method: 'DELETE',
    });
  }

  // Users
  async getUsers(params?: {
    page?: number;
    limit?: number;
    sort?: string;
  }): Promise<{ docs: User[]; totalDocs: number }> {
    const searchParams = new URLSearchParams();
    if (params?.page) searchParams.append('page', params.page.toString());
    if (params?.limit) searchParams.append('limit', params.limit.toString());
    if (params?.sort) searchParams.append('sort', params.sort);

    const query = searchParams.toString();
    return this.request<{ docs: User[]; totalDocs: number }>(
      `/api/users${query ? `?${query}` : ''}`
    );
  }

  async getUser(id: string): Promise<User> {
    return this.request<User>(`/api/users/${id}`);
  }

  async updateUser(id: string, userData: Partial<User>): Promise<User> {
    return this.request<User>(`/api/users/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(userData),
    });
  }

  async followUser(userId: string): Promise<void> {
    return this.request<void>(`/api/users/${userId}/follow`, {
      method: 'POST',
    });
  }

  async unfollowUser(userId: string): Promise<void> {
    return this.request<void>(`/api/users/${userId}/unfollow`, {
      method: 'DELETE',
    });
  }

  // Categories
  async getCategories(): Promise<Category[]> {
    return this.request<Category[]>('/api/categories');
  }

  // Tags
  async getTags(): Promise<Tag[]> {
    return this.request<Tag[]>('/api/tags');
  }

  // Quizzes
  async getQuizzes(params?: {
    page?: number;
    limit?: number;
    status?: string;
  }): Promise<{ docs: Quiz[]; totalDocs: number }> {
    const searchParams = new URLSearchParams();
    if (params?.page) searchParams.append('page', params.page.toString());
    if (params?.limit) searchParams.append('limit', params.limit.toString());
    if (params?.status) searchParams.append('where[status][equals]', params.status);

    const query = searchParams.toString();
    return this.request<{ docs: Quiz[]; totalDocs: number }>(
      `/api/quizzes${query ? `?${query}` : ''}`
    );
  }

  async getQuiz(id: string): Promise<Quiz> {
    return this.request<Quiz>(`/api/quizzes/${id}`);
  }

  async createQuiz(quizData: Partial<Quiz>): Promise<Quiz> {
    return this.request<Quiz>('/api/quizzes', {
      method: 'POST',
      body: JSON.stringify(quizData),
    });
  }

  // Notifications
  async getNotifications(): Promise<Notification[]> {
    return this.request<Notification[]>('/api/notifications');
  }

  async getUnreadCount(): Promise<{ count: number }> {
    return this.request<{ count: number }>('/api/notifications/unread-count');
  }

  async markNotificationsAsRead(notificationIds: string[]): Promise<void> {
    return this.request<void>('/api/notifications/mark-read', {
      method: 'POST',
      body: JSON.stringify({ notificationIds }),
    });
  }

  // Media upload
  async uploadMedia(file: File): Promise<any> {
    const formData = new FormData();
    formData.append('file', file);

    const token = this.getToken();
    const response = await fetch(`${API_BASE_URL}/api/media`, {
      method: 'POST',
      headers: {
        Authorization: `JWT ${token}`,
      },
      body: formData,
    });

    if (!response.ok) {
      throw new Error('Upload failed');
    }

    return response.json();
  }
}

export const payloadApi = new PayloadAPI();
export default payloadApi;
