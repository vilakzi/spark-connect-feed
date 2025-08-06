-- Fix ON CONFLICT errors by adding missing unique constraints
-- Remove the problematic date function from indexes

-- Fix user_interactions table - prevent duplicate interactions
CREATE UNIQUE INDEX IF NOT EXISTS user_interactions_user_post_type_unique 
ON public.user_interactions (user_id, post_id, interaction_type);

-- Fix post_likes table - prevent duplicate likes
CREATE UNIQUE INDEX IF NOT EXISTS post_likes_user_post_unique 
ON public.post_likes (user_id, post_id);

-- Fix story_views table - prevent duplicate views
CREATE UNIQUE INDEX IF NOT EXISTS story_views_viewer_story_unique 
ON public.story_views (viewer_id, story_id);

-- Fix profile_views table - prevent duplicate views (remove date function)
CREATE UNIQUE INDEX IF NOT EXISTS profile_views_viewer_viewed_unique 
ON public.profile_views (viewer_id, viewed_id);

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