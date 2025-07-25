import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Heart, X, Star, MessageCircle, Share, Eye, RefreshCw } from 'lucide-react';
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

export const SimplifiedFeed = () => {
  const { user } = useAuth();
  const [feedItems, setFeedItems] = useState<FeedItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchFeedData = useCallback(async () => {
    if (!user) return;

    try {
      setLoading(true);

      // Fetch all data in parallel - simplified approach
      const [profilesResult, adminContentResult, postsResult] = await Promise.all([
        // Get recent profiles
        supabase
          .from('profiles')
          .select('id, display_name, age, bio, location, profile_image_url, profile_images, interests, photo_verified, created_at, last_active')
          .neq('id', user.id)
          .eq('is_blocked', false)
          .order('created_at', { ascending: false })
          .limit(10),

        // Get ALL admin content - no complex filtering
        supabase
          .from('admin_content')
          .select(`
            id, title, description, file_url, thumbnail_url, content_type, 
            view_count, like_count, share_count, is_promoted, category, 
            created_at, admin_id,
            profiles!admin_id(display_name)
          `)
          .eq('status', 'published')
          .eq('approval_status', 'approved')
          .order('is_promoted', { ascending: false })
          .order('created_at', { ascending: false })
          .limit(20),

        // Get active posts
        supabase
          .from('posts')
          .select('id, caption, content_url, post_type, created_at, is_promoted, provider_id')
          .eq('payment_status', 'paid')
          .gt('expires_at', new Date().toISOString())
          .order('created_at', { ascending: false })
          .limit(10)
      ]);

      const profiles = profilesResult.data || [];
      const adminContent = adminContentResult.data || [];
      const posts = postsResult.data || [];

      console.log('Fetched data:', { 
        profiles: profiles.length, 
        adminContent: adminContent.length, 
        posts: posts.length 
      });

      // Transform data into feed items with proper content type detection
      const feedItems: FeedItem[] = [];

      // Add profiles
      profiles.forEach(profile => {
        feedItems.push({
          id: `profile-${profile.id}`,
          type: 'profile',
          data: profile
        });
      });

      // Add admin content with better content type detection
      adminContent.forEach(item => {
        let contentType = item.content_type;
        if (!contentType || contentType === 'application/octet-stream') {
          const url = item.file_url.toLowerCase();
          if (url.includes('.mp4') || url.includes('.mov') || url.includes('.avi') || url.includes('.webm')) {
            contentType = 'video/mp4';
          } else if (url.includes('.jpg') || url.includes('.jpeg') || url.includes('.png') || url.includes('.gif') || url.includes('.webp')) {
            contentType = 'image/jpeg';
          } else {
            contentType = 'image/jpeg';
          }
        }

        const adminProfile = Array.isArray(item.profiles) ? item.profiles[0] : item.profiles;
        
        feedItems.push({
          id: `content-${item.id}`,
          type: 'content',
          data: {
            ...item,
            content_type: contentType,
            admin_name: adminProfile?.display_name || 'Content Creator'
          }
        });
      });

      // Add posts
      posts.forEach(post => {
        feedItems.push({
          id: `post-${post.id}`,
          type: 'content',
          data: {
            id: post.id,
            title: `${post.post_type} Post`,
            description: post.caption || '',
            file_url: post.content_url,
            content_type: 'image/jpeg',
            view_count: 0,
            like_count: 0,
            share_count: 0,
            is_promoted: post.is_promoted || false,
            created_at: post.created_at,
            admin_name: 'Service Provider'
          }
        });
      });

      // Shuffle feed items for variety
      const shuffledItems = feedItems.sort(() => Math.random() - 0.5);
      setFeedItems(shuffledItems);

    } catch (error) {
      console.error('Error fetching feed:', error);
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

  const handleProfileLike = async (profileId: string) => {
    try {
      // Record the swipe
      await supabase.from('swipes').insert({
        user_id: user?.id,
        target_user_id: profileId,
        liked: true
      });

      // Remove from feed
      setFeedItems(prev => prev.filter(item => item.id !== `profile-${profileId}`));
      
      toast({
        title: "Profile liked!",
        description: "You'll be notified if it's a match"
      });
    } catch (error) {
      console.error('Error liking profile:', error);
    }
  };

  const handleProfilePass = async (profileId: string) => {
    try {
      // Record the swipe
      await supabase.from('swipes').insert({
        user_id: user?.id,
        target_user_id: profileId,
        liked: false
      });

      // Remove from feed
      setFeedItems(prev => prev.filter(item => item.id !== `profile-${profileId}`));
    } catch (error) {
      console.error('Error passing profile:', error);
    }
  };

  const handleContentLike = async (contentId: string) => {
    try {
      // Increment view count
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
          {[...Array(5)].map((_, i) => (
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
              <p className="text-muted-foreground">No content available</p>
              <Button onClick={handleRefresh} className="mt-4">
                Try Again
              </Button>
            </div>
          ) : (
            feedItems.map((item) => (
              <Card key={item.id} className="w-full overflow-hidden">
                <CardContent className="p-0">
                  {item.type === 'profile' ? (
                    <ProfileCard 
                      profile={item.data as Profile}
                      onLike={() => handleProfileLike(item.data.id)}
                      onPass={() => handleProfilePass(item.data.id)}
                    />
                  ) : (
                    <ContentCard 
                      content={item.data as ContentItem}
                      onLike={() => handleContentLike(item.data.id)}
                      onShare={() => handleShare(item.data as ContentItem)}
                    />
                  )}
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

// Profile Card Component
const ProfileCard = ({ profile, onLike, onPass }: {
  profile: Profile;
  onLike: () => void;
  onPass: () => void;
}) => {
  const imageUrl = profile.profile_image_url || 
                   (profile.profile_images && profile.profile_images[0]) || 
                   '';

  return (
    <div className="relative">
      {/* Profile Image */}
      <div className="aspect-[3/4] relative bg-muted">
        {imageUrl ? (
          <img 
            src={imageUrl} 
            alt={profile.display_name || 'Profile'} 
            className="w-full h-full object-cover"
            onError={(e) => {
              e.currentTarget.style.display = 'none';
            }}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Avatar className="w-24 h-24">
              <AvatarFallback className="text-2xl">
                {profile.display_name?.[0]?.toUpperCase() || '?'}
              </AvatarFallback>
            </Avatar>
          </div>
        )}
        
        {profile.photo_verified && (
          <Badge className="absolute top-3 right-3 bg-blue-500">
            ✓ Verified
          </Badge>
        )}
      </div>

      {/* Profile Info */}
      <div className="p-4">
        <div className="flex items-center gap-2 mb-2">
          <h3 className="text-lg font-semibold text-foreground">
            {profile.display_name || 'Anonymous'}
          </h3>
          {profile.age && (
            <span className="text-muted-foreground">{profile.age}</span>
          )}
        </div>
        
        {profile.location && (
          <p className="text-sm text-muted-foreground mb-2">{profile.location}</p>
        )}
        
        {profile.bio && (
          <p className="text-sm text-foreground mb-3 line-clamp-2">{profile.bio}</p>
        )}
        
        {profile.interests && profile.interests.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-4">
            {profile.interests.slice(0, 3).map((interest, index) => (
              <Badge key={index} variant="secondary" className="text-xs">
                {interest}
              </Badge>
            ))}
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-4">
          <Button 
            onClick={onPass} 
            variant="outline" 
            size="lg" 
            className="flex-1 gap-2"
          >
            <X className="w-5 h-5" />
            Pass
          </Button>
          <Button 
            onClick={onLike} 
            size="lg" 
            className="flex-1 gap-2"
          >
            <Heart className="w-5 h-5" />
            Like
          </Button>
        </div>
      </div>
    </div>
  );
};

// Content Card Component  
const ContentCard = ({ content, onLike, onShare }: {
  content: ContentItem;
  onLike: () => void;
  onShare: () => void;
}) => {
  const isVideo = content.content_type.startsWith('video/');

  return (
    <div>
      {/* Content Header */}
      <div className="flex items-center gap-3 p-4 pb-2">
        <Avatar className="w-8 h-8">
          <AvatarFallback>{content.admin_name?.[0] || 'A'}</AvatarFallback>
        </Avatar>
        <div className="flex-1">
          <p className="font-medium text-sm">{content.admin_name}</p>
          <p className="text-xs text-muted-foreground">
            {new Date(content.created_at).toLocaleDateString()}
          </p>
        </div>
        {content.is_promoted && (
          <Badge className="bg-gradient-to-r from-pink-500 to-purple-500">
            Promoted
          </Badge>
        )}
      </div>

      {/* Content Media */}
      <div className="aspect-square relative bg-muted">
        {isVideo ? (
          <video 
            src={content.file_url}
            className="w-full h-full object-cover"
            controls
            playsInline
            preload="metadata"
          />
        ) : (
          <img 
            src={content.file_url} 
            alt={content.title}
            className="w-full h-full object-cover"
            onError={(e) => {
              e.currentTarget.src = '/placeholder.svg';
            }}
          />
        )}
      </div>

      {/* Content Info */}
      <div className="p-4">
        <h3 className="font-semibold text-foreground mb-1">{content.title}</h3>
        {content.description && (
          <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
            {content.description}
          </p>
        )}

        {/* Action Buttons */}
        <div className="flex items-center gap-4">
          <Button onClick={onLike} variant="ghost" size="sm" className="gap-2">
            <Heart className="w-4 h-4" />
            {content.like_count || 0}
          </Button>
          <Button onClick={onShare} variant="ghost" size="sm" className="gap-2">
            <Share className="w-4 h-4" />
            Share
          </Button>
          <div className="flex items-center gap-1 text-sm text-muted-foreground ml-auto">
            <Eye className="w-4 h-4" />
            {content.view_count || 0}
          </div>
        </div>
      </div>
    </div>
  );
};