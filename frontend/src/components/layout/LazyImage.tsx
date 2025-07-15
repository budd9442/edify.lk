import React, { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { useIntersectionObserver } from '../../hooks/useIntersectionObserver';

interface LazyImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  src: string;
  alt: string;
  placeholder?: string;
  className?: string;
}

const LazyImage: React.FC<LazyImageProps> = ({
  src,
  alt,
  placeholder,
  className = '',
  ...props
}) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isError, setIsError] = useState(false);
  const [imageSrc, setImageSrc] = useState<string | undefined>(undefined);
  
  const [setNode, entry] = useIntersectionObserver({
    threshold: 0.1,
    rootMargin: '50px'
  });

  React.useEffect(() => {
    if (entry?.isIntersecting && !imageSrc) {
      setImageSrc(src);
    }
  }, [entry?.isIntersecting, src, imageSrc]);

  const handleLoad = () => {
    setIsLoaded(true);
  };

  const handleError = () => {
    setIsError(true);
  };

  return (
    <div ref={setNode} className={`relative overflow-hidden ${className}`}>
      {/* Placeholder */}
      {!isLoaded && !isError && (
        <div className="absolute inset-0 bg-dark-800 animate-pulse flex items-center justify-center">
          {placeholder ? (
            <img src={placeholder} alt="" className="opacity-50" />
          ) : (
            <div className="w-8 h-8 border-2 border-gray-600 border-t-primary-500 rounded-full animate-spin" />
          )}
        </div>
      )}

      {/* Error state */}
      {isError && (
        <div className="absolute inset-0 bg-dark-800 flex items-center justify-center">
          <div className="text-center text-gray-500">
            <div className="w-8 h-8 bg-gray-600 rounded mx-auto mb-2" />
            <p className="text-xs">Failed to load</p>
          </div>
        </div>
      )}

      {/* Actual image */}
      {imageSrc && !isError && (
        <motion.img
          src={imageSrc}
          alt={alt}
          onLoad={handleLoad}
          onError={handleError}
          initial={{ opacity: 0 }}
          animate={{ opacity: isLoaded ? 1 : 0 }}
          transition={{ duration: 0.3 }}
          className={`${className} ${isLoaded ? 'block' : 'hidden'}`}
          {...props}
        />
      )}
    </div>
  );
};

export default LazyImage;