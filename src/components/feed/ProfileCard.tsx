import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MapPin, Heart, MessageCircle, Verified } from 'lucide-react';
import { OnlineStatus } from '@/components/common/OnlineStatus';
import { usePresence } from '@/hooks/usePresence';

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

interface ProfileCardProps {
  profile: Profile;
  onLike?: (profileId: string) => void;
  onMessage?: (profileId: string) => void;
}

export const ProfileCard = ({ profile, onLike, onMessage }: ProfileCardProps) => {
  const { isUserOnline } = usePresence();
  const primaryImage = profile.profile_image_url || profile.profile_images?.[0];
  const isVerified = profile.photo_verified || 
    (profile.verifications && typeof profile.verifications === 'object' && 
     (profile.verifications.photoVerified || profile.verifications.emailVerified));
  const isOnline = isUserOnline(profile.id);

  return (
    <Card className="w-full max-w-sm mx-auto overflow-hidden shadow-lg hover:shadow-xl transition-shadow duration-300">
      <div className="relative">
        <div className="aspect-[3/4] w-full overflow-hidden bg-muted">
          {primaryImage ? (
            <img
              src={primaryImage}
              alt={profile.display_name || 'Profile'}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/10 to-secondary/10">
              <div className="text-6xl font-bold text-muted-foreground">
                {profile.display_name?.[0]?.toUpperCase() || '?'}
              </div>
            </div>
          )}
        </div>
        
        {isVerified && (
          <div className="absolute top-3 right-3">
            <Badge variant="secondary" className="bg-background/80 backdrop-blur-sm">
              <Verified className="w-3 h-3 mr-1" />
              Verified
            </Badge>
          </div>
        )}
        
        {/* Online Status */}
        <div className="absolute bottom-3 right-3">
          <OnlineStatus isOnline={isOnline} size="md" />
        </div>
      </div>

      <CardContent className="p-4 space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-lg flex items-center gap-2">
              {profile.display_name || 'Anonymous'}
              {profile.age && (
                <span className="text-muted-foreground font-normal">{profile.age}</span>
              )}
            </h3>
            {profile.location && (
              <div className="flex items-center gap-1 text-sm text-muted-foreground">
                <MapPin className="w-3 h-3" />
                {profile.location}
              </div>
            )}
          </div>
        </div>

        {profile.bio && (
          <p className="text-sm text-foreground line-clamp-2">
            {profile.bio}
          </p>
        )}

        {profile.interests && profile.interests.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {profile.interests.slice(0, 3).map((interest, index) => (
              <Badge key={index} variant="outline" className="text-xs">
                {interest}
              </Badge>
            ))}
            {profile.interests.length > 3 && (
              <Badge variant="outline" className="text-xs">
                +{profile.interests.length - 3}
              </Badge>
            )}
          </div>
        )}

        <div className="flex gap-2 pt-2">
          <button
            onClick={() => onLike?.(profile.id)}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
          >
            <Heart className="w-4 h-4" />
            Like
          </button>
          <button
            onClick={() => onMessage?.(profile.id)}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-secondary text-secondary-foreground rounded-md hover:bg-secondary/80 transition-colors"
          >
            <MessageCircle className="w-4 h-4" />
            Message
          </button>
        </div>
      </CardContent>
    </Card>
  );
};