import React from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, Users, Plus } from 'lucide-react';
import { mockUsers } from '../mock-data/articles';
import { useApp } from '../contexts/AppContext';

const Sidebar: React.FC = () => {
  const { state, dispatch } = useApp();

  const handleFollow = (userId: string) => {
    const isFollowing = state.followedUsers.includes(userId);
    if (isFollowing) {
      dispatch({ type: 'UNFOLLOW_USER', payload: userId });
    } else {
      dispatch({ type: 'FOLLOW_USER', payload: userId });
    }
  };

  return (
    <aside className="w-80 space-y-6">
      {/* Trending Topics */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-dark-900 border border-dark-800 rounded-lg p-6"
      >
        <div className="flex items-center space-x-2 mb-4">
          <TrendingUp className="w-5 h-5 text-primary-500" />
          <h3 className="text-lg font-semibold text-white">Trending Topics</h3>
        </div>
        <div className="space-y-3">
          {['Artificial Intelligence', 'Remote Work', 'Sustainability', 'Blockchain', 'Mental Health'].map((topic, index) => (
            <div key={topic} className="flex items-center justify-between">
              <span className="text-gray-300 hover:text-white cursor-pointer transition-colors">
                {topic}
              </span>
              <span className="text-sm text-gray-500">#{index + 1}</span>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Top Authors */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-dark-900 border border-dark-800 rounded-lg p-6"
      >
        <div className="flex items-center space-x-2 mb-4">
          <Users className="w-5 h-5 text-primary-500" />
          <h3 className="text-lg font-semibold text-white">Top Authors</h3>
        </div>
        <div className="space-y-4">
          {mockUsers.slice(0, 3).map((user) => {
            const isFollowing = state.followedUsers.includes(user.id);
            return (
              <div key={user.id} className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <img
                    src={user.avatar}
                    alt={user.name}
                    className="w-10 h-10 rounded-full"
                  />
                  <div>
                    <h4 className="text-sm font-medium text-white">{user.name}</h4>
                    <p className="text-xs text-gray-400">{user.followersCount.toLocaleString()} followers</p>
                  </div>
                </div>
                <button
                  onClick={() => handleFollow(user.id)}
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
              </div>
            );
          })}
        </div>
      </motion.div>

      {/* Newsletter Signup */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="bg-gradient-to-r from-primary-900/20 to-primary-800/20 border border-primary-800/30 rounded-lg p-6"
      >
        <h3 className="text-lg font-semibold text-white mb-2">Stay Updated</h3>
        <p className="text-gray-300 text-sm mb-4">
          Get the latest articles and insights delivered to your inbox.
        </p>
        <div className="space-y-3">
          <input
            type="email"
            placeholder="Enter your email"
            className="w-full px-3 py-2 bg-dark-800 text-white rounded-lg border border-dark-700 focus:border-primary-500 focus:ring-1 focus:ring-primary-500 focus:outline-none"
          />
          <button className="w-full bg-primary-600 text-white py-2 rounded-lg hover:bg-primary-700 transition-colors">
            Subscribe
          </button>
        </div>
      </motion.div>
    </aside>
  );
};

export default Sidebar;