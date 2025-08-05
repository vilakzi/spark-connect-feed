-- Create AI matching and social features tables

-- Enhanced compatibility scoring with AI features
CREATE TABLE public.ai_compatibility_analysis (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_one_id UUID NOT NULL,
  user_two_id UUID NOT NULL,
  compatibility_score NUMERIC(5,2) NOT NULL DEFAULT 0,
  personality_match JSONB DEFAULT '{}',
  interest_overlap JSONB DEFAULT '{}',
  communication_style JSONB DEFAULT '{}',
  lifestyle_compatibility JSONB DEFAULT '{}',
  prediction_confidence NUMERIC(3,2) DEFAULT 0,
  analysis_version TEXT DEFAULT 'v1.0',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_one_id, user_two_id)
);

-- Social proof and validation
CREATE TABLE public.social_validation (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  validation_type TEXT NOT NULL, -- 'mutual_friends', 'social_proof', 'popularity_score'
  validation_data JSONB DEFAULT '{}',
  score NUMERIC(5,2) DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Interest-based communities
CREATE TABLE public.communities (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL,
  image_url TEXT,
  member_count INTEGER DEFAULT 0,
  is_private BOOLEAN DEFAULT false,
  created_by UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Community memberships
CREATE TABLE public.community_memberships (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  community_id UUID NOT NULL REFERENCES public.communities(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  role TEXT DEFAULT 'member', -- 'member', 'moderator', 'admin'
  joined_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(community_id, user_id)
);

-- Social events
CREATE TABLE public.social_events (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  event_date TIMESTAMP WITH TIME ZONE NOT NULL,
  location TEXT,
  community_id UUID REFERENCES public.communities(id) ON DELETE CASCADE,
  created_by UUID NOT NULL,
  max_attendees INTEGER,
  current_attendees INTEGER DEFAULT 0,
  image_url TEXT,
  event_type TEXT DEFAULT 'meetup', -- 'meetup', 'activity', 'party', 'casual'
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Event attendees
CREATE TABLE public.event_attendees (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  event_id UUID NOT NULL REFERENCES public.social_events(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  status TEXT DEFAULT 'going', -- 'going', 'interested', 'maybe'
  joined_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(event_id, user_id)
);

-- Enhanced profile metrics for social proof
CREATE TABLE public.profile_metrics (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE,
  popularity_score NUMERIC(5,2) DEFAULT 0,
  engagement_rate NUMERIC(3,2) DEFAULT 0,
  response_rate NUMERIC(3,2) DEFAULT 0,
  verification_level INTEGER DEFAULT 0, -- 0-5 verification levels
  social_proof_count INTEGER DEFAULT 0,
  mutual_connections_count INTEGER DEFAULT 0,
  community_participation_score NUMERIC(5,2) DEFAULT 0,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.ai_compatibility_analysis ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.social_validation ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.communities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.community_memberships ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.social_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_attendees ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profile_metrics ENABLE ROW LEVEL SECURITY;

-- RLS Policies for AI compatibility
CREATE POLICY "Users can view compatibility involving them" 
ON public.ai_compatibility_analysis 
FOR SELECT 
USING ((auth.uid() = user_one_id) OR (auth.uid() = user_two_id));

CREATE POLICY "System can manage compatibility scores" 
ON public.ai_compatibility_analysis 
FOR ALL 
USING (true);

-- RLS Policies for social validation
CREATE POLICY "Users can view their social validation" 
ON public.social_validation 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "System can manage social validation" 
ON public.social_validation 
FOR ALL 
USING (true);

-- RLS Policies for communities
CREATE POLICY "Anyone can view public communities" 
ON public.communities 
FOR SELECT 
USING (NOT is_private OR EXISTS (
  SELECT 1 FROM public.community_memberships 
  WHERE community_id = communities.id AND user_id = auth.uid()
));

CREATE POLICY "Users can create communities" 
ON public.communities 
FOR INSERT 
WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Community creators and admins can update" 
ON public.communities 
FOR UPDATE 
USING (auth.uid() = created_by OR EXISTS (
  SELECT 1 FROM public.community_memberships 
  WHERE community_id = communities.id AND user_id = auth.uid() AND role = 'admin'
));

-- RLS Policies for community memberships
CREATE POLICY "Members can view community memberships" 
ON public.community_memberships 
FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM public.communities 
  WHERE communities.id = community_memberships.community_id 
  AND (NOT communities.is_private OR EXISTS (
    SELECT 1 FROM public.community_memberships cm2 
    WHERE cm2.community_id = communities.id AND cm2.user_id = auth.uid()
  ))
));

CREATE POLICY "Users can join communities" 
ON public.community_memberships 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can manage their memberships" 
ON public.community_memberships 
FOR ALL 
USING (auth.uid() = user_id);

-- RLS Policies for social events
CREATE POLICY "Users can view community events" 
ON public.social_events 
FOR SELECT 
USING (community_id IS NULL OR EXISTS (
  SELECT 1 FROM public.community_memberships 
  WHERE community_id = social_events.community_id AND user_id = auth.uid()
));

CREATE POLICY "Community members can create events" 
ON public.social_events 
FOR INSERT 
WITH CHECK (auth.uid() = created_by AND (
  community_id IS NULL OR EXISTS (
    SELECT 1 FROM public.community_memberships 
    WHERE community_id = social_events.community_id AND user_id = auth.uid()
  )
));

-- RLS Policies for event attendees
CREATE POLICY "Users can view event attendees" 
ON public.event_attendees 
FOR SELECT 
USING (true);

CREATE POLICY "Users can manage their event attendance" 
ON public.event_attendees 
FOR ALL 
USING (auth.uid() = user_id) 
WITH CHECK (auth.uid() = user_id);

-- RLS Policies for profile metrics
CREATE POLICY "Users can view all profile metrics" 
ON public.profile_metrics 
FOR SELECT 
USING (true);

CREATE POLICY "Users can update their own metrics" 
ON public.profile_metrics 
FOR ALL 
USING (auth.uid() = user_id) 
WITH CHECK (auth.uid() = user_id);

-- Triggers for updating timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_ai_compatibility_analysis_updated_at 
BEFORE UPDATE ON public.ai_compatibility_analysis 
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_social_validation_updated_at 
BEFORE UPDATE ON public.social_validation 
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_communities_updated_at 
BEFORE UPDATE ON public.communities 
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_social_events_updated_at 
BEFORE UPDATE ON public.social_events 
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_profile_metrics_updated_at 
BEFORE UPDATE ON public.profile_metrics 
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to calculate compatibility score
CREATE OR REPLACE FUNCTION calculate_compatibility_score(
  user_one_uuid UUID,
  user_two_uuid UUID
) RETURNS NUMERIC AS $$
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
$$ LANGUAGE plpgsql SECURITY DEFINER;