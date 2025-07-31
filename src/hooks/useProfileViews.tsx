import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

interface ProfileView {
  id: string;
  viewer_id: string;
  viewed_id: string;
  created_at: string;
  viewer?: {
    display_name: string;
    profile_image_url?: string;
    age?: number;
  };
}

export const useProfileViews = () => {
  const { user } = useAuth();
  const [profileViews, setProfileViews] = useState<ProfileView[]>([]);
  const [loading, setLoading] = useState(false);

  // Fetch profile views for current user
  const fetchProfileViews = async () => {
    if (!user) return;

    try {
      setLoading(true);
      // Get profile views
      const { data: viewsData, error } = await supabase
        .from('profile_views')
        .select('*')
        .eq('viewed_id', user.id)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;

      if (!viewsData || viewsData.length === 0) {
        setProfileViews([]);
        return;
      }

      // Get viewer profiles
      const viewerIds = viewsData.map(v => v.viewer_id);
      const { data: profilesData } = await supabase
        .from('profiles')
        .select('id, display_name, profile_image_url, age')
        .in('id', viewerIds);

      const profilesMap = new Map(profilesData?.map(p => [p.id, p]) || []);

      const enrichedViews = viewsData.map(view => ({
        ...view,
        viewer: profilesMap.get(view.viewer_id)
      }));

      setProfileViews(enrichedViews);
    } catch (error) {
      console.error('Error fetching profile views:', error);
    } finally {
      setLoading(false);
    }
  };

  // Track a profile view
  const trackProfileView = async (viewedUserId: string) => {
    if (!user || user.id === viewedUserId) return;

    try {
      await supabase
        .from('profile_views')
        .upsert({
          viewer_id: user.id,
          viewed_id: viewedUserId
        });

      // Log behavior for AI matching
      await supabase
        .from('user_behavior_analytics')
        .insert({
          user_id: user.id,
          action_type: 'profile_view',
          target_user_id: viewedUserId,
          metadata: { timestamp: new Date().toISOString() }
        });
    } catch (error) {
      console.error('Error tracking profile view:', error);
    }
  };

  useEffect(() => {
    if (user) {
      fetchProfileViews();
    }
  }, [user]);

  return {
    profileViews,
    loading,
    trackProfileView,
    fetchProfileViews
  };
};