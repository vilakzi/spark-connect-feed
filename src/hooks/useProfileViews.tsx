import { useState, useCallback } from 'react';
import { useAuth } from './useAuth';

interface ProfileView {
  id: string;
  viewer_id: string;
  viewed_at: string;
  created_at: string;
  viewer: {
    display_name: string;
    profile_image_url?: string;
    age?: number;
  };
  viewer_profile?: {
    display_name: string;
    profile_image_url?: string;
    age?: number;
  };
}

export const useProfileViews = () => {
  const { user } = useAuth();
  const [views, setViews] = useState<ProfileView[]>([]);
  const [viewCount, setViewCount] = useState(0);

  const trackProfileView = useCallback(async (profileId: string) => {
    // Mock function - profile_views table doesn't exist
    console.log('Track profile view:', profileId);
  }, []);

  const getProfileViews = useCallback(async () => {
    // Mock function - return empty array since table doesn't exist
    return [];
  }, []);

  const getViewAnalytics = useCallback(async () => {
    // Mock function
    return {
      totalViews: 0,
      uniqueViews: 0,
      viewsToday: 0,
      viewsThisWeek: 0
    };
  }, []);

  return {
    views,
    viewCount,
    profileViews: views,
    loading: false,
    trackProfileView,
    getProfileViews,
    getViewAnalytics
  };
};