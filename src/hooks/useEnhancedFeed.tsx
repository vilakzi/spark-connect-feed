import { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from './useAuth';
import { supabase } from '@/integrations/supabase/client';
import { logDebug } from '@/lib/secureLogger';

export interface FeedPost {
  id: string;
  content: string;
  media_urls?: string[];
  media_types?: string[];
  likes_count: number;
  comments_count: number;
  shares_count: number;
  created_at: string;
  user_id: string;
  author_display_name?: string;
  author_profile_image?: string;
  engagement_score?: number;
  is_promoted?: boolean;
}

export interface FeedAnalytics {
  totalPosts: number;
  totalEngagement: number;
  averageEngagement: number;
  topPerformingPosts: FeedPost[];
}

// Enhanced feed hook with fallback to basic posts table
export const useEnhancedFeed = () => {
  const { user } = useAuth();
  const [posts, setPosts] = useState<FeedPost[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const lastPostRef = useRef<HTMLDivElement>(null);

  const trackUserInteraction = async (postId: string, interactionType: 'like' | 'comment' | 'share' | 'view') => {
    // Mock interaction tracking
    logDebug(`Tracked ${interactionType} on post ${postId}`, { postId, interactionType }, 'useEnhancedFeed');
  };

  const getFeedPosts = async (offset: number = 0, limit: number = 20): Promise<FeedPost[]> => {
    if (!user) return [];
    
    setLoading(true);
    try {
      // Use basic posts table since feed_posts doesn't exist
      const { data, error } = await supabase
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
          profiles!posts_user_id_fkey (
            display_name,
            profile_image_url
          )
        `)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (error) throw error;

      const feedPosts: FeedPost[] = (data || []).map(post => ({
        id: post.id,
        content: post.content,
        media_urls: post.image_url ? [post.image_url] : undefined,
        media_types: post.media_type ? [post.media_type] : undefined,
        likes_count: post.likes_count || 0,
        comments_count: post.comments_count || 0,
        shares_count: post.shares_count || 0,
        created_at: post.created_at,
        user_id: post.user_id,
        author_display_name: (post.profiles as any)?.display_name || 'Anonymous',
        author_profile_image: (post.profiles as any)?.profile_image_url,
        engagement_score: (post.likes_count || 0) + (post.comments_count || 0) + (post.shares_count || 0),
        is_promoted: false
      }));

      setPosts(prev => offset === 0 ? feedPosts : [...prev, ...feedPosts]);
      setHasMore(feedPosts.length === limit);
      return feedPosts;
    } catch (err) {
      console.error('Error fetching feed posts:', err);
      setError('Failed to load feed posts');
      return [];
    } finally {
      setLoading(false);
    }
  };

  const getPersonalizedFeed = async (): Promise<FeedPost[]> => {
    // Fallback to regular feed since personalization features don't exist
    return getFeedPosts();
  };

  const getEngagementAnalytics = async (): Promise<FeedAnalytics> => {
    try {
      const { data: postsData } = await supabase
        .from('posts')
        .select('id, likes_count, comments_count, shares_count');

      const posts = postsData || [];
      const totalEngagement = posts.reduce((sum, post) => 
        sum + (post.likes_count || 0) + (post.comments_count || 0) + (post.shares_count || 0), 0
      );

      return {
        totalPosts: posts.length,
        totalEngagement,
        averageEngagement: posts.length > 0 ? totalEngagement / posts.length : 0,
        topPerformingPosts: [] // Would need to implement with actual data
      };
    } catch (err) {
      console.error('Error getting analytics:', err);
      return {
        totalPosts: 0,
        totalEngagement: 0,
        averageEngagement: 0,
        topPerformingPosts: []
      };
    }
  };

  const optimizeFeedOrder = async (posts: FeedPost[]): Promise<FeedPost[]> => {
    // Simple engagement-based sorting since AI optimization doesn't exist
    return [...posts].sort((a, b) => (b.engagement_score || 0) - (a.engagement_score || 0));
  };

  const loadMorePosts = async () => {
    if (!hasMore || loading) return;
    await getFeedPosts(posts.length);
  };

  const refreshFeed = async () => {
    setPosts([]);
    setHasMore(true);
    await getFeedPosts(0);
  };

  // Initial load
  useEffect(() => {
    if (user) {
      getFeedPosts();
    }
  }, [user]);

  const likePost = useCallback(async (postId: string) => {
    try {
      const { error } = await supabase
        .from('likes')
        .insert({ post_id: postId, user_id: user?.id });
      
      if (!error) {
        setPosts(prev => prev.map(post => 
          post.id === postId 
            ? { ...post, likes_count: post.likes_count + 1 }
            : post
        ));
      }
    } catch (err) {
      console.error('Error liking post:', err);
    }
  }, [user?.id]);

  const sharePost = useCallback(async (postId: string) => {
    await trackUserInteraction(postId, 'share');
  }, []);

  const setupViewTracking = useCallback(() => {
    // Mock function for view tracking
  }, []);

  return {
    posts,
    loading,
    error,
    hasMore,
    lastPostRef,
    trackUserInteraction,
    getFeedPosts,
    getPersonalizedFeed,
    getEngagementAnalytics,
    optimizeFeedOrder,
    loadMorePosts,
    refreshFeed,
    likePost,
    sharePost,
    setupViewTracking
  };
};