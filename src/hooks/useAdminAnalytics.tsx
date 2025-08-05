import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';

interface AdminStats {
  totalUsers: number;
  activeUsers: number;
  newSignupsToday: number;
  totalMatches: number;
  totalMessages: number;
  totalPosts: number;
  conversionRate: number;
}

interface UserGrowthData {
  date: string;
  newUsers: number;
  totalUsers: number;
}

interface EngagementData {
  date: string;
  messages: number;
  matches: number;
  posts: number;
}

interface UserActivity {
  userId: string;
  displayName: string;
  email: string;
  lastActive: string;
  activityType: string;
  isOnline: boolean;
}

export const useAdminAnalytics = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [userGrowthData, setUserGrowthData] = useState<UserGrowthData[]>([]);
  const [engagementData, setEngagementData] = useState<EngagementData[]>([]);
  const [recentActivity, setRecentActivity] = useState<UserActivity[]>([]);
  const [refreshInterval, setRefreshInterval] = useState<NodeJS.Timeout | null>(null);

  const fetchAdminStats = useCallback(async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      
      // Fetch basic stats
      const [usersResult, matchesResult, messagesResult, postsResult] = await Promise.all([
        supabase.from('profiles').select('id, created_at, last_active'),
        supabase.from('matches').select('id, created_at'),
        supabase.from('messages').select('id, created_at'),
        supabase.from('feed_posts').select('id, created_at')
      ]);

      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const last24Hours = new Date(now.getTime() - 24 * 60 * 60 * 1000);

      const totalUsers = usersResult.data?.length || 0;
      const activeUsers = usersResult.data?.filter(user => 
        new Date(user.last_active || user.created_at) > last24Hours
      ).length || 0;
      
      const newSignupsToday = usersResult.data?.filter(user => 
        new Date(user.created_at) >= today
      ).length || 0;

      const stats: AdminStats = {
        totalUsers,
        activeUsers,
        newSignupsToday,
        totalMatches: matchesResult.data?.length || 0,
        totalMessages: messagesResult.data?.length || 0,
        totalPosts: postsResult.data?.length || 0,
        conversionRate: totalUsers > 0 ? ((matchesResult.data?.length || 0) / totalUsers) * 100 : 0
      };

      setStats(stats);
      
    } catch (error) {
      console.error('Error fetching admin stats:', error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  const fetchUserGrowthData = useCallback(async () => {
    if (!user) return;
    
    try {
      const { data: users } = await supabase
        .from('profiles')
        .select('created_at')
        .order('created_at', { ascending: true });

      if (!users) return;

      // Group users by date and calculate cumulative totals
      const growthMap = new Map<string, number>();
      const totalMap = new Map<string, number>();
      
      users.forEach(user => {
        const date = new Date(user.created_at).toISOString().split('T')[0];
        growthMap.set(date, (growthMap.get(date) || 0) + 1);
      });

      let runningTotal = 0;
      const growthData: UserGrowthData[] = [];
      
      // Get last 30 days
      for (let i = 29; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        const dateStr = date.toISOString().split('T')[0];
        
        const newUsers = growthMap.get(dateStr) || 0;
        runningTotal += newUsers;
        
        growthData.push({
          date: dateStr,
          newUsers,
          totalUsers: runningTotal
        });
      }

      setUserGrowthData(growthData);
      
    } catch (error) {
      console.error('Error fetching user growth data:', error);
    }
  }, [user]);

  const fetchEngagementData = useCallback(async () => {
    if (!user) return;
    
    try {
      const [messagesResult, matchesResult, postsResult] = await Promise.all([
        supabase.from('messages').select('created_at'),
        supabase.from('matches').select('created_at'),
        supabase.from('feed_posts').select('created_at')
      ]);

      const engagementMap = new Map<string, { messages: number; matches: number; posts: number }>();
      
      // Process messages
      messagesResult.data?.forEach(msg => {
        const date = new Date(msg.created_at).toISOString().split('T')[0];
        const current = engagementMap.get(date) || { messages: 0, matches: 0, posts: 0 };
        current.messages++;
        engagementMap.set(date, current);
      });

      // Process matches
      matchesResult.data?.forEach(match => {
        const date = new Date(match.created_at).toISOString().split('T')[0];
        const current = engagementMap.get(date) || { messages: 0, matches: 0, posts: 0 };
        current.matches++;
        engagementMap.set(date, current);
      });

      // Process posts
      postsResult.data?.forEach(post => {
        const date = new Date(post.created_at).toISOString().split('T')[0];
        const current = engagementMap.get(date) || { messages: 0, matches: 0, posts: 0 };
        current.posts++;
        engagementMap.set(date, current);
      });

      // Create array for last 7 days
      const engagementData: EngagementData[] = [];
      for (let i = 6; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        const dateStr = date.toISOString().split('T')[0];
        
        const data = engagementMap.get(dateStr) || { messages: 0, matches: 0, posts: 0 };
        engagementData.push({
          date: dateStr,
          ...data
        });
      }

      setEngagementData(engagementData);
      
    } catch (error) {
      console.error('Error fetching engagement data:', error);
    }
  }, [user]);

  const fetchRecentActivity = useCallback(async () => {
    if (!user) return;
    
    try {
      // Get recent activities from various tables
      const [messagesResult, matchesResult, postsResult] = await Promise.all([
        supabase
          .from('messages')
          .select(`
            created_at,
            sender_id,
            profiles!messages_sender_id_fkey (display_name, last_active)
          `)
          .order('created_at', { ascending: false })
          .limit(10),
        supabase
          .from('matches')
          .select(`
            created_at,
            user_one_id,
            profiles!matches_user_one_id_fkey (display_name, last_active)
          `)
          .order('created_at', { ascending: false })
          .limit(10),
        supabase
          .from('feed_posts')
          .select(`
            created_at,
            user_id,
            profiles!feed_posts_user_id_fkey (display_name, last_active)
          `)
          .order('created_at', { ascending: false })
          .limit(10)
      ]);

      const activities: UserActivity[] = [];
      const now = new Date();
      const isOnlineThreshold = 5 * 60 * 1000; // 5 minutes

      // Process messages
      messagesResult.data?.forEach(msg => {
        const profile = (msg.profiles as any);
        if (profile) {
          const lastActive = new Date(profile.last_active || msg.created_at);
          activities.push({
            userId: msg.sender_id,
            displayName: profile.display_name || 'Anonymous',
            email: '',
            lastActive: msg.created_at,
            activityType: 'message',
            isOnline: now.getTime() - lastActive.getTime() < isOnlineThreshold
          });
        }
      });

      // Process matches
      matchesResult.data?.forEach(match => {
        const profile = (match.profiles as any);
        if (profile) {
          const lastActive = new Date(profile.last_active || match.created_at);
          activities.push({
            userId: match.user_one_id,
            displayName: profile.display_name || 'Anonymous',
            email: '',
            lastActive: match.created_at,
            activityType: 'match',
            isOnline: now.getTime() - lastActive.getTime() < isOnlineThreshold
          });
        }
      });

      // Process posts
      postsResult.data?.forEach(post => {
        const profile = (post.profiles as any);
        if (profile) {
          const lastActive = new Date(profile.last_active || post.created_at);
          activities.push({
            userId: post.user_id,
            displayName: profile.display_name || 'Anonymous',
            email: '',
            lastActive: post.created_at,
            activityType: 'post',
            isOnline: now.getTime() - lastActive.getTime() < isOnlineThreshold
          });
        }
      });

      // Sort by most recent and take top 20
      activities.sort((a, b) => new Date(b.lastActive).getTime() - new Date(a.lastActive).getTime());
      setRecentActivity(activities.slice(0, 20));
      
    } catch (error) {
      console.error('Error fetching recent activity:', error);
    }
  }, [user]);

  const startRealTimeUpdates = useCallback(() => {
    if (refreshInterval) {
      clearInterval(refreshInterval);
    }

    const interval = setInterval(() => {
      fetchAdminStats();
      fetchRecentActivity();
    }, 30000); // Update every 30 seconds

    setRefreshInterval(interval);
  }, [fetchAdminStats, fetchRecentActivity, refreshInterval]);

  const stopRealTimeUpdates = useCallback(() => {
    if (refreshInterval) {
      clearInterval(refreshInterval);
      setRefreshInterval(null);
    }
  }, [refreshInterval]);

  useEffect(() => {
    if (user) {
      fetchAdminStats();
      fetchUserGrowthData();
      fetchEngagementData();
      fetchRecentActivity();
      startRealTimeUpdates();
    }

    return () => {
      stopRealTimeUpdates();
    };
  }, [user]);

  return {
    loading,
    stats,
    userGrowthData,
    engagementData,
    recentActivity,
    fetchAdminStats,
    fetchUserGrowthData,
    fetchEngagementData,
    fetchRecentActivity,
    startRealTimeUpdates,
    stopRealTimeUpdates
  };
};