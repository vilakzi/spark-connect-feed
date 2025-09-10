import { useState, useCallback } from 'react';
import { useAuth } from './useAuth';
import { logDebug } from '@/lib/secureLogger';

interface PresenceUser {
  id: string;
  display_name: string;
  profile_image_url?: string;
  last_seen: string;
  is_online: boolean;
}

export const usePresence = () => {
  const { user } = useAuth();
  const [onlineUsers, setOnlineUsers] = useState<PresenceUser[]>([]);

  const updatePresence = useCallback(async (status: 'online' | 'offline') => {
    // Mock function
    logDebug('Update presence', { status }, 'usePresence');
  }, []);

  const subscribeToPresence = useCallback(() => {
    // Mock function
    logDebug('Subscribe to presence', undefined, 'usePresence');
    return () => {}; // cleanup function
  }, []);

  const isUserOnline = useCallback((userId: string) => {
    return onlineUsers.some(user => user.id === userId && user.is_online);
  }, [onlineUsers]);

  return {
    onlineUsers,
    updatePresence,
    subscribeToPresence,
    isUserOnline
  };
};