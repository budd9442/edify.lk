import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import ResponsiveImage from './layout/ResponsiveImage';
import { Heart, MessageCircle, Clock, BookmarkPlus } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { Article } from '../mock-data/articles';
import { useApp } from '../contexts/AppContext';
import Card from './ui/Card';
import Badge from './ui/Badge';
import Tooltip from './ui/Tooltip';

interface ArticleCardProps {
  article: Article;
  featured?: boolean;
  variant?: 'default' | 'compact' | 'minimal';
}

const ArticleCard: React.FC<ArticleCardProps> = ({ 
  article, 
  featured = false, 
  variant = 'default' 
}) => {
  const { state, dispatch } = useApp();
  const isLiked = state.likedArticles.includes(article.id);

  const handleLike = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (isLiked) {
      dispatch({ type: 'UNLIKE_ARTICLE', payload: article.id });
    } else {
      dispatch({ type: 'LIKE_ARTICLE', payload: article.id });
    }
  };

  if (variant === 'compact') {
    return (
      <Card hover className="group">
        <Link to={`/article/${article.id}`}>
          <div className="flex items-center space-x-4">
            <div className="w-16 h-16 flex-shrink-0">
              <ResponsiveImage
                src={article.coverImage}
                alt={article.title}
                className="w-full h-full rounded-lg"
                aspectRatio="square"
              />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-white text-sm line-clamp-2 group-hover:text-primary-400 transition-colors">
                {article.title}
              </h3>
              <div className="flex items-center space-x-2 mt-2 text-xs text-gray-400">
                <span>{article.author.name}</span>
                <span>•</span>
                <span>{article.readingTime}m read</span>
              </div>
            </div>
          </div>
        </Link>
      </Card>
    );
  }

  if (variant === 'minimal') {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="group py-4 border-b border-dark-800 last:border-b-0"
      >
        <Link to={`/article/${article.id}`}>
          <h3 className="font-semibold text-white mb-2 group-hover:text-primary-400 transition-colors">
            {article.title}
          </h3>
          <div className="flex items-center justify-between text-sm text-gray-400">
            <div className="flex items-center space-x-2">
              <span>{article.author.name}</span>
              <span>•</span>
              <span>{formatDistanceToNow(new Date(article.publishedAt), { addSuffix: true })}</span>
            </div>
            <div className="flex items-center space-x-3">
              <span>{article.readingTime}m</span>
              <span>{article.likes} ❤️</span>
            </div>
          </div>
        </Link>
      </motion.div>
    );
  }

  if (featured) {
    return (
      <Card hover variant="glass" className="group relative overflow-hidden">
        <Link to={`/article/${article.id}`}>
          <div className="relative">
            <ResponsiveImage
              src={article.coverImage}
              alt={article.title}
              className="w-full h-64 transition-transform duration-500 group-hover:scale-110"
              aspectRatio="video"
              priority={featured}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-dark-950 via-dark-950/40 to-transparent" />
            
            {/* Tags overlay */}
            <div className="absolute top-4 left-4">
              <div className="flex flex-wrap gap-2">
                {article.tags.slice(0, 2).map(tag => (
                  <Badge key={tag} variant="primary" size="xs" animate>
                    {tag}
                  </Badge>
                ))}
              </div>
            </div>
            
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
                    <MessageCircle className="w-4 h-4 text-gray-400" />
                    <span className="text-sm text-gray-400">{article.comments.length}</span>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Tooltip content={isLiked ? 'Unlike' : 'Like this article'}>
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                    onClick={handleLike}
                    className={`flex items-center space-x-1 transition-colors ${
                      isLiked ? 'text-red-500' : 'text-gray-400 hover:text-red-500'
                    }`}
                  >
                    <Heart className={`w-4 h-4 ${isLiked ? 'fill-current' : ''}`} />
                    <span className="text-sm">{article.likes}</span>
                    </motion.button>
                  </Tooltip>
                  <Tooltip content="Bookmark">
                    <motion.button 
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      className="text-gray-400 hover:text-primary-500 transition-colors"
                    >
                    <BookmarkPlus className="w-4 h-4" />
                    </motion.button>
                  </Tooltip>
                </div>
              </div>
            </div>
          </div>
        </Link>
      </Card>
    );
  }

  return (
    <Card hover padding="lg" className="group">
      <Link to={`/article/${article.id}`}>
        <div className="flex space-x-4">
          <div className="flex-1">
            {/* Tags */}
            <div className="flex items-center space-x-2 mb-3">
              {article.tags.slice(0, 3).map(tag => (
                <Badge key={tag} variant="outline" size="xs">
                  {tag}
                </Badge>
              ))}
            </div>
            
            {/* Author info */}
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
                  <MessageCircle className="w-4 h-4 text-gray-400" />
                  <span className="text-sm text-gray-400">{article.comments.length}</span>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <Tooltip content={isLiked ? 'Unlike' : 'Like this article'}>
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                  onClick={handleLike}
                  className={`flex items-center space-x-1 transition-colors ${
                    isLiked ? 'text-red-500' : 'text-gray-400 hover:text-red-500'
                  }`}
                >
                  <Heart className={`w-4 h-4 ${isLiked ? 'fill-current' : ''}`} />
                  <span className="text-sm">{article.likes}</span>
                  </motion.button>
                </Tooltip>
                <Tooltip content="Bookmark">
                  <motion.button 
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    className="text-gray-400 hover:text-primary-500 transition-colors"
                  >
                  <BookmarkPlus className="w-4 h-4" />
                  </motion.button>
                </Tooltip>
              </div>
            </div>
          </div>
          {article.coverImage && (
            <div className="w-24 h-24 flex-shrink-0">
              <ResponsiveImage
                src={article.coverImage}
                alt={article.title}
                className="w-full h-full rounded-lg"
                aspectRatio="square"
              />
            </div>
          )}
        </div>
      </Link>
    </Card>
  );
};

export default ArticleCard;