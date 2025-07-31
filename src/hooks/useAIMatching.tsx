import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

interface AIMatchSuggestion {
  user_id: string;
  compatibility_score: number;
  common_interests: number;
  activity_score: number;
  profile?: {
    display_name: string;
    age?: number;
    bio?: string;
    location?: string;
    profile_image_url?: string;
    interests?: string[];
  };
}

export const useAIMatching = () => {
  const { user } = useAuth();
  const [suggestions, setSuggestions] = useState<AIMatchSuggestion[]>([]);
  const [loading, setLoading] = useState(false);

  // Get AI-powered match suggestions
  const getMatchSuggestions = async (limit = 10) => {
    if (!user) return;

    try {
      setLoading(true);
      const { data, error } = await supabase.rpc('get_ai_matching_suggestions', {
        user_id_param: user.id,
        limit_param: limit
      });

      if (error) throw error;

      if (!data || data.length === 0) {
        setSuggestions([]);
        return;
      }

      // Get full profile data for suggestions
      const userIds = data.map((s: any) => s.user_id);
      const { data: profilesData } = await supabase
        .from('profiles')
        .select('*')
        .in('id', userIds);

      const profilesMap = new Map(profilesData?.map(p => [p.id, p]) || []);

      const enrichedSuggestions = data.map((suggestion: any) => ({
        ...suggestion,
        profile: profilesMap.get(suggestion.user_id)
      }));

      setSuggestions(enrichedSuggestions);
    } catch (error) {
      console.error('Error getting match suggestions:', error);
    } finally {
      setLoading(false);
    }
  };

  // Log user behavior for improved AI matching
  const logUserBehavior = async (
    actionType: 'swipe_right' | 'swipe_left' | 'super_like' | 'profile_view' | 'message_sent',
    targetUserId?: string,
    metadata?: any
  ) => {
    if (!user) return;

    try {
      await supabase
        .from('user_behavior_analytics')
        .insert({
          user_id: user.id,
          action_type: actionType,
          target_user_id: targetUserId,
          metadata: metadata || {}
        });
    } catch (error) {
      console.error('Error logging user behavior:', error);
    }
  };

  // Get user behavior insights
  const getUserBehaviorInsights = async () => {
    if (!user) return null;

    try {
      const { data, error } = await supabase
        .from('user_behavior_analytics')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(100);

      if (error) throw error;

      // Analyze behavior patterns
      const insights = {
        totalActions: data?.length || 0,
        swipeRightRate: 0,
        profileViewsCount: 0,
        messagesSentCount: 0,
        mostActiveHour: 0,
        preferredAgeRange: { min: 18, max: 50 }
      };

      if (data && data.length > 0) {
        const swipeRights = data.filter(d => d.action_type === 'swipe_right').length;
        const totalSwipes = data.filter(d => d.action_type.includes('swipe')).length;
        
        insights.swipeRightRate = totalSwipes > 0 ? (swipeRights / totalSwipes) * 100 : 0;
        insights.profileViewsCount = data.filter(d => d.action_type === 'profile_view').length;
        insights.messagesSentCount = data.filter(d => d.action_type === 'message_sent').length;

        // Calculate most active hour
        const hourCounts = new Array(24).fill(0);
        data.forEach(d => {
          const hour = new Date(d.created_at).getHours();
          hourCounts[hour]++;
        });
        insights.mostActiveHour = hourCounts.indexOf(Math.max(...hourCounts));
      }

      return insights;
    } catch (error) {
      console.error('Error getting behavior insights:', error);
      return null;
    }
  };

  useEffect(() => {
    if (user) {
      getMatchSuggestions();
    }
  }, [user]);

  return {
    suggestions,
    loading,
    getMatchSuggestions,
    logUserBehavior,
    getUserBehaviorInsights
  };
};