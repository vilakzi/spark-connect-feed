import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
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
      // First get stories
      const { data: storiesData, error } = await supabase
        .from('stories')
        .select('*')
        .gt('expires_at', new Date().toISOString())
        .neq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      if (!storiesData || storiesData.length === 0) {
        setStories([]);
        return;
      }

      // Get user profiles for stories
      const userIds = storiesData.map(s => s.user_id);
      const { data: profilesData } = await supabase
        .from('profiles')
        .select('id, display_name, profile_image_url')
        .in('id', userIds);

      // Check which stories current user has viewed
      const storyIds = storiesData.map(s => s.id);
      const { data: viewedStories } = await supabase
        .from('story_views')
        .select('story_id')
        .eq('viewer_id', user.id)
        .in('story_id', storyIds);

      const viewedStoryIds = new Set(viewedStories?.map(v => v.story_id) || []);
      const profilesMap = new Map(profilesData?.map(p => [p.id, p]) || []);

      const enrichedStories = storiesData.map(story => ({
        ...story,
        user: profilesMap.get(story.user_id) || { display_name: 'Unknown User' },
        viewed_by_me: viewedStoryIds.has(story.id)
      }));

      setStories(enrichedStories);
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
          caption: caption
        })
        .select()
        .single();

      if (error) throw error;

      toast({
        title: "Story posted!",
        description: "Your story is now live for 24 hours"
      });

      await fetchMyStories();
      return data;
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
      // Record story view
      await supabase
        .from('story_views')
        .upsert({
          story_id: storyId,
          viewer_id: user.id
        });

      // Update story view count
      const { data: currentStory } = await supabase
        .from('stories')
        .select('view_count')
        .eq('id', storyId)
        .single();
      
      if (currentStory) {
        await supabase
          .from('stories')
          .update({ view_count: currentStory.view_count + 1 })
          .eq('id', storyId);
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