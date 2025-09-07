import { SimpleFeed } from '@/components/feed/SimpleFeed';
import { ErrorBoundary } from '@/components/ErrorBoundary';

// Temporary fallback component for feed while fixing TypeScript issues
export const TempFeedFallback = () => {
  return (
    <ErrorBoundary fallback={
      <div className="text-center py-8">
        <h2 className="text-xl font-semibold mb-2">Feed Temporarily Unavailable</h2>
        <p className="text-muted-foreground">We're working on improvements</p>
      </div>
    }>
      <SimpleFeed />
    </ErrorBoundary>
  );
};