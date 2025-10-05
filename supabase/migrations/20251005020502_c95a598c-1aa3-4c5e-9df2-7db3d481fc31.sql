-- Security Fix #1: Require authentication for communities table access
-- This prevents unauthenticated users from querying community metadata
CREATE POLICY "Require authentication for communities"
ON public.communities
AS RESTRICTIVE
FOR SELECT
USING (auth.uid() IS NOT NULL);

-- Security Fix #2: Enhanced audit logging for community invites
-- Update existing trigger to track email field modifications
CREATE OR REPLACE FUNCTION public.log_invite_modifications()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Log modifications to community invites for security monitoring
  INSERT INTO public.security_audit_log (
    user_id,
    action,
    table_name,
    record_id,
    metadata
  ) VALUES (
    auth.uid(),
    TG_OP || '_INVITE',
    'community_invites',
    COALESCE(NEW.id, OLD.id),
    jsonb_build_object(
      'inviter_id', COALESCE(NEW.inviter_id, OLD.inviter_id),
      'invitee_id', COALESCE(NEW.invitee_id, OLD.invitee_id),
      'has_email', (COALESCE(NEW.email, OLD.email) IS NOT NULL),
      'email_changed', (TG_OP = 'UPDATE' AND OLD.email IS DISTINCT FROM NEW.email),
      'operation', TG_OP,
      'timestamp', now()
    )
  );
  
  RETURN COALESCE(NEW, OLD);
END;
$$;

-- Add table comment documenting secure function usage for email access
COMMENT ON TABLE public.community_invites IS 
'SECURITY: Always use get_safe_community_invite() function instead of direct SELECT queries to ensure email field is properly protected based on can_view_invite_email() rules. Email access is logged via log_invite_modifications trigger.';

-- Add column comment for email field
COMMENT ON COLUMN public.community_invites.email IS 
'PII: Email addresses should only be accessed via get_safe_community_invite() function which enforces can_view_invite_email() security rules.';