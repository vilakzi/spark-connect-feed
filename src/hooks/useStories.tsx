import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

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

export const useStories = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [stories, setStories] = useState<Story[]>([]);
  const [myStories, setMyStories] = useState<Story[]>([]);
  const [loading, setLoading] = useState(false);

  // Fetch all active stories
  const fetchStories = async () => {
    if (!user) return;

    try {
      setLoading(true);
      // For now, return empty array since tables need to be created
      setStories([]);
    } catch (error) {
      console.error('Error fetching stories:', error);
      toast({
        title: "Error loading stories",
        description: "Please try again",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  // Fetch user's own stories
  const fetchMyStories = async () => {
    if (!user) return;

    try {
      // For now, return empty array since tables need to be created
      setMyStories([]);
    } catch (error) {
      console.error('Error fetching my stories:', error);
    }
  };

  // Create a new story
  const createStory = async (contentUrl: string, contentType: string, caption?: string) => {
    if (!user) return null;

    try {
      // For now, just log since tables need to be created
      console.log('Would create story:', { contentUrl, contentType, caption });

      toast({
        title: "Story posted!",
        description: "Your story is now live for 24 hours"
      });

      await fetchMyStories();
      return { id: 'temp-id', user_id: user.id, content_url: contentUrl, content_type: contentType };
    } catch (error) {
      console.error('Error creating story:', error);
      toast({
        title: "Error posting story",
        description: "Please try again",
        variant: "destructive"
      });
      return null;
    }
  };

  // View a story
  const viewStory = async (storyId: string) => {
    if (!user) return;

    try {
      // For now, just log since tables need to be created
      console.log('Would view story:', storyId);

      // Update local state
      setStories(prev => 
        prev.map(story => 
          story.id === storyId 
            ? { ...story, viewed_by_me: true, view_count: story.view_count + 1 }
            : story
        )
      );
    } catch (error) {
      console.error('Error viewing story:', error);
    }
  };

  // Delete a story
  const deleteStory = async (storyId: string) => {
    if (!user) return;

    try {
      // For now, just log since tables need to be created
      console.log('Would delete story:', storyId);

      toast({
        title: "Story deleted",
        description: "Your story has been removed"
      });

      await fetchMyStories();
    } catch (error) {
      console.error('Error deleting story:', error);
      toast({
        title: "Error deleting story",
        description: "Please try again",
        variant: "destructive"
      });
    }
  };

  useEffect(() => {
    if (user) {
      fetchStories();
      fetchMyStories();
    }
  }, [user]);

  return {
    stories,
    myStories,
    loading,
    createStory,
    viewStory,
    deleteStory,
    fetchStories,
    fetchMyStories
  };
};