import { useCallback, useMemo } from 'react';
import { useQuery, useQueryClient, useInfiniteQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

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

interface FeedQueryResult {
  posts: FeedPost[];
  nextCursor?: number;
  hasMore: boolean;
}

interface InfiniteQueryData {
  pages: FeedQueryResult[];
  pageParams: (number | undefined)[];
}

const POSTS_PER_PAGE = 10;

export const useOptimizedFeed = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Cache keys
  const feedCacheKey = ['feed', user?.id];
  const preferencesKey = ['feed-preferences', user?.id];

  // Fetch personalized feed with pagination
  const fetchFeedPage = useCallback(async (context: { pageParam: unknown }): Promise<FeedQueryResult> => {
    const pageParam = (context.pageParam as number) || 0;
    if (!user) throw new Error('User not authenticated');

    try {
      const { data, error } = await supabase.rpc('get_personalized_feed', {
        user_id_param: user.id,
        limit_param: POSTS_PER_PAGE,
        offset_param: pageParam * POSTS_PER_PAGE
      });

      if (error) throw error;

      const posts = data || [];
      
      return {
        posts,
        nextCursor: posts.length === POSTS_PER_PAGE ? pageParam + 1 : undefined,
        hasMore: posts.length === POSTS_PER_PAGE
      };
    } catch (error) {
      console.error('Error fetching feed:', error);
      // Fallback to basic feed
      const { data: fallbackData, error: fallbackError } = await supabase
        .from('feed_posts')
        .select(`
          id,
          content,
          media_urls,
          media_types,
          thumbnails,
          like_count,
          comment_count,
          share_count,
          created_at,
          profiles!inner(display_name, profile_image_url)
        `)
        .eq('is_draft', false)
        .not('published_at', 'is', null)
        .order('created_at', { ascending: false })
        .range(pageParam * POSTS_PER_PAGE, (pageParam + 1) * POSTS_PER_PAGE - 1);

      if (fallbackError) throw fallbackError;

      const transformedPosts = fallbackData?.map(post => ({
        post_id: post.id,
        content: post.content || '',
        media_urls: post.media_urls || [],
        media_types: post.media_types || [],
        thumbnails: post.thumbnails || [],
        user_display_name: 'Anonymous User',
        user_avatar: '',
        like_count: post.like_count || 0,
        comment_count: post.comment_count || 0,
        share_count: post.share_count || 0,
        created_at: post.created_at,
        relevance_score: 1.0
      })) || [];

      return {
        posts: transformedPosts,
        nextCursor: transformedPosts.length === POSTS_PER_PAGE ? pageParam + 1 : undefined,
        hasMore: transformedPosts.length === POSTS_PER_PAGE
      };
    }
  }, [user]);

  // Infinite query for feed
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
    queryFn: fetchFeedPage,
    getNextPageParam: (lastPage) => lastPage.nextCursor,
    initialPageParam: 0,
    enabled: !!user,
    staleTime: 1000 * 60 * 5, // 5 minutes
    gcTime: 1000 * 60 * 30, // 30 minutes (replaces cacheTime)
    refetchOnWindowFocus: false,
    retry: 2
  });

  // Flatten paginated data
  const posts = useMemo(() => {
    return feedData?.pages?.flatMap(page => page.posts) || [];
  }, [feedData]);

  // User preferences query
  const { data: preferences } = useQuery({
    queryKey: preferencesKey,
    queryFn: async () => {
      if (!user) return null;
      
      const { data, error } = await supabase
        .from('user_feed_preferences')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();
      
      if (error && error.code !== 'PGRST116') throw error;
      return data;
    },
    enabled: !!user,
    staleTime: 1000 * 60 * 15, // 15 minutes
  });

  // Optimistic interactions
  const likePost = useCallback(async (postId: string) => {
    if (!user) return;

    // Optimistic update
    queryClient.setQueryData(feedCacheKey, (oldData: InfiniteQueryData | undefined) => {
      if (!oldData) return oldData;
      
      return {
        ...oldData,
        pages: oldData.pages.map((page: FeedQueryResult) => ({
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

      toast({
        title: "Post liked!",
        description: "Your like has been recorded"
      });
    } catch (error) {
      // Revert optimistic update on error
      queryClient.invalidateQueries({ queryKey: feedCacheKey });
      
      console.error('Error liking post:', error);
      toast({
        title: "Like failed",
        description: "Could not like the post. Please try again.",
        variant: "destructive"
      });
    }
  }, [user, queryClient, toast, feedCacheKey]);

  // Track post view
  const trackView = useCallback(async (postId: string, duration: number = 3) => {
    if (!user) return;

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
  }, [user]);

  // Share post
  const sharePost = useCallback(async (post: FeedPost) => {
    if (!user) return;

    try {
      if (navigator.share) {
        await navigator.share({
          title: post.user_display_name,
          text: post.content,
          url: window.location.href
        });
      } else {
        await navigator.clipboard.writeText(window.location.href);
        toast({
          title: "Link copied!",
          description: "Post link copied to clipboard"
        });
      }

      // Optimistic update
      queryClient.setQueryData(feedCacheKey, (oldData: InfiniteQueryData | undefined) => {
        if (!oldData) return oldData;
        
        return {
          ...oldData,
          pages: oldData.pages.map((page: FeedQueryResult) => ({
            ...page,
            posts: page.posts.map((p: FeedPost) =>
              p.post_id === post.post_id
                ? { ...p, share_count: p.share_count + 1 }
                : p
            )
          }))
        };
      });

      await supabase.rpc('track_user_interaction', {
        p_user_id: user.id,
        p_post_id: post.post_id,
        p_interaction_type: 'share'
      });
    } catch (error) {
      console.error('Error sharing post:', error);
    }
  }, [user, queryClient, toast, feedCacheKey]);

  // Update preferences
  const updatePreferences = useCallback(async (newPreferences: {
    diversity_preference?: number;
    freshness_preference?: number;
    content_interests?: string[];
    preferred_content_types?: string[];
  }) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('user_feed_preferences')
        .upsert({
          user_id: user.id,
          ...newPreferences,
          updated_at: new Date().toISOString()
        });

      if (error) throw error;

      // Invalidate and refetch
      queryClient.invalidateQueries({ queryKey: preferencesKey });
      queryClient.invalidateQueries({ queryKey: feedCacheKey });

      toast({
        title: "Preferences updated",
        description: "Your feed will be refreshed with new preferences"
      });
    } catch (error) {
      console.error('Error updating preferences:', error);
      toast({
        title: "Update failed",
        description: "Could not update preferences. Please try again.",
        variant: "destructive"
      });
    }
  }, [user, queryClient, toast, feedCacheKey, preferencesKey]);

  // Refresh feed
  const refreshFeed = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: feedCacheKey });
  }, [queryClient, feedCacheKey]);

  // Prefetch next page when user is near the end
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
    preferences,
    likePost,
    sharePost,
    trackView,
    updatePreferences,
    refreshFeed,
    prefetchNextPage,
    fetchNextPage
  };
};