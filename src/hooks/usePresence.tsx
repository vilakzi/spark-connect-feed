import { useState, useEffect, useRef, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import type { RealtimeChannel } from '@supabase/supabase-js';

interface UserPresence {
  user_id: string;
  online: boolean;
  last_seen: string;
}

interface PresenceEvent {
  newPresences: UserPresence[];
}

interface PresenceLeaveEvent {
  leftPresences: UserPresence[];
}

interface PresenceHookReturn {
  onlineUsers: Set<string>;
  updatePresence: () => void;
  isUserOnline: (userId: string) => boolean;
}

export const usePresence = (): PresenceHookReturn => {
  const { user } = useAuth();
  const [onlineUsers, setOnlineUsers] = useState<Set<string>>(new Set());
  const presenceChannel = useRef<RealtimeChannel | null>(null);
  const heartbeatInterval = useRef<NodeJS.Timeout | null>(null);

  const updateLastActive = async () => {
    if (!user) return;

    try {
      await supabase
        .from('profiles')
        .update({ 
          last_active: new Date().toISOString() 
        })
        .eq('id', user.id);
    } catch (error) {
      console.error('Error updating last active:', error);
    }
  };

  const updatePresence = useCallback(async () => {
    if (!user) return;

    try {
      // Update last_active in profiles
      await updateLastActive();

      // Track presence using Supabase realtime
      if (presenceChannel.current) {
        presenceChannel.current.track({
          user_id: user.id,
          online: true,
          last_seen: new Date().toISOString()
        });
      }
    } catch (error) {
      console.error('Error updating presence:', error);
    }
  }, [user, updateLastActive]);

  const isUserOnline = (userId: string): boolean => {
    return onlineUsers.has(userId);
  };

  useEffect(() => {
    if (!user) return;

    // Create presence channel
    presenceChannel.current = supabase.channel('user_presence', {
      config: {
        presence: {
          key: user.id
        }
      }
    });

    // Listen to presence changes
    presenceChannel.current
      .on('presence', { event: 'sync' }, () => {
        const newState = presenceChannel.current.presenceState();
        const online = new Set<string>();
        
        Object.values(newState).forEach((presences: unknown) => {
          (presences as UserPresence[]).forEach((presence: UserPresence) => {
            if (presence.online) {
              online.add(presence.user_id);
            }
          });
        });
        
        setOnlineUsers(online);
      })
      .on('presence', { event: 'join' }, ({ newPresences }: PresenceEvent) => {
        setOnlineUsers(prev => {
          const updated = new Set(prev);
          newPresences.forEach((presence: UserPresence) => {
            if (presence.online) {
              updated.add(presence.user_id);
            }
          });
          return updated;
        });
      })
      .on('presence', { event: 'leave' }, ({ leftPresences }: PresenceLeaveEvent) => {
        setOnlineUsers(prev => {
          const updated = new Set(prev);
          leftPresences.forEach((presence: UserPresence) => {
            updated.delete(presence.user_id);
          });
          return updated;
        });
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          // Initial presence update
          await updatePresence();
        }
      });

    // Set up heartbeat to maintain presence
    heartbeatInterval.current = setInterval(() => {
      updatePresence();
    }, 30000); // Update every 30 seconds

    // Clean up on unmount
    return () => {
      if (presenceChannel.current) {
        presenceChannel.current.unsubscribe();
      }
      if (heartbeatInterval.current) {
        clearInterval(heartbeatInterval.current);
      }
    };
  }, [user, updatePresence]);

  // Update presence on user activity
  useEffect(() => {
    const handleActivity = () => {
      updatePresence();
    };

    // Listen for user activity
    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart'];
    events.forEach(event => {
      document.addEventListener(event, handleActivity, { passive: true });
    });

    return () => {
      events.forEach(event => {
        document.removeEventListener(event, handleActivity);
      });
    };
  }, [user, updatePresence]);

  return {
    onlineUsers,
    updatePresence,
    isUserOnline
  };
};