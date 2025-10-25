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
  VolumeX,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
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

interface RealtimeFeedCardProps {
  post: FeedPost;
  onLike: (postId: string) => void;
  onShare: (post: FeedPost) => void;
  onView: (postId: string, duration?: number) => void;
  isLast?: boolean;
}

export const RealtimeFeedCard: React.FC<RealtimeFeedCardProps> = ({ 
  post, 
  onLike,
  onShare,
  onView,
  isLast = false 
}) => {
  const [isLiked, setIsLiked] = useState(false);
  const [currentMediaIndex, setCurrentMediaIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showPlayButton, setShowPlayButton] = useState(true);
  const [viewStartTime, setViewStartTime] = useState<number | null>(null);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const fullscreenVideoRef = useRef<HTMLVideoElement>(null);

  // Enhanced view tracking with intersection observer
  const { ref: cardRef, inView } = useInView({
    threshold: 0.7,
    triggerOnce: false,
    onChange: (inView) => {
      if (inView && !viewStartTime) {
        setViewStartTime(Date.now());
      } else if (!inView && viewStartTime) {
        const duration = Math.floor((Date.now() - viewStartTime) / 1000);
        if (duration >= 3) { // Only track views longer than 3 seconds
          onView(post.post_id, duration);
        }
        setViewStartTime(null);
      }
    }
  });

  // Enhanced video autoplay with better performance
  useEffect(() => {
    const currentVideo = videoRef.current;
    if (!currentVideo || !post.media_types[currentMediaIndex]?.startsWith('video/')) return;

    if (inView) {
      const playPromise = currentVideo.play();
      if (playPromise !== undefined) {
        playPromise
          .then(() => {
            setIsPlaying(true);
            setShowPlayButton(false);
          })
          .catch(() => {
            setShowPlayButton(true);
          });
      }
    } else {
      currentVideo.pause();
      setIsPlaying(false);
      setShowPlayButton(true);
    }
  }, [inView, currentMediaIndex, post.media_types]);

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
      onLike(post.post_id);
    }
  }, [isLiked, onLike, post.post_id]);

  const handleShare = useCallback(() => {
    onShare(post);
  }, [onShare, post]);

  // Enhanced double-tap like with animation
  const handleDoubleClick = useCallback((e: React.MouseEvent) => {
    if (!isLiked) {
      handleLike();
      
      // Enhanced floating heart animation
      const rect = e.currentTarget.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      
      const heart = document.createElement('div');
      heart.innerHTML = '❤️';
      heart.style.cssText = `
        position: absolute;
        left: ${x}px;
        top: ${y}px;
        font-size: 28px;
        pointer-events: none;
        animation: floatHeart 1.2s cubic-bezier(0.25, 0.46, 0.45, 0.94) forwards;
        z-index: 1000;
        user-select: none;
      `;
      
      e.currentTarget.appendChild(heart);
      setTimeout(() => heart.remove(), 1200);
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
    // Sync fullscreen video with current video
    setTimeout(() => {
      if (fullscreenVideoRef.current && videoRef.current) {
        fullscreenVideoRef.current.currentTime = videoRef.current.currentTime;
        fullscreenVideoRef.current.muted = videoRef.current.muted;
      }
    }, 100);
  }, []);

  const closeFullscreen = useCallback(() => {
    setIsFullscreen(false);
    // Sync current video with fullscreen video
    setTimeout(() => {
      if (fullscreenVideoRef.current && videoRef.current) {
        videoRef.current.currentTime = fullscreenVideoRef.current.currentTime;
      }
    }, 100);
  }, []);

  // Enhanced keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (isFullscreen) {
        switch (e.key) {
          case 'Escape':
            e.preventDefault();
            closeFullscreen();
            break;
          case ' ':
            e.preventDefault();
            togglePlay();
            break;
          case 'm':
          case 'M':
            e.preventDefault();
            toggleMute();
            break;
        }
      }
    };

    if (isFullscreen) {
      document.addEventListener('keydown', handleKeyDown);
      return () => document.removeEventListener('keydown', handleKeyDown);
    }
  }, [isFullscreen, closeFullscreen, togglePlay, toggleMute]);

  const currentMedia = post.media_urls[currentMediaIndex];
  const currentMediaType = post.media_types[currentMediaIndex];
  const isVideo = currentMediaType?.startsWith('video/');

  return (
    <>
      <Card 
        ref={cardRef}
        className="w-full overflow-hidden bg-card hover:shadow-xl transition-all duration-300 mb-4 border border-border/50 hover:border-border"
      >
        <CardContent className="p-0">
          {/* Enhanced Header */}
          <div className="flex items-center justify-between p-4 bg-card/50">
            <div className="flex items-center gap-3">
              <Avatar className="w-10 h-10 ring-2 ring-primary/10">
                <AvatarImage src={post.user_avatar} />
                <AvatarFallback className="bg-gradient-to-br from-primary/20 to-accent/20">
                  {post.user_display_name?.charAt(0)?.toUpperCase() || 'U'}
                </AvatarFallback>
              </Avatar>
              <div>
                <h4 className="font-semibold text-sm text-foreground">{post.user_display_name}</h4>
                <p className="text-xs text-muted-foreground">
                  {formatDistanceToNow(new Date(post.created_at), { addSuffix: true })}
                </p>
              </div>
            </div>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0 hover:bg-secondary/50">
                  <MoreHorizontal className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem className="gap-2">
                  <Bookmark className="w-4 h-4" />
                  Save Post
                </DropdownMenuItem>
                <DropdownMenuItem className="gap-2">
                  <Flag className="w-4 h-4" />
                  Report
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Content */}
          {post.content && (
            <div className="px-4 pb-3">
              <p className="text-sm leading-relaxed text-foreground/90">{post.content}</p>
            </div>
          )}

          {/* Enhanced Media Display */}
          {currentMedia && (
            <div 
              className="relative w-full bg-muted/20 group cursor-pointer overflow-hidden"
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
                  className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-[1.02]"
                  loop
                  muted={isMuted}
                  playsInline
                  onLoadStart={() => setShowPlayButton(true)}
                  onCanPlay={() => setShowPlayButton(false)}
                  onError={() => setShowPlayButton(true)}
                />
              ) : (
                <img
                  src={currentMedia}
                  alt="Post content"
                  className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-[1.02]"
                  loading="lazy"
                />
              )}

              {/* Enhanced Video Controls */}
              {isVideo && (
                <>
                  {/* Play Button Overlay */}
                  {showPlayButton && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/30 backdrop-blur-[1px]">
                      <Button
                        variant="secondary"
                        size="lg"
                        className="rounded-full w-16 h-16 bg-white/90 hover:bg-white shadow-lg"
                        onClick={(e) => {
                          e.stopPropagation();
                          togglePlay();
                        }}
                      >
                        <Play className="w-8 h-8 text-foreground ml-1" />
                      </Button>
                    </div>
                  )}

                  {/* Control Bar */}
                  <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                    <Button
                      variant="secondary"
                      size="sm"
                      className="h-8 w-8 p-0 rounded-full bg-black/60 hover:bg-black/80 text-white border-0"
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleMute();
                      }}
                    >
                      {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                    </Button>
                    <Button
                      variant="secondary"
                      size="sm"
                      className="h-8 w-8 p-0 rounded-full bg-black/60 hover:bg-black/80 text-white border-0"
                      onClick={(e) => {
                        e.stopPropagation();
                        openFullscreen();
                      }}
                    >
                      <Maximize2 className="w-4 h-4" />
                    </Button>
                  </div>
                </>
              )}

              {/* Enhanced Media Navigation */}
              {post.media_urls.length > 1 && (
                <>
                  {/* Indicators */}
                  <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex gap-1.5">
                    {post.media_urls.map((_, index) => (
                      <button
                        key={index}
                        className={`w-2 h-2 rounded-full transition-all duration-200 ${
                          index === currentMediaIndex 
                            ? 'bg-white shadow-lg scale-110' 
                            : 'bg-white/60 hover:bg-white/80'
                        }`}
                        onClick={(e) => {
                          e.stopPropagation();
                          setCurrentMediaIndex(index);
                        }}
                      />
                    ))}
                  </div>

                  {/* Navigation Buttons */}
                  {currentMediaIndex > 0 && (
                    <Button
                      variant="secondary"
                      size="sm"
                      className="absolute left-3 top-1/2 transform -translate-y-1/2 rounded-full h-8 w-8 p-0 bg-black/60 hover:bg-black/80 text-white border-0 opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={(e) => {
                        e.stopPropagation();
                        prevMedia();
                      }}
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </Button>
                  )}

                  {currentMediaIndex < post.media_urls.length - 1 && (
                    <Button
                      variant="secondary"
                      size="sm"
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 rounded-full h-8 w-8 p-0 bg-black/60 hover:bg-black/80 text-white border-0 opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={(e) => {
                        e.stopPropagation();
                        nextMedia();
                      }}
                    >
                      <ChevronRight className="w-4 h-4" />
                    </Button>
                  )}
                </>
              )}
            </div>
          )}

          {/* Enhanced Actions */}
          <div className="p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleLike}
                  className={`gap-2 h-8 px-2 transition-colors ${
                    isLiked 
                      ? 'text-red-500 hover:text-red-600' 
                      : 'hover:text-red-400'
                  }`}
                >
                  <Heart className={`w-5 h-5 transition-transform ${
                    isLiked ? 'fill-current scale-110' : 'hover:scale-110'
                  }`} />
                  <span className="font-medium">{post.like_count + (isLiked ? 1 : 0)}</span>
                </Button>

                <Button variant="ghost" size="sm" className="gap-2 h-8 px-2 hover:text-primary transition-colors">
                  <MessageCircle className="w-5 h-5" />
                  <span className="font-medium">{post.comment_count}</span>
                </Button>

                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={handleShare} 
                  className="gap-2 h-8 px-2 hover:text-accent transition-colors"
                >
                  <Share className="w-5 h-5" />
                  <span className="font-medium">{post.share_count}</span>
                </Button>
              </div>

              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <Eye className="w-4 h-4" />
                <span>1.2K</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Ultra-Enhanced Fullscreen Video Modal */}
      {isFullscreen && isVideo && (
        <Dialog open={isFullscreen} onOpenChange={closeFullscreen}>
          <DialogContent className="max-w-[100vw] max-h-[100vh] p-0 bg-black border-0 data-[state=open]:duration-300">
            <div className="relative w-screen h-screen flex items-center justify-center">
              <video
                ref={fullscreenVideoRef}
                src={currentMedia}
                className="w-full h-full object-contain"
                controls
                autoPlay
                loop
                muted={isMuted}
                onError={() => closeFullscreen()}
              />
              
              {/* Multiple Exit Options with Enhanced Visibility */}
              <div className="absolute top-4 right-4 z-[9999] flex gap-2">
                <Button
                  variant="secondary"
                  size="lg"
                  onClick={closeFullscreen}
                  className="bg-black/70 hover:bg-black/90 text-white border border-white/20 backdrop-blur-sm rounded-full w-12 h-12 p-0 shadow-2xl transition-all duration-200 hover:scale-105 focus:ring-2 focus:ring-white/50"
                >
                  <X className="w-6 h-6" />
                </Button>
              </div>

              {/* Click outside to close */}
              <div 
                className="absolute inset-0 cursor-pointer z-10"
                onClick={(e) => {
                  if (e.target === e.currentTarget) {
                    closeFullscreen();
                  }
                }}
              />
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Enhanced Floating Heart Animation */}
      <style>{`
        @keyframes floatHeart {
          0% {
            opacity: 1;
            transform: translateY(0) scale(1) rotate(0deg);
          }
          50% {
            opacity: 1;
            transform: translateY(-30px) scale(1.3) rotate(10deg);
          }
          100% {
            opacity: 0;
            transform: translateY(-60px) scale(1.5) rotate(15deg);
          }
        }
      `}</style>
    </>
  );
};