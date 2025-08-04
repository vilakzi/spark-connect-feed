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
      // For now, return empty array since tables need to be regenerated in types
      setProfileViews([]);
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
      // For now, just log since tables need to be regenerated in types
      console.log('Would track profile view:', { viewedUserId });
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