import { useState } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Heart, Users, Video, DollarSign } from 'lucide-react';
import { Link } from 'react-router-dom';

const CreatorMarketplace = () => {
  const [creators] = useState([
    {
      id: '1',
      username: 'prettykat',
      displayName: 'Kat ❤️',
      avatar: '/placeholder.svg',
      isLive: true,
      followers: 15420,
      price: 19.99,
      category: 'Premium Content',
      bio: 'Your favorite girl next door 💕',
      isVerified: true
    },
    {
      id: '2',
      username: 'misssunshine',
      displayName: 'Sunshine ☀️',
      avatar: '/placeholder.svg',
      isLive: false,
      followers: 8930,
      price: 24.99,
      category: 'Exclusive Videos',
      bio: 'Bringing sunshine to your day ✨',
      isVerified: true
    }
  ]);

  return (
    <MainLayout>
      <div className="container max-w-4xl mx-auto px-4 space-y-6">
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold gradient-text">Creator Marketplace</h1>
          <p className="text-muted-foreground">Discover amazing content creators</p>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {creators.map((creator) => (
            <Card key={creator.id} className="overflow-hidden hover:shadow-lg transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-start space-x-3">
                  <div className="relative">
                    <Avatar className="h-12 w-12">
                      <AvatarImage src={creator.avatar} />
                      <AvatarFallback>{creator.displayName[0]}</AvatarFallback>
                    </Avatar>
                    {creator.isLive && (
                      <div className="absolute -top-1 -right-1">
                        <div className="flex items-center space-x-1 bg-red-500 text-white text-xs px-2 py-1 rounded-full">
                          <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
                          <span>LIVE</span>
                        </div>
                      </div>
                    )}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-1">
                      <CardTitle className="text-sm truncate">{creator.displayName}</CardTitle>
                      {creator.isVerified && (
                        <Badge variant="secondary" className="text-xs">✓</Badge>
                      )}
                    </div>
                    <CardDescription className="text-xs">@{creator.username}</CardDescription>
                  </div>
                </div>
              </CardHeader>
              
              <CardContent className="space-y-3">
                <p className="text-sm text-muted-foreground line-clamp-2">{creator.bio}</p>
                
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <div className="flex items-center space-x-1">
                    <Users className="h-3 w-3" />
                    <span>{creator.followers.toLocaleString()}</span>
                  </div>
                  <Badge variant="outline" className="text-xs">{creator.category}</Badge>
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-1 text-primary font-semibold">
                    <DollarSign className="h-4 w-4" />
                    <span>${creator.price}/month</span>
                  </div>
                  
                  <div className="flex space-x-1">
                    <Button size="sm" variant="outline">
                      <Heart className="h-4 w-4" />
                    </Button>
                    
                    <Link to={`/creator/${creator.username}`}>
                      <Button size="sm">
                        {creator.isLive ? (
                          <>
                            <Video className="h-4 w-4 mr-1" />
                            Watch Live
                          </>
                        ) : (
                          'View Profile'
                        )}
                      </Button>
                    </Link>
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

export default CreatorMarketplace;