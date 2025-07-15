import React, { forwardRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Eye, EyeOff } from 'lucide-react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  variant?: 'default' | 'filled' | 'underlined';
  inputSize?: 'sm' | 'md' | 'lg';
  showPasswordToggle?: boolean;
}

const Input = forwardRef<HTMLInputElement, InputProps>(({
  label,
  error,
  helperText,
  leftIcon,
  rightIcon,
  className = '',
  variant = 'default',
  inputSize = 'md',
  type = 'text',
  showPasswordToggle = false,
  ...props
}, ref) => {
  const [showPassword, setShowPassword] = useState(false);
  const [isFocused, setIsFocused] = useState(false);

  const inputType = showPasswordToggle ? (showPassword ? 'text' : 'password') : type;

  const baseClasses = 'w-full text-white transition-all duration-300 focus:outline-none';
  
  const variants = {
    default: `bg-dark-800 rounded-lg border ${
      error 
        ? 'border-red-500 focus:border-red-500 focus:ring-2 focus:ring-red-500/20' 
        : 'border-dark-700 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20'
    } hover:border-dark-600`,
    filled: `bg-dark-800/50 backdrop-blur-sm rounded-lg border-2 border-transparent ${
      error
        ? 'focus:border-red-500 focus:bg-red-900/10'
        : 'focus:border-primary-500 focus:bg-primary-900/10'
    } hover:bg-dark-800/70`,
    underlined: `bg-transparent border-0 border-b-2 rounded-none ${
      error
        ? 'border-red-500 focus:border-red-500'
        : 'border-dark-700 focus:border-primary-500'
    } hover:border-dark-600`
  };

  const sizes = {
    sm: 'py-2 text-sm',
    md: 'py-3 text-base',
    lg: 'py-4 text-lg'
  };

  const paddingClasses = leftIcon && rightIcon 
    ? 'pl-12 pr-12'
    : leftIcon 
      ? 'pl-12 pr-4'
      : rightIcon || showPasswordToggle
        ? 'pl-4 pr-12'
        : 'px-4';

  return (
    <div className="space-y-2">
      {label && (
        <motion.label 
          className={`block text-sm font-medium transition-colors duration-200 ${
            isFocused ? 'text-primary-400' : 'text-gray-300'
          }`}
          animate={{ color: isFocused ? '#AC834F' : '#d1d5db' }}
        >
          {label}
        </motion.label>
      )}
      
      <div className="relative group">
        {leftIcon && (
          <div className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 group-focus-within:text-primary-400 transition-colors duration-200">
            {leftIcon}
          </div>
        )}
        
        <motion.input
          ref={ref}
          type={inputType}
          className={`${baseClasses} ${variants[variant]} ${sizes[inputSize]} ${paddingClasses} ${className}`}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          whileFocus={{ scale: 1.01 }}
          {...props}
        />
        
        {(rightIcon || showPasswordToggle) && (
          <div className="absolute right-4 top-1/2 transform -translate-y-1/2">
            {showPasswordToggle ? (
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="text-gray-400 hover:text-primary-400 transition-colors duration-200 focus:outline-none"
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            ) : (
              <div className="text-gray-400 group-focus-within:text-primary-400 transition-colors duration-200">
                {rightIcon}
              </div>
            )}
          </div>
        )}

        {/* Focus ring animation */}
        <motion.div
          className="absolute inset-0 rounded-lg border-2 border-primary-500 opacity-0 pointer-events-none"
          animate={{
            opacity: isFocused ? 0.3 : 0,
            scale: isFocused ? 1.02 : 1
          }}
          transition={{ duration: 0.2 }}
        />
      </div>
      
      <AnimatePresence>
        {error && (
          <motion.p
            initial={{ opacity: 0, y: -10, height: 0 }}
            animate={{ opacity: 1, y: 0, height: 'auto' }}
            exit={{ opacity: 0, y: -10, height: 0 }}
            className="text-sm text-red-400 flex items-center space-x-1"
          >
            <span className="w-1 h-1 bg-red-400 rounded-full" />
            <span>{error}</span>
          </motion.p>
        )}
      </AnimatePresence>
      
      {helperText && !error && (
        <p className="text-sm text-gray-500">{helperText}</p>
      )}
    </div>
  );
});

Input.displayName = 'Input';

export default Input;