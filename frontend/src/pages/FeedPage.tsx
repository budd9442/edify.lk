import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Rss, Filter, TrendingUp, Clock, Users, RefreshCw } from 'lucide-react';
import { useApp } from '../contexts/AppContext';
import { useAuth } from '../contexts/AuthContext';
import ArticleCard from '../components/ArticleCard';
import LoaderSkeleton from '../components/LoaderSkeleton';
import { Article } from '../mock-data/articles';

const FeedPage: React.FC = () => {
  const [feedArticles, setFeedArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState<'newest' | 'likes'>('newest');
  const [lastUpdate, setLastUpdate] = useState(new Date());
  const { state } = useApp();
  const { state: authState } = useAuth();

  // Simulate real-time updates
  useEffect(() => {
    const interval = setInterval(() => {
      setLastUpdate(new Date());
      // Simulate new articles appearing
      if (Math.random() > 0.8) {
        fetchFeedArticles();
      }
    }, 30000); // Check every 30 seconds

    return () => clearInterval(interval);
  }, []);

  const fetchFeedArticles = async () => {
    setLoading(true);
    
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 800));
    
    // Filter articles from followed authors
    const followedArticles = state.articles.filter(article => 
      state.followedUsers.includes(article.author.id)
    );

    // Sort articles
    const sorted = [...followedArticles].sort((a, b) => {
      if (sortBy === 'newest') {
        return new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime();
      } else {
        return b.likes - a.likes;
      }
    });

    setFeedArticles(sorted);
    setLoading(false);
  };

  useEffect(() => {
    fetchFeedArticles();
  }, [state.articles, state.followedUsers, sortBy]);

  const handleRefresh = () => {
    fetchFeedArticles();
  };

  if (!authState.isAuthenticated) {
    return (
      <div className="min-h-screen bg-dark-950 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto px-4">
          <Rss className="w-16 h-16 text-gray-600 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-white mb-2">Sign in to see your feed</h1>
          <p className="text-gray-400 mb-6">
            Follow authors and topics to create a personalized reading experience.
          </p>
          <Link
            to="/login"
            className="inline-flex items-center space-x-2 bg-primary-600 text-white px-6 py-3 rounded-lg hover:bg-primary-700 transition-colors"
          >
            <span>Sign In</span>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-dark-950">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Breadcrumb */}
        <nav className="flex items-center space-x-2 text-sm text-gray-400 mb-6">
          <Link to="/" className="hover:text-white transition-colors">Home</Link>
          <span>/</span>
          <span className="text-white">My Feed</span>
        </nav>

        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2 flex items-center space-x-3">
              <Rss className="w-8 h-8 text-primary-500" />
              <span>My Feed</span>
            </h1>
            <p className="text-gray-400">
              Latest articles from authors you follow
            </p>
          </div>
          <button
            onClick={handleRefresh}
            disabled={loading}
            className="flex items-center space-x-2 px-4 py-2 bg-dark-800 text-gray-300 rounded-lg hover:bg-dark-700 transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
        </div>

        {/* Controls */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <Filter className="w-4 h-4 text-gray-400" />
              <span className="text-sm text-gray-400">Sort by:</span>
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setSortBy('newest')}
                className={`flex items-center space-x-1 px-3 py-1 rounded-lg text-sm transition-colors ${
                  sortBy === 'newest'
                    ? 'bg-primary-900/30 text-primary-300 border border-primary-500/50'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                <Clock className="w-3 h-3" />
                <span>Newest</span>
              </button>
              <button
                onClick={() => setSortBy('likes')}
                className={`flex items-center space-x-1 px-3 py-1 rounded-lg text-sm transition-colors ${
                  sortBy === 'likes'
                    ? 'bg-primary-900/30 text-primary-300 border border-primary-500/50'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                <TrendingUp className="w-3 h-3" />
                <span>Most Liked</span>
              </button>
            </div>
          </div>
          <div className="text-sm text-gray-400">
            Last updated: {lastUpdate.toLocaleTimeString()}
          </div>
        </div>

        {/* Feed Content */}
        {loading ? (
          <LoaderSkeleton variant="article" count={3} />
        ) : feedArticles.length > 0 ? (
          <div className="space-y-6">
            {feedArticles.map((article, index) => (
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
        ) : state.followedUsers.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-12"
          >
            <Users className="w-16 h-16 text-gray-600 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-white mb-2">Start following authors</h2>
            <p className="text-gray-400 mb-6">
              Follow authors to see their latest articles in your personalized feed.
            </p>
            <Link
              to="/explore"
              className="inline-flex items-center space-x-2 bg-primary-600 text-white px-6 py-3 rounded-lg hover:bg-primary-700 transition-colors"
            >
              <span>Discover Authors</span>
            </Link>
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-12"
          >
            <Rss className="w-16 h-16 text-gray-600 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-white mb-2">No new articles</h2>
            <p className="text-gray-400 mb-6">
              The authors you follow haven't published any new articles yet. Check back later!
            </p>
            <div className="flex items-center justify-center space-x-4">
              <button
                onClick={handleRefresh}
                className="flex items-center space-x-2 bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 transition-colors"
              >
                <RefreshCw className="w-4 h-4" />
                <span>Refresh Feed</span>
              </button>
              <Link
                to="/explore"
                className="flex items-center space-x-2 bg-dark-800 text-gray-300 px-4 py-2 rounded-lg hover:bg-dark-700 transition-colors"
              >
                <span>Explore More</span>
              </Link>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default FeedPage;