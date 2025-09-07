import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { MainLayout } from '@/components/layout/MainLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Heart, Gift, Users, Send, Share, MoreVertical } from 'lucide-react';

const LiveStream = () => {
  const { streamId } = useParams();
  const [message, setMessage] = useState('');
  const [isLiked, setIsLiked] = useState(false);
  
  const [stream] = useState({
    id: streamId,
    title: 'Chill Evening Chat 💕',
    creator: {
      username: 'prettykat',
      displayName: 'Kat ❤️',
      avatar: '/placeholder.svg',
      isVerified: true
    },
    viewers: 1234,
    likes: 567,
    duration: '1:23:45',
    category: 'Just Chatting'
  });

  const [chatMessages] = useState([
    {
      id: '1',
      user: 'user123',
      message: 'Hey beautiful! 😍',
      timestamp: '2:34',
      isVip: false
    },
    {
      id: '2',
      user: 'premium_fan',
      message: 'Love your content! ❤️',
      timestamp: '2:35',
      isVip: true
    },
    {
      id: '3',
      user: 'supporter',
      message: 'Just sent a tip! 💰',
      timestamp: '2:36',
      isVip: false,
      isTip: true
    }
  ]);

  const handleSendMessage = () => {
    if (message.trim()) {
      // Add message logic here
      setMessage('');
    }
  };

  return (
    <MainLayout showBottomNav={false}>
      <div className="container max-w-6xl mx-auto px-4 space-y-4">
        <div className="grid lg:grid-cols-3 gap-4">
          {/* Main Stream Area */}
          <div className="lg:col-span-2 space-y-4">
            {/* Video Player */}
            <div className="relative aspect-video bg-black rounded-lg overflow-hidden">
              <div className="absolute inset-0 flex items-center justify-center text-white">
                <div className="text-center">
                  <div className="w-16 h-16 mx-auto mb-4 bg-white/20 rounded-full flex items-center justify-center">
                    <div className="w-4 h-4 bg-red-500 rounded-full animate-pulse"></div>
                  </div>
                  <p className="text-lg font-medium">Live Stream</p>
                  <p className="text-sm opacity-80">Video player would be integrated here</p>
                </div>
              </div>
              
              {/* Stream Overlay */}
              <div className="absolute top-4 left-4 flex items-center space-x-2">
                <Badge className="bg-red-500">
                  <div className="w-2 h-2 bg-white rounded-full animate-pulse mr-1"></div>
                  LIVE
                </Badge>
                <Badge className="bg-black/50">
                  <Users className="h-3 w-3 mr-1" />
                  {stream.viewers}
                </Badge>
              </div>
              
              <div className="absolute top-4 right-4 flex space-x-2">
                <Button size="sm" variant="ghost" className="bg-black/50 text-white hover:bg-black/70">
                  <Share className="h-4 w-4" />
                </Button>
                <Button size="sm" variant="ghost" className="bg-black/50 text-white hover:bg-black/70">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </div>
              
              <div className="absolute bottom-4 left-4 right-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <Avatar className="h-10 w-10 border-2 border-white">
                      <AvatarImage src={stream.creator.avatar} />
                      <AvatarFallback>{stream.creator.displayName[0]}</AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="flex items-center space-x-1">
                        <p className="text-white font-medium">{stream.creator.displayName}</p>
                        {stream.creator.isVerified && <Badge className="text-xs">✓</Badge>}
                      </div>
                      <p className="text-white/80 text-sm">{stream.title}</p>
                    </div>
                  </div>
                  
                  <div className="flex space-x-2">
                    <Button 
                      size="sm" 
                      variant="ghost" 
                      className={`text-white ${isLiked ? 'text-red-500' : ''}`}
                      onClick={() => setIsLiked(!isLiked)}
                    >
                      <Heart className={`h-4 w-4 ${isLiked ? 'fill-current' : ''}`} />
                      <span className="ml-1">{stream.likes}</span>
                    </Button>
                    <Button size="sm" className="bg-primary">
                      <Gift className="h-4 w-4 mr-1" />
                      Tip
                    </Button>
                  </div>
                </div>
              </div>
            </div>

            {/* Stream Info */}
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-lg font-semibold">{stream.title}</h2>
                    <div className="flex items-center space-x-4 text-sm text-muted-foreground mt-1">
                      <span>Duration: {stream.duration}</span>
                      <span>Category: {stream.category}</span>
                      <span>{stream.viewers} viewers</span>
                    </div>
                  </div>
                  <Button>Subscribe</Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Chat Sidebar */}
          <div className="space-y-4">
            <Card className="h-96 flex flex-col">
              <CardContent className="p-4 flex-1 flex flex-col">
                <h3 className="font-semibold mb-3">Live Chat</h3>
                
                {/* Chat Messages */}
                <div className="flex-1 space-y-2 overflow-y-auto">
                  {chatMessages.map((msg) => (
                    <div key={msg.id} className="text-sm">
                      <div className="flex items-start space-x-2">
                        <span className={`font-medium ${msg.isVip ? 'text-yellow-500' : 'text-primary'}`}>
                          {msg.user}
                        </span>
                        <span className="text-xs text-muted-foreground">{msg.timestamp}</span>
                      </div>
                      <p className={`ml-0 ${msg.isTip ? 'text-green-500 font-medium' : ''}`}>
                        {msg.message}
                      </p>
                    </div>
                  ))}
                </div>
                
                {/* Chat Input */}
                <div className="flex space-x-2 mt-3">
                  <Input
                    placeholder="Type a message..."
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                    className="flex-1"
                  />
                  <Button size="sm" onClick={handleSendMessage}>
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
            
            {/* Quick Actions */}
            <Card>
              <CardContent className="p-4 space-y-2">
                <h4 className="font-medium">Quick Actions</h4>
                <div className="grid grid-cols-2 gap-2">
                  <Button variant="outline" size="sm">
                    <Heart className="h-4 w-4 mr-1" />
                    Like
                  </Button>
                  <Button variant="outline" size="sm">
                    <Gift className="h-4 w-4 mr-1" />
                    Tip $5
                  </Button>
                  <Button variant="outline" size="sm">
                    <Gift className="h-4 w-4 mr-1" />
                    Tip $10
                  </Button>
                  <Button variant="outline" size="sm">
                    <Gift className="h-4 w-4 mr-1" />
                    Tip $25
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </MainLayout>
  );
};

export default LiveStream;