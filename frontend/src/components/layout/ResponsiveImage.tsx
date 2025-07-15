import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useIntersectionObserver } from '../../hooks/useIntersectionObserver';

interface ResponsiveImageProps {
  src: string;
  alt: string;
  className?: string;
  sizes?: string;
  priority?: boolean;
  quality?: number;
  placeholder?: 'blur' | 'empty';
  blurDataURL?: string;
  onLoad?: () => void;
  onError?: () => void;
  aspectRatio?: 'square' | 'video' | 'portrait' | 'landscape' | 'auto';
}

const ResponsiveImage: React.FC<ResponsiveImageProps> = ({
  src,
  alt,
  className = '',
  sizes = '100vw',
  priority = false,
  quality = 75,
  placeholder = 'blur',
  blurDataURL,
  onLoad,
  onError,
  aspectRatio = 'auto'
}) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isError, setIsError] = useState(false);
  const [imageSrc, setImageSrc] = useState<string | undefined>(priority ? src : undefined);
  
  const [setNode, entry] = useIntersectionObserver({
    threshold: 0.1,
    rootMargin: '50px'
  });

  React.useEffect(() => {
    if (!priority && entry?.isIntersecting && !imageSrc) {
      setImageSrc(src);
    }
  }, [entry?.isIntersecting, src, imageSrc, priority]);

  const handleLoad = () => {
    setIsLoaded(true);
    onLoad?.();
  };

  const handleError = () => {
    setIsError(true);
    onError?.();
  };

  const aspectRatioClasses = {
    square: 'aspect-square',
    video: 'aspect-video',
    portrait: 'aspect-[3/4]',
    landscape: 'aspect-[4/3]',
    auto: ''
  };

  const generateSrcSet = (baseSrc: string) => {
    const widths = [320, 640, 768, 1024, 1280, 1536];
    return widths.map(width => 
      `${baseSrc}?w=${width}&q=${quality} ${width}w`
    ).join(', ');
  };

  return (
    <div 
      ref={setNode} 
      className={`relative overflow-hidden ${aspectRatioClasses[aspectRatio]} ${className}`}
    >
      {/* Placeholder */}
      {!isLoaded && !isError && (
        <div className="absolute inset-0 bg-dark-800">
          {placeholder === 'blur' && blurDataURL ? (
            <img
              src={blurDataURL}
              alt=""
              className="w-full h-full object-cover opacity-50 scale-110 blur-sm"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-dark-700 to-dark-800 animate-pulse" />
          )}
          
          {/* Loading indicator */}
          <div className="absolute inset-0 flex items-center justify-center">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
              className="w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full"
            />
          </div>
        </div>
      )}

      {/* Error state */}
      {isError && (
        <div className="absolute inset-0 bg-dark-800 flex items-center justify-center">
          <div className="text-center text-gray-500">
            <div className="w-12 h-12 bg-gray-600 rounded-lg mx-auto mb-2 flex items-center justify-center">
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
              </svg>
            </div>
            <p className="text-xs">Failed to load</p>
          </div>
        </div>
      )}

      {/* Actual image */}
      {imageSrc && !isError && (
        <motion.img
          src={imageSrc}
          srcSet={generateSrcSet(imageSrc)}
          sizes={sizes}
          alt={alt}
          onLoad={handleLoad}
          onError={handleError}
          initial={{ opacity: 0, scale: 1.1 }}
          animate={{ 
            opacity: isLoaded ? 1 : 0,
            scale: isLoaded ? 1 : 1.1
          }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
          className={`w-full h-full object-cover ${isLoaded ? 'block' : 'hidden'}`}
          loading={priority ? 'eager' : 'lazy'}
        />
      )}

      {/* Overlay gradient for better text readability */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent pointer-events-none" />
    </div>
  );
};

export default ResponsiveImage;