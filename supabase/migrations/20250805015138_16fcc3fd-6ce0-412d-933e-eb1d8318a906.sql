-- Fix security warnings by explicitly setting search_path for all new functions

-- Update calculate_compatibility_score function with explicit search_path
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

-- Update get_potential_matches function with explicit search_path
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