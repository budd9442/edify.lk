import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Rss, Filter, TrendingUp, Clock, Users, RefreshCw } from 'lucide-react';
import { useApp } from '../contexts/AppContext';
import { useAuth } from '../contexts/AuthContext';
import supabase from '../services/supabaseClient';
import { articlesService } from '../services/articlesService';
import ArticleCard from '../components/ArticleCard';
import LoaderSkeleton from '../components/LoaderSkeleton';
import { Article } from '../types/payload';

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
    if (!authState.user?.id) {
      setFeedArticles([]);
      setLoading(false);
      return;
    }

    const res = await articlesService.listFollowingFeed(authState.user.id);
    const rows: any[] = (res.data as any) || [];

    // Enrich authors from profiles
    if (rows.length > 0) {
      const authorIds = Array.from(new Set(rows.map(r => r.author_id)));
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id,name,avatar_url,bio')
        .in('id', authorIds);
      const idToProfile = new Map((profiles || []).map((p: any) => [p.id, p]));

      const mapped: Article[] = rows.map((row: any) => {
        const p: any = idToProfile.get(row.author_id);
        return {
          id: row.id,
          title: row.title,
          slug: row.slug,
          excerpt: row.excerpt,
          content: '',
          author: {
            id: row.author_id,
            name: p?.name || 'Anonymous',
            avatar: p?.avatar_url || '/logo.png',
            bio: p?.bio || '',
            followersCount: 0,
            articlesCount: 0,
          },
          publishedAt: row.published_at || new Date().toISOString(),
          readingTime: 5,
          likes: row.likes ?? 0,
          views: row.views ?? 0,
          comments: Array(row.comments ?? 0).fill({}),
          tags: row.tags ?? [],
          featured: !!row.featured,
          status: 'published',
          coverImage: row.cover_image_url || '/logo.png',
        };
      });

      // Sort
      const sorted = [...mapped].sort((a, b) => {
        if (sortBy === 'newest') return new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime();
        return b.likes - a.likes;
      });
      setFeedArticles(sorted);
    } else {
      setFeedArticles([]);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchFeedArticles();
  }, [authState.user?.id, sortBy]);

  // Refetch on follow/unfollow across app
  useEffect(() => {
    const handler = () => fetchFeedArticles();
    window.addEventListener('follow:changed', handler as any);
    return () => window.removeEventListener('follow:changed', handler as any);
  }, []);

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
        ) : feedArticles.length === 0 ? (
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