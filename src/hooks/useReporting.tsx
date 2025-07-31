import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

interface ReportData {
  reason: string;
  description?: string;
  evidenceUrls?: string[];
  evidenceData?: any[];
}

export const useReporting = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [submitting, setSubmitting] = useState(false);

  // Submit a user report with evidence
  const submitReport = async (reportedUserId: string, reportData: ReportData) => {
    if (!user) return false;

    try {
      setSubmitting(true);

      // Create the report
      const { data: report, error: reportError } = await supabase
        .from('user_reports')
        .insert({
          reporter_id: user.id,
          reported_id: reportedUserId,
          reason: reportData.reason,
          description: reportData.description || null
        })
        .select()
        .single();

      if (reportError) throw reportError;

      // Add evidence if provided
      if (reportData.evidenceUrls && reportData.evidenceUrls.length > 0) {
        const evidencePromises = reportData.evidenceUrls.map((url, index) => 
          supabase
            .from('report_evidence')
            .insert({
              report_id: report.id,
              evidence_type: 'screenshot',
              evidence_url: url,
              evidence_data: reportData.evidenceData?.[index] || null
            })
        );

        await Promise.all(evidencePromises);
      }

      toast({
        title: "Report submitted",
        description: "Thank you for helping keep our community safe. We'll review your report."
      });

      return true;
    } catch (error) {
      console.error('Error submitting report:', error);
      toast({
        title: "Error submitting report",
        description: "Please try again later",
        variant: "destructive"
      });
      return false;
    } finally {
      setSubmitting(false);
    }
  };

  // Block a user
  const blockUser = async (blockedUserId: string) => {
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
        title: "User blocked",
        description: "You won't see this user's profile anymore"
      });

      return true;
    } catch (error) {
      console.error('Error blocking user:', error);
      toast({
        title: "Error blocking user",
        description: "Please try again",
        variant: "destructive"
      });
      return false;
    }
  };

  // Unblock a user
  const unblockUser = async (blockedUserId: string) => {
    if (!user) return false;

    try {
      const { error } = await supabase
        .from('blocked_users')
        .delete()
        .eq('blocker_id', user.id)
        .eq('blocked_id', blockedUserId);

      if (error) throw error;

      toast({
        title: "User unblocked",
        description: "You can now see this user's profile again"
      });

      return true;
    } catch (error) {
      console.error('Error unblocking user:', error);
      toast({
        title: "Error unblocking user",
        description: "Please try again",
        variant: "destructive"
      });
      return false;
    }
  };

  // Get blocked users list
  const getBlockedUsers = async () => {
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
      console.error('Error getting blocked users:', error);
      return [];
    }
  };

  return {
    submitting,
    submitReport,
    blockUser,
    unblockUser,
    getBlockedUsers
  };
};