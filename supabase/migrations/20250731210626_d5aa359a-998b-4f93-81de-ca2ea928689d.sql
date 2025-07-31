-- Create profile views tracking
CREATE TABLE IF NOT EXISTS public.profile_views (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  viewer_id UUID NOT NULL,
  viewed_id UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(viewer_id, viewed_id, created_at::date)
);

-- Create stories table for 24-hour content
CREATE TABLE IF NOT EXISTS public.stories (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  content_url TEXT NOT NULL,
  content_type TEXT NOT NULL DEFAULT 'image',
  caption TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT (now() + INTERVAL '24 hours'),
  view_count INTEGER DEFAULT 0
);

-- Create story views tracking
CREATE TABLE IF NOT EXISTS public.story_views (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  story_id UUID NOT NULL,
  viewer_id UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(story_id, viewer_id)
);

-- Create user reports enhancement
CREATE TABLE IF NOT EXISTS public.report_evidence (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  report_id UUID NOT NULL,
  evidence_type TEXT NOT NULL, -- 'screenshot', 'message', 'profile'
  evidence_url TEXT,
  evidence_data JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create AI moderation logs
CREATE TABLE IF NOT EXISTS public.ai_moderation_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  content_id UUID,
  content_type TEXT NOT NULL, -- 'profile_image', 'story', 'message'
  content_url TEXT,
  moderation_result JSONB,
  confidence_score FLOAT,
  action_taken TEXT, -- 'approved', 'flagged', 'rejected'
  reviewed_by UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create push notification preferences
CREATE TABLE IF NOT EXISTS public.notification_preferences (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE,
  push_enabled BOOLEAN DEFAULT true,
  email_enabled BOOLEAN DEFAULT true,
  new_matches BOOLEAN DEFAULT true,
  new_messages BOOLEAN DEFAULT true,
  profile_views BOOLEAN DEFAULT true,
  marketing BOOLEAN DEFAULT false,
  stories BOOLEAN DEFAULT true,
  super_likes BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create enhanced analytics for AI matching
CREATE TABLE IF NOT EXISTS public.user_behavior_analytics (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  action_type TEXT NOT NULL, -- 'swipe_right', 'swipe_left', 'super_like', 'profile_view', 'message_sent'
  target_user_id UUID,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all new tables
ALTER TABLE public.profile_views ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.story_views ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.report_evidence ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_moderation_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notification_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_behavior_analytics ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
-- Profile views policies
CREATE POLICY "Users can view their own profile views"
ON public.profile_views FOR SELECT
USING (auth.uid() = viewed_id);

CREATE POLICY "Users can create profile views"
ON public.profile_views FOR INSERT
WITH CHECK (auth.uid() = viewer_id AND viewer_id != viewed_id);

-- Stories policies
CREATE POLICY "Users can manage their own stories"
ON public.stories FOR ALL
USING (auth.uid() = user_id);

CREATE POLICY "Users can view active stories"
ON public.stories FOR SELECT
USING (expires_at > now() AND auth.uid() IS NOT NULL);

-- Story views policies
CREATE POLICY "Users can view story views for their stories"
ON public.story_views FOR SELECT
USING (EXISTS (
  SELECT 1 FROM public.stories 
  WHERE stories.id = story_views.story_id 
  AND stories.user_id = auth.uid()
));

CREATE POLICY "Users can create story views"
ON public.story_views FOR INSERT
WITH CHECK (auth.uid() = viewer_id);

-- Report evidence policies
CREATE POLICY "Users can manage evidence for their reports"
ON public.report_evidence FOR ALL
USING (EXISTS (
  SELECT 1 FROM public.user_reports 
  WHERE user_reports.id = report_evidence.report_id 
  AND user_reports.reporter_id = auth.uid()
));

CREATE POLICY "Admins can view all report evidence"
ON public.report_evidence FOR SELECT
USING (is_admin());

-- AI moderation policies
CREATE POLICY "Admins can manage AI moderation logs"
ON public.ai_moderation_logs FOR ALL
USING (is_admin());

-- Notification preferences policies
CREATE POLICY "Users can manage their own notification preferences"
ON public.notification_preferences FOR ALL
USING (auth.uid() = user_id);

-- User behavior analytics policies
CREATE POLICY "System can log user behavior"
ON public.user_behavior_analytics FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own behavior analytics"
ON public.user_behavior_analytics FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all behavior analytics"
ON public.user_behavior_analytics FOR SELECT
USING (is_admin());

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_profile_views_viewed_id ON public.profile_views(viewed_id);
CREATE INDEX IF NOT EXISTS idx_profile_views_viewer_id ON public.profile_views(viewer_id);
CREATE INDEX IF NOT EXISTS idx_stories_user_id ON public.stories(user_id);
CREATE INDEX IF NOT EXISTS idx_stories_expires_at ON public.stories(expires_at);
CREATE INDEX IF NOT EXISTS idx_story_views_story_id ON public.story_views(story_id);
CREATE INDEX IF NOT EXISTS idx_user_behavior_analytics_user_id ON public.user_behavior_analytics(user_id);
CREATE INDEX IF NOT EXISTS idx_user_behavior_analytics_action_type ON public.user_behavior_analytics(action_type);

-- Create function to clean up expired stories
CREATE OR REPLACE FUNCTION cleanup_expired_stories()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  DELETE FROM public.stories WHERE expires_at < now();
  DELETE FROM public.story_views WHERE story_id NOT IN (SELECT id FROM public.stories);
END;
$$;

-- Create function to get AI matching suggestions
CREATE OR REPLACE FUNCTION get_ai_matching_suggestions(user_id_param UUID, limit_param INTEGER DEFAULT 10)
RETURNS TABLE(
  user_id UUID,
  compatibility_score FLOAT,
  common_interests INTEGER,
  activity_score FLOAT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.id as user_id,
    -- Simple compatibility score based on common interests and activity
    (
      COALESCE(
        (SELECT COUNT(*) FROM unnest(p.interests) interest 
         WHERE interest = ANY(
           SELECT unnest(up.interests) FROM profiles up WHERE up.id = user_id_param
         )
        ), 0
      )::FLOAT / GREATEST(
        array_length(p.interests, 1), 
        (SELECT array_length(interests, 1) FROM profiles WHERE id = user_id_param), 
        1
      ) * 0.6 +
      -- Activity score (recent activity gets higher score)
      CASE 
        WHEN p.last_active > now() - INTERVAL '1 day' THEN 0.4
        WHEN p.last_active > now() - INTERVAL '3 days' THEN 0.3
        WHEN p.last_active > now() - INTERVAL '7 days' THEN 0.2
        ELSE 0.1
      END
    ) as compatibility_score,
    COALESCE(
      (SELECT COUNT(*) FROM unnest(p.interests) interest 
       WHERE interest = ANY(
         SELECT unnest(up.interests) FROM profiles up WHERE up.id = user_id_param
       )
      ), 0
    )::INTEGER as common_interests,
    CASE 
      WHEN p.last_active > now() - INTERVAL '1 day' THEN 1.0
      WHEN p.last_active > now() - INTERVAL '3 days' THEN 0.75
      WHEN p.last_active > now() - INTERVAL '7 days' THEN 0.5
      ELSE 0.25
    END as activity_score
  FROM profiles p
  WHERE p.id != user_id_param
    AND p.id NOT IN (
      SELECT target_user_id FROM swipes WHERE user_id = user_id_param
    )
    AND p.id NOT IN (
      SELECT blocked_id FROM blocked_users WHERE blocker_id = user_id_param
    )
    AND p.id NOT IN (
      SELECT blocker_id FROM blocked_users WHERE blocked_id = user_id_param
    )
    AND NOT p.is_blocked
  ORDER BY compatibility_score DESC, activity_score DESC
  LIMIT limit_param;
END;
$$;