import { useState } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Users, Heart, Gift } from 'lucide-react';
import { Link } from 'react-router-dom';

const LiveCamLounge = () => {
  const [liveStreams] = useState([
    {
      id: '1',
      streamId: 'stream-1',
      creator: {
        username: 'prettykat',
        displayName: 'Kat ❤️',
        avatar: '/placeholder.svg'
      },
      title: 'Chill Evening Chat 💕',
      viewers: 1234,
      thumbnail: '/placeholder.svg',
      category: 'Just Chatting',
      isPrivate: false
    },
    {
      id: '2',
      streamId: 'stream-2',
      creator: {
        username: 'misssunshine',
        displayName: 'Sunshine ☀️',
        avatar: '/placeholder.svg'
      },
      title: 'Morning Yoga Session ✨',
      viewers: 892,
      thumbnail: '/placeholder.svg',
      category: 'Lifestyle',
      isPrivate: true
    }
  ]);

  return (
    <MainLayout>
      <div className="container max-w-6xl mx-auto px-4 space-y-6">
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold gradient-text">Live Cam Lounge</h1>
          <p className="text-muted-foreground">Connect with creators in real-time</p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {liveStreams.map((stream) => (
            <Card key={stream.id} className="overflow-hidden hover:shadow-lg transition-shadow group">
              <div className="relative aspect-video">
                <img 
                  src={stream.thumbnail} 
                  alt={stream.title}
                  className="w-full h-full object-cover"
                />
                
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                
                <div className="absolute top-2 left-2">
                  <div className="flex items-center space-x-1 bg-red-500 text-white text-xs px-2 py-1 rounded">
                    <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
                    <span>LIVE</span>
                  </div>
                </div>
                
                <div className="absolute top-2 right-2 flex space-x-1">
                  <div className="flex items-center space-x-1 bg-black/50 text-white text-xs px-2 py-1 rounded">
                    <Users className="h-3 w-3" />
                    <span>{stream.viewers}</span>
                  </div>
                  {stream.isPrivate && (
                    <Badge className="bg-yellow-500 text-black text-xs">VIP</Badge>
                  )}
                </div>
                
                <div className="absolute bottom-2 left-2 right-2">
                  <div className="flex items-center space-x-2">
                    <Avatar className="h-8 w-8 border-2 border-white">
                      <AvatarImage src={stream.creator.avatar} />
                      <AvatarFallback>{stream.creator.displayName[0]}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="text-white text-sm font-medium truncate">{stream.creator.displayName}</p>
                      <p className="text-white/80 text-xs truncate">{stream.title}</p>
                    </div>
                  </div>
                </div>
                
                <Link to={`/live/${stream.streamId}`}>
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                    <Button 
                      className="opacity-0 group-hover:opacity-100 transition-opacity"
                      size="sm"
                    >
                      Join Stream
                    </Button>
                  </div>
                </Link>
              </div>
              
              <CardContent className="p-3">
                <div className="flex items-center justify-between">
                  <Badge variant="outline" className="text-xs">{stream.category}</Badge>
                  <div className="flex space-x-1">
                    <Button size="sm" variant="ghost">
                      <Heart className="h-4 w-4" />
                    </Button>
                    <Button size="sm" variant="ghost">
                      <Gift className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </MainLayout>
  );
};

export default LiveCamLounge;