import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

interface ReportData {
  reason: string;
  description?: string;
  evidenceUrls?: string[];
  evidenceData?: Array<Record<string, unknown>>;
}

export const useReporting = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [submitting, setSubmitting] = useState(false);

  const submitReport = useCallback(async (reportedUserId: string, reportData: ReportData) => {
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "You must be logged in to submit a report.",
        variant: "destructive",
      });
      return false;
    }

    setSubmitting(true);
    try {
      const { error } = await supabase
        .from('moderation_reports')
        .insert({
          reporter_id: user.id,
          reported_user_id: reportedUserId,
          content_type: 'user',
          reason: reportData.reason,
          description: reportData.description,
          evidence_urls: reportData.evidenceUrls || []
        });

      if (error) throw error;

      toast({
        title: "Report Submitted",
        description: "Thank you for your report. We'll review it shortly.",
      });

      return true;
    } catch (error) {
      console.error('Error submitting report:', error);
      toast({
        title: "Error",
        description: "Failed to submit report. Please try again.",
        variant: "destructive",
      });
      return false;
    } finally {
      setSubmitting(false);
    }
  }, [user, toast]);

  const blockUser = useCallback(async (blockedUserId: string) => {
    if (!user) return false;

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
    }
  }, [user, toast]);

  const unblockUser = useCallback(async (blockedUserId: string) => {
    if (!user) return false;

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

  const uploadEvidence = useCallback(async (file: File): Promise<string | null> => {
    if (!user) return null;

    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('content_files')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('content_files')
        .getPublicUrl(fileName);

      return publicUrl;
    } catch (error) {
      console.error('Error uploading evidence:', error);
      toast({
        title: "Upload Error",
        description: "Failed to upload evidence file.",
        variant: "destructive",
      });
      return null;
    }
  }, [user, toast]);

  return {
    submitting,
    submitReport,
    blockUser,
    unblockUser,
    getBlockedUsers,
    uploadEvidence
  };
};