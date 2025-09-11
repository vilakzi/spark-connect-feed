import { useEffect, useRef, useCallback } from 'react';
import { usePerformanceMonitor } from '@/hooks/usePerformanceMonitor';
import { trackComponentRender } from '@/lib/performanceAnalytics';
import { logDebug } from '@/lib/secureLogger';

interface EnhancedPerformanceOptions {
  trackMemory?: boolean;
  trackInteractions?: boolean;
  sampleRate?: number; // 0-1, percentage of renders to track
  slowThreshold?: number; // ms
}

export const useEnhancedPerformanceMonitor = (
  componentName: string, 
  options: EnhancedPerformanceOptions = {}
) => {
  const {
    trackMemory = true,
    trackInteractions = false,
    sampleRate = 1,
    slowThreshold = 100
  } = options;

  const { getAverageRenderTime, getMemoryTrend, getCurrentMetrics } = usePerformanceMonitor(componentName);
  const interactionCount = useRef(0);
  const lastReportTime = useRef(Date.now());
  
  // Sample-based tracking to reduce overhead
  const shouldTrack = useRef(Math.random() < sampleRate);

  useEffect(() => {
    if (!shouldTrack.current) return;

    const metrics = getCurrentMetrics();
    if (metrics) {
      trackComponentRender(componentName, metrics.renderTime, {
        memoryUsage: metrics.memoryUsage,
        timestamp: metrics.timestamp
      });

      // Log slow renders
      if (metrics.renderTime > slowThreshold) {
        logDebug('Slow render detected', {
          component: componentName,
          renderTime: metrics.renderTime,
          memoryUsage: metrics.memoryUsage,
          averageRenderTime: getAverageRenderTime()
        }, 'EnhancedPerformanceMonitor');
      }
    }
  });

  // Track user interactions if enabled
  const trackInteraction = useCallback((interactionType: string) => {
    if (!trackInteractions) return;
    
    interactionCount.current++;
    logDebug('User interaction tracked', {
      component: componentName,
      interactionType,
      totalInteractions: interactionCount.current
    }, 'EnhancedPerformanceMonitor');
  }, [componentName, trackInteractions]);

  // Periodic performance report
  useEffect(() => {
    if (!shouldTrack.current) return;

    const interval = setInterval(() => {
      const now = Date.now();
      if (now - lastReportTime.current > 30000) { // Report every 30 seconds
        const avgRenderTime = getAverageRenderTime();
        const memoryTrend = getMemoryTrend();
        
        logDebug('Performance report', {
          component: componentName,
          averageRenderTime: avgRenderTime,
          memoryTrend,
          totalInteractions: interactionCount.current,
          reportInterval: '30s'
        }, 'EnhancedPerformanceMonitor');

        lastReportTime.current = now;
      }
    }, 5000); // Check every 5 seconds

    return () => clearInterval(interval);
  }, [componentName, getAverageRenderTime, getMemoryTrend]);

  return {
    trackInteraction,
    getMetrics: () => ({
      averageRenderTime: getAverageRenderTime(),
      memoryTrend: getMemoryTrend(),
      interactionCount: interactionCount.current,
      currentMetrics: getCurrentMetrics()
    })
  };
};