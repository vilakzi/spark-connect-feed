import { useState, useCallback, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';

interface Community {
  id: string;
  name: string;
  description: string;
  category: string;
  imageUrl: string;
  memberCount: number;
  isPrivate: boolean;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  userMembership?: {
    role: string;
    joinedAt: string;
  };
}

interface SocialEvent {
  id: string;
  title: string;
  description: string;
  eventDate: string;
  location: string;
  communityId?: string;
  createdBy: string;
  maxAttendees?: number;
  currentAttendees: number;
  imageUrl?: string;
  eventType: string;
  createdAt: string;
  community?: {
    name: string;
    imageUrl?: string;
  };
  userAttendance?: {
    status: string;
    joinedAt: string;
  };
}

interface CommunityMembership {
  id: string;
  communityId: string;
  userId: string;
  role: string;
  joinedAt: string;
  communities: Community;
}

interface DatabaseCommunity {
  id: string;
  name: string;
  description: string;
  category: string;
  image_url: string;
  member_count: number;
  is_private: boolean;
  created_by: string;
  created_at: string;
  updated_at: string;
}

interface DatabaseMembership {
  role: string;
  joined_at: string;
  communities: DatabaseCommunity;
}

interface DatabaseEventCommunity {
  name: string;
  image_url: string;
}

interface DatabaseEvent {
  id: string;
  title: string;
  description: string;
  event_date: string;
  location: string;
  community_id: string;
  created_by: string;
  max_attendees: number;
  current_attendees: number;
  image_url: string;
  event_type: string;
  created_at: string;
  communities: DatabaseEventCommunity;
  event_attendees: Array<{
    status: string;
    joined_at: string;
  }>;
}

export const useCommunities = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [communities, setCommunities] = useState<Community[]>([]);
  const [userCommunities, setUserCommunities] = useState<Community[]>([]);
  const [events, setEvents] = useState<SocialEvent[]>([]);
  const [userEvents, setUserEvents] = useState<SocialEvent[]>([]);

  const fetchCommunities = useCallback(async (category?: string) => {
    try {
      setLoading(true);
      
      let query = supabase
        .from('communities')
        .select(`
          *,
          community_memberships!inner (
            role,
            joined_at
          )
        `);

      if (category) {
        query = query.eq('category', category);
      }

      const { data: communitiesData } = await query
        .order('member_count', { ascending: false })
        .limit(20);

      if (communitiesData) {
        const formattedCommunities: Community[] = communitiesData.map(community => ({
          id: community.id,
          name: community.name,
          description: community.description || '',
          category: community.category,
          imageUrl: community.image_url || '',
          memberCount: community.member_count || 0,
          isPrivate: community.is_private || false,
          createdBy: community.created_by,
          createdAt: community.created_at,
          updatedAt: community.updated_at,
          userMembership: community.community_memberships?.[0] ? {
            role: community.community_memberships[0].role,
            joinedAt: community.community_memberships[0].joined_at
          } : undefined
        }));
        
        setCommunities(formattedCommunities);
        return formattedCommunities;
      }
      
      return [];
    } catch (error) {
      console.error('Error fetching communities:', error);
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchUserCommunities = useCallback(async () => {
    if (!user) return [];
    
    try {
      setLoading(true);
      
      const { data: membershipData } = await supabase
        .from('community_memberships')
        .select(`
          role,
          joined_at,
          communities (
            id,
            name,
            description,
            category,
            image_url,
            member_count,
            is_private,
            created_by,
            created_at,
            updated_at
          )
        `)
        .eq('user_id', user.id);

      if (membershipData) {
        const formattedCommunities: Community[] = membershipData.map((membership: DatabaseMembership) => {
          const community = membership.communities;
          return {
            id: community.id,
            name: community.name,
            description: community.description || '',
            category: community.category,
            imageUrl: community.image_url || '',
            memberCount: community.member_count || 0,
            isPrivate: community.is_private || false,
            createdBy: community.created_by,
            createdAt: community.created_at,
            updatedAt: community.updated_at,
            userMembership: {
              role: membership.role,
              joinedAt: membership.joined_at
            }
          };
        });
        
        setUserCommunities(formattedCommunities);
        return formattedCommunities;
      }
      
      return [];
    } catch (error) {
      console.error('Error fetching user communities:', error);
      return [];
    } finally {
      setLoading(false);
    }
  }, [user]);

  const createCommunity = useCallback(async (
    name: string,
    description: string,
    category: string,
    isPrivate: boolean = false,
    imageUrl?: string
  ) => {
    if (!user) return null;
    
    try {
      setLoading(true);
      
      const { data: communityData } = await supabase
        .from('communities')
        .insert({
          name,
          description,
          category,
          is_private: isPrivate,
          image_url: imageUrl,
          created_by: user.id,
          member_count: 1
        })
        .select()
        .single();

      if (communityData) {
        // Add creator as admin member
        await supabase
          .from('community_memberships')
          .insert({
            community_id: communityData.id,
            user_id: user.id,
            role: 'admin'
          });

        const newCommunity: Community = {
          id: communityData.id,
          name: communityData.name,
          description: communityData.description || '',
          category: communityData.category,
          imageUrl: communityData.image_url || '',
          memberCount: communityData.member_count || 1,
          isPrivate: communityData.is_private || false,
          createdBy: communityData.created_by,
          createdAt: communityData.created_at,
          updatedAt: communityData.updated_at,
          userMembership: {
            role: 'admin',
            joinedAt: new Date().toISOString()
          }
        };
        
        setCommunities(prev => [newCommunity, ...prev]);
        setUserCommunities(prev => [newCommunity, ...prev]);
        
        return newCommunity;
      }
      
      return null;
    } catch (error) {
      console.error('Error creating community:', error);
      return null;
    } finally {
      setLoading(false);
    }
  }, [user]);

  const joinCommunity = useCallback(async (communityId: string) => {
    if (!user) return false;
    
    try {
      setLoading(true);
      
      const { error } = await supabase
        .from('community_memberships')
        .insert({
          community_id: communityId,
          user_id: user.id,
          role: 'member'
        });

      if (!error) {
        // Update member count
        const { data: currentCommunity } = await supabase
          .from('communities')
          .select('member_count')
          .eq('id', communityId)
          .single();
        
        if (currentCommunity) {
          await supabase
            .from('communities')
            .update({ member_count: (currentCommunity.member_count || 0) + 1 })
            .eq('id', communityId);
        }
        
        // Refresh communities
        await fetchCommunities();
        await fetchUserCommunities();
        
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('Error joining community:', error);
      return false;
    } finally {
      setLoading(false);
    }
  }, [user, fetchCommunities, fetchUserCommunities]);

  const leaveCommunity = useCallback(async (communityId: string) => {
    if (!user) return false;
    
    try {
      setLoading(true);
      
      const { error } = await supabase
        .from('community_memberships')
        .delete()
        .eq('community_id', communityId)
        .eq('user_id', user.id);

      if (!error) {
        // Update member count  
        const { data: currentCommunity } = await supabase
          .from('communities')
          .select('member_count')
          .eq('id', communityId)
          .single();
        
        if (currentCommunity) {
          await supabase
            .from('communities')
            .update({ member_count: Math.max(0, (currentCommunity.member_count || 0) - 1) })
            .eq('id', communityId);
        }
        
        // Refresh communities
        await fetchCommunities();
        await fetchUserCommunities();
        
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('Error leaving community:', error);
      return false;
    } finally {
      setLoading(false);
    }
  }, [user, fetchCommunities, fetchUserCommunities]);

  const fetchEvents = useCallback(async (communityId?: string) => {
    try {
      setLoading(true);
      
      let query = supabase
        .from('social_events')
        .select(`
          *,
          communities (
            name,
            image_url
          ),
          event_attendees!inner (
            status,
            joined_at
          )
        `);

      if (communityId) {
        query = query.eq('community_id', communityId);
      }

      const { data: eventsData } = await query
        .gte('event_date', new Date().toISOString())
        .order('event_date', { ascending: true })
        .limit(20);

      if (eventsData) {
        const formattedEvents: SocialEvent[] = eventsData.map((event: DatabaseEvent) => ({
          id: event.id,
          title: event.title,
          description: event.description || '',
          eventDate: event.event_date,
          location: event.location || '',
          communityId: event.community_id,
          createdBy: event.created_by,
          maxAttendees: event.max_attendees,
          currentAttendees: event.current_attendees || 0,
          imageUrl: event.image_url,
          eventType: event.event_type,
          createdAt: event.created_at,
          community: event.communities ? {
            name: event.communities.name,
            imageUrl: event.communities.image_url
          } : undefined,
          userAttendance: event.event_attendees?.[0] ? {
            status: event.event_attendees[0].status,
            joinedAt: event.event_attendees[0].joined_at
          } : undefined
        }));
        
        setEvents(formattedEvents);
        return formattedEvents;
      }
      
      return [];
    } catch (error) {
      console.error('Error fetching events:', error);
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  const createEvent = useCallback(async (
    title: string,
    description: string,
    eventDate: string,
    location: string,
    communityId?: string,
    maxAttendees?: number,
    eventType: string = 'meetup',
    imageUrl?: string
  ) => {
    if (!user) return null;
    
    try {
      setLoading(true);
      
      const { data: eventData } = await supabase
        .from('social_events')
        .insert({
          title,
          description,
          event_date: eventDate,
          location,
          community_id: communityId,
          created_by: user.id,
          max_attendees: maxAttendees,
          current_attendees: 1,
          event_type: eventType,
          image_url: imageUrl
        })
        .select()
        .single();

      if (eventData) {
        // Add creator as attendee
        await supabase
          .from('event_attendees')
          .insert({
            event_id: eventData.id,
            user_id: user.id,
            status: 'going'
          });

        const newEvent: SocialEvent = {
          id: eventData.id,
          title: eventData.title,
          description: eventData.description || '',
          eventDate: eventData.event_date,
          location: eventData.location || '',
          communityId: eventData.community_id,
          createdBy: eventData.created_by,
          maxAttendees: eventData.max_attendees,
          currentAttendees: eventData.current_attendees || 1,
          imageUrl: eventData.image_url,
          eventType: eventData.event_type,
          createdAt: eventData.created_at,
          userAttendance: {
            status: 'going',
            joinedAt: new Date().toISOString()
          }
        };
        
        setEvents(prev => [newEvent, ...prev]);
        
        return newEvent;
      }
      
      return null;
    } catch (error) {
      console.error('Error creating event:', error);
      return null;
    } finally {
      setLoading(false);
    }
  }, [user]);

  const joinEvent = useCallback(async (eventId: string, status: 'going' | 'interested' | 'maybe' = 'going') => {
    if (!user) return false;
    
    try {
      setLoading(true);
      
      const { error } = await supabase
        .from('event_attendees')
        .upsert({
          event_id: eventId,
          user_id: user.id,
          status
        });

      if (!error) {
        // Update attendee count
        if (status === 'going') {
          const { data: currentEvent } = await supabase
            .from('social_events')
            .select('current_attendees')
            .eq('id', eventId)
            .single();
            
          if (currentEvent) {
            await supabase
              .from('social_events')
              .update({ current_attendees: (currentEvent.current_attendees || 0) + 1 })
              .eq('id', eventId);
          }
        }
        
        // Refresh events
        await fetchEvents();
        
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('Error joining event:', error);
      return false;
    } finally {
      setLoading(false);
    }
  }, [user, fetchEvents]);

  useEffect(() => {
    if (user) {
      fetchCommunities();
      fetchUserCommunities();
      fetchEvents();
    }
  }, [user, fetchCommunities, fetchUserCommunities, fetchEvents]);

  return {
    loading,
    communities,
    userCommunities,
    events,
    userEvents,
    fetchCommunities,
    fetchUserCommunities,
    createCommunity,
    joinCommunity,
    leaveCommunity,
    fetchEvents,
    createEvent,
    joinEvent
  };
};