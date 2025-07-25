import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { SwipeCard } from './SwipeCard';
import { useAuth } from '@/hooks/useAuth';
import { useActivityTracker } from '@/hooks/useActivityTracker';
import { Button } from '@/components/ui/button';
import { Heart, X, Star, RotateCcw } from 'lucide-react';
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
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);

  const fetchProfiles = useCallback(async () => {
    if (!user) return;

    try {
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

      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .neq('id', user.id)
        .eq('is_blocked', false)
        .not('id', 'in', `(${swipedIds.length ? swipedIds.join(',') : 'null'})`)
        .order('last_active', { ascending: false })
        .limit(10);

      if (error) {
        console.error('Error fetching profiles:', error);
        toast({
          title: "Error loading profiles",
          description: "Please try again later",
          variant: "destructive"
        });
        return;
      }

      setProfiles(data || []);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  }, [user, toast]);

  useEffect(() => {
    fetchProfiles();
  }, [fetchProfiles]);

  const handleSwipe = async (profileId: string, direction: 'left' | 'right', isSuperLike = false) => {
    if (!user) return;

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
    <div className="relative w-full h-full">
      {/* Card Stack */}
      <div className="relative w-full h-full max-w-sm mx-auto">
        {/* Next card (behind) */}
        {nextProfile && (
          <div className="absolute inset-0 transform scale-95 opacity-50">
            <SwipeCard
              profile={nextProfile}
              onSwipe={() => {}}
              style={{ pointerEvents: 'none' }}
            />
          </div>
        )}

        {/* Current card */}
        {currentProfile && (
          <SwipeCard
            profile={currentProfile}
            onSwipe={handleSwipe}
          />
        )}
      </div>

      {/* Action Buttons */}
      <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 flex gap-4">
        <Button
          variant="outline"
          size="lg"
          className="w-14 h-14 rounded-full border-red-500 hover:bg-red-50 hover:border-red-600"
          onClick={() => handleButtonSwipe('left')}
        >
          <X className="w-6 h-6 text-red-500" />
        </Button>

        <Button
          variant="outline"
          size="lg"
          className="w-16 h-16 rounded-full border-blue-500 hover:bg-blue-50 hover:border-blue-600"
          onClick={() => handleButtonSwipe('right', true)}
        >
          <Star className="w-7 h-7 text-blue-500" />
        </Button>

        <Button
          variant="outline"
          size="lg"
          className="w-14 h-14 rounded-full border-green-500 hover:bg-green-50 hover:border-green-600"
          onClick={() => handleButtonSwipe('right')}
        >
          <Heart className="w-6 h-6 text-green-500" />
        </Button>
      </div>
    </div>
  );
};