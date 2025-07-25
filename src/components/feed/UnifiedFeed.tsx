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

// Ultra-optimized feed configuration
const ITEMS_PER_PAGE = 120; // Load more content at once
const ADMIN_CONTENT_RATIO = 0.60; // More admin content
const POSTS_RATIO = 0.30; // Good post ratio
const PROFILE_RATIO = 0.10; // Fewer profiles for speed
const SCROLL_THRESHOLD = 0.65; // Load earlier
const REFRESH_INTERVAL = 180000; // 3 minutes
const CACHE_DURATION = 300000; // 5 minutes

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

  const fetchFeedItems = useCallback(async (isLoadMore = false, forceRefresh = false) => {
    try {
      const now = Date.now();
      const cacheKey = `feed_${isLoadMore ? lastItemId || 'start' : 'initial'}`;
      
      // Use cache if available and not force refresh
      if (!forceRefresh && contentCache.has(cacheKey) && (now - lastFetch) < CACHE_DURATION && !isLoadMore) {
        const cachedData = contentCache.get(cacheKey);
        setFeedItems(cachedData);
        setLoading(false);
        return;
      }
      
      // Calculate items per content type
      const adminContentCount = Math.floor(ITEMS_PER_PAGE * ADMIN_CONTENT_RATIO);
      const postsCount = Math.floor(ITEMS_PER_PAGE * POSTS_RATIO);
      const profilesCount = Math.floor(ITEMS_PER_PAGE * PROFILE_RATIO);

      // Parallel fetch for maximum performance
      const promises = [];

      // Fetch profiles (only if authenticated)
      if (user) {
        const profilePromise = supabase
          .from('profiles')
          .select('*')
          .neq('id', user.id)
          .eq('is_blocked', false)
          .order('last_active', { ascending: false })
          .limit(profilesCount * 2);
        promises.push(profilePromise);
      } else {
        promises.push(Promise.resolve({ data: [], error: null }));
      }

      // Fetch admin content - removed all filters that could block content
      const adminContentPromise = supabase
        .from('admin_content')
        .select('*')
        .eq('status', 'published')
        .eq('visibility', 'public')
        .eq('approval_status', 'approved')
        .order('is_promoted', { ascending: false })
        .order('created_at', { ascending: false })
        .limit(adminContentCount * 2);
      promises.push(adminContentPromise);

      // Fetch posts - removed filters to show all available content
      const postsPromise = supabase
        .from('posts')
        .select('*')
        .eq('payment_status', 'paid')
        .gt('expires_at', new Date().toISOString())
        .order('is_promoted', { ascending: false })
        .order('created_at', { ascending: false })
        .limit(postsCount * 2);
      promises.push(postsPromise);

      const [profilesResult, adminContentResult, postsResult] = await Promise.all(promises);

      const profiles = profilesResult.data || [];
      const allAdminContent = adminContentResult.data || [];
      const allPosts = postsResult.data || [];

      // Get admin and provider profile names
      const adminIds = [...new Set(allAdminContent.map((item: any) => item.admin_id))].filter(Boolean) as string[];
      const providerIds = [...new Set(allPosts.map((item: any) => item.provider_id))].filter(Boolean) as string[];
      
      const [adminProfilesResult, providerProfilesResult] = await Promise.all([
        adminIds.length > 0 ? supabase.from('profiles').select('id, display_name').in('id', adminIds) : Promise.resolve({ data: [], error: null }),
        providerIds.length > 0 ? supabase.from('profiles').select('id, display_name').in('id', providerIds) : Promise.resolve({ data: [], error: null })
      ]);

      const adminProfileMap = (adminProfilesResult.data || []).reduce((acc, profile) => {
        acc[profile.id] = profile.display_name || 'Admin';
        return acc;
      }, {} as Record<string, string>);

      const providerProfileMap = (providerProfilesResult.data || []).reduce((acc, profile) => {
        acc[profile.id] = profile.display_name || 'Provider';
        return acc;
      }, {} as Record<string, string>);

      // Balanced admin content distribution
      const adminGroups = allAdminContent.reduce((acc, item) => {
        const adminId = item.admin_id;
        if (!acc[adminId]) acc[adminId] = [];
        acc[adminId].push(item);
        return acc;
      }, {} as Record<string, any[]>);

      const availableAdminIds = Object.keys(adminGroups);
      const balancedAdminContent: any[] = [];
      
      if (availableAdminIds.length > 0) {
        const itemsPerAdmin = Math.ceil(adminContentCount / availableAdminIds.length);
        
        availableAdminIds.forEach((adminId, index) => {
          const startIndex = (adminRotationIndex + index) % adminGroups[adminId].length;
          const adminItems = adminGroups[adminId].slice(startIndex, startIndex + itemsPerAdmin);
          balancedAdminContent.push(...adminItems);
        });
      }

      const adminContent = balancedAdminContent.slice(0, adminContentCount);
      const posts = allPosts.slice(0, postsCount);

      // Transform to unified format
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
        caption: item.caption || 'Amazing content!',
        description: item.caption || 'Amazing content!',
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

      // Intelligent mixing algorithm
      const promotedContent = [
        ...transformedAdminContent.filter(item => item.is_promoted),
        ...transformedPosts.filter(item => item.is_promoted)
      ];
      
      const regularContent = [
        ...transformedAdminContent.filter(item => !item.is_promoted),
        ...transformedPosts.filter(item => !item.is_promoted),
        ...transformedProfiles
      ];

      // Shuffle regular content for variety
      regularContent.sort(() => Math.random() - 0.5);

      // Interleave promoted and regular content
      const allItems = [];
      let promotedIndex = 0;
      let regularIndex = 0;

      for (let i = 0; i < ITEMS_PER_PAGE; i++) {
        if (promotedIndex < promotedContent.length && i % 3 === 0) {
          allItems.push(promotedContent[promotedIndex++]);
        } else if (regularIndex < regularContent.length) {
          allItems.push(regularContent[regularIndex++]);
        } else if (promotedIndex < promotedContent.length) {
          allItems.push(promotedContent[promotedIndex++]);
        } else {
          break;
        }
      }

      console.log('🎯 Feed loaded:', {
        total: allItems.length,
        promoted: promotedContent.length,
        regular: regularContent.length,
        admin: transformedAdminContent.length,
        posts: transformedPosts.length,
        profiles: transformedProfiles.length
      });

      // Update state
      if (isLoadMore) {
        setFeedItems(prev => [...prev, ...allItems]);
      } else {
        setFeedItems(allItems);
        setContentCache(prev => new Map(prev.set(cacheKey, allItems)));
      }

      setHasMore(allItems.length >= 20);
      setLastItemId(allItems[allItems.length - 1]?.id || null);
      setLastFetch(now);
      setAdminRotationIndex((prev) => (prev + 1) % Math.max(availableAdminIds.length, 1));

    } catch (error) {
      console.error('Feed error:', error);
      toast({
        title: "Error loading feed",
        description: "Please try refreshing",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
      setLoadingMore(false);
      setRefreshing(false);
    }
  }, [user, lastItemId, contentCache, lastFetch, adminRotationIndex]);

  const loadMore = useCallback(async () => {
    if (loadingMore || !hasMore) return;
    setLoadingMore(true);
    await fetchFeedItems(true);
  }, [fetchFeedItems, loadingMore, hasMore]);

  const handleScroll = useCallback(() => {
    const scrolled = (window.innerHeight + document.documentElement.scrollTop) / 
                    document.documentElement.offsetHeight;
    
    if (scrolled >= SCROLL_THRESHOLD) {
      loadMore();
    }
  }, [loadMore]);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    setContentCache(new Map());
    setLastItemId(null);
    setAdminRotationIndex(0);
    await fetchFeedItems(false, true);
  }, [fetchFeedItems]);

  // Event listeners
  useEffect(() => {
    fetchFeedItems();
  }, []);

  useEffect(() => {
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [handleScroll]);

  // Real-time updates
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
        toast({ title: "New content available!" });
        handleRefresh();
      })
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'posts',
        filter: 'payment_status=eq.paid'
      }, () => {
        handleRefresh();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, handleRefresh]);

  // Auto-refresh
  useEffect(() => {
    const interval = setInterval(() => {
      if (!document.hidden) {
        handleRefresh();
      }
    }, REFRESH_INTERVAL);
    return () => clearInterval(interval);
  }, [handleRefresh]);

  // Action handlers
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
      console.error('Error:', error);
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
      console.error('Error:', error);
    }
  };

  const handleContentLike = async (contentId: string) => {
    try {
      await supabase.rpc('increment_content_view', { content_id: contentId });
      toast({ title: "Content liked!" });
    } catch (error) {
      console.error('Error:', error);
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
        toast({ title: "Link copied!" });
      }
    } catch (error) {
      console.error('Error:', error);
    }
  };

  // Loading skeleton
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
        {/* Refresh Button */}
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

        {/* Feed Items */}
        {feedItems.map((item) => (
          <Card key={item.id} className="overflow-hidden">
            <CardContent className="p-0">
              {item.type === 'profile' ? (
                // Profile Card
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
                // Content Card
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

        {/* Loading More */}
        {loadingMore && (
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
          </div>
        )}

        {/* No More Content */}
        {!hasMore && feedItems.length > 0 && (
          <div className="text-center py-8 space-y-2">
            <p className="text-muted-foreground">You've seen all content!</p>
            <Button variant="outline" size="sm" onClick={handleRefresh} className="gap-2">
              <RefreshCw className="w-4 h-4" />
              Refresh
            </Button>
          </div>
        )}

        {/* Empty State */}
        {!loading && feedItems.length === 0 && (
          <div className="text-center py-12 space-y-4">
            <p className="text-lg text-muted-foreground">No content available</p>
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