import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { MessageCircle, Star, Clock } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface Match {
  id: string;
  user1_id: string;
  user2_id: string;
  is_super_like: boolean;
  created_at: string;
  expires_at?: string;
  matched_user?: {
    id: string;
    display_name: string | null;
    profile_image_url: string | null;
    bio: string | null;
    age: number | null;
  };
}

interface MatchesListProps {
  onStartChat?: (matchId: string) => void;
}

export const MatchesList = ({ onStartChat }: MatchesListProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    const fetchMatches = async () => {
      try {
        // First get the matches
        const { data: matchData, error } = await supabase
          .from('matches')
          .select('*')
          .or(`user1_id.eq.${user.id},user2_id.eq.${user.id}`)
          .order('created_at', { ascending: false });

        if (error) {
          console.error('Error fetching matches:', error);
          toast({
            title: "Error loading matches",
            description: "Please try again later",
            variant: "destructive"
          });
          return;
        }

        if (!matchData || matchData.length === 0) {
          setMatches([]);
          return;
        }

        // Get unique user IDs to fetch profile data
        const userIds = new Set<string>();
        matchData.forEach(match => {
          if (match.user1_id !== user.id) userIds.add(match.user1_id);
          if (match.user2_id !== user.id) userIds.add(match.user2_id);
        });

        // Fetch profiles for these users
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('id, display_name, profile_image_url, bio, age')
          .in('id', Array.from(userIds));

        if (profileError) {
          console.error('Error fetching profiles:', profileError);
          return;
        }

        // Create a map of profiles for quick lookup
        const profileMap = new Map();
        profileData?.forEach(profile => {
          profileMap.set(profile.id, profile);
        });

        // Transform data to include the matched user info
        const transformedMatches = matchData.map(match => {
          const isUser1 = match.user1_id === user.id;
          const matchedUserId = isUser1 ? match.user2_id : match.user1_id;
          const matchedUser = profileMap.get(matchedUserId);
          
          return {
            ...match,
            matched_user: matchedUser
          };
        });

        setMatches(transformedMatches);
      } catch (error) {
        console.error('Error:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchMatches();

    // Set up real-time subscription for new matches
    const channel = supabase
      .channel('matches-changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'matches',
          filter: `or(user1_id.eq.${user.id},user2_id.eq.${user.id})`
        },
        () => {
          fetchMatches();
          toast({
            title: "New Match! 🎉",
            description: "You have a new connection!"
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, toast]);

  const handleMessage = async (matchId: string) => {
    // Navigate to chat (will be handled by parent component)
    if (onStartChat) {
      onStartChat(matchId);
    }
  };

  const getTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'Just now';
    if (diffInHours < 24) return `${diffInHours}h ago`;
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) return `${diffInDays}d ago`;
    return date.toLocaleDateString();
  };

  const isExpiringSoon = (expiresAt?: string) => {
    if (!expiresAt) return false;
    const expireDate = new Date(expiresAt);
    const now = new Date();
    const hoursLeft = (expireDate.getTime() - now.getTime()) / (1000 * 60 * 60);
    return hoursLeft < 24 && hoursLeft > 0;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (matches.length === 0) {
    return (
      <div className="text-center py-12">
        <h3 className="text-lg font-semibold text-foreground mb-2">No matches yet</h3>
        <p className="text-muted-foreground">
          Start swiping to find your connections!
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold text-foreground mb-6">Your Matches</h2>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {matches.map((match) => (
          <Card key={match.id} className="overflow-hidden hover:shadow-lg transition-shadow">
            <div className="relative">
              <div className="aspect-square w-full overflow-hidden bg-muted">
                {match.matched_user?.profile_image_url ? (
                  <img
                    src={match.matched_user.profile_image_url}
                    alt={match.matched_user.display_name || 'Match'}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/10 to-secondary/10">
                    <div className="text-4xl font-bold text-muted-foreground">
                      {match.matched_user?.display_name?.[0]?.toUpperCase() || '?'}
                    </div>
                  </div>
                )}
              </div>

              {match.is_super_like && (
                <div className="absolute top-2 right-2">
                  <Badge className="bg-blue-500 text-white">
                    <Star className="w-3 h-3 mr-1" />
                    Super Like
                  </Badge>
                </div>
              )}

              {isExpiringSoon(match.expires_at) && (
                <div className="absolute top-2 left-2">
                  <Badge variant="destructive">
                    <Clock className="w-3 h-3 mr-1" />
                    Expiring Soon
                  </Badge>
                </div>
              )}
            </div>

            <CardContent className="p-4">
              <div className="space-y-3">
                <div>
                  <h3 className="font-semibold text-lg flex items-center gap-2">
                    {match.matched_user?.display_name || 'Anonymous'}
                    {match.matched_user?.age && (
                      <span className="text-muted-foreground font-normal">
                        {match.matched_user.age}
                      </span>
                    )}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Matched {getTimeAgo(match.created_at)}
                  </p>
                </div>

                {match.matched_user?.bio && (
                  <p className="text-sm text-foreground line-clamp-2">
                    {match.matched_user.bio}
                  </p>
                )}

                <Button 
                  onClick={() => handleMessage(match.id)}
                  className="w-full"
                  variant="default"
                >
                  <MessageCircle className="w-4 h-4 mr-2" />
                  Send Message
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};