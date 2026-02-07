import React, { useEffect } from 'react';
import { motion } from 'framer-motion';
import ArticleCard from '../components/ArticleCard';
import Sidebar from '../components/Sidebar';
import LoadingSpinner from '../components/LoadingSpinner';
import MediumStyleArticleCard from '../components/MediumStyleArticleCard';
import { useApp } from '../contexts/AppContext';
import { articlesService } from '../services/articlesService';
import supabase from '../services/supabaseClient';
import type { Article } from '../types/payload';

const HomePage: React.FC = () => {
  const { state, dispatch } = useApp();

  useEffect(() => {
    const fetchArticles = async () => {
      dispatch({ type: 'SET_LOADING', payload: true });
      try {
        const items = await articlesService.listAll();

        // Handle empty articles gracefully
        if (!items || items.length === 0) {
          dispatch({ type: 'SET_ARTICLES', payload: [] });
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
        dispatch({ type: 'SET_ARTICLES', payload: mapped });
      } catch (error) {
        console.error('Failed to fetch articles:', error);
        dispatch({ type: 'SET_ARTICLES', payload: [] });
        dispatch({ type: 'SET_TOAST', payload: { type: 'error', message: 'Failed to load articles' } });
      } finally {
        dispatch({ type: 'SET_LOADING', payload: false });
      }
    };

    fetchArticles();
  }, [dispatch]);

  const featuredArticles = state.articles.filter(article => article.featured);
  const regularArticles = state.articles.filter(article => !article.featured);

  if (state.loading) {
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
          featuredArticles.map((article) => (
            <MediumStyleArticleCard key={article.id} article={article} />
          ))
        ) : (
          <div className="text-center py-12 px-4">
            <p className="text-gray-400">No featured articles yet. Check back soon!</p>
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