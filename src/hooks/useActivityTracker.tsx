import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

interface ActivityTracker {
  trackActivity: (activity: 'swipe' | 'match' | 'message' | 'profile_view') => void;
  dailyStats: {
    swipes: number;
    matches: number;
    messages: number;
    profileViews: number;
  };
}

export const useActivityTracker = (): ActivityTracker => {
  const { user } = useAuth();
  const [dailyStats, setDailyStats] = useState({
    swipes: 0,
    matches: 0,
    messages: 0,
    profileViews: 0
  });
  
  const lastActivityRef = useRef<Date>(new Date());
  const inactivityTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Auto-logout after 30 minutes of inactivity
  const AUTO_LOGOUT_TIME = 30 * 60 * 1000; // 30 minutes

  const resetInactivityTimer = () => {
    if (inactivityTimeoutRef.current) {
      clearTimeout(inactivityTimeoutRef.current);
    }

    inactivityTimeoutRef.current = setTimeout(async () => {
      if (user) {
        try {
          await supabase.auth.signOut();
          window.location.href = '/auth';
        } catch (error) {
          console.error('Error during auto-logout:', error);
        }
      }
    }, AUTO_LOGOUT_TIME);
  };

  const updateDailyUsage = async () => {
    if (!user) return;

    try {
      const today = new Date().toISOString().split('T')[0];
      
      const { data, error } = await supabase
        .from('daily_usage')
        .select('*')
        .eq('user_id', user.id)
        .eq('date', today)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Error fetching daily usage:', error);
        return;
      }

      if (data) {
        // Update existing record
        await supabase
          .from('daily_usage')
          .update({
            last_scroll_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
          .eq('id', data.id);
      } else {
        // Create new record for today
        await supabase
          .from('daily_usage')
          .insert({
            user_id: user.id,
            date: today,
            profile_scrolls: 1,
            last_scroll_at: new Date().toISOString()
          });
      }
    } catch (error) {
      console.error('Error updating daily usage:', error);
    }
  };

  const trackActivity = async (activity: 'swipe' | 'match' | 'message' | 'profile_view') => {
    lastActivityRef.current = new Date();
    resetInactivityTimer();

    // Update daily usage
    await updateDailyUsage();

    // Update local stats
    setDailyStats(prev => ({
      ...prev,
      [activity === 'swipe' ? 'swipes' : 
       activity === 'match' ? 'matches' :
       activity === 'message' ? 'messages' : 'profileViews']: 
       prev[activity === 'swipe' ? 'swipes' : 
           activity === 'match' ? 'matches' :
           activity === 'message' ? 'messages' : 'profileViews'] + 1
    }));
  };

  // Load daily stats on mount
  useEffect(() => {
    if (!user) return;

    const loadDailyStats = async () => {
      try {
        const today = new Date().toISOString().split('T')[0];
        
        // Get today's usage data
        const { data: dailyData } = await supabase
          .from('daily_usage')
          .select('*')
          .eq('user_id', user.id)
          .eq('date', today)
          .single();

        // Get today's swipes count
        const { count: swipesCount } = await supabase
          .from('swipes')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', user.id)
          .gte('created_at', `${today}T00:00:00.000Z`);

        // Get today's matches count
        const { count: matchesCount } = await supabase
          .from('matches')
          .select('*', { count: 'exact', head: true })
          .or(`user1_id.eq.${user.id},user2_id.eq.${user.id}`)
          .gte('created_at', `${today}T00:00:00.000Z`);

        setDailyStats({
          swipes: swipesCount || 0,
          matches: matchesCount || 0,
          messages: 0, // TODO: implement when messaging is added
          profileViews: dailyData?.profile_scrolls || 0
        });
      } catch (error) {
        console.error('Error loading daily stats:', error);
      }
    };

    loadDailyStats();
  }, [user]);

  // Set up activity listeners
  useEffect(() => {
    const handleActivity = () => {
      lastActivityRef.current = new Date();
      resetInactivityTimer();
    };

    // Listen for user activity
    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click'];
    events.forEach(event => {
      document.addEventListener(event, handleActivity, { passive: true });
    });

    // Initial timer setup
    resetInactivityTimer();

    return () => {
      events.forEach(event => {
        document.removeEventListener(event, handleActivity);
      });
      if (inactivityTimeoutRef.current) {
        clearTimeout(inactivityTimeoutRef.current);
      }
    };
  }, [user]);

  return {
    trackActivity,
    dailyStats
  };
};