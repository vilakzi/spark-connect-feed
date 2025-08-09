import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
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

interface DatabaseStory {
  id: string;
  user_id: string;
  content_url: string;
  content_type: string;
  caption?: string;
  created_at: string;
  expires_at: string;
  view_count: number;
  profiles?: {
    display_name: string;
    profile_image_url?: string;
  };
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
      const { data, error } = await supabase
        .from('stories')
        .select(`
          *,
          profiles!stories_user_id_fkey (
            display_name,
            profile_image_url
          )
        `)
        .gt('expires_at', new Date().toISOString())
        .neq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const storiesWithUser = data?.map((story: unknown) => {
        const typedStory = story as DatabaseStory;
        return {
          ...typedStory,
          user: {
            display_name: typedStory.profiles?.display_name || 'Unknown',
            profile_image_url: typedStory.profiles?.profile_image_url
          }
        };
      }) || [];

      setStories(storiesWithUser);
    } catch (error) {
      console.error('Error fetching stories:', error);
      setStories([]);
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
      const { data, error } = await supabase
        .from('stories')
        .select('*')
        .eq('user_id', user.id)
        .gt('expires_at', new Date().toISOString())
        .order('created_at', { ascending: false });

      if (error) throw error;
      setMyStories(data || []);
    } catch (error) {
      console.error('Error fetching my stories:', error);
      setMyStories([]);
    }
  };

  // Create a new story
  const createStory = async (contentUrl: string, contentType: string, caption?: string) => {
    if (!user) return null;

    try {
      const { data, error } = await supabase
        .from('stories')
        .insert({
          user_id: user.id,
          content_url: contentUrl,
          content_type: contentType,
          caption: caption || ''
        })
        .select('*')
        .single();

      if (error) throw error;

      const newStory: Story = {
        ...data,
        user: {
          display_name: 'You',
          profile_image_url: undefined
        }
      };

      setMyStories(prev => [newStory, ...prev]);

      toast({
        title: "Story posted!",
        description: "Your story is now live for 24 hours"
      });

      return newStory;
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
      // Track the view
      const { error: viewError } = await supabase
        .from('story_views')
        .insert({
          story_id: storyId,
          viewer_id: user.id
        });

      // Ignore duplicate view errors
      if (viewError && !viewError.message.includes('duplicate')) {
        console.warn('Error tracking story view:', viewError);
      }

      // Get current view count and increment
      const { data: currentStory } = await supabase
        .from('stories')
        .select('view_count')
        .eq('id', storyId)
        .single();

      if (currentStory) {
        const { error: updateError } = await supabase
          .from('stories')
          .update({ view_count: currentStory.view_count + 1 })
          .eq('id', storyId);

        if (updateError) {
          console.warn('Error updating story view count:', updateError);
        }
      }
      
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
      const { error } = await supabase
        .from('stories')
        .delete()
        .eq('id', storyId)
        .eq('user_id', user.id);

      if (error) throw error;
      
      setMyStories(prev => prev.filter(story => story.id !== storyId));

      toast({
        title: "Story deleted",
        description: "Your story has been removed"
      });
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
  }, [user, fetchStories, fetchMyStories]);

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