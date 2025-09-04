-- Drop the insecure policy that allows viewing all profiles
DROP POLICY IF EXISTS "Users can view all profiles" ON public.profiles;

-- Create a security definer function to check profile visibility
-- This prevents RLS recursion issues while checking privacy settings
CREATE OR REPLACE FUNCTION public.can_view_profile(profile_user_id UUID, viewer_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  profile_privacy JSONB;
  is_public BOOLEAN DEFAULT true;
BEGIN
  -- Users can always view their own profile
  IF profile_user_id = viewer_id THEN
    RETURN true;
  END IF;
  
  -- Get the privacy settings for the profile
  SELECT privacy_settings INTO profile_privacy 
  FROM public.profiles 
  WHERE user_id = profile_user_id;
  
  -- If no privacy settings found, default to public for backward compatibility
  IF profile_privacy IS NULL THEN
    RETURN true;
  END IF;
  
  -- Check if profile is set to private
  is_public := COALESCE((profile_privacy->>'is_public')::boolean, true);
  
  -- If profile is private, only the owner can see it
  IF NOT is_public THEN
    RETURN false;
  END IF;
  
  -- Additional privacy checks can be added here
  -- For example: blocked users, friends-only visibility, etc.
  
  RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE SET search_path = public;

-- Create secure RLS policies for profiles
CREATE POLICY "Users can view profiles based on privacy settings" 
ON public.profiles 
FOR SELECT 
USING (
  -- Always allow viewing own profile
  auth.uid() = user_id 
  OR 
  -- Check privacy settings for other profiles
  public.can_view_profile(user_id, auth.uid())
);

-- Update the profiles table to have better default privacy settings
-- Set default privacy to allow public viewing but give users control
UPDATE public.profiles 
SET privacy_settings = jsonb_build_object(
  'is_public', true,
  'show_age', true,
  'show_location', true,
  'show_interests', true
)
WHERE privacy_settings = '{}' OR privacy_settings IS NULL;

-- Create additional privacy-aware policies for other sensitive operations
-- Ensure location and age can be hidden based on privacy settings
CREATE OR REPLACE FUNCTION public.get_filtered_profile(target_user_id UUID)
RETURNS TABLE (
  id UUID,
  user_id UUID,
  display_name TEXT,
  profile_image_url TEXT,
  bio TEXT,
  age INTEGER,
  location TEXT,
  interests TEXT[],
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
) AS $$
DECLARE
  profile_record public.profiles%ROWTYPE;
  viewer_id UUID;
  privacy_settings JSONB;
BEGIN
  viewer_id := auth.uid();
  
  -- Get the full profile
  SELECT * INTO profile_record 
  FROM public.profiles p 
  WHERE p.user_id = target_user_id;
  
  -- If no profile found or user can't view it, return nothing
  IF NOT FOUND OR NOT public.can_view_profile(target_user_id, viewer_id) THEN
    RETURN;
  END IF;
  
  privacy_settings := profile_record.privacy_settings;
  
  -- Return filtered data based on privacy settings
  RETURN QUERY SELECT 
    profile_record.id,
    profile_record.user_id,
    profile_record.display_name,
    profile_record.profile_image_url,
    profile_record.bio,
    -- Hide age if privacy setting says so (unless viewing own profile)
    CASE 
      WHEN viewer_id = target_user_id OR COALESCE((privacy_settings->>'show_age')::boolean, true) 
      THEN profile_record.age 
      ELSE NULL 
    END,
    -- Hide location if privacy setting says so (unless viewing own profile)
    CASE 
      WHEN viewer_id = target_user_id OR COALESCE((privacy_settings->>'show_location')::boolean, true) 
      THEN profile_record.location 
      ELSE NULL 
    END,
    -- Hide interests if privacy setting says so (unless viewing own profile)
    CASE 
      WHEN viewer_id = target_user_id OR COALESCE((privacy_settings->>'show_interests')::boolean, true) 
      THEN profile_record.interests 
      ELSE NULL 
    END,
    profile_record.created_at,
    profile_record.updated_at;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE SET search_path = public;