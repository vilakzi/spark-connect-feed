import { logInfo, logWarn } from '@/lib/secureLogger';

interface PerformanceEntry {
  name: string;
  duration: number;
  startTime: number;
  type: 'component' | 'navigation' | 'api' | 'render';
  metadata?: Record<string, any>;
}

interface PerformanceMetrics {
  renderTime: number;
  memoryUsage: number;
  componentCount: number;
  timestamp: number;
}

class PerformanceAnalytics {
  private entries: PerformanceEntry[] = [];
  private thresholds = {
    slowRender: 100, // ms
    slowNavigation: 300, // ms
    slowAPI: 1000, // ms
    memoryLeakThreshold: 50 * 1024 * 1024, // 50MB
  };

  // Track component render performance
  trackRender(componentName: string, duration: number, metadata?: Record<string, any>) {
    const entry: PerformanceEntry = {
      name: componentName,
      duration,
      startTime: performance.now(),
      type: 'component',
      metadata
    };

    this.entries.push(entry);
    
    if (duration > this.thresholds.slowRender) {
      logWarn('Slow component render detected', {
        component: componentName,
        duration,
        threshold: this.thresholds.slowRender,
        ...metadata
      }, 'PerformanceAnalytics');
    }

    // Clean up old entries (keep last 100)
    if (this.entries.length > 100) {
      this.entries = this.entries.slice(-100);
    }
  }

  // Track navigation performance
  trackNavigation(from: string, to: string, duration: number) {
    const entry: PerformanceEntry = {
      name: `${from} -> ${to}`,
      duration,
      startTime: performance.now(),
      type: 'navigation',
      metadata: { from, to }
    };

    this.entries.push(entry);

    if (duration > this.thresholds.slowNavigation) {
      logWarn('Slow navigation detected', {
        from,
        to,
        duration,
        threshold: this.thresholds.slowNavigation
      }, 'PerformanceAnalytics');
    }
  }

  // Track API call performance
  trackAPI(endpoint: string, duration: number, success: boolean, metadata?: Record<string, any>) {
    const entry: PerformanceEntry = {
      name: endpoint,
      duration,
      startTime: performance.now(),
      type: 'api',
      metadata: { success, ...metadata }
    };

    this.entries.push(entry);

    if (duration > this.thresholds.slowAPI) {
      logWarn('Slow API call detected', {
        endpoint,
        duration,
        success,
        threshold: this.thresholds.slowAPI,
        ...metadata
      }, 'PerformanceAnalytics');
    }
  }

  // Track memory usage
  trackMemory() {
    if ('memory' in performance && performance.memory) {
      const memory = performance.memory as any;
      const usage = memory.usedJSHeapSize;
      
      if (usage > this.thresholds.memoryLeakThreshold) {
        logWarn('High memory usage detected', {
          usedJSHeapSize: usage,
          totalJSHeapSize: memory.totalJSHeapSize,
          jsHeapSizeLimit: memory.jsHeapSizeLimit,
          threshold: this.thresholds.memoryLeakThreshold
        }, 'PerformanceAnalytics');
      }

      return {
        used: usage,
        total: memory.totalJSHeapSize,
        limit: memory.jsHeapSizeLimit
      };
    }
    return null;
  }

  // Get performance summary
  getPerformanceSummary() {
    const componentRenders = this.entries.filter(e => e.type === 'component');
    const navigations = this.entries.filter(e => e.type === 'navigation');
    const apiCalls = this.entries.filter(e => e.type === 'api');

    return {
      totalEntries: this.entries.length,
      averageRenderTime: componentRenders.length > 0 
        ? componentRenders.reduce((sum, e) => sum + e.duration, 0) / componentRenders.length 
        : 0,
      averageNavigationTime: navigations.length > 0
        ? navigations.reduce((sum, e) => sum + e.duration, 0) / navigations.length
        : 0,
      averageAPITime: apiCalls.length > 0
        ? apiCalls.reduce((sum, e) => sum + e.duration, 0) / apiCalls.length
        : 0,
      slowRenders: componentRenders.filter(e => e.duration > this.thresholds.slowRender).length,
      slowNavigations: navigations.filter(e => e.duration > this.thresholds.slowNavigation).length,
      slowAPICalls: apiCalls.filter(e => e.duration > this.thresholds.slowAPI).length,
      memory: this.trackMemory()
    };
  }

  // Get entries by type
  getEntriesByType(type: PerformanceEntry['type']) {
    return this.entries.filter(e => e.type === type);
  }

  // Clear all entries
  clear() {
    this.entries = [];
  }

  // Log performance summary
  logSummary() {
    const summary = this.getPerformanceSummary();
    logInfo('Performance Summary', summary, 'PerformanceAnalytics');
  }
}

// Export singleton instance
export const performanceAnalytics = new PerformanceAnalytics();

// Utility functions for easier usage
export const trackComponentRender = (name: string, duration: number, metadata?: Record<string, any>) => {
  performanceAnalytics.trackRender(name, duration, metadata);
};

export const trackPageNavigation = (from: string, to: string, duration: number) => {
  performanceAnalytics.trackNavigation(from, to, duration);
};

export const trackAPICall = (endpoint: string, duration: number, success: boolean, metadata?: Record<string, any>) => {
  performanceAnalytics.trackAPI(endpoint, duration, success, metadata);
};

export const getPerformanceMetrics = () => {
  return performanceAnalytics.getPerformanceSummary();
};
