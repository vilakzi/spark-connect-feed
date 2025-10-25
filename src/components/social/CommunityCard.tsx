import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Users, Lock, Calendar, MapPin } from 'lucide-react';

interface Community {
  id: string;
  name: string;
  description: string;
  category: string;
  imageUrl: string;
  memberCount: number;
  isPrivate: boolean;
  userMembership?: {
    role: string;
    joinedAt: string;
  };
}

interface CommunityCardProps {
  community: Community;
  onJoin?: (communityId: string) => void;
  onLeave?: (communityId: string) => void;
  onViewDetails?: (communityId: string) => void;
  loading?: boolean;
}

export const CommunityCard: React.FC<CommunityCardProps> = ({
  community,
  onJoin,
  onLeave,
  onViewDetails,
  loading = false
}) => {
  const isMember = !!community.userMembership;
  const isAdmin = community.userMembership?.role === 'admin';

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      fitness: 'bg-green-100 text-green-800',
      technology: 'bg-blue-100 text-blue-800',
      arts: 'bg-purple-100 text-purple-800',
      food: 'bg-orange-100 text-orange-800',
      travel: 'bg-cyan-100 text-cyan-800',
      sports: 'bg-red-100 text-red-800',
      music: 'bg-pink-100 text-pink-800',
      books: 'bg-yellow-100 text-yellow-800',
      gaming: 'bg-indigo-100 text-indigo-800',
      business: 'bg-gray-100 text-gray-800'
    };
    return colors[category.toLowerCase()] || 'bg-gray-100 text-gray-800';
  };

  return (
    <Card className="h-full hover:shadow-md transition-shadow duration-200">
      <CardHeader className="pb-3">
        <div className="flex items-start gap-3">
          <Avatar className="h-12 w-12">
            <AvatarImage src={community.imageUrl} alt={community.name} />
            <AvatarFallback>
              {community.name.split(' ').map(word => word.charAt(0)).join('').slice(0, 2)}
            </AvatarFallback>
          </Avatar>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between">
              <div>
                <CardTitle className="text-lg line-clamp-1 flex items-center gap-2">
                  {community.name}
                  {community.isPrivate && (
                    <Lock className="h-4 w-4 text-muted-foreground" />
                  )}
                </CardTitle>
                <div className="flex items-center gap-2 mt-1">
                  <Badge 
                    variant="secondary" 
                    className={getCategoryColor(community.category)}
                  >
                    {community.category}
                  </Badge>
                  {isAdmin && (
                    <Badge variant="outline" className="text-xs">
                      Admin
                    </Badge>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Description */}
        <p className="text-sm text-muted-foreground line-clamp-2">
          {community.description || 'No description available.'}
        </p>

        {/* Stats */}
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-1">
            <Users className="h-4 w-4 text-muted-foreground" />
            <span>{community.memberCount} {community.memberCount === 1 ? 'member' : 'members'}</span>
          </div>
          
          {community.isPrivate && (
            <div className="flex items-center gap-1 text-muted-foreground">
              <Lock className="h-3 w-3" />
              <span className="text-xs">Private</span>
            </div>
          )}
        </div>

        {/* Member Status */}
        {isMember && (
          <div className="flex items-center gap-2 p-2 bg-green-50 rounded-lg">
            <div className="w-2 h-2 bg-green-500 rounded-full" />
            <span className="text-sm text-green-700">
              Joined as {community.userMembership?.role}
            </span>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-2">
          {!isMember ? (
            <>
              <Button
                size="sm"
                className="flex-1"
                onClick={() => onJoin?.(community.id)}
                disabled={loading}
              >
                Join Community
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => onViewDetails?.(community.id)}
              >
                View
              </Button>
            </>
          ) : (
            <>
              <Button
                variant="outline"
                size="sm"
                className="flex-1"
                onClick={() => onViewDetails?.(community.id)}
              >
                View Community
              </Button>
              <Button
                variant="destructive"
                size="sm"
                onClick={() => onLeave?.(community.id)}
                disabled={loading || isAdmin}
              >
                Leave
              </Button>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
};