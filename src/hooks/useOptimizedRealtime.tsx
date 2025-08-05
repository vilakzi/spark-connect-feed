import { useCallback, useRef, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

interface SubscriptionManager {
  subscriptions: Map<string, any>;
  cleanup: () => void;
  addSubscription: (key: string, subscription: any) => void;
  removeSubscription: (key: string) => void;
}

export const useOptimizedRealtimeSubscriptions = (): SubscriptionManager => {
  const { user } = useAuth();
  const subscriptionsRef = useRef<Map<string, any>>(new Map());

  const addSubscription = useCallback((key: string, subscription: any) => {
    // Remove existing subscription with same key
    const existing = subscriptionsRef.current.get(key);
    if (existing) {
      supabase.removeChannel(existing);
    }

    subscriptionsRef.current.set(key, subscription);
  }, []);

  const removeSubscription = useCallback((key: string) => {
    const subscription = subscriptionsRef.current.get(key);
    if (subscription) {
      supabase.removeChannel(subscription);
      subscriptionsRef.current.delete(key);
    }
  }, []);

  const cleanup = useCallback(() => {
    subscriptionsRef.current.forEach((subscription) => {
      supabase.removeChannel(subscription);
    });
    subscriptionsRef.current.clear();
  }, []);

  // Cleanup on unmount or user change
  useEffect(() => {
    return cleanup;
  }, [cleanup, user?.id]);

  return {
    subscriptions: subscriptionsRef.current,
    cleanup,
    addSubscription,
    removeSubscription
  };
};

// Debounced typing indicator hook
export const useDebouncedTyping = (delay: number = 1000) => {
  const timeoutRef = useRef<NodeJS.Timeout>();
  const isTypingRef = useRef(false);

  const startTyping = useCallback((callback: () => void) => {
    if (!isTypingRef.current) {
      isTypingRef.current = true;
      callback();
    }

    // Clear existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // Set new timeout to stop typing
    timeoutRef.current = setTimeout(() => {
      isTypingRef.current = false;
    }, delay);
  }, [delay]);

  const stopTyping = useCallback((callback: () => void) => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    
    if (isTypingRef.current) {
      isTypingRef.current = false;
      callback();
    }
  }, []);

  const isTyping = useCallback(() => isTypingRef.current, []);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return { startTyping, stopTyping, isTyping };
};

// Optimized presence tracking
export const useOptimizedPresence = () => {
  const { user } = useAuth();
  const { addSubscription, removeSubscription } = useOptimizedRealtimeSubscriptions();
  const heartbeatRef = useRef<NodeJS.Timeout>();
  const lastActivityRef = useRef<number>(Date.now());

  const updatePresence = useCallback(async (status: 'online' | 'away' | 'offline', metadata?: any) => {
    if (!user) return;

    try {
      const channel = supabase.channel(`presence_${user.id}`);
      
      await channel.track({
        user: user.id,
        status,
        online_at: new Date().toISOString(),
        ...metadata
      });

      addSubscription(`presence_${user.id}`, channel);
    } catch (error) {
      console.error('Error updating presence:', error);
    }
  }, [user, addSubscription]);

  const startPresenceTracking = useCallback(() => {
    if (!user) return;

    // Update activity timestamp
    const updateActivity = () => {
      lastActivityRef.current = Date.now();
    };

    // Track user activity
    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart'];
    events.forEach(event => {
      document.addEventListener(event, updateActivity, true);
    });

    // Heartbeat to maintain presence
    heartbeatRef.current = setInterval(() => {
      const now = Date.now();
      const timeSinceActivity = now - lastActivityRef.current;
      
      // If user has been inactive for more than 5 minutes, mark as away
      if (timeSinceActivity > 5 * 60 * 1000) {
        updatePresence('away');
      } else {
        updatePresence('online');
      }
    }, 30000); // Check every 30 seconds

    // Initial presence update
    updatePresence('online');

    // Cleanup function
    return () => {
      events.forEach(event => {
        document.removeEventListener(event, updateActivity, true);
      });
      
      if (heartbeatRef.current) {
        clearInterval(heartbeatRef.current);
      }
      
      updatePresence('offline');
      removeSubscription(`presence_${user.id}`);
    };
  }, [user, updatePresence, removeSubscription]);

  return {
    updatePresence,
    startPresenceTracking
  };
};

// Connection pooling for chat
export const useOptimizedChat = () => {
  const { user } = useAuth();
  const { addSubscription, removeSubscription } = useOptimizedRealtimeSubscriptions();
  const connectionPoolRef = useRef<Map<string, any>>(new Map());

  const getOrCreateChatConnection = useCallback((conversationId: string) => {
    const existing = connectionPoolRef.current.get(conversationId);
    if (existing) {
      return existing;
    }

    const channel = supabase
      .channel(`chat_${conversationId}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
        filter: `conversation_id=eq.${conversationId}`
      }, (payload) => {
        // Handle new message
        console.log('New message:', payload);
      })
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'messages',
        filter: `conversation_id=eq.${conversationId}`
      }, (payload) => {
        // Handle message update (e.g., read status)
        console.log('Message updated:', payload);
      })
      .subscribe();

    connectionPoolRef.current.set(conversationId, channel);
    addSubscription(`chat_${conversationId}`, channel);

    return channel;
  }, [addSubscription]);

  const closeChatConnection = useCallback((conversationId: string) => {
    connectionPoolRef.current.delete(conversationId);
    removeSubscription(`chat_${conversationId}`);
  }, [removeSubscription]);

  const sendTypingIndicator = useCallback(async (conversationId: string, isTyping: boolean) => {
    if (!user) return;

    try {
      await supabase
        .from('typing_indicators')
        .upsert({
          conversation_id: conversationId,
          user_id: user.id,
          is_typing: isTyping,
          updated_at: new Date().toISOString()
        });
    } catch (error) {
      console.error('Error sending typing indicator:', error);
    }
  }, [user]);

  return {
    getOrCreateChatConnection,
    closeChatConnection,
    sendTypingIndicator
  };
};