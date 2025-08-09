import { useCallback, useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';

interface ActivityData {
  total_swipes: number;
  total_matches: number;
  total_messages: number;
  total_profile_views: number;
  weekly_activity: Array<{
    date: string;
    swipes: number;
    matches: number;
    messages: number;
  }>;
  popular_times: Array<{
    hour: number;
    activity_count: number;
  }>;
}

interface DailyStats {
  swipes: number;
  matches: number;
  messages: number;
  goal: number;
}

export const useActivityTracker = () => {
  const { user } = useAuth();
  const [dailyStats, setDailyStats] = useState<DailyStats>({
    swipes: 0,
    matches: 0,
    messages: 0,
    goal: 10
  });

  useEffect(() => {
    if (user) {
      loadDailyStats();
    }
  }, [user, loadDailyStats]);

  const loadDailyStats = useCallback(async () => {
    if (!user) return;

    try {
      const today = new Date().toISOString().split('T')[0];
      const { data, error } = await supabase
        .from('daily_stats')
        .select('*')
        .eq('user_id', user.id)
        .eq('date', today)
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      if (data) {
        setDailyStats({
          swipes: data.swipes,
          matches: data.matches,
          messages: data.messages,
          goal: data.goal
        });
      }
    } catch (error) {
      console.error('Error loading daily stats:', error);
    }
  }, [user]);

  const trackActivity = useCallback(async (activityType: string, metadata: Record<string, unknown> = {}) => {
    if (!user) return;
    
    try {
      // Track the activity
      const { error: activityError } = await supabase
        .from('activity_tracking')
        .insert({
          user_id: user.id,
          activity_type: activityType,
          metadata: metadata || {}
        });

      if (activityError) throw activityError;

      // Update daily stats
      const today = new Date().toISOString().split('T')[0];
      const updateField = activityType === 'swipe' ? 'swipes' : 
                         activityType === 'match' ? 'matches' : 
                         activityType === 'message' ? 'messages' : null;

      if (updateField) {
        const { error: statsError } = await supabase
          .from('daily_stats')
          .upsert({
            user_id: user.id,
            date: today,
            [updateField]: dailyStats[updateField as keyof DailyStats] + 1,
            goal: dailyStats.goal
          });

        if (statsError) throw statsError;

        // Update local state
        setDailyStats(prev => ({
          ...prev,
          [updateField]: prev[updateField as keyof DailyStats] + 1
        }));
      }
    } catch (error) {
      console.error('Error tracking activity:', error);
    }
  }, [user, dailyStats]);

  const getActivityData = useCallback(async (): Promise<ActivityData> => {
    if (!user) {
      return {
        total_swipes: 0,
        total_matches: 0,
        total_messages: 0,
        total_profile_views: 0,
        weekly_activity: [],
        popular_times: []
      };
    }

    try {
      // Get total stats from daily_stats table
      const { data: dailyData, error: dailyError } = await supabase
        .from('daily_stats')
        .select('swipes, matches, messages')
        .eq('user_id', user.id);

      if (dailyError) throw dailyError;

      const totals = dailyData?.reduce((acc, day) => ({
        swipes: acc.swipes + day.swipes,
        matches: acc.matches + day.matches,
        messages: acc.messages + day.messages
      }), { swipes: 0, matches: 0, messages: 0 }) || { swipes: 0, matches: 0, messages: 0 };

      // Get profile views count
      const { count: profileViews } = await supabase
        .from('profile_views')
        .select('*', { count: 'exact', head: true })
        .eq('viewed_id', user.id);

      // Get weekly activity (last 7 days)
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      
      const { data: weeklyData } = await supabase
        .from('daily_stats')
        .select('date, swipes, matches, messages')
        .eq('user_id', user.id)
        .gte('date', weekAgo.toISOString().split('T')[0])
        .order('date');

      return {
        total_swipes: totals.swipes,
        total_matches: totals.matches,
        total_messages: totals.messages,
        total_profile_views: profileViews || 0,
        weekly_activity: weeklyData || [],
        popular_times: [] // Would need hourly tracking for this
      };
    } catch (error) {
      console.error('Error getting activity data:', error);
      return {
        total_swipes: 0,
        total_matches: 0,
        total_messages: 0,
        total_profile_views: 0,
        weekly_activity: [],
        popular_times: []
      };
    }
  }, [user]);

  const updateDailyGoal = useCallback(async (newGoal: number) => {
    if (!user) return;

    try {
      const today = new Date().toISOString().split('T')[0];
      const { error } = await supabase
        .from('daily_stats')
        .upsert({
          user_id: user.id,
          date: today,
          goal: newGoal,
          swipes: dailyStats.swipes,
          matches: dailyStats.matches,
          messages: dailyStats.messages
        });

      if (error) throw error;

      setDailyStats(prev => ({ ...prev, goal: newGoal }));
    } catch (error) {
      console.error('Error updating daily goal:', error);
    }
  }, [user, dailyStats]);

  return {
    dailyStats,
    trackActivity,
    getActivityData,
    updateDailyGoal
  };
};