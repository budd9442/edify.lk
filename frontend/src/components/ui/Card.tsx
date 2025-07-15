import React from 'react';
import { motion } from 'framer-motion';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  hover?: boolean;
  padding?: 'none' | 'sm' | 'md' | 'lg';
}

const Card: React.FC<CardProps> = ({
  children,
  className = '',
  hover = false,
  padding = 'md'
}) => {
  const baseClasses = 'bg-dark-900 border border-dark-800 rounded-xl transition-all duration-300';
  const hoverClasses = hover ? 'hover:border-primary-500/50 hover:shadow-lg hover:shadow-primary-500/10' : '';
  
  const paddingClasses = {
    none: '',
    sm: 'p-4',
    md: 'p-6',
    lg: 'p-8'
  };

  const CardComponent = hover ? motion.div : 'div';
  const motionProps = hover ? {
    whileHover: { y: -2 },
    transition: { duration: 0.2 }
  } : {};

  return (
    <CardComponent
      className={`${baseClasses} ${hoverClasses} ${paddingClasses[padding]} ${className}`}
      {...motionProps}
    >
      {children}
    </CardComponent>
  );
};

export default Card;