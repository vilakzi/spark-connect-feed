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

interface DatabaseProfileView {
  id: string;
  viewer_id: string;
  viewed_id: string;
  created_at: string;
  profiles?: {
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
      const { data, error } = await supabase
        .from('profile_views')
        .select(`
          *,
          profiles!profile_views_viewer_id_fkey (
            display_name,
            profile_image_url,
            age
          )
        `)
        .eq('viewed_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const viewsWithViewer = data?.map((view: unknown) => {
        const typedView = view as DatabaseProfileView;
        return {
          ...typedView,
          viewer: {
            display_name: typedView.profiles?.display_name || 'Unknown',
            profile_image_url: typedView.profiles?.profile_image_url,
            age: typedView.profiles?.age
          }
        };
      }) || [];

      setProfileViews(viewsWithViewer);
    } catch (error) {
      console.error('Error fetching profile views:', error);
      setProfileViews([]);
    } finally {
      setLoading(false);
    }
  };

  // Track a profile view
  const trackProfileView = async (viewedUserId: string) => {
    if (!user || user.id === viewedUserId) return;

    try {
      const { error } = await supabase
        .from('profile_views')
        .insert({
          viewer_id: user.id,
          viewed_id: viewedUserId
        });

      // Ignore duplicate view errors (same user viewing same profile)
      if (error && !error.message.includes('duplicate')) {
        throw error;
      }
    } catch (error) {
      console.error('Error tracking profile view:', error);
    }
  };

  useEffect(() => {
    if (user) {
      fetchProfileViews();
    }
  }, [user, fetchProfileViews]);

  return {
    profileViews,
    loading,
    trackProfileView,
    fetchProfileViews
  };
};