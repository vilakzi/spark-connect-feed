-- Create user_reports table for reporting system
CREATE TABLE public.user_reports (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  reporter_id UUID NOT NULL,
  reported_user_id UUID NOT NULL,
  reason TEXT NOT NULL,
  description TEXT,
  evidence_urls TEXT[] DEFAULT '{}',
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'reviewed', 'resolved', 'dismissed')),
  reviewed_by UUID,
  reviewed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create blocked_users table for user blocking functionality
CREATE TABLE public.blocked_users (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  blocker_id UUID NOT NULL,
  blocked_id UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(blocker_id, blocked_id)
);

-- Create swipe_actions table for tracking swipes
CREATE TABLE public.swipe_actions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  target_user_id UUID NOT NULL,
  action_type TEXT NOT NULL CHECK (action_type IN ('like', 'pass', 'super_like')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, target_user_id)
);

-- Create compatibility_scores table for matching algorithm
CREATE TABLE public.compatibility_scores (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_one_id UUID NOT NULL,
  user_two_id UUID NOT NULL,
  score DECIMAL(3,2) NOT NULL CHECK (score >= 0 AND score <= 1),
  factors JSONB DEFAULT '{}',
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_one_id, user_two_id)
);

-- Enable RLS on all new tables
ALTER TABLE public.user_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.blocked_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.swipe_actions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.compatibility_scores ENABLE ROW LEVEL SECURITY;

-- RLS Policies for user_reports
CREATE POLICY "Users can create reports" ON public.user_reports
FOR INSERT WITH CHECK (auth.uid() = reporter_id);

CREATE POLICY "Users can view their own reports" ON public.user_reports
FOR SELECT USING (auth.uid() = reporter_id);

CREATE POLICY "Admins can manage all reports" ON public.user_reports
FOR ALL USING (is_admin());

-- RLS Policies for blocked_users
CREATE POLICY "Users can manage their own blocks" ON public.blocked_users
FOR ALL USING (auth.uid() = blocker_id);

-- RLS Policies for swipe_actions
CREATE POLICY "Users can manage their own swipes" ON public.swipe_actions
FOR ALL USING (auth.uid() = user_id);

-- RLS Policies for compatibility_scores
CREATE POLICY "Users can view scores involving them" ON public.compatibility_scores
FOR SELECT USING (auth.uid() = user_one_id OR auth.uid() = user_two_id);

CREATE POLICY "System can manage compatibility scores" ON public.compatibility_scores
FOR ALL USING (true);

-- Add triggers for updated_at columns
CREATE TRIGGER update_user_reports_updated_at
BEFORE UPDATE ON public.user_reports
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_compatibility_scores_updated_at
BEFORE UPDATE ON public.compatibility_scores
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Create function to calculate compatibility score
CREATE OR REPLACE FUNCTION public.calculate_compatibility_score(user_one_id UUID, user_two_id UUID)
RETURNS DECIMAL(3,2)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  user_one_profile RECORD;
  user_two_profile RECORD;
  user_one_prefs RECORD;
  user_two_prefs RECORD;
  score DECIMAL(3,2) := 0;
  age_compatibility DECIMAL(3,2) := 0;
  location_compatibility DECIMAL(3,2) := 0;
  interest_compatibility DECIMAL(3,2) := 0;
BEGIN
  -- Get profiles
  SELECT * INTO user_one_profile FROM public.profiles WHERE id = user_one_id;
  SELECT * INTO user_two_profile FROM public.profiles WHERE id = user_two_id;
  
  -- Get preferences
  SELECT * INTO user_one_prefs FROM public.user_preferences WHERE user_id = user_one_id;
  SELECT * INTO user_two_prefs FROM public.user_preferences WHERE user_id = user_two_id;
  
  -- Age compatibility (check if users fall within each other's age preferences)
  IF user_one_profile.age IS NOT NULL AND user_two_profile.age IS NOT NULL AND
     user_one_prefs IS NOT NULL AND user_two_prefs IS NOT NULL THEN
    IF user_one_profile.age BETWEEN user_two_prefs.min_age AND user_two_prefs.max_age AND
       user_two_profile.age BETWEEN user_one_prefs.min_age AND user_one_prefs.max_age THEN
      age_compatibility := 1.0;
    ELSE
      age_compatibility := 0.0;
    END IF;
  END IF;
  
  -- Location compatibility (simplified - both have location)
  IF user_one_profile.location IS NOT NULL AND user_two_profile.location IS NOT NULL THEN
    location_compatibility := 0.8;
  ELSIF user_one_profile.location IS NULL AND user_two_profile.location IS NULL THEN
    location_compatibility := 0.5;
  ELSE
    location_compatibility := 0.3;
  END IF;
  
  -- Interest compatibility (count common interests)
  IF user_one_profile.interests IS NOT NULL AND user_two_profile.interests IS NOT NULL THEN
    SELECT COALESCE(
      ARRAY_LENGTH(
        ARRAY(
          SELECT UNNEST(user_one_profile.interests) 
          INTERSECT 
          SELECT UNNEST(user_two_profile.interests)
        ), 1
      ) * 1.0 / GREATEST(
        ARRAY_LENGTH(user_one_profile.interests, 1),
        ARRAY_LENGTH(user_two_profile.interests, 1)
      ), 0
    ) INTO interest_compatibility;
  END IF;
  
  -- Calculate weighted score
  score := (age_compatibility * 0.4) + (location_compatibility * 0.3) + (interest_compatibility * 0.3);
  
  -- Ensure score is between 0 and 1
  score := GREATEST(0, LEAST(1, score));
  
  RETURN score;
END;
$$;

-- Create function to get potential matches for a user
CREATE OR REPLACE FUNCTION public.get_potential_matches(user_id_param UUID, limit_param INTEGER DEFAULT 10)
RETURNS TABLE(
  profile_id UUID,
  display_name TEXT,
  age INTEGER,
  bio TEXT,
  location TEXT,
  profile_image_url TEXT,
  profile_images TEXT[],
  interests TEXT[],
  photo_verified BOOLEAN,
  compatibility_score DECIMAL(3,2)
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  user_prefs RECORD;
BEGIN
  -- Get user preferences
  SELECT * INTO user_prefs FROM public.user_preferences WHERE user_id = user_id_param LIMIT 1;
  
  RETURN QUERY
  SELECT 
    p.id,
    p.display_name,
    p.age,
    p.bio,
    p.location,
    p.profile_image_url,
    p.profile_images,
    p.interests,
    p.photo_verified,
    COALESCE(cs.score, public.calculate_compatibility_score(user_id_param, p.id)) as compatibility_score
  FROM public.profiles p
  LEFT JOIN public.compatibility_scores cs ON 
    (cs.user_one_id = user_id_param AND cs.user_two_id = p.id) OR
    (cs.user_one_id = p.id AND cs.user_two_id = user_id_param)
  WHERE 
    p.id != user_id_param
    AND p.id NOT IN (
      -- Exclude already swiped users
      SELECT target_user_id FROM public.swipe_actions WHERE user_id = user_id_param
    )
    AND p.id NOT IN (
      -- Exclude blocked users
      SELECT blocked_id FROM public.blocked_users WHERE blocker_id = user_id_param
    )
    AND p.id NOT IN (
      -- Exclude users who blocked current user
      SELECT blocker_id FROM public.blocked_users WHERE blocked_id = user_id_param
    )
    AND (
      user_prefs IS NULL OR
      (p.age IS NULL OR p.age BETWEEN COALESCE(user_prefs.min_age, 18) AND COALESCE(user_prefs.max_age, 50))
    )
    AND p.is_blocked = false
  ORDER BY compatibility_score DESC, RANDOM()
  LIMIT limit_param;
END;
$$;

-- Create function to create a match when mutual like occurs
CREATE OR REPLACE FUNCTION public.create_match_on_mutual_like()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  mutual_like_exists BOOLEAN := false;
BEGIN
  -- Only proceed if this is a like action
  IF NEW.action_type != 'like' THEN
    RETURN NEW;
  END IF;
  
  -- Check if the target user has also liked this user
  SELECT EXISTS(
    SELECT 1 FROM public.swipe_actions 
    WHERE user_id = NEW.target_user_id 
    AND target_user_id = NEW.user_id 
    AND action_type = 'like'
  ) INTO mutual_like_exists;
  
  -- If mutual like exists, create a match
  IF mutual_like_exists THEN
    INSERT INTO public.matches (user_one_id, user_two_id, is_super_like, created_at)
    VALUES (
      LEAST(NEW.user_id, NEW.target_user_id),
      GREATEST(NEW.user_id, NEW.target_user_id),
      NEW.action_type = 'super_like',
      now()
    )
    ON CONFLICT (user_one_id, user_two_id) DO NOTHING;
    
    -- Create notifications for both users
    INSERT INTO public.notifications (user_id, type, title, message, data)
    VALUES 
      (NEW.user_id, 'match', 'New Match!', 'You have a new match', jsonb_build_object('match_user_id', NEW.target_user_id)),
      (NEW.target_user_id, 'match', 'New Match!', 'You have a new match', jsonb_build_object('match_user_id', NEW.user_id));
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger for automatic match creation
CREATE TRIGGER create_match_on_mutual_like_trigger
AFTER INSERT ON public.swipe_actions
FOR EACH ROW EXECUTE FUNCTION public.create_match_on_mutual_like();

-- Add missing unique constraint to matches table to prevent duplicates
ALTER TABLE public.matches ADD CONSTRAINT unique_match_pair 
UNIQUE (user_one_id, user_two_id);