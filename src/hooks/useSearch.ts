import { useState, useEffect, useMemo } from 'react';
import Fuse from 'fuse.js';
import { Article } from '../types/payload';

interface SearchResult {
  item: Article;
  score?: number;
}

export const useSearch = (articles: Article[], query: string) => {
  const [results, setResults] = useState<Article[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  const fuse = useMemo(() => {
    return new Fuse(articles, {
      keys: [
        { name: 'title', weight: 0.4 },
        { name: 'excerpt', weight: 0.3 },
        { name: 'content', weight: 0.2 },
        { name: 'author.name', weight: 0.1 },
        { name: 'tags', weight: 0.1 }
      ],
      threshold: 0.4,
      includeScore: true,
      minMatchCharLength: 2,
    });
  }, [articles]);

  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      setIsSearching(false);
      return;
    }

    setIsSearching(true);
    
    // Simulate search delay
    const searchTimeout = setTimeout(() => {
      const searchResults = fuse.search(query);
      setResults(searchResults.map((result: SearchResult) => result.item));
      setIsSearching(false);
    }, 300);

    return () => clearTimeout(searchTimeout);
  }, [query, fuse]);

  return { results, isSearching };
};