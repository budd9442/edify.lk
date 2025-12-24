import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Heart, MessageCircle, Clock, BookmarkPlus, Eye } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { Article } from '../types/payload';
import { useApp } from '../contexts/AppContext';
import { useAuth } from '../contexts/AuthContext';
import { likesService } from '../services/likesService';
import { useToast } from '../hooks/useToast';

const DEFAULT_COVER_IMAGE = 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=800&auto=format&fit=crop&q=60';

interface ArticleCardProps {
  article: Article;
  featured?: boolean;
}

const ArticleCard: React.FC<ArticleCardProps> = ({ article, featured = false }) => {
  const { state, dispatch } = useApp();
  const { state: authState } = useAuth();
  const { showError } = useToast();
  const isLiked = state.likedArticles.includes(article.id);
  const [localLikesCount, setLocalLikesCount] = React.useState(article.likes);

  // Update local likes count when article.likes changes
  React.useEffect(() => {
    setLocalLikesCount(article.likes);
  }, [article.likes]);

  const handleLike = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!authState.user) {
      showError('Please login to like articles');
      return;
    }

    try {
      if (isLiked) {
        await likesService.unlikeArticle(article.id, authState.user.id);
        dispatch({ type: 'UNLIKE_ARTICLE', payload: article.id });
        setLocalLikesCount(prev => Math.max(0, prev - 1));
      } else {
        await likesService.likeArticle(article.id, authState.user.id);
        dispatch({ type: 'LIKE_ARTICLE', payload: article.id });
        setLocalLikesCount(prev => prev + 1);
      }
    } catch (error) {
      console.error('Failed to toggle like:', error);
      showError('Failed to update like');
    }
  };

  if (featured) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="group relative overflow-hidden rounded-xl bg-dark-900 border border-dark-800 hover:border-primary-500/50 transition-all duration-300"
      >
        <div className="aspect-w-16 aspect-h-9 relative">
          <Link to={`/article/${article.slug}`}>
            <img
              src={article.coverImage || DEFAULT_COVER_IMAGE}
              alt={article.title}
              className="w-full h-64 object-cover transition-transform duration-300 group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-dark-950 via-dark-950/20 to-transparent" />
          </Link>
          <div className="absolute bottom-0 left-0 right-0 p-6 pointer-events-none">
            <div className="flex items-center space-x-2 mb-3 pointer-events-auto">
              <Link to={`/profile/${article.author.id}`} className="flex items-center space-x-2 hover:text-white transition-colors group/author">
                <img
                  src={article.author.avatar}
                  alt={article.author.name}
                  className="w-8 h-8 rounded-full ring-2 ring-transparent group-hover/author:ring-primary-500 transition-all"
                />
                <span className="text-sm text-gray-300 group-hover/author:text-primary-400">{article.author.name}</span>
              </Link>
              <span className="text-gray-500">•</span>
              <span className="text-sm text-gray-400">
                {formatDistanceToNow(new Date(article.publishedAt), { addSuffix: true })}
              </span>
            </div>
            <Link to={`/article/${article.slug}`} className="pointer-events-auto block">
              <h2 className="text-xl font-bold text-white mb-2 line-clamp-2 group-hover:text-primary-400 transition-colors">
                {article.title}
              </h2>
              <p className="text-gray-300 text-sm line-clamp-2 mb-4 group-hover:text-gray-200 transition-colors">
                {article.excerpt}
              </p>
            </Link>
            <div className="flex items-center justify-between pointer-events-auto">
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-1">
                  <Clock className="w-4 h-4 text-gray-400" />
                  <span className="text-sm text-gray-400">{article.readingTime} min read</span>
                </div>
                <div className="flex items-center space-x-1">
                  <Eye className="w-4 h-4 text-gray-400" />
                  <span className="text-sm text-gray-400">{article.views?.toLocaleString() || 0}</span>
                </div>
                <div className="flex items-center space-x-1">
                  <MessageCircle className="w-4 h-4 text-gray-400" />
                  <span className="text-sm text-gray-400">{article.comments.length}</span>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={handleLike}
                  className={`flex items-center space-x-1 transition-colors ${isLiked ? 'text-red-500' : 'text-gray-400 hover:text-red-500'
                    }`}
                >
                  <Heart className={`w-4 h-4 ${isLiked ? 'fill-current' : ''}`} />
                  <span className="text-sm">{localLikesCount}</span>
                </button>
                <button className="text-gray-400 hover:text-primary-500 transition-colors">
                  <BookmarkPlus className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="group bg-dark-900 border border-dark-800 rounded-lg p-6 hover:border-primary-500/50 transition-all duration-300"
    >
      <div className="flex space-x-4">
        <div className="flex-1">
          <div className="flex items-center space-x-2 mb-3">
            <Link to={`/profile/${article.author.id}`} className="flex items-center space-x-2 hover:text-white transition-colors group/author">
              <img
                src={article.author.avatar}
                alt={article.author.name}
                className="w-6 h-6 rounded-full ring-2 ring-transparent group-hover/author:ring-primary-500 transition-all"
              />
              <span className="text-sm text-gray-300 group-hover/author:text-primary-400">{article.author.name}</span>
            </Link>
            <span className="text-gray-500">•</span>
            <span className="text-sm text-gray-400">
              {formatDistanceToNow(new Date(article.publishedAt), { addSuffix: true })}
            </span>
          </div>
          <Link to={`/article/${article.slug}`} className="block">
            <h3 className="text-lg font-semibold text-white mb-2 line-clamp-2 group-hover:text-primary-400 transition-colors">
              {article.title}
            </h3>
            <p className="text-gray-400 text-sm line-clamp-2 mb-4 group-hover:text-gray-300 transition-colors">
              {article.excerpt}
            </p>
          </Link>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-1">
                <Clock className="w-4 h-4 text-gray-400" />
                <span className="text-sm text-gray-400">{article.readingTime} min read</span>
              </div>
              <div className="flex items-center space-x-1">
                <Eye className="w-4 h-4 text-gray-400" />
                <span className="text-sm text-gray-400">{article.views?.toLocaleString() || 0}</span>
              </div>
              <div className="flex items-center space-x-1">
                <MessageCircle className="w-4 h-4 text-gray-400" />
                <span className="text-sm text-gray-400">{article.comments.length}</span>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={handleLike}
                className={`flex items-center space-x-1 transition-colors ${isLiked ? 'text-red-500' : 'text-gray-400 hover:text-red-500'
                  }`}
              >
                <Heart className={`w-4 h-4 ${isLiked ? 'fill-current' : ''}`} />
                <span className="text-sm">{localLikesCount}</span>
              </button>
              <button className="text-gray-400 hover:text-primary-500 transition-colors">
                <BookmarkPlus className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
        <Link to={`/article/${article.slug}`} className="w-24 h-24 md:w-48 md:h-32 flex-shrink-0 block">
          <img
            src={article.coverImage || DEFAULT_COVER_IMAGE}
            alt={article.title}
            className="w-full h-full object-cover rounded-lg group-hover:opacity-90 transition-opacity"
          />
        </Link>
      </div>
    </motion.div>
  );
};

export default ArticleCard;