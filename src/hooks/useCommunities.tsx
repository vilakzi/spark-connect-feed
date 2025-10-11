import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from 'sonner';

interface Community {
  id: string;
  name: string;
  description: string | null;
  image_url: string | null;
  banner_url: string | null;
  creator_id: string;
  privacy_level: string;
  category: string;
  member_count: number;
  rules: string | null;
  tags: string[];
  is_verified: boolean;
  location: string | null;
  created_at: string;
  updated_at: string;
}

export const useCommunities = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Fetch all public communities
  const {
    data: communities = [],
    isLoading: loading,
    error
  } = useQuery({
    queryKey: ['communities'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('communities')
        .select('*')
        .order('member_count', { ascending: false });

      if (error) throw error;
      return data as Community[];
    },
    enabled: !!user
  });

  // Fetch user's communities
  const {
    data: userCommunities = []
  } = useQuery({
    queryKey: ['user-communities', user?.id],
    queryFn: async () => {
      if (!user) return [];

      const { data, error } = await supabase
        .from('community_memberships')
        .select(`
          *,
          communities:community_id (*)
        `)
        .eq('user_id', user.id)
        .eq('status', 'active');

      if (error) throw error;
      return data.map(membership => membership.communities) as Community[];
    },
    enabled: !!user
  });

  // Create community mutation
  const createCommunityMutation = useMutation({
    mutationFn: async (communityData: Partial<Community> & { name: string }) => {
      if (!user) throw new Error('User not authenticated');

      // Validate and sanitize input
      const { communitySchema } = await import('@/lib/validationSchemas');
      const validated = communitySchema.parse(communityData);

      const { data, error } = await supabase
        .from('communities')
        .insert({
          name: validated.name,
          description: validated.description,
          privacy_level: validated.privacy_level,
          category: validated.category,
          tags: validated.tags,
          image_url: validated.image_url,
          banner_url: validated.banner_url,
          creator_id: user.id
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['communities'] });
      queryClient.invalidateQueries({ queryKey: ['user-communities'] });
      toast.success('Community created successfully!');
    },
    onError: (error) => {
      toast.error('Failed to create community');
      console.error('Error creating community:', error);
    }
  });

  // Join community mutation
  const joinCommunityMutation = useMutation({
    mutationFn: async (communityId: string) => {
      if (!user) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('community_memberships')
        .insert({
          community_id: communityId,
          user_id: user.id,
          role: 'member'
        });

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['communities'] });
      queryClient.invalidateQueries({ queryKey: ['user-communities'] });
      toast.success('Joined community successfully!');
    },
    onError: (error) => {
      toast.error('Failed to join community');
      console.error('Error joining community:', error);
    }
  });

  // Leave community mutation
  const leaveCommunityMutation = useMutation({
    mutationFn: async (communityId: string) => {
      if (!user) throw new Error('User not authenticated');

      const { error } = await supabase
        .from('community_memberships')
        .delete()
        .eq('community_id', communityId)
        .eq('user_id', user.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['communities'] });
      queryClient.invalidateQueries({ queryKey: ['user-communities'] });
      toast.success('Left community successfully!');
    },
    onError: (error) => {
      toast.error('Failed to leave community');
      console.error('Error leaving community:', error);
    }
  });

  return {
    communities,
    userCommunities,
    loading,
    error: error?.message || '',
    createCommunity: createCommunityMutation.mutate,
    joinCommunity: joinCommunityMutation.mutateAsync,
    leaveCommunity: leaveCommunityMutation.mutateAsync
  };
};