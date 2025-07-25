import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { ProfileCard } from './ProfileCard';
import { useAuth } from '@/hooks/useAuth';
import { Loader2 } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

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
  last_active?: string | null;
  is_blocked?: boolean;
  photo_verified?: boolean;
}

const PROFILES_PER_PAGE = 100;

export const InstagramFeed = () => {
  const { user } = useAuth();
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(true);
  const [hasMore, setHasMore] = useState(true);
  const [offset, setOffset] = useState(0);

  const fetchProfiles = useCallback(async (isLoadMore = true) => {
    if (!user) return;

    try {
      const currentOffset = isLoadMore ? offset : 0;
      
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .neq('id', user.id) // Exclude current user
        .eq('is_blocked', false) // Only show non-blocked users
        .order('last_active', { ascending: false })
        .range(currentOffset, currentOffset + PROFILES_PER_PAGE - 1);

      if (error) {
        console.error('Error fetching profiles:', error);
        toast({
          title: "Error loading profiles",
          description: "Please try again later",
          variant: "destructive"
        });
        return;
      }

      const newProfiles = data || [];
      
      if (isLoadMore) {
        setProfiles(prev => [...prev, ...newProfiles]);
      } else {
        setProfiles(newProfiles);
      }

      setHasMore(newProfiles.length === PROFILES_PER_PAGE);
      setOffset(currentOffset + newProfiles.length);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(true);
      setLoadingMore(true);
    }
  }, [user, offset]);

  const loadMore = useCallback(async () => {
    if (loadingMore || !hasMore) return;
    setLoadingMore(true);
    await fetchProfiles(true);
  }, [fetchProfiles, loadingMore, hasMore]);

  const handleScroll = useCallback(() => {
    if (
      window.innerHeight + document.documentElement.scrollTop >=
      document.documentElement.offsetHeight - 1000
    ) {
      loadMore();
    }
  }, [loadMore]);

  useEffect(() => {
    fetchProfiles();
  }, []);

  useEffect(() => {
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [handleScroll]);

  const handleLike = async (profileId: string) => {
    if (!user) return;

    try {
      // Insert a swipe record
      const { error } = await supabase
        .from('swipes')
        .insert({
          user_id: user.id,
          target_user_id: profileId,
          liked: true
        });

      if (error) {
        console.error('Error creating swipe:', error);
        toast({
          title: "Error",
          description: "Could not process like. Please try again.",
          variant: "destructive"
        });
        return;
      }

      toast({
        title: "Profile liked!",
        description: "We'll let you know if it's a match"
      });

      // Remove the profile from the feed
      setProfiles(prev => prev.filter(p => p.id !== profileId));
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const handleMessage = (profileId: string) => {
    // For now, just show a toast - we'll implement messaging in a later phase
    toast({
      title: "Coming soon!",
      description: "Messaging will be available in the next update"
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (profiles.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-8 text-center">
        <h2 className="text-2xl font-bold text-foreground mb-4">No more profiles</h2>
        <p className="text-muted-foreground mb-6">
          You've seen all available profiles. Check back later for new connections!
        </p>
        <button
          onClick={() => fetchProfiles()}
          className="px-6 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
        >
          Refresh
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {profiles.map((profile) => (
            <ProfileCard
              key={profile.id}
              profile={profile}
              onLike={handleLike}
              onMessage={handleMessage}
            />
          ))}
        </div>

        {loadingMore && (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-primary" />
          </div>
        )}

        {!hasMore && profiles.length > 0 && (
          <div className="text-center py-8">
            <p className="text-muted-foreground">You've reached the end!</p>
          </div>
        )}
      </div>
    </div>
  );
};