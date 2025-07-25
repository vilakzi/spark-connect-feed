import { useState, useRef } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MapPin, Heart, X, Star, Verified } from 'lucide-react';

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

interface SwipeCardProps {
  profile: Profile;
  onSwipe: (profileId: string, direction: 'left' | 'right', isSuperLike?: boolean) => void;
  style?: React.CSSProperties;
}

export const SwipeCard = ({ profile, onSwipe, style }: SwipeCardProps) => {
  const [isDragging, setIsDragging] = useState(false);
  const [dragPosition, setDragPosition] = useState({ x: 0, y: 0 });
  const [rotation, setRotation] = useState(0);
  const cardRef = useRef<HTMLDivElement>(null);
  const startPosition = useRef({ x: 0, y: 0 });

  const primaryImage = profile.profile_image_url || profile.profile_images?.[0];
  const isVerified = profile.photo_verified || 
    (profile.verifications && typeof profile.verifications === 'object' && 
     (profile.verifications.photoVerified || profile.verifications.emailVerified));

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    startPosition.current = { x: e.clientX, y: e.clientY };
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    setIsDragging(true);
    startPosition.current = { 
      x: e.touches[0].clientX, 
      y: e.touches[0].clientY 
    };
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    
    const deltaX = e.clientX - startPosition.current.x;
    const deltaY = e.clientY - startPosition.current.y;
    
    setDragPosition({ x: deltaX, y: deltaY });
    setRotation(deltaX * 0.1);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging) return;
    
    const deltaX = e.touches[0].clientX - startPosition.current.x;
    const deltaY = e.touches[0].clientY - startPosition.current.y;
    
    setDragPosition({ x: deltaX, y: deltaY });
    setRotation(deltaX * 0.1);
  };

  const handleMouseUp = () => {
    if (!isDragging) return;
    
    const threshold = 100;
    const superLikeThreshold = -120;
    
    if (dragPosition.y < superLikeThreshold) {
      onSwipe(profile.id, 'right', true); // Super like
    } else if (dragPosition.x > threshold) {
      onSwipe(profile.id, 'right');
    } else if (dragPosition.x < -threshold) {
      onSwipe(profile.id, 'left');
    }
    
    resetCard();
  };

  const handleTouchEnd = () => {
    if (!isDragging) return;
    
    const threshold = 100;
    const superLikeThreshold = -120;
    
    if (dragPosition.y < superLikeThreshold) {
      onSwipe(profile.id, 'right', true); // Super like
    } else if (dragPosition.x > threshold) {
      onSwipe(profile.id, 'right');
    } else if (dragPosition.x < -threshold) {
      onSwipe(profile.id, 'left');
    }
    
    resetCard();
  };

  const resetCard = () => {
    setIsDragging(false);
    setDragPosition({ x: 0, y: 0 });
    setRotation(0);
  };

  const getCardOpacity = () => {
    const distance = Math.abs(dragPosition.x) + Math.abs(dragPosition.y);
    return Math.max(0.7, 1 - distance / 300);
  };

  const getOverlayOpacity = () => {
    const distance = Math.abs(dragPosition.x) + Math.abs(dragPosition.y);
    return Math.min(0.8, distance / 150);
  };

  const getOverlayType = () => {
    if (dragPosition.y < -80) return 'super';
    if (dragPosition.x > 50) return 'like';
    if (dragPosition.x < -50) return 'nope';
    return null;
  };

  return (
    <div
      ref={cardRef}
      className="absolute inset-0 cursor-grab active:cursor-grabbing select-none"
      style={{
        ...style,
        transform: `translate(${dragPosition.x}px, ${dragPosition.y}px) rotate(${rotation}deg)`,
        opacity: getCardOpacity(),
        transition: isDragging ? 'none' : 'all 0.3s ease-out',
        zIndex: isDragging ? 10 : 1,
      }}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      <Card className="w-full h-full overflow-hidden shadow-xl">
        <div className="relative h-full">
          {/* Main Image */}
          <div className="h-2/3 w-full overflow-hidden bg-muted">
            {primaryImage ? (
              <img
                src={primaryImage}
                alt={profile.display_name || 'Profile'}
                className="w-full h-full object-cover"
                draggable={false}
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/10 to-secondary/10">
                <div className="text-8xl font-bold text-muted-foreground">
                  {profile.display_name?.[0]?.toUpperCase() || '?'}
                </div>
              </div>
            )}
          </div>

          {/* Verification Badge */}
          {isVerified && (
            <div className="absolute top-4 right-4">
              <Badge variant="secondary" className="bg-background/80 backdrop-blur-sm">
                <Verified className="w-3 h-3 mr-1" />
                Verified
              </Badge>
            </div>
          )}

          {/* Swipe Overlays */}
          {getOverlayType() && (
            <div 
              className="absolute inset-0 flex items-center justify-center"
              style={{ opacity: getOverlayOpacity() }}
            >
              {getOverlayType() === 'like' && (
                <div className="bg-green-500 text-white px-8 py-4 rounded-full text-2xl font-bold border-4 border-white transform rotate-12">
                  LIKE
                </div>
              )}
              {getOverlayType() === 'nope' && (
                <div className="bg-red-500 text-white px-8 py-4 rounded-full text-2xl font-bold border-4 border-white transform -rotate-12">
                  NOPE
                </div>
              )}
              {getOverlayType() === 'super' && (
                <div className="bg-blue-500 text-white px-6 py-4 rounded-full text-2xl font-bold border-4 border-white flex items-center gap-2">
                  <Star className="w-6 h-6 fill-current" />
                  SUPER LIKE
                </div>
              )}
            </div>
          )}

          {/* Profile Info */}
          <CardContent className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black/80 to-transparent text-white">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-2xl font-bold flex items-center gap-3">
                  {profile.display_name || 'Anonymous'}
                  {profile.age && (
                    <span className="font-normal text-xl">{profile.age}</span>
                  )}
                </h3>
              </div>

              {profile.location && (
                <div className="flex items-center gap-2 text-white/90">
                  <MapPin className="w-4 h-4" />
                  {profile.location}
                </div>
              )}

              {profile.bio && (
                <p className="text-white/90 line-clamp-2">
                  {profile.bio}
                </p>
              )}

              {profile.interests && profile.interests.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {profile.interests.slice(0, 4).map((interest, index) => (
                    <Badge key={index} variant="secondary" className="bg-white/20 text-white border-white/30">
                      {interest}
                    </Badge>
                  ))}
                  {profile.interests.length > 4 && (
                    <Badge variant="secondary" className="bg-white/20 text-white border-white/30">
                      +{profile.interests.length - 4}
                    </Badge>
                  )}
                </div>
              )}
            </div>
          </CardContent>
        </div>
      </Card>
    </div>
  );
};