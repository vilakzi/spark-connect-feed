import { MainLayout } from '@/components/layout/MainLayout';
import { EventCard } from '@/components/social/EventCard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { 
  Plus, 
  Search, 
  Filter,
  Calendar,
  Clock,
  MapPin,
  Users
} from 'lucide-react';
import { useEvents } from '@/hooks/useEvents';
import { useState } from 'react';

const Events = () => {
  const { 
    events, 
    userEvents,
    attendingEvents,
    loading,
    rsvpEvent 
  } = useEvents();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState<string | null>(null);

  const eventTypes = [
    'meetup', 'party', 'workshop', 'conference', 
    'date', 'group_date', 'virtual', 'stream_event'
  ];

  const filteredEvents = events.filter(event => {
    const matchesSearch = event.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         event.description?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = !selectedType || event.event_type === selectedType;
    return matchesSearch && matchesType;
  });

  // Mock RSVP status - in real app, this would come from a separate query
  const getUserRsvpStatus = (eventId: string) => {
    const attending = attendingEvents.find(e => e.id === eventId);
    return attending ? 'going' : null;
  };

  if (loading) {
    return (
      <MainLayout>
        <div className="container mx-auto p-6">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-muted-foreground">Loading events...</p>
            </div>
          </div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="container mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Events</h1>
            <p className="text-muted-foreground mt-2">
              Discover events and meetups happening around you
            </p>
          </div>
          <Button className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            Create Event
          </Button>
        </div>

        {/* Search and Filter */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Search events..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <Button variant="outline" className="flex items-center gap-2">
            <Filter className="h-4 w-4" />
            Filter
          </Button>
        </div>

        {/* Event Types */}
        <div className="flex flex-wrap gap-2">
          <Badge 
            variant={selectedType === null ? "default" : "outline"}
            className="cursor-pointer"
            onClick={() => setSelectedType(null)}
          >
            All Types
          </Badge>
          {eventTypes.map(type => (
            <Badge
              key={type}
              variant={selectedType === type ? "default" : "outline"}
              className="cursor-pointer capitalize"
              onClick={() => setSelectedType(type)}
            >
              {type.replace('_', ' ')}
            </Badge>
          ))}
        </div>

        {/* Tabs */}
        <Tabs defaultValue="discover" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4 max-w-lg">
            <TabsTrigger value="discover" className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              <span className="hidden sm:inline">Discover</span>
            </TabsTrigger>
            <TabsTrigger value="attending" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              <span className="hidden sm:inline">Going</span>
            </TabsTrigger>
            <TabsTrigger value="organizing" className="flex items-center gap-2">
              <Clock className="h-4 w-4" />
              <span className="hidden sm:inline">My Events</span>
            </TabsTrigger>
            <TabsTrigger value="nearby" className="flex items-center gap-2">
              <MapPin className="h-4 w-4" />
              <span className="hidden sm:inline">Nearby</span>
            </TabsTrigger>
          </TabsList>

          {/* Discover Tab */}
          <TabsContent value="discover" className="space-y-6">
            {filteredEvents.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredEvents.map(event => (
                  <EventCard
                    key={event.id}
                    event={event}
                    userRsvpStatus={getUserRsvpStatus(event.id)}
                    onRsvp={rsvpEvent}
                  />
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <Calendar className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-50" />
                <h3 className="text-lg font-medium mb-2">No events found</h3>
                <p className="text-muted-foreground mb-4">
                  Try adjusting your search or filters
                </p>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Create the first event
                </Button>
              </div>
            )}
          </TabsContent>

          {/* Attending Tab */}
          <TabsContent value="attending" className="space-y-6">
            {attendingEvents.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {attendingEvents.map(event => (
                  <EventCard
                    key={event.id}
                    event={event}
                    userRsvpStatus="going"
                    onRsvp={rsvpEvent}
                  />
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <Users className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-50" />
                <h3 className="text-lg font-medium mb-2">No events yet</h3>
                <p className="text-muted-foreground mb-4">
                  RSVP to events to see them here
                </p>
                <Button onClick={() => setSearchTerm('')}>
                  <Calendar className="h-4 w-4 mr-2" />
                  Discover Events
                </Button>
              </div>
            )}
          </TabsContent>

          {/* Organizing Tab */}
          <TabsContent value="organizing" className="space-y-6">
            {userEvents.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {userEvents.map(event => (
                  <EventCard
                    key={event.id}
                    event={event}
                    onRsvp={rsvpEvent}
                  />
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <Clock className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-50" />
                <h3 className="text-lg font-medium mb-2">No events created yet</h3>
                <p className="text-muted-foreground mb-4">
                  Create your first event to bring people together
                </p>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Event
                </Button>
              </div>
            )}
          </TabsContent>

          {/* Nearby Tab */}
          <TabsContent value="nearby" className="space-y-6">
            <div className="text-center py-12">
              <MapPin className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-50" />
              <h3 className="text-lg font-medium mb-2">Location-based Events</h3>
              <p className="text-muted-foreground">
                Coming soon - we'll show events near your location
              </p>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </MainLayout>
  );
};

export default Events;