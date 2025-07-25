-- Phase 1: Fix ensure_user_profile function - rename parameter to avoid column ambiguity
CREATE OR REPLACE FUNCTION public.ensure_user_profile(profile_user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
DECLARE
  user_email TEXT;
  user_metadata JSONB;
BEGIN
  -- Get user email and metadata from auth.users
  SELECT email, raw_user_meta_data 
  INTO user_email, user_metadata
  FROM auth.users 
  WHERE id = profile_user_id;
  
  -- Create profile if it doesn't exist
  INSERT INTO public.profiles (
    id,
    display_name,
    created_at,
    updated_at,
    user_type,
    role
  )
  VALUES (
    profile_user_id,
    COALESCE(user_metadata ->> 'display_name', user_metadata ->> 'name', split_part(user_email, '@', 1)),
    NOW(),
    NOW(),
    'user'::user_type,
    'user'::app_role
  )
  ON CONFLICT (id) DO NOTHING;
  
  -- Create user_roles entry if it doesn't exist
  INSERT INTO public.user_roles (user_id, role)
  VALUES (profile_user_id, 'user'::app_role)
  ON CONFLICT (user_id, role) DO NOTHING;
  
EXCEPTION
  WHEN OTHERS THEN
    -- Log error but don't fail the operation
    RAISE WARNING 'Error in ensure_user_profile for user %: %', profile_user_id, SQLERRM;
END;
$function$