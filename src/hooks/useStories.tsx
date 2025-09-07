import { useState, useCallback } from 'react';
import { useAuth } from './useAuth';

interface Story {
  id: string;
  user_id: string;
  content_url: string;
  content_type: string;
  expires_at: string;
  view_count: number;
  created_at: string;
  viewed_by_me?: boolean;
  user?: {
    display_name: string;
    profile_image_url?: string;
  };
}

export const useStories = () => {
  const { user } = useAuth();
  const [stories, setStories] = useState<Story[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchStories = useCallback(async () => {
    // Mock function - stories feature would need proper database setup
    console.log('Fetch stories');
    setStories([]);
  }, []);

  const createStory = useCallback(async (storyData: any) => {
    // Mock function
    console.log('Create story:', storyData);
    return null;
  }, []);

  const deleteStory = useCallback(async (storyId: string) => {
    // Mock function
    console.log('Delete story:', storyId);
  }, []);

  const viewStory = useCallback(async (storyId: string) => {
    // Mock function
    console.log('View story:', storyId);
  }, []);

  return {
    stories,
    loading,
    myStories: stories,
    fetchStories,
    createStory,
    deleteStory,
    viewStory
  };
};