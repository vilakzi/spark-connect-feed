-- Fix profile mapping and ensure all user data is properly synchronized

-- Update the ensure_user_profile function to better sync data from auth.users
CREATE OR REPLACE FUNCTION public.ensure_user_profile(profile_user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $function$
DECLARE
  user_email TEXT;
  user_metadata JSONB;
  existing_profile RECORD;
BEGIN
  -- Get user email and metadata from auth.users
  SELECT email, raw_user_meta_data 
  INTO user_email, user_metadata
  FROM auth.users 
  WHERE id = profile_user_id;
  
  -- Check if profile already exists
  SELECT * INTO existing_profile FROM public.profiles WHERE id = profile_user_id;
  
  IF existing_profile.id IS NULL THEN
    -- Create new profile with data from auth metadata
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
      COALESCE(
        user_metadata ->> 'display_name', 
        user_metadata ->> 'name',
        user_metadata ->> 'full_name',
        split_part(user_email, '@', 1)
      ),
      NOW(),
      NOW(),
      COALESCE((user_metadata ->> 'user_type')::user_type, 'user'::user_type),
      COALESCE((user_metadata ->> 'role')::app_role, 'user'::app_role)
    );
  ELSE
    -- Update existing profile with any missing data from auth metadata
    UPDATE public.profiles 
    SET 
      display_name = COALESCE(
        display_name,
        user_metadata ->> 'display_name',
        user_metadata ->> 'name', 
        user_metadata ->> 'full_name',
        split_part(user_email, '@', 1)
      ),
      updated_at = NOW(),
      -- Only update if profile doesn't have these values
      user_type = COALESCE(user_type, (user_metadata ->> 'user_type')::user_type, 'user'::user_type),
      role = COALESCE(role, (user_metadata ->> 'role')::app_role, 'user'::app_role)
    WHERE id = profile_user_id;
  END IF;
  
  -- Ensure user_roles entry exists
  INSERT INTO public.user_roles (user_id, role)
  VALUES (
    profile_user_id, 
    COALESCE((user_metadata ->> 'role')::app_role, 'user'::app_role)
  )
  ON CONFLICT (user_id, role) DO NOTHING;
  
EXCEPTION
  WHEN OTHERS THEN
    -- Log error but don't fail the operation
    RAISE WARNING 'Error in ensure_user_profile for user %: %', profile_user_id, SQLERRM;
END;
$function$;

-- Run the function for all existing users to sync their data
DO $$
DECLARE
  user_record RECORD;
BEGIN
  FOR user_record IN SELECT id FROM auth.users LOOP
    PERFORM public.ensure_user_profile(user_record.id);
  END LOOP;
END $$;