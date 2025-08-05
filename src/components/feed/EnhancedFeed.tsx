import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Plus, RefreshCw } from 'lucide-react';
import { EnhancedFeedCard } from './EnhancedFeedCard';
import { PostComposer } from './PostComposer';
import { useEnhancedFeed } from '@/hooks/useEnhancedFeed';
import { Skeleton } from '@/components/ui/skeleton';

export const EnhancedFeed = () => {
  const { posts, loading, refreshFeed, hasMore, lastPostRef } = useEnhancedFeed();
  const [showComposer, setShowComposer] = useState(false);

  if (loading && posts.length === 0) {
    return (
      <div className="min-h-screen bg-background p-4">
        <div className="max-w-md mx-auto space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="space-y-3">
              <div className="flex items-center gap-3 p-4">
                <Skeleton className="w-10 h-10 rounded-full" />
                <div className="space-y-1">
                  <Skeleton className="w-20 h-4" />
                  <Skeleton className="w-16 h-3" />
                </div>
              </div>
              <Skeleton className="w-full h-80" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-md mx-auto">
        {/* Header */}
        <div className="sticky top-0 z-40 bg-background/80 backdrop-blur-sm border-b border-border p-4">
          <div className="flex items-center justify-between">
            <h1 className="text-xl font-bold">Feed</h1>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={refreshFeed}
                disabled={loading}
              >
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              </Button>
              <Button
                size="sm"
                onClick={() => setShowComposer(true)}
                className="gap-2"
              >
                <Plus className="w-4 h-4" />
                Post
              </Button>
            </div>
          </div>
        </div>

        {/* Feed */}
        <div className="p-4">
          {posts.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground mb-4">No posts yet</p>
              <Button onClick={() => setShowComposer(true)}>
                Create your first post
              </Button>
            </div>
          ) : (
            <>
              {posts.map((post, index) => (
                <EnhancedFeedCard
                  key={post.post_id}
                  post={post}
                  isLast={index === posts.length - 1}
                />
              ))}
              
              {/* Loading indicator for infinite scroll */}
              {loading && posts.length > 0 && (
                <div className="flex justify-center py-4">
                  <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                </div>
              )}
              
              {/* End of feed indicator */}
              {!hasMore && posts.length > 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  <p>You've reached the end!</p>
                </div>
              )}
              
              {/* Last post ref for infinite scroll */}
              <div ref={lastPostRef} className="h-4" />
            </>
          )}
        </div>

        {/* Post Composer */}
        <PostComposer
          open={showComposer}
          onOpenChange={setShowComposer}
          onPostCreated={refreshFeed}
        />
      </div>
    </div>
  );
};