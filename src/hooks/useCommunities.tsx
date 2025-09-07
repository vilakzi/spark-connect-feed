import { useState, useEffect } from 'react';
import { useAuth } from './useAuth';

interface Community {
  id: string;
  name: string;
  description: string;
  category: string;
  image_url?: string;
  member_count: number;
  is_private: boolean;
  created_by: string;
  created_at: string;
  updated_at: string;
  user_role?: string;
  joined_at?: string;
}

// Mock hook - communities table doesn't exist in database
export const useCommunities = () => {
  const { user } = useAuth();
  const [communities, setCommunities] = useState<Community[]>([]);
  const [userCommunities, setUserCommunities] = useState<Community[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Mock data since communities table doesn't exist
    const mockCommunities: Community[] = [
      {
        id: '1',
        name: 'Tech Enthusiasts',
        description: 'A community for technology lovers',
        category: 'Technology',
        image_url: '/placeholder.svg',
        member_count: 150,
        is_private: false,
        created_by: 'mock-user',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      },
      {
        id: '2',
        name: 'Fitness & Health',
        description: 'Stay fit and healthy together',
        category: 'Health',
        image_url: '/placeholder.svg',
        member_count: 89,
        is_private: false,
        created_by: 'mock-user',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
    ];

    setCommunities(mockCommunities);
    setUserCommunities(user ? mockCommunities.slice(0, 1) : []);
  }, [user]);

  const joinCommunity = async (communityId: string) => {
    setLoading(true);
    try {
      // Mock join action
      const community = communities.find(c => c.id === communityId);
      if (community && !userCommunities.find(c => c.id === communityId)) {
        setUserCommunities(prev => [...prev, community]);
      }
    } catch (err) {
      setError('Failed to join community');
    } finally {
      setLoading(false);
    }
  };

  const leaveCommunity = async (communityId: string) => {
    setLoading(true);
    try {
      // Mock leave action
      setUserCommunities(prev => prev.filter(c => c.id !== communityId));
    } catch (err) {
      setError('Failed to leave community');
    } finally {
      setLoading(false);
    }
  };

  const createCommunity = async (communityData: Partial<Community>) => {
    setLoading(true);
    try {
      // Mock create action
      const newCommunity: Community = {
        id: Date.now().toString(),
        name: communityData.name || '',
        description: communityData.description || '',
        category: communityData.category || '',
        image_url: communityData.image_url,
        member_count: 1,
        is_private: communityData.is_private || false,
        created_by: user?.id || '',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        user_role: 'admin'
      };

      setCommunities(prev => [...prev, newCommunity]);
      setUserCommunities(prev => [...prev, newCommunity]);
      return newCommunity;
    } catch (err) {
      setError('Failed to create community');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return {
    communities,
    userCommunities,
    loading,
    error,
    joinCommunity,
    leaveCommunity,
    createCommunity
  };
};