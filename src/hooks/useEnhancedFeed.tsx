import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from '@/hooks/use-toast';

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

interface FeedState {
  posts: FeedPost[];
  loading: boolean;
  hasMore: boolean;
  page: number;
}

export const useEnhancedFeed = () => {
  const { user } = useAuth();
  const [feedState, setFeedState] = useState<FeedState>({
    posts: [],
    loading: false,
    hasMore: true,
    page: 0
  });
  
  const observerRef = useRef<IntersectionObserver | null>(null);
  const lastPostRef = useRef<HTMLDivElement | null>(null);
  const viewTimeouts = useRef<Map<string, NodeJS.Timeout>>(new Map());

  // Track post views with intersection observer
  const setupViewTracking = useCallback((postElement: HTMLElement, postId: string) => {
    if (!user) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && entry.intersectionRatio >= 0.5) {
            // Post is 50% visible - start view timer
            const timeout = setTimeout(async () => {
              try {
                await supabase.rpc('track_user_interaction', {
                  p_user_id: user.id,
                  p_post_id: postId,
                  p_interaction_type: 'view',
                  p_duration: 3, // 3 seconds minimum view
                  p_metadata: { viewport_ratio: entry.intersectionRatio }
                });
              } catch (error) {
                console.error('Error tracking view:', error);
              }
            }, 3000);
            
            viewTimeouts.current.set(postId, timeout);
          } else {
            // Post is not visible - clear timer
            const timeout = viewTimeouts.current.get(postId);
            if (timeout) {
              clearTimeout(timeout);
              viewTimeouts.current.delete(postId);
            }
          }
        });
      },
      { threshold: [0.5, 0.75, 1.0] }
    );

    observer.observe(postElement);
    return () => observer.disconnect();
  }, [user]);

  // Fetch personalized feed with enhanced error handling and retry logic
  const fetchFeed = useCallback(async (page: number = 0, reset: boolean = false, retryCount: number = 0) => {
    if (!user || feedState.loading) return;

    setFeedState(prev => ({ 
      ...prev, 
      loading: true 
    }));

    try {
      const { data, error } = await supabase.rpc('get_personalized_feed', {
        user_id_param: user.id,
        limit_param: 10,
        offset_param: page * 10
      });

      if (error) {
        console.error('Error fetching feed:', error);
        
        // Retry logic for temporary failures (but not for missing table errors)
        if (retryCount < 3 && error.code !== '42P01') {
          setTimeout(() => {
            fetchFeed(page, reset, retryCount + 1);
          }, Math.pow(2, retryCount) * 1000); // Exponential backoff
          return;
        }
        
        // Fallback: try to fetch directly from feed_posts table
        try {
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
              profiles!inner(
                display_name,
                profile_image_url
              )
            `)
            .eq('is_draft', false)
            .not('published_at', 'is', null)
            .order('created_at', { ascending: false })
            .range(page * 10, (page + 1) * 10 - 1);

          if (fallbackError) {
            throw fallbackError;
          }

          // Transform fallback data to match expected format
          const transformedData = fallbackData?.map(post => ({
            post_id: post.id,
            content: post.content || '',
            media_urls: post.media_urls || [],
            media_types: post.media_types || [],
            thumbnails: post.thumbnails || [],
            user_display_name: post.profiles?.display_name || 'Unknown User',
            user_avatar: post.profiles?.profile_image_url || '',
            like_count: post.like_count || 0,
            comment_count: post.comment_count || 0,
            share_count: post.share_count || 0,
            created_at: post.created_at,
            relevance_score: 1.0
          })) || [];

          setFeedState(prev => ({
            ...prev,
            posts: reset ? transformedData : [...prev.posts, ...transformedData],
            hasMore: transformedData.length === 10,
            page: page,
            loading: false
          }));
          
          if (reset && transformedData.length === 0) {
            toast({
              title: "No posts available",
              description: "Create your first post to get started!",
            });
          }
          
          return;
        } catch (fallbackError) {
          console.error('Fallback query failed:', fallbackError);
          throw fallbackError;
        }
      }

      const newPosts = data || [];
      
      setFeedState(prev => ({
        ...prev,
        posts: reset ? newPosts : [...prev.posts, ...newPosts],
        hasMore: newPosts.length === 10,
        page: page,
        loading: false
      }));

      if (reset && newPosts.length === 0) {
        toast({
          title: "No posts available",
          description: "Create your first post to get started!",
        });
      }

    } catch (error) {
      console.error('Error fetching feed:', error);
      
      if (retryCount === 0) {
        toast({
          title: "Feed load error",
          description: "Failed to load feed content. Retrying...",
          variant: "destructive"
        });
        
        // Try once more after a short delay
        setTimeout(() => {
          fetchFeed(page, reset, 1);
        }, 2000);
        return;
      }
      
      toast({
        title: "Feed unavailable",
        description: "Unable to load feed. Please check your connection and try again.",
        variant: "destructive"
      });
      
      setFeedState(prev => ({
        ...prev,
        loading: false
      }));
    }
  }, [user, feedState.loading]);

  // Infinite scroll setup
  useEffect(() => {
    if (!lastPostRef.current || feedState.loading || !feedState.hasMore) return;

    observerRef.current = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          fetchFeed(feedState.page + 1, false);
        }
      },
      { threshold: 0.1 }
    );

    observerRef.current.observe(lastPostRef.current);

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [fetchFeed, feedState.loading, feedState.hasMore, feedState.page]);

  // Initial load and real-time updates
  useEffect(() => {
    if (user) {
      fetchFeed(0, true);

      // Set up real-time updates
      const channel = supabase
        .channel('enhanced_feed_updates')
        .on('postgres_changes', 
          { 
            event: 'INSERT', 
            schema: 'public', 
            table: 'feed_posts',
            filter: 'published_at=not.is.null'
          },
          (payload) => {
            console.log('New post published:', payload);
            // Refresh feed to include new posts
            setTimeout(() => fetchFeed(0, true), 1000);
          }
        )
        .on('postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'feed_posts'
          },
          (payload) => {
            console.log('Post updated:', payload);
            // Update specific post in the feed
            setFeedState(prev => ({
              ...prev,
              posts: prev.posts.map(post => 
                post.post_id === payload.new.id 
                  ? { ...post, ...payload.new }
                  : post
              )
            }));
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
        // Clear all view timeouts
        viewTimeouts.current.forEach(timeout => clearTimeout(timeout));
        viewTimeouts.current.clear();
      };
    }
  }, [user, fetchFeed]);

  // User interactions
  const likePost = useCallback(async (postId: string) => {
    if (!user) return;

    try {
      await supabase.rpc('track_user_interaction', {
        p_user_id: user.id,
        p_post_id: postId,
        p_interaction_type: 'like'
      });

      // Optimistically update UI
      setFeedState(prev => ({
        ...prev,
        posts: prev.posts.map(post => 
          post.post_id === postId 
            ? { ...post, like_count: post.like_count + 1 }
            : post
        )
      }));

      toast({
        title: "Post liked!",
        description: "Your like has been recorded"
      });

    } catch (error) {
      console.error('Error liking post:', error);
      toast({
        title: "Like failed",
        description: "Could not like the post. Please try again.",
        variant: "destructive"
      });
    }
  }, [user]);

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

      // Track share interaction
      await supabase.rpc('track_user_interaction', {
        p_user_id: user.id,
        p_post_id: post.post_id,
        p_interaction_type: 'share'
      });

      // Optimistically update UI
      setFeedState(prev => ({
        ...prev,
        posts: prev.posts.map(p => 
          p.post_id === post.post_id 
            ? { ...p, share_count: p.share_count + 1 }
            : p
        )
      }));

    } catch (error) {
      console.error('Error sharing post:', error);
    }
  }, [user]);

  const refreshFeed = useCallback(() => {
    fetchFeed(0, true);
  }, [fetchFeed]);

  // Update user feed preferences
  const updateFeedPreferences = useCallback(async (preferences: {
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
          ...preferences,
          updated_at: new Date().toISOString()
        });

      if (error) throw error;

      // Refresh feed with new preferences
      setTimeout(() => refreshFeed(), 500);

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
  }, [user, refreshFeed]);

  return {
    posts: feedState.posts,
    loading: feedState.loading,
    hasMore: feedState.hasMore,
    likePost,
    sharePost,
    refreshFeed,
    updateFeedPreferences,
    setupViewTracking,
    lastPostRef
  };
};