import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Heart, MessageCircle, Share, Eye, RefreshCw, Play, X, Maximize2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { toast } from '@/hooks/use-toast';

interface Profile {
  id: string;
  display_name: string | null;
  age?: number | null;
  bio?: string | null;
  location?: string | null;
  profile_image_url?: string | null;
  profile_images?: string[] | null;
  interests?: string[] | null;
  photo_verified?: boolean;
  created_at?: string;
  last_active?: string;
}

interface ContentItem {
  id: string;
  title: string;
  description?: string;
  file_url: string;
  thumbnail_url?: string;
  content_type: string;
  view_count: number;
  like_count: number;
  share_count: number;
  is_promoted: boolean;
  category?: string;
  created_at: string;
  admin_name?: string;
}

interface FeedItem {
  id: string;
  type: 'profile' | 'content';
  data: Profile | ContentItem;
}

export const SupabaseFeed = () => {
  const { user } = useAuth();
  const [feedItems, setFeedItems] = useState<FeedItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchFeedData = useCallback(async () => {
    if (!user) return;

    try {
      setLoading(true);

      // Enhanced queries with proper filtering for published and paid content
      const [adminContentResult, postsResult] = await Promise.all([
        // Fetch published admin content only
        supabase
          .from('admin_content')
          .select(`
            id, title, description, file_url, thumbnail_url, content_type, 
            view_count, like_count, share_count, is_promoted, category, 
            created_at, admin_id, status, approval_status,
            profiles!admin_id(display_name, role)
          `)
          .eq('status', 'published')
          .eq('approval_status', 'approved')
          .not('file_url', 'is', null)
          .order('is_promoted', { ascending: false })
          .order('created_at', { ascending: false })
          .limit(100),

        // Fetch active paid posts only
        supabase
          .from('posts')
          .select(`
            id, caption, content_url, post_type, promotion_type, 
            created_at, provider_id, payment_status, expires_at,
            profiles!provider_id(display_name, role)
          `)
          .eq('payment_status', 'paid')
          .gt('expires_at', new Date().toISOString())
          .not('content_url', 'is', null)
          .order('promotion_type', { ascending: false })
          .order('created_at', { ascending: false })
          .limit(100)
      ]);

      const adminContent = adminContentResult.data || [];
      const posts = postsResult.data || [];

      console.log('Optimized feed fetch:', { 
        adminContent: adminContent.length, 
        posts: posts.length,
        timestamp: new Date().toISOString()
      });

      // Transform data into feed items with better content type detection
      const feedItems: FeedItem[] = [];

      // Process admin content
      adminContent
        .filter(item => item.file_url && !item.file_url.includes('blob:'))
        .forEach(item => {
          const adminProfile = Array.isArray(item.profiles) ? item.profiles[0] : item.profiles;
          
          // Better content type detection
          let contentType = item.content_type || 'image/jpeg';
          const url = item.file_url.toLowerCase();
          
          if (url.match(/\.(mp4|mov|avi|webm|mkv)(\?|$)/)) {
            contentType = 'video/mp4';
          } else if (url.match(/\.(jpg|jpeg|png|gif|webp|svg)(\?|$)/)) {
            contentType = 'image/jpeg';
          }
          
          feedItems.push({
            id: `admin-content-${item.id}`,
            type: 'content',
            data: {
              id: item.id,
              title: item.title || 'Featured Content',
              description: item.description || 'Discover amazing content',
              file_url: item.file_url,
              thumbnail_url: item.thumbnail_url,
              content_type: contentType,
              view_count: item.view_count || 0,
              like_count: item.like_count || 0,
              share_count: item.share_count || 0,
              is_promoted: item.is_promoted || false,
              category: item.category || 'general',
              created_at: item.created_at,
              admin_name: adminProfile?.display_name || 'Admin'
            }
          });
        });

      // Process posts
      posts
        .filter(post => post.content_url && !post.content_url.includes('blob:'))
        .forEach(post => {
          const providerProfile = Array.isArray(post.profiles) ? post.profiles[0] : post.profiles;
          
          feedItems.push({
            id: `post-${post.id}`,
            type: 'content',
            data: {
              id: post.id,
              title: post.caption || 'Premium Content',
              description: `${post.promotion_type} premium content`,
              file_url: post.content_url,
              content_type: post.post_type === 'video' ? 'video/mp4' : 'image/jpeg',
              view_count: 0,
              like_count: 0,
              share_count: 0,
              is_promoted: post.promotion_type !== 'free_2h',
              category: post.post_type || 'general',
              created_at: post.created_at,
              admin_name: providerProfile?.display_name || 'Creator'
            }
          });
        });

      // Social media algorithm: Smart content mixing
      const promotedItems = feedItems.filter(item => (item.data as ContentItem).is_promoted);
      const regularItems = feedItems.filter(item => !(item.data as ContentItem).is_promoted);
      
      // Interleave promoted content every 3 items for better engagement
      const mixedItems: FeedItem[] = [];
      let promotedIndex = 0;
      
      regularItems.forEach((item, index) => {
        mixedItems.push(item);
        
        // Insert promoted content every 3 items
        if ((index + 1) % 3 === 0 && promotedIndex < promotedItems.length) {
          mixedItems.push(promotedItems[promotedIndex]);
          promotedIndex++;
        }
      });
      
      // Add remaining promoted items at the beginning
      const remainingPromoted = promotedItems.slice(promotedIndex);
      const finalFeed = [...remainingPromoted, ...mixedItems];

      console.log('Feed composition:', {
        total: finalFeed.length,
        promoted: promotedItems.length,
        regular: regularItems.length,
        adminContent: adminContent.length,
        posts: posts.length
      });

      setFeedItems(finalFeed);

    } catch (error) {
      console.error('Error fetching Supabase feed:', error);
      toast({
        title: "Error loading feed",
        description: "Please check your connection and try again",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user]);

  // Initial load with realtime subscription
  useEffect(() => {
    if (user) {
      fetchFeedData();
      
      // Set up realtime updates for new content
      const adminContentChannel = supabase
        .channel('admin_content_changes')
        .on('postgres_changes', 
          { event: 'INSERT', schema: 'public', table: 'admin_content' },
          (payload) => {
            console.log('New admin content:', payload);
            // Auto-refresh on new published content
            if (payload.new?.status === 'published') {
              setTimeout(() => fetchFeedData(), 1000);
            }
          }
        )
        .subscribe();

      const postsChannel = supabase
        .channel('posts_changes')
        .on('postgres_changes',
          { event: 'INSERT', schema: 'public', table: 'posts' },
          (payload) => {
            console.log('New post:', payload);
            // Auto-refresh on new paid posts
            if (payload.new?.payment_status === 'paid') {
              setTimeout(() => fetchFeedData(), 1000);
            }
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(adminContentChannel);
        supabase.removeChannel(postsChannel);
      };
    }
  }, [user, fetchFeedData]);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchFeedData();
  };

  const handleContentLike = async (contentId: string) => {
    try {
      await supabase.rpc('increment_content_view', { content_id: contentId });
      
      toast({
        title: "Content liked!",
        description: "Thanks for your engagement"
      });
    } catch (error) {
      console.error('Error liking content:', error);
    }
  };

  const handleShare = async (item: ContentItem) => {
    try {
      if (navigator.share) {
        await navigator.share({
          title: item.title,
          text: item.description || 'Check out this content',
          url: window.location.href
        });
      } else {
        await navigator.clipboard.writeText(window.location.href);
        toast({
          title: "Link copied!",
          description: "Share link copied to clipboard"
        });
      }
    } catch (error) {
      console.error('Error sharing:', error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background p-4">
        <div className="max-w-md mx-auto space-y-4">
          {[...Array(6)].map((_, i) => (
            <Card key={i} className="w-full">
              <CardContent className="p-0">
                <Skeleton className="w-full h-96" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-md mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border">
          <h1 className="text-xl font-bold text-foreground">Discover</h1>
          <Button 
            onClick={handleRefresh} 
            variant="ghost" 
            size="sm" 
            disabled={refreshing}
            className="gap-2"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>

        {/* Feed Content */}
        <div className="space-y-4 p-4">
          {feedItems.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground mb-4">No content available</p>
              <Button onClick={handleRefresh} className="gap-2">
                <RefreshCw className="w-4 h-4" />
                Try Again
              </Button>
            </div>
          ) : (
            feedItems.map((item) => (
              <Card key={item.id} className="w-full overflow-hidden shadow-md">
                <CardContent className="p-0">
                  <ContentCard 
                    content={item.data as ContentItem}
                    onLike={() => handleContentLike(item.data.id)}
                    onShare={() => handleShare(item.data as ContentItem)}
                  />
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

// Enhanced Content Card Component with Perfect Video Handling
const ContentCard = ({ content, onLike, onShare }: {
  content: ContentItem;
  onLike: () => void;
  onShare: () => void;
}) => {
  const isVideo = content.content_type.startsWith('video/');
  const videoRef = useRef<HTMLVideoElement>(null);
  const fullscreenVideoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [showPlayButton, setShowPlayButton] = useState(isVideo);
  const [videoError, setVideoError] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

  // Enhanced video intersection observer with better autoplay logic
  useEffect(() => {
    if (!isVideo || !videoRef.current) return;

    const video = videoRef.current;
    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        
        if (entry.isIntersecting && entry.intersectionRatio > 0.7) {
          // Video is 70% visible - attempt autoplay
          const playPromise = video.play();
          if (playPromise !== undefined) {
            playPromise
              .then(() => {
                setIsPlaying(true);
                setShowPlayButton(false);
              })
              .catch((error) => {
                console.log('Autoplay blocked:', error);
                setShowPlayButton(true);
              });
          }
        } else if (entry.intersectionRatio < 0.3) {
          // Video is less than 30% visible - pause it
          if (!video.paused) {
            video.pause();
            setIsPlaying(false);
            setShowPlayButton(true);
          }
        }
      },
      {
        threshold: [0.3, 0.7],
        rootMargin: '0px'
      }
    );

    observer.observe(video);

    return () => {
      observer.disconnect();
    };
  }, [isVideo]);

  const toggleVideoPlay = () => {
    if (!videoRef.current) return;
    
    if (isPlaying) {
      videoRef.current.pause();
      setIsPlaying(false);
      setShowPlayButton(true);
    } else {
      videoRef.current.play()
        .then(() => {
          setIsPlaying(true);
          setShowPlayButton(false);
        })
        .catch((error) => {
          console.error('Video play error:', error);
          setVideoError(true);
        });
    }
  };

  const handleVideoClick = () => {
    if (isVideo && isPlaying) {
      // Expand video if it's playing
      setIsExpanded(true);
      // Sync fullscreen video with current video
      if (fullscreenVideoRef.current && videoRef.current) {
        fullscreenVideoRef.current.currentTime = videoRef.current.currentTime;
      }
    } else {
      // Just toggle play if not playing
      toggleVideoPlay();
    }
  };

  const closeExpanded = () => {
    setIsExpanded(false);
    // Sync original video with fullscreen video time
    if (fullscreenVideoRef.current && videoRef.current) {
      videoRef.current.currentTime = fullscreenVideoRef.current.currentTime;
    }
  };

  return (
    <Card className="w-full overflow-hidden shadow-lg hover:shadow-xl transition-all duration-300 mb-6">
      <CardContent className="p-0">
        {/* Content Header */}
        <div className="flex items-center gap-3 p-4 pb-3">
          <Avatar className="w-10 h-10 ring-2 ring-primary/20">
            <AvatarFallback className="text-sm font-medium bg-gradient-to-br from-primary to-primary/60 text-primary-foreground">
              {content.admin_name?.[0]?.toUpperCase() || 'A'}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <p className="font-semibold text-sm">{content.admin_name}</p>
            <p className="text-xs text-muted-foreground">
              {new Date(content.created_at).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                hour: 'numeric',
                minute: '2-digit'
              })}
            </p>
          </div>
          {content.is_promoted && (
            <Badge className="bg-gradient-to-r from-pink-500 to-purple-500 text-white shadow-lg">
              ✨ Featured
            </Badge>
          )}
        </div>

        {/* Content Media */}
        <div className="aspect-square relative bg-muted group">
          {isVideo ? (
            <>
              <video 
                ref={videoRef}
                src={content.file_url}
                className="w-full h-full object-cover cursor-pointer"
                loop
                muted
                playsInline
                preload="metadata"
                poster={content.thumbnail_url}
                onClick={handleVideoClick}
                onError={() => setVideoError(true)}
                onCanPlay={() => setVideoError(false)}
                style={{ objectFit: 'cover' }}
              />
              {showPlayButton && !videoError && (
                <button
                  onClick={toggleVideoPlay}
                  className="absolute inset-0 flex items-center justify-center bg-black/20 group-hover:bg-black/30 transition-colors"
                >
                  <div className="bg-white/90 rounded-full p-4 shadow-lg hover:bg-white transition-colors">
                    <Play className="w-8 h-8 text-black ml-1" />
                  </div>
                </button>
              )}
              {isPlaying && (
                <button
                  onClick={() => setIsExpanded(true)}
                  className="absolute top-4 right-4 bg-black/50 rounded-full p-2 hover:bg-black/70 transition-colors opacity-0 group-hover:opacity-100"
                >
                  <Maximize2 className="w-4 h-4 text-white" />
                </button>
              )}
              {videoError && (
                <div className="absolute inset-0 flex items-center justify-center bg-muted">
                  <div className="text-center">
                    <div className="w-16 h-16 mx-auto bg-muted-foreground/20 rounded-full flex items-center justify-center mb-2">
                      <Play className="w-8 h-8 text-muted-foreground" />
                    </div>
                    <p className="text-sm text-muted-foreground">Video unavailable</p>
                  </div>
                </div>
              )}
            </>
          ) : (
            <img 
              src={content.file_url} 
              alt={content.title}
              className="w-full h-full object-cover"
              loading="lazy"
              onError={(e) => {
                e.currentTarget.src = '/placeholder.svg';
              }}
              style={{ objectFit: 'cover' }}
            />
          )}
        </div>

        {/* Content Info */}
        <div className="p-4">
          <h3 className="font-bold text-foreground mb-2 text-lg leading-tight">
            {content.title}
          </h3>
          {content.description && (
            <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
              {content.description}
            </p>
          )}

          {/* Action Buttons */}
          <div className="flex items-center gap-4">
            <Button 
              onClick={onLike} 
              variant="ghost" 
              size="sm" 
              className="gap-2 p-2 hover:bg-red-50 hover:text-red-600 transition-colors"
            >
              <Heart className="w-5 h-5" />
              <span className="font-medium">{content.like_count.toLocaleString()}</span>
            </Button>
            
            <Button 
              onClick={onShare} 
              variant="ghost" 
              size="sm" 
              className="gap-2 p-2 hover:bg-blue-50 hover:text-blue-600 transition-colors"
            >
              <Share className="w-5 h-5" />
              <span className="font-medium">Share</span>
            </Button>
            
            <div className="flex items-center gap-2 text-sm text-muted-foreground ml-auto">
              <Eye className="w-4 h-4" />
              <span>{content.view_count.toLocaleString()}</span>
            </div>
          </div>
        </div>

        {/* Expanded Video Modal */}
        <Dialog open={isExpanded} onOpenChange={setIsExpanded}>
          <DialogContent className="max-w-none w-screen h-screen p-0 bg-black/95">
            <div className="relative w-full h-full flex items-center justify-center">
              <button
                onClick={closeExpanded}
                className="absolute top-4 right-4 z-50 bg-black/50 rounded-full p-3 hover:bg-black/70 transition-colors"
              >
                <X className="w-6 h-6 text-white" />
              </button>
              
              <video 
                ref={fullscreenVideoRef}
                src={content.file_url}
                className="max-w-full max-h-full object-contain"
                controls
                autoPlay
                loop
                muted
                playsInline
                poster={content.thumbnail_url}
              />
            </div>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
};