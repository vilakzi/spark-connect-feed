import { Suspense, lazy, ComponentType, ReactElement } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent } from '@/components/ui/card';
import { logDebug } from '@/lib/secureLogger';
import { trackComponentRender } from '@/lib/performanceAnalytics';

interface LazyComponentWrapperProps {
  factory: () => Promise<{ default: ComponentType<any> }>;
  fallback?: ReactElement;
  componentName: string;
  props?: any;
  skeletonHeight?: number;
}

// Default skeleton fallback
const DefaultSkeleton = ({ height = 200 }: { height?: number }) => (
  <Card className="w-full">
    <CardContent className="p-6">
      <div className="flex items-center space-x-4 mb-4">
        <Skeleton className="h-12 w-12 rounded-full" />
        <div className="space-y-2">
          <Skeleton className="h-4 w-[200px]" />
          <Skeleton className="h-4 w-[150px]" />
        </div>
      </div>
      <Skeleton className={`h-[${height}px] w-full`} />
      <div className="flex justify-between mt-4">
        <Skeleton className="h-8 w-[100px]" />
        <Skeleton className="h-8 w-[80px]" />
      </div>
    </CardContent>
  </Card>
);

export const LazyComponentWrapper = ({
  factory,
  fallback,
  componentName,
  props = {},
  skeletonHeight = 200
}: LazyComponentWrapperProps) => {
  // Create lazy component with performance tracking
  const LazyComponent = lazy(() => {
    const startTime = performance.now();
    
    return factory().then((module) => {
      const loadTime = performance.now() - startTime;
      
      trackComponentRender(`LazyLoad_${componentName}`, loadTime, {
        type: 'lazy-load',
        loadTime
      });
      
      logDebug('Lazy component loaded', {
        component: componentName,
        loadTime: `${loadTime.toFixed(2)}ms`
      }, 'LazyComponentWrapper');
      
      return module;
    }).catch((error) => {
      logDebug('Lazy component load failed', {
        component: componentName,
        error: error.message
      }, 'LazyComponentWrapper');
      
      // Return error component
      return {
        default: () => (
          <div className="flex items-center justify-center p-8 text-center">
            <div>
              <p className="text-muted-foreground mb-2">Failed to load component</p>
              <p className="text-sm text-red-500">{componentName}</p>
            </div>
          </div>
        )
      };
    });
  });

  return (
    <Suspense
      fallback={
        fallback || <DefaultSkeleton height={skeletonHeight} />
      }
    >
      <LazyComponent {...props} />
    </Suspense>
  );
};

// Hook for creating lazy components with performance tracking
export const createLazyComponent = (
  factory: () => Promise<{ default: ComponentType<any> }>,
  componentName: string
) => {
  return (props: any) => (
    <LazyComponentWrapper
      factory={factory}
      componentName={componentName}
      props={props}
    />
  );
};

// Preload function for critical components
export const preloadComponent = async (
  factory: () => Promise<{ default: ComponentType<any> }>,
  componentName: string
) => {
  try {
    const startTime = performance.now();
    await factory();
    const loadTime = performance.now() - startTime;
    
    logDebug('Component preloaded', {
      component: componentName,
      loadTime: `${loadTime.toFixed(2)}ms`
    }, 'LazyComponentWrapper');
  } catch (error) {
    logDebug('Component preload failed', {
      component: componentName,
      error: (error as Error).message
    }, 'LazyComponentWrapper');
  }
};