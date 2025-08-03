import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Heart, X } from 'lucide-react';
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
}

export const SwipeInterface = () => {
  const { user } = useAuth();
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [dailySwipes, setDailySwipes] = useState(0);

  useEffect(() => {
    if (!user) return;

    const fetchProfiles = async () => {
      try {
        // Swipe functionality not implemented yet - show placeholder
        console.log('Swipe feature coming soon');
        setProfiles([]);
        setDailySwipes(0);
      } catch (error) {
        console.error('Error:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchProfiles();
  }, [user]);

  const handleLike = async () => {
    try {
      console.log('Like functionality coming soon');
      toast({
        title: "Feature coming soon!",
        description: "Swipe functionality will be available soon"
      });
    } catch (error) {
      console.error('Error liking profile:', error);
    }
  };

  const handlePass = async () => {
    try {
      console.log('Pass functionality coming soon');
      toast({
        title: "Feature coming soon!",
        description: "Swipe functionality will be available soon"
      });
    } catch (error) {
      console.error('Error passing profile:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto p-4">
      <div className="text-center py-12">
        <h3 className="text-lg font-semibold text-foreground mb-2">Swipe Feature Coming Soon!</h3>
        <p className="text-muted-foreground mb-4">
          We're working hard to bring you the best matching experience.
        </p>
        <div className="flex gap-4 justify-center">
          <Button onClick={handlePass} variant="outline" size="lg" className="gap-2">
            <X className="w-5 h-5" />
            Pass
          </Button>
          <Button onClick={handleLike} size="lg" className="gap-2">
            <Heart className="w-5 h-5" />
            Like
          </Button>
        </div>
      </div>
    </div>
  );
};