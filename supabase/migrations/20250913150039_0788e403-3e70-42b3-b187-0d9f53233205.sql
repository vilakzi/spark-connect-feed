-- SECURITY FIX: Remove email exposure vulnerability in community_invites

-- Drop the problematic policy that allows access when email IS NULL
DROP POLICY IF EXISTS "Users can view their own invites (protected)" ON public.community_invites;
DROP POLICY IF EXISTS "Inviters can view invites without emails" ON public.community_invites;

-- Create secure policy that ONLY allows users to see invites where they are directly involved
CREATE POLICY "Users can only view invites they are involved in" 
ON public.community_invites 
FOR SELECT 
USING (
  (auth.uid() = inviter_id) OR 
  (auth.uid() = invitee_id)
);

-- Ensure no other policies can leak email addresses
-- Add explicit policy to prevent any email exposure to unauthorized users
CREATE POLICY "Strict invite access control" 
ON public.community_invites 
FOR ALL 
USING (
  -- Only allow access if user is directly involved in the invite
  (auth.uid() = inviter_id) OR 
  (auth.uid() = invitee_id)
)
WITH CHECK (
  -- Only allow creation/modification if user is the inviter
  (auth.uid() = inviter_id)
);

-- Add function to safely fetch invite data without exposing emails
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
  -- Email is only returned if user has permission to see it
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
  
  -- Get the invite record
  SELECT * INTO invite_record
  FROM public.community_invites ci
  WHERE ci.id = invite_id
    AND ((ci.inviter_id = current_user_id) OR (ci.invitee_id = current_user_id));
  
  -- Return null if no access
  IF NOT FOUND THEN
    RETURN;
  END IF;
  
  -- Return the record with conditional email exposure
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
    -- Only show email to the invitee or if user is viewing their own sent invite
    CASE 
      WHEN current_user_id = invite_record.invitee_id THEN invite_record.email
      WHEN current_user_id = invite_record.inviter_id THEN invite_record.email
      ELSE NULL
    END;
END;
$$;

-- Add audit logging for community invite access
CREATE OR REPLACE FUNCTION public.log_invite_access()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Log any access to community invites for security monitoring
  IF TG_OP = 'SELECT' THEN
    INSERT INTO public.security_audit_log (
      user_id,
      action,
      table_name,
      record_id,
      metadata
    ) VALUES (
      auth.uid(),
      'VIEW_INVITE',
      'community_invites',
      NEW.id,
      jsonb_build_object(
        'inviter_id', NEW.inviter_id,
        'invitee_id', NEW.invitee_id,
        'has_email', (NEW.email IS NOT NULL),
        'timestamp', now()
      )
    );
  END IF;
  
  RETURN NEW;
END;
$$;

-- Add trigger for invite access logging (for security monitoring)
DROP TRIGGER IF EXISTS log_community_invite_access ON public.community_invites;
CREATE TRIGGER log_community_invite_access
  AFTER SELECT ON public.community_invites
  FOR EACH ROW EXECUTE FUNCTION public.log_invite_access();

-- Revoke any existing overly permissive grants
REVOKE ALL ON public.community_invites FROM anon;
REVOKE ALL ON public.community_invites FROM authenticated;

-- Grant minimal necessary permissions
GRANT SELECT ON public.community_invites TO authenticated;
GRANT INSERT ON public.community_invites TO authenticated;
GRANT UPDATE ON public.community_invites TO authenticated;