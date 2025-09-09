-- Fix infinite recursion in RLS policies by creating security definer functions
-- and updating problematic policies

-- 1. Create security definer functions to prevent recursion
CREATE OR REPLACE FUNCTION public.user_is_community_member(_community_id uuid, _user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 
    FROM public.community_memberships cm
    WHERE cm.community_id = _community_id 
    AND cm.user_id = _user_id 
    AND cm.status = 'active'
  )
$$;

CREATE OR REPLACE FUNCTION public.user_is_community_admin(_community_id uuid, _user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 
    FROM public.community_memberships cm
    WHERE cm.community_id = _community_id 
    AND cm.user_id = _user_id 
    AND cm.role IN ('owner', 'admin') 
    AND cm.status = 'active'
  )
$$;

CREATE OR REPLACE FUNCTION public.user_can_view_event(_event_id uuid, _user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.events e
    WHERE e.id = _event_id
    AND (
      e.privacy_level = 'public'
      OR e.organizer_id = _user_id
      OR (e.privacy_level = 'community_only' AND public.user_is_community_member(e.community_id, _user_id))
      OR (e.privacy_level IN ('private', 'invite_only') AND EXISTS (
        SELECT 1 FROM public.event_invites ei 
        WHERE ei.event_id = _event_id AND ei.invitee_id = _user_id
      ))
    )
  )
$$;

-- 2. Drop and recreate problematic RLS policies

-- Fix community_memberships policies
DROP POLICY IF EXISTS "Community admins can manage memberships" ON public.community_memberships;
DROP POLICY IF EXISTS "Members can view community memberships" ON public.community_memberships;

CREATE POLICY "Community admins can manage memberships" 
ON public.community_memberships 
FOR ALL 
TO authenticated
USING (public.user_is_community_admin(community_id, auth.uid()))
WITH CHECK (public.user_is_community_admin(community_id, auth.uid()));

CREATE POLICY "Members can view community memberships" 
ON public.community_memberships 
FOR SELECT 
TO authenticated
USING (user_id = auth.uid() OR public.user_is_community_member(community_id, auth.uid()));

-- Fix event_attendees policies  
DROP POLICY IF EXISTS "Users can view event attendees for accessible events" ON public.event_attendees;

CREATE POLICY "Users can view event attendees for accessible events" 
ON public.event_attendees 
FOR SELECT 
TO authenticated
USING (public.user_can_view_event(event_id, auth.uid()));

-- 3. Secure live streams - restrict private stream access
DROP POLICY IF EXISTS "Users can view live streams" ON public.live_streams;

-- Only show public info, hide sensitive data for private streams
CREATE POLICY "Users can view public live stream info" 
ON public.live_streams 
FOR SELECT 
TO authenticated
USING (
  CASE 
    WHEN is_private = false OR creator_id = auth.uid() THEN true
    ELSE false
  END
);

-- 4. Fix community access - consolidate policies
DROP POLICY IF EXISTS "Anyone can view public communities" ON public.communities;
DROP POLICY IF EXISTS "Members can view their communities" ON public.communities;

CREATE POLICY "Users can view accessible communities" 
ON public.communities 
FOR SELECT 
TO authenticated
USING (
  privacy_level = 'public' 
  OR creator_id = auth.uid()
  OR public.user_is_community_member(id, auth.uid())
);

-- 5. Secure creator achievements - only show featured ones publicly
DROP POLICY IF EXISTS "Anyone can view featured achievements" ON public.creator_achievements;

CREATE POLICY "Users can view appropriate achievements" 
ON public.creator_achievements 
FOR SELECT 
TO authenticated
USING (
  creator_id = auth.uid() 
  OR (is_featured = true AND creator_id != auth.uid())
);

-- 6. Add indexes for performance on security queries
CREATE INDEX IF NOT EXISTS idx_community_memberships_security 
ON public.community_memberships (community_id, user_id, status, role);

CREATE INDEX IF NOT EXISTS idx_event_invites_security 
ON public.event_invites (event_id, invitee_id);

CREATE INDEX IF NOT EXISTS idx_events_security 
ON public.events (privacy_level, organizer_id, community_id);

CREATE INDEX IF NOT EXISTS idx_live_streams_security 
ON public.live_streams (is_private, creator_id);