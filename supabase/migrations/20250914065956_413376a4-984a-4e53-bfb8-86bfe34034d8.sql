-- Fix security issues with community_invites and profiles tables

-- First, let's check the current profiles table structure and create it if needed
CREATE TABLE IF NOT EXISTS public.profiles (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL UNIQUE,
    display_name text,
    username text UNIQUE,
    bio text,
    age integer,
    location text,
    interests text[] DEFAULT '{}',
    profile_image_url text,
    user_category user_category DEFAULT 'viewer',
    referral_code text UNIQUE,
    privacy_settings jsonb DEFAULT jsonb_build_object(
        'is_public', true,
        'show_age', true,
        'show_location', true,
        'show_interests', true,
        'show_online_status', true
    ),
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

-- Enable RLS on profiles table
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Drop existing profiles policies to recreate them securely
DROP POLICY IF EXISTS "Users can view their own profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert their own profiles" ON public.profiles;
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON public.profiles;

-- Create secure profiles RLS policies
CREATE POLICY "Users can view their own profiles"
ON public.profiles
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can view public profiles only"
ON public.profiles
FOR SELECT
TO authenticated
USING (
    auth.uid() != user_id 
    AND public.can_view_profile(user_id, auth.uid())
);

CREATE POLICY "Users can insert their own profiles"
ON public.profiles
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own profiles"
ON public.profiles
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Admins can view all profiles for moderation
CREATE POLICY "Admins can view all profiles"
ON public.profiles
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Service role needs access for system operations
CREATE POLICY "Service role can manage profiles"
ON public.profiles
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- Now fix community_invites table security
-- Drop existing community_invites policies and recreate them more securely
DROP POLICY IF EXISTS "Community admins can create invites (secure)" ON public.community_invites;
DROP POLICY IF EXISTS "Users can only view invites they are involved in" ON public.community_invites;
DROP POLICY IF EXISTS "Users can update invites sent to them" ON public.community_invites;

-- Create more secure community_invites policies
CREATE POLICY "Community admins can create invites"
ON public.community_invites
FOR INSERT
TO authenticated
WITH CHECK (
    auth.uid() = inviter_id 
    AND public.user_is_community_admin(community_id, auth.uid())
);

-- Restrict viewing of invites - users can only see invites they sent or received
-- Email field will be filtered through the get_safe_community_invite function
CREATE POLICY "Users can view their own community invites"
ON public.community_invites
FOR SELECT
TO authenticated
USING (
    auth.uid() = inviter_id OR auth.uid() = invitee_id
);

-- Only invitees can update their invite status
CREATE POLICY "Invitees can update invite status"
ON public.community_invites
FOR UPDATE
TO authenticated
USING (auth.uid() = invitee_id)
WITH CHECK (auth.uid() = invitee_id);

-- Community admins can update invites they created (e.g., to cancel them)
CREATE POLICY "Community admins can update their invites"
ON public.community_invites
FOR UPDATE
TO authenticated
USING (
    auth.uid() = inviter_id 
    AND public.user_is_community_admin(community_id, auth.uid())
)
WITH CHECK (
    auth.uid() = inviter_id 
    AND public.user_is_community_admin(community_id, auth.uid())
);

-- Service role can manage invites for system operations
CREATE POLICY "Service role can manage community invites"
ON public.community_invites
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- Create updated_at triggers if they don't exist
CREATE TRIGGER IF NOT EXISTS update_profiles_updated_at
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- Add security audit logging for sensitive operations
CREATE OR REPLACE FUNCTION public.log_invite_access()
RETURNS trigger AS $$
BEGIN
    -- Log when someone accesses community invites (for security monitoring)
    INSERT INTO public.security_audit_log (
        user_id,
        action,
        table_name,
        record_id,
        metadata
    ) VALUES (
        auth.uid(),
        'INVITE_ACCESS',
        'community_invites',
        NEW.id,
        jsonb_build_object(
            'inviter_id', NEW.inviter_id,
            'has_email', (NEW.email IS NOT NULL),
            'community_id', NEW.community_id,
            'timestamp', now()
        )
    );
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Add trigger for invite access logging
DROP TRIGGER IF EXISTS log_community_invite_access ON public.community_invites;
CREATE TRIGGER log_community_invite_access
    AFTER SELECT ON public.community_invites
    FOR EACH ROW
    EXECUTE FUNCTION public.log_invite_access();