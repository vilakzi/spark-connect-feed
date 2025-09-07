import React, { useRef, useMemo, useCallback } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import { Button } from '@/components/ui/button';
import { RefreshCw, Plus, Settings } from 'lucide-react';
import { RealtimeFeedCard } from './RealtimeFeedCard';
import { PostComposer } from './PostComposer';
import { useRealtimeFeed } from '@/hooks/useRealtimeFeed';
import { Skeleton } from '@/components/ui/skeleton';
import { useState, useEffect } from 'react';

const ESTIMATED_ITEM_HEIGHT = 400;
const OVERSCAN = 5;

export const VirtualizedFeed = () => {
  const {
    posts,
    isLoading,
    isError,
    hasNextPage,
    isFetchingNextPage,
    likePost,
    sharePost,
    trackView,
    refreshFeed,
    prefetchNextPage,
    backgroundContentCount
  } = useRealtimeFeed();

  const [showComposer, setShowComposer] = useState(false);
  const [showPreferences, setShowPreferences] = useState(false);
  const parentRef = useRef<HTMLDivElement>(null);

  // Memoize items array for virtualizer
  const items = useMemo(() => {
    const allItems = [...posts];
    
    // Add loading item at the end if fetching next page
    if (isFetchingNextPage) {
      allItems.push({ 
        post_id: 'loading', 
        content: '',
        media_urls: [],
        media_types: [],
        thumbnails: [],
        user_display_name: '',
        user_avatar: '',
        like_count: 0,
        comment_count: 0,
        share_count: 0,
        view_count: 0,
        created_at: '',
        relevance_score: 0
      });
    }
    
    return allItems;
  }, [posts, isFetchingNextPage]);

  // Virtual scrolling setup
  const virtualizer = useVirtualizer({
    count: items.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => ESTIMATED_ITEM_HEIGHT,
    overscan: OVERSCAN,
    measureElement: (element) => element?.getBoundingClientRect().height ?? ESTIMATED_ITEM_HEIGHT,
  });

  const virtualItems = virtualizer.getVirtualItems();

  // Auto-fetch next page when approaching end
  useEffect(() => {
    const lastItem = virtualItems[virtualItems.length - 1];
    
    if (
      lastItem &&
      lastItem.index >= items.length - 1 - OVERSCAN &&
      hasNextPage &&
      !isFetchingNextPage
    ) {
      prefetchNextPage();
    }
  }, [virtualItems, items.length, hasNextPage, isFetchingNextPage, prefetchNextPage]);

  const handleRefresh = useCallback(() => {
    refreshFeed();
  }, [refreshFeed]);

  // Loading skeleton
  if (isLoading && posts.length === 0) {
    return (
      <div className="min-h-screen bg-background">
        <div className="max-w-md mx-auto">
          {/* Header Skeleton */}
          <div className="sticky top-0 z-40 bg-background/80 backdrop-blur-sm border-b border-border p-4">
            <div className="flex items-center justify-between">
              <Skeleton className="h-6 w-16" />
              <div className="flex gap-2">
                <Skeleton className="h-8 w-8" />
                <Skeleton className="h-8 w-16" />
              </div>
            </div>
          </div>
          
          {/* Content Skeletons */}
          <div className="p-4 space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="space-y-3 p-4 border rounded-lg">
                <div className="flex items-center gap-3">
                  <Skeleton className="w-10 h-10 rounded-full" />
                  <div className="space-y-1">
                    <Skeleton className="w-20 h-4" />
                    <Skeleton className="w-16 h-3" />
                  </div>
                </div>
                <Skeleton className="w-full h-60" />
                <div className="flex gap-4">
                  <Skeleton className="w-12 h-6" />
                  <Skeleton className="w-12 h-6" />
                  <Skeleton className="w-12 h-6" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (isError) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <h2 className="text-xl font-semibold">Failed to load feed</h2>
          <p className="text-muted-foreground">Please check your connection and try again</p>
          <Button onClick={handleRefresh}>Try Again</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-md mx-auto">
        {/* Enhanced Sticky Header with Live Updates */}
        <div className="sticky top-0 z-40 bg-background/90 backdrop-blur-md border-b border-border p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <h1 className="text-xl font-bold">Feed</h1>
              {backgroundContentCount > 0 && (
                <div className="flex items-center gap-1">
                  <div className="w-2 h-2 bg-accent rounded-full animate-pulse" />
                  <span className="text-xs text-muted-foreground">Live</span>
                </div>
              )}
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowPreferences(true)}
                className="hover:bg-secondary/80 transition-colors"
              >
                <Settings className="w-4 h-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleRefresh}
                disabled={isLoading}
                className="hover:bg-secondary/80 transition-colors"
              >
                <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
              </Button>
              <Button
                size="sm"
                onClick={() => setShowComposer(true)}
                className="gap-2 bg-gradient-to-r from-primary to-accent hover:opacity-90 transition-opacity"
              >
                <Plus className="w-4 h-4" />
                Post
              </Button>
            </div>
          </div>
        </div>

        {/* Virtual Scrolling Container */}
        <div
          ref={parentRef}
          className="h-[calc(100vh-80px)] overflow-auto"
          style={{
            contain: 'strict',
          }}
        >
          {items.length === 0 ? (
            <div className="text-center py-12 px-4">
              <p className="text-muted-foreground mb-4">No posts yet</p>
              <Button onClick={() => setShowComposer(true)}>
                Create your first post
              </Button>
            </div>
          ) : (
            <div
              style={{
                height: virtualizer.getTotalSize(),
                width: '100%',
                position: 'relative',
              }}
            >
              {virtualItems.map((virtualItem) => {
                const item = items[virtualItem.index];
                const isLoaderRow = item.post_id === 'loading';

                return (
                  <div
                    key={virtualItem.key}
                    data-index={virtualItem.index}
                    ref={virtualizer.measureElement}
                    style={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      width: '100%',
                      transform: `translateY(${virtualItem.start}px)`,
                    }}
                  >
                    {isLoaderRow ? (
                      <div className="flex justify-center py-8">
                        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                      </div>
                    ) : (
                      <RealtimeFeedCard
                        post={item}
            onLike={() => likePost(item.post_id)}
            onShare={() => sharePost(item.post_id)}
            onView={() => trackView(item.post_id)}
                        isLast={virtualItem.index === items.length - 1}
                      />
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Post Composer */}
        <PostComposer
          open={showComposer}
          onOpenChange={setShowComposer}
          onPostCreated={handleRefresh}
        />
      </div>
    </div>
  );
};