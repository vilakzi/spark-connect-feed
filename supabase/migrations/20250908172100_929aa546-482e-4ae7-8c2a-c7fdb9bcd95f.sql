-- Phase 6: Advanced Creator Dashboard & Analytics

-- Create creator_analytics table for comprehensive tracking
CREATE TABLE public.creator_analytics (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  creator_id uuid NOT NULL,
  date date NOT NULL DEFAULT CURRENT_DATE,
  
  -- Content metrics
  posts_created integer DEFAULT 0,
  posts_liked integer DEFAULT 0,
  posts_shared integer DEFAULT 0,
  posts_commented integer DEFAULT 0,
  
  -- Engagement metrics
  total_views integer DEFAULT 0,
  unique_viewers integer DEFAULT 0,
  avg_view_duration integer DEFAULT 0, -- in seconds
  engagement_rate numeric(5,2) DEFAULT 0.00,
  
  -- Follower metrics
  followers_gained integer DEFAULT 0,
  followers_lost integer DEFAULT 0,
  total_followers integer DEFAULT 0,
  
  -- Revenue metrics
  revenue_cents integer DEFAULT 0,
  tips_received integer DEFAULT 0,
  subscriptions_gained integer DEFAULT 0,
  subscriptions_lost integer DEFAULT 0,
  
  -- Live streaming metrics
  streams_count integer DEFAULT 0,
  total_stream_minutes integer DEFAULT 0,
  avg_concurrent_viewers numeric(8,2) DEFAULT 0.00,
  peak_viewers integer DEFAULT 0,
  
  -- Growth metrics
  profile_visits integer DEFAULT 0,
  content_discoveries integer DEFAULT 0,
  
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  
  UNIQUE(creator_id, date)
);

-- Enable RLS on creator_analytics
ALTER TABLE public.creator_analytics ENABLE ROW LEVEL SECURITY;

-- Create policies for creator_analytics
CREATE POLICY "Creators can view their own analytics"
ON public.creator_analytics
FOR SELECT
USING (auth.uid() = creator_id);

CREATE POLICY "Creators can update their own analytics"
ON public.creator_analytics
FOR ALL
USING (auth.uid() = creator_id)
WITH CHECK (auth.uid() = creator_id);

-- Create creator_goals table for performance targets
CREATE TABLE public.creator_goals (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  creator_id uuid NOT NULL,
  goal_type text NOT NULL CHECK (goal_type IN ('followers', 'revenue', 'engagement', 'content', 'streams')),
  target_value integer NOT NULL,
  current_value integer DEFAULT 0,
  deadline date,
  is_active boolean DEFAULT true,
  achieved_at timestamp with time zone,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS on creator_goals
ALTER TABLE public.creator_goals ENABLE ROW LEVEL SECURITY;

-- Create policies for creator_goals
CREATE POLICY "Creators can manage their own goals"
ON public.creator_goals
FOR ALL
USING (auth.uid() = creator_id)
WITH CHECK (auth.uid() = creator_id);

-- Create content_performance table for individual content tracking
CREATE TABLE public.content_performance (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  content_id uuid NOT NULL,
  content_type text NOT NULL CHECK (content_type IN ('post', 'stream', 'story')),
  creator_id uuid NOT NULL,
  
  -- Performance metrics
  views integer DEFAULT 0,
  unique_views integer DEFAULT 0,
  likes integer DEFAULT 0,
  comments integer DEFAULT 0,
  shares integer DEFAULT 0,
  saves integer DEFAULT 0,
  
  -- Time-based metrics
  avg_view_duration integer DEFAULT 0,
  completion_rate numeric(5,2) DEFAULT 0.00,
  
  -- Audience metrics
  demographics jsonb DEFAULT '{}',
  top_countries text[] DEFAULT '{}',
  age_groups jsonb DEFAULT '{}',
  
  -- Revenue metrics (for monetized content)
  revenue_generated_cents integer DEFAULT 0,
  tips_received_cents integer DEFAULT 0,
  
  -- Engagement timeline
  hourly_views jsonb DEFAULT '{}',
  daily_views jsonb DEFAULT '{}',
  
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS on content_performance
ALTER TABLE public.content_performance ENABLE ROW LEVEL SECURITY;

-- Create policies for content_performance
CREATE POLICY "Creators can view performance of their own content"
ON public.content_performance
FOR SELECT
USING (auth.uid() = creator_id);

CREATE POLICY "System can update content performance"
ON public.content_performance
FOR ALL
WITH CHECK (true);

-- Create audience_insights table for demographic analysis
CREATE TABLE public.audience_insights (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  creator_id uuid NOT NULL,
  date date NOT NULL DEFAULT CURRENT_DATE,
  
  -- Demographic data
  age_18_24 integer DEFAULT 0,
  age_25_34 integer DEFAULT 0,
  age_35_44 integer DEFAULT 0,
  age_45_54 integer DEFAULT 0,
  age_55_plus integer DEFAULT 0,
  
  -- Geographic data
  top_countries jsonb DEFAULT '{}',
  top_cities jsonb DEFAULT '{}',
  
  -- Behavioral data
  peak_activity_hours jsonb DEFAULT '{}',
  device_types jsonb DEFAULT '{}',
  content_preferences jsonb DEFAULT '{}',
  
  -- Engagement patterns
  most_active_day text,
  avg_session_duration integer DEFAULT 0,
  return_visitor_rate numeric(5,2) DEFAULT 0.00,
  
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  
  UNIQUE(creator_id, date)
);

-- Enable RLS on audience_insights
ALTER TABLE public.audience_insights ENABLE ROW LEVEL SECURITY;

-- Create policies for audience_insights
CREATE POLICY "Creators can view their own audience insights"
ON public.audience_insights
FOR SELECT
USING (auth.uid() = creator_id);

CREATE POLICY "System can manage audience insights"
ON public.audience_insights
FOR ALL
WITH CHECK (true);

-- Create revenue_analytics table for detailed earnings tracking
CREATE TABLE public.revenue_analytics (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  creator_id uuid NOT NULL,
  date date NOT NULL DEFAULT CURRENT_DATE,
  
  -- Revenue sources
  tips_revenue_cents integer DEFAULT 0,
  subscription_revenue_cents integer DEFAULT 0,
  stream_revenue_cents integer DEFAULT 0,
  content_revenue_cents integer DEFAULT 0,
  
  -- Transaction counts
  tips_count integer DEFAULT 0,
  new_subscriptions integer DEFAULT 0,
  renewals integer DEFAULT 0,
  cancellations integer DEFAULT 0,
  
  -- Top performers
  top_earning_content jsonb DEFAULT '{}',
  top_tippers jsonb DEFAULT '{}',
  
  -- Projections and trends
  projected_monthly_revenue_cents integer DEFAULT 0,
  growth_rate numeric(5,2) DEFAULT 0.00,
  
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  
  UNIQUE(creator_id, date)
);

-- Enable RLS on revenue_analytics
ALTER TABLE public.revenue_analytics ENABLE ROW LEVEL SECURITY;

-- Create policies for revenue_analytics
CREATE POLICY "Creators can view their own revenue analytics"
ON public.revenue_analytics
FOR SELECT
USING (auth.uid() = creator_id);

-- Create moderation_reports table for content safety
CREATE TABLE public.moderation_reports (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  reporter_id uuid,
  content_id uuid,
  content_type text NOT NULL CHECK (content_type IN ('post', 'comment', 'stream', 'profile', 'message')),
  reported_user_id uuid NOT NULL,
  
  -- Report details
  reason text NOT NULL CHECK (reason IN (
    'spam', 'harassment', 'hate_speech', 'violence', 'nudity', 
    'copyright', 'misinformation', 'illegal_content', 'other'
  )),
  description text,
  evidence_urls text[] DEFAULT '{}',
  
  -- Moderation status
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'reviewing', 'resolved', 'dismissed')),
  moderator_id uuid,
  moderator_notes text,
  action_taken text,
  
  -- Priority and classification
  priority text DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  auto_detected boolean DEFAULT false,
  
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  resolved_at timestamp with time zone,
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS on moderation_reports
ALTER TABLE public.moderation_reports ENABLE ROW LEVEL SECURITY;

-- Create policies for moderation_reports
CREATE POLICY "Users can create reports"
ON public.moderation_reports
FOR INSERT
WITH CHECK (auth.uid() = reporter_id);

CREATE POLICY "Users can view their own reports"
ON public.moderation_reports
FOR SELECT
USING (auth.uid() = reporter_id OR auth.uid() = reported_user_id);

CREATE POLICY "Moderators and admins can manage reports"
ON public.moderation_reports
FOR ALL
USING (
  has_role(auth.uid(), 'admin'::app_role) OR 
  has_role(auth.uid(), 'moderator'::app_role)
);

-- Create creator_achievements table for gamification
CREATE TABLE public.creator_achievements (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  creator_id uuid NOT NULL,
  achievement_type text NOT NULL CHECK (achievement_type IN (
    'first_post', 'first_stream', 'follower_milestone', 'revenue_milestone',
    'engagement_milestone', 'consistency_streak', 'viral_content', 'community_builder'
  )),
  achievement_data jsonb DEFAULT '{}',
  earned_at timestamp with time zone NOT NULL DEFAULT now(),
  is_featured boolean DEFAULT false
);

-- Enable RLS on creator_achievements
ALTER TABLE public.creator_achievements ENABLE ROW LEVEL SECURITY;

-- Create policies for creator_achievements
CREATE POLICY "Creators can view their own achievements"
ON public.creator_achievements
FOR SELECT
USING (auth.uid() = creator_id);

CREATE POLICY "Anyone can view featured achievements"
ON public.creator_achievements
FOR SELECT
USING (is_featured = true);

-- Create indexes for better performance
CREATE INDEX idx_creator_analytics_creator_date ON public.creator_analytics(creator_id, date);
CREATE INDEX idx_creator_analytics_date ON public.creator_analytics(date);
CREATE INDEX idx_content_performance_creator ON public.content_performance(creator_id);
CREATE INDEX idx_content_performance_content ON public.content_performance(content_id, content_type);
CREATE INDEX idx_audience_insights_creator_date ON public.audience_insights(creator_id, date);
CREATE INDEX idx_revenue_analytics_creator_date ON public.revenue_analytics(creator_id, date);
CREATE INDEX idx_moderation_reports_status ON public.moderation_reports(status);
CREATE INDEX idx_moderation_reports_reported_user ON public.moderation_reports(reported_user_id);
CREATE INDEX idx_creator_achievements_creator ON public.creator_achievements(creator_id);

-- Create trigger for updating timestamps
CREATE TRIGGER update_creator_analytics_updated_at
  BEFORE UPDATE ON public.creator_analytics
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_creator_goals_updated_at
  BEFORE UPDATE ON public.creator_goals
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_content_performance_updated_at
  BEFORE UPDATE ON public.content_performance
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_moderation_reports_updated_at
  BEFORE UPDATE ON public.moderation_reports
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Create function to calculate engagement rate
CREATE OR REPLACE FUNCTION public.calculate_engagement_rate(
  likes_count integer,
  comments_count integer,
  shares_count integer,
  views_count integer
)
RETURNS numeric AS $$
BEGIN
  IF views_count = 0 THEN
    RETURN 0;
  END IF;
  
  RETURN ROUND(
    ((likes_count + comments_count + shares_count)::numeric / views_count::numeric) * 100,
    2
  );
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public;

-- Create function to get creator dashboard summary
CREATE OR REPLACE FUNCTION public.get_creator_dashboard_summary(creator_uuid uuid)
RETURNS TABLE(
  today_views integer,
  today_revenue_cents integer,
  total_followers integer,
  engagement_rate numeric,
  monthly_growth numeric,
  top_content jsonb,
  recent_achievements jsonb
) AS $$
DECLARE
  today_date date := CURRENT_DATE;
  last_month_date date := CURRENT_DATE - interval '30 days';
BEGIN
  RETURN QUERY
  SELECT 
    -- Today's metrics
    COALESCE(ca_today.total_views, 0) as today_views,
    COALESCE(ra_today.tips_revenue_cents + ra_today.subscription_revenue_cents + 
             ra_today.stream_revenue_cents + ra_today.content_revenue_cents, 0) as today_revenue_cents,
    COALESCE(ca_today.total_followers, 0) as total_followers,
    COALESCE(ca_today.engagement_rate, 0.00) as engagement_rate,
    
    -- Monthly growth calculation
    CASE 
      WHEN COALESCE(ca_last_month.total_followers, 0) = 0 THEN 0.00
      ELSE ROUND(
        ((COALESCE(ca_today.total_followers, 0) - COALESCE(ca_last_month.total_followers, 0))::numeric 
         / ca_last_month.total_followers::numeric) * 100, 2
      )
    END as monthly_growth,
    
    -- Top content (placeholder)
    '{}'::jsonb as top_content,
    
    -- Recent achievements (last 7 days)
    COALESCE(
      (SELECT jsonb_agg(
        jsonb_build_object(
          'type', achievement_type,
          'data', achievement_data,
          'earned_at', earned_at
        )
      ) 
      FROM public.creator_achievements 
      WHERE creator_id = creator_uuid 
      AND earned_at >= CURRENT_DATE - interval '7 days'
      LIMIT 5), 
      '[]'::jsonb
    ) as recent_achievements
    
  FROM (SELECT creator_uuid as id) creator
  LEFT JOIN public.creator_analytics ca_today ON ca_today.creator_id = creator_uuid AND ca_today.date = today_date
  LEFT JOIN public.creator_analytics ca_last_month ON ca_last_month.creator_id = creator_uuid AND ca_last_month.date = last_month_date
  LEFT JOIN public.revenue_analytics ra_today ON ra_today.creator_id = creator_uuid AND ra_today.date = today_date;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;