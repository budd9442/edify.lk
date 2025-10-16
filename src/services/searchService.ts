import supabase from './supabaseClient';
import { safeQuery } from './supabaseUtils';

interface SearchHistoryItem {
  query: string;
  timestamp: number;
}

interface TrendingSearch {
  query: string;
  count: number;
}

class SearchService {
  private readonly SEARCH_HISTORY_KEY = 'edify_search_history';
  private readonly MAX_HISTORY_ITEMS = 10;

  // Get recent searches from localStorage
  getRecentSearches(): string[] {
    try {
      const history = localStorage.getItem(this.SEARCH_HISTORY_KEY);
      if (!history) return [];
      
      const items: SearchHistoryItem[] = JSON.parse(history);
      return items
        .sort((a, b) => b.timestamp - a.timestamp)
        .slice(0, 5)
        .map(item => item.query);
    } catch (error) {
      console.error('Error reading search history:', error);
      return [];
    }
  }

  // Add a search to history
  addToHistory(query: string): void {
    if (!query.trim()) return;
    
    try {
      const history = localStorage.getItem(this.SEARCH_HISTORY_KEY);
      const items: SearchHistoryItem[] = history ? JSON.parse(history) : [];
      
      // Remove existing entry if it exists
      const filteredItems = items.filter(item => item.query.toLowerCase() !== query.toLowerCase());
      
      // Add new entry at the beginning
      const newItems = [
        { query: query.trim(), timestamp: Date.now() },
        ...filteredItems
      ].slice(0, this.MAX_HISTORY_ITEMS);
      
      localStorage.setItem(this.SEARCH_HISTORY_KEY, JSON.stringify(newItems));
    } catch (error) {
      console.error('Error saving search history:', error);
    }
  }

  // Get trending searches based on article tags
  async getTrendingSearches(): Promise<string[]> {
    try {
      const { data, error } = await safeQuery('search/trending', () =>
        supabase
          .from('articles')
          .select('tags')
          .eq('status', 'published')
          .then((res: any) => {
            if (res.error) throw res.error;
            return res.data;
          })
      );

      if (error) throw error;

      // Count tag frequency
      const tagCounts: Record<string, number> = {};
      
      (data as any[] || []).forEach((article: any) => {
        if (article.tags && Array.isArray(article.tags)) {
          article.tags.forEach((tag: string) => {
            if (tag && typeof tag === 'string') {
              const normalizedTag = tag.toLowerCase().trim();
              tagCounts[normalizedTag] = (tagCounts[normalizedTag] || 0) + 1;
            }
          });
        }
      });

      // Sort by frequency and return top 5
      return Object.entries(tagCounts)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 5)
        .map(([tag]) => tag)
        .filter(tag => tag.length > 0);
    } catch (error) {
      console.error('Error fetching trending searches:', error);
      // Fallback to some common topics if database fails
      return ['technology', 'programming', 'design', 'business', 'lifestyle'];
    }
  }

  // Clear search history
  clearHistory(): void {
    localStorage.removeItem(this.SEARCH_HISTORY_KEY);
  }
}

export const searchService = new SearchService();
