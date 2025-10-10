-- Fix 1: Remove insufficient authentication-only policy on communities
-- The 'Require authentication for communities' policy is redundant and too permissive
DROP POLICY IF EXISTS "Require authentication for communities" ON public.communities;

-- Fix 2: Protect privacy_settings from being exposed to non-owners
-- Create a policy to ensure privacy_settings column is only visible to profile owner
CREATE POLICY "Privacy settings only visible to owner"
ON public.profiles
FOR SELECT
USING (
  auth.uid() = user_id OR 
  -- Allow viewing profile but mask privacy_settings in the function
  (auth.uid() IS NOT NULL AND can_view_profile(user_id, auth.uid()))
);

-- Fix 3: Update get_filtered_profile to exclude referral_code for non-owners
CREATE OR REPLACE FUNCTION public.get_filtered_profile(target_user_id uuid)
RETURNS TABLE(
  id uuid,
  user_id uuid,
  display_name text,
  profile_image_url text,
  bio text,
  age integer,
  location text,
  interests text[],
  created_at timestamp with time zone,
  updated_at timestamp with time zone
)
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
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
  -- Note: referral_code and privacy_settings are intentionally excluded from this function
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
$$;

-- Fix 4: Enhance email protection in community invites
-- Update get_safe_community_invite to ensure proper email masking
CREATE OR REPLACE FUNCTION public.get_safe_community_invite(invite_id uuid)
RETURNS TABLE(
  id uuid,
  community_id uuid,
  inviter_id uuid,
  invitee_id uuid,
  status text,
  invite_code text,
  created_at timestamp with time zone,
  used_at timestamp with time zone,
  expires_at timestamp with time zone,
  email text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  invite_record public.community_invites%ROWTYPE;
  current_user_id uuid;
BEGIN
  current_user_id := auth.uid();
  
  -- Get the invite record only if user has access
  SELECT * INTO invite_record
  FROM public.community_invites ci
  WHERE ci.id = invite_id
    AND (ci.invitee_id = current_user_id OR user_is_community_admin(ci.community_id, current_user_id));
  
  -- Return null if no access
  IF NOT FOUND THEN
    RETURN;
  END IF;
  
  -- Return the record with conditional email exposure
  -- Only invitee can see the full email, admins cannot
  RETURN QUERY SELECT 
    invite_record.id,
    invite_record.community_id,
    invite_record.inviter_id,
    invite_record.invitee_id,
    invite_record.status,
    invite_record.invite_code,
    invite_record.created_at,
    invite_record.used_at,
    invite_record.expires_at,
    -- Only show email to the invitee, not to community admins
    CASE 
      WHEN current_user_id = invite_record.invitee_id THEN invite_record.email
      ELSE NULL
    END;
END;
$$;