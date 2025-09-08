import { useState, useEffect, useCallback } from 'react';
import { useAuth } from './useAuth';
import { supabase } from '@/integrations/supabase/client';

export interface CreatorAnalytics {
  // Content metrics
  posts_created: number;
  posts_liked: number;
  posts_shared: number;
  posts_commented: number;
  
  // Engagement metrics
  total_views: number;
  unique_viewers: number;
  avg_view_duration: number;
  engagement_rate: number;
  
  // Follower metrics
  followers_gained: number;
  followers_lost: number;
  total_followers: number;
  
  // Revenue metrics
  revenue_cents: number;
  tips_received: number;
  subscriptions_gained: number;
  subscriptions_lost: number;
  
  // Live streaming metrics
  streams_count: number;
  total_stream_minutes: number;
  avg_concurrent_viewers: number;
  peak_viewers: number;
  
  // Growth metrics
  profile_visits: number;
  content_discoveries: number;
  
  date: string;
}

export interface DashboardSummary {
  today_views: number;
  today_revenue_cents: number;
  total_followers: number;
  engagement_rate: number;
  monthly_growth: number;
  top_content: any;
  recent_achievements: any[];
}

export interface CreatorGoal {
  id: string;
  goal_type: 'followers' | 'revenue' | 'engagement' | 'content' | 'streams';
  target_value: number;
  current_value: number;
  deadline?: string;
  is_active: boolean;
  achieved_at?: string;
}

export interface Achievement {
  id: string;
  achievement_type: string;
  achievement_data: any;
  earned_at: string;
  is_featured: boolean;
}

export const useCreatorAnalytics = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [dashboardSummary, setDashboardSummary] = useState<DashboardSummary | null>(null);
  const [analytics, setAnalytics] = useState<CreatorAnalytics[]>([]);
  const [goals, setGoals] = useState<CreatorGoal[]>([]);
  const [achievements, setAchievements] = useState<Achievement[]>([]);

  // Get dashboard summary
  const fetchDashboardSummary = useCallback(async () => {
    if (!user) return;

    setLoading(true);
    try {
      const { data, error } = await supabase
        .rpc('get_creator_dashboard_summary', { creator_uuid: user.id });

      if (error) throw error;
      
      const transformedSummary: DashboardSummary = {
        today_views: data[0]?.today_views || 0,
        today_revenue_cents: data[0]?.today_revenue_cents || 0,
        total_followers: data[0]?.total_followers || 0,
        engagement_rate: data[0]?.engagement_rate || 0,
        monthly_growth: data[0]?.monthly_growth || 0,
        top_content: data[0]?.top_content || {},
        recent_achievements: Array.isArray(data[0]?.recent_achievements) ? data[0].recent_achievements : []
      };
      
      setDashboardSummary(transformedSummary);
    } catch (err) {
      console.error('Error fetching dashboard summary:', err);
      setError('Failed to load dashboard summary');
    } finally {
      setLoading(false);
    }
  }, [user]);

  // Get analytics for date range
  const fetchAnalytics = useCallback(async (startDate: string, endDate: string) => {
    if (!user) return;

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('creator_analytics')
        .select('*')
        .eq('creator_id', user.id)
        .gte('date', startDate)
        .lte('date', endDate)
        .order('date', { ascending: true });

      if (error) throw error;
      
      setAnalytics(data || []);
    } catch (err) {
      console.error('Error fetching analytics:', err);
      setError('Failed to load analytics');
    } finally {
      setLoading(false);
    }
  }, [user]);

  // Get creator goals
  const fetchGoals = useCallback(async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('creator_goals')
        .select('*')
        .eq('creator_id', user.id)
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      const transformedGoals: CreatorGoal[] = (data || []).map(goal => ({
        id: goal.id,
        goal_type: goal.goal_type as CreatorGoal['goal_type'],
        target_value: goal.target_value,
        current_value: goal.current_value,
        deadline: goal.deadline,
        is_active: goal.is_active,
        achieved_at: goal.achieved_at
      }));
      
      setGoals(transformedGoals);
    } catch (err) {
      console.error('Error fetching goals:', err);
      setError('Failed to load goals');
    }
  }, [user]);

  // Get achievements
  const fetchAchievements = useCallback(async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('creator_achievements')
        .select('*')
        .eq('creator_id', user.id)
        .order('earned_at', { ascending: false })
        .limit(20);

      if (error) throw error;
      
      setAchievements(data || []);
    } catch (err) {
      console.error('Error fetching achievements:', err);
      setError('Failed to load achievements');
    }
  }, [user]);

  // Create a new goal
  const createGoal = useCallback(async (goalData: Omit<CreatorGoal, 'id' | 'current_value' | 'is_active' | 'achieved_at'>) => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('creator_goals')
        .insert({
          creator_id: user.id,
          ...goalData,
          current_value: 0,
          is_active: true
        })
        .select()
        .single();

      if (error) throw error;
      
      const transformedGoal: CreatorGoal = {
        id: data.id,
        goal_type: data.goal_type as CreatorGoal['goal_type'],
        target_value: data.target_value,
        current_value: data.current_value,
        deadline: data.deadline,
        is_active: data.is_active,
        achieved_at: data.achieved_at
      };
      
      setGoals(prev => [transformedGoal, ...prev]);
      return data;
    } catch (err) {
      console.error('Error creating goal:', err);
      throw err;
    }
  }, [user]);

  // Update goal progress
  const updateGoalProgress = useCallback(async (goalId: string, currentValue: number) => {
    if (!user) return;

    try {
      const goal = goals.find(g => g.id === goalId);
      if (!goal) return;

      const updateData: any = { current_value: currentValue };
      
      // Check if goal is achieved
      if (currentValue >= goal.target_value && !goal.achieved_at) {
        updateData.achieved_at = new Date().toISOString();
        updateData.is_active = false;
      }

      const { data, error } = await supabase
        .from('creator_goals')
        .update(updateData)
        .eq('id', goalId)
        .select()
        .single();

      if (error) throw error;
      
      const transformedGoal: CreatorGoal = {
        id: data.id,
        goal_type: data.goal_type as CreatorGoal['goal_type'],
        target_value: data.target_value,
        current_value: data.current_value,
        deadline: data.deadline,
        is_active: data.is_active,
        achieved_at: data.achieved_at
      };
      
      setGoals(prev => prev.map(g => g.id === goalId ? transformedGoal : g));
    } catch (err) {
      console.error('Error updating goal progress:', err);
    }
  }, [user, goals]);

  // Record analytics entry
  const recordAnalytics = useCallback(async (analyticsData: Partial<CreatorAnalytics>) => {
    if (!user) return;

    try {
      const today = new Date().toISOString().split('T')[0];
      
      const { error } = await supabase
        .from('creator_analytics')
        .upsert({
          creator_id: user.id,
          date: today,
          ...analyticsData
        }, {
          onConflict: 'creator_id,date'
        });

      if (error) throw error;
    } catch (err) {
      console.error('Error recording analytics:', err);
    }
  }, [user]);

  // Award achievement
  const awardAchievement = useCallback(async (achievementType: string, achievementData: any = {}) => {
    if (!user) return;

    try {
      // Check if achievement already exists
      const existingAchievement = achievements.find(a => 
        a.achievement_type === achievementType && 
        JSON.stringify(a.achievement_data) === JSON.stringify(achievementData)
      );

      if (existingAchievement) return;

      const { data, error } = await supabase
        .from('creator_achievements')
        .insert({
          creator_id: user.id,
          achievement_type: achievementType,
          achievement_data: achievementData
        })
        .select()
        .single();

      if (error) throw error;
      
      setAchievements(prev => [data, ...prev]);
      return data;
    } catch (err) {
      console.error('Error awarding achievement:', err);
    }
  }, [user, achievements]);

  // Calculate analytics summary
  const getAnalyticsSummary = useCallback((timeframe: 'today' | 'week' | 'month' = 'today') => {
    if (analytics.length === 0) return null;

    let filteredAnalytics = analytics;
    const now = new Date();

    if (timeframe === 'week') {
      const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      filteredAnalytics = analytics.filter(a => new Date(a.date) >= weekAgo);
    } else if (timeframe === 'month') {
      const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      filteredAnalytics = analytics.filter(a => new Date(a.date) >= monthAgo);
    } else {
      // Today
      const today = now.toISOString().split('T')[0];
      filteredAnalytics = analytics.filter(a => a.date === today);
    }

    return filteredAnalytics.reduce((acc, curr) => ({
      total_views: acc.total_views + curr.total_views,
      total_revenue_cents: acc.total_revenue_cents + curr.revenue_cents,
      total_followers: Math.max(acc.total_followers, curr.total_followers),
      avg_engagement_rate: (acc.avg_engagement_rate + curr.engagement_rate) / 2,
      posts_created: acc.posts_created + curr.posts_created,
      streams_count: acc.streams_count + curr.streams_count
    }), {
      total_views: 0,
      total_revenue_cents: 0,
      total_followers: 0,
      avg_engagement_rate: 0,
      posts_created: 0,
      streams_count: 0
    });
  }, [analytics]);

  // Initialize data on mount
  useEffect(() => {
    if (user) {
      fetchDashboardSummary();
      fetchGoals();
      fetchAchievements();
      
      // Fetch last 30 days of analytics
      const endDate = new Date().toISOString().split('T')[0];
      const startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      fetchAnalytics(startDate, endDate);
    }
  }, [user, fetchDashboardSummary, fetchGoals, fetchAchievements, fetchAnalytics]);

  return {
    // State
    loading,
    error,
    dashboardSummary,
    analytics,
    goals,
    achievements,
    
    // Actions
    fetchDashboardSummary,
    fetchAnalytics,
    fetchGoals,
    fetchAchievements,
    createGoal,
    updateGoalProgress,
    recordAnalytics,
    awardAchievement,
    getAnalyticsSummary,
    
    // Helpers
    clearError: () => setError(null)
  };
};