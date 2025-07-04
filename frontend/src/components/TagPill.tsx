import React from 'react';
import { motion } from 'framer-motion';

interface TagPillProps {
  tag: string;
  isActive?: boolean;
  onClick?: () => void;
  variant?: 'default' | 'outline' | 'solid';
  size?: 'sm' | 'md' | 'lg';
}

const TagPill: React.FC<TagPillProps> = ({ 
  tag, 
  isActive = false, 
  onClick, 
  variant = 'default',
  size = 'md'
}) => {
  const sizeClasses = {
    sm: 'px-2 py-1 text-xs',
    md: 'px-3 py-1 text-sm',
    lg: 'px-4 py-2 text-base'
  };

  const variantClasses = {
    default: isActive 
      ? 'bg-primary-600 text-white border-primary-600' 
      : 'bg-dark-800 text-gray-300 border-dark-700 hover:border-primary-500 hover:text-primary-300',
    outline: isActive
      ? 'bg-primary-900/30 text-primary-300 border-primary-500'
      : 'bg-transparent text-gray-400 border-gray-600 hover:border-primary-500 hover:text-primary-300',
    solid: isActive
      ? 'bg-primary-600 text-white'
      : 'bg-dark-700 text-gray-300 hover:bg-primary-600 hover:text-white'
  };

  return (
    <motion.button
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      onClick={onClick}
      className={`
        ${sizeClasses[size]}
        ${variantClasses[variant]}
        rounded-full border transition-all duration-200 font-medium
        ${onClick ? 'cursor-pointer' : 'cursor-default'}
      `}
    >
      {tag}
    </motion.button>
  );
};

export default TagPill;