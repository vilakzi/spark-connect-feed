import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Heart, X, Star, MessageCircle, Share, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
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
  verifications?: any;
  photo_verified?: boolean;
  type: 'profile';
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
  caption?: string;
  type: 'content';
}

type FeedItem = Profile | ContentItem;

const ITEMS_PER_PAGE = 10;

export const UnifiedFeed = () => {
  const { user } = useAuth();
  const [feedItems, setFeedItems] = useState<FeedItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [offset, setOffset] = useState(0);

  const fetchFeedItems = useCallback(async (isLoadMore = false) => {
    if (!user) return;

    try {
      const currentOffset = isLoadMore ? offset : 0;
      
      // Fetch profiles (excluding already swiped ones)
      const { data: swipedProfiles } = await supabase
        .from('swipes')
        .select('target_user_id')
        .eq('user_id', user.id);

      const swipedIds = swipedProfiles?.map(s => s.target_user_id) || [];

      const { data: profiles } = await supabase
        .from('profiles')
        .select('*')
        .neq('id', user.id)
        .eq('is_blocked', false)
        .not('id', 'in', `(${swipedIds.length ? swipedIds.join(',') : 'null'})`)
        .order('last_active', { ascending: false })
        .range(currentOffset, currentOffset + Math.floor(ITEMS_PER_PAGE / 2) - 1);

      // Fetch admin content
      const { data: adminContent } = await supabase
        .from('admin_content')
        .select('*')
        .eq('status', 'published')
        .eq('visibility', 'public')
        .eq('approval_status', 'approved')
        .order('created_at', { ascending: false })
        .range(currentOffset, currentOffset + Math.floor(ITEMS_PER_PAGE / 4) - 1);

      // Fetch posts
      const { data: posts } = await supabase
        .from('posts')
        .select('*')
        .eq('payment_status', 'paid')
        .gt('expires_at', new Date().toISOString())
        .order('created_at', { ascending: false })
        .range(currentOffset, currentOffset + Math.floor(ITEMS_PER_PAGE / 4) - 1);

      // Transform data to unified format
      const transformedProfiles: Profile[] = (profiles || []).map(item => ({
        ...item,
        type: 'profile' as const
      }));

      const transformedAdminContent: ContentItem[] = (adminContent || []).map(item => ({
        id: item.id,
        title: item.title,
        description: item.description,
        file_url: item.file_url,
        thumbnail_url: item.thumbnail_url,
        content_type: item.content_type,
        view_count: item.view_count || 0,
        like_count: item.like_count || 0,
        share_count: item.share_count || 0,
        is_promoted: item.is_promoted || false,
        category: item.category,
        created_at: item.created_at,
        type: 'content' as const
      }));

      const transformedPosts: ContentItem[] = (posts || []).map(item => ({
        id: item.id,
        title: `${item.post_type} Post`,
        caption: item.caption,
        file_url: item.content_url,
        content_type: 'image/jpeg',
        view_count: 0,
        like_count: 0,
        share_count: 0,
        is_promoted: item.is_promoted || false,
        created_at: item.created_at,
        type: 'content' as const
      }));

      // Mix all items and sort by creation date/activity
      const allItems = [...transformedProfiles, ...transformedAdminContent, ...transformedPosts]
        .sort(() => Math.random() - 0.5); // Randomize order for diverse feed

      if (isLoadMore) {
        setFeedItems(prev => [...prev, ...allItems]);
      } else {
        setFeedItems(allItems);
      }

      setHasMore(allItems.length === ITEMS_PER_PAGE);
      setOffset(currentOffset + allItems.length);
    } catch (error) {
      console.error('Error fetching feed items:', error);
      toast({
        title: "Error loading feed",
        description: "Please try again later",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [user, offset]);

  const loadMore = useCallback(async () => {
    if (loadingMore || !hasMore) return;
    setLoadingMore(true);
    await fetchFeedItems(true);
  }, [fetchFeedItems, loadingMore, hasMore]);

  const handleScroll = useCallback(() => {
    if (
      window.innerHeight + document.documentElement.scrollTop >=
      document.documentElement.offsetHeight - 1000
    ) {
      loadMore();
    }
  }, [loadMore]);

  useEffect(() => {
    fetchFeedItems();
  }, []);

  useEffect(() => {
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [handleScroll]);

  const handleProfileLike = async (profileId: string) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('swipes')
        .insert({
          user_id: user.id,
          target_user_id: profileId,
          liked: true
        });

      if (error) throw error;

      toast({
        title: "Profile liked! ❤️",
        description: "We'll let you know if it's a match"
      });

      setFeedItems(prev => prev.filter(item => item.id !== profileId));
    } catch (error) {
      console.error('Error liking profile:', error);
    }
  };

  const handleProfilePass = async (profileId: string) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('swipes')
        .insert({
          user_id: user.id,
          target_user_id: profileId,
          liked: false
        });

      if (error) throw error;

      setFeedItems(prev => prev.filter(item => item.id !== profileId));
    } catch (error) {
      console.error('Error passing profile:', error);
    }
  };

  const handleContentLike = async (contentId: string) => {
    try {
      await supabase.rpc('increment_content_view', { content_id: contentId });
      toast({ title: "Content liked!" });
    } catch (error) {
      console.error('Error liking content:', error);
    }
  };

  const handleShare = async (item: FeedItem) => {
    try {
      if (navigator.share) {
        await navigator.share({
          title: item.type === 'profile' ? item.display_name || 'Profile' : item.title,
          text: item.type === 'profile' ? item.bio || '' : item.description || '',
          url: window.location.href
        });
      } else {
        await navigator.clipboard.writeText(window.location.href);
        toast({ title: "Link copied to clipboard!" });
      }
    } catch (error) {
      console.error('Error sharing:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
        {feedItems.map((item) => (
          <Card key={item.id} className="overflow-hidden">
            <CardContent className="p-0">
              {item.type === 'profile' ? (
                // Profile Card
                <div className="space-y-4">
                  {/* Profile Header */}
                  <div className="p-4 pb-0 flex items-center gap-3">
                    <Avatar className="w-12 h-12">
                      <AvatarImage src={item.profile_image_url || ''} />
                      <AvatarFallback>
                        {item.display_name?.charAt(0).toUpperCase() || 'U'}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-lg">
                          {item.display_name || 'Anonymous'}
                          {item.age && <span className="text-muted-foreground">, {item.age}</span>}
                        </h3>
                        {item.photo_verified && (
                          <Badge variant="secondary" className="text-xs">Verified</Badge>
                        )}
                      </div>
                      {item.location && (
                        <p className="text-sm text-muted-foreground">{item.location}</p>
                      )}
                    </div>
                  </div>

                  {/* Profile Image */}
                  <div className="aspect-square bg-muted relative">
                    {item.profile_image_url ? (
                      <img
                        src={item.profile_image_url}
                        alt={item.display_name || 'Profile'}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                        No photo
                      </div>
                    )}
                  </div>

                  {/* Profile Info */}
                  <div className="p-4 pt-0 space-y-3">
                    {item.bio && (
                      <p className="text-sm text-foreground">{item.bio}</p>
                    )}

                    {item.interests && item.interests.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {item.interests.slice(0, 3).map((interest, index) => (
                          <Badge key={index} variant="outline" className="text-xs">
                            {interest}
                          </Badge>
                        ))}
                        {item.interests.length > 3 && (
                          <Badge variant="outline" className="text-xs">
                            +{item.interests.length - 3} more
                          </Badge>
                        )}
                      </div>
                    )}

                    {/* Profile Actions */}
                    <div className="flex justify-center gap-4 pt-2">
                      <Button
                        variant="outline"
                        size="lg"
                        className="w-14 h-14 rounded-full border-red-500 hover:bg-red-50 hover:border-red-600"
                        onClick={() => handleProfilePass(item.id)}
                      >
                        <X className="w-6 h-6 text-red-500" />
                      </Button>

                      <Button
                        variant="outline"
                        size="lg"
                        className="w-16 h-16 rounded-full border-blue-500 hover:bg-blue-50 hover:border-blue-600"
                      >
                        <Star className="w-7 h-7 text-blue-500" />
                      </Button>

                      <Button
                        variant="outline"
                        size="lg"
                        className="w-14 h-14 rounded-full border-green-500 hover:bg-green-50 hover:border-green-600"
                        onClick={() => handleProfileLike(item.id)}
                      >
                        <Heart className="w-6 h-6 text-green-500" />
                      </Button>
                    </div>
                  </div>
                </div>
              ) : (
                // Content Card
                <div className="space-y-4">
                  {/* Content Header */}
                  <div className="p-4 pb-0 flex items-center justify-between">
                    <h3 className="font-semibold text-lg">{item.title}</h3>
                    {item.is_promoted && (
                      <Badge className="bg-gradient-to-r from-purple-500 to-pink-500">
                        Promoted
                      </Badge>
                    )}
                  </div>

                  {/* Content Media */}
                  <div className="aspect-square bg-muted relative">
                    {item.content_type.startsWith('image/') ? (
                      <img
                        src={item.file_url}
                        alt={item.title}
                        className="w-full h-full object-cover"
                      />
                    ) : item.content_type.startsWith('video/') ? (
                      <video
                        src={item.file_url}
                        className="w-full h-full object-cover"
                        controls
                        poster={item.thumbnail_url}
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                        {item.title}
                      </div>
                    )}
                  </div>

                  {/* Content Info */}
                  <div className="p-4 pt-0 space-y-3">
                    {(item.description || item.caption) && (
                      <p className="text-sm text-foreground">
                        {item.description || item.caption}
                      </p>
                    )}

                    {/* Content Actions */}
                    <div className="flex items-center justify-between">
                      <div className="flex gap-4">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleContentLike(item.id)}
                          className="gap-2"
                        >
                          <Heart className="w-4 h-4" />
                          {item.like_count}
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleShare(item)}
                          className="gap-2"
                        >
                          <Share className="w-4 h-4" />
                          {item.share_count}
                        </Button>
                      </div>
                      <div className="flex items-center gap-1 text-sm text-muted-foreground">
                        <Eye className="w-4 h-4" />
                        {item.view_count}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        ))}

        {loadingMore && (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
          </div>
        )}

        {!hasMore && feedItems.length > 0 && (
          <div className="text-center py-8">
            <p className="text-muted-foreground">You've reached the end!</p>
          </div>
        )}
      </div>
    </div>
  );
};