import { useState, useCallback } from 'react';
import { useAuth } from '@/hooks/useAuth';

interface Match {
  id: string;
  user_one_id: string;
  user_two_id: string;
  is_super_like: boolean;
  created_at: string;
  expires_at?: string;
  other_user_id: string;
  other_user?: {
    id: string;
    display_name: string | null;
    profile_image_url: string | null;
    bio: string | null;
    age: number | null;
    location: string | null;
  };
}

export const useMatches = () => {
  const { user } = useAuth();
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchMatches = useCallback(async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      // Mock matches since table doesn't exist
      setMatches([]);
    } catch (err) {
      console.error('Error fetching matches:', err);
    } finally {
      setLoading(false);
    }
  }, [user]);

  const startChat = useCallback(async (matchId: string) => {
    if (!user) return null;
    
    try {
      // Mock function since RPC doesn't exist
      return null;
    } catch (err) {
      console.error('Error starting chat:', err);
      return null;
    }
  }, [user]);

  return {
    matches,
    loading,
    fetchMatches,
    startChat
  };
};