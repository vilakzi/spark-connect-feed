import { useState, useEffect } from 'react';
import { Camera, X, Play, Eye, Trash2, Plus } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog';
import { useStories } from '@/hooks/useStories';
import { cn } from '@/lib/utils';

interface Story {
  id: string;
  user_id: string;
  content_url: string;
  content_type: string;
  caption?: string;
  created_at: string;
  expires_at: string;
  view_count: number;
  user?: {
    display_name: string;
    profile_image_url?: string;
  };
  viewed_by_me?: boolean;
}

export const StoriesInterface = () => {
  const { stories, myStories, loading, createStory, viewStory, deleteStory } = useStories();
  const [selectedStory, setSelectedStory] = useState<Story | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'Just now';
    if (diffInHours < 24) return `${diffInHours}h ago`;
    return 'Expired';
  };

  const handleStoryClick = (story: Story) => {
    if (!story.viewed_by_me) {
      viewStory(story.id);
    }
    setSelectedStory(story);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Camera className="w-5 h-5" />
              Stories
            </CardTitle>
            <Button 
              onClick={() => setShowCreateModal(true)}
              size="sm"
              className="flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Add Story
            </Button>
          </div>
        </CardHeader>
      </Card>

      {/* My Stories */}
      {myStories.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">My Stories</CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="w-full">
              <div className="flex gap-4 pb-4">
                {myStories.map((story) => (
                  <div key={story.id} className="flex flex-col items-center space-y-2 min-w-0">
                    <div className="relative">
                      <div className="w-16 h-16 rounded-full border-2 border-primary overflow-hidden cursor-pointer">
                        {story.content_type.startsWith('image') ? (
                          <img
                            src={story.content_url}
                            alt="Story"
                            className="w-full h-full object-cover"
                            onClick={() => handleStoryClick(story)}
                          />
                        ) : (
                          <div className="w-full h-full bg-primary/10 flex items-center justify-center">
                            <Play className="w-6 h-6 text-primary" />
                          </div>
                        )}
                      </div>
                      <Button
                        size="sm"
                        variant="destructive"
                        className="absolute -top-1 -right-1 w-6 h-6 rounded-full p-0"
                        onClick={() => deleteStory(story.id)}
                      >
                        <X className="w-3 h-3" />
                      </Button>
                    </div>
                    <div className="text-center">
                      <p className="text-xs text-muted-foreground">
                        {formatTimeAgo(story.created_at)}
                      </p>
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Eye className="w-3 h-3" />
                        {story.view_count}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      )}

      {/* Other Stories */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Recent Stories</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : stories.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Camera className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>No stories to show</p>
              <p className="text-sm">Follow more people to see their stories</p>
            </div>
          ) : (
            <ScrollArea className="w-full">
              <div className="flex gap-4 pb-4">
                {stories.map((story) => (
                  <div key={story.id} className="flex flex-col items-center space-y-2 min-w-0">
                    <div className="relative">
                      <div 
                        className={cn(
                          "w-16 h-16 rounded-full border-2 overflow-hidden cursor-pointer",
                          story.viewed_by_me ? "border-muted" : "border-primary"
                        )}
                        onClick={() => handleStoryClick(story)}
                      >
                        {story.content_type.startsWith('image') ? (
                          <img
                            src={story.content_url}
                            alt="Story"
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full bg-primary/10 flex items-center justify-center">
                            <Play className="w-6 h-6 text-primary" />
                          </div>
                        )}
                      </div>
                      {!story.viewed_by_me && (
                        <div className="absolute -top-1 -right-1 w-4 h-4 bg-primary rounded-full"></div>
                      )}
                    </div>
                    <div className="text-center">
                      <p className="text-xs font-medium truncate max-w-[80px]">
                        {story.user?.display_name || 'Unknown'}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {formatTimeAgo(story.created_at)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          )}
        </CardContent>
      </Card>

      {/* Story Viewer Dialog */}
      {selectedStory && (
        <Dialog open={!!selectedStory} onOpenChange={() => setSelectedStory(null)}>
          <DialogContent className="max-w-md p-0 bg-black border-0">
            <div className="relative h-[600px]">
              {/* Header */}
              <div className="absolute top-4 left-4 right-4 z-10 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Avatar className="w-8 h-8">
                    <AvatarImage src={selectedStory.user?.profile_image_url} />
                    <AvatarFallback className="text-xs">
                      {selectedStory.user?.display_name?.[0] || '?'}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="text-white text-sm font-medium">
                      {selectedStory.user?.display_name || 'Unknown'}
                    </p>
                    <p className="text-white/70 text-xs">
                      {formatTimeAgo(selectedStory.created_at)}
                    </p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedStory(null)}
                  className="text-white hover:bg-white/20"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>

              {/* Story Content */}
              <div className="w-full h-full">
                {selectedStory.content_type.startsWith('image') ? (
                  <img
                    src={selectedStory.content_url}
                    alt="Story"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <video
                    src={selectedStory.content_url}
                    controls
                    autoPlay
                    className="w-full h-full object-cover"
                  />
                )}
              </div>

              {/* Caption */}
              {selectedStory.caption && (
                <div className="absolute bottom-4 left-4 right-4">
                  <p className="text-white text-sm bg-black/50 p-3 rounded-lg">
                    {selectedStory.caption}
                  </p>
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};
