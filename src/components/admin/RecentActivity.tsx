import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  Activity,
  MessageCircle, 
  Heart, 
  FileText,
  Clock
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface UserActivity {
  userId: string;
  displayName: string;
  email: string;
  lastActive: string;
  activityType: string;
  isOnline: boolean;
}

interface RecentActivityProps {
  activities: UserActivity[];
  loading: boolean;
}

export const RecentActivity: React.FC<RecentActivityProps> = ({ activities, loading }) => {
  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'message':
        return <MessageCircle className="h-4 w-4 text-blue-500" />;
      case 'match':
        return <Heart className="h-4 w-4 text-red-500" />;
      case 'post':
        return <FileText className="h-4 w-4 text-green-500" />;
      default:
        return <Activity className="h-4 w-4 text-gray-500" />;
    }
  };

  const getActivityText = (type: string) => {
    switch (type) {
      case 'message':
        return 'sent a message';
      case 'match':
        return 'got a new match';
      case 'post':
        return 'created a post';
      default:
        return 'was active';
    }
  };

  const getActivityColor = (type: string) => {
    switch (type) {
      case 'message':
        return 'bg-blue-100 text-blue-800';
      case 'match':
        return 'bg-red-100 text-red-800';
      case 'post':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Recent Activity
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="flex items-center gap-3">
                <div className="h-10 w-10 bg-muted animate-pulse rounded-full" />
                <div className="flex-1">
                  <div className="h-4 bg-muted animate-pulse rounded w-3/4 mb-1" />
                  <div className="h-3 bg-muted animate-pulse rounded w-1/2" />
                </div>
                <div className="h-6 w-16 bg-muted animate-pulse rounded" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Activity className="h-5 w-5" />
          Recent Activity
          <Badge variant="secondary" className="ml-auto">
            Live
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {activities.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Activity className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p>No recent activity</p>
            </div>
          ) : (
            activities.map((activity, index) => (
              <div key={`${activity.userId}-${activity.activityType}-${index}`} className="flex items-center gap-3">
                <div className="relative">
                  <Avatar className="h-10 w-10">
                    <AvatarImage src="" alt={activity.displayName} />
                    <AvatarFallback>
                      {activity.displayName.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  {activity.isOnline && (
                    <div className="absolute -bottom-0.5 -right-0.5 h-3 w-3 bg-green-500 border-2 border-background rounded-full" />
                  )}
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-sm truncate">
                      {activity.displayName}
                    </span>
                    {getActivityIcon(activity.activityType)}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {getActivityText(activity.activityType)}
                  </p>
                </div>
                
                <div className="flex flex-col items-end gap-1">
                  <Badge 
                    variant="secondary" 
                    className={`text-xs ${getActivityColor(activity.activityType)}`}
                  >
                    {activity.activityType}
                  </Badge>
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Clock className="h-3 w-3" />
                    <span>
                      {formatDistanceToNow(new Date(activity.lastActive), { addSuffix: true })}
                    </span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
        
        {activities.length > 0 && (
          <div className="text-center pt-4 border-t">
            <p className="text-xs text-muted-foreground">
              Updates automatically every 30 seconds
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};