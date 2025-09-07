import { useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Heart, X, Star } from 'lucide-react';
import { useSwipeEngine } from '@/hooks/useSwipeEngine';
import { SwipeCard } from './SwipeCard';

export const SwipeInterface = () => {
  const { user } = useAuth();
  const {
    currentProfile,
    loading,
    dailySwipes,
    dailySwipeLimit,
    canSwipe,
    hasMoreProfiles,
    fetchProfiles,
    handleSwipe,
    superLike,
  } = useSwipeEngine();

  useEffect(() => {
    if (user) {
      fetchProfiles();
    }
  }, [user, fetchProfiles]);

  const handleLike = () => {
    if (currentProfile) {
      handleSwipe('right', currentProfile.id);
    }
  };

  const handlePass = () => {
    if (currentProfile) {
      handleSwipe('left', currentProfile.id);
    }
  };

  const handleSuperLike = () => {
    if (currentProfile) {
      superLike(currentProfile.id);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!hasMoreProfiles) {
    return (
      <div className="text-center py-12">
        <h3 className="text-lg font-semibold text-foreground mb-2">No more profiles</h3>
        <p className="text-muted-foreground mb-4">
          Check back later for new people to discover!
        </p>
        <Button onClick={fetchProfiles} variant="outline">
          Refresh
        </Button>
      </div>
    );
  }

  if (!currentProfile) {
    return (
      <div className="text-center py-12">
        <h3 className="text-lg font-semibold text-foreground mb-2">Loading profiles...</h3>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto p-6">
      <div className="text-center mb-4">
        <div className="text-sm text-muted-foreground">
          Daily swipes: {dailySwipes}/{dailySwipeLimit}
        </div>
      </div>

      <SwipeCard
        profile={{
          id: currentProfile.profile_id,
          display_name: currentProfile.display_name || 'Anonymous',
          age: currentProfile.age || undefined,
          bio: currentProfile.bio || undefined,
          location: currentProfile.location || undefined,
          profile_image_url: currentProfile.profile_image_url,
          profile_images: currentProfile.profile_images,
          interests: currentProfile.interests || [],
          photo_verified: currentProfile.photo_verified || false
        }}
        onSwipe={(direction) => {
          if (direction === 'right') handleLike();
          else if (direction === 'left') handlePass();
          else if (direction === 'up') handleSuperLike();
        }}
      />
      
      <div className="flex justify-center gap-4 mt-8">
        <Button
          onClick={handlePass}
          variant="outline"
          size="lg"
          className="rounded-full w-16 h-16"
          disabled={!canSwipe}
        >
          <X className="h-6 w-6" />
        </Button>
        <Button
          onClick={handleSuperLike}
          variant="outline"
          size="lg"
          className="rounded-full w-16 h-16 border-blue-500 text-blue-500 hover:bg-blue-50"
          disabled={!canSwipe}
        >
          <Star className="h-6 w-6" />
        </Button>
        <Button
          onClick={handleLike}
          variant="default"
          size="lg"
          className="rounded-full w-16 h-16 bg-pink-500 hover:bg-pink-600"
          disabled={!canSwipe}
        >
          <Heart className="h-6 w-6" />
        </Button>
      </div>

      {!canSwipe && dailySwipes >= dailySwipeLimit && (
        <div className="text-center mt-4">
          <p className="text-sm text-muted-foreground">
            You've reached your daily swipe limit. Come back tomorrow!
          </p>
        </div>
      )}
    </div>
  );
};