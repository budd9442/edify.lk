import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, CheckCircle, AlertCircle, Info } from 'lucide-react';

interface ToastProps {
  id: string;
  message: string;
  type: 'info' | 'error' | 'success';
  onDismiss: (id: string) => void;
  duration?: number;
}

const Toast: React.FC<ToastProps> = ({ id, message, type, onDismiss, duration = 4000 }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onDismiss(id);
    }, duration);

    return () => clearTimeout(timer);
  }, [id, onDismiss, duration]);

  const getIcon = () => {
    switch (type) {
      case 'success':
        return <CheckCircle className="w-4 h-4 text-gray-300" />;
      case 'error':
        return <AlertCircle className="w-4 h-4 text-gray-300" />;
      default:
        return <Info className="w-4 h-4 text-gray-300" />;
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: -20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -20, scale: 0.95 }}
      transition={{ 
        type: "spring", 
        stiffness: 400, 
        damping: 25,
        duration: 0.2 
      }}
      className="
        bg-dark-800/95 backdrop-blur-sm border border-dark-700/50
        rounded-lg shadow-lg text-gray-100
        min-w-[280px] max-w-[360px]
      "
    >
      {/* Content */}
      <div className="flex items-center gap-3 p-3">
        <div className="flex-shrink-0">
          {getIcon()}
        </div>
        
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium leading-relaxed">
            {message}
          </p>
        </div>
        
        <button
          onClick={() => onDismiss(id)}
          className="flex-shrink-0 p-1 rounded hover:bg-dark-700/50 transition-colors duration-150"
          aria-label="Dismiss notification"
        >
          <X className="w-3 h-3 text-gray-400 hover:text-gray-200" />
        </button>
      </div>
    </motion.div>
  );
};

interface ToastContainerProps {
  toasts: Array<{ id: string; message: string; type: 'info' | 'error' | 'success'; duration?: number }>;
  onDismiss: (id: string) => void;
}

export const ToastContainer: React.FC<ToastContainerProps> = ({ toasts, onDismiss }) => {
  return (
    <div className="fixed top-16 sm:top-4 right-4 left-4 sm:left-auto z-[10000] space-y-3 pointer-events-none max-w-[calc(100vw-2rem)]">
      <AnimatePresence mode="popLayout">
        {toasts.map((toast) => (
          <div key={toast.id} className="pointer-events-auto">
            <Toast
              {...toast}
              onDismiss={onDismiss}
              duration={toast.duration || 4000}
            />
          </div>
        ))}
      </AnimatePresence>
    </div>
  );
};

export default Toast;
