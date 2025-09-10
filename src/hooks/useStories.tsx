import { useState, useCallback } from 'react';
import { useAuth } from './useAuth';
import { logInfo, logDebug } from '@/lib/secureLogger';

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
    logInfo('Fetch stories', undefined, 'useStories');
    setStories([]);
  }, []);

  const createStory = useCallback(async (storyData: any) => {
    // Mock function
    logInfo('Create story', { storyData }, 'useStories');
    return null;
  }, []);

  const deleteStory = useCallback(async (storyId: string) => {
    // Mock function
    logInfo('Delete story', { storyId }, 'useStories');
  }, []);

  const viewStory = useCallback(async (storyId: string) => {
    // Mock function
    logDebug('View story', { storyId }, 'useStories');
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