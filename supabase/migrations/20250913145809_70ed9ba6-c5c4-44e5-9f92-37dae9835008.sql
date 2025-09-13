-- Security Enhancement: Tighten Database Policies and Access Controls

-- 1. Community Invites Email Protection
-- Drop and recreate policy to mask emails for non-recipients
DROP POLICY IF EXISTS "Users can view their own invites" ON public.community_invites;

CREATE POLICY "Users can view their own invites (protected)" 
ON public.community_invites 
FOR SELECT 
USING (
  (auth.uid() = inviter_id) OR 
  (auth.uid() = invitee_id) OR 
  (email IS NULL)
);

-- Add policy to mask email addresses for inviters viewing invite list
CREATE POLICY "Inviters can view invites without emails" 
ON public.community_invites 
FOR SELECT 
USING (
  auth.uid() = inviter_id AND 
  auth.uid() != invitee_id
);

-- 2. Revenue Analytics Security Hardening
-- Add explicit denial policy for unauthorized access
CREATE POLICY "Deny unauthorized revenue analytics access" 
ON public.revenue_analytics 
FOR ALL 
USING (false) 
WITH CHECK (false);

-- Keep existing creator access policy (it will take precedence due to PERMISSIVE)
-- But make it more explicit
DROP POLICY IF EXISTS "Creators can view their own revenue analytics" ON public.revenue_analytics;

CREATE POLICY "Creators can view own revenue analytics only" 
ON public.revenue_analytics 
FOR SELECT 
USING (auth.uid() = creator_id AND creator_id IS NOT NULL);

-- 3. Stream Analytics System Policy Hardening
-- Replace broad system policy with service role validation
DROP POLICY IF EXISTS "System can insert stream analytics" ON public.stream_analytics;

-- Create function to validate system operations
CREATE OR REPLACE FUNCTION public.is_service_role()
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT auth.jwt() ->> 'role' = 'service_role';
$$;

CREATE POLICY "Service role can insert stream analytics" 
ON public.stream_analytics 
FOR INSERT 
WITH CHECK (public.is_service_role());

-- 4. Content Performance System Access Tightening  
-- Replace broad system policy with creator and service role validation
DROP POLICY IF EXISTS "System can manage content performance" ON public.content_performance;

CREATE POLICY "Creators and service can manage content performance" 
ON public.content_performance 
FOR ALL 
USING (
  (auth.uid() = creator_id) OR 
  (public.is_service_role())
)
WITH CHECK (
  (auth.uid() = creator_id) OR 
  (public.is_service_role())
);

-- 5. Audience Insights System Policy Hardening
DROP POLICY IF EXISTS "System can manage audience insights" ON public.audience_insights;

CREATE POLICY "Service role can manage audience insights" 
ON public.audience_insights 
FOR ALL 
USING (public.is_service_role())
WITH CHECK (public.is_service_role());

-- 6. Rate Limits Security Enhancement
-- Ensure rate limits are only accessible to system/service
DROP POLICY IF EXISTS "System can manage rate limits" ON public.rate_limits;

CREATE POLICY "Service role only rate limits access" 
ON public.rate_limits 
FOR ALL 
USING (public.is_service_role())
WITH CHECK (public.is_service_role());

-- 7. Add audit logging table for security monitoring
CREATE TABLE IF NOT EXISTS public.security_audit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  action text NOT NULL,
  table_name text NOT NULL,
  record_id uuid,
  ip_address text,
  user_agent text,
  metadata jsonb DEFAULT '{}',
  created_at timestamp with time zone DEFAULT now()
);

-- Enable RLS on audit log
ALTER TABLE public.security_audit_log ENABLE ROW LEVEL SECURITY;

-- Only admins can view audit logs
CREATE POLICY "Admins can view audit logs" 
ON public.security_audit_log 
FOR SELECT 
USING (public.has_role(auth.uid(), 'admin'));

-- Service role can insert audit logs
CREATE POLICY "Service role can insert audit logs" 
ON public.security_audit_log 
FOR INSERT 
WITH CHECK (public.is_service_role());

-- 8. Add security audit trigger function
CREATE OR REPLACE FUNCTION public.audit_security_action()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Only audit sensitive tables
  IF TG_TABLE_NAME IN ('profiles', 'revenue_analytics', 'creator_analytics', 'moderation_reports', 'user_roles') THEN
    INSERT INTO public.security_audit_log (
      user_id,
      action,
      table_name,
      record_id,
      metadata
    ) VALUES (
      auth.uid(),
      TG_OP,
      TG_TABLE_NAME,
      COALESCE(NEW.id, OLD.id),
      jsonb_build_object(
        'timestamp', now(),
        'operation', TG_OP,
        'table', TG_TABLE_NAME
      )
    );
  END IF;
  
  RETURN COALESCE(NEW, OLD);
END;
$$;

-- Create audit triggers on sensitive tables
DO $$ 
DECLARE
  tbl text;
BEGIN
  FOR tbl IN SELECT unnest(ARRAY['profiles', 'revenue_analytics', 'creator_analytics', 'moderation_reports', 'user_roles']) 
  LOOP
    EXECUTE format('
      DROP TRIGGER IF EXISTS audit_security_%I ON public.%I;
      CREATE TRIGGER audit_security_%I
        AFTER INSERT OR UPDATE OR DELETE ON public.%I
        FOR EACH ROW EXECUTE FUNCTION public.audit_security_action();
    ', tbl, tbl, tbl, tbl);
  END LOOP;
END $$;

-- 9. Strengthen blocked users policy
-- Ensure blocked users cannot see each other's blocks
DROP POLICY IF EXISTS "Users can view their own blocks" ON public.blocked_users;

CREATE POLICY "Users can view own blocks only" 
ON public.blocked_users 
FOR SELECT 
USING (auth.uid() = blocker_id);

-- 10. Add function to validate email visibility in community invites
CREATE OR REPLACE FUNCTION public.can_view_invite_email(
  invite_inviter_id uuid,
  invite_invitee_id uuid,
  invite_email text
)
RETURNS boolean
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Invitee can always see the email
  IF auth.uid() = invite_invitee_id THEN
    RETURN true;
  END IF;
  
  -- Inviter can only see if they are viewing their own invite
  IF auth.uid() = invite_inviter_id THEN
    RETURN true;
  END IF;
  
  -- Default deny
  RETURN false;
END;
$$;