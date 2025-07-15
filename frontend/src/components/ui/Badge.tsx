import React from 'react';
import { motion } from 'framer-motion';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'default' | 'primary' | 'secondary' | 'success' | 'warning' | 'error' | 'outline';
  size?: 'xs' | 'sm' | 'md' | 'lg';
  rounded?: boolean;
  className?: string;
  animate?: boolean;
}

const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'default',
  size = 'sm',
  rounded = true,
  className = '',
  animate = false
}) => {
  const baseClasses = 'inline-flex items-center font-medium transition-all duration-200';

  const variants = {
    default: 'bg-dark-800 text-gray-300 border border-dark-700',
    primary: 'bg-primary-600/20 text-primary-300 border border-primary-500/30',
    secondary: 'bg-blue-600/20 text-blue-300 border border-blue-500/30',
    success: 'bg-green-600/20 text-green-300 border border-green-500/30',
    warning: 'bg-yellow-600/20 text-yellow-300 border border-yellow-500/30',
    error: 'bg-red-600/20 text-red-300 border border-red-500/30',
    outline: 'bg-transparent text-gray-300 border border-gray-600 hover:border-primary-500 hover:text-primary-300'
  };

  const sizes = {
    xs: 'px-2 py-0.5 text-xs',
    sm: 'px-2.5 py-1 text-xs',
    md: 'px-3 py-1.5 text-sm',
    lg: 'px-4 py-2 text-base'
  };

  const roundedClass = rounded ? 'rounded-full' : 'rounded-md';

  const BadgeComponent = animate ? motion.span : 'span';
  const motionProps = animate ? {
    initial: { scale: 0, opacity: 0 },
    animate: { scale: 1, opacity: 1 },
    whileHover: { scale: 1.05 },
    transition: { duration: 0.2 }
  } : {};

  return (
    <BadgeComponent
      className={`${baseClasses} ${variants[variant]} ${sizes[size]} ${roundedClass} ${className}`}
      {...motionProps}
    >
      {children}
    </BadgeComponent>
  );
};

export default Badge;