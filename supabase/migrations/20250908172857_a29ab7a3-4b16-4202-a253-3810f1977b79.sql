-- Phase 7: Community Features & Events
-- Create communities table
CREATE TABLE public.communities (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  image_url TEXT,
  banner_url TEXT,
  creator_id UUID NOT NULL,
  privacy_level TEXT NOT NULL DEFAULT 'public' CHECK (privacy_level IN ('public', 'private', 'invite_only')),
  category TEXT NOT NULL DEFAULT 'general' CHECK (category IN ('general', 'dating', 'creators', 'gaming', 'fitness', 'food', 'travel', 'music', 'art', 'technology', 'business', 'other')),
  member_count INTEGER DEFAULT 0,
  rules TEXT,
  tags TEXT[] DEFAULT '{}',
  is_verified BOOLEAN DEFAULT false,
  location TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create community memberships table
CREATE TABLE public.community_memberships (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  community_id UUID NOT NULL REFERENCES public.communities(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  role TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('owner', 'admin', 'moderator', 'member')),
  joined_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'banned', 'pending')),
  UNIQUE(community_id, user_id)
);

-- Create events table
CREATE TABLE public.events (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  image_url TEXT,
  organizer_id UUID NOT NULL,
  community_id UUID REFERENCES public.communities(id) ON DELETE SET NULL,
  event_type TEXT NOT NULL DEFAULT 'meetup' CHECK (event_type IN ('meetup', 'party', 'workshop', 'conference', 'date', 'group_date', 'virtual', 'stream_event', 'other')),
  privacy_level TEXT NOT NULL DEFAULT 'public' CHECK (privacy_level IN ('public', 'private', 'community_only', 'invite_only')),
  location TEXT,
  venue_name TEXT,
  start_time TIMESTAMP WITH TIME ZONE NOT NULL,
  end_time TIMESTAMP WITH TIME ZONE NOT NULL,
  max_attendees INTEGER,
  attendee_count INTEGER DEFAULT 0,
  price_cents INTEGER DEFAULT 0,
  tags TEXT[] DEFAULT '{}',
  requirements TEXT,
  is_online BOOLEAN DEFAULT false,
  meeting_url TEXT,
  status TEXT NOT NULL DEFAULT 'scheduled' CHECK (status IN ('draft', 'scheduled', 'live', 'completed', 'cancelled')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create event attendees table
CREATE TABLE public.event_attendees (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  status TEXT NOT NULL DEFAULT 'going' CHECK (status IN ('going', 'maybe', 'not_going', 'invited')),
  rsvp_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  check_in_time TIMESTAMP WITH TIME ZONE,
  notes TEXT,
  UNIQUE(event_id, user_id)
);

-- Create community discussions table
CREATE TABLE public.community_discussions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  community_id UUID NOT NULL REFERENCES public.communities(id) ON DELETE CASCADE,
  author_id UUID NOT NULL,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  discussion_type TEXT NOT NULL DEFAULT 'general' CHECK (discussion_type IN ('general', 'announcement', 'question', 'poll', 'event_discussion')),
  is_pinned BOOLEAN DEFAULT false,
  is_locked BOOLEAN DEFAULT false,
  view_count INTEGER DEFAULT 0,
  reply_count INTEGER DEFAULT 0,
  last_reply_at TIMESTAMP WITH TIME ZONE,
  tags TEXT[] DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create discussion replies table
CREATE TABLE public.discussion_replies (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  discussion_id UUID NOT NULL REFERENCES public.community_discussions(id) ON DELETE CASCADE,
  author_id UUID NOT NULL,
  content TEXT NOT NULL,
  parent_reply_id UUID REFERENCES public.discussion_replies(id) ON DELETE CASCADE,
  is_edited BOOLEAN DEFAULT false,
  edited_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create community invites table
CREATE TABLE public.community_invites (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  community_id UUID NOT NULL REFERENCES public.communities(id) ON DELETE CASCADE,
  inviter_id UUID NOT NULL,
  invitee_id UUID,
  invite_code TEXT UNIQUE,
  email TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined', 'expired')),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT (now() + interval '7 days'),
  used_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create event invites table
CREATE TABLE public.event_invites (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  inviter_id UUID NOT NULL,
  invitee_id UUID NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined')),
  message TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  responded_at TIMESTAMP WITH TIME ZONE,
  UNIQUE(event_id, invitee_id)
);

-- Enable RLS on all tables
ALTER TABLE public.communities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.community_memberships ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_attendees ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.community_discussions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.discussion_replies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.community_invites ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_invites ENABLE ROW LEVEL SECURITY;

-- RLS Policies for communities
CREATE POLICY "Anyone can view public communities" ON public.communities
FOR SELECT USING (privacy_level = 'public');

CREATE POLICY "Members can view their communities" ON public.communities
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.community_memberships cm
    WHERE cm.community_id = communities.id 
    AND cm.user_id = auth.uid()
    AND cm.status = 'active'
  )
);

CREATE POLICY "Users can create communities" ON public.communities
FOR INSERT WITH CHECK (auth.uid() = creator_id);

CREATE POLICY "Community owners and admins can update communities" ON public.communities
FOR UPDATE USING (
  EXISTS (
    SELECT 1 FROM public.community_memberships cm
    WHERE cm.community_id = communities.id 
    AND cm.user_id = auth.uid()
    AND cm.role IN ('owner', 'admin')
    AND cm.status = 'active'
  )
);

-- RLS Policies for community memberships
CREATE POLICY "Members can view community memberships" ON public.community_memberships
FOR SELECT USING (
  user_id = auth.uid() OR
  EXISTS (
    SELECT 1 FROM public.community_memberships cm
    WHERE cm.community_id = community_memberships.community_id 
    AND cm.user_id = auth.uid()
    AND cm.status = 'active'
  )
);

CREATE POLICY "Users can join communities" ON public.community_memberships
FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can leave communities" ON public.community_memberships
FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Community admins can manage memberships" ON public.community_memberships
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM public.community_memberships cm
    WHERE cm.community_id = community_memberships.community_id 
    AND cm.user_id = auth.uid()
    AND cm.role IN ('owner', 'admin')
    AND cm.status = 'active'
  )
);

-- RLS Policies for events
CREATE POLICY "Anyone can view public events" ON public.events
FOR SELECT USING (privacy_level = 'public');

CREATE POLICY "Community members can view community events" ON public.events
FOR SELECT USING (
  privacy_level = 'community_only' AND
  EXISTS (
    SELECT 1 FROM public.community_memberships cm
    WHERE cm.community_id = events.community_id 
    AND cm.user_id = auth.uid()
    AND cm.status = 'active'
  )
);

CREATE POLICY "Invited users can view private events" ON public.events
FOR SELECT USING (
  privacy_level IN ('private', 'invite_only') AND
  EXISTS (
    SELECT 1 FROM public.event_invites ei
    WHERE ei.event_id = events.id 
    AND ei.invitee_id = auth.uid()
  )
);

CREATE POLICY "Users can create events" ON public.events
FOR INSERT WITH CHECK (auth.uid() = organizer_id);

CREATE POLICY "Event organizers can update events" ON public.events
FOR UPDATE USING (auth.uid() = organizer_id);

CREATE POLICY "Event organizers can delete events" ON public.events
FOR DELETE USING (auth.uid() = organizer_id);

-- RLS Policies for event attendees
CREATE POLICY "Users can view event attendees for accessible events" ON public.event_attendees
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.events e
    WHERE e.id = event_attendees.event_id
    AND (
      e.privacy_level = 'public' OR
      e.organizer_id = auth.uid() OR
      EXISTS (
        SELECT 1 FROM public.event_attendees ea2
        WHERE ea2.event_id = e.id AND ea2.user_id = auth.uid()
      )
    )
  )
);

CREATE POLICY "Users can manage their own event attendance" ON public.event_attendees
FOR ALL USING (auth.uid() = user_id);

-- RLS Policies for community discussions
CREATE POLICY "Community members can view discussions" ON public.community_discussions
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.community_memberships cm
    WHERE cm.community_id = community_discussions.community_id 
    AND cm.user_id = auth.uid()
    AND cm.status = 'active'
  )
);

CREATE POLICY "Community members can create discussions" ON public.community_discussions
FOR INSERT WITH CHECK (
  auth.uid() = author_id AND
  EXISTS (
    SELECT 1 FROM public.community_memberships cm
    WHERE cm.community_id = community_discussions.community_id 
    AND cm.user_id = auth.uid()
    AND cm.status = 'active'
  )
);

CREATE POLICY "Authors and moderators can update discussions" ON public.community_discussions
FOR UPDATE USING (
  auth.uid() = author_id OR
  EXISTS (
    SELECT 1 FROM public.community_memberships cm
    WHERE cm.community_id = community_discussions.community_id 
    AND cm.user_id = auth.uid()
    AND cm.role IN ('owner', 'admin', 'moderator')
    AND cm.status = 'active'
  )
);

-- RLS Policies for discussion replies
CREATE POLICY "Community members can view replies" ON public.discussion_replies
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.community_discussions cd
    JOIN public.community_memberships cm ON cm.community_id = cd.community_id
    WHERE cd.id = discussion_replies.discussion_id 
    AND cm.user_id = auth.uid()
    AND cm.status = 'active'
  )
);

CREATE POLICY "Community members can create replies" ON public.discussion_replies
FOR INSERT WITH CHECK (
  auth.uid() = author_id AND
  EXISTS (
    SELECT 1 FROM public.community_discussions cd
    JOIN public.community_memberships cm ON cm.community_id = cd.community_id
    WHERE cd.id = discussion_replies.discussion_id 
    AND cm.user_id = auth.uid()
    AND cm.status = 'active'
  )
);

CREATE POLICY "Authors can update their own replies" ON public.discussion_replies
FOR UPDATE USING (auth.uid() = author_id);

-- RLS Policies for community invites
CREATE POLICY "Users can view their own invites" ON public.community_invites
FOR SELECT USING (
  auth.uid() = inviter_id OR 
  auth.uid() = invitee_id
);

CREATE POLICY "Community admins can create invites" ON public.community_invites
FOR INSERT WITH CHECK (
  auth.uid() = inviter_id AND
  EXISTS (
    SELECT 1 FROM public.community_memberships cm
    WHERE cm.community_id = community_invites.community_id 
    AND cm.user_id = auth.uid()
    AND cm.role IN ('owner', 'admin')
    AND cm.status = 'active'
  )
);

-- RLS Policies for event invites
CREATE POLICY "Users can view their own event invites" ON public.event_invites
FOR SELECT USING (
  auth.uid() = inviter_id OR 
  auth.uid() = invitee_id
);

CREATE POLICY "Event organizers can create invites" ON public.event_invites
FOR INSERT WITH CHECK (
  auth.uid() = inviter_id AND
  EXISTS (
    SELECT 1 FROM public.events e
    WHERE e.id = event_invites.event_id 
    AND e.organizer_id = auth.uid()
  )
);

CREATE POLICY "Invitees can update their own invites" ON public.event_invites
FOR UPDATE USING (auth.uid() = invitee_id);

-- Create indexes for better performance
CREATE INDEX idx_communities_creator_id ON public.communities(creator_id);
CREATE INDEX idx_communities_privacy_level ON public.communities(privacy_level);
CREATE INDEX idx_communities_category ON public.communities(category);
CREATE INDEX idx_community_memberships_community_id ON public.community_memberships(community_id);
CREATE INDEX idx_community_memberships_user_id ON public.community_memberships(user_id);
CREATE INDEX idx_events_organizer_id ON public.events(organizer_id);
CREATE INDEX idx_events_community_id ON public.events(community_id);
CREATE INDEX idx_events_start_time ON public.events(start_time);
CREATE INDEX idx_event_attendees_event_id ON public.event_attendees(event_id);
CREATE INDEX idx_event_attendees_user_id ON public.event_attendees(user_id);
CREATE INDEX idx_community_discussions_community_id ON public.community_discussions(community_id);
CREATE INDEX idx_discussion_replies_discussion_id ON public.discussion_replies(discussion_id);

-- Create triggers for updated_at timestamps
CREATE TRIGGER update_communities_updated_at
  BEFORE UPDATE ON public.communities
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_events_updated_at
  BEFORE UPDATE ON public.events
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_community_discussions_updated_at
  BEFORE UPDATE ON public.community_discussions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Function to update member count
CREATE OR REPLACE FUNCTION public.update_community_member_count()
RETURNS TRIGGER AS $$
BEGIN
  -- Update member count for community
  UPDATE public.communities 
  SET member_count = (
    SELECT COUNT(*) 
    FROM public.community_memberships 
    WHERE community_id = COALESCE(NEW.community_id, OLD.community_id)
    AND status = 'active'
  )
  WHERE id = COALESCE(NEW.community_id, OLD.community_id);
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Function to update event attendee count
CREATE OR REPLACE FUNCTION public.update_event_attendee_count()
RETURNS TRIGGER AS $$
BEGIN
  -- Update attendee count for event
  UPDATE public.events 
  SET attendee_count = (
    SELECT COUNT(*) 
    FROM public.event_attendees 
    WHERE event_id = COALESCE(NEW.event_id, OLD.event_id)
    AND status = 'going'
  )
  WHERE id = COALESCE(NEW.event_id, OLD.event_id);
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Function to update discussion reply count
CREATE OR REPLACE FUNCTION public.update_discussion_reply_count()
RETURNS TRIGGER AS $$
BEGIN
  -- Update reply count and last reply time for discussion
  UPDATE public.community_discussions 
  SET 
    reply_count = (
      SELECT COUNT(*) 
      FROM public.discussion_replies 
      WHERE discussion_id = COALESCE(NEW.discussion_id, OLD.discussion_id)
    ),
    last_reply_at = COALESCE(NEW.created_at, now())
  WHERE id = COALESCE(NEW.discussion_id, OLD.discussion_id);
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create triggers for count updates
CREATE TRIGGER update_community_member_count_trigger
  AFTER INSERT OR UPDATE OR DELETE ON public.community_memberships
  FOR EACH ROW
  EXECUTE FUNCTION public.update_community_member_count();

CREATE TRIGGER update_event_attendee_count_trigger
  AFTER INSERT OR UPDATE OR DELETE ON public.event_attendees
  FOR EACH ROW
  EXECUTE FUNCTION public.update_event_attendee_count();

CREATE TRIGGER update_discussion_reply_count_trigger
  AFTER INSERT OR DELETE ON public.discussion_replies
  FOR EACH ROW
  EXECUTE FUNCTION public.update_discussion_reply_count();

-- Function to auto-create community membership for creator
CREATE OR REPLACE FUNCTION public.auto_create_community_membership()
RETURNS TRIGGER AS $$
BEGIN
  -- Automatically add creator as owner of community
  INSERT INTO public.community_memberships (community_id, user_id, role)
  VALUES (NEW.id, NEW.creator_id, 'owner');
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER auto_create_community_membership_trigger
  AFTER INSERT ON public.communities
  FOR EACH ROW
  EXECUTE FUNCTION public.auto_create_community_membership();