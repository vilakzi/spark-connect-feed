import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

interface NotificationPreferences {
  push_enabled: boolean;
  email_enabled: boolean;
  new_matches: boolean;
  new_messages: boolean;
  profile_views: boolean;
  marketing: boolean;
  stories: boolean;
  super_likes: boolean;
}

export const useAdvancedNotifications = () => {
  const { user } = useAuth();
  const [preferences, setPreferences] = useState<NotificationPreferences>({
    push_enabled: true,
    email_enabled: true,
    new_matches: true,
    new_messages: true,
    profile_views: true,
    marketing: false,
    stories: true,
    super_likes: true
  });
  const [loading, setLoading] = useState(false);
  const [pushSupported, setPushSupported] = useState(false);

  // Check if browser supports push notifications
  useEffect(() => {
    setPushSupported('Notification' in window && 'serviceWorker' in navigator);
  }, []);

  // Load notification preferences
  const loadPreferences = async () => {
    if (!user) return;

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('notification_preferences')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Error loading notification preferences:', error);
        return;
      }

      if (data) {
        setPreferences({
          push_enabled: data.push_enabled,
          email_enabled: data.email_enabled,
          new_matches: data.new_matches,
          new_messages: data.new_messages,
          profile_views: data.profile_views,
          marketing: data.marketing,
          stories: data.stories,
          super_likes: data.super_likes
        });
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  // Update notification preferences
  const updatePreferences = async (updates: Partial<NotificationPreferences>) => {
    if (!user) return false;

    try {
      const newPreferences = { ...preferences, ...updates };
      
      const { error } = await supabase
        .from('notification_preferences')
        .upsert({
          user_id: user.id,
          ...newPreferences,
          updated_at: new Date().toISOString()
        });

      if (error) {
        console.error('Error updating preferences:', error);
        return false;
      }

      setPreferences(newPreferences);
      return true;
    } catch (error) {
      console.error('Error:', error);
      return false;
    }
  };

  // Request push notification permission
  const requestPushPermission = async () => {
    if (!pushSupported) return false;

    try {
      const permission = await Notification.requestPermission();
      if (permission === 'granted') {
        await updatePreferences({ push_enabled: true });
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error requesting push permission:', error);
      return false;
    }
  };

  // Send browser notification
  const sendBrowserNotification = (title: string, options?: NotificationOptions) => {
    if (!pushSupported || !preferences.push_enabled) return;

    if (Notification.permission === 'granted') {
      new Notification(title, {
        icon: '/favicon.ico',
        badge: '/favicon.ico',
        ...options
      });
    }
  };

  // Create notification based on type and preferences
  const createNotification = async (
    type: 'match' | 'message' | 'profile_view' | 'super_like' | 'story',
    title: string,
    message: string,
    data?: any
  ) => {
    if (!user) return;

    // Check if user wants this type of notification
    const shouldNotify = preferences[
      type === 'match' ? 'new_matches' :
      type === 'message' ? 'new_messages' :
      type === 'profile_view' ? 'profile_views' :
      type === 'super_like' ? 'super_likes' :
      'stories'
    ];

    if (!shouldNotify) return;

    try {
      // Create database notification
      await supabase
        .from('notifications')
        .insert({
          user_id: user.id,
          type,
          title,
          message,
          data: data || {}
        });

      // Send browser notification if enabled
      if (preferences.push_enabled) {
        sendBrowserNotification(title, { body: message });
      }
    } catch (error) {
      console.error('Error creating notification:', error);
    }
  };

  useEffect(() => {
    if (user) {
      loadPreferences();
    }
  }, [user]);

  return {
    preferences,
    loading,
    pushSupported,
    updatePreferences,
    requestPushPermission,
    sendBrowserNotification,
    createNotification
  };
};