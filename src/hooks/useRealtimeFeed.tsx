import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useQuery, useQueryClient, useInfiniteQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { useAdvancedFeedAlgorithm } from './useAdvancedFeedAlgorithm';

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

interface ContentBatch {
  userPosts: FeedPost[];
  adminPosts: FeedPost[];
  mixedContent: FeedPost[];
}

const POSTS_PER_BATCH = 8;
const REFRESH_INTERVAL = 30000; // 30 seconds
const CONTENT_MIX_RATIO = 0.3; // 30% admin content, 70% user content

export const useRealtimeFeed = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [lastRefresh, setLastRefresh] = useState(Date.now());
  const refreshTimer = useRef<NodeJS.Timeout>();
  const [backgroundContent, setBackgroundContent] = useState<FeedPost[]>([]);
  const { injectContent, trackUserInteraction, getRefreshInterval } = useAdvancedFeedAlgorithm();

  // Enhanced cache keys with timestamp for better invalidation
  const feedCacheKey = ['realtime-feed', user?.id, lastRefresh];
  const backgroundCacheKey = ['background-content', user?.id];

  // Real-time content mixing algorithm
  const mixContentIntelligently = useCallback((userContent: FeedPost[], adminContent: FeedPost[]): FeedPost[] => {
    const mixed: FeedPost[] = [];
    const totalPosts = Math.min(userContent.length + adminContent.length, POSTS_PER_BATCH);
    const adminCount = Math.floor(totalPosts * CONTENT_MIX_RATIO);
    const userCount = totalPosts - adminCount;

    // Score-based selection for diversity
    const scoredUserContent = userContent
      .map(post => ({
        ...post,
        diversityScore: post.relevance_score + Math.random() * 0.3 // Add randomness for variety
      }))
      .sort((a, b) => b.diversityScore - a.diversityScore)
      .slice(0, userCount);

    const scoredAdminContent = adminContent
      .map(post => ({
        ...post,
        diversityScore: post.relevance_score + Math.random() * 0.3
      }))
      .sort((a, b) => b.diversityScore - a.diversityScore)
      .slice(0, adminCount);

    // Strategic content insertion - spread admin content throughout feed
    const allContent = [...scoredUserContent, ...scoredAdminContent];
    const contentStrategy = Math.floor(totalPosts / (adminCount || 1));

    let userIndex = 0;
    let adminIndex = 0;

    for (let i = 0; i < totalPosts; i++) {
      const shouldInsertAdmin = adminIndex < adminCount && 
        (i % contentStrategy === 2 || userIndex >= userCount);

      if (shouldInsertAdmin) {
        mixed.push(scoredAdminContent[adminIndex]);
        adminIndex++;
      } else if (userIndex < userCount) {
        mixed.push(scoredUserContent[userIndex]);
        userIndex++;
      }
    }

    return mixed;
  }, []);

  // Enhanced feed fetching with content rotation
  const fetchEnhancedFeed = useCallback(async (context: { pageParam: unknown }): Promise<{ posts: FeedPost[]; nextCursor?: number }> => {
    const pageParam = (context.pageParam as number) || 0;
    if (!user) throw new Error('User not authenticated');

    try {
      // Fetch user content with enhanced scoring
      const { data: userPosts, error: userError } = await supabase.rpc('get_personalized_feed', {
        user_id_param: user.id,
        limit_param: POSTS_PER_BATCH,
        offset_param: pageParam * POSTS_PER_BATCH
      });

      if (userError) throw userError;

      // Fetch admin content with promotion priority
      const { data: adminContent, error: adminError } = await supabase
        .from('admin_content')
        .select(`
          id,
          title,
          description,
          file_url,
          thumbnail_url,
          content_type,
          like_count,
          share_count,
          view_count,
          created_at,
          promotion_priority,
          admin_id
        `)
        .eq('status', 'published')
        .eq('approval_status', 'approved')
        .not('published_at', 'is', null)
        .order('promotion_priority', { ascending: false })
        .order('created_at', { ascending: false })
        .limit(Math.ceil(POSTS_PER_BATCH * CONTENT_MIX_RATIO));

      if (adminError) throw adminError;

      // Transform admin content to feed format
      const transformedAdminContent: FeedPost[] = adminContent?.map(content => ({
        post_id: content.id,
        content: content.description || content.title,
        media_urls: [content.file_url],
        media_types: [content.content_type],
        thumbnails: content.thumbnail_url ? [content.thumbnail_url] : [],
        user_display_name: 'Admin',
        user_avatar: '',
        like_count: content.like_count || 0,
        comment_count: 0,
        share_count: content.share_count || 0,
        created_at: content.created_at,
        relevance_score: content.promotion_priority || 1.0
      })) || [];

      // Intelligent content mixing
      const mixedPosts = mixContentIntelligently(userPosts || [], transformedAdminContent);

      return {
        posts: mixedPosts,
        nextCursor: mixedPosts.length === POSTS_PER_BATCH ? pageParam + 1 : undefined
      };

    } catch (error) {
      console.error('Enhanced feed fetch error:', error);
      throw error;
    }
  }, [user?.id, mixContentIntelligently]);

  // Background content warming
  const warmBackgroundContent = useCallback(async () => {
    if (!user) return;

    try {
      const { data: freshContent } = await supabase.rpc('get_personalized_feed', {
        user_id_param: user.id,
        limit_param: POSTS_PER_BATCH * 2,
        offset_param: 0
      });

      if (freshContent) {
        setBackgroundContent(prev => {
          const combined = [...freshContent, ...prev];
          const unique = combined.filter((post, index, self) => 
            index === self.findIndex(p => p.post_id === post.post_id)
          );
          return unique.slice(0, POSTS_PER_BATCH * 3); // Keep cache reasonable
        });
      }
    } catch (error) {
      console.error('Background content warming failed:', error);
    }
  }, [user?.id]);

  // Enhanced real-time refresh with adaptive intervals
  useEffect(() => {
    if (!user) return;

    const adaptiveRefresh = () => {
      warmBackgroundContent();
      
      // Dynamic refresh probability based on user activity
      const refreshInterval = getRefreshInterval();
      const refreshProbability = refreshInterval < 20000 ? 0.4 : 0.2;
      
      if (Math.random() < refreshProbability) {
        setLastRefresh(Date.now());
      }
    };

    // Initial refresh
    adaptiveRefresh();
    
    // Set up adaptive interval
    const setupInterval = () => {
      const currentInterval = getRefreshInterval();
      return setInterval(adaptiveRefresh, currentInterval);
    };
    
    let refreshInterval = setupInterval();
    
    // Update interval based on user activity every minute
    const intervalUpdater = setInterval(() => {
      clearInterval(refreshInterval);
      refreshInterval = setupInterval();
    }, 60000);

    // Real-time subscriptions for instant content updates
    const channel = supabase
      .channel('feed-updates')
      .on('postgres_changes', 
        { event: 'INSERT', schema: 'public', table: 'feed_posts' },
        (payload) => {
          console.log('New post detected:', payload);
          warmBackgroundContent();
        }
      )
      .on('postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'user_interactions' },
        (payload) => {
          console.log('Interaction update:', payload);
          if (Math.random() < 0.1) { // 10% chance to refresh
            setLastRefresh(Date.now());
          }
        }
      )
      .subscribe();

    return () => {
      clearInterval(refreshInterval);
      clearInterval(intervalUpdater);
      supabase.removeChannel(channel);
    };
  }, [user?.id, warmBackgroundContent, getRefreshInterval]);

  // Enhanced infinite query with real-time updates
  const {
    data: feedData,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    isError,
    refetch: refetchFeed
  } = useInfiniteQuery({
    queryKey: feedCacheKey,
    queryFn: fetchEnhancedFeed,
    getNextPageParam: (lastPage) => lastPage.nextCursor,
    initialPageParam: 0,
    enabled: !!user,
    staleTime: 1000 * 60 * 2, // 2 minutes - more aggressive refresh
    gcTime: 1000 * 60 * 10, // 10 minutes cache
    refetchOnWindowFocus: true,
    refetchInterval: REFRESH_INTERVAL * 2, // Background refresh every minute
    retry: 3
  });

  // Advanced content injection using AI-like algorithm
  const posts = useMemo(() => {
    const mainPosts = feedData?.pages?.flatMap(page => page.posts) || [];
    return injectContent(mainPosts, backgroundContent);
  }, [feedData, backgroundContent, injectContent]);

  // Enhanced interaction tracking with optimistic updates
  const likePost = useCallback(async (postId: string) => {
    if (!user) return;

    // Optimistic update
    queryClient.setQueryData(feedCacheKey, (oldData: any) => {
      if (!oldData) return oldData;
      
      return {
        ...oldData,
        pages: oldData.pages.map((page: any) => ({
          ...page,
          posts: page.posts.map((post: FeedPost) =>
            post.post_id === postId
              ? { ...post, like_count: post.like_count + 1 }
              : post
          )
        }))
      };
    });

    try {
      await supabase.rpc('track_user_interaction', {
        p_user_id: user.id,
        p_post_id: postId,
        p_interaction_type: 'like'
      });
    } catch (error) {
      queryClient.invalidateQueries({ queryKey: feedCacheKey });
      console.error('Error liking post:', error);
    }
  }, [user?.id, queryClient, feedCacheKey]);

  // Enhanced view tracking with duration and behavior tracking
  const trackView = useCallback(async (postId: string, duration: number = 3) => {
    if (!user) return;

    // Track with advanced algorithm
    trackUserInteraction('view', postId);

    try {
      await supabase.rpc('track_user_interaction', {
        p_user_id: user.id,
        p_post_id: postId,
        p_interaction_type: 'view',
        p_duration: duration
      });
    } catch (error) {
      console.error('Error tracking view:', error);
    }
  }, [user?.id, trackUserInteraction]);

  // Enhanced share with native sharing
  const sharePost = useCallback(async (post: FeedPost) => {
    if (!user) return;

    try {
      if (navigator.share && navigator.canShare) {
        await navigator.share({
          title: `Post by ${post.user_display_name}`,
          text: post.content,
          url: `${window.location.origin}/post/${post.post_id}`
        });
      } else {
        await navigator.clipboard.writeText(`${window.location.origin}/post/${post.post_id}`);
        toast({
          title: "Link copied!",
          description: "Post link copied to clipboard"
        });
      }

      // Track share interaction
      await supabase.rpc('track_user_interaction', {
        p_user_id: user.id,
        p_post_id: post.post_id,
        p_interaction_type: 'share'
      });

      // Optimistic update
      queryClient.setQueryData(feedCacheKey, (oldData: any) => {
        if (!oldData) return oldData;
        
        return {
          ...oldData,
          pages: oldData.pages.map((page: any) => ({
            ...page,
            posts: page.posts.map((p: FeedPost) =>
              p.post_id === post.post_id
                ? { ...p, share_count: p.share_count + 1 }
                : p
            )
          }))
        };
      });

    } catch (error) {
      console.error('Error sharing post:', error);
    }
  }, [user?.id, queryClient, toast, feedCacheKey]);

  // Intelligent refresh with background content merge
  const refreshFeed = useCallback(() => {
    setLastRefresh(Date.now());
    warmBackgroundContent();
  }, [warmBackgroundContent]);

  // Smart prefetching based on scroll behavior
  const prefetchNextPage = useCallback(() => {
    if (hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  return {
    posts,
    isLoading,
    isError,
    hasNextPage,
    isFetchingNextPage,
    likePost,
    sharePost,
    trackView,
    refreshFeed,
    prefetchNextPage,
    fetchNextPage,
    backgroundContentCount: backgroundContent.length
  };
};