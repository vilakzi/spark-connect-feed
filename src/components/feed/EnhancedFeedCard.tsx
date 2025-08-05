import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { 
  Heart, 
  MessageCircle, 
  Share, 
  Eye, 
  Play, 
  Pause,
  Maximize2,
  X,
  MoreHorizontal,
  Bookmark,
  Flag,
  Volume2,
  VolumeX
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { useEnhancedFeed } from '@/hooks/useEnhancedFeed';

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

interface EnhancedFeedCardProps {
  post: FeedPost;
  isLast?: boolean;
}

export const EnhancedFeedCard: React.FC<EnhancedFeedCardProps> = ({ 
  post, 
  isLast = false 
}) => {
  const { likePost, sharePost, setupViewTracking, lastPostRef } = useEnhancedFeed();
  const [isLiked, setIsLiked] = useState(false);
  const [currentMediaIndex, setCurrentMediaIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showPlayButton, setShowPlayButton] = useState(true);
  
  const cardRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const fullscreenVideoRef = useRef<HTMLVideoElement>(null);

  // Setup view tracking
  useEffect(() => {
    if (cardRef.current) {
      const cleanup = setupViewTracking(cardRef.current, post.post_id);
      return cleanup;
    }
  }, [setupViewTracking, post.post_id]);

  // Video autoplay with intersection observer - debounced to prevent conflicts
  useEffect(() => {
    const currentVideo = videoRef.current;
    if (!currentVideo || !post.media_types[currentMediaIndex]?.startsWith('video/')) return;

    let playTimeout: NodeJS.Timeout;
    let pauseTimeout: NodeJS.Timeout;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          // Clear any pending timeouts
          clearTimeout(playTimeout);
          clearTimeout(pauseTimeout);

          if (entry.isIntersecting && entry.intersectionRatio > 0.7) {
            // Debounced auto-play when 70% visible
            playTimeout = setTimeout(() => {
              if (currentVideo && !currentVideo.paused) return; // Already playing
              currentVideo.play()
                .then(() => {
                  setIsPlaying(true);
                  setShowPlayButton(false);
                })
                .catch(() => {
                  setShowPlayButton(true);
                });
            }, 300);
          } else if (entry.intersectionRatio < 0.3) {
            // Debounced pause when less than 30% visible
            pauseTimeout = setTimeout(() => {
              if (currentVideo && currentVideo.paused) return; // Already paused
              currentVideo.pause();
              setIsPlaying(false);
              setShowPlayButton(true);
            }, 300);
          }
        });
      },
      { threshold: [0.3, 0.7] }
    );

    observer.observe(currentVideo);
    return () => {
      observer.disconnect();
      clearTimeout(playTimeout);
      clearTimeout(pauseTimeout);
    };
  }, [currentMediaIndex, post.media_types]);

  const togglePlay = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;

    if (isPlaying) {
      video.pause();
      setIsPlaying(false);
      setShowPlayButton(true);
    } else {
      video.play()
        .then(() => {
          setIsPlaying(true);
          setShowPlayButton(false);
        })
        .catch(() => {
          setShowPlayButton(true);
        });
    }
  }, [isPlaying]);

  const toggleMute = useCallback(() => {
    const video = videoRef.current;
    if (video) {
      video.muted = !video.muted;
      setIsMuted(video.muted);
    }
  }, []);

  const handleLike = useCallback(async () => {
    if (!isLiked) {
      setIsLiked(true);
      await likePost(post.post_id);
    }
  }, [isLiked, likePost, post.post_id]);

  const handleShare = useCallback(() => {
    sharePost(post);
  }, [sharePost, post]);

  const handleDoubleClick = useCallback((e: React.MouseEvent) => {
    // Double tap to like (mobile-friendly)
    if (!isLiked) {
      handleLike();
      
      // Add heart animation at click position
      const rect = e.currentTarget.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      
      // Create floating heart animation
      const heart = document.createElement('div');
      heart.innerHTML = '❤️';
      heart.style.position = 'absolute';
      heart.style.left = `${x}px`;
      heart.style.top = `${y}px`;
      heart.style.fontSize = '24px';
      heart.style.pointerEvents = 'none';
      heart.style.animation = 'float-heart 1s ease-out forwards';
      heart.style.zIndex = '1000';
      
      e.currentTarget.appendChild(heart);
      setTimeout(() => heart.remove(), 1000);
    }
  }, [isLiked, handleLike]);

  const nextMedia = useCallback(() => {
    if (currentMediaIndex < post.media_urls.length - 1) {
      setCurrentMediaIndex(prev => prev + 1);
    }
  }, [currentMediaIndex, post.media_urls.length]);

  const prevMedia = useCallback(() => {
    if (currentMediaIndex > 0) {
      setCurrentMediaIndex(prev => prev - 1);
    }
  }, [currentMediaIndex]);

  const openFullscreen = useCallback(() => {
    setIsFullscreen(true);
    // Sync fullscreen video with current video time
    if (fullscreenVideoRef.current && videoRef.current) {
      fullscreenVideoRef.current.currentTime = videoRef.current.currentTime;
      fullscreenVideoRef.current.muted = videoRef.current.muted;
    }
  }, []);

  const closeFullscreen = useCallback(() => {
    setIsFullscreen(false);
    // Sync current video with fullscreen video time
    if (fullscreenVideoRef.current && videoRef.current) {
      videoRef.current.currentTime = fullscreenVideoRef.current.currentTime;
    }
  }, []);

  const currentMedia = post.media_urls[currentMediaIndex];
  const currentMediaType = post.media_types[currentMediaIndex];
  const isVideo = currentMediaType?.startsWith('video/');

  return (
    <>
      <Card 
        ref={isLast ? lastPostRef : cardRef}
        className="w-full overflow-hidden shadow-lg hover:shadow-xl transition-all duration-300 mb-6 border-0"
      >
        <CardContent className="p-0">
          {/* Header */}
          <div className="flex items-center justify-between p-4">
            <div className="flex items-center gap-3">
              <Avatar className="w-10 h-10">
                <AvatarImage src={post.user_avatar} />
                <AvatarFallback>
                  {post.user_display_name?.charAt(0)?.toUpperCase() || 'U'}
                </AvatarFallback>
              </Avatar>
              <div>
                <h4 className="font-semibold text-sm">{post.user_display_name}</h4>
                <p className="text-xs text-muted-foreground">
                  {formatDistanceToNow(new Date(post.created_at), { addSuffix: true })}
                </p>
              </div>
            </div>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                  <MoreHorizontal className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem>
                  <Bookmark className="w-4 h-4 mr-2" />
                  Save Post
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <Flag className="w-4 h-4 mr-2" />
                  Report
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Content */}
          {post.content && (
            <div className="px-4 pb-3">
              <p className="text-sm leading-relaxed">{post.content}</p>
            </div>
          )}

          {/* Media */}
          {currentMedia && (
            <div 
              className="relative w-full bg-card"
              style={{
                aspectRatio: '1/1'
              }}
              onDoubleClick={handleDoubleClick}
              onClick={isVideo ? openFullscreen : undefined}
            >
              {isVideo ? (
                <video
                  ref={videoRef}
                  src={currentMedia}
                  className="w-full h-full object-cover"
                  loop
                  muted={isMuted}
                  playsInline
                  onClick={togglePlay}
                  onLoadStart={() => setShowPlayButton(true)}
                  onCanPlay={() => console.log('Video ready to play')}
                  onError={(e) => {
                    console.error('Video error:', e);
                    setShowPlayButton(true);
                  }}
                />
              ) : (
                <img
                  src={currentMedia}
                  alt="Post content"
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    console.error('Image failed to load:', e);
                    e.currentTarget.style.display = 'none';
                  }}
                />
              )}

              {/* Media Controls */}
              {isVideo && (
                <>
                  {showPlayButton && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                      <Button
                        variant="secondary"
                        size="lg"
                        className="rounded-full w-16 h-16"
                        onClick={togglePlay}
                      >
                        <Play className="w-8 h-8" />
                      </Button>
                    </div>
                  )}

                  <div className="absolute top-4 right-4 flex gap-2">
                    <Button
                      variant="secondary"
                      size="sm"
                      className="h-8 w-8 p-0 rounded-full"
                      onClick={toggleMute}
                    >
                      {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                    </Button>
                    <Button
                      variant="secondary"
                      size="sm"
                      className="h-8 w-8 p-0 rounded-full"
                      onClick={openFullscreen}
                    >
                      <Maximize2 className="w-4 h-4" />
                    </Button>
                  </div>
                </>
              )}

              {/* Media Navigation */}
              {post.media_urls.length > 1 && (
                <>
                  <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex gap-1">
                    {post.media_urls.map((_, index) => (
                      <div
                        key={index}
                        className={`w-2 h-2 rounded-full transition-colors ${
                          index === currentMediaIndex ? 'bg-white' : 'bg-white/50'
                        }`}
                      />
                    ))}
                  </div>

                  {currentMediaIndex > 0 && (
                    <Button
                      variant="secondary"
                      size="sm"
                      className="absolute left-2 top-1/2 transform -translate-y-1/2 rounded-full h-8 w-8 p-0"
                      onClick={prevMedia}
                    >
                      ←
                    </Button>
                  )}

                  {currentMediaIndex < post.media_urls.length - 1 && (
                    <Button
                      variant="secondary"
                      size="sm"
                      className="absolute right-2 top-1/2 transform -translate-y-1/2 rounded-full h-8 w-8 p-0"
                      onClick={nextMedia}
                    >
                      →
                    </Button>
                  )}
                </>
              )}
            </div>
          )}

          {/* Actions */}
          <div className="p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleLike}
                  className={`gap-2 h-8 px-2 ${isLiked ? 'text-red-500' : ''}`}
                >
                  <Heart className={`w-5 h-5 ${isLiked ? 'fill-current' : ''}`} />
                  {post.like_count + (isLiked ? 1 : 0)}
                </Button>

                <Button variant="ghost" size="sm" className="gap-2 h-8 px-2">
                  <MessageCircle className="w-5 h-5" />
                  {post.comment_count}
                </Button>

                <Button variant="ghost" size="sm" onClick={handleShare} className="gap-2 h-8 px-2">
                  <Share className="w-5 h-5" />
                  {post.share_count}
                </Button>
              </div>

              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <Eye className="w-4 h-4" />
                1.2K views
              </div>
            </div>

            {/* Relevance Score (for testing) */}
            {process.env.NODE_ENV === 'development' && (
              <Badge variant="outline" className="text-xs">
                Score: {post.relevance_score.toFixed(2)}
              </Badge>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Fullscreen Video Modal */}
      {isFullscreen && isVideo && (
        <Dialog open={isFullscreen} onOpenChange={closeFullscreen}>
          <DialogContent className="max-w-[100vw] max-h-[100vh] p-0 bg-black border-0">
            <div className="relative w-screen h-screen flex items-center justify-center">
              <video
                ref={fullscreenVideoRef}
                src={currentMedia}
                className="w-full h-full object-contain"
                controls
                autoPlay
                loop
                muted={isMuted}
                onError={(e) => {
                  console.error('Fullscreen video error:', e);
                  closeFullscreen();
                }}
              />
              <Button
                variant="ghost"
                size="lg"
                onClick={closeFullscreen}
                className="absolute top-4 right-4 text-white hover:bg-white/20 z-50"
              >
                <X className="w-8 h-8" />
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Floating heart animation styles */}
      <style>{`
        @keyframes float-heart {
          0% {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
          100% {
            opacity: 0;
            transform: translateY(-50px) scale(1.5);
          }
        }
      `}</style>
    </>
  );
};