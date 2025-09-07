import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { usePresence } from '@/hooks/usePresence';
import { MainLayout } from '@/components/layout/MainLayout';
import { EnhancedFeed } from '@/components/feed/EnhancedFeed';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Heart, Users, TrendingUp, MessageCircle, Video, Eye, Star } from 'lucide-react';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';

const Index = () => {
  const { user } = useAuth();
  const { updatePresence } = usePresence();
  const [userProfile, setUserProfile] = useState(null);
  const [liveStreams, setLiveStreams] = useState([]);
  const [featuredCreators, setFeaturedCreators] = useState([]);

  useEffect(() => {
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
      const { data } = await supabase
        .from('live_streams')
        .select(`
          *,
          profiles!creator_id(display_name, username, profile_image_url)
        `)
        .eq('is_live', true)
        .limit(3);
      
      setLiveStreams(data || []);
    };

    const fetchFeaturedCreators = async () => {
      const { data } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_category', 'creator')
        .limit(4);
      
      setFeaturedCreators(data || []);
    };

    if (user) {
      fetchUserProfile();
      fetchLiveStreams();
      fetchFeaturedCreators();
      updatePresence('online');
    }
  }, [user, updatePresence]);

  return (
    <MainLayout>
      <div className="container max-w-6xl mx-auto px-4 space-y-6">
        {/* Welcome Header */}
        <div className="text-center space-y-2 py-6">
          <h1 className="text-4xl font-bold gradient-text">Welcome to ConnectsBuddy</h1>
          <p className="text-muted-foreground">Your premium social connection platform</p>
          {userProfile?.user_category && (
            <Badge className="mt-2">
              {userProfile.user_category === 'hookup' && '💕 Ready to Connect'}
              {userProfile.user_category === 'creator' && '🎨 Content Creator'}
              {userProfile.user_category === 'viewer' && '👀 Exploring Content'}
            </Badge>
          )}
        </div>

        {/* Quick Action Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Link to="/hookup">
            <Card className="hover:shadow-lg transition-all duration-300 cursor-pointer group">
              <CardHeader className="text-center">
                <div className="w-12 h-12 mx-auto bg-gradient-to-br from-pink-500 to-rose-600 rounded-full flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                  <Heart className="h-6 w-6 text-white" />
                </div>
                <CardTitle className="text-lg">Find Connections</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground text-center">
                  Discover amazing people nearby who share your interests
                </p>
              </CardContent>
            </Card>
          </Link>

          <Link to="/creators">
            <Card className="hover:shadow-lg transition-all duration-300 cursor-pointer group">
              <CardHeader className="text-center">
                <div className="w-12 h-12 mx-auto bg-gradient-to-br from-purple-500 to-indigo-600 rounded-full flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                  <Star className="h-6 w-6 text-white" />
                </div>
                <CardTitle className="text-lg">Premium Content</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground text-center">
                  Explore exclusive content from verified creators
                </p>
              </CardContent>
            </Card>
          </Link>

          <Link to="/live">
            <Card className="hover:shadow-lg transition-all duration-300 cursor-pointer group">
              <CardHeader className="text-center">
                <div className="w-12 h-12 mx-auto bg-gradient-to-br from-red-500 to-orange-600 rounded-full flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                  <Video className="h-6 w-6 text-white" />
                </div>
                <CardTitle className="text-lg">Live Streams</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground text-center">
                  Join live interactions with creators in real-time
                </p>
              </CardContent>
            </Card>
          </Link>
        </div>

        {/* Live Streams Section */}
        {liveStreams.length > 0 && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold">🔴 Live Now</h2>
              <Link to="/live">
                <Button variant="outline">View All</Button>
              </Link>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {liveStreams.slice(0, 3).map((stream) => (
                <Link key={stream.id} to={`/live/${stream.id}`}>
                  <Card className="overflow-hidden hover:shadow-lg transition-shadow group">
                    <div className="relative aspect-video">
                      <img 
                        src={stream.thumbnail_url || '/placeholder.svg'} 
                        alt={stream.title}
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute top-2 left-2">
                        <Badge className="bg-red-500">
                          <div className="w-2 h-2 bg-white rounded-full animate-pulse mr-1"></div>
                          LIVE
                        </Badge>
                      </div>
                      <div className="absolute top-2 right-2">
                        <Badge className="bg-black/50">
                          <Eye className="h-3 w-3 mr-1" />
                          {stream.viewer_count}
                        </Badge>
                      </div>
                    </div>
                    <CardContent className="p-3">
                      <h3 className="font-medium text-sm line-clamp-1">{stream.title}</h3>
                      <p className="text-xs text-muted-foreground">
                        {stream.profiles?.display_name}
                      </p>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Featured Creators */}
        {featuredCreators.length > 0 && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold">⭐ Featured Creators</h2>
              <Link to="/creators">
                <Button variant="outline">View All</Button>
              </Link>
            </div>
            
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {featuredCreators.slice(0, 4).map((creator) => (
                <Link key={creator.id} to={`/${creator.username}`}>
                  <Card className="text-center hover:shadow-lg transition-shadow">
                    <CardContent className="p-4">
                      <Avatar className="h-16 w-16 mx-auto mb-3">
                        <AvatarImage src={creator.profile_image_url} />
                        <AvatarFallback>{creator.display_name?.[0]}</AvatarFallback>
                      </Avatar>
                      <h3 className="font-medium text-sm line-clamp-1">{creator.display_name}</h3>
                      <p className="text-xs text-muted-foreground">@{creator.username}</p>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Main Feed */}
        <div className="space-y-4">
          <h2 className="text-2xl font-bold">Latest Posts</h2>
          <EnhancedFeed />
        </div>
      </div>
    </MainLayout>
  );
};

export default Index;
