import { trackAPICall } from '@/lib/performanceAnalytics';
import { logWarn, logDebug } from '@/lib/secureLogger';

// Image optimization utilities
export const optimizeImageLoading = () => {
  // Add loading="lazy" to all images
  const images = document.querySelectorAll('img:not([loading])');
  images.forEach(img => {
    img.setAttribute('loading', 'lazy');
  });

  // Add intersection observer for critical images
  const criticalImages = document.querySelectorAll('img[data-critical="true"]');
  if (criticalImages.length > 0 && 'IntersectionObserver' in window) {
    const imageObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const img = entry.target as HTMLImageElement;
          if (img.dataset.src) {
            img.src = img.dataset.src;
            img.removeAttribute('data-src');
          }
          imageObserver.unobserve(img);
        }
      });
    }, {
      rootMargin: '50px 0px'
    });

    criticalImages.forEach(img => imageObserver.observe(img));
  }
};

// API call optimization wrapper
export const optimizedFetch = async (
  url: string,
  options: RequestInit = {},
  timeout: number = 10000
): Promise<Response> => {
  const startTime = performance.now();
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    });

    const duration = performance.now() - startTime;
    trackAPICall(url, duration, response.ok, {
      status: response.status,
      method: options.method || 'GET'
    });

    return response;
  } catch (error) {
    const duration = performance.now() - startTime;
    trackAPICall(url, duration, false, {
      error: (error as Error).message,
      method: options.method || 'GET'
    });
    throw error;
  } finally {
    clearTimeout(timeoutId);
  }
};

// Memory leak detection
export const detectMemoryLeaks = () => {
  if ('memory' in performance) {
    const memory = (performance as any).memory;
    const threshold = 50 * 1024 * 1024; // 50MB

    if (memory.usedJSHeapSize > threshold) {
      logWarn('Potential memory leak detected', {
        usedJSHeapSize: memory.usedJSHeapSize,
        totalJSHeapSize: memory.totalJSHeapSize,
        threshold
      }, 'PerformanceOptimizations');
    }
  }
};

// Optimize scroll performance
export const optimizeScrolling = () => {
  let scrollTimeout: NodeJS.Timeout;

  const handleScroll = () => {
    document.body.classList.add('scrolling');
    
    clearTimeout(scrollTimeout);
    scrollTimeout = setTimeout(() => {
      document.body.classList.remove('scrolling');
    }, 150);
  };

  window.addEventListener('scroll', handleScroll, { passive: true });
  
  return () => {
    window.removeEventListener('scroll', handleScroll);
    clearTimeout(scrollTimeout);
  };
};

// Bundle size analyzer
export const analyzeBundleSize = () => {
  const scripts = document.querySelectorAll('script[src]');
  const styles = document.querySelectorAll('link[rel="stylesheet"]');
  
  logDebug('Bundle analysis', {
    scriptCount: scripts.length,
    styleCount: styles.length,
    totalElements: scripts.length + styles.length
  }, 'PerformanceOptimizations');
};

// Setup all performance optimizations
export const setupPerformanceOptimizations = () => {
  // Run optimizations when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      optimizeImageLoading();
      analyzeBundleSize();
      detectMemoryLeaks();
    });
  } else {
    optimizeImageLoading();
    analyzeBundleSize();
    detectMemoryLeaks();
  }

  // Setup scroll optimization
  const cleanup = optimizeScrolling();

  // Periodic memory monitoring
  const memoryInterval = setInterval(detectMemoryLeaks, 30000); // Check every 30s

  // Return cleanup function
  return () => {
    cleanup();
    clearInterval(memoryInterval);
  };
};

// Component render optimization helpers
export const shouldComponentUpdate = (prevProps: any, nextProps: any): boolean => {
  // Shallow comparison optimization
  const prevKeys = Object.keys(prevProps);
  const nextKeys = Object.keys(nextProps);

  if (prevKeys.length !== nextKeys.length) {
    return true;
  }

  for (let key of prevKeys) {
    if (prevProps[key] !== nextProps[key]) {
      return true;
    }
  }

  return false;
};

// Debounce utility for performance-critical operations
export const createPerformanceDebounce = <T extends (...args: any[]) => any>(
  func: T,
  wait: number,
  immediate = false
): ((...args: Parameters<T>) => void) => {
  let timeout: NodeJS.Timeout | null = null;

  return (...args: Parameters<T>) => {
    const later = () => {
      timeout = null;
      if (!immediate) func(...args);
    };

    const callNow = immediate && !timeout;
    if (timeout) clearTimeout(timeout);
    timeout = setTimeout(later, wait);

    if (callNow) func(...args);
  };
};