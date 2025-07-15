import React from 'react';
import { motion } from 'framer-motion';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  hover?: boolean;
  padding?: 'none' | 'sm' | 'md' | 'lg' | 'xl';
  variant?: 'default' | 'glass' | 'elevated' | 'bordered' | 'gradient';
  rounded?: 'sm' | 'md' | 'lg' | 'xl' | '2xl';
}

const Card: React.FC<CardProps> = ({
  children,
  className = '',
  hover = false,
  padding = 'md',
  variant = 'default',
  rounded = 'xl'
}) => {
  const baseClasses = 'transition-all duration-300 relative overflow-hidden';
  
  const variants = {
    default: 'bg-dark-900 border border-dark-800',
    glass: 'bg-dark-900/80 backdrop-blur-xl border border-dark-800/50',
    elevated: 'bg-dark-900 border border-dark-800 shadow-2xl shadow-black/20',
    bordered: 'bg-dark-900 border-2 border-dark-700',
    gradient: 'bg-gradient-to-br from-dark-900 to-dark-800 border border-dark-700'
  };

  const hoverClasses = hover ? 'hover:border-primary-500/50 hover:shadow-lg hover:shadow-primary-500/10 hover:-translate-y-1' : '';
  
  const paddingClasses = {
    none: '',
    sm: 'p-4',
    md: 'p-6',
    lg: 'p-8',
    xl: 'p-10'
  };

  const roundedClasses = {
    sm: 'rounded-sm',
    md: 'rounded-md',
    lg: 'rounded-lg',
    xl: 'rounded-xl',
    '2xl': 'rounded-2xl'
  };

  const CardComponent = hover ? motion.div : 'div';
  const motionProps = hover ? {
    whileHover: { y: -4, scale: 1.01 },
    transition: { duration: 0.2, ease: 'easeOut' }
  } : {};

  return (
    <CardComponent
      className={`
        ${baseClasses} 
        ${variants[variant]} 
        ${hoverClasses} 
        ${paddingClasses[padding]} 
        ${roundedClasses[rounded]} 
        ${className}
      `}
      {...motionProps}
    >
      {/* Subtle gradient overlay for premium feel */}
      {variant === 'glass' && (
        <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent pointer-events-none" />
      )}
      
      {/* Animated border for hover effect */}
      {hover && (
        <motion.div
          className="absolute inset-0 rounded-xl border border-primary-500/0 pointer-events-none"
          whileHover={{ borderColor: 'rgba(172, 131, 79, 0.3)' }}
          transition={{ duration: 0.3 }}
        />
      )}
      
      {children}
    </CardComponent>
  );
};

export default Card;