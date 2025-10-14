import React from 'react';

interface ErrorBannerProps {
  message: string;
  onClose?: () => void;
}

const ErrorBanner: React.FC<ErrorBannerProps> = ({ message, onClose }) => {
  if (!message) return null;
  return (
    <div className="mb-4 p-3 rounded-lg border border-red-800 bg-red-900/20 text-red-300 flex items-start justify-between">
      <div className="text-sm">{message}</div>
      {onClose && (
        <button onClick={onClose} className="text-red-200 hover:text-red-100 text-sm ml-4">Dismiss</button>
      )}
    </div>
  );
};

export default ErrorBanner;


