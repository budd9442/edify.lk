import React, { useEffect } from 'react';
import { motion } from 'framer-motion';
import ArticleCard from '../components/ArticleCard';
import Sidebar from '../components/Sidebar';
import LoadingSpinner from '../components/LoadingSpinner';
import ArticleCardMobile from '../components/ArticleCardMobile';
import { useApp } from '../contexts/AppContext';
import { articlesService } from '../services/articlesService';
import supabase from '../services/supabaseClient';
import type { Article } from '../types/payload';

const HomePage: React.FC = () => {
  const { state, dispatch } = useApp();
  const [page, setPage] = React.useState(1);
  const [hasMore, setHasMore] = React.useState(true);
  const [loadingMore, setLoadingMore] = React.useState(false);
  const observerRef = React.useRef<IntersectionObserver | null>(null);
  const loadMoreRef = React.useRef<HTMLDivElement>(null);
  const mobileLoadMoreRef = React.useRef<HTMLDivElement>(null);

  const [featuredItems, setFeaturedItems] = React.useState<Article[]>([]);

  // Initial load
  useEffect(() => {
    const fetchInitialArticles = async () => {
      dispatch({ type: 'SET_LOADING', payload: true });
      try {
        // Fetch Featured Articles separately
        const featured = await articlesService.listFeatured();

        // Fetch User Profiles for Featured Authors
        if (featured && featured.length > 0) {
          const featuredAuthorIds = Array.from(new Set(featured.map(i => i.authorId)));
          const { data: featuredProfiles } = await supabase
            .from('profiles')
            .select('id,name,avatar_url,bio,followers_count,articles_count')
            .in('id', featuredAuthorIds);

          const featuredIdToProfile = new Map((featuredProfiles || []).map((p: any) => [p.id, p]));
          const mappedFeatured: Article[] = featured.map(item => {
            const p: any = featuredIdToProfile.get(item.authorId);
            return {
              id: item.id,
              title: item.title,
              slug: item.slug,
              excerpt: item.excerpt,
              content: '',
              author: {
                id: item.authorId,
                name: p?.name || 'Anonymous',
                avatar: p?.avatar_url,
                bio: p?.bio || '',
                followersCount: p?.followers_count ?? 0,
                articlesCount: p?.articles_count ?? 0,
              },
              publishedAt: item.publishedAt || new Date().toISOString(),
              readingTime: item.readingTime || 5,
              likes: item.likes,
              views: item.views,
              comments: Array(item.comments).fill({}),
              tags: item.tags,
              featured: true,
              status: 'published',
              coverImage: item.coverImage,
              customAuthor: item.customAuthor,
            };
          });
          setFeaturedItems(mappedFeatured);
        } else {
          setFeaturedItems([]);
        }

        // Fetch Recent Articles
        const items = await articlesService.listAll(1, 10);

        if (!items || items.length === 0) {
          dispatch({ type: 'SET_ARTICLES', payload: [] });
          setHasMore(false);
          return;
        }

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
            content: '',
            author: {
              id: item.authorId,
              name: p?.name || 'Anonymous',
              avatar: p?.avatar_url,
              bio: p?.bio || '',
              followersCount: p?.followers_count ?? 0,
              articlesCount: p?.articles_count ?? 0,
            },
            publishedAt: item.publishedAt || new Date().toISOString(),
            readingTime: item.readingTime || 5,
            likes: item.likes,
            views: item.views,
            comments: Array(item.comments).fill({}),
            tags: item.tags,
            featured: item.featured,
            status: 'published',
            coverImage: item.coverImage,
            customAuthor: item.customAuthor,
          };
        });
        dispatch({ type: 'SET_ARTICLES', payload: mapped });
        setHasMore(items.length === 10);
      } catch (error) {
        console.error('Failed to fetch articles:', error);
        dispatch({ type: 'SET_ARTICLES', payload: [] });
        dispatch({ type: 'SET_TOAST', payload: { type: 'error', message: 'Failed to load articles' } });
      } finally {
        dispatch({ type: 'SET_LOADING', payload: false });
      }
    };

    fetchInitialArticles();
  }, [dispatch]);

  // Load more articles
  const loadMoreArticles = React.useCallback(async () => {
    if (loadingMore || !hasMore) return;

    setLoadingMore(true);
    try {
      const nextPage = page + 1;
      const items = await articlesService.listAll(nextPage, 10);

      if (!items || items.length === 0) {
        setHasMore(false);
        setLoadingMore(false);
        return;
      }

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
          content: '',
          author: {
            id: item.authorId,
            name: p?.name || 'Anonymous',
            avatar: p?.avatar_url,
            bio: p?.bio || '',
            followersCount: p?.followers_count ?? 0,
            articlesCount: p?.articles_count ?? 0,
          },
          publishedAt: item.publishedAt || new Date().toISOString(),
          readingTime: item.readingTime || 5,
          likes: item.likes,
          views: item.views,
          comments: Array(item.comments).fill({}),
          tags: item.tags,
          featured: item.featured,
          status: 'published',
          coverImage: item.coverImage,
          customAuthor: item.customAuthor,
        };
      });

      // Filter out duplicates based on ID
      dispatch({
        type: 'SET_ARTICLES',
        payload: [...state.articles, ...mapped].filter((v, i, a) => a.findIndex(t => t.id === v.id) === i)
      });

      setPage(nextPage);
      setHasMore(items.length === 10);
    } catch (error) {
      console.error('Failed to load more articles:', error);
    } finally {
      setLoadingMore(false);
    }
  }, [page, hasMore, loadingMore, state.articles, dispatch]);

  // Setup intersection observer
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some(entry => entry.isIntersecting) && hasMore && !loadingMore) {
          loadMoreArticles();
        }
      },
      { threshold: 0.1, rootMargin: '100px' }
    );

    if (loadMoreRef.current) observer.observe(loadMoreRef.current);
    if (mobileLoadMoreRef.current) observer.observe(mobileLoadMoreRef.current);

    observerRef.current = observer;

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [hasMore, loadingMore, loadMoreArticles]);

  const featuredArticles = featuredItems;
  // Use all loaded articles as "recent" (filtering out duplicates from featured if desired, but user didn't ask)
  // To be clean, let's filter out articles that are already in 'featuredArticles'
  const regularArticles = state.articles.filter(
    article => !featuredArticles.some(f => f.id === article.id)
  );

  if (state.loading && page === 1) {
    return <LoadingSpinner />;
  }

  return (
    <div className="min-h-screen bg-dark-950">
      {/* Mobile View */}
      <div className="md:hidden pb-20 bg-dark-950">
        {/* Hero Section */}
        <div className="px-4 pt-6 pb-8 text-center border-b border-dark-800">
          <h1 className="text-2xl font-bold text-white mb-3 leading-tight">
            Discover Stories That{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary-400 to-primary-600">
              Inspire
            </span>
          </h1>
          <p className="text-sm text-gray-400 leading-relaxed max-w-md mx-auto">
            Join thousands of readers exploring ideas that matter. From technology to culture,
            find your next great read on edify community.
          </p>
        </div>

        {/* Featured Articles Section */}
        <div className="sticky top-16 z-30 bg-dark-950 px-4 py-3 border-b border-dark-800">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <svg className="w-5 h-5 text-primary-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
            </svg>
            Featured Articles
          </h2>
        </div>

        {/* Featured Articles */}
        {featuredArticles.length > 0 ? (
          <div className="px-4">
            {featuredArticles.map((article, index) => (
              <ArticleCardMobile key={article.id} article={article} index={index} />
            ))}
          </div>
        ) : (
          <div className="text-center py-12 px-4">
            <p className="text-gray-400">No featured articles yet. Check back soon!</p>
          </div>
        )}

        {/* Recent Articles Section (Mobile) */}
        <div className="sticky top-16 z-30 bg-dark-950 px-4 py-3 border-b border-dark-800 mt-2">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <svg className="w-5 h-5 text-primary-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Recent Stories
          </h2>
        </div>

        <div className="px-4 pb-4">
          {regularArticles.length > 0 ? (
            regularArticles.map((article, index) => (
              <ArticleCardMobile key={article.id} article={article} index={index} />
            ))
          ) : (
            <div className="text-center py-12 px-4">
              <p className="text-gray-400">No recent articles found.</p>
            </div>
          )}
        </div>

        {/* Mobile Load More Trigger */}
        {(hasMore || loadingMore) && (
          <div ref={mobileLoadMoreRef} className="py-8 flex justify-center">
            {loadingMore ? (
              <div className="w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
            ) : (
              <div className="h-8" />
            )}
          </div>
        )}
      </div>

      {/* Desktop View */}
      <div className="hidden md:block max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Main Content */}
          <main className="flex-1">
            {/* Hero Section */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-12"
            >
              <div className="text-center">
                <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
                  Discover Stories That{' '}
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary-400 to-primary-600">
                    Inspire
                  </span>
                </h1>
                <p className="text-xl text-gray-300 max-w-2xl mx-auto">
                  Join thousands of readers exploring ideas that matter. From technology to culture,
                  find your next great read on edify community.
                </p>
              </div>
            </motion.div>

            {/* Featured Articles */}
            {featuredArticles.length > 0 && (
              <section className="mb-12">
                <h2 className="text-2xl font-bold text-white mb-6">Featured Articles</h2>
                <div className="grid gap-6 md:grid-cols-2">
                  {featuredArticles.map((article) => (
                    <ArticleCard key={article.id} article={article} featured />
                  ))}
                </div>
              </section>
            )}

            {/* Recent Articles */}
            <section>
              <h2 className="text-2xl font-bold text-white mb-6">Recent Articles</h2>
              {regularArticles.length > 0 ? (
                <div className="space-y-6">
                  {regularArticles.map((article) => (
                    <ArticleCard key={article.id} article={article} />
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <p className="text-gray-400">No articles found. Be the first to publish!</p>
                </div>
              )}

              {/* Load More Trigger */}
              {(hasMore || loadingMore) && (
                <div ref={loadMoreRef} className="py-8 flex justify-center">
                  {loadingMore ? (
                    <div className="w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <div className="h-8" /> // Invisible trigger area
                  )}
                </div>
              )}
            </section>
          </main>

          {/* Sidebar */}
          <Sidebar />
        </div>
      </div>
    </div>
  );

};

export default HomePage;