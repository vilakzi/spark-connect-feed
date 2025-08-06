-- Fix ON CONFLICT errors by adding missing unique constraints
-- Most common tables causing these errors need proper unique indexes

-- Fix user_interactions table - prevent duplicate interactions
CREATE UNIQUE INDEX IF NOT EXISTS user_interactions_user_post_type_unique 
ON public.user_interactions (user_id, post_id, interaction_type);

-- Fix post_likes table - prevent duplicate likes
CREATE UNIQUE INDEX IF NOT EXISTS post_likes_user_post_unique 
ON public.post_likes (user_id, post_id);

-- Fix story_views table - prevent duplicate views
CREATE UNIQUE INDEX IF NOT EXISTS story_views_viewer_story_unique 
ON public.story_views (viewer_id, story_id);

-- Fix profile_views table - prevent duplicate views per day
CREATE UNIQUE INDEX IF NOT EXISTS profile_views_viewer_viewed_date_unique 
ON public.profile_views (viewer_id, viewed_id, date(created_at));

-- Fix user_feed_preferences table - one preference per user
CREATE UNIQUE INDEX IF NOT EXISTS user_feed_preferences_user_unique 
ON public.user_feed_preferences (user_id);

-- Fix user_preferences table - one preference per user
CREATE UNIQUE INDEX IF NOT EXISTS user_preferences_user_unique 
ON public.user_preferences (user_id);

-- Fix profile_metrics table - one metric per user
CREATE UNIQUE INDEX IF NOT EXISTS profile_metrics_user_unique 
ON public.profile_metrics (user_id);

-- Fix daily_stats table - one stat per user per date
CREATE UNIQUE INDEX IF NOT EXISTS daily_stats_user_date_unique 
ON public.daily_stats (user_id, date);

-- Fix matches table - prevent duplicate matches
CREATE UNIQUE INDEX IF NOT EXISTS matches_users_unique 
ON public.matches (LEAST(user_one_id, user_two_id), GREATEST(user_one_id, user_two_id));

-- Fix swipe_actions table - prevent duplicate swipes
CREATE UNIQUE INDEX IF NOT EXISTS swipe_actions_user_target_unique 
ON public.swipe_actions (user_id, target_user_id);

-- Fix blocked_users table - prevent duplicate blocks
CREATE UNIQUE INDEX IF NOT EXISTS blocked_users_blocker_blocked_unique 
ON public.blocked_users (blocker_id, blocked_id);

-- Fix community_memberships table - one membership per user per community
CREATE UNIQUE INDEX IF NOT EXISTS community_memberships_user_community_unique 
ON public.community_memberships (user_id, community_id);

-- Fix event_attendees table - one attendance per user per event
CREATE UNIQUE INDEX IF NOT EXISTS event_attendees_user_event_unique 
ON public.event_attendees (user_id, event_id);

-- Fix typing_indicators table - one indicator per user per conversation
CREATE UNIQUE INDEX IF NOT EXISTS typing_indicators_user_conversation_unique 
ON public.typing_indicators (user_id, conversation_id);

-- Fix content_analytics table - prevent duplicate analytics entries
CREATE UNIQUE INDEX IF NOT EXISTS content_analytics_content_user_metric_date_unique 
ON public.content_analytics (content_id, user_id, metric_type, date(timestamp));

-- Fix ai_compatibility_analysis table - one analysis per user pair
CREATE UNIQUE INDEX IF NOT EXISTS ai_compatibility_analysis_users_unique 
ON public.ai_compatibility_analysis (LEAST(user_one_id, user_two_id), GREATEST(user_one_id, user_two_id));

-- Fix compatibility_scores table - one score per user pair
CREATE UNIQUE INDEX IF NOT EXISTS compatibility_scores_users_unique 
ON public.compatibility_scores (LEAST(user_one_id, user_two_id), GREATEST(user_one_id, user_two_id));

-- Fix security warnings - update functions with proper search_path
CREATE OR REPLACE FUNCTION public.calculate_compatibility_score(user_one_uuid uuid, user_two_uuid uuid)
RETURNS numeric
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  score NUMERIC := 0;
  interest_overlap INTEGER := 0;
  age_difference INTEGER := 0;
  location_match BOOLEAN := false;
BEGIN
  -- Calculate interest overlap
  SELECT COUNT(*) INTO interest_overlap
  FROM (
    SELECT unnest(p1.interests) AS interest
    FROM profiles p1 WHERE p1.id = user_one_uuid
    INTERSECT
    SELECT unnest(p2.interests) AS interest
    FROM profiles p2 WHERE p2.id = user_two_uuid
  ) common_interests;
  
  -- Age compatibility (closer ages = higher score)
  SELECT ABS(p1.age - p2.age) INTO age_difference
  FROM profiles p1, profiles p2
  WHERE p1.id = user_one_uuid AND p2.id = user_two_uuid;
  
  -- Location compatibility
  SELECT p1.location = p2.location INTO location_match
  FROM profiles p1, profiles p2
  WHERE p1.id = user_one_uuid AND p2.id = user_two_uuid;
  
  -- Calculate base score
  score := (interest_overlap * 20) + 
           (CASE WHEN age_difference <= 3 THEN 30
                 WHEN age_difference <= 5 THEN 20
                 WHEN age_difference <= 10 THEN 10
                 ELSE 0 END) +
           (CASE WHEN location_match THEN 25 ELSE 0 END) +
           (RANDOM() * 25); -- Add some randomness for variety
  
  -- Cap at 100
  RETURN LEAST(score, 100);
END;
$$;

-- Add performance indexes for common queries
CREATE INDEX IF NOT EXISTS feed_posts_user_created_idx ON public.feed_posts (user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS feed_posts_engagement_idx ON public.feed_posts (engagement_score DESC, created_at DESC);
CREATE INDEX IF NOT EXISTS user_interactions_post_type_idx ON public.user_interactions (post_id, interaction_type);
CREATE INDEX IF NOT EXISTS notifications_user_read_idx ON public.notifications (user_id, read_at);
CREATE INDEX IF NOT EXISTS messages_conversation_created_idx ON public.messages (conversation_id, created_at DESC);
CREATE INDEX IF NOT EXISTS admin_content_status_published_idx ON public.admin_content (status, published_at DESC);

-- Enable real-time for key tables
ALTER TABLE public.feed_posts REPLICA IDENTITY FULL;
ALTER TABLE public.user_interactions REPLICA IDENTITY FULL;
ALTER TABLE public.notifications REPLICA IDENTITY FULL;
ALTER TABLE public.messages REPLICA IDENTITY FULL;

-- Add to realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE public.feed_posts;
ALTER PUBLICATION supabase_realtime ADD TABLE public.user_interactions;
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;