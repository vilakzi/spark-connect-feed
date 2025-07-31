import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { SwipeCard } from './SwipeCard';
import { useAuth } from '@/hooks/useAuth';
import { useActivityTracker } from '@/hooks/useActivityTracker';
import { useUserPreferences } from '@/hooks/useUserPreferences';
import { useGeolocation } from '@/hooks/useGeolocation';
import { Button } from '@/components/ui/button';
import { Heart, X, Star, RotateCcw, Settings } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface Profile {
  id: string;
  display_name: string | null;
  age?: number | null;
  bio?: string | null;
  location?: string | null;
  profile_image_url?: string | null;
  profile_images?: string[] | null;
  interests?: string[] | null;
  verifications?: any;
  photo_verified?: boolean;
}

export const SwipeInterface = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const { trackActivity } = useActivityTracker();
  const { preferences } = useUserPreferences();
  const { location, calculateDistance } = useGeolocation();
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [dailySwipes, setDailySwipes] = useState(0);
  const MAX_FREE_SWIPES = 50;

  const fetchProfiles = useCallback(async () => {
    if (!user) return;

    try {
      // Check daily swipe count
      const today = new Date().toISOString().split('T')[0];
      const { data: swipeCount, error: countError } = await supabase
        .from('swipes')
        .select('id')
        .eq('user_id', user.id)
        .gte('created_at', today);

      if (countError) {
        console.error('Error fetching swipe count:', countError);
      } else {
        setDailySwipes(swipeCount?.length || 0);
      }

      // Get profiles that user hasn't swiped on yet
      const { data: swipedProfiles, error: swipeError } = await supabase
        .from('swipes')
        .select('target_user_id')
        .eq('user_id', user.id);

      if (swipeError) {
        console.error('Error fetching swiped profiles:', swipeError);
        return;
      }

      const swipedIds = swipedProfiles?.map(s => s.target_user_id) || [];

      // Build query based on user preferences
      let query = supabase
        .from('profiles')
        .select('*')
        .neq('id', user.id)
        .eq('is_blocked', false)
        .not('id', 'in', `(${swipedIds.length ? swipedIds.join(',') : 'null'})`);

      // Apply age filters
      if (preferences.min_age) {
        query = query.gte('age', preferences.min_age);
      }
      if (preferences.max_age) {
        query = query.lte('age', preferences.max_age);
      }

      // Apply gender filters
      if (preferences.show_me !== 'everyone') {
        query = query.eq('gender', preferences.show_me === 'men' ? 'male' : 'female');
      }

      const { data, error } = await query
        .order('last_active', { ascending: false })
        .limit(20);

      if (error) {
        console.error('Error fetching profiles:', error);
        toast({
          title: "Error loading profiles",
          description: "Please try again later",
          variant: "destructive"
        });
        return;
      }

      let filteredProfiles = data || [];

      // Apply distance filter if location is available
      if (location && preferences.location_enabled && preferences.max_distance) {
        filteredProfiles = filteredProfiles.filter(profile => {
          if (!profile.location) return true; // Include profiles without location
          
          // For demo purposes, we'll use random coordinates
          // In production, you'd store actual lat/lng coordinates
          const profileLat = parseFloat(profile.location.split(',')[0] || '0');
          const profileLng = parseFloat(profile.location.split(',')[1] || '0');
          
          if (profileLat === 0 && profileLng === 0) return true;
          
          const distance = calculateDistance(
            location.latitude,
            location.longitude,
            profileLat,
            profileLng
          );
          
          return distance <= preferences.max_distance;
        });
      }

      setProfiles(filteredProfiles);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  }, [user, toast, preferences, location, calculateDistance]);

  useEffect(() => {
    fetchProfiles();
  }, [fetchProfiles]);

  const handleSwipe = async (profileId: string, direction: 'left' | 'right', isSuperLike = false) => {
    if (!user) return;

    // Check daily swipe limit for free users
    if (dailySwipes >= MAX_FREE_SWIPES) {
      toast({
        title: "Daily swipe limit reached",
        description: "Upgrade to premium for unlimited swipes!",
        variant: "destructive"
      });
      return;
    }

    try {
      // Create swipe record
      const { error: swipeError } = await supabase
        .from('swipes')
        .insert({
          user_id: user.id,
          target_user_id: profileId,
          liked: direction === 'right'
        });

      if (swipeError) {
        console.error('Error creating swipe:', swipeError);
        toast({
          title: "Error",
          description: "Could not process swipe. Please try again.",
          variant: "destructive"
        });
        return;
      }

      // Update daily swipe count
      setDailySwipes(prev => prev + 1);

      // Track activity
      trackActivity('swipe');

      // Handle super like if applicable
      if (isSuperLike && direction === 'right') {
        const { error: superLikeError } = await supabase
          .from('super_likes')
          .insert({
            user_id: user.id,
            target_user_id: profileId
          });

        if (superLikeError) {
          console.error('Error creating super like:', superLikeError);
        } else {
          toast({
            title: "Super Like sent! ⭐",
            description: "They'll know you're really interested"
          });
        }
      } else if (direction === 'right') {
        toast({
          title: "Profile liked! ❤️",
          description: "We'll let you know if it's a match"
        });
      }

      // Move to next profile
      setCurrentIndex(prev => prev + 1);

      // Load more profiles if we're running low
      if (currentIndex >= profiles.length - 3) {
        fetchProfiles();
      }
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const handleButtonSwipe = (direction: 'left' | 'right', isSuperLike = false) => {
    const currentProfile = profiles[currentIndex];
    if (currentProfile) {
      handleSwipe(currentProfile.id, direction, isSuperLike);
    }
  };

  const remainingSwipes = Math.max(0, MAX_FREE_SWIPES - dailySwipes);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (currentIndex >= profiles.length) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-8 text-center">
        <h2 className="text-2xl font-bold text-foreground mb-4">No more profiles</h2>
        <p className="text-muted-foreground mb-6">
          You've seen all available profiles. Check back later for new people to connect with!
        </p>
        <Button onClick={() => {
          setCurrentIndex(0);
          fetchProfiles();
        }}>
          <RotateCcw className="w-4 h-4 mr-2" />
          Refresh
        </Button>
      </div>
    );
  }

  const currentProfile = profiles[currentIndex];
  const nextProfile = profiles[currentIndex + 1];

  return (
    <div className="relative w-full h-full flex flex-col">
      {/* Header with swipe counter */}
      <div className="flex items-center justify-between p-4 border-b border-border">
        <div className="text-sm text-muted-foreground">
          {remainingSwipes} swipes remaining today
        </div>
        <Button variant="ghost" size="sm">
          <Settings className="w-4 h-4" />
        </Button>
      </div>

      {/* Card Stack */}
      <div className="relative flex-1 max-w-sm mx-auto w-full">
        {/* Next card (behind) */}
        {nextProfile && (
          <div className="absolute inset-4 transform scale-95 opacity-50">
            <SwipeCard
              profile={nextProfile}
              onSwipe={() => {}}
              style={{ pointerEvents: 'none' }}
            />
          </div>
        )}

        {/* Current card */}
        {currentProfile && (
          <div className="absolute inset-4">
            <SwipeCard
              profile={currentProfile}
              onSwipe={handleSwipe}
            />
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="p-6 flex justify-center gap-4">
        <Button
          variant="outline"
          size="lg"
          className="w-14 h-14 rounded-full border-red-500 hover:bg-red-50 hover:border-red-600 dark:hover:bg-red-950"
          onClick={() => handleButtonSwipe('left')}
          disabled={remainingSwipes === 0}
        >
          <X className="w-6 h-6 text-red-500" />
        </Button>

        <Button
          variant="outline"
          size="lg"
          className="w-16 h-16 rounded-full border-blue-500 hover:bg-blue-50 hover:border-blue-600 dark:hover:bg-blue-950"
          onClick={() => handleButtonSwipe('right', true)}
          disabled={remainingSwipes === 0}
        >
          <Star className="w-7 h-7 text-blue-500" />
        </Button>

        <Button
          variant="outline"
          size="lg"
          className="w-14 h-14 rounded-full border-green-500 hover:bg-green-50 hover:border-green-600 dark:hover:bg-green-950"
          onClick={() => handleButtonSwipe('right')}
          disabled={remainingSwipes === 0}
        >
          <Heart className="w-6 h-6 text-green-500" />
        </Button>
      </div>

      {remainingSwipes === 0 && (
        <div className="p-4 bg-primary/10 border-t border-border text-center">
          <p className="text-sm font-medium text-primary">
            Upgrade to premium for unlimited swipes!
          </p>
        </div>
      )}
    </div>
  );
};