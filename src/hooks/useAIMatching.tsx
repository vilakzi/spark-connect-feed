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
      
      // Get potential matches using direct query
      const { data: profilesData, error } = await supabase
        .from('profiles')
        .select('*')
        .neq('id', user.id)
        .eq('is_blocked', false)
        .limit(limit * 2); // Get more to filter out already swiped

      if (error) throw error;

      if (!profilesData || profilesData.length === 0) {
        setSuggestions([]);
        return;
      }

      // Get user's own profile for comparison
      const { data: userProfile } = await supabase
        .from('profiles')
        .select('interests')
        .eq('id', user.id)
        .single();

      // Get users already swiped
      const { data: swipedUsers } = await supabase
        .from('swipes')
        .select('target_user_id')
        .eq('user_id', user.id);

      const swipedUserIds = new Set(swipedUsers?.map(s => s.target_user_id) || []);
      const userInterests = userProfile?.interests || [];

      // Calculate compatibility and filter
      const scoredProfiles = profilesData
        .filter(profile => !swipedUserIds.has(profile.id))
        .map(profile => {
          const commonInterests = userInterests.filter(interest => 
            profile.interests?.includes(interest)
          ).length;
          
          const totalInterests = Math.max(
            userInterests.length + (profile.interests?.length || 0),
            1
          );
          
          const compatibilityScore = (commonInterests / totalInterests) * 0.6 + 
            (profile.last_active && new Date(profile.last_active) > new Date(Date.now() - 24 * 60 * 60 * 1000) ? 0.4 : 0.2);

          return {
            user_id: profile.id,
            compatibility_score: compatibilityScore,
            common_interests: commonInterests,
            activity_score: profile.last_active && new Date(profile.last_active) > new Date(Date.now() - 24 * 60 * 60 * 1000) ? 1.0 : 0.5,
            profile
          };
        })
        .sort((a, b) => b.compatibility_score - a.compatibility_score)
        .slice(0, limit);

      setSuggestions(scoredProfiles);
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