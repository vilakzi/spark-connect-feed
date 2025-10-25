import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

interface Match {
  id: string;
  user1_id: string;
  user2_id: string;
  is_super_like: boolean;
  created_at: string;
  expires_at?: string;
  matched_user?: {
    id: string;
    display_name: string | null;
    profile_image_url: string | null;
    bio: string | null;
    age: number | null;
  };
}

export const useMatches = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchMatches = useCallback(async () => {
    if (!user) return;

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('matches')
        .select(`
          id,
          user_one_id,
          user_two_id,
          is_super_like,
          created_at,
          expires_at
        `)
        .or(`user_one_id.eq.${user.id},user_two_id.eq.${user.id}`)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Fetch matched user profiles
      const matchesWithProfiles = await Promise.all(
        (data || []).map(async (match) => {
          const matchedUserId = match.user_one_id === user.id ? match.user_two_id : match.user_one_id;
          
          const { data: profile } = await supabase
            .from('profiles')
            .select('id, display_name, profile_image_url, bio, age')
            .eq('id', matchedUserId)
            .maybeSingle();

          return {
            ...match,
            user1_id: match.user_one_id,
            user2_id: match.user_two_id,
            matched_user: profile
          };
        })
      );

      setMatches(matchesWithProfiles);
    } catch (error) {
      console.error('Error fetching matches:', error);
      toast({
        title: "Error",
        description: "Failed to load matches. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [user, toast]);

  useEffect(() => {
    fetchMatches();
  }, [fetchMatches]);

  // Set up real-time updates for new matches
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel('matches-changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'matches',
          filter: `user_one_id=eq.${user.id},user_two_id=eq.${user.id}`
        },
        (payload) => {
          console.log('New match:', payload);
          fetchMatches(); // Refresh matches list
          toast({
            title: "New Match! 🎉",
            description: "You have a new match!",
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, fetchMatches, toast]);

  const startChat = useCallback(async (matchId: string) => {
    if (!user) return null;

    try {
      // Create or get conversation for this match
      const { data, error } = await supabase.rpc('create_conversation_from_match', {
        match_id_param: matchId
      });

      if (error) throw error;

      return data; // Returns conversation ID
    } catch (error) {
      console.error('Error starting chat:', error);
      toast({
        title: "Error",
        description: "Failed to start chat. Please try again.",
        variant: "destructive",
      });
      return null;
    }
  }, [user, toast]);

  return {
    matches,
    loading,
    fetchMatches,
    startChat,
  };
};