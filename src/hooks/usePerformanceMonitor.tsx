import { useEffect, useCallback, useRef } from 'react';

interface PerformanceMetrics {
  renderTime: number;
  memoryUsage: number;
  timestamp: number;
}

export const usePerformanceMonitor = (componentName: string) => {
  const renderStartTime = useRef<number>(0);
  const metricsRef = useRef<PerformanceMetrics[]>([]);

  // Start measuring render time
  useEffect(() => {
    renderStartTime.current = performance.now();
  });

  // End measuring render time
  useEffect(() => {
    const renderTime = performance.now() - renderStartTime.current;
    
    // Get memory usage if available
    const memoryUsage = (performance as any).memory?.usedJSHeapSize || 0;
    
    const metrics: PerformanceMetrics = {
      renderTime,
      memoryUsage,
      timestamp: Date.now()
    };

    metricsRef.current.push(metrics);
    
    // Keep only last 10 measurements
    if (metricsRef.current.length > 10) {
      metricsRef.current = metricsRef.current.slice(-10);
    }

    // Log slow renders in development
    if (process.env.NODE_ENV === 'development' && renderTime > 100) {
      console.warn(`Slow render detected in ${componentName}: ${renderTime.toFixed(2)}ms`);
    }
  });

  const getAverageRenderTime = useCallback(() => {
    if (metricsRef.current.length === 0) return 0;
    
    const total = metricsRef.current.reduce((sum, metric) => sum + metric.renderTime, 0);
    return total / metricsRef.current.length;
  }, []);

  const getMemoryTrend = useCallback(() => {
    if (metricsRef.current.length < 2) return 'stable';
    
    const recent = metricsRef.current.slice(-5);
    const older = metricsRef.current.slice(-10, -5);
    
    const recentAvg = recent.reduce((sum, m) => sum + m.memoryUsage, 0) / recent.length;
    const olderAvg = older.reduce((sum, m) => sum + m.memoryUsage, 0) / older.length;
    
    const diff = recentAvg - olderAvg;
    
    if (diff > 1000000) return 'increasing'; // 1MB increase
    if (diff < -1000000) return 'decreasing'; // 1MB decrease
    return 'stable';
  }, []);

  return {
    getAverageRenderTime,
    getMemoryTrend,
    getCurrentMetrics: () => metricsRef.current[metricsRef.current.length - 1] || null
  };
};

// Performance monitoring HOC
export const withPerformanceMonitoring = <P extends object>(
  WrappedComponent: React.ComponentType<P>,
  componentName?: string
) => {
  const MonitoredComponent = (props: P) => {
    const name = componentName || WrappedComponent.displayName || WrappedComponent.name || 'Component';
    usePerformanceMonitor(name);
    
    return <WrappedComponent {...props} />;
  };

  MonitoredComponent.displayName = `withPerformanceMonitoring(${name})`;
  return MonitoredComponent;
};
