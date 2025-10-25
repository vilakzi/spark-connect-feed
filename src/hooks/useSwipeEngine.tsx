import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

interface SwipeProfile {
  profile_id: string;
  display_name: string | null;
  age: number | null;
  bio: string | null;
  location: string | null;
  profile_image_url: string | null;
  profile_images: string[] | null;
  interests: string[] | null;
  photo_verified: boolean | null;
  compatibility_score: number;
}

export const useSwipeEngine = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [profiles, setProfiles] = useState<SwipeProfile[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(false);
  const [dailySwipes, setDailySwipes] = useState(0);
  const DAILY_SWIPE_LIMIT = 100;

  const fetchProfiles = useCallback(async () => {
    if (!user) return;

    setLoading(true);
    try {
      const { data, error } = await supabase.rpc('get_potential_matches', {
        user_id_param: user.id,
        limit_param: 10
      });

      if (error) throw error;

      setProfiles(data || []);
      setCurrentIndex(0);
    } catch (error) {
      console.error('Error fetching profiles:', error);
      toast({
        title: "Error",
        description: "Failed to load profiles. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [user, toast]);

  const handleSwipe = useCallback(async (action: 'like' | 'pass' | 'super_like') => {
    if (!user || currentIndex >= profiles.length || dailySwipes >= DAILY_SWIPE_LIMIT) return;

    const currentProfile = profiles[currentIndex];
    if (!currentProfile) return;

    try {
      // Record swipe action
      const { error } = await supabase
        .from('swipe_actions')
        .insert({
          user_id: user.id,
          target_user_id: currentProfile.profile_id,
          action_type: action
        });

      if (error) throw error;

      // Update daily swipe count
      setDailySwipes(prev => prev + 1);

      // Move to next profile
      setCurrentIndex(prev => prev + 1);

      // Show feedback for likes
      if (action === 'like') {
        toast({
          title: "Liked!",
          description: `You liked ${currentProfile.display_name || 'this profile'}`,
        });
      } else if (action === 'super_like') {
        toast({
          title: "Super Like!",
          description: `You super liked ${currentProfile.display_name || 'this profile'}`,
        });
      }

      // Fetch more profiles if running low
      if (currentIndex >= profiles.length - 2) {
        fetchProfiles();
      }

    } catch (error) {
      console.error('Error recording swipe:', error);
      toast({
        title: "Error",
        description: "Failed to record your swipe. Please try again.",
        variant: "destructive",
      });
    }
  }, [user, currentIndex, profiles, dailySwipes, toast, fetchProfiles]);

  const getCurrentProfile = useCallback(() => {
    return profiles[currentIndex] || null;
  }, [profiles, currentIndex]);

  const hasMoreProfiles = useCallback(() => {
    return currentIndex < profiles.length;
  }, [currentIndex, profiles.length]);

  const canSwipe = useCallback(() => {
    return dailySwipes < DAILY_SWIPE_LIMIT && hasMoreProfiles();
  }, [dailySwipes, hasMoreProfiles]);

  return {
    profiles,
    currentProfile: getCurrentProfile(),
    loading,
    dailySwipes,
    dailySwipeLimit: DAILY_SWIPE_LIMIT,
    canSwipe: canSwipe(),
    hasMoreProfiles: hasMoreProfiles(),
    fetchProfiles,
    handleSwipe,
  };
};