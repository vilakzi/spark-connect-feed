import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Calendar, MapPin, Users, Clock } from 'lucide-react';
import { format, isToday, isTomorrow, parseISO } from 'date-fns';

interface SocialEvent {
  id: string;
  title: string;
  description: string;
  eventDate: string;
  location: string;
  maxAttendees?: number;
  currentAttendees: number;
  imageUrl?: string;
  eventType: string;
  community?: {
    name: string;
    imageUrl?: string;
  };
  userAttendance?: {
    status: string;
    joinedAt: string;
  };
}

interface EventCardProps {
  event: SocialEvent;
  onJoin?: (eventId: string, status: 'going' | 'interested' | 'maybe') => void;
  onViewDetails?: (eventId: string) => void;
  loading?: boolean;
}

export const EventCard: React.FC<EventCardProps> = ({
  event,
  onJoin,
  onViewDetails,
  loading = false
}) => {
  const isAttending = !!event.userAttendance;
  const eventDate = parseISO(event.eventDate);
  
  const getEventTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      meetup: 'bg-blue-100 text-blue-800',
      activity: 'bg-green-100 text-green-800',
      party: 'bg-purple-100 text-purple-800',
      casual: 'bg-orange-100 text-orange-800'
    };
    return colors[type.toLowerCase()] || 'bg-gray-100 text-gray-800';
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      going: 'bg-green-100 text-green-800',
      interested: 'bg-blue-100 text-blue-800',
      maybe: 'bg-yellow-100 text-yellow-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const formatEventDate = (date: Date) => {
    if (isToday(date)) {
      return `Today at ${format(date, 'h:mm a')}`;
    }
    if (isTomorrow(date)) {
      return `Tomorrow at ${format(date, 'h:mm a')}`;
    }
    return format(date, 'MMM d, h:mm a');
  };

  const isEventFull = event.maxAttendees ? event.currentAttendees >= event.maxAttendees : false;

  return (
    <Card className="h-full hover:shadow-md transition-shadow duration-200">
      <CardHeader className="pb-3">
        <div className="flex items-start gap-3">
          {event.imageUrl ? (
            <Avatar className="h-12 w-12">
              <AvatarImage src={event.imageUrl} alt={event.title} />
              <AvatarFallback>
                {event.title.charAt(0)}
              </AvatarFallback>
            </Avatar>
          ) : (
            <div className="h-12 w-12 bg-muted rounded-full flex items-center justify-center">
              <Calendar className="h-6 w-6 text-muted-foreground" />
            </div>
          )}
          
          <div className="flex-1 min-w-0">
            <CardTitle className="text-lg line-clamp-1">
              {event.title}
            </CardTitle>
            <div className="flex items-center gap-2 mt-1">
              <Badge 
                variant="secondary" 
                className={getEventTypeColor(event.eventType)}
              >
                {event.eventType}
              </Badge>
              {isEventFull && (
                <Badge variant="destructive" className="text-xs">
                  Full
                </Badge>
              )}
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Description */}
        <p className="text-sm text-muted-foreground line-clamp-2">
          {event.description || 'No description available.'}
        </p>

        {/* Event Details */}
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm">
            <Clock className="h-4 w-4 text-muted-foreground" />
            <span>{formatEventDate(eventDate)}</span>
          </div>
          
          {event.location && (
            <div className="flex items-center gap-2 text-sm">
              <MapPin className="h-4 w-4 text-muted-foreground" />
              <span className="truncate">{event.location}</span>
            </div>
          )}
          
          <div className="flex items-center gap-2 text-sm">
            <Users className="h-4 w-4 text-muted-foreground" />
            <span>
              {event.currentAttendees} 
              {event.maxAttendees ? ` / ${event.maxAttendees}` : ''} attending
            </span>
          </div>
        </div>

        {/* Community Info */}
        {event.community && (
          <div className="flex items-center gap-2 p-2 bg-muted/50 rounded-lg">
            <Avatar className="h-6 w-6">
              <AvatarImage src={event.community.imageUrl} alt={event.community.name} />
              <AvatarFallback className="text-xs">
                {event.community.name.charAt(0)}
              </AvatarFallback>
            </Avatar>
            <span className="text-sm text-muted-foreground">
              {event.community.name}
            </span>
          </div>
        )}

        {/* Attendance Status */}
        {isAttending && (
          <div className="flex items-center gap-2 p-2 bg-green-50 rounded-lg">
            <div className="w-2 h-2 bg-green-500 rounded-full" />
            <Badge 
              variant="secondary" 
              className={getStatusColor(event.userAttendance!.status)}
            >
              {event.userAttendance!.status}
            </Badge>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-2">
          {!isAttending ? (
            <>
              <Button
                size="sm"
                className="flex-1"
                onClick={() => onJoin?.(event.id, 'going')}
                disabled={loading || isEventFull}
              >
                {isEventFull ? 'Full' : 'Join Event'}
              </Button>
              {!isEventFull && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onJoin?.(event.id, 'interested')}
                  disabled={loading}
                >
                  Interested
                </Button>
              )}
            </>
          ) : (
            <Button
              variant="outline"
              size="sm"
              className="flex-1"
              onClick={() => onViewDetails?.(event.id)}
            >
              View Details
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
};