import { useState, useEffect } from 'react';
import { Eye, Users, Heart, MessageCircle, TrendingUp } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useProfileViews } from '@/hooks/useProfileViews';
import { useAIMatching } from '@/hooks/useAIMatching';

export const ProfileViewsTracker = () => {
  const { profileViews, loading } = useProfileViews();
  const { suggestions, getMatchSuggestions } = useAIMatching();

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'Just now';
    if (diffInHours < 24) return `${diffInHours}h ago`;
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) return `${diffInDays}d ago`;
    return date.toLocaleDateString();
  };

  useEffect(() => {
    getMatchSuggestions();
  }, []);

  return (
    <div className="space-y-6">
      {/* Profile Views */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Eye className="w-5 h-5" />
            Who Viewed Your Profile
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : profileViews.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Eye className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>No profile views yet</p>
              <p className="text-sm">Complete your profile to get more views</p>
            </div>
          ) : (
            <ScrollArea className="h-64">
              <div className="space-y-3">
                {profileViews.map((view) => (
                  <div key={view.id} className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted/50">
                    <Avatar className="w-10 h-10">
                      <AvatarImage src={view.viewer?.profile_image_url} />
                      <AvatarFallback>
                        {view.viewer?.display_name?.[0] || '?'}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <p className="font-medium">
                          {view.viewer?.display_name || 'Anonymous User'}
                        </p>
                        {view.viewer?.age && (
                          <Badge variant="secondary" className="text-xs">
                            {view.viewer.age}
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Viewed {formatTimeAgo(view.created_at)}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <button className="p-2 rounded-full hover:bg-primary/10 text-primary">
                        <Heart className="w-4 h-4" />
                      </button>
                      <button className="p-2 rounded-full hover:bg-primary/10 text-primary">
                        <MessageCircle className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          )}
        </CardContent>
      </Card>

      {/* AI Match Suggestions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5" />
            AI Recommendations
          </CardTitle>
        </CardHeader>
        <CardContent>
          {suggestions.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Users className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>No recommendations available</p>
              <p className="text-sm">Update your interests to get better matches</p>
            </div>
          ) : (
            <div className="space-y-3">
              {suggestions.slice(0, 3).map((suggestion) => (
                <div key={suggestion.user_id} className="flex items-center gap-3 p-3 rounded-lg border">
                  <Avatar className="w-12 h-12">
                    <AvatarImage src={suggestion.profile?.profile_image_url} />
                    <AvatarFallback>
                      {suggestion.profile?.display_name?.[0] || '?'}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <p className="font-medium">
                        {suggestion.profile?.display_name || 'Anonymous'}
                      </p>
                      {suggestion.profile?.age && (
                        <Badge variant="secondary" className="text-xs">
                          {suggestion.profile.age}
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <span>{Math.round(suggestion.compatibility_score * 100)}% match</span>
                      <span>•</span>
                      <span>{suggestion.common_interests} common interests</span>
                    </div>
                    {suggestion.profile?.bio && (
                      <p className="text-sm text-muted-foreground line-clamp-1 mt-1">
                        {suggestion.profile.bio}
                      </p>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <button className="p-2 rounded-full hover:bg-primary/10 text-primary">
                      <Heart className="w-4 h-4" />
                    </button>
                    <button className="p-2 rounded-full hover:bg-primary/10 text-primary">
                      <MessageCircle className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};