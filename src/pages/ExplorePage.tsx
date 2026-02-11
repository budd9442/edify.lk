import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  TrendingUp,
  Star,
  Hash,
  Users
} from 'lucide-react';
import supabase from '../services/supabaseClient';
import { articlesService } from '../services/articlesService';
import ArticleCard from '../components/ArticleCard';
import AuthorCard from '../components/AuthorCard';
import TagPill from '../components/TagPill';
import LoaderSkeleton from '../components/LoaderSkeleton';
import type { Article } from '../types/payload';
import { useArticleSearch } from '../hooks/useArticleSearch';
import MobileSearchView from '../components/search/MobileSearchView';

const ExplorePage: React.FC = () => {
  // Mobile Search State
  const {
    query,
    setQuery,
    searchType,
    setSearchType,
    sortBy,
    setSortBy,
    results,
    isSearching,
    allTags: mobileAllTags,
    isLoading
  } = useArticleSearch();

  // Desktop / Original State
  const [activeTab, setActiveTab] = useState<'trending' | 'tags' | 'authors' | 'featured'>('trending');
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [viewMode] = useState<'grid' | 'list'>('grid');
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
                avatar: p?.avatar_url,
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
              coverImage: item.coverImage,
              customAuthor: item.customAuthor,
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
          avatar: p.avatar_url,
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

  const trendingArticles = [...articles]
    .sort((a, b) => b.likes - a.likes)
    .slice(0, displayedTrendingCount);

  const featuredArticles = articles.filter(article => article.featured);

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
      {/* Mobile View: Search Layout */}
      <div className="md:hidden">
        <MobileSearchView
          query={query}
          setQuery={setQuery}
          sortBy={sortBy}
          setSortBy={setSortBy}
          searchType={searchType}
          setSearchType={setSearchType}
          results={results}
          isSearching={isSearching}
          allTags={mobileAllTags}
          isLoading={isLoading}
        />
      </div>

      {/* Desktop View: Original Layout */}
      <div className="hidden md:block max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        {/* Desktop Tabs */}
        <div className="flex items-center mb-8 bg-dark-900 p-1 rounded-lg border border-dark-800 overflow-x-auto" style={{ WebkitOverflowScrolling: 'touch' }}>
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
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold text-white flex items-center space-x-2">
                    <TrendingUp className="w-6 h-6 text-primary-500" />
                    <span>Trending Articles</span>
                  </h2>
                  <span className="text-sm text-gray-400">
                    Based on likes and engagement
                  </span>
                </div>

                <div>
                  {viewMode === 'grid' ? (
                    <div className="grid gap-6 md:grid-cols-2">
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
                <div className="flex items-center justify-between mb-6">
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
                  <div className="flex flex-wrap gap-3">
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
                    <div className="space-y-6">
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
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold text-white flex items-center space-x-2">
                    <Star className="w-6 h-6 text-primary-500" />
                    <span>Editor's Picks</span>
                  </h2>
                  <span className="text-sm text-gray-400">
                    Curated by our editorial team
                  </span>
                </div>

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
              </motion.div>
            )}

            {/* Top Authors */}
            {activeTab === 'authors' && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold text-white flex items-center space-x-2">
                    <Users className="w-6 h-6 text-primary-500" />
                    <span>Top Authors</span>
                  </h2>
                  <span className="text-sm text-gray-400">
                    Most followed writers on the platform
                  </span>
                </div>

                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
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