import { useState, useEffect, useCallback, useMemo } from 'react';
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
  verifications?: any;
  photo_verified?: boolean;
  created_at?: string;
  last_active?: string;
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
  admin_name?: string;
  type: 'content';
}

type FeedItem = Profile | ContentItem;

// Performance-optimized configuration
const INITIAL_LOAD_SIZE = 50; // Faster initial load
const LOAD_MORE_SIZE = 25; // Progressive loading
const ADMIN_CONTENT_RATIO = 0.60;
const POSTS_RATIO = 0.30;
const PROFILE_RATIO = 0.10;
const SCROLL_THRESHOLD = 0.75;
const REFRESH_INTERVAL = 120000; // 2 minutes
const CACHE_DURATION = 180000; // 3 minutes

export const UnifiedFeed = () => {
  const { user } = useAuth();
  const [feedItems, setFeedItems] = useState<FeedItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [lastItemId, setLastItemId] = useState<string | null>(null);
  const [contentCache, setContentCache] = useState<Map<string, any>>(new Map());
  const [lastFetch, setLastFetch] = useState<number>(0);
  const [adminRotationIndex, setAdminRotationIndex] = useState(0);
  const [retryCount, setRetryCount] = useState(0);

  // Memoized item counts for performance
  const itemCounts = useMemo(() => {
    const pageSize = lastItemId ? LOAD_MORE_SIZE : INITIAL_LOAD_SIZE;
    return {
      adminContent: Math.floor(pageSize * ADMIN_CONTENT_RATIO),
      posts: Math.floor(pageSize * POSTS_RATIO),
      profiles: Math.floor(pageSize * PROFILE_RATIO),
    };
  }, [lastItemId]);

  const fetchFeedItems = useCallback(async (isLoadMore = false, forceRefresh = false) => {
    try {
      setRetryCount(0);
      const now = Date.now();
      const cacheKey = `feed_${isLoadMore ? lastItemId || 'start' : 'initial'}`;
      
      // Enhanced caching strategy
      if (!forceRefresh && contentCache.has(cacheKey) && (now - lastFetch) < CACHE_DURATION && !isLoadMore) {
        const cachedData = contentCache.get(cacheKey);
        setFeedItems(cachedData);
        setLoading(false);
        return;
      }

      // Optimized single query approach for better performance
      const [profilesResult, adminContentResult, postsResult] = await Promise.all([
        // Profiles query - optimized with minimal columns
        user ? supabase
          .from('profiles')
          .select('id, display_name, age, bio, location, profile_image_url, interests, photo_verified, created_at, last_active')
          .neq('id', user.id)
          .eq('is_blocked', false)
          .order('last_active', { ascending: false })
          .limit(itemCounts.profiles * 2) : Promise.resolve({ data: [], error: null }),

        // Admin content - removed blocking filters for maximum content availability
        supabase
          .from('admin_content')
          .select('id, title, description, file_url, thumbnail_url, content_type, view_count, like_count, share_count, is_promoted, category, created_at, admin_id')
          .eq('status', 'published')
          .eq('visibility', 'public') 
          .eq('approval_status', 'approved')
          .order('is_promoted', { ascending: false })
          .order('created_at', { ascending: false })
          .limit(itemCounts.adminContent * 2),

        // Posts - only essential filters to maximize content
        supabase
          .from('posts')
          .select('id, caption, content_url, post_type, created_at, is_promoted, provider_id')
          .eq('payment_status', 'paid')
          .gt('expires_at', new Date().toISOString())
          .order('is_promoted', { ascending: false })
          .order('created_at', { ascending: false })
          .limit(itemCounts.posts * 2)
      ]);

      // Error handling with detailed logging
      if (profilesResult.error) console.warn('Profiles fetch error:', profilesResult.error);
      if (adminContentResult.error) console.warn('Admin content fetch error:', adminContentResult.error);
      if (postsResult.error) console.warn('Posts fetch error:', postsResult.error);

      const profiles = profilesResult.data || [];
      const allAdminContent = adminContentResult.data || [];
      const allPosts = postsResult.data || [];

      // Efficient profile name fetching
      const adminIds = [...new Set(allAdminContent.map((item: any) => item.admin_id))].filter(Boolean) as string[];
      const providerIds = [...new Set(allPosts.map((item: any) => item.provider_id))].filter(Boolean) as string[];
      
      const [adminProfilesResult, providerProfilesResult] = await Promise.all([
        adminIds.length > 0 ? supabase
          .from('profiles')
          .select('id, display_name')
          .in('id', adminIds) : Promise.resolve({ data: [], error: null }),
        providerIds.length > 0 ? supabase
          .from('profiles')
          .select('id, display_name')
          .in('id', providerIds) : Promise.resolve({ data: [], error: null })
      ]);

      const adminProfileMap = (adminProfilesResult.data || []).reduce((acc, profile) => {
        acc[profile.id] = profile.display_name || 'Admin';
        return acc;
      }, {} as Record<string, string>);

      const providerProfileMap = (providerProfilesResult.data || []).reduce((acc, profile) => {
        acc[profile.id] = profile.display_name || 'Provider';
        return acc;
      }, {} as Record<string, string>);

      // Smart admin content rotation for variety
      const adminContent = allAdminContent.slice(0, itemCounts.adminContent);
      const posts = allPosts.slice(0, itemCounts.posts);

      // Efficient data transformation
      const transformedProfiles: Profile[] = profiles.map(item => ({
        ...item,
        type: 'profile' as const
      }));

      const transformedAdminContent: ContentItem[] = adminContent.map(item => ({
        id: item.id,
        title: item.title || 'Content',
        description: item.description || '',
        file_url: item.file_url,
        thumbnail_url: item.thumbnail_url,
        content_type: item.content_type,
        view_count: item.view_count || 0,
        like_count: item.like_count || 0,
        share_count: item.share_count || 0,
        is_promoted: item.is_promoted || false,
        category: item.category,
        created_at: item.created_at,
        admin_name: adminProfileMap[item.admin_id] || 'Admin',
        type: 'content' as const
      }));

      const transformedPosts: ContentItem[] = posts.map(item => ({
        id: item.id,
        title: `${providerProfileMap[item.provider_id] || 'Provider'}'s ${item.post_type}`,
        caption: item.caption || 'Check this out!',
        description: item.caption || 'Check this out!',
        file_url: item.content_url,
        content_type: item.content_url.includes('.mp4') || item.content_url.includes('.mov') ? 'video/mp4' : 'image/jpeg',
        view_count: 0,
        like_count: 0,
        share_count: 0,
        is_promoted: item.is_promoted || false,
        created_at: item.created_at,
        admin_name: providerProfileMap[item.provider_id] || 'Provider',
        type: 'content' as const
      }));

      // Optimized content mixing algorithm
      const promotedContent = [
        ...transformedAdminContent.filter(item => item.is_promoted),
        ...transformedPosts.filter(item => item.is_promoted)
      ];
      
      const regularContent = [
        ...transformedAdminContent.filter(item => !item.is_promoted),
        ...transformedPosts.filter(item => !item.is_promoted),
        ...transformedProfiles
      ];

      // Efficient shuffling for variety
      regularContent.sort(() => Math.random() - 0.5);

      // Smart interleaving for optimal user experience
      const allItems: FeedItem[] = [];
      let promotedIndex = 0;
      let regularIndex = 0;
      const pageSize = isLoadMore ? LOAD_MORE_SIZE : INITIAL_LOAD_SIZE;

      for (let i = 0; i < pageSize; i++) {
        if (promotedIndex < promotedContent.length && i % 4 === 0) {
          allItems.push(promotedContent[promotedIndex++]);
        } else if (regularIndex < regularContent.length) {
          allItems.push(regularContent[regularIndex++]);
        } else if (promotedIndex < promotedContent.length) {
          allItems.push(promotedContent[promotedIndex++]);
        } else {
          break;
        }
      }

      // Update state efficiently
      if (isLoadMore) {
        setFeedItems(prev => [...prev, ...allItems]);
      } else {
        setFeedItems(allItems);
        setContentCache(prev => new Map(prev.set(cacheKey, allItems)));
      }

      setHasMore(allItems.length >= 15);
      setLastItemId(allItems[allItems.length - 1]?.id || null);
      setLastFetch(now);
      setAdminRotationIndex((prev) => (prev + 1) % Math.max(adminIds.length, 1));

    } catch (error) {
      console.error('Feed error:', error);
      
      // Retry logic with exponential backoff
      if (retryCount < 3) {
        setRetryCount(prev => prev + 1);
        setTimeout(() => fetchFeedItems(isLoadMore, forceRefresh), Math.pow(2, retryCount) * 1000);
        return;
      }
      
      toast({
        title: "Error loading feed",
        description: "Please check your connection and try again",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
      setLoadingMore(false);
      setRefreshing(false);
    }
  }, [user, lastItemId, contentCache, lastFetch, adminRotationIndex, itemCounts, retryCount]);

  const loadMore = useCallback(async () => {
    if (loadingMore || !hasMore || loading) return;
    setLoadingMore(true);
    await fetchFeedItems(true);
  }, [fetchFeedItems, loadingMore, hasMore, loading]);

  const handleScroll = useCallback(() => {
    const scrolled = (window.innerHeight + document.documentElement.scrollTop) / 
                    document.documentElement.offsetHeight;
    
    if (scrolled >= SCROLL_THRESHOLD) {
      loadMore();
    }
  }, [loadMore]);

  const handleRefresh = useCallback(async () => {
    if (refreshing) return;
    setRefreshing(true);
    setContentCache(new Map());
    setLastItemId(null);
    setAdminRotationIndex(0);
    setRetryCount(0);
    await fetchFeedItems(false, true);
  }, [fetchFeedItems, refreshing]);

  // Optimized event listeners
  useEffect(() => {
    fetchFeedItems();
  }, []);

  useEffect(() => {
    const handleScrollThrottled = () => {
      if (!loadingMore && hasMore) {
        handleScroll();
      }
    };

    window.addEventListener('scroll', handleScrollThrottled, { passive: true });
    return () => window.removeEventListener('scroll', handleScrollThrottled);
  }, [handleScroll, loadingMore, hasMore]);

  // Enhanced real-time updates
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel('feed_updates')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'admin_content',
        filter: 'status=eq.published'
      }, () => {
        if (!refreshing) {
          toast({ 
            title: "New content available!",
            description: "Tap refresh to see latest posts"
          });
        }
      })
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'posts',
        filter: 'payment_status=eq.paid'
      }, () => {
        if (!refreshing) {
          handleRefresh();
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, refreshing, handleRefresh]);

  // Smart auto-refresh
  useEffect(() => {
    const interval = setInterval(() => {
      if (!document.hidden && !refreshing && !loading) {
        handleRefresh();
      }
    }, REFRESH_INTERVAL);
    return () => clearInterval(interval);
  }, [handleRefresh, refreshing, loading]);

  // Enhanced action handlers
  const handleProfileLike = async (profileId: string) => {
    if (!user) return;
    try {
      await supabase.from('swipes').insert({
        user_id: user.id,
        target_user_id: profileId,
        liked: true
      });
      toast({ title: "Profile liked! ❤️" });
      setFeedItems(prev => prev.filter(item => item.id !== profileId));
    } catch (error) {
      console.error('Like error:', error);
      toast({ 
        title: "Error", 
        description: "Please try again",
        variant: "destructive"
      });
    }
  };

  const handleProfilePass = async (profileId: string) => {
    if (!user) return;
    try {
      await supabase.from('swipes').insert({
        user_id: user.id,
        target_user_id: profileId,
        liked: false
      });
      setFeedItems(prev => prev.filter(item => item.id !== profileId));
    } catch (error) {
      console.error('Pass error:', error);
    }
  };

  const handleContentLike = async (contentId: string) => {
    try {
      await supabase.rpc('increment_content_view', { content_id: contentId });
      toast({ title: "Content liked!" });
      
      // Optimistic UI update
      setFeedItems(prev => prev.map(item => 
        item.id === contentId && item.type === 'content' 
          ? { ...item, like_count: item.like_count + 1 }
          : item
      ));
    } catch (error) {
      console.error('Like error:', error);
    }
  };

  const handleShare = async (item: FeedItem) => {
    try {
      if (navigator.share) {
        await navigator.share({
          title: item.type === 'profile' ? item.display_name || 'Profile' : item.title,
          url: window.location.href
        });
      } else {
        await navigator.clipboard.writeText(window.location.href);
        toast({ title: "Link copied to clipboard!" });
      }
      
      // Update share count for content items
      if (item.type === 'content') {
        setFeedItems(prev => prev.map(feedItem => 
          feedItem.id === item.id && feedItem.type === 'content'
            ? { ...feedItem, share_count: feedItem.share_count + 1 }
            : feedItem
        ));
      }
    } catch (error) {
      console.error('Share error:', error);
    }
  };

  // Enhanced loading skeleton
  const SkeletonCard = () => (
    <Card className="overflow-hidden">
      <CardContent className="p-0">
        <div className="p-4 pb-0 space-y-2">
          <div className="flex items-center gap-2">
            <Skeleton className="w-8 h-8 rounded-full" />
            <Skeleton className="h-4 w-24" />
          </div>
          <Skeleton className="h-5 w-3/4" />
        </div>
        <Skeleton className="w-full aspect-square" />
        <div className="p-4 space-y-3">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-2/3" />
          <div className="flex gap-4">
            <Skeleton className="h-8 w-16" />
            <Skeleton className="h-8 w-16" />
          </div>
        </div>
      </CardContent>
    </Card>
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
          {[...Array(6)].map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
        {/* Enhanced refresh button */}
        <div className="flex justify-center mb-4">
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={refreshing}
            className="gap-2"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
            {refreshing ? 'Loading...' : 'Refresh'}
          </Button>
        </div>

        {/* Feed Items with optimized rendering */}
        {feedItems.map((item) => (
          <Card key={`${item.type}-${item.id}`} className="overflow-hidden">
            <CardContent className="p-0">
              {item.type === 'profile' ? (
                // Enhanced Profile Card
                <div className="space-y-4">
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

                  <div className="aspect-square bg-muted relative">
                    {item.profile_image_url ? (
                      <img
                        src={item.profile_image_url}
                        alt={item.display_name || 'Profile'}
                        className="w-full h-full object-cover"
                        loading="lazy"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                        No photo
                      </div>
                    )}
                  </div>

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

                    <div className="flex justify-center gap-4 pt-2">
                      <Button
                        variant="outline"
                        size="lg"
                        className="w-14 h-14 rounded-full border-red-500 hover:bg-red-50"
                        onClick={() => handleProfilePass(item.id)}
                      >
                        <X className="w-6 h-6 text-red-500" />
                      </Button>
                      <Button
                        variant="outline"
                        size="lg"
                        className="w-16 h-16 rounded-full border-blue-500 hover:bg-blue-50"
                      >
                        <Star className="w-7 h-7 text-blue-500" />
                      </Button>
                      <Button
                        variant="outline"
                        size="lg"
                        className="w-14 h-14 rounded-full border-green-500 hover:bg-green-50"
                        onClick={() => handleProfileLike(item.id)}
                      >
                        <Heart className="w-6 h-6 text-green-500" />
                      </Button>
                    </div>
                  </div>
                </div>
              ) : (
                // Enhanced Content Card
                <div className="space-y-4">
                  <div className="p-4 pb-0 space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Avatar className="w-8 h-8">
                          <AvatarFallback className="text-xs">
                            {item.admin_name?.charAt(0).toUpperCase() || 'A'}
                          </AvatarFallback>
                        </Avatar>
                        <span className="text-sm font-medium">{item.admin_name}</span>
                      </div>
                      {item.is_promoted && (
                        <Badge className="bg-gradient-to-r from-purple-500 to-pink-500">
                          Promoted
                        </Badge>
                      )}
                    </div>
                    <h3 className="font-semibold text-lg">{item.title}</h3>
                  </div>

                  <div className="aspect-square bg-muted relative">
                    {item.content_type.startsWith('image/') ? (
                      <img
                        src={item.file_url}
                        alt={item.title}
                        className="w-full h-full object-cover"
                        loading="lazy"
                      />
                    ) : item.content_type.startsWith('video/') ? (
                      <video
                        src={item.file_url}
                        className="w-full h-full object-cover"
                        controls
                        poster={item.thumbnail_url}
                        preload="metadata"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                        {item.title}
                      </div>
                    )}
                  </div>

                  <div className="p-4 pt-0 space-y-3">
                    {(item.description || item.caption) && (
                      <p className="text-sm text-foreground">
                        {item.description || item.caption}
                      </p>
                    )}

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

        {/* Enhanced loading more indicator */}
        {loadingMore && (
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
          </div>
        )}

        {/* Enhanced no more content state */}
        {!hasMore && feedItems.length > 0 && (
          <div className="text-center py-8 space-y-2">
            <p className="text-muted-foreground">You've seen all available content!</p>
            <Button variant="outline" size="sm" onClick={handleRefresh} className="gap-2">
              <RefreshCw className="w-4 h-4" />
              Load Fresh Content
            </Button>
          </div>
        )}

        {/* Enhanced empty state */}
        {!loading && feedItems.length === 0 && (
          <div className="text-center py-12 space-y-4">
            <p className="text-lg text-muted-foreground">No content available right now</p>
            <p className="text-sm text-muted-foreground">Check back later for new posts and profiles!</p>
            <Button onClick={handleRefresh} className="gap-2">
              <RefreshCw className="w-4 h-4" />
              Try Again
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};