import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  Users, 
  MapPin, 
  Calendar,
  Shield,
  Lock,
  Globe
} from 'lucide-react';

interface Community {
  id: string;
  name: string;
  description: string | null;
  image_url: string | null;
  creator_id: string;
  privacy_level: string;
  category: string;
  member_count: number;
  location: string | null;
  is_verified: boolean;
  tags: string[];
  created_at: string;
}

interface CommunityCardProps {
  community: Community;
  isJoined?: boolean;
  onJoin?: (communityId: string) => void;
  onLeave?: (communityId: string) => void;
}

export const CommunityCard = ({ 
  community, 
  isJoined = false,
  onJoin,
  onLeave 
}: CommunityCardProps) => {
  const getPrivacyIcon = () => {
    switch (community.privacy_level) {
      case 'public':
        return <Globe className="h-4 w-4 text-green-600" />;
      case 'private':
        return <Lock className="h-4 w-4 text-red-600" />;
      case 'invite_only':
        return <Users className="h-4 w-4 text-amber-600" />;
      default:
        return <Globe className="h-4 w-4 text-green-600" />;
    }
  };

  const handleAction = () => {
    if (isJoined && onLeave) {
      onLeave(community.id);
    } else if (!isJoined && onJoin) {
      onJoin(community.id);
    }
  };

  return (
    <Card className="group hover:shadow-lg transition-all duration-300 bg-card border">
      <CardHeader className="space-y-3">
        <div className="flex items-start gap-3">
          <Avatar className="h-12 w-12">
            <AvatarImage src={community.image_url || undefined} alt={community.name} />
            <AvatarFallback className="bg-gradient-to-br from-primary/10 to-accent/10">
              {community.name.slice(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors truncate">
                {community.name}
              </h3>
              {community.is_verified && (
                <Shield className="h-4 w-4 text-blue-600 fill-current" />
              )}
              {getPrivacyIcon()}
            </div>
            
            <div className="flex items-center gap-1 mt-1">
              <Badge 
                variant="secondary" 
                className="text-xs font-medium bg-muted text-muted-foreground"
              >
                {community.category}
              </Badge>
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {community.description && (
          <p className="text-sm text-muted-foreground line-clamp-2">
            {community.description}
          </p>
        )}

        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-1 text-muted-foreground">
            <Users className="h-4 w-4" />
            <span>{community.member_count} members</span>
          </div>
          
          {community.location && (
            <div className="flex items-center gap-1 text-muted-foreground">
              <MapPin className="h-4 w-4" />
              <span className="truncate max-w-[120px]">{community.location}</span>
            </div>
          )}
        </div>

        <div className="flex items-center gap-1 text-xs text-muted-foreground">
          <Calendar className="h-3 w-3" />
          <span>Created {new Date(community.created_at).toLocaleDateString()}</span>
        </div>

        {community.tags.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {community.tags.slice(0, 3).map((tag, index) => (
              <Badge 
                key={index} 
                variant="outline" 
                className="text-xs px-2 py-0.5"
              >
                {tag}
              </Badge>
            ))}
            {community.tags.length > 3 && (
              <Badge variant="outline" className="text-xs px-2 py-0.5">
                +{community.tags.length - 3} more
              </Badge>
            )}
          </div>
        )}
      </CardContent>

      <CardFooter>
        <Button
          onClick={handleAction}
          className="w-full"
          variant={isJoined ? "outline" : "default"}
        >
          {isJoined ? 'Leave Community' : 'Join Community'}
        </Button>
      </CardFooter>
    </Card>
  );
};