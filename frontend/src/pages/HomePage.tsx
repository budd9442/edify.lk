import React, { useEffect } from 'react';
import { motion } from 'framer-motion';
import ArticleCard from '../components/ArticleCard';
import Sidebar from '../components/Sidebar';
import LoadingSpinner from '../components/LoadingSpinner';
import { useApp } from '../contexts/AppContext';
import { api } from '../services/api';

const HomePage: React.FC = () => {
  const { state, dispatch } = useApp();

  useEffect(() => {
    const fetchArticles = async () => {
      dispatch({ type: 'SET_LOADING', payload: true });
      try {
        const articles = await api.getArticles();
        dispatch({ type: 'SET_ARTICLES', payload: articles });
      } catch (error) {
        console.error('Failed to fetch articles:', error);
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
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
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
              <div className="space-y-6">
                {regularArticles.map((article) => (
                  <ArticleCard key={article.id} article={article} />
                ))}
              </div>
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