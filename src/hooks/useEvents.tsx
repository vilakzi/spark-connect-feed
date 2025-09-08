import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from 'sonner';

interface SocialEvent {
  id: string;
  title: string;
  description: string | null;
  image_url: string | null;
  organizer_id: string;
  community_id: string | null;
  event_type: string;
  privacy_level: string;
  location: string | null;
  venue_name: string | null;
  start_time: string;
  end_time: string;
  max_attendees: number | null;
  attendee_count: number;
  price_cents: number;
  tags: string[];
  requirements: string | null;
  is_online: boolean;
  meeting_url: string | null;
  status: string;
  created_at: string;
  updated_at: string;
}

export const useEvents = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Fetch all public events
  const {
    data: events = [],
    isLoading: loading,
    error
  } = useQuery({
    queryKey: ['events'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('events')
        .select('*')
        .eq('privacy_level', 'public')
        .gte('end_time', new Date().toISOString())
        .order('start_time', { ascending: true });

      if (error) throw error;
      return data as SocialEvent[];
    },
    enabled: !!user
  });

  // Fetch user's events (organized)
  const {
    data: userEvents = []
  } = useQuery({
    queryKey: ['user-events', user?.id],
    queryFn: async () => {
      if (!user) return [];

      const { data, error } = await supabase
        .from('events')
        .select('*')
        .eq('organizer_id', user.id)
        .order('start_time', { ascending: true });

      if (error) throw error;
      return data as SocialEvent[];
    },
    enabled: !!user
  });

  // Fetch user's attending events
  const {
    data: attendingEvents = []
  } = useQuery({
    queryKey: ['attending-events', user?.id],
    queryFn: async () => {
      if (!user) return [];

      const { data, error } = await supabase
        .from('event_attendees')
        .select(`
          *,
          events:event_id (*)
        `)
        .eq('user_id', user.id)
        .eq('status', 'going');

      if (error) throw error;
      return data.map(attendee => attendee.events) as SocialEvent[];
    },
    enabled: !!user
  });

  // Create event mutation
  const createEventMutation = useMutation({
    mutationFn: async (eventData: Partial<SocialEvent> & { start_time: string; end_time: string; title: string }) => {
      if (!user) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('events')
        .insert({
          ...eventData,
          organizer_id: user.id
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['events'] });
      queryClient.invalidateQueries({ queryKey: ['user-events'] });
      toast.success('Event created successfully!');
    },
    onError: (error) => {
      toast.error('Failed to create event');
      console.error('Error creating event:', error);
    }
  });

  // RSVP to event mutation
  const rsvpEventMutation = useMutation({
    mutationFn: async ({ eventId, status }: { eventId: string; status: string }) => {
      if (!user) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('event_attendees')
        .upsert({
          event_id: eventId,
          user_id: user.id,
          status
        });

      if (error) throw error;
      return data;
    },
    onSuccess: (_, { status }) => {
      queryClient.invalidateQueries({ queryKey: ['events'] });
      queryClient.invalidateQueries({ queryKey: ['attending-events'] });
      
      const statusMessages = {
        going: 'RSVP confirmed!',
        maybe: 'Marked as maybe',
        not_going: 'RSVP declined'
      };
      
      toast.success(statusMessages[status as keyof typeof statusMessages] || 'RSVP updated');
    },
    onError: (error) => {
      toast.error('Failed to update RSVP');
      console.error('Error updating RSVP:', error);
    }
  });

  return {
    events,
    userEvents,
    attendingEvents,
    loading,
    error: error?.message || '',
    createEvent: createEventMutation.mutate,
    rsvpEvent: (eventId: string, status: string) => rsvpEventMutation.mutateAsync({ eventId, status })
  };
};