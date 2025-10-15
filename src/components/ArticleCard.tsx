import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Heart, MessageCircle, Clock, BookmarkPlus, Eye } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { Article } from '../mock-data/articles';
import { useApp } from '../contexts/AppContext';
import { useAuth } from '../contexts/AuthContext';
import { likesService } from '../services/likesService';
import { useToast } from '../hooks/useToast';

interface ArticleCardProps {
  article: Article;
  featured?: boolean;
}

const ArticleCard: React.FC<ArticleCardProps> = ({ article, featured = false }) => {
  const { state } = useApp();
  const { state: authState } = useAuth();
  const { showError } = useToast();
  const isLiked = state.likedArticles.includes(article.id);

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
      } else {
        await likesService.likeArticle(article.id, authState.user.id);
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
        <Link to={`/article/${article.id}`}>
          <div className="aspect-w-16 aspect-h-9 relative">
            <img
              src={article.coverImage}
              alt={article.title}
              className="w-full h-64 object-cover transition-transform duration-300 group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-dark-950 via-dark-950/20 to-transparent" />
            <div className="absolute bottom-0 left-0 right-0 p-6">
              <div className="flex items-center space-x-2 mb-3">
                <img
                  src={article.author.avatar}
                  alt={article.author.name}
                  className="w-8 h-8 rounded-full"
                />
                <span className="text-sm text-gray-300">{article.author.name}</span>
                <span className="text-gray-500">•</span>
                <span className="text-sm text-gray-400">
                  {formatDistanceToNow(new Date(article.publishedAt), { addSuffix: true })}
                </span>
              </div>
              <h2 className="text-xl font-bold text-white mb-2 line-clamp-2">
                {article.title}
              </h2>
              <p className="text-gray-300 text-sm line-clamp-2 mb-4">
                {article.excerpt}
              </p>
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
                    className={`flex items-center space-x-1 transition-colors ${
                      isLiked ? 'text-red-500' : 'text-gray-400 hover:text-red-500'
                    }`}
                  >
                    <Heart className={`w-4 h-4 ${isLiked ? 'fill-current' : ''}`} />
                    <span className="text-sm">{article.likes}</span>
                  </button>
                  <button className="text-gray-400 hover:text-primary-500 transition-colors">
                    <BookmarkPlus className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </Link>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="group bg-dark-900 border border-dark-800 rounded-lg p-6 hover:border-primary-500/50 transition-all duration-300"
    >
      <Link to={`/article/${article.id}`}>
        <div className="flex space-x-4">
          <div className="flex-1">
            <div className="flex items-center space-x-2 mb-3">
              <img
                src={article.author.avatar}
                alt={article.author.name}
                className="w-6 h-6 rounded-full"
              />
              <span className="text-sm text-gray-300">{article.author.name}</span>
              <span className="text-gray-500">•</span>
              <span className="text-sm text-gray-400">
                {formatDistanceToNow(new Date(article.publishedAt), { addSuffix: true })}
              </span>
            </div>
            <h3 className="text-lg font-semibold text-white mb-2 line-clamp-2 group-hover:text-primary-400 transition-colors">
              {article.title}
            </h3>
            <p className="text-gray-400 text-sm line-clamp-2 mb-4">
              {article.excerpt}
            </p>
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
                  className={`flex items-center space-x-1 transition-colors ${
                    isLiked ? 'text-red-500' : 'text-gray-400 hover:text-red-500'
                  }`}
                >
                  <Heart className={`w-4 h-4 ${isLiked ? 'fill-current' : ''}`} />
                  <span className="text-sm">{article.likes}</span>
                </button>
                <button className="text-gray-400 hover:text-primary-500 transition-colors">
                  <BookmarkPlus className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
          {article.coverImage && (
            <div className="w-24 h-24 flex-shrink-0">
              <img
                src={article.coverImage}
                alt={article.title}
                className="w-full h-full object-cover rounded-lg"
              />
            </div>
          )}
        </div>
      </Link>
    </motion.div>
  );
};

export default ArticleCard;