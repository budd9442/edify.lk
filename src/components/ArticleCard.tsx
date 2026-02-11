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
import Avatar from './common/Avatar';



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
  //console.log('[CARD DEBUG]', article.title, 'CA:', article.customAuthor);

  // Helper to validate image
  const hasValidCover = article.coverImage && article.coverImage !== '/logo.png';

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
        <div className={`${hasValidCover ? 'aspect-w-16 aspect-h-9' : 'min-h-[200px] flex flex-col justify-end'} relative`}>
          <Link to={`/article/${article.slug}`}>
            {hasValidCover ? (
              <img
                src={article.coverImage!}
                alt={article.title}
                className="w-full h-64 object-cover transition-transform duration-300 group-hover:scale-105"
              />
            ) : (
              <div className="w-full h-full absolute inset-0 bg-gradient-to-br from-primary-900/40 to-dark-950" />
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-dark-950 via-dark-950/20 to-transparent" />
          </Link>
          <div className={`${hasValidCover ? 'absolute bottom-0 left-0 right-0' : 'relative'} p-6 pointer-events-none`}>
            <div className="flex items-center space-x-2 mb-3 pointer-events-auto">
              {article.customAuthor ? (
                <span className="flex items-center space-x-2">
                  <div className="w-8 h-8 rounded-full bg-dark-800 flex items-center justify-center text-xs font-bold text-gray-400 border border-dark-700">
                    {article.customAuthor.charAt(0).toUpperCase()}
                  </div>
                  <span className="text-sm text-gray-300 font-medium">{article.customAuthor}</span>
                </span>
              ) : (
                <Link to={`/profile/${article.author.id}`} className="flex items-center space-x-2 hover:text-white transition-colors group/author">
                  <Avatar
                    src={article.author.avatar}
                    alt={article.author.name}
                    className="w-8 h-8 ring-2 ring-transparent group-hover/author:ring-primary-500 transition-all"
                  />
                  <span className="text-sm text-gray-300 group-hover/author:text-primary-400">{article.author.name}</span>
                </Link>
              )}
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
      className="group bg-dark-900 border border-dark-800 rounded-lg p-4 sm:p-6 hover:border-primary-500/50 transition-all duration-300"
    >
      <div className="flex flex-col sm:flex-row gap-4">
        {hasValidCover && (
          <Link
            to={`/article/${article.slug}`}
            className="order-1 sm:order-2 w-full aspect-video sm:w-48 sm:h-32 sm:flex-shrink-0 block"
          >
            <img
              src={article.coverImage!}
              alt={article.title}
              className="w-full h-full object-cover rounded-lg group-hover:opacity-90 transition-opacity"
            />
          </Link>
        )}
        <div className="order-2 sm:order-1 flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1 mb-3">
            {article.customAuthor ? (
              <span className="flex items-center space-x-2">
                <div className="w-6 h-6 rounded-full bg-dark-800 flex items-center justify-center text-[10px] font-bold text-gray-400 border border-dark-700">
                  {article.customAuthor.charAt(0).toUpperCase()}
                </div>
                <span className="text-sm text-gray-300 font-medium">{article.customAuthor}</span>
              </span>
            ) : (
              <Link to={`/profile/${article.author.id}`} className="flex items-center space-x-2 hover:text-white transition-colors group/author">
                <Avatar
                  src={article.author.avatar}
                  alt={article.author.name}
                  className="w-6 h-6 ring-2 ring-transparent group-hover/author:ring-primary-500 transition-all flex-shrink-0"
                />
                <span className="text-sm text-gray-300 group-hover/author:text-primary-400">{article.author.name}</span>
              </Link>
            )}
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
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
              <div className="flex items-center space-x-1">
                <Clock className="w-4 h-4 text-gray-400 flex-shrink-0" />
                <span className="text-sm text-gray-400">{article.readingTime} min read</span>
              </div>
              <div className="flex items-center space-x-1">
                <Eye className="w-4 h-4 text-gray-400 flex-shrink-0" />
                <span className="text-sm text-gray-400">{article.views?.toLocaleString() || 0}</span>
              </div>
              <div className="flex items-center space-x-1">
                <MessageCircle className="w-4 h-4 text-gray-400 flex-shrink-0" />
                <span className="text-sm text-gray-400">{article.comments.length}</span>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={handleLike}
                className={`flex items-center space-x-1 min-h-[44px] min-w-[44px] sm:min-h-0 sm:min-w-0 sm:p-0 p-2 justify-center transition-colors ${isLiked ? 'text-red-500' : 'text-gray-400 hover:text-red-500'
                  }`}
              >
                <Heart className={`w-4 h-4 ${isLiked ? 'fill-current' : ''}`} />
                <span className="text-sm">{localLikesCount}</span>
              </button>
              <button className="text-gray-400 hover:text-primary-500 transition-colors min-h-[44px] min-w-[44px] sm:min-h-0 sm:min-w-0 flex items-center justify-center p-2">
                <BookmarkPlus className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default ArticleCard;