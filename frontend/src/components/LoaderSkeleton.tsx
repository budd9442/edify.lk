import React from 'react';
import { motion } from 'framer-motion';

interface LoaderSkeletonProps {
  variant?: 'article' | 'author' | 'comment' | 'search';
  count?: number;
}

const LoaderSkeleton: React.FC<LoaderSkeletonProps> = ({ variant = 'article', count = 1 }) => {
  const skeletons = Array.from({ length: count }, (_, index) => {
    switch (variant) {
      case 'article':
        return (
          <motion.div
            key={index}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="bg-dark-900 border border-dark-800 rounded-lg p-6"
          >
            <div className="flex space-x-4">
              <div className="flex-1">
                <div className="flex items-center space-x-2 mb-3">
                  <div className="w-6 h-6 bg-dark-700 rounded-full shimmer"></div>
                  <div className="w-24 h-4 bg-dark-700 rounded shimmer"></div>
                  <div className="w-16 h-4 bg-dark-700 rounded shimmer"></div>
                </div>
                <div className="w-3/4 h-6 bg-dark-700 rounded mb-2 shimmer"></div>
                <div className="w-full h-4 bg-dark-700 rounded mb-1 shimmer"></div>
                <div className="w-2/3 h-4 bg-dark-700 rounded mb-4 shimmer"></div>
                <div className="flex items-center space-x-4">
                  <div className="w-20 h-4 bg-dark-700 rounded shimmer"></div>
                  <div className="w-16 h-4 bg-dark-700 rounded shimmer"></div>
                </div>
              </div>
              <div className="w-24 h-24 bg-dark-700 rounded-lg shimmer"></div>
            </div>
          </motion.div>
        );

      case 'author':
        return (
          <motion.div
            key={index}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex items-center justify-between p-3 bg-dark-800 rounded-lg"
          >
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-dark-700 rounded-full shimmer"></div>
              <div>
                <div className="w-24 h-4 bg-dark-700 rounded mb-1 shimmer"></div>
                <div className="w-20 h-3 bg-dark-700 rounded shimmer"></div>
              </div>
            </div>
            <div className="w-16 h-6 bg-dark-700 rounded-full shimmer"></div>
          </motion.div>
        );

      case 'comment':
        return (
          <motion.div
            key={index}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex space-x-4"
          >
            <div className="w-10 h-10 bg-dark-700 rounded-full shimmer"></div>
            <div className="flex-1">
              <div className="bg-dark-800 rounded-lg p-4">
                <div className="flex items-center space-x-2 mb-2">
                  <div className="w-20 h-4 bg-dark-700 rounded shimmer"></div>
                  <div className="w-16 h-3 bg-dark-700 rounded shimmer"></div>
                </div>
                <div className="w-full h-4 bg-dark-700 rounded mb-1 shimmer"></div>
                <div className="w-3/4 h-4 bg-dark-700 rounded shimmer"></div>
              </div>
            </div>
          </motion.div>
        );

      case 'search':
        return (
          <motion.div
            key={index}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="px-3 py-3"
          >
            <div className="flex items-start space-x-3">
              <div className="w-8 h-8 bg-dark-700 rounded-full shimmer"></div>
              <div className="flex-1">
                <div className="w-3/4 h-4 bg-dark-700 rounded mb-1 shimmer"></div>
                <div className="w-1/2 h-3 bg-dark-700 rounded shimmer"></div>
              </div>
            </div>
          </motion.div>
        );

      default:
        return null;
    }
  });

  return <>{skeletons}</>;
};

export default LoaderSkeleton;