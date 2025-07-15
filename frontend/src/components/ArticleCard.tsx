import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Heart, MessageCircle, Clock, BookmarkPlus, Eye } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ArticleWithAuthor } from '../services/articleService';
import { useAuth } from '../contexts/AuthContext';
import Card from './ui/Card';
import Badge from './ui/Badge';
import Tooltip from './ui/Tooltip';
import { articleService } from '../services/articleService';

interface ArticleCardProps {
  article: ArticleWithAuthor;
  featured?: boolean;
  variant?: 'default' | 'compact' | 'minimal';
}

const ArticleCard: React.FC<ArticleCardProps> = ({ 
  article, 
  featured = false, 
  variant = 'default' 
}) => {
  const { user } = useAuth();

  const handleLike = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!user) return;

    try {
      if (article.is_liked) {
        await articleService.unlikeArticle(article.id, user.id);
      } else {
        await articleService.likeArticle(article.id, user.id);
      }
      // In a real app, you'd update the local state or refetch
    } catch (error) {
      console.error('Error toggling like:', error);
    }
  };

  const handleBookmark = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!user) return;

    try {
      if (article.is_bookmarked) {
        await articleService.unbookmarkArticle(article.id, user.id);
      } else {
        await articleService.bookmarkArticle(article.id, user.id);
      }
      // In a real app, you'd update the local state or refetch
    } catch (error) {
      console.error('Error toggling bookmark:', error);
    }
  };

  if (variant === 'compact') {
    return (
      <Card hover className="group">
        <Link to={`/article/${article.slug}`}>
          <div className="flex items-center space-x-4">
            {article.cover_image && (
              <div className="w-16 h-16 flex-shrink-0">
                <img
                  src={article.cover_image}
                  alt={article.title}
                  className="w-full h-full object-cover rounded-lg"
                />
              </div>
            )}
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-white text-sm line-clamp-2 group-hover:text-primary-400 transition-colors">
                {article.title}
              </h3>
              <div className="flex items-center space-x-2 mt-2 text-xs text-gray-400">
                <span>{article.profiles.full_name}</span>
                <span>•</span>
                <span>{article.reading_time}m read</span>
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
        <Link to={`/article/${article.slug}`}>
          <h3 className="font-semibold text-white mb-2 group-hover:text-primary-400 transition-colors">
            {article.title}
          </h3>
          <div className="flex items-center justify-between text-sm text-gray-400">
            <div className="flex items-center space-x-2">
              <span>{article.profiles.full_name}</span>
              <span>•</span>
              <span>{formatDistanceToNow(new Date(article.published_at || article.created_at), { addSuffix: true })}</span>
            </div>
            <div className="flex items-center space-x-3">
              <span>{article.reading_time}m</span>
              <span>{article.likes_count} ❤️</span>
            </div>
          </div>
        </Link>
      </motion.div>
    );
  }

  if (featured) {
    return (
      <Card hover variant="glass" className="group relative overflow-hidden">
        <Link to={`/article/${article.slug}`}>
          <div className="relative">
            {article.cover_image && (
              <>
                <img
                  src={article.cover_image}
                  alt={article.title}
                  className="w-full h-64 object-cover transition-transform duration-500 group-hover:scale-110"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-dark-950 via-dark-950/40 to-transparent" />
              </>
            )}
            
            {/* Tags overlay */}
            <div className="absolute top-4 left-4">
              <div className="flex flex-wrap gap-2">
                {article.tags.slice(0, 2).map(tag => (
                  <Badge key={tag.id} variant="primary" size="xs" animate>
                    {tag.name}
                  </Badge>
                ))}
              </div>
            </div>
            
            <div className="absolute bottom-0 left-0 right-0 p-6">
              <div className="flex items-center space-x-2 mb-3">
                <img
                  src={article.profiles.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(article.profiles.full_name || 'User')}&background=AC834F&color=fff`}
                  alt={article.profiles.full_name || 'User'}
                  className="w-8 h-8 rounded-full"
                />
                <span className="text-sm text-gray-300">{article.profiles.full_name}</span>
                <span className="text-gray-500">•</span>
                <span className="text-sm text-gray-400">
                  {formatDistanceToNow(new Date(article.published_at || article.created_at), { addSuffix: true })}
                </span>
              </div>
              <h2 className="text-xl font-bold text-white mb-2 line-clamp-2">
                {article.title}
              </h2>
              {article.excerpt && (
                <p className="text-gray-300 text-sm line-clamp-2 mb-4">
                  {article.excerpt}
                </p>
              )}
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="flex items-center space-x-1">
                    <Clock className="w-4 h-4 text-gray-400" />
                    <span className="text-sm text-gray-400">{article.reading_time} min read</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Eye className="w-4 h-4 text-gray-400" />
                    <span className="text-sm text-gray-400">{article.views_count}</span>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Tooltip content={article.is_liked ? 'Unlike' : 'Like this article'}>
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={handleLike}
                      className={`flex items-center space-x-1 transition-colors ${
                        article.is_liked ? 'text-red-500' : 'text-gray-400 hover:text-red-500'
                      }`}
                    >
                      <Heart className={`w-4 h-4 ${article.is_liked ? 'fill-current' : ''}`} />
                      <span className="text-sm">{article.likes_count}</span>
                    </motion.button>
                  </Tooltip>
                  <Tooltip content={article.is_bookmarked ? 'Remove bookmark' : 'Bookmark'}>
                    <motion.button 
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={handleBookmark}
                      className={`transition-colors ${
                        article.is_bookmarked ? 'text-primary-500' : 'text-gray-400 hover:text-primary-500'
                      }`}
                    >
                      <BookmarkPlus className={`w-4 h-4 ${article.is_bookmarked ? 'fill-current' : ''}`} />
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
      <Link to={`/article/${article.slug}`}>
        <div className="flex space-x-4">
          <div className="flex-1">
            {/* Tags */}
            <div className="flex items-center space-x-2 mb-3">
              {article.tags.slice(0, 3).map(tag => (
                <Badge key={tag.id} variant="outline" size="xs">
                  {tag.name}
                </Badge>
              ))}
            </div>
            
            {/* Author info */}
            <div className="flex items-center space-x-2 mb-3">
              <img
                src={article.profiles.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(article.profiles.full_name || 'User')}&background=AC834F&color=fff`}
                alt={article.profiles.full_name || 'User'}
                className="w-6 h-6 rounded-full"
              />
              <span className="text-sm text-gray-300">{article.profiles.full_name}</span>
              <span className="text-gray-500">•</span>
              <span className="text-sm text-gray-400">
                {formatDistanceToNow(new Date(article.published_at || article.created_at), { addSuffix: true })}
              </span>
            </div>
            
            <h3 className="text-lg font-semibold text-white mb-2 line-clamp-2 group-hover:text-primary-400 transition-colors">
              {article.title}
            </h3>
            {article.excerpt && (
              <p className="text-gray-400 text-sm line-clamp-2 mb-4">
                {article.excerpt}
              </p>
            )}
            
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-1">
                  <Clock className="w-4 h-4 text-gray-400" />
                  <span className="text-sm text-gray-400">{article.reading_time} min read</span>
                </div>
                <div className="flex items-center space-x-1">
                  <MessageCircle className="w-4 h-4 text-gray-400" />
                  <span className="text-sm text-gray-400">{article.comments_count}</span>
                </div>
                <div className="flex items-center space-x-1">
                  <Eye className="w-4 h-4 text-gray-400" />
                  <span className="text-sm text-gray-400">{article.views_count}</span>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <Tooltip content={article.is_liked ? 'Unlike' : 'Like this article'}>
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={handleLike}
                    className={`flex items-center space-x-1 transition-colors ${
                      article.is_liked ? 'text-red-500' : 'text-gray-400 hover:text-red-500'
                    }`}
                  >
                    <Heart className={`w-4 h-4 ${article.is_liked ? 'fill-current' : ''}`} />
                    <span className="text-sm">{article.likes_count}</span>
                  </motion.button>
                </Tooltip>
                <Tooltip content={article.is_bookmarked ? 'Remove bookmark' : 'Bookmark'}>
                  <motion.button 
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={handleBookmark}
                    className={`transition-colors ${
                      article.is_bookmarked ? 'text-primary-500' : 'text-gray-400 hover:text-primary-500'
                    }`}
                  >
                    <BookmarkPlus className={`w-4 h-4 ${article.is_bookmarked ? 'fill-current' : ''}`} />
                  </motion.button>
                </Tooltip>
              </div>
            </div>
          </div>
          {article.cover_image && (
            <div className="w-24 h-24 flex-shrink-0">
              <img
                src={article.cover_image}
                alt={article.title}
                className="w-full h-full object-cover rounded-lg"
              />
            </div>
          )}
        </div>
      </Link>
    </Card>
  );
};

export default ArticleCard;