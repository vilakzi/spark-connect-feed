import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Calendar, 
  MapPin, 
  Users,
  Clock,
  DollarSign,
  Video,
  Globe,
  Lock
} from 'lucide-react';
import { format } from 'date-fns';

interface SocialEvent {
  id: string;
  title: string;
  description: string | null;
  image_url: string | null;
  organizer_id: string;
  event_type: string;
  privacy_level: string;
  location: string | null;
  venue_name: string | null;
  start_time: string;
  end_time: string;
  max_attendees: number | null;
  attendee_count: number;
  price_cents: number;
  tags: string[];
  is_online: boolean;
  status: string;
}

interface EventCardProps {
  event: SocialEvent;
  userRsvpStatus?: string | null;
  onRsvp?: (eventId: string, status: string) => void;
}

export const EventCard = ({ 
  event, 
  userRsvpStatus = null,
  onRsvp 
}: EventCardProps) => {
  const getEventTypeColor = (type: string) => {
    const colors = {
      meetup: 'bg-blue-100 text-blue-700 border-blue-200',
      party: 'bg-purple-100 text-purple-700 border-purple-200',
      workshop: 'bg-green-100 text-green-700 border-green-200',
      conference: 'bg-orange-100 text-orange-700 border-orange-200',
      date: 'bg-pink-100 text-pink-700 border-pink-200',
      virtual: 'bg-indigo-100 text-indigo-700 border-indigo-200'
    };
    return colors[type as keyof typeof colors] || 'bg-gray-100 text-gray-700 border-gray-200';
  };

  const getStatusColor = (status: string) => {
    const colors = {
      going: 'bg-green-100 text-green-700 border-green-200',
      maybe: 'bg-yellow-100 text-yellow-700 border-yellow-200',
      not_going: 'bg-red-100 text-red-700 border-red-200'
    };
    return colors[status as keyof typeof colors] || '';
  };

  const formatPrice = (cents: number) => {
    if (cents === 0) return 'Free';
    return `$${(cents / 100).toFixed(2)}`;
  };

  const handleRsvp = (status: string) => {
    if (onRsvp) {
      onRsvp(event.id, status);
    }
  };

  const startDate = new Date(event.start_time);
  const endDate = new Date(event.end_time);
  const isMultiDay = startDate.toDateString() !== endDate.toDateString();

  return (
    <Card className="group hover:shadow-lg transition-all duration-300 bg-card border overflow-hidden">
      {event.image_url && (
        <div className="aspect-video w-full overflow-hidden">
          <img 
            src={event.image_url} 
            alt={event.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        </div>
      )}

      <CardHeader className="space-y-3">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-lg text-foreground group-hover:text-primary transition-colors truncate">
              {event.title}
            </h3>
            
            <div className="flex items-center gap-2 mt-2">
              <Badge className={getEventTypeColor(event.event_type)}>
                {event.event_type}
              </Badge>
              
              {event.privacy_level === 'private' ? (
                <Lock className="h-4 w-4 text-muted-foreground" />
              ) : (
                <Globe className="h-4 w-4 text-muted-foreground" />
              )}
              
              {event.is_online && (
                <Video className="h-4 w-4 text-blue-600" />
              )}
            </div>
          </div>
          
          {userRsvpStatus && (
            <Badge className={getStatusColor(userRsvpStatus)}>
              {userRsvpStatus.replace('_', ' ')}
            </Badge>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {event.description && (
          <p className="text-sm text-muted-foreground line-clamp-2">
            {event.description}
          </p>
        )}

        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <span>
              {format(startDate, 'MMM d, yyyy')}
              {isMultiDay && ` - ${format(endDate, 'MMM d, yyyy')}`}
            </span>
          </div>
          
          <div className="flex items-center gap-2 text-sm">
            <Clock className="h-4 w-4 text-muted-foreground" />
            <span>
              {format(startDate, 'h:mm a')} - {format(endDate, 'h:mm a')}
            </span>
          </div>
          
          {(event.location || event.venue_name) && (
            <div className="flex items-center gap-2 text-sm">
              <MapPin className="h-4 w-4 text-muted-foreground" />
              <span className="truncate">
                {event.venue_name && event.location 
                  ? `${event.venue_name}, ${event.location}`
                  : event.venue_name || event.location
                }
              </span>
            </div>
          )}
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-1">
              <Users className="h-4 w-4" />
              <span>
                {event.attendee_count}
                {event.max_attendees && `/${event.max_attendees}`} attending
              </span>
            </div>
            
            <div className="flex items-center gap-1">
              <DollarSign className="h-4 w-4" />
              <span>{formatPrice(event.price_cents)}</span>
            </div>
          </div>
        </div>

        {event.tags.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {event.tags.slice(0, 3).map((tag, index) => (
              <Badge 
                key={index} 
                variant="outline" 
                className="text-xs px-2 py-0.5"
              >
                {tag}
              </Badge>
            ))}
            {event.tags.length > 3 && (
              <Badge variant="outline" className="text-xs px-2 py-0.5">
                +{event.tags.length - 3} more
              </Badge>
            )}
          </div>
        )}
      </CardContent>

      <CardFooter className="flex gap-2">
        {!userRsvpStatus ? (
          <>
            <Button
              onClick={() => handleRsvp('going')}
              className="flex-1"
            >
              Going
            </Button>
            <Button
              onClick={() => handleRsvp('maybe')}
              variant="outline"
              className="flex-1"
            >
              Maybe
            </Button>
          </>
        ) : (
          <div className="flex gap-2 w-full">
            <Button
              onClick={() => handleRsvp('going')}
              variant={userRsvpStatus === 'going' ? 'default' : 'outline'}
              className="flex-1"
            >
              Going
            </Button>
            <Button
              onClick={() => handleRsvp('maybe')}
              variant={userRsvpStatus === 'maybe' ? 'default' : 'outline'}
              className="flex-1"
            >
              Maybe
            </Button>
            <Button
              onClick={() => handleRsvp('not_going')}
              variant={userRsvpStatus === 'not_going' ? 'default' : 'outline'}
              className="flex-1"
            >
              Can't Go
            </Button>
          </div>
        )}
      </CardFooter>
    </Card>
  );
};