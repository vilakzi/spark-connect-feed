import { useState, useCallback } from 'react';
import { useAuth } from '@/hooks/useAuth';

interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  data?: Record<string, unknown>;
  read_at?: string;
  created_at: string;
}

interface NotificationHookReturn {
  notifications: Notification[];
  unreadCount: number;
  markAsRead: (notificationId: string) => void;
  markAllAsRead: () => void;
  clearNotifications: () => void;
}

export const useNotifications = (): NotificationHookReturn => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);

  const unreadCount = notifications.filter(n => !n.read_at).length;

  const markAsRead = useCallback(async (notificationId: string) => {
    if (!user) return;
    
    // Mock function since table doesn't exist
    setNotifications(prev => 
      prev.map(n => 
        n.id === notificationId 
          ? { ...n, read_at: new Date().toISOString() }
          : n
      )
    );
  }, [user]);

  const markAllAsRead = useCallback(async () => {
    if (!user) return;
    
    // Mock function since table doesn't exist
    setNotifications(prev => 
      prev.map(n => ({ ...n, read_at: n.read_at || new Date().toISOString() }))
    );
  }, [user]);

  const clearNotifications = useCallback(() => {
    setNotifications([]);
  }, []);

  return {
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
    clearNotifications
  };
};