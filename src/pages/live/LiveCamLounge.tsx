import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { MainLayout } from '@/components/layout/MainLayout';
import { LiveStreamInterface } from '@/components/live/LiveStreamInterface';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { 
  Video, 
  Users, 
  Search, 
  Filter, 
  Heart, 
  Gift, 
  Eye,
  Clock,
  Star,
  Plus
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';

const LiveCamLounge = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [liveStreams, setLiveStreams] = useState([]);
  const [featuredStreams, setFeaturedStreams] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [showBroadcastDialog, setShowBroadcastDialog] = useState(false);
  const [userProfile, setUserProfile] = useState(null);

  useEffect(() => {
    fetchLiveStreams();
    fetchUserProfile();
  }, []);

  const fetchUserProfile = async () => {
    if (!user) return;
    
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', user.id)
      .single();
    
    setUserProfile(data);
  };

  const fetchLiveStreams = async () => {
    // Mock live streams - in real implementation, fetch from database
    const mockStreams = [
      {
        id: '1',
        streamId: 'stream-1',
        creator: {
          id: '1',
          username: 'prettykat',
          displayName: 'Kat ❤️',
          avatar: '/placeholder.svg',
          isVerified: true
        },
        title: 'Chill Evening Chat 💕',
        viewers: 1234,
        thumbnail: '/placeholder.svg',
        category: 'Just Chatting',
        isPrivate: false,
        duration: '1:23:45',
        tags: ['chill', 'chat', 'music']
      },
      {
        id: '2',
        streamId: 'stream-2',
        creator: {
          id: '2',
          username: 'misssunshine',
          displayName: 'Sunshine ☀️',
          avatar: '/placeholder.svg',
          isVerified: true
        },
        title: 'Morning Yoga Session ✨',
        viewers: 892,
        thumbnail: '/placeholder.svg',
        category: 'Fitness',
        isPrivate: true,
        duration: '0:45:12',
        tags: ['yoga', 'fitness', 'morning']
      },
      {
        id: '3',
        streamId: 'stream-3',
        creator: {
          id: '3',
          username: 'gamegirlx',
          displayName: 'GameGirl X',
          avatar: '/placeholder.svg',
          isVerified: false
        },
        title: 'Late Night Gaming 🎮',
        viewers: 567,
        thumbnail: '/placeholder.svg',
        category: 'Gaming',
        isPrivate: false,
        duration: '2:15:30',
        tags: ['gaming', 'fps', 'competitive']
      }
    ];

    setLiveStreams(mockStreams);
    setFeaturedStreams(mockStreams.slice(0, 2));
  };

  const filteredStreams = liveStreams.filter(stream => {
    const matchesSearch = stream.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         stream.creator.displayName.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || stream.category.toLowerCase() === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const handleStartBroadcast = () => {
    if (userProfile?.user_category !== 'creator') {
      // Show upgrade prompt
      return;
    }
    setShowBroadcastDialog(true);
  };

  const startNewStream = () => {
    setShowBroadcastDialog(false);
    navigate('/live/broadcast');
  };

  return (
    <MainLayout>
      <div className="container max-w-7xl mx-auto px-4 space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between space-y-4 sm:space-y-0">
          <div>
            <h1 className="text-3xl font-bold gradient-text">Live Cam Lounge</h1>
            <p className="text-muted-foreground">Connect with creators in real-time</p>
          </div>
          
          <Dialog open={showBroadcastDialog} onOpenChange={setShowBroadcastDialog}>
            <DialogTrigger asChild>
              <Button onClick={handleStartBroadcast} className="bg-red-500 hover:bg-red-600">
                <Video className="h-4 w-4 mr-2" />
                Go Live
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Start Your Live Stream</DialogTitle>
                <DialogDescription>
                  Ready to go live? Make sure you have good lighting and a stable internet connection.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="text-sm text-muted-foreground">
                  <p>Before going live:</p>
                  <ul className="list-disc list-inside space-y-1 mt-2">
                    <li>Check your camera and microphone</li>
                    <li>Ensure good lighting</li>
                    <li>Have a stable internet connection</li>
                    <li>Set your stream title and category</li>
                  </ul>
                </div>
                <div className="flex space-x-2">
                  <Button onClick={startNewStream} className="flex-1">
                    Start Broadcasting
                  </Button>
                  <Button variant="outline" onClick={() => setShowBroadcastDialog(false)}>
                    Cancel
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Search and Filters */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search streams or creators..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          
          <Tabs value={selectedCategory} onValueChange={setSelectedCategory}>
            <TabsList>
              <TabsTrigger value="all">All</TabsTrigger>
              <TabsTrigger value="just chatting">Chat</TabsTrigger>
              <TabsTrigger value="fitness">Fitness</TabsTrigger>
              <TabsTrigger value="gaming">Gaming</TabsTrigger>
              <TabsTrigger value="music">Music</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        {/* Featured Streams */}
        {featuredStreams.length > 0 && (
          <div className="space-y-4">
            <h2 className="text-xl font-bold">🌟 Featured Live</h2>
            <div className="grid gap-4 md:grid-cols-2">
              {featuredStreams.map((stream) => (
                <Link key={stream.id} to={`/live/${stream.streamId}`}>
                  <Card className="overflow-hidden hover:shadow-lg transition-shadow group">
                    <div className="relative aspect-video">
                      <img 
                        src={stream.thumbnail} 
                        alt={stream.title}
                        className="w-full h-full object-cover"
                      />
                      
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                      
                      <div className="absolute top-3 left-3 flex items-center space-x-2">
                        <Badge className="bg-red-500">
                          <div className="w-2 h-2 bg-white rounded-full animate-pulse mr-1"></div>
                          LIVE
                        </Badge>
                        <Badge className="bg-black/50">
                          <Clock className="h-3 w-3 mr-1" />
                          {stream.duration}
                        </Badge>
                      </div>
                      
                      <div className="absolute top-3 right-3 flex space-x-1">
                        <Badge className="bg-black/50">
                          <Users className="h-3 w-3 mr-1" />
                          {stream.viewers.toLocaleString()}
                        </Badge>
                        {stream.isPrivate && (
                          <Badge className="bg-yellow-500 text-black">VIP</Badge>
                        )}
                      </div>
                      
                      <div className="absolute bottom-3 left-3 right-3">
                        <div className="flex items-center space-x-3">
                          <Avatar className="h-10 w-10 border-2 border-white">
                            <AvatarImage src={stream.creator.avatar} />
                            <AvatarFallback>{stream.creator.displayName[0]}</AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center space-x-1">
                              <p className="text-white font-medium truncate">{stream.creator.displayName}</p>
                              {stream.creator.isVerified && (
                                <Badge variant="secondary" className="text-xs">✓</Badge>
                              )}
                            </div>
                            <p className="text-white/80 text-sm truncate">{stream.title}</p>
                          </div>
                        </div>
                      </div>
                      
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                        <Button 
                          className="opacity-0 group-hover:opacity-100 transition-opacity"
                          size="sm"
                        >
                          Join Stream
                        </Button>
                      </div>
                    </div>
                  </Card>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* All Live Streams */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold">All Live Streams</h2>
            <Badge variant="outline">{filteredStreams.length} live</Badge>
          </div>
          
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {filteredStreams.map((stream) => (
              <Link key={stream.id} to={`/live/${stream.streamId}`}>
                <Card className="overflow-hidden hover:shadow-lg transition-shadow group">
                  <div className="relative aspect-video">
                    <img 
                      src={stream.thumbnail} 
                      alt={stream.title}
                      className="w-full h-full object-cover"
                    />
                    
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                    
                    <div className="absolute top-2 left-2">
                      <Badge className="bg-red-500 text-xs">
                        <div className="w-1 h-1 bg-white rounded-full animate-pulse mr-1"></div>
                        LIVE
                      </Badge>
                    </div>
                    
                    <div className="absolute top-2 right-2 flex space-x-1">
                      <Badge className="bg-black/50 text-xs">
                        <Eye className="h-2 w-2 mr-1" />
                        {stream.viewers > 1000 ? `${(stream.viewers / 1000).toFixed(1)}k` : stream.viewers}
                      </Badge>
                      {stream.isPrivate && (
                        <Badge className="bg-yellow-500 text-black text-xs">VIP</Badge>
                      )}
                    </div>
                    
                    <div className="absolute bottom-2 left-2 right-2">
                      <div className="flex items-center space-x-2">
                        <Avatar className="h-6 w-6 border border-white">
                          <AvatarImage src={stream.creator.avatar} />
                          <AvatarFallback className="text-xs">{stream.creator.displayName[0]}</AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <p className="text-white text-xs font-medium truncate">{stream.creator.displayName}</p>
                          <p className="text-white/80 text-xs truncate">{stream.title}</p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                      <Button 
                        className="opacity-0 group-hover:opacity-100 transition-opacity"
                        size="sm"
                      >
                        Join
                      </Button>
                    </div>
                  </div>
                  
                  <CardContent className="p-3">
                    <div className="flex items-center justify-between">
                      <Badge variant="outline" className="text-xs">{stream.category}</Badge>
                      <div className="flex space-x-1">
                        <Button size="sm" variant="ghost" className="h-6 w-6 p-0">
                          <Heart className="h-3 w-3" />
                        </Button>
                        <Button size="sm" variant="ghost" className="h-6 w-6 p-0">
                          <Gift className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </div>

        {filteredStreams.length === 0 && (
          <div className="text-center py-12">
            <Video className="h-16 w-16 mx-auto mb-4 opacity-50" />
            <h3 className="text-lg font-medium">No live streams found</h3>
            <p className="text-muted-foreground mb-4">
              {searchQuery ? 'Try adjusting your search or filters' : 'No one is streaming right now'}
            </p>
            {userProfile?.user_category === 'creator' && (
              <Button onClick={handleStartBroadcast}>
                <Plus className="h-4 w-4 mr-2" />
                Start the first stream
              </Button>
            )}
          </div>
        )}
      </div>
    </MainLayout>
  );
};

export default LiveCamLounge;