import { useState, useEffect, useCallback } from 'react';
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

export const OptimizedFeed = () => {
  const { user } = useAuth();
  const [feedItems, setFeedItems] = useState<FeedItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchFeedData = useCallback(async () => {
    if (!user) return;

    try {
      setLoading(true);

      // FLOOD FEED WITH ADMIN CONTENT ONLY - Get admin profiles and their content
      const [adminProfilesResult, adminContentResult] = await Promise.all([
        // Get admin profiles with content
        supabase
          .from('profiles')
          .select('id, display_name, age, bio, location, profile_image_url, profile_images, interests, photo_verified, created_at, last_active')
          .eq('role', 'admin')
          .eq('is_blocked', false)
          .not('profile_image_url', 'is', null)
          .order('last_active', { ascending: false })
          .limit(50), // More admin profiles

        // Get ALL admin content - prioritize labsfrica@gmail.com and other admins
        supabase
          .from('admin_content')
          .select(`
            id, title, description, file_url, thumbnail_url, content_type, 
            view_count, like_count, share_count, is_promoted, category, 
            created_at, admin_id,
            profiles!admin_id(display_name, age, bio, location, profile_image_url, interests, photo_verified)
          `)
          .eq('status', 'published')
          .eq('approval_status', 'approved')
          .like('file_url', 'https://%') // Only HTTPS URLs
          .order('is_promoted', { ascending: false })
          .order('created_at', { ascending: false })
          .limit(100) // Much more content for flooding
      ]);

      const adminProfiles = adminProfilesResult.data || [];
      const adminContent = adminContentResult.data || [];

      console.log('Admin-only feed results:', { 
        adminProfiles: adminProfiles.length, 
        adminContent: adminContent.length 
      });

      // FLOOD FEED WITH ADMIN CONTENT ONLY - Transform admin data into feed items
      const feedItems: FeedItem[] = [];

      // Create content cards from admin profiles (show admin profiles as content)
      adminProfiles
        .filter(profile => {
          const hasValidImage = profile.profile_image_url || 
                               (profile.profile_images && profile.profile_images.length > 0);
          return hasValidImage;
        })
        .forEach(profile => {
          // Create profile-based content cards
          feedItems.push({
            id: `admin-profile-${profile.id}`,
            type: 'content',
            data: {
              id: profile.id,
              title: profile.display_name || 'Admin Creator',
              description: profile.bio || 'Amazing content creator',
              file_url: profile.profile_image_url || profile.profile_images?.[0] || '',
              content_type: 'image/jpeg',
              view_count: 0,
              like_count: 0,
              share_count: 0,
              is_promoted: true,
              category: 'profile',
              created_at: profile.created_at || new Date().toISOString(),
              admin_name: profile.display_name || 'Admin Creator'
            }
          });
        });

      // Add ALL admin content - prioritizing labsfrica@gmail.com content
      adminContent
        .filter(item => {
          // Strict filtering for working content
          if (!item.file_url) return false;
          if (item.file_url.includes('blob:')) return false;
          if (!item.file_url.startsWith('https://')) return false;
          return true;
        })
        .forEach(item => {
          // Enhanced content type detection
          let contentType = item.content_type;
          if (!contentType || contentType === 'application/octet-stream') {
            const url = item.file_url.toLowerCase();
            if (url.includes('.mp4') || url.includes('.mov') || url.includes('.avi') || url.includes('.webm') || url.includes('/video/')) {
              contentType = 'video/mp4';
            } else if (url.includes('.jpg') || url.includes('.jpeg') || url.includes('.png') || url.includes('.gif') || url.includes('.webp') || url.includes('/image/')) {
              contentType = 'image/jpeg';
            } else {
              contentType = 'image/jpeg'; // Safe default
            }
          }

          const adminProfile = Array.isArray(item.profiles) ? item.profiles[0] : item.profiles;
          
          feedItems.push({
            id: `admin-content-${item.id}`,
            type: 'content',
            data: {
              ...item,
              content_type: contentType,
              admin_name: adminProfile?.display_name || 'Content Creator',
              title: item.title || 'Exclusive Content',
              description: item.description || 'Amazing content just for you!'
            }
          });
        });

      // SMART ADMIN CONTENT ROTATION - Flood feed with admin data
      const allAdminItems = feedItems.filter(item => item.type === 'content');
      
      // Separate content by admin creator for rotation
      const contentByAdmin: { [key: string]: FeedItem[] } = {};
      allAdminItems.forEach(item => {
        const adminName = (item.data as ContentItem).admin_name || 'Unknown';
        if (!contentByAdmin[adminName]) {
          contentByAdmin[adminName] = [];
        }
        contentByAdmin[adminName].push(item);
      });

      // Prioritize labsfrica@gmail.com content and rotate all admin content
      const rotatedItems: FeedItem[] = [];
      const adminNames = Object.keys(contentByAdmin);
      
      // Put labsfrica content first if available
      const labsContent = contentByAdmin['labsfrica@gmail.com'] || [];
      const otherAdmins = adminNames.filter(name => name !== 'labsfrica@gmail.com');
      
      let adminIndex = 0;
      let labsIndex = 0;
      const maxRotations = Math.max(allAdminItems.length, 50); // Ensure we show lots of content

      for (let i = 0; i < maxRotations; i++) {
        // Add labsfrica content more frequently
        if (labsContent.length > 0 && labsIndex < labsContent.length) {
          rotatedItems.push(labsContent[labsIndex]);
          labsIndex++;
        }
        
        // Add other admin content
        if (otherAdmins.length > 0) {
          const currentAdmin = otherAdmins[adminIndex % otherAdmins.length];
          const adminContent = contentByAdmin[currentAdmin];
          if (adminContent && adminContent.length > 0) {
            const contentItem = adminContent.shift();
            if (contentItem) {
              rotatedItems.push(contentItem);
            }
          }
          adminIndex++;
        }
      }

      console.log('Admin-flooded feed composition:', {
        total: rotatedItems.length,
        labsContent: labsContent.length,
        otherAdmins: otherAdmins.length,
        totalAdminContent: allAdminItems.length
      });

      setFeedItems(rotatedItems);

    } catch (error) {
      console.error('Error fetching optimized feed:', error);
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
      // Swipe functionality not implemented yet
      console.log('Profile liked:', profileId);
      setFeedItems(prev => prev.filter(item => item.id !== `profile-${profileId}`));
      
      toast({
        title: "Profile liked!",
        description: "Swipe feature coming soon"
      });
    } catch (error) {
      console.error('Error liking profile:', error);
    }
  };

  const handleProfilePass = async (profileId: string) => {
    try {
      // Swipe functionality not implemented yet
      console.log('Profile passed:', profileId);
      setFeedItems(prev => prev.filter(item => item.id !== `profile-${profileId}`));
    } catch (error) {
      console.error('Error passing profile:', error);
    }
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

// Enhanced Profile Card Component
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
      {/* Profile Image - Bigger aspect ratio */}
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
            <Avatar className="w-32 h-32">
              <AvatarFallback className="text-3xl">
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

      {/* Profile Info - Enhanced layout */}
      <div className="p-6">
        <div className="flex items-center gap-2 mb-3">
          <h3 className="text-xl font-bold text-foreground">
            {profile.display_name || 'Anonymous'}
          </h3>
          {profile.age && (
            <span className="text-lg text-muted-foreground">{profile.age}</span>
          )}
        </div>
        
        {profile.location && (
          <p className="text-sm text-muted-foreground mb-3">{profile.location}</p>
        )}
        
        {profile.bio && (
          <p className="text-sm text-foreground mb-4 line-clamp-3">{profile.bio}</p>
        )}
        
        {profile.interests && profile.interests.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-6">
            {profile.interests.slice(0, 4).map((interest, index) => (
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
            className="flex-1 gap-2 h-12"
          >
            <X className="w-5 h-5" />
            Pass
          </Button>
          <Button 
            onClick={onLike} 
            size="lg" 
            className="flex-1 gap-2 h-12"
          >
            <Heart className="w-5 h-5" />
            Like
          </Button>
        </div>
      </div>
    </div>
  );
};

// Enhanced Content Card Component  
const ContentCard = ({ content, onLike, onShare }: {
  content: ContentItem;
  onLike: () => void;
  onShare: () => void;
}) => {
  const isVideo = content.content_type.startsWith('video/');

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

      {/* Content Media - Bigger aspect ratio */}
      <div className="aspect-square relative bg-muted">
        {isVideo ? (
          <video 
            src={content.file_url}
            className="w-full h-full object-cover"
            controls
            playsInline
            preload="metadata"
            poster={content.thumbnail_url}
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