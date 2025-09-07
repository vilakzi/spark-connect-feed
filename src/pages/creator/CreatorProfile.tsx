import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { MainLayout } from '@/components/layout/MainLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Heart, Share, DollarSign, Users, Video, Image, Lock } from 'lucide-react';

const CreatorProfile = () => {
  const { username } = useParams();
  const [isSubscribed, setIsSubscribed] = useState(false);
  
  const [creator] = useState({
    username: 'prettykat',
    displayName: 'Kat ❤️',
    avatar: '/placeholder.svg',
    coverImage: '/placeholder.svg',
    bio: 'Your favorite girl next door 💕 Premium content creator sharing exclusive photos, videos, and live streams. Subscribe for daily content!',
    followers: 15420,
    likes: 892340,
    isVerified: true,
    subscriptionPrice: 19.99,
    isLive: false,
    posts: 1247
  });

  const [content] = useState([
    {
      id: '1',
      type: 'image',
      title: 'Beach Day Vibes 🏖️',
      thumbnail: '/placeholder.svg',
      isPremium: true,
      likes: 234,
      comments: 56,
      price: 9.99
    },
    {
      id: '2',
      type: 'video',
      title: 'Morning Routine ✨',
      thumbnail: '/placeholder.svg',
      isPremium: false,
      likes: 456,
      comments: 89,
      duration: '05:24'
    }
  ]);

  return (
    <MainLayout>
      <div className="container max-w-4xl mx-auto px-4 space-y-6">
        {/* Cover Image */}
        <div className="relative h-48 rounded-lg overflow-hidden">
          <img 
            src={creator.coverImage} 
            alt="Cover" 
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
        </div>

        {/* Profile Header */}
        <div className="relative -mt-20 z-10">
          <div className="flex flex-col sm:flex-row items-start sm:items-end space-y-4 sm:space-y-0 sm:space-x-6">
            <Avatar className="h-32 w-32 border-4 border-background">
              <AvatarImage src={creator.avatar} />
              <AvatarFallback>{creator.displayName[0]}</AvatarFallback>
            </Avatar>
            
            <div className="flex-1 space-y-4">
              <div>
                <div className="flex items-center space-x-2">
                  <h1 className="text-2xl font-bold">{creator.displayName}</h1>
                  {creator.isVerified && <Badge>✓ Verified</Badge>}
                  {creator.isLive && <Badge className="bg-red-500">🔴 Live</Badge>}
                </div>
                <p className="text-muted-foreground">@{creator.username}</p>
              </div>
              
              <div className="flex items-center space-x-6 text-sm">
                <div className="flex items-center space-x-1">
                  <Users className="h-4 w-4" />
                  <span>{creator.followers.toLocaleString()} followers</span>
                </div>
                <div className="flex items-center space-x-1">
                  <Heart className="h-4 w-4" />
                  <span>{creator.likes.toLocaleString()} likes</span>
                </div>
                <div className="flex items-center space-x-1">
                  <Image className="h-4 w-4" />
                  <span>{creator.posts} posts</span>
                </div>
              </div>
            </div>
            
            <div className="flex space-x-2">
              <Button variant="outline">
                <Share className="h-4 w-4" />
              </Button>
              
              <Button 
                onClick={() => setIsSubscribed(!isSubscribed)}
                className={isSubscribed ? 'bg-green-600 hover:bg-green-700' : ''}
              >
                {isSubscribed ? (
                  'Subscribed ✓'
                ) : (
                  <>
                    <DollarSign className="h-4 w-4 mr-1" />
                    Subscribe ${creator.subscriptionPrice}/month
                  </>
                )}
              </Button>
            </div>
          </div>
          
          <p className="mt-4 text-muted-foreground">{creator.bio}</p>
        </div>

        {/* Content Tabs */}
        <Tabs defaultValue="posts" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="posts">Posts</TabsTrigger>
            <TabsTrigger value="lives">Live Streams</TabsTrigger>
            <TabsTrigger value="about">About</TabsTrigger>
          </TabsList>
          
          <TabsContent value="posts" className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {content.map((item) => (
                <Card key={item.id} className="overflow-hidden group cursor-pointer hover:shadow-lg transition-shadow">
                  <div className="relative aspect-square">
                    <img 
                      src={item.thumbnail} 
                      alt={item.title}
                      className="w-full h-full object-cover"
                    />
                    
                    {item.isPremium && (
                      <div className="absolute top-2 left-2">
                        <Badge className="bg-yellow-500 text-black">
                          <Lock className="h-3 w-3 mr-1" />
                          Premium
                        </Badge>
                      </div>
                    )}
                    
                    <div className="absolute top-2 right-2">
                      {item.type === 'video' ? (
                        <Badge className="bg-black/50">
                          <Video className="h-3 w-3 mr-1" />
                          {item.duration}
                        </Badge>
                      ) : (
                        <Badge className="bg-black/50">
                          <Image className="h-3 w-3" />
                        </Badge>
                      )}
                    </div>
                    
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors" />
                  </div>
                  
                  <CardContent className="p-3">
                    <h3 className="font-medium text-sm line-clamp-1">{item.title}</h3>
                    <div className="flex items-center justify-between mt-2 text-xs text-muted-foreground">
                      <div className="flex items-center space-x-2">
                        <span>{item.likes} likes</span>
                        <span>{item.comments} comments</span>
                      </div>
                      {item.isPremium && item.price && (
                        <span className="font-semibold text-primary">${item.price}</span>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
          
          <TabsContent value="lives" className="space-y-4">
            <div className="text-center py-8 text-muted-foreground">
              <Video className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No recent live streams</p>
            </div>
          </TabsContent>
          
          <TabsContent value="about" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>About {creator.displayName}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p>{creator.bio}</p>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-medium">Joined:</span> January 2024
                  </div>
                  <div>
                    <span className="font-medium">Location:</span> California, USA
                  </div>
                  <div>
                    <span className="font-medium">Languages:</span> English
                  </div>
                  <div>
                    <span className="font-medium">Response time:</span> Usually within an hour
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </MainLayout>
  );
};

export default CreatorProfile;