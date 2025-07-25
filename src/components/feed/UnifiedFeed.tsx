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

// Optimized feed configuration
const ITEMS_PER_PAGE = 75; // Increased for better performance
const PROFILE_RATIO = 0.1;  // Reduced profiles ratio
const ADMIN_CONTENT_RATIO = 0.6; // Increased admin content
const POSTS_RATIO = 0.3;
const SCROLL_THRESHOLD = 0.8; // Load more at 80% scroll
const REFRESH_INTERVAL = 5 * 60 * 1000; // 5 minutes
const CACHE_DURATION = 10 * 60 * 1000; // 10 minutes

export const UnifiedFeed = () => {
  const { user } = useAuth();
  const [feedItems, setFeedItems] = useState<FeedItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [lastItemId, setLastItemId] = useState<string | null>(null);
  const [seenContent, setSeenContent] = useState<Set<string>>(new Set());
  const [contentCache, setContentCache] = useState<Map<string, any>>(new Map());
  const [lastFetch, setLastFetch] = useState<number>(0);
  const [adminRotationIndex, setAdminRotationIndex] = useState(0);

  const fetchFeedItems = useCallback(async (isLoadMore = false, forceRefresh = false) => {
    try {
      console.log('🔍 Starting fetchFeedItems...', { user: user?.id, isLoadMore, forceRefresh });
      
      // Check cache first (unless force refresh)
      const now = Date.now();
      const cacheKey = `feed_${isLoadMore ? lastItemId || 'start' : 'initial'}`;
      
      if (!forceRefresh && contentCache.has(cacheKey) && (now - lastFetch) < CACHE_DURATION && !isLoadMore) {
        const cachedData = contentCache.get(cacheKey);
        console.log('📦 Using cached data:', cachedData.length, 'items');
        setFeedItems(cachedData);
        setLoading(false);
        return;
      }
      
      // Calculate items per content type based on ratios
      const profilesCount = Math.floor(ITEMS_PER_PAGE * PROFILE_RATIO);
      const adminContentCount = Math.floor(ITEMS_PER_PAGE * ADMIN_CONTENT_RATIO);
      const postsCount = Math.floor(ITEMS_PER_PAGE * POSTS_RATIO);
      
      console.log('📊 Content distribution:', { profilesCount, adminContentCount, postsCount });

      // Fetch profiles (only if user is authenticated)
      let profiles = [];
      console.log('👤 User authentication status:', { 
        authenticated: !!user, 
        userId: user?.id,
        email: user?.email 
      });
      
      if (user) {
        const { data: swipedProfiles, error: swipesError } = await supabase
          .from('swipes')
          .select('target_user_id')
          .eq('user_id', user.id);

        console.log('👆 Swipes query:', { count: swipedProfiles?.length, error: swipesError });

        const swipedIds = swipedProfiles?.map(s => s.target_user_id) || [];

        const { data: profilesData, error: profilesError } = await supabase
          .from('profiles')
          .select('*')
          .neq('id', user.id)
          .eq('is_blocked', false)
          .not('id', 'in', `(${swipedIds.length ? swipedIds.join(',') : 'null'})`)
          .not('id', 'in', `(${Array.from(seenContent).join(',') || 'null'})`)
          .order('last_active', { ascending: false })
          .limit(profilesCount * 2);
        
        console.log('👥 Profiles query:', { count: profilesData?.length, error: profilesError });
        profiles = profilesData || [];
      }

      // First, let's check if we have any admin content at all (without authentication)
      const { data: publicAdminContentCheck, error: publicAdminError } = await supabase
        .from('admin_content')
        .select('id, title, status, visibility, approval_status, admin_id');

      console.log('🌐 Public admin content check (no filters):', {
        count: publicAdminContentCheck?.length,
        error: publicAdminError,
        sample: publicAdminContentCheck?.slice(0, 3)
      });

      // Check with basic filters
      const { data: adminContentCheck, error: adminError } = await supabase
        .from('admin_content')
        .select('id, title, status, visibility, approval_status, admin_id')
        .eq('status', 'published')
        .eq('visibility', 'public')
        .eq('approval_status', 'approved');

      console.log('📝 Admin content check (with filters):', {
        count: adminContentCheck?.length,
        error: adminError,
        sample: adminContentCheck?.slice(0, 3)
      });

      // Try fetching WITHOUT the seen content filter first
      const { data: allAdminContent, error: adminFetchError } = await supabase
        .from('admin_content')
        .select(`
          *,
          admin:profiles!admin_content_admin_id_fkey(id, display_name)
        `)
        .eq('status', 'published')
        .eq('visibility', 'public')
        .eq('approval_status', 'approved')
        .order('is_promoted', { ascending: false })
        .order('created_at', { ascending: false })
        .limit(adminContentCount * 2); // Fetch more to ensure variety

      console.log('📝 Admin content fetched (no seen filter):', {
        count: allAdminContent?.length,
        error: adminFetchError,
        seenContentSize: seenContent.size,
        firstItem: allAdminContent?.[0]
      });

      // Ensure balanced distribution across all admin accounts
      const adminGroups = (allAdminContent || []).reduce((acc, item) => {
        const adminId = item.admin_id;
        if (!acc[adminId]) acc[adminId] = [];
        acc[adminId].push(item);
        return acc;
      }, {} as Record<string, any[]>);

      // Rotate through admin accounts for balanced distribution
      const adminIds = Object.keys(adminGroups);
      const balancedAdminContent: any[] = [];
      const itemsPerAdmin = Math.ceil(adminContentCount / Math.max(adminIds.length, 1));

      adminIds.forEach((adminId, index) => {
        const startIndex = (adminRotationIndex + index) % adminGroups[adminId].length;
        const adminItems = adminGroups[adminId].slice(startIndex, startIndex + itemsPerAdmin);
        balancedAdminContent.push(...adminItems);
      });

      const adminContent = balancedAdminContent.slice(0, adminContentCount);
      console.log('⚖️ Balanced admin content:', {
        totalGroups: adminIds.length,
        finalCount: adminContent.length,
        adminIds: adminIds
      });

      // Extract admin profile data (already included in the query)
      const adminProfileMap = adminContent.reduce((acc, item) => {
        if (item.admin?.display_name) {
          acc[item.admin_id] = item.admin.display_name;
        }
        return acc;
      }, {} as Record<string, string>);

      // Check posts without filters first
      const { data: publicPostsCheck, error: publicPostsError } = await supabase
        .from('posts')
        .select('id, post_type, payment_status, expires_at, provider_id');

      console.log('🌐 Public posts check (no filters):', {
        count: publicPostsCheck?.length,
        error: publicPostsError,
        sample: publicPostsCheck?.slice(0, 3)
      });

      // Check posts with basic filters
      const { data: postsCheck, error: postsError } = await supabase
        .from('posts')
        .select('id, post_type, payment_status, expires_at, provider_id')
        .eq('payment_status', 'paid')
        .gt('expires_at', new Date().toISOString());

      console.log('📮 Posts check (with filters):', {
        count: postsCheck?.length,
        error: postsError,
        sample: postsCheck?.slice(0, 3)
      });

      // Optimized posts fetching with provider info (no seen filter)
      const { data: allPosts, error: postsFetchError } = await supabase
        .from('posts')
        .select(`
          *,
          provider:profiles!posts_provider_id_fkey(id, display_name)
        `)
        .eq('payment_status', 'paid')
        .gt('expires_at', new Date().toISOString())
        .order('is_promoted', { ascending: false })
        .order('created_at', { ascending: false })
        .limit(postsCount * 2); // Fetch more for variety

      console.log('📮 Posts fetched (no seen filter):', {
        count: allPosts?.length,
        error: postsFetchError,
        firstItem: allPosts?.[0]
      });

      const posts = (allPosts || []).slice(0, postsCount);

      // Extract provider profile data
      const providerProfileMap = posts.reduce((acc, item) => {
        if (item.provider?.display_name) {
          acc[item.provider_id] = item.provider.display_name;
        }
        return acc;
      }, {} as Record<string, string>);

      // Transform data to unified format
      const transformedProfiles: Profile[] = (profiles || []).map(item => ({
        ...item,
        type: 'profile' as const
      }));

      const transformedAdminContent: ContentItem[] = (adminContent || []).map(item => ({
        id: item.id,
        title: item.title || 'Untitled Content',
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

      const transformedPosts: ContentItem[] = (posts || []).map(item => ({
        id: item.id,
        title: providerProfileMap[item.provider_id] ? `${providerProfileMap[item.provider_id]}'s ${item.post_type}` : `${item.post_type} Post`,
        caption: item.caption || 'Check out this amazing content!',
        description: item.caption || 'Check out this amazing content!',
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

      // Mix items intelligently: prioritize promoted content, then mix by recency
      const promotedItems = [...transformedAdminContent.filter(item => item.is_promoted), 
                              ...transformedPosts.filter(item => item.is_promoted)];
      const regularItems = [...transformedProfiles, 
                            ...transformedAdminContent.filter(item => !item.is_promoted),
                            ...transformedPosts.filter(item => !item.is_promoted)];
      
      // Sort regular items by creation date/activity
      regularItems.sort((a, b) => {
        const aDate = new Date(
          a.type === 'profile' 
            ? (a as Profile).created_at || (a as Profile).last_active || 0
            : (a as ContentItem).created_at
        );
        const bDate = new Date(
          b.type === 'profile'
            ? (b as Profile).created_at || (b as Profile).last_active || 0
            : (b as ContentItem).created_at
        );
        return bDate.getTime() - aDate.getTime();
      });

      // Intelligent content mixing with better distribution
      const allItems = [];
      
      // Add promoted content first
      const promotedContent = [...transformedAdminContent.filter(item => item.is_promoted),
                               ...transformedPosts.filter(item => item.is_promoted)];
      
      // Create a more balanced mix of regular content
      const regularContent = [
        ...transformedAdminContent.filter(item => !item.is_promoted),
        ...transformedPosts.filter(item => !item.is_promoted)
      ];
      
      // Sort regular content by freshness
      regularContent.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      
      // Interleave content types for better variety
      const mixedRegularContent = [];
      const contentTypes = ['admin', 'posts', 'profiles'];
      let typeIndex = 0;
      
      const contentByType = {
        admin: transformedAdminContent.filter(item => !item.is_promoted),
        posts: transformedPosts.filter(item => !item.is_promoted),
        profiles: transformedProfiles
      };
      
      while (mixedRegularContent.length < (ITEMS_PER_PAGE - promotedContent.length) && 
             (contentByType.admin.length + contentByType.posts.length + contentByType.profiles.length) > 0) {
        const currentType = contentTypes[typeIndex % contentTypes.length];
        if (contentByType[currentType].length > 0) {
          mixedRegularContent.push(contentByType[currentType].shift());
        }
        typeIndex++;
      }
      
      allItems.push(...promotedContent, ...mixedRegularContent);
      
      console.log('🎯 Final feed composition:', {
        totalItems: allItems.length,
        promotedCount: promotedContent.length,
        regularCount: mixedRegularContent.length,
        adminContentItems: transformedAdminContent.length,
        postsItems: transformedPosts.length,
        profilesItems: transformedProfiles.length
      });

      // Update seen content tracking
      const newSeenIds = new Set([...seenContent, ...allItems.map(item => item.id)]);
      setSeenContent(newSeenIds);

      // Update admin rotation for next fetch
      setAdminRotationIndex((prev) => (prev + 1) % Math.max(adminIds.length, 1));

      if (isLoadMore) {
        setFeedItems(prev => [...prev, ...allItems]);
      } else {
        setFeedItems(allItems);
        // Cache the initial load
        setContentCache(prev => new Map(prev.set(cacheKey, allItems)));
      }

      setHasMore(allItems.length >= ITEMS_PER_PAGE * 0.8); // More lenient hasMore check
      setLastItemId(allItems[allItems.length - 1]?.id || null);
      setLastFetch(now);
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
      setRefreshing(false);
    }
  }, [user, lastItemId, seenContent, contentCache, lastFetch, adminRotationIndex]);

  const loadMore = useCallback(async () => {
    if (loadingMore || !hasMore) return;
    setLoadingMore(true);
    await fetchFeedItems(true);
  }, [fetchFeedItems, loadingMore, hasMore]);

  const handleScroll = useCallback(() => {
    const scrolledPercentage = (window.innerHeight + document.documentElement.scrollTop) / 
                              document.documentElement.offsetHeight;
    
    if (scrolledPercentage >= SCROLL_THRESHOLD) {
      loadMore();
    }
  }, [loadMore]);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    setSeenContent(new Set()); // Clear seen content for fresh experience
    setContentCache(new Map()); // Clear cache
    setLastItemId(null);
    setAdminRotationIndex(0);
    await fetchFeedItems(false, true);
  }, [fetchFeedItems]);

  useEffect(() => {
    fetchFeedItems();
  }, []);

  useEffect(() => {
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [handleScroll]);

  // Real-time updates for new content
  useEffect(() => {
    if (!user) return;

    const adminContentChannel = supabase
      .channel('admin_content_updates')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'admin_content',
        filter: 'status=eq.published'
      }, (payload) => {
        console.log('New admin content:', payload);
        // Add new content to the top of the feed
        const newContent = payload.new as any;
        const transformedContent: ContentItem = {
          id: newContent.id,
          title: newContent.title || 'Untitled Content',
          description: newContent.description || '',
          file_url: newContent.file_url,
          thumbnail_url: newContent.thumbnail_url,
          content_type: newContent.content_type,
          view_count: newContent.view_count || 0,
          like_count: newContent.like_count || 0,
          share_count: newContent.share_count || 0,
          is_promoted: newContent.is_promoted || false,
          category: newContent.category,
          created_at: newContent.created_at,
          admin_name: 'Admin',
          type: 'content' as const
        };
        
        setFeedItems(prev => [transformedContent, ...prev]);
        toast({
          title: "New content available!",
          description: "Fresh content has been added to your feed"
        });
      })
      .subscribe();

    const postsChannel = supabase
      .channel('posts_updates')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'posts',
        filter: 'payment_status=eq.paid'
      }, (payload) => {
        console.log('New post:', payload);
        // Handle new posts similar to admin content
        const newPost = payload.new as any;
        const transformedPost: ContentItem = {
          id: newPost.id,
          title: `${newPost.post_type} Post`,
          caption: newPost.caption || 'Check out this amazing content!',
          description: newPost.caption || 'Check out this amazing content!',
          file_url: newPost.content_url,
          content_type: newPost.content_url.includes('.mp4') || newPost.content_url.includes('.mov') ? 'video/mp4' : 'image/jpeg',
          view_count: 0,
          like_count: 0,
          share_count: 0,
          is_promoted: newPost.is_promoted || false,
          created_at: newPost.created_at,
          admin_name: 'Provider',
          type: 'content' as const
        };
        
        setFeedItems(prev => [transformedPost, ...prev]);
      })
      .subscribe();

    return () => {
      supabase.removeChannel(adminContentChannel);
      supabase.removeChannel(postsChannel);
    };
  }, [user]);

  // Auto-refresh every 5 minutes
  useEffect(() => {
    const interval = setInterval(() => {
      if (!document.hidden) { // Only refresh if tab is active
        handleRefresh();
      }
    }, REFRESH_INTERVAL);

    return () => clearInterval(interval);
  }, [handleRefresh]);

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

  // Skeleton loading component
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
            {refreshing ? 'Refreshing...' : 'Refresh Feed'}
          </Button>
        </div>
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
                  <div className="p-4 pb-0 space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Avatar className="w-8 h-8">
                          <AvatarFallback className="text-xs">
                            {item.admin_name?.charAt(0).toUpperCase() || 'A'}
                          </AvatarFallback>
                        </Avatar>
                        <span className="text-sm font-medium">{item.admin_name || 'Admin'}</span>
                      </div>
                      {item.is_promoted && (
                        <Badge className="bg-gradient-to-r from-purple-500 to-pink-500">
                          Promoted
                        </Badge>
                      )}
                    </div>
                    <h3 className="font-semibold text-lg">{item.title}</h3>
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
          <div className="flex flex-col items-center justify-center py-8 space-y-4">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
            <p className="text-sm text-muted-foreground">Loading more amazing content...</p>
          </div>
        )}

        {!hasMore && feedItems.length > 0 && (
          <div className="text-center py-8 space-y-2">
            <p className="text-muted-foreground">You've seen all available content!</p>
            <Button variant="outline" size="sm" onClick={handleRefresh} className="gap-2">
              <RefreshCw className="w-4 h-4" />
              Load Fresh Content
            </Button>
          </div>
        )}

        {!loading && feedItems.length === 0 && (
          <div className="text-center py-12 space-y-4">
            <p className="text-lg text-muted-foreground">No content available right now</p>
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