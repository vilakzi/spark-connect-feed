import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

export const useBlocking = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  const blockUser = useCallback(async (blockedUserId: string) => {
    if (!user) return false;

    setLoading(true);
    try {
      const { error } = await supabase
        .from('blocked_users')
        .insert({
          blocker_id: user.id,
          blocked_id: blockedUserId
        });

      if (error) throw error;

      toast({
        title: "User Blocked",
        description: "This user has been blocked successfully.",
      });

      return true;
    } catch (error) {
      console.error('Error blocking user:', error);
      toast({
        title: "Error",
        description: "Failed to block user. Please try again.",
        variant: "destructive",
      });
      return false;
    } finally {
      setLoading(false);
    }
  }, [user, toast]);

  const unblockUser = useCallback(async (blockedUserId: string) => {
    if (!user) return false;

    setLoading(true);
    try {
      const { error } = await supabase
        .from('blocked_users')
        .delete()
        .eq('blocker_id', user.id)
        .eq('blocked_id', blockedUserId);

      if (error) throw error;

      toast({
        title: "User Unblocked",
        description: "This user has been unblocked successfully.",
      });

      return true;
    } catch (error) {
      console.error('Error unblocking user:', error);
      toast({
        title: "Error",
        description: "Failed to unblock user. Please try again.",
        variant: "destructive",
      });
      return false;
    } finally {
      setLoading(false);
    }
  }, [user, toast]);

  const getBlockedUsers = useCallback(async () => {
    if (!user) return [];

    try {
      const { data, error } = await supabase
        .from('blocked_users')
        .select(`
          blocked_id,
          created_at,
          profiles!blocked_users_blocked_id_fkey (
            display_name,
            profile_image_url
          )
        `)
        .eq('blocker_id', user.id);

      if (error) throw error;

      return data || [];
    } catch (error) {
      console.error('Error fetching blocked users:', error);
      return [];
    }
  }, [user]);

  const isUserBlocked = useCallback(async (userId: string) => {
    if (!user) return false;

    try {
      const { data, error } = await supabase
        .from('blocked_users')
        .select('id')
        .eq('blocker_id', user.id)
        .eq('blocked_id', userId)
        .maybeSingle();

      if (error) throw error;

      return !!data;
    } catch (error) {
      console.error('Error checking if user is blocked:', error);
      return false;
    }
  }, [user]);

  return {
    blockUser,
    unblockUser,
    getBlockedUsers,
    isUserBlocked,
    loading,
  };
};