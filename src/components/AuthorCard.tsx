import React from 'react';
import { motion } from 'framer-motion';
import { Plus, Check } from 'lucide-react';
import { FollowButton } from './follow/FollowButton';

interface Author {
  id: string;
  name: string;
  avatar: string;
  bio: string;
  followersCount: number;
  articlesCount: number;
  verified?: boolean;
}

interface AuthorCardProps {
  author: Author;
  showFollowButton?: boolean;
  variant?: 'default' | 'compact' | 'detailed';
}

const AuthorCard: React.FC<AuthorCardProps> = ({ 
  author, 
  showFollowButton = true,
  variant = 'default'
}) => {
  // Follow state handled by FollowButton component

  if (variant === 'compact') {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        whileHover={{ y: -2 }}
        className="flex items-center justify-between p-3 rounded-xl border border-dark-700/70 bg-gradient-to-br from-dark-900/70 to-dark-800/70 hover:border-dark-600/80 transition-colors"
      >
        <div className="flex items-center space-x-3">
          <img
            src={author.avatar}
            alt={author.name}
            className="w-10 h-10 rounded-full ring-1 ring-dark-700/60"
          />
          <div>
            <div className="flex items-center space-x-2">
              <h4 className="text-sm font-semibold text-white flex items-center space-x-1">
                <span>{author.name}</span>
                {author.verified && (
                  <div className="w-4 h-4 bg-primary-600/90 rounded-full flex items-center justify-center">
                    <Check className="w-2.5 h-2.5 text-white" />
                  </div>
                )}
              </h4>
              {showFollowButton && (
                <FollowButton
                  authorId={author.id}
                  compact
                  onChange={(isFollowing) => {
                    author.followersCount = Math.max(0, author.followersCount + (isFollowing ? 1 : -1));
                  }}
                />
              )}
            </div>
            <div className="text-[11px] text-gray-400 flex items-center space-x-2">
              <span>{author.followersCount.toLocaleString()} followers</span>
              <span className="text-gray-600">•</span>
              <span>{author.articlesCount} articles</span>
            </div>
          </div>
        </div>
      </motion.div>
    );
  }

  if (variant === 'detailed') {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        whileHover={{ y: -4 }}
        className="rounded-2xl p-6 border border-dark-800/70 bg-gradient-to-br from-dark-900/70 via-dark-900/50 to-dark-800/60 shadow-[0_0_0_1px_rgba(0,0,0,0.4)]"
      >
        <div className="text-center">
          <img
            src={author.avatar}
            alt={author.name}
            className="w-20 h-20 rounded-full mx-auto mb-4 ring-1 ring-dark-700/60"
          />
          <div className="flex items-center justify-center space-x-3">
            <h3 className="text-lg font-semibold text-white flex items-center space-x-2">
              <span>{author.name}</span>
              {author.verified && (
                <div className="w-5 h-5 bg-primary-600/90 rounded-full flex items-center justify-center">
                  <Check className="w-3 h-3 text-white" />
                </div>
              )}
            </h3>
            {showFollowButton && (
              <FollowButton
                authorId={author.id}
                compact
                onChange={(isFollowing) => {
                  author.followersCount = Math.max(0, author.followersCount + (isFollowing ? 1 : -1));
                }}
              />
            )}
          </div>
          <p className="text-gray-300/80 text-sm mt-2 line-clamp-3">{author.bio}</p>
          <div className="flex items-center justify-center space-x-6 mt-4 text-sm text-gray-300/80">
            <div className="text-center">
              <div className="font-semibold text-white">{author.followersCount.toLocaleString()}</div>
              <div>Followers</div>
            </div>
            <div className="text-center">
              <div className="font-semibold text-white">{author.articlesCount}</div>
              <div>Articles</div>
            </div>
          </div>
          {/* Follow button moved next to the name */}
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -2 }}
      className="flex items-center justify-between p-4 rounded-xl border border-dark-800/70 bg-dark-900/60"
    >
      <div className="flex items-center space-x-3">
        <img
          src={author.avatar}
          alt={author.name}
          className="w-12 h-12 rounded-full ring-1 ring-dark-700/60"
        />
        <div>
          <div className="flex items-center space-x-2">
            <h4 className="text-sm font-semibold text-white flex items-center space-x-1">
              <span>{author.name}</span>
              {author.verified && (
                <div className="w-4 h-4 bg-primary-600/90 rounded-full flex items-center justify-center">
                  <Check className="w-2.5 h-2.5 text-white" />
                </div>
              )}
            </h4>
            {showFollowButton && (
              <FollowButton
                authorId={author.id}
                compact
                onChange={(isFollowing) => {
                  author.followersCount = Math.max(0, author.followersCount + (isFollowing ? 1 : -1));
                }}
              />
            )}
          </div>
          <p className="text-xs text-gray-400">
            {author.followersCount.toLocaleString()} followers • {author.articlesCount} articles
          </p>
        </div>
      </div>
    </motion.div>
  );
};

export default AuthorCard;