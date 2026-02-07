import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Compass,
  TrendingUp,
  Star,
  Hash,
  Users,
  Grid,
  List
} from 'lucide-react';
import supabase from '../services/supabaseClient';
import { articlesService } from '../services/articlesService';
import ArticleCard from '../components/ArticleCard';
import MediumStyleArticleCard from '../components/MediumStyleArticleCard';
import AuthorCard from '../components/AuthorCard';
import TagPill from '../components/TagPill';
import LoaderSkeleton from '../components/LoaderSkeleton';
import type { Article } from '../types/payload';

const ExplorePage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'trending' | 'tags' | 'authors' | 'featured'>('trending');
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [loading, setLoading] = useState(true);
  const [displayedTrendingCount, setDisplayedTrendingCount] = useState(6);
  const [topAuthors, setTopAuthors] = useState<Array<{ id: string; name: string; avatar: string; bio: string; followersCount: number; articlesCount: number; verified?: boolean }>>([]);
  const [allTags, setAllTags] = useState<Array<{ name: string; count: number }>>([]);
  const [articles, setArticles] = useState<Article[]>([]);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        // Load articles for trending and featured sections
        const items = await articlesService.listAll();

        if (items && items.length > 0) {
          const authorIds = Array.from(new Set(items.map(i => i.authorId)));
          const { data: profiles, error: profileError } = await supabase
            .from('profiles')
            .select('id,name,avatar_url,bio,followers_count,articles_count')
            .in('id', authorIds);

          if (profileError) {
            console.warn('Failed to fetch profiles:', profileError);
          }

          const idToProfile = new Map((profiles || []).map((p: any) => [p.id, p]));
          const mapped: Article[] = items.map(item => {
            const p: any = idToProfile.get(item.authorId);
            return {
              id: item.id,
              title: item.title,
              slug: item.slug,
              excerpt: item.excerpt,
              content: '', // Empty content for explore page
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
              comments: Array(item.comments).fill({}), // Create array with comment count length
              tags: item.tags,
              featured: item.featured,
              status: 'published',
              coverImage: item.coverImage || '/logo.png',
            };
          });
          setArticles(mapped);
        }

        // Fetch minimal article data for tags and authors
        const { data: articlesData } = await supabase
          .from('articles')
          .select('author_id,tags')
          .eq('status', 'published')
          .limit(500);

        const authorCounts = new Map<string, number>();
        const tagCounts = new Map<string, number>();

        (articlesData || []).forEach((row: any) => {
          if (row.author_id) {
            authorCounts.set(row.author_id, (authorCounts.get(row.author_id) || 0) + 1);
          }
          (row.tags || []).forEach((t: string) => {
            if (t) tagCounts.set(t, (tagCounts.get(t) || 0) + 1);
          });
        });

        // Top authors (by article count)
        const sortedAuthorIds = Array.from(authorCounts.entries())
          .sort((a, b) => b[1] - a[1])
          .slice(0, 6)
          .map(([id]) => id);

        let authorsDetailed: any[] = [];
        if (sortedAuthorIds.length > 0) {
          // Compute accurate published article counts for these authors
          const { data: authoredArticles } = await supabase
            .from('articles')
            .select('author_id')
            .eq('status', 'published')
            .in('author_id', sortedAuthorIds)
            .limit(2000);
          const publishedCountByAuthor = new Map<string, number>();
          (authoredArticles || []).forEach((row: any) => {
            if (!row.author_id) return;
            publishedCountByAuthor.set(
              row.author_id,
              (publishedCountByAuthor.get(row.author_id) || 0) + 1
            );
          });

          const { data: profiles } = await supabase
            .from('profiles')
            .select('id,name,avatar_url,bio,followers_count,articles_count')
            .in('id', sortedAuthorIds);
          const idToProfile = new Map((profiles || []).map((p: any) => [p.id, p]));
          authorsDetailed = sortedAuthorIds.map((id) => {
            const p = idToProfile.get(id);
            if (!p) return null;
            return {
              ...p,
              _publishedCount: publishedCountByAuthor.get(id) || 0,
            };
          }).filter(Boolean) as any[];
        }

        setTopAuthors(authorsDetailed.map((p: any) => ({
          id: p.id,
          name: p.name,
          avatar: p.avatar_url || '/logo.png',
          bio: p.bio || '',
          followersCount: p.followers_count ?? 0,
          articlesCount: p._publishedCount ?? (authorCounts.get(p.id) || 0),
        })));

        // Trending tags
        const tagsArr = Array.from(tagCounts.entries())
          .map(([name, count]) => ({ name, count }))
          .sort((a, b) => b.count - a.count);
        setAllTags(tagsArr);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [activeTab]);

  // Infinite scroll observer using callback ref for robust DOM handling
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const observerRef = useRef<IntersectionObserver | null>(null);

  const loadMoreCallbackRef = React.useCallback((node: HTMLDivElement | null) => {
    // If not trending tab, disconnect
    if (activeTab !== 'trending') {
      if (observerRef.current) observerRef.current.disconnect();
      return;
    }

    if (node !== null) {
      console.log('[InfiniteScroll] Node mounted - attaching observer');

      if (observerRef.current) observerRef.current.disconnect();

      observerRef.current = new IntersectionObserver(
        (entries) => {
          if (entries[0].isIntersecting && !isLoadingMore && (displayedTrendingCount < articles.length)) {
            console.log('[InfiniteScroll] Intersection detected - loading more');
            setIsLoadingMore(true);
            setTimeout(() => {
              setDisplayedTrendingCount((prev) => prev + 6);
              setIsLoadingMore(false);
            }, 500);
          }
        },
        { threshold: 0.1, rootMargin: '100px' }
      );

      observerRef.current.observe(node);
    } else {
      // Node unmounted
      if (observerRef.current) observerRef.current.disconnect();
    }
  }, [activeTab, displayedTrendingCount, articles.length, isLoadingMore]);

  const trendingArticles = [...articles]
    .sort((a, b) => b.likes - a.likes)
    .slice(0, displayedTrendingCount);

  const featuredArticles = articles.filter(article => article.featured);

  // allTags and topAuthors now loaded from Supabase

  const filteredArticles = selectedTag
    ? articles.filter(article => article.tags.includes(selectedTag))
    : articles;

  const tabs = [
    { id: 'trending', label: 'Trending', icon: TrendingUp },
    { id: 'tags', label: 'Topics', icon: Hash },
    { id: 'featured', label: 'Featured', icon: Star },
    { id: 'authors', label: 'Authors', icon: Users },
  ];

  return (
    <div className="min-h-screen bg-dark-950">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">


        {/* Tabs */}
        {/* Mobile Tabs - Icons only */}
        <div className="md:hidden flex justify-between gap-2 mb-6 px-4">
          {tabs.map(tab => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => {
                  setActiveTab(tab.id as any);
                  setSelectedTag(null);
                  setLoading(true);
                }}
                className={`flex items-center justify-center flex-1 p-4 rounded-xl transition-colors ${activeTab === tab.id
                  ? 'bg-primary-600 text-white'
                  : 'bg-dark-900 text-gray-400 border border-dark-800'
                  }`}
                aria-label={tab.label}
              >
                <Icon className="w-5 h-5" />
              </button>
            );
          })}
        </div>

        {/* Desktop Tabs - With labels */}
        <div className="hidden md:flex items-center mb-8 bg-dark-900 p-1 rounded-lg border border-dark-800 overflow-x-auto" style={{ WebkitOverflowScrolling: 'touch' }}>
          <div className="flex items-center space-x-1 flex-nowrap">
            {tabs.map(tab => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => {
                    setActiveTab(tab.id as any);
                    setSelectedTag(null);
                    setLoading(true);
                  }}
                  className={`flex items-center space-x-2 px-4 py-2 min-h-[44px] rounded-lg transition-colors flex-shrink-0 ${activeTab === tab.id
                    ? 'bg-primary-600 text-white'
                    : 'text-gray-400 hover:text-white hover:bg-dark-800'
                    }`}
                >
                  <Icon className="w-4 h-4 flex-shrink-0" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Content */}
        {loading ? (
          <div className="space-y-6">
            {activeTab === 'authors' ? (
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                <LoaderSkeleton variant="author" count={6} />
              </div>
            ) : (
              <LoaderSkeleton variant="article" count={3} />
            )}
          </div>
        ) : (
          <>
            {/* Trending Articles */}
            {activeTab === 'trending' && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
              >
                {/* Mobile: Sticky header */}
                <div className="md:hidden sticky top-16 z-30 bg-dark-950 px-4 py-3 border-b border-dark-800 mb-0">
                  <h2 className="text-lg font-bold text-white flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-primary-500" />
                    Trending Articles
                  </h2>
                </div>

                {/* Desktop: Regular header */}
                <div className="hidden md:flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold text-white flex items-center space-x-2">
                    <TrendingUp className="w-6 h-6 text-primary-500" />
                    <span>Trending Articles</span>
                  </h2>
                  <span className="text-sm text-gray-400">
                    Based on likes and engagement
                  </span>
                </div>

                {/* Mobile view */}
                <div className="md:hidden">
                  {trendingArticles.map((article) => (
                    <MediumStyleArticleCard key={article.id} article={article} />
                  ))}
                </div>

                {/* Auto-load trigger - always render for ref, hide on desktop */}
                <div ref={loadMoreCallbackRef} className="md:hidden flex justify-center py-4">
                  {displayedTrendingCount < articles.length && (
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500"></div>
                  )}
                </div>
                <div className="hidden md:block">
                  {viewMode === 'grid' ? (
                    <div className="grid gap-6 md:grid-cols-2">
                      {trendingArticles.map((article, index) => (
                        <motion.div
                          key={article.id}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: index * 0.1 }}
                        >
                          <ArticleCard article={article} featured />
                        </motion.div>
                      ))}
                    </div>
                  ) : (
                    <div className="space-y-6">
                      {trendingArticles.map((article, index) => (
                        <motion.div
                          key={article.id}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: index * 0.1 }}
                        >
                          <ArticleCard article={article} />
                        </motion.div>
                      ))}

                      {/* Load More button for desktop list view */}
                      {displayedTrendingCount < articles.length && (
                        <div className="flex justify-center pt-4">
                          <button
                            onClick={() => setDisplayedTrendingCount(prev => prev + 6)}
                            className="px-6 py-3 bg-dark-800 text-white rounded-lg hover:bg-dark-700 transition-colors"
                          >
                            Load More Articles
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </motion.div>
            )}

            {/* Topics/Tags */}
            {activeTab === 'tags' && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
              >
                {/* Mobile: Sticky header */}
                <div className="md:hidden sticky top-16 z-30 bg-dark-950 px-4 py-3 border-b border-dark-800">
                  <h2 className="text-lg font-bold text-white flex items-center gap-2">
                    <Hash className="w-5 h-5 text-primary-500" />
                    Popular Topics
                  </h2>
                </div>

                {/* Desktop: Regular header */}
                <div className="hidden md:flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold text-white flex items-center space-x-2">
                    <Hash className="w-6 h-6 text-primary-500" />
                    <span>Browse by Topic</span>
                  </h2>
                  {selectedTag && (
                    <button
                      onClick={() => setSelectedTag(null)}
                      className="text-sm text-primary-400 hover:text-primary-300 transition-colors"
                    >
                      Clear filter
                    </button>
                  )}
                </div>

                {/* Tag Cloud */}
                <div className="bg-dark-900 border border-dark-800 rounded-lg p-6 mb-8">
                  <h3 className="text-lg font-semibold text-white mb-4">Popular Topics</h3>

                  {/* Mobile: 2-column grid */}
                  <div className="md:hidden grid grid-cols-2 gap-2">
                    {allTags.map(tag => (
                      <button
                        key={tag.name}
                        onClick={() => setSelectedTag(tag.name)}
                        className={`px-4 py-3 rounded-lg text-left transition-colors ${selectedTag === tag.name
                          ? 'bg-primary-600 text-white'
                          : 'bg-dark-800 text-gray-300 hover:bg-dark-700'
                          }`}
                      >
                        <div className="font-medium text-sm">#{tag.name}</div>
                        <div className="text-xs text-gray-400 mt-0.5">{tag.count} articles</div>
                      </button>
                    ))}
                  </div>

                  {/* Desktop: Flex wrap */}
                  <div className="hidden md:flex flex-wrap gap-3">
                    {allTags.map(tag => (
                      <TagPill
                        key={tag.name}
                        tag={`${tag.name} (${tag.count})`}
                        isActive={selectedTag === tag.name}
                        onClick={() => setSelectedTag(tag.name)}
                        variant="outline"
                      />
                    ))}
                  </div>
                </div>

                {/* Filtered Articles */}
                {selectedTag && (
                  <div>
                    <h3 className="text-xl font-semibold text-white mb-4">
                      Articles tagged with "{selectedTag}"
                    </h3>
                    <div className="md:hidden">
                      {filteredArticles.map((article) => (
                        <MediumStyleArticleCard key={article.id} article={article} />
                      ))}
                    </div>
                    <div className="hidden md:block space-y-6">
                      {filteredArticles.map((article, index) => (
                        <motion.div
                          key={article.id}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: index * 0.1 }}
                        >
                          <ArticleCard article={article} />
                        </motion.div>
                      ))}
                    </div>
                  </div>
                )}
              </motion.div>
            )}

            {/* Featured Articles */}
            {activeTab === 'featured' && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
              >
                {/* Mobile: Sticky header */}
                <div className="md:hidden sticky top-16 z-30 bg-dark-950 px-4 py-3 border-b border-dark-800">
                  <h2 className="text-lg font-bold text-white flex items-center gap-2">
                    <Star className="w-5 h-5 text-primary-500" />
                    Editor's Picks
                  </h2>
                </div>

                {/* Desktop: Regular header */}
                <div className="hidden md:flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold text-white flex items-center space-x-2">
                    <Star className="w-6 h-6 text-primary-500" />
                    <span>Editor's Picks</span>
                  </h2>
                  <span className="text-sm text-gray-400">
                    Curated by our editorial team
                  </span>
                </div>

                <div className="md:hidden">
                  {featuredArticles.map((article) => (
                    <MediumStyleArticleCard key={article.id} article={article} />
                  ))}
                </div>
                <div className="hidden md:block">
                  {featuredArticles.map((article, index) => (
                    <motion.div
                      key={article.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                    >
                      <ArticleCard article={article} />
                    </motion.div>
                  ))}
                </div>
                <div className="hidden md:block">
                  {viewMode === 'grid' ? (
                    <div className="grid gap-6 md:grid-cols-2">
                      {featuredArticles.map((article, index) => (
                        <motion.div
                          key={article.id}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: index * 0.1 }}
                        >
                          <ArticleCard article={article} featured />
                        </motion.div>
                      ))}
                    </div>
                  ) : (
                    <div className="space-y-6">
                      {featuredArticles.map((article, index) => (
                        <motion.div
                          key={article.id}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: index * 0.1 }}
                        >
                          <ArticleCard article={article} />
                        </motion.div>
                      ))}
                    </div>
                  )}
                </div>
              </motion.div>
            )}

            {/* Top Authors */}
            {activeTab === 'authors' && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
              >
                {/* Mobile: Sticky header */}
                <div className="md:hidden sticky top-16 z-30 bg-dark-950 px-4 py-3 border-b border-dark-800">
                  <h2 className="text-lg font-bold text-white flex items-center gap-2">
                    <Users className="w-5 h-5 text-primary-500" />
                    Top Authors
                  </h2>
                </div>

                {/* Desktop: Regular header */}
                <div className="hidden md:flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold text-white flex items-center space-x-2">
                    <Users className="w-6 h-6 text-primary-500" />
                    <span>Top Authors</span>
                  </h2>
                  <span className="text-sm text-gray-400">
                    Most followed writers on the platform
                  </span>
                </div>

                {/* Mobile: Horizontal compact author cards */}
                <div className="md:hidden space-y-0">
                  {topAuthors.map((author) => (
                    <Link
                      key={author.id}
                      to={`/profile/${author.id}`}
                      className="flex items-center gap-3 p-4 border-b border-dark-800 hover:bg-dark-900/50 transition-colors"
                    >
                      <img
                        src={author.avatar}
                        alt={author.name}
                        className="w-12 h-12 rounded-full object-cover flex-shrink-0"
                      />
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-white truncate">{author.name}</h3>
                        <p className="text-sm text-gray-400 truncate">{author.bio || 'Writer'}</p>
                        <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
                          <span>{author.followersCount} followers</span>
                          <span>•</span>
                          <span>{author.articlesCount} articles</span>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>

                {/* Desktop: Grid author cards */}
                <div className="hidden md:grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                  {topAuthors.map((author, index) => (
                    <motion.div
                      key={author.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                    >
                      <AuthorCard author={author} variant="detailed" />
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default ExplorePage;