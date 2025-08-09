import { useState, useCallback, useEffect, useRef } from 'react';
import { useAuth } from './useAuth';
import { supabase } from '@/integrations/supabase/client';

interface FeedPost {
  id: string;
  created_at: string;
  like_count: number;
  comment_count: number;
  share_count: number;
  view_count: number;
  media_types: string[];
}

interface ContentScore {
  postId: string;
  engagementScore: number;
  freshnessScore: number;
  diversityScore: number;
  personalizedScore: number;
  finalScore: number;
}

interface UserBehavior {
  avgScrollSpeed: number;
  preferredContentTypes: string[];
  engagementPattern: 'high' | 'medium' | 'low';
  lastActiveTime: Date;
}

export const useAdvancedFeedAlgorithm = () => {
  const { user } = useAuth();
  const [userBehavior, setUserBehavior] = useState<UserBehavior>({
    avgScrollSpeed: 1000, // ms per post
    preferredContentTypes: [],
    engagementPattern: 'medium',
    lastActiveTime: new Date()
  });

  const scrollMetrics = useRef({
    startTime: Date.now(),
    postsViewed: 0,
    engagements: 0
  });

  // Calculate dynamic content scoring
  const calculateContentScore = useCallback((post: FeedPost): ContentScore => {
    const now = Date.now();
    const postAge = now - new Date(post.created_at).getTime();
    
    // Engagement score (0-100)
    const engagementScore = Math.min(100, 
      (post.like_count * 1) + 
      (post.comment_count * 3) + 
      (post.share_count * 5) + 
      (post.view_count * 0.1)
    );

    // Freshness score - newer content gets higher score
    const freshnessScore = Math.max(0, 100 - (postAge / (1000 * 60 * 60 * 24))); // Decay over days

    // Diversity score - prefer content from different users
    const diversityScore = userBehavior.preferredContentTypes.includes(post.media_types[0] || 'text') ? 50 : 100;

    // Personalized score based on user behavior
    let personalizedScore = 50;
    if (userBehavior.engagementPattern === 'high') {
      personalizedScore += engagementScore * 0.3;
    } else if (userBehavior.engagementPattern === 'low') {
      personalizedScore += freshnessScore * 0.3;
    }

    // Calculate weighted final score
    const finalScore = (
      engagementScore * 0.3 +
      freshnessScore * 0.4 +
      diversityScore * 0.2 +
      personalizedScore * 0.1
    );

    return {
      postId: post.id,
      engagementScore,
      freshnessScore,
      diversityScore,
      personalizedScore,
      finalScore
    };
  }, [userBehavior]);

  // Smart content injection algorithm
  const injectContent = useCallback((mainPosts: FeedPost[], backgroundPosts: FeedPost[]) => {
    const result = [];
    let backgroundIndex = 0;

    for (let i = 0; i < mainPosts.length; i++) {
      result.push(mainPosts[i]);

      // Dynamic injection interval based on user behavior
      let injectionInterval = 6; // Default
      if (userBehavior.engagementPattern === 'high') {
        injectionInterval = 4; // More frequent for engaged users
      } else if (userBehavior.engagementPattern === 'low') {
        injectionInterval = 8; // Less frequent for casual users
      }

      // Inject background content strategically
      if ((i + 1) % injectionInterval === 0 && backgroundIndex < backgroundPosts.length) {
        const backgroundPost = backgroundPosts[backgroundIndex];
        const score = calculateContentScore(backgroundPost);
        
        // Only inject if content meets quality threshold
        if (score.finalScore > 30) {
          result.push({
            ...backgroundPost,
            _injected: true,
            _score: score.finalScore
          });
          backgroundIndex++;
        }
      }
    }

    return result;
  }, [userBehavior, calculateContentScore]);

  // Track user behavior patterns
  const trackUserInteraction = useCallback((type: 'view' | 'like' | 'share' | 'comment', postId?: string) => {
    const now = Date.now();
    
    if (type === 'view') {
      scrollMetrics.current.postsViewed++;
      
      // Calculate scroll speed
      const timeSinceStart = now - scrollMetrics.current.startTime;
      const avgSpeed = timeSinceStart / scrollMetrics.current.postsViewed;
      
      setUserBehavior(prev => ({
        ...prev,
        avgScrollSpeed: avgSpeed,
        lastActiveTime: new Date()
      }));
    } else {
      scrollMetrics.current.engagements++;
      
      // Update engagement pattern
      const engagementRate = scrollMetrics.current.engagements / scrollMetrics.current.postsViewed;
      let pattern: 'high' | 'medium' | 'low' = 'medium';
      
      if (engagementRate > 0.3) pattern = 'high';
      else if (engagementRate < 0.1) pattern = 'low';
      
      setUserBehavior(prev => ({
        ...prev,
        engagementPattern: pattern,
        lastActiveTime: new Date()
      }));
    }
  }, []);

  // Adaptive refresh timing based on user activity
  const getRefreshInterval = useCallback(() => {
    const timeSinceActive = Date.now() - userBehavior.lastActiveTime.getTime();
    
    // More frequent updates for active users
    if (timeSinceActive < 60000) return 15000; // 15 seconds for very active
    if (timeSinceActive < 300000) return 30000; // 30 seconds for moderately active
    return 60000; // 1 minute for inactive users
  }, [userBehavior.lastActiveTime]);

  // Reset metrics periodically
  useEffect(() => {
    const resetInterval = setInterval(() => {
      scrollMetrics.current = {
        startTime: Date.now(),
        postsViewed: 0,
        engagements: 0
      };
    }, 300000); // Reset every 5 minutes

    return () => clearInterval(resetInterval);
  }, []);

  return {
    calculateContentScore,
    injectContent,
    trackUserInteraction,
    getRefreshInterval,
    userBehavior
  };
};