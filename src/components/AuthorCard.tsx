import React from 'react';
import { motion } from 'framer-motion';
import { Plus, Check } from 'lucide-react';
import { useApp } from '../contexts/AppContext';
import { profilesService } from '../services/profilesService';

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
  const { state, dispatch } = useApp();
  const isFollowing = state.followedUsers.includes(author.id);

  const handleFollow = async () => {
    if (isFollowing) {
      dispatch({ type: 'UNFOLLOW_USER', payload: author.id });
      try {
        await profilesService.unfollow(author.id);
      } catch (e) {
        // rollback
        dispatch({ type: 'FOLLOW_USER', payload: author.id });
      }
    } else {
      dispatch({ type: 'FOLLOW_USER', payload: author.id });
      try {
        await profilesService.follow(author.id);
      } catch (e) {
        // rollback
        dispatch({ type: 'UNFOLLOW_USER', payload: author.id });
      }
    }
  };

  if (variant === 'compact') {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between p-3 bg-dark-800 rounded-lg border border-dark-700"
      >
        <div className="flex items-center space-x-3">
          <img
            src={author.avatar}
            alt={author.name}
            className="w-10 h-10 rounded-full"
          />
          <div>
            <h4 className="text-sm font-medium text-white flex items-center space-x-1">
              <span>{author.name}</span>
              {author.verified && (
                <div className="w-4 h-4 bg-primary-500 rounded-full flex items-center justify-center">
                  <Check className="w-2.5 h-2.5 text-white" />
                </div>
              )}
            </h4>
            <p className="text-xs text-gray-400">
              {author.followersCount.toLocaleString()} followers
            </p>
          </div>
        </div>
        {showFollowButton && (
          <button
            onClick={handleFollow}
            className={`flex items-center space-x-1 px-3 py-1 rounded-full text-sm font-medium transition-colors ${
              isFollowing
                ? 'bg-dark-700 text-gray-300 hover:bg-dark-600'
                : 'bg-primary-600 text-white hover:bg-primary-700'
            }`}
          >
            {isFollowing ? (
              <span>Following</span>
            ) : (
              <>
                <Plus className="w-3 h-3" />
                <span>Follow</span>
              </>
            )}
          </button>
        )}
      </motion.div>
    );
  }

  if (variant === 'detailed') {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-dark-900 border border-dark-800 rounded-xl p-6"
      >
        <div className="text-center">
          <img
            src={author.avatar}
            alt={author.name}
            className="w-20 h-20 rounded-full mx-auto mb-4"
          />
          <h3 className="text-lg font-semibold text-white flex items-center justify-center space-x-2">
            <span>{author.name}</span>
            {author.verified && (
              <div className="w-5 h-5 bg-primary-500 rounded-full flex items-center justify-center">
                <Check className="w-3 h-3 text-white" />
              </div>
            )}
          </h3>
          <p className="text-gray-400 text-sm mt-2 line-clamp-2">{author.bio}</p>
          <div className="flex items-center justify-center space-x-6 mt-4 text-sm text-gray-400">
            <div className="text-center">
              <div className="font-semibold text-white">{author.followersCount.toLocaleString()}</div>
              <div>Followers</div>
            </div>
            <div className="text-center">
              <div className="font-semibold text-white">{author.articlesCount}</div>
              <div>Articles</div>
            </div>
          </div>
          {showFollowButton && (
            <button
              onClick={handleFollow}
              className={`mt-4 w-full flex items-center justify-center space-x-2 py-2 px-4 rounded-lg font-medium transition-colors ${
                isFollowing
                  ? 'bg-dark-800 text-gray-300 hover:bg-dark-700'
                  : 'bg-primary-600 text-white hover:bg-primary-700'
              }`}
            >
              {isFollowing ? (
                <span>Following</span>
              ) : (
                <>
                  <Plus className="w-4 h-4" />
                  <span>Follow</span>
                </>
              )}
            </button>
          )}
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex items-center justify-between"
    >
      <div className="flex items-center space-x-3">
        <img
          src={author.avatar}
          alt={author.name}
          className="w-12 h-12 rounded-full"
        />
        <div>
          <h4 className="text-sm font-medium text-white flex items-center space-x-1">
            <span>{author.name}</span>
            {author.verified && (
              <div className="w-4 h-4 bg-primary-500 rounded-full flex items-center justify-center">
                <Check className="w-2.5 h-2.5 text-white" />
              </div>
            )}
          </h4>
          <p className="text-xs text-gray-400">
            {author.followersCount.toLocaleString()} followers • {author.articlesCount} articles
          </p>
        </div>
      </div>
      {showFollowButton && (
        <button
          onClick={handleFollow}
          className={`flex items-center space-x-1 px-3 py-1 rounded-full text-sm font-medium transition-colors ${
            isFollowing
              ? 'bg-dark-800 text-gray-300 hover:bg-dark-700'
              : 'bg-primary-600 text-white hover:bg-primary-700'
          }`}
        >
          {isFollowing ? (
            <span>Following</span>
          ) : (
            <>
              <Plus className="w-3 h-3" />
              <span>Follow</span>
            </>
          )}
        </button>
      )}
    </motion.div>
  );
};

export default AuthorCard;