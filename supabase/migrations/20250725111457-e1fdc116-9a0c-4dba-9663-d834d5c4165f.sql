-- Fix authentication system: Add profile creation function and trigger

-- Create or replace the handle_new_user function to ensure profiles are created
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  -- Insert profile with data from auth metadata or defaults
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
    COALESCE(NEW.raw_user_meta_data ->> 'display_name', NEW.raw_user_meta_data ->> 'name', split_part(NEW.email, '@', 1)),
    NOW(),
    NOW(),
    'user'::user_type,
    'user'::app_role
  );
  
  -- Also create user_roles entry
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'user'::app_role)
  ON CONFLICT (user_id, role) DO NOTHING;
  
  RETURN NEW;
END;
$$;

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Create the trigger to run after user creation
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Create function to ensure profile exists for existing users
CREATE OR REPLACE FUNCTION public.ensure_user_profile(user_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  user_email TEXT;
  user_metadata JSONB;
BEGIN
  -- Get user email and metadata from auth.users
  SELECT email, raw_user_meta_data 
  INTO user_email, user_metadata
  FROM auth.users 
  WHERE id = user_id;
  
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
    user_id,
    COALESCE(user_metadata ->> 'display_name', user_metadata ->> 'name', split_part(user_email, '@', 1)),
    NOW(),
    NOW(),
    'user'::user_type,
    'user'::app_role
  )
  ON CONFLICT (id) DO NOTHING;
  
  -- Create user_roles entry if it doesn't exist
  INSERT INTO public.user_roles (user_id, role)
  VALUES (user_id, 'user'::app_role)
  ON CONFLICT (user_id, role) DO NOTHING;
END;
$$;