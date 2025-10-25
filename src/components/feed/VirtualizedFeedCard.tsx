import React, { memo, useCallback, useRef, useEffect } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Heart, MessageCircle, Share, MoreHorizontal } from 'lucide-react';
import { LazyImage } from '@/components/ui/lazy-image';
import { useInView } from 'react-intersection-observer';

interface FeedPost {
  post_id: string;
  content: string;
  media_urls: string[];
  media_types: string[];
  thumbnails: string[];
  user_display_name: string;
  user_avatar: string;
  like_count: number;
  comment_count: number;
  share_count: number;
  created_at: string;
  relevance_score: number;
}

interface VirtualizedFeedCardProps {
  post: FeedPost;
  onLike: (postId: string) => void;
  onShare: (post: FeedPost) => void;
  onView: (postId: string) => void;
  style?: React.CSSProperties;
}

export const VirtualizedFeedCard = memo(({
  post,
  onLike,
  onShare,
  onView,
  style
}: VirtualizedFeedCardProps) => {
  const viewTimeoutRef = useRef<NodeJS.Timeout>();
  
  const { ref, inView } = useInView({
    threshold: 0.5,
    onChange: (inView) => {
      if (inView) {
        // Start view timer when post is 50% visible
        viewTimeoutRef.current = setTimeout(() => {
          onView(post.post_id);
        }, 3000);
      } else {
        // Clear timer when post leaves view
        if (viewTimeoutRef.current) {
          clearTimeout(viewTimeoutRef.current);
        }
      }
    }
  });

  useEffect(() => {
    return () => {
      if (viewTimeoutRef.current) {
        clearTimeout(viewTimeoutRef.current);
      }
    };
  }, []);

  const handleLike = useCallback(() => {
    onLike(post.post_id);
  }, [onLike, post.post_id]);

  const handleShare = useCallback(() => {
    onShare(post);
  }, [onShare, post]);

  const getPlaceholderType = (index: number) => {
    const placeholders = [
      'photo-1649972904349-6e44c42644a7',
      'photo-1488590528505-98d2b5aba04b',
      'photo-1518770660439-4636190af475',
      'photo-1461749280684-dccba630e2f6',
      'photo-1486312338219-ce68d2c6f44d'
    ] as const;
    return placeholders[index % placeholders.length];
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  return (
    <div ref={ref} style={style} className="p-2">
      <Card className="overflow-hidden border-none shadow-sm">
        <CardContent className="p-0">
          {/* Header */}
          <div className="flex items-center justify-between p-4 pb-3">
            <div className="flex items-center gap-3">
              <Avatar className="w-10 h-10">
                <AvatarImage src={post.user_avatar} />
                <AvatarFallback>
                  {post.user_display_name?.charAt(0)?.toUpperCase() || 'A'}
                </AvatarFallback>
              </Avatar>
              <div>
                <h3 className="font-semibold text-sm">
                  {post.user_display_name || 'Anonymous'}
                </h3>
                <p className="text-xs text-muted-foreground">
                  {formatDate(post.created_at)}
                </p>
              </div>
            </div>
            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </div>

          {/* Content */}
          {post.content && (
            <div className="px-4 pb-3">
              <p className="text-sm leading-relaxed">{post.content}</p>
            </div>
          )}

          {/* Media */}
          {post.media_urls && post.media_urls.length > 0 && (
            <div className="relative">
              {post.media_urls.length === 1 ? (
                <LazyImage
                  src={post.media_urls[0]}
                  alt="Post media"
                  className="w-full aspect-square"
                  placeholderType={getPlaceholderType(0)}
                />
              ) : (
                <div className="grid grid-cols-2 gap-1">
                  {post.media_urls.slice(0, 4).map((url, index) => (
                    <div key={index} className="relative">
                      <LazyImage
                        src={url}
                        alt={`Post media ${index + 1}`}
                        className="w-full aspect-square"
                        placeholderType={getPlaceholderType(index)}
                      />
                      {index === 3 && post.media_urls.length > 4 && (
                        <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                          <span className="text-white font-semibold">
                            +{post.media_urls.length - 4}
                          </span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center justify-between p-4 pt-3">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleLike}
                className="h-8 p-0 hover:text-red-500 transition-colors"
              >
                <Heart className="h-5 w-5 mr-1" />
                <span className="text-sm">{post.like_count}</span>
              </Button>
              
              <Button
                variant="ghost"
                size="sm"
                className="h-8 p-0 hover:text-blue-500 transition-colors"
              >
                <MessageCircle className="h-5 w-5 mr-1" />
                <span className="text-sm">{post.comment_count}</span>
              </Button>
              
              <Button
                variant="ghost"
                size="sm"
                onClick={handleShare}
                className="h-8 p-0 hover:text-green-500 transition-colors"
              >
                <Share className="h-5 w-5 mr-1" />
                <span className="text-sm">{post.share_count}</span>
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
});

VirtualizedFeedCard.displayName = 'VirtualizedFeedCard';