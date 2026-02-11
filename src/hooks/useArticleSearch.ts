import { useState, useEffect, useMemo } from 'react';
import Fuse from 'fuse.js';
import { articlesService } from '../services/articlesService';
import supabase from '../services/supabaseClient';
import { Article } from '../types/payload';

export type SearchType = 'articles' | 'authors' | 'tags';

export interface Author {
    id: string;
    name: string;
    avatar: string;
    bio: string;
    followersCount: number;
    articlesCount: number;
}

export interface Tag {
    name: string;
    count: number;
}

export const useArticleSearch = () => {
    const [query, setQuery] = useState('');
    const [searchType, setSearchType] = useState<SearchType>('articles');
    const [sortBy, setSortBy] = useState<'relevance' | 'date' | 'likes'>('relevance');

    // Data
    const [articles, setArticles] = useState<Article[]>([]);

    // Internal search state
    const [searchResults, setSearchResults] = useState<any[]>([]);
    const [searchResultsType, setSearchResultsType] = useState<SearchType>('articles');

    const [isSearching, setIsSearching] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

    // Derived Data
    const authors = useMemo(() => {
        const uniqueAuthors = new Map<string, Author>();
        articles.forEach(article => {
            if (!uniqueAuthors.has(article.author.id)) {
                uniqueAuthors.set(article.author.id, article.author as Author);
            }
        });
        return Array.from(uniqueAuthors.values());
    }, [articles]);

    const tags = useMemo(() => {
        const tagCounts = new Map<string, number>();
        articles.forEach(article => {
            article.tags.forEach(tag => {
                tagCounts.set(tag, (tagCounts.get(tag) || 0) + 1);
            });
        });
        return Array.from(tagCounts.entries())
            .map(([name, count]) => ({ name, count } as Tag))
            .sort((a, b) => b.count - a.count);
    }, [articles]);

    // Fuse Instances
    const fuseArticles = useMemo(() => new Fuse(articles, {
        keys: [
            { name: 'title', weight: 0.4 },
            { name: 'excerpt', weight: 0.3 },
            { name: 'tags', weight: 0.2 },
            { name: 'author.name', weight: 0.1 }
        ],
        threshold: 0.4,
        includeScore: true
    }), [articles]);

    const fuseAuthors = useMemo(() => new Fuse(authors, {
        keys: ['name', 'bio'],
        threshold: 0.4
    }), [authors]);

    const fuseTags = useMemo(() => new Fuse(tags, {
        keys: ['name'],
        threshold: 0.3
    }), [tags]);

    // Initial Load
    useEffect(() => {
        const loadArticles = async () => {
            try {
                const items = await articlesService.listAll();
                if (!items || items.length === 0) {
                    setArticles([]);
                    return;
                }

                const authorIds = Array.from(new Set(items.map(i => i.authorId)));
                const { data: profiles } = await supabase
                    .from('profiles')
                    .select('id,name,avatar_url,bio,followers_count,articles_count')
                    .in('id', authorIds);

                const idToProfile = new Map((profiles || []).map((p: any) => [p.id, p]));
                const mapped: Article[] = items.map(item => {
                    const p: any = idToProfile.get(item.authorId);
                    return {
                        id: item.id,
                        title: item.title,
                        slug: item.slug,
                        excerpt: item.excerpt,
                        content: '',
                        author: {
                            id: item.authorId,
                            name: p?.name || 'Anonymous',
                            avatar: p?.avatar_url || '/logo.png',
                            bio: p?.bio || '',
                            followersCount: p?.followers_count ?? 0,
                            articlesCount: p?.articles_count ?? 0,
                        },
                        publishedAt: item.publishedAt || new Date().toISOString(),
                        readingTime: 5,
                        likes: item.likes,
                        views: item.views,
                        comments: Array(item.comments).fill({}),
                        tags: item.tags || [],
                        featured: item.featured,
                        status: 'published',
                        coverImage: item.coverImage || '/logo.png',
                    };
                });
                setArticles(mapped);
            } catch (error) {
                console.error('Failed to load articles:', error);
            } finally {
                setIsLoading(false);
            }
        };
        loadArticles();
    }, []);

    // Perform Search
    useEffect(() => {
        if (isLoading) return;

        // If no query, we don't use searchResults (handled by useMemo below)
        if (!query.trim()) {
            setIsSearching(false);
            return;
        }

        setIsSearching(true);
        const timeout = setTimeout(() => {
            let res: any[] = [];
            if (searchType === 'articles') {
                res = fuseArticles.search(query).map(r => r.item);
            } else if (searchType === 'authors') {
                res = fuseAuthors.search(query).map(r => r.item);
            } else if (searchType === 'tags') {
                res = fuseTags.search(query).map(r => r.item);
            }
            setSearchResults(res);
            setSearchResultsType(searchType); // Mark results as valid for this type
            setIsSearching(false);
        }, 300);

        return () => clearTimeout(timeout);
    }, [query, searchType, articles, authors, tags, fuseArticles, fuseAuthors, fuseTags, isLoading]);

    // Compute Final Results
    // This logic ensures 'results' always matches 'searchType', preventing type mismatches during transitions.
    const results = useMemo(() => {
        if (!query.trim()) {
            switch (searchType) {
                case 'authors': return authors;
                case 'tags': return tags;
                case 'articles': default: return articles;
            }
        }

        // If we have a query, but the search results are for a different type (stale), return empty
        // This avoids passing Article[] to a component expecting Author[]
        if (searchResultsType !== searchType) {
            return [];
        }

        return searchResults;
    }, [query, searchType, articles, authors, tags, searchResults, searchResultsType]);

    // Sort Results
    const sortedResults = useMemo(() => {
        if (searchType !== 'articles') return results;

        return [...results].sort((a, b) => {
            switch (sortBy) {
                case 'date':
                    return new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime();
                case 'likes':
                    return b.likes - a.likes;
                default:
                    if (query.trim()) return 0; // Use Fuse relevance
                    return new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime();
            }
        });
    }, [results, sortBy, searchType, query]);

    return {
        query,
        setQuery,
        searchType,
        setSearchType,
        sortBy,
        setSortBy,
        results: sortedResults,
        isSearching: isSearching || (!!query.trim() && searchResultsType !== searchType), // Show loading if searching or outdated
        isLoading,
        allArticles: articles,
        allAuthors: authors,
        allTags: tags,
        selectedTags: [],
        setSelectedTags: () => { }
    };
};
