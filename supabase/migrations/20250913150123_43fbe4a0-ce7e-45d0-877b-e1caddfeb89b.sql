-- SECURITY FIX: Remove email exposure vulnerability in community_invites
-- Fixed version without invalid SELECT trigger

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

-- Ensure proper access control for other operations
-- Keep existing insert policy but make it more explicit
DROP POLICY IF EXISTS "Community admins can create invites" ON public.community_invites;

CREATE POLICY "Community admins can create invites (secure)" 
ON public.community_invites 
FOR INSERT 
WITH CHECK (
  (auth.uid() = inviter_id) AND 
  (EXISTS (
    SELECT 1
    FROM community_memberships cm
    WHERE cm.community_id = community_invites.community_id 
      AND cm.user_id = auth.uid() 
      AND cm.role IN ('owner', 'admin') 
      AND cm.status = 'active'
  ))
);

-- Add update policy for invite responses
CREATE POLICY "Users can update invites sent to them" 
ON public.community_invites 
FOR UPDATE 
USING (auth.uid() = invitee_id)
WITH CHECK (auth.uid() = invitee_id);

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

-- Add audit logging for invite modifications (not selects, as that's not supported)
CREATE OR REPLACE FUNCTION public.log_invite_modifications()
RETURNS trigger
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
      'operation', TG_OP,
      'timestamp', now()
    )
  );
  
  RETURN COALESCE(NEW, OLD);
END;
$$;

-- Add trigger for invite modification logging
DROP TRIGGER IF EXISTS log_community_invite_modifications ON public.community_invites;
CREATE TRIGGER log_community_invite_modifications
  AFTER INSERT OR UPDATE OR DELETE ON public.community_invites
  FOR EACH ROW EXECUTE FUNCTION public.log_invite_modifications();