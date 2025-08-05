import React, { memo, useState, useCallback } from 'react';
import { useInView } from 'react-intersection-observer';

interface LazyImageProps {
  src: string;
  alt: string;
  className?: string;
  placeholderType?: 'photo-1649972904349-6e44c42644a7' | 'photo-1488590528505-98d2b5aba04b' | 'photo-1518770660439-4636190af475' | 'photo-1461749280684-dccba630e2f6' | 'photo-1486312338219-ce68d2c6f44d' | 'photo-1581091226825-a6a2a5aee158' | 'photo-1485827404703-89b55fcc595e' | 'photo-1526374965328-7f61d4dc18c5' | 'photo-1531297484001-80022131f5a1' | 'photo-1487058792275-0ad4aaf24ca7';
  onLoad?: () => void;
  onError?: () => void;
}

const getPlaceholderUrl = (type: string) => {
  return `https://images.unsplash.com/${type}?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=800&q=60`;
};

export const LazyImage = memo(({ 
  src, 
  alt, 
  className = "", 
  placeholderType = 'photo-1649972904349-6e44c42644a7',
  onLoad,
  onError 
}: LazyImageProps) => {
  const [hasLoaded, setHasLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [imageLoadAttempted, setImageLoadAttempted] = useState(false);
  
  const { ref, inView } = useInView({
    threshold: 0.1,
    triggerOnce: true,
    rootMargin: '50px'
  });

  const handleImageLoad = useCallback(() => {
    setHasLoaded(true);
    onLoad?.();
  }, [onLoad]);

  const handleImageError = useCallback(() => {
    setHasError(true);
    onError?.();
  }, [onError]);

  const placeholderUrl = getPlaceholderUrl(placeholderType);

  return (
    <div ref={ref} className={`relative overflow-hidden bg-muted ${className}`}>
      {/* Placeholder - always visible until image loads */}
      <div
        className={`absolute inset-0 transition-opacity duration-300 ${
          hasLoaded && !hasError ? 'opacity-0' : 'opacity-100'
        }`}
      >
        <img
          src={placeholderUrl}
          alt="Loading..."
          className="w-full h-full object-cover filter blur-sm scale-110"
          loading="eager"
        />
        {/* Loading indicator */}
        {inView && !hasLoaded && !hasError && imageLoadAttempted && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/20">
            <div className="w-8 h-8 border-2 border-white border-t-transparent rounded-full animate-spin" />
          </div>
        )}
      </div>

      {/* Actual image */}
      {inView && (
        <img
          src={src}
          alt={alt}
          className={`w-full h-full object-cover transition-opacity duration-300 ${
            hasLoaded && !hasError ? 'opacity-100' : 'opacity-0'
          }`}
          onLoad={handleImageLoad}
          onError={handleImageError}
          onLoadStart={() => setImageLoadAttempted(true)}
          loading="lazy"
        />
      )}
      
      {/* Error state */}
      {hasError && (
        <div className="absolute inset-0 flex items-center justify-center bg-muted text-muted-foreground">
          <div className="text-center">
            <div className="text-2xl mb-2">⚠️</div>
            <div className="text-sm">Failed to load image</div>
          </div>
        </div>
      )}

      {/* Loading shimmer effect */}
      {!hasLoaded && !hasError && (
        <div className="absolute inset-0">
          <div className="absolute inset-0 -translate-x-full animate-[shimmer_2s_infinite] bg-gradient-to-r from-transparent via-white/20 to-transparent" />
        </div>
      )}
    </div>
  );
});

LazyImage.displayName = 'LazyImage';