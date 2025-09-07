import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { MainLayout } from '@/components/layout/MainLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Heart, Share, Users, Image, Video, MessageCircle, MoreHorizontal } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';

const UserProfile = () => {
  const { username } = useParams();
  const { user } = useAuth();
  const [profile, setProfile] = useState(null);
  const [isOwnProfile, setIsOwnProfile] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProfile = async () => {
      if (!username) return;

      try {
        // First try to get profile by username
        const { data: profileData, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('username', username)
          .single();

        if (error) {
          console.error('Error fetching profile:', error);
          return;
        }

        setProfile(profileData);
        setIsOwnProfile(user?.id === profileData.user_id);
      } catch (error) {
        console.error('Error:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [username, user?.id]);

  if (loading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </MainLayout>
    );
  }

  if (!profile) {
    return (
      <MainLayout>
        <div className="container max-w-4xl mx-auto px-4 py-8 text-center">
          <h1 className="text-2xl font-bold">Profile not found</h1>
          <p className="text-muted-foreground mt-2">The user you're looking for doesn't exist.</p>
        </div>
      </MainLayout>
    );
  }

  const shareProfile = () => {
    const url = `${window.location.origin}/${profile.username}`;
    if (navigator.share) {
      navigator.share({
        title: `${profile.display_name} on ConnectsBuddy`,
        text: `Check out ${profile.display_name}'s profile on ConnectsBuddy!`,
        url: url
      });
    } else {
      navigator.clipboard.writeText(url);
      // Show toast notification
    }
  };

  return (
    <MainLayout>
      <div className="container max-w-4xl mx-auto px-4 space-y-6">
        {/* Profile Header */}
        <Card>
          <CardContent className="p-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-4 sm:space-y-0 sm:space-x-6">
              <Avatar className="h-24 w-24">
                <AvatarImage src={profile.profile_image_url} />
                <AvatarFallback className="text-lg">
                  {profile.display_name?.[0] || 'U'}
                </AvatarFallback>
              </Avatar>
              
              <div className="flex-1 space-y-2">
                <div>
                  <h1 className="text-2xl font-bold">{profile.display_name}</h1>
                  <p className="text-muted-foreground">@{profile.username}</p>
                  {profile.user_category && (
                    <Badge className="mt-1">
                      {profile.user_category === 'hookup' && '💕 Looking to Connect'}
                      {profile.user_category === 'creator' && '🎨 Content Creator'}
                      {profile.user_category === 'viewer' && '👀 Content Enthusiast'}
                    </Badge>
                  )}
                </div>
                
                <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                  <div className="flex items-center space-x-1">
                    <Users className="h-4 w-4" />
                    <span>1.2K followers</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Heart className="h-4 w-4" />
                    <span>15.8K likes</span>
                  </div>
                  {profile.location && (
                    <span>📍 {profile.location}</span>
                  )}
                </div>
                
                {profile.bio && (
                  <p className="text-sm">{profile.bio}</p>
                )}
              </div>
              
              <div className="flex space-x-2">
                <Button variant="outline" onClick={shareProfile}>
                  <Share className="h-4 w-4" />
                </Button>
                
                {isOwnProfile ? (
                  <Button>Edit Profile</Button>
                ) : (
                  <>
                    <Button variant="outline">
                      <MessageCircle className="h-4 w-4 mr-1" />
                      Message
                    </Button>
                    <Button>
                      <Heart className="h-4 w-4 mr-1" />
                      Follow
                    </Button>
                  </>
                )}
                
                <Button variant="outline" size="icon">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Referral Link */}
        {isOwnProfile && profile.referral_code && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Your Referral Link</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center space-x-2">
                <code className="flex-1 p-2 bg-muted rounded text-sm">
                  {window.location.origin}/auth?ref={profile.referral_code}
                </code>
                <Button 
                  variant="outline" 
                  onClick={() => navigator.clipboard.writeText(`${window.location.origin}/auth?ref=${profile.referral_code}`)}
                >
                  Copy
                </Button>
                <Button 
                  variant="outline"
                  onClick={() => {
                    if (navigator.share) {
                      navigator.share({
                        title: 'Join ConnectsBuddy',
                        text: 'Join me on ConnectsBuddy!',
                        url: `${window.location.origin}/auth?ref=${profile.referral_code}`
                      });
                    }
                  }}
                >
                  Share
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Content Tabs */}
        <Tabs defaultValue="posts" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="posts">Posts</TabsTrigger>
            <TabsTrigger value="media">Media</TabsTrigger>
            <TabsTrigger value="likes">Likes</TabsTrigger>
            <TabsTrigger value="about">About</TabsTrigger>
          </TabsList>
          
          <TabsContent value="posts" className="space-y-4">
            <div className="text-center py-8 text-muted-foreground">
              <Image className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No posts yet</p>
              {isOwnProfile && (
                <Button className="mt-4">Create your first post</Button>
              )}
            </div>
          </TabsContent>
          
          <TabsContent value="media" className="space-y-4">
            <div className="text-center py-8 text-muted-foreground">
              <Video className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No media content</p>
            </div>
          </TabsContent>
          
          <TabsContent value="likes" className="space-y-4">
            <div className="text-center py-8 text-muted-foreground">
              <Heart className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No liked posts</p>
            </div>
          </TabsContent>
          
          <TabsContent value="about" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>About {profile.display_name}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {profile.bio && <p>{profile.bio}</p>}
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-medium">Username:</span> @{profile.username}
                  </div>
                  {profile.age && (
                    <div>
                      <span className="font-medium">Age:</span> {profile.age}
                    </div>
                  )}
                  {profile.location && (
                    <div>
                      <span className="font-medium">Location:</span> {profile.location}
                    </div>
                  )}
                  <div>
                    <span className="font-medium">Joined:</span> {new Date(profile.created_at).toLocaleDateString()}
                  </div>
                </div>
                
                {profile.interests && profile.interests.length > 0 && (
                  <div>
                    <span className="font-medium block mb-2">Interests:</span>
                    <div className="flex flex-wrap gap-2">
                      {profile.interests.map((interest, index) => (
                        <Badge key={index} variant="secondary">{interest}</Badge>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </MainLayout>
  );
};

export default UserProfile;