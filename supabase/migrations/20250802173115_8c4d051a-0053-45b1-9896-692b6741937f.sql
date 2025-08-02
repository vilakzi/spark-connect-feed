-- COMPREHENSIVE SUPABASE DATABASE CLEANUP (Fixed)
-- Phase 1: Drop problematic views that expose auth.users data
DROP VIEW IF EXISTS public.admin_user_overview CASCADE;
DROP VIEW IF EXISTS public.admin_payment_overview CASCADE; 
DROP VIEW IF EXISTS public.new_joiners_feed CASCADE;
DROP VIEW IF EXISTS public.database_health_metrics CASCADE;
DROP VIEW IF EXISTS public.database_cleanup_metrics CASCADE;
DROP VIEW IF EXISTS public.index_improvement_recommendations CASCADE;

-- Phase 2: Remove unused tables with 0 rows
DROP TABLE IF EXISTS public.user_preferences CASCADE;
DROP TABLE IF EXISTS public.superadmin_sessions CASCADE;
DROP TABLE IF EXISTS public.content_approvals CASCADE;
DROP TABLE IF EXISTS public.content_tags CASCADE;
DROP TABLE IF EXISTS public.messages CASCADE;
DROP TABLE IF EXISTS public.conversations CASCADE;
DROP TABLE IF EXISTS public.typing_indicators CASCADE;
DROP TABLE IF EXISTS public.profile_views CASCADE;
DROP TABLE IF EXISTS public.stories CASCADE;
DROP TABLE IF EXISTS public.story_views CASCADE;
DROP TABLE IF EXISTS public.report_evidence CASCADE;
DROP TABLE IF EXISTS public.user_reports CASCADE;
DROP TABLE IF EXISTS public.notification_preferences CASCADE;
DROP TABLE IF EXISTS public.user_behavior_analytics CASCADE;
DROP TABLE IF EXISTS public.post_payments CASCADE;
DROP TABLE IF EXISTS public.subscribers CASCADE;
DROP TABLE IF EXISTS public.daily_usage CASCADE;
DROP TABLE IF EXISTS public.super_likes CASCADE;
DROP TABLE IF EXISTS public.blocked_users CASCADE;
DROP TABLE IF EXISTS public.matches CASCADE;
DROP TABLE IF EXISTS public.swipes CASCADE;

-- Phase 3: Remove broken and unused functions
DROP FUNCTION IF EXISTS public.check_database_health() CASCADE;
DROP FUNCTION IF EXISTS public.cleanup_anonymous_users() CASCADE;
DROP FUNCTION IF EXISTS public.cleanup_dead_rows() CASCADE;
DROP FUNCTION IF EXISTS public.cleanup_old_logs() CASCADE;
DROP FUNCTION IF EXISTS public.recommend_index_improvements() CASCADE;
DROP FUNCTION IF EXISTS public.reset_daily_usage() CASCADE;
DROP FUNCTION IF EXISTS public.cleanup_expired_matches() CASCADE;
DROP FUNCTION IF EXISTS public.check_and_create_match() CASCADE;
DROP FUNCTION IF EXISTS public.expire_matches() CASCADE;
DROP FUNCTION IF EXISTS public.create_conversation_from_match(uuid) CASCADE;
DROP FUNCTION IF EXISTS public.update_conversation_last_message() CASCADE;
DROP FUNCTION IF EXISTS public.update_last_active() CASCADE;
DROP FUNCTION IF EXISTS public.log_post_payments_changes() CASCADE;
DROP FUNCTION IF EXISTS public.get_ai_matching_suggestions(uuid, integer) CASCADE;
DROP FUNCTION IF EXISTS public.is_new_joiner() CASCADE;
DROP FUNCTION IF EXISTS public.has_role(mutable text) CASCADE;

-- Phase 4: Fix remaining functions with proper security
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Create profile with metadata or defaults
  INSERT INTO public.profiles (
    id, 
    display_name, 
    created_at, 
    updated_at,
    user_type,
    role
  )
  VALUES (
    NEW.id,
    COALESCE(
      NEW.raw_user_meta_data ->> 'display_name', 
      NEW.raw_user_meta_data ->> 'name', 
      split_part(NEW.email, '@', 1)
    ),
    NOW(),
    NOW(),
    'user'::user_type,
    'user'::app_role
  );
  
  -- Create user_roles entry
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'user'::app_role)
  ON CONFLICT (user_id, role) DO NOTHING;
  
  RETURN NEW;
END;
$$;

-- Recreate trigger for new users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Phase 5: Optimize active tables with proper indexes (fixed predicates)
CREATE INDEX IF NOT EXISTS idx_profiles_user_type ON public.profiles(user_type);
CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);
CREATE INDEX IF NOT EXISTS idx_profiles_last_active ON public.profiles(last_active);
CREATE INDEX IF NOT EXISTS idx_admin_content_status ON public.admin_content(status);
CREATE INDEX IF NOT EXISTS idx_admin_content_category ON public.admin_content(category);
CREATE INDEX IF NOT EXISTS idx_posts_provider_id ON public.posts(provider_id);
CREATE INDEX IF NOT EXISTS idx_posts_expires_at ON public.posts(expires_at);
CREATE INDEX IF NOT EXISTS idx_feed_posts_user_id ON public.feed_posts(user_id);
CREATE INDEX IF NOT EXISTS idx_feed_posts_created_at ON public.feed_posts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_user_feed_preferences_user_id ON public.user_feed_preferences(user_id);

-- Phase 6: Clean up audit log of deleted table references
DELETE FROM public.audit_log WHERE table_name IN (
  'user_preferences', 'superadmin_sessions', 'content_approvals', 'content_tags',
  'messages', 'conversations', 'typing_indicators', 'profile_views', 'stories',
  'story_views', 'report_evidence', 'user_reports', 'notification_preferences',
  'user_behavior_analytics', 'post_payments', 'subscribers', 'daily_usage',
  'super_likes', 'blocked_users', 'matches', 'swipes'
);

-- Phase 7: Update remaining functions to use proper search paths
CREATE OR REPLACE FUNCTION public.update_post_engagement_score(post_id_param uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  weighted_score FLOAT;
  time_decay FLOAT;
  post_age INTERVAL;
BEGIN
  -- Calculate weighted engagement score
  SELECT 
    COALESCE(SUM(CASE 
      WHEN interaction_type = 'like' THEN 1
      WHEN interaction_type = 'comment' THEN 3
      WHEN interaction_type = 'share' THEN 5
      WHEN interaction_type = 'view' THEN 0.1
      ELSE 0
    END), 0)
  INTO weighted_score
  FROM public.user_interactions 
  WHERE post_id = post_id_param 
  AND created_at > now() - INTERVAL '7 days';
  
  -- Calculate time decay
  SELECT age(now(), created_at) INTO post_age
  FROM public.feed_posts WHERE id = post_id_param;
  
  time_decay := GREATEST(0.1, 1.0 - (EXTRACT(epoch FROM post_age) / 86400.0 / 7.0));
  
  -- Update engagement score
  UPDATE public.feed_posts 
  SET 
    engagement_score = weighted_score * time_decay,
    updated_at = now()
  WHERE id = post_id_param;
END;
$$;

-- Phase 8: Performance maintenance
VACUUM ANALYZE public.profiles;
VACUUM ANALYZE public.admin_content;
VACUUM ANALYZE public.posts;
VACUUM ANALYZE public.feed_posts;
VACUUM ANALYZE public.user_roles;
VACUUM ANALYZE public.audit_log;