import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Heart, X, MessageCircle, Share, Eye, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
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

      // Get admin content from both admin_content and posts tables
      const [adminContentResult, postsResult] = await Promise.all([
        // Fetch ALL admin content
        supabase
          .from('admin_content')
          .select(`
            id, title, description, file_url, thumbnail_url, content_type, 
            view_count, like_count, share_count, is_promoted, category, 
            created_at, admin_id,
            profiles!admin_id(display_name, role)
          `)
          .not('file_url', 'is', null)
          .order('created_at', { ascending: false })
          .limit(500),

        // Fetch ALL posts from posts table
        supabase
          .from('posts')
          .select(`
            id, caption, content_url, post_type, promotion_type, 
            created_at, provider_id, payment_status, expires_at,
            profiles!provider_id(display_name, role)
          `)
          .not('content_url', 'is', null)
          .order('created_at', { ascending: false })
          .limit(500)
      ]);

      const adminContent = adminContentResult.data || [];
      const posts = postsResult.data || [];

      console.log('Supabase feed results:', { 
        adminContent: adminContent.length, 
        posts: posts.length,
        adminContentData: adminContent.slice(0, 2),
        postsData: posts.slice(0, 2)
      });

      // Transform data into feed items
      const feedItems: FeedItem[] = [];

      // Add admin content from admin_content table
      adminContent
        .filter(item => {
          if (!item.file_url) return false;
          if (item.file_url.includes('blob:')) return false;
          return true;
        })
        .forEach(item => {
          let contentType = item.content_type || 'image/jpeg';
          const url = item.file_url.toLowerCase();
          
          if (url.includes('.mp4') || url.includes('.mov') || url.includes('.avi') || url.includes('.webm') || url.includes('video')) {
            contentType = 'video/mp4';
          } else if (url.includes('.jpg') || url.includes('.jpeg') || url.includes('.png') || url.includes('.gif') || url.includes('.webp') || url.includes('image')) {
            contentType = 'image/jpeg';
          }

          const adminProfile = Array.isArray(item.profiles) ? item.profiles[0] : item.profiles;
          
          feedItems.push({
            id: `admin-content-${item.id}`,
            type: 'content',
            data: {
              id: item.id,
              title: item.title || 'Admin Content',
              description: item.description || 'Exclusive content from admin',
              file_url: item.file_url,
              thumbnail_url: item.thumbnail_url,
              content_type: contentType,
              view_count: item.view_count || 0,
              like_count: item.like_count || 0,
              share_count: item.share_count || 0,
              is_promoted: item.is_promoted || false,
              category: item.category || 'general',
              created_at: item.created_at,
              admin_name: adminProfile?.display_name || 'Admin Creator'
            }
          });
        });

      // Add posts from posts table
      posts
        .filter(post => {
          if (!post.content_url) return false;
          if (post.content_url.includes('blob:')) return false;
          return true;
        })
        .forEach(post => {
          let contentType = 'image/jpeg';
          if (post.post_type === 'video') {
            contentType = 'video/mp4';
          }

          const providerProfile = Array.isArray(post.profiles) ? post.profiles[0] : post.profiles;
          
          feedItems.push({
            id: `post-${post.id}`,
            type: 'content',
            data: {
              id: post.id,
              title: post.caption || 'Post Content',
              description: `${post.promotion_type} promotion`,
              file_url: post.content_url,
              content_type: contentType,
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

      // Sort all content by creation date, prioritizing promoted content
      const sortedItems = feedItems.sort((a, b) => {
        const aData = a.data as ContentItem;
        const bData = b.data as ContentItem;
        
        // Prioritize promoted content
        if (aData.is_promoted && !bData.is_promoted) return -1;
        if (!aData.is_promoted && bData.is_promoted) return 1;
        
        // Then sort by creation date (newest first)
        return new Date(bData.created_at).getTime() - new Date(aData.created_at).getTime();
      });

      console.log('Feed composition:', {
        total: sortedItems.length,
        adminContent: adminContent.length,
        posts: posts.length,
        promoted: sortedItems.filter(item => (item.data as ContentItem).is_promoted).length
      });

      setFeedItems(sortedItems);

    } catch (error) {
      console.error('Error fetching Supabase feed:', error);
      toast({
        title: "Error loading feed",
        description: "Please try refreshing the page",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user]);

  useEffect(() => {
    fetchFeedData();
  }, [fetchFeedData]);

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

// Content Card Component with Auto-play and Optimal Loading
const ContentCard = ({ content, onLike, onShare }: {
  content: ContentItem;
  onLike: () => void;
  onShare: () => void;
}) => {
  const isVideo = content.content_type.startsWith('video/');
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isInView, setIsInView] = useState(false);

  useEffect(() => {
    if (!isVideo || !videoRef.current) return;

    const video = videoRef.current;
    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        setIsInView(entry.isIntersecting);
        
        if (entry.isIntersecting) {
          // Video is in viewport - play it
          video.play().catch(console.error);
        } else {
          // Video is out of viewport - pause it
          video.pause();
        }
      },
      {
        threshold: 0.6, // Play when 60% of video is visible
        rootMargin: '0px'
      }
    );

    observer.observe(video);

    return () => {
      observer.disconnect();
    };
  }, [isVideo]);

  return (
    <div>
      {/* Content Header */}
      <div className="flex items-center gap-3 p-4 pb-3">
        <Avatar className="w-10 h-10">
          <AvatarFallback className="text-sm font-medium">
            {content.admin_name?.[0] || 'A'}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1">
          <p className="font-semibold text-sm">{content.admin_name}</p>
          <p className="text-xs text-muted-foreground">
            {new Date(content.created_at).toLocaleDateString()}
          </p>
        </div>
        {content.is_promoted && (
          <Badge className="bg-gradient-to-r from-pink-500 to-purple-500 text-white">
            Featured
          </Badge>
        )}
      </div>

      {/* Content Media */}
      <div className="aspect-square relative bg-muted">
        {isVideo ? (
          <video 
            ref={videoRef}
            src={content.file_url}
            className="w-full h-full object-cover"
            loop
            muted
            playsInline
            preload="auto"
            poster={content.thumbnail_url}
            onLoadStart={() => console.log('Video loading:', content.file_url)}
            style={{ objectFit: 'cover' }}
          />
        ) : (
          <img 
            src={content.file_url} 
            alt={content.title}
            className="w-full h-full object-cover"
            loading="eager"
            decoding="sync"
            onError={(e) => {
              e.currentTarget.src = '/placeholder.svg';
            }}
            style={{ objectFit: 'cover' }}
          />
        )}
      </div>

      {/* Content Info */}
      <div className="p-4">
        <h3 className="font-bold text-foreground mb-2 text-lg">{content.title}</h3>
        {content.description && (
          <p className="text-sm text-muted-foreground mb-4 line-clamp-3">
            {content.description}
          </p>
        )}

        {/* Action Buttons */}
        <div className="flex items-center gap-6">
          <Button onClick={onLike} variant="ghost" size="sm" className="gap-2 p-2">
            <Heart className="w-5 h-5" />
            <span className="font-medium">{content.like_count || 0}</span>
          </Button>
          <Button onClick={onShare} variant="ghost" size="sm" className="gap-2 p-2">
            <Share className="w-5 h-5" />
            <span className="font-medium">Share</span>
          </Button>
          <div className="flex items-center gap-2 text-sm text-muted-foreground ml-auto">
            <Eye className="w-4 h-4" />
            <span>{content.view_count || 0}</span>
          </div>
        </div>
      </div>
    </div>
  );
};