import { useState, useCallback, useEffect, useRef } from 'react';
import { useAuth } from './useAuth';
import { useAdvancedFeedAlgorithm } from './useAdvancedFeedAlgorithm';
import { supabase } from '@/integrations/supabase/client';

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
  view_count: number;
  created_at: string;
  relevance_score: number;
  user_id: string;
  _injected?: boolean;
  _score?: number;
}

interface UserInteraction {
  post_id: string;
  interaction_type: 'view' | 'like' | 'share' | 'comment' | 'skip';
  duration_ms?: number;
  created_at: string;
}

export const useOptimizedFeed = () => {
  const { user } = useAuth();
  const [posts, setPosts] = useState<FeedPost[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [offset, setOffset] = useState(0);
  
  const algorithm = useAdvancedFeedAlgorithm();
  const viewStartTime = useRef<Record<string, number>>({});

  // Enhanced feed fetching with algorithm integration
  const getFeedPosts = useCallback(async (limit: number = 20, reset: boolean = false): Promise<FeedPost[]> => {
    if (!user) return [];
    
    setLoading(true);
    setError(null);
    
    try {
      const currentOffset = reset ? 0 : offset;
      
      // Get main feed posts
      const { data: mainPosts, error: mainError } = await supabase
        .rpc('get_feed_posts', {
          viewer_id: user.id,
          limit_count: Math.floor(limit * 0.7), // 70% main feed
          offset_count: currentOffset
        });

      if (mainError) throw mainError;

      // Get background/discovery content for injection
      const { data: backgroundPosts, error: bgError } = await supabase
        .from('posts')
        .select(`
          id,
          content,
          image_url,
          video_url,
          media_type,
          likes_count,
          comments_count,
          shares_count,
          created_at,
          user_id,
          profiles!posts_user_id_fkey(display_name, profile_image_url)
        `)
        .neq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(Math.floor(limit * 0.3))
        .range(currentOffset, currentOffset + Math.floor(limit * 0.3));

      if (bgError) throw bgError;

      // Transform data to FeedPost format
      const transformedMain = mainPosts?.map(post => ({
        post_id: post.id,
        content: post.content,
        media_urls: post.image_url ? [post.image_url] : post.video_url ? [post.video_url] : [],
        media_types: post.media_type ? [post.media_type] : ['text'],
        thumbnails: [],
        user_display_name: post.author_display_name || 'Unknown',
        user_avatar: post.author_profile_image || '',
        like_count: post.likes_count || 0,
        comment_count: post.comments_count || 0,
        share_count: post.shares_count || 0,
        view_count: 0,
        created_at: post.created_at,
        relevance_score: 0,
        user_id: post.user_id
      })) || [];

      const transformedBackground = backgroundPosts?.map(post => ({
        post_id: post.id,
        content: post.content,
        media_urls: post.image_url ? [post.image_url] : post.video_url ? [post.video_url] : [],
        media_types: post.media_type ? [post.media_type] : ['text'],
        thumbnails: [],
        user_display_name: post.profiles?.display_name || 'Unknown',
        user_avatar: post.profiles?.profile_image_url || '',
        like_count: post.likes_count || 0,
        comment_count: post.comments_count || 0,
        share_count: post.shares_count || 0,
        view_count: 0,
        created_at: post.created_at,
        relevance_score: 0,
        user_id: post.user_id
      })) || [];

      // Apply advanced algorithm
      const optimizedFeed = algorithm.injectContent(transformedMain, transformedBackground);
      
      // Calculate relevance scores for all posts
      const scoredPosts = optimizedFeed.map(post => {
        const score = algorithm.calculateContentScore({
          id: post.post_id,
          created_at: post.created_at,
          like_count: post.like_count,
          comment_count: post.comment_count,
          share_count: post.share_count,
          view_count: post.view_count,
          media_types: post.media_types
        });
        
        return {
          ...post,
          relevance_score: score.finalScore
        };
      });

      // Sort by final relevance score
      const sortedPosts = scoredPosts.sort((a, b) => b.relevance_score - a.relevance_score);

      if (reset) {
        setPosts(sortedPosts);
        setOffset(limit);
      } else {
        setPosts(prev => [...prev, ...sortedPosts]);
        setOffset(prev => prev + limit);
      }
      
      setHasMore(sortedPosts.length === limit);
      return sortedPosts;
      
    } catch (err) {
      console.error('Error fetching feed:', err);
      setError(err instanceof Error ? err.message : 'Failed to load feed');
      return [];
    } finally {
      setLoading(false);
    }
  }, [user, offset, algorithm]);

  // Track post interactions with advanced analytics
  const trackInteraction = useCallback(async (
    postId: string, 
    interactionType: 'like' | 'share' | 'view' | 'comment' | 'skip',
    duration?: number
  ) => {
    if (!user) return;

    // Track with algorithm
    algorithm.trackUserInteraction(interactionType === 'view' ? 'view' : interactionType, postId);

    // Store interaction in database for ML training
    try {
      await supabase
        .from('user_interactions')
        .insert({
          user_id: user.id,
          post_id: postId,
          interaction_type: interactionType,
          duration_ms: duration,
          created_at: new Date().toISOString()
        });
    } catch (error) {
      console.log('Interaction tracking disabled - table may not exist yet');
    }
  }, [user, algorithm]);

  // Enhanced view tracking
  const trackView = useCallback(async (postId: string) => {
    viewStartTime.current[postId] = Date.now();
    await trackInteraction(postId, 'view');
  }, [trackInteraction]);

  const trackViewEnd = useCallback(async (postId: string) => {
    const startTime = viewStartTime.current[postId];
    if (startTime) {
      const duration = Date.now() - startTime;
      delete viewStartTime.current[postId];
      
      // Track view duration for engagement analysis
      if (duration > 1000) { // More than 1 second counts as engagement
        await trackInteraction(postId, 'view', duration);
      }
    }
  }, [trackInteraction]);

  const likePost = useCallback(async (postId: string) => {
    if (!user) return;

    try {
      // Optimistic update
      setPosts(prev => prev.map(post => 
        post.post_id === postId 
          ? { ...post, like_count: post.like_count + 1 }
          : post
      ));

      await supabase.from('likes').insert({
        user_id: user.id,
        post_id: postId
      });

      // Update post like count
      await supabase
        .from('posts')
        .update({ likes_count: supabase.sql`likes_count + 1` })
        .eq('id', postId);

      await trackInteraction(postId, 'like');
    } catch (error) {
      console.error('Error liking post:', error);
      // Revert optimistic update
      setPosts(prev => prev.map(post => 
        post.post_id === postId 
          ? { ...post, like_count: Math.max(0, post.like_count - 1) }
          : post
      ));
    }
  }, [user, trackInteraction]);

  const sharePost = useCallback(async (postId: string) => {
    if (!user) return;

    try {
      setPosts(prev => prev.map(post => 
        post.post_id === postId 
          ? { ...post, share_count: post.share_count + 1 }
          : post
      ));

      await supabase
        .from('posts')
        .update({ shares_count: supabase.sql`shares_count + 1` })
        .eq('id', postId);

      await trackInteraction(postId, 'share');
    } catch (error) {
      console.error('Error sharing post:', error);
    }
  }, [user, trackInteraction]);

  // Adaptive refresh based on user behavior
  const refreshFeed = useCallback(async () => {
    return await getFeedPosts(20, true);
  }, [getFeedPosts]);

  const loadMore = useCallback(async () => {
    if (!loading && hasMore) {
      return await getFeedPosts(20, false);
    }
    return [];
  }, [loading, hasMore, getFeedPosts]);

  // Auto-refresh based on algorithm recommendations
  useEffect(() => {
    if (!user) return;

    const refreshInterval = algorithm.getRefreshInterval();
    const intervalId = setInterval(() => {
      refreshFeed();
    }, refreshInterval);

    return () => clearInterval(intervalId);
  }, [user, algorithm, refreshFeed]);

  return {
    posts,
    loading,
    error,
    hasMore,
    userBehavior: algorithm.userBehavior,
    getFeedPosts,
    likePost,
    sharePost,
    trackInteraction,
    trackView,
    trackViewEnd,
    refreshFeed,
    loadMore,
    optimizeFeedOrder: async (posts: FeedPost[]) => {
      return posts.sort((a, b) => b.relevance_score - a.relevance_score);
    }
  };
};