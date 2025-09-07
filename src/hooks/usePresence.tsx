import { useState, useCallback } from 'react';
import { useAuth } from './useAuth';

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
    console.log('Update presence:', status);
  }, []);

  const subscribeToPresence = useCallback(() => {
    // Mock function
    console.log('Subscribe to presence');
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