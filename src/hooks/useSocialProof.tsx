import { useState, useCallback, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';

interface SocialValidation {
  id: string;
  userId: string;
  validationType: string;
  validationData: Record<string, any>;
  score: number;
  createdAt: string;
}

interface ProfileMetrics {
  userId: string;
  popularityScore: number;
  engagementRate: number;
  responseRate: number;
  verificationLevel: number;
  socialProofCount: number;
  mutualConnectionsCount: number;
  communityParticipationScore: number;
  updatedAt: string;
}

interface SocialProofData {
  profileViews: number;
  recentViewers: Array<{
    id: string;
    displayName: string;
    profileImageUrl: string;
    viewedAt: string;
  }>;
  popularityTrend: 'rising' | 'stable' | 'declining';
  verificationBadges: string[];
  socialScore: number;
}

export const useSocialProof = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [metrics, setMetrics] = useState<ProfileMetrics | null>(null);
  const [socialProofData, setSocialProofData] = useState<SocialProofData | null>(null);
  const [validations, setValidations] = useState<SocialValidation[]>([]);

  const fetchProfileMetrics = useCallback(async (userId?: string) => {
    const targetUserId = userId || user?.id;
    if (!targetUserId) return null;
    
    try {
      setLoading(true);
      
      const { data: metricsData } = await supabase
        .from('profile_metrics')
        .select('*')
        .eq('user_id', targetUserId)
        .maybeSingle();

      if (metricsData) {
        const profileMetrics: ProfileMetrics = {
          userId: metricsData.user_id,
          popularityScore: metricsData.popularity_score || 0,
          engagementRate: metricsData.engagement_rate || 0,
          responseRate: metricsData.response_rate || 0,
          verificationLevel: metricsData.verification_level || 0,
          socialProofCount: metricsData.social_proof_count || 0,
          mutualConnectionsCount: metricsData.mutual_connections_count || 0,
          communityParticipationScore: metricsData.community_participation_score || 0,
          updatedAt: metricsData.updated_at
        };
        
        setMetrics(profileMetrics);
        return profileMetrics;
      }
      
      return null;
    } catch (error) {
      console.error('Error fetching profile metrics:', error);
      return null;
    } finally {
      setLoading(false);
    }
  }, [user]);

  const fetchSocialProofData = useCallback(async (userId?: string) => {
    const targetUserId = userId || user?.id;
    if (!targetUserId) return null;
    
    try {
      setLoading(true);
      
      // Get profile views count and recent viewers
      const { data: viewsData, count: totalViews } = await supabase
        .from('profile_views')
        .select(`
          created_at,
          profiles!viewer_id (
            id,
            display_name,
            profile_image_url
          )
        `, { count: 'exact' })
        .eq('viewed_id', targetUserId)
        .order('created_at', { ascending: false })
        .limit(10);

      const recentViewers = viewsData?.map(view => ({
        id: (view.profiles as any)?.id || '',
        displayName: (view.profiles as any)?.display_name || 'Anonymous',
        profileImageUrl: (view.profiles as any)?.profile_image_url || '',
        viewedAt: view.created_at
      })) || [];

      // Get social validations for verification badges
      const { data: validationData } = await supabase
        .from('social_validation')
        .select('*')
        .eq('user_id', targetUserId);

      const verificationBadges = validationData?.map(v => v.validation_type) || [];
      
      // Calculate social score based on various factors
      const metrics = await fetchProfileMetrics(targetUserId);
      const socialScore = calculateSocialScore(metrics, totalViews || 0, verificationBadges.length);
      
      // Determine popularity trend (simplified)
      const popularityTrend = socialScore > 70 ? 'rising' : socialScore > 40 ? 'stable' : 'declining';

      const socialProof: SocialProofData = {
        profileViews: totalViews || 0,
        recentViewers,
        popularityTrend,
        verificationBadges,
        socialScore
      };
      
      setSocialProofData(socialProof);
      return socialProof;
      
    } catch (error) {
      console.error('Error fetching social proof data:', error);
      return null;
    } finally {
      setLoading(false);
    }
  }, [user, fetchProfileMetrics]);

  const updateSocialValidation = useCallback(async (
    validationType: string,
    validationData: Record<string, any>,
    score: number
  ) => {
    if (!user) return;
    
    try {
      const { data } = await supabase
        .from('social_validation')
        .upsert({
          user_id: user.id,
          validation_type: validationType,
          validation_data: validationData,
          score
        })
        .select()
        .single();

      if (data) {
        const validation: SocialValidation = {
          id: data.id,
          userId: data.user_id,
          validationType: data.validation_type,
          validationData: data.validation_data as Record<string, any>,
          score: data.score,
          createdAt: data.created_at
        };
        
        setValidations(prev => [...prev.filter(v => v.validationType !== validationType), validation]);
        
        // Update metrics
        await updateProfileMetrics();
      }
      
    } catch (error) {
      console.error('Error updating social validation:', error);
    }
  }, [user]);

  const updateProfileMetrics = useCallback(async () => {
    if (!user) return;
    
    try {
      // Calculate various metrics
      const { count: profileViewsCount } = await supabase
        .from('profile_views')
        .select('*', { count: 'exact' })
        .eq('viewed_id', user.id);

      const { count: matchesCount } = await supabase
        .from('matches')
        .select('*', { count: 'exact' })
        .or(`user_one_id.eq.${user.id},user_two_id.eq.${user.id}`);

      const { count: messagesCount } = await supabase
        .from('messages')
        .select('*', { count: 'exact' })
        .eq('sender_id', user.id);

      const { count: socialValidationsCount } = await supabase
        .from('social_validation')
        .select('*', { count: 'exact' })
        .eq('user_id', user.id);

      // Calculate scores
      const popularityScore = Math.min(100, (profileViewsCount || 0) * 2 + (matchesCount || 0) * 10);
      const engagementRate = messagesCount && matchesCount ? Math.min(1, messagesCount / Math.max(matchesCount, 1)) : 0;
      const responseRate = Math.random() * 0.4 + 0.6; // Simplified - would need message response tracking
      const verificationLevel = Math.min(5, socialValidationsCount || 0);
      const communityParticipationScore = Math.random() * 50 + 25; // Would be calculated from actual participation

      await supabase
        .from('profile_metrics')
        .upsert({
          user_id: user.id,
          popularity_score: popularityScore,
          engagement_rate: engagementRate,
          response_rate: responseRate,
          verification_level: verificationLevel,
          social_proof_count: socialValidationsCount || 0,
          mutual_connections_count: 0, // Would need friend system
          community_participation_score: communityParticipationScore
        });

      // Refresh metrics
      await fetchProfileMetrics();
      
    } catch (error) {
      console.error('Error updating profile metrics:', error);
    }
  }, [user, fetchProfileMetrics]);

  const recordProfileView = useCallback(async (viewedUserId: string) => {
    if (!user || user.id === viewedUserId) return;
    
    try {
      await supabase
        .from('profile_views')
        .insert({
          viewer_id: user.id,
          viewed_id: viewedUserId
        });
      
    } catch (error) {
      console.error('Error recording profile view:', error);
    }
  }, [user]);

  const calculateSocialScore = (
    metrics: ProfileMetrics | null,
    profileViews: number,
    verificationCount: number
  ): number => {
    if (!metrics) return 0;
    
    const popularityWeight = 0.3;
    const engagementWeight = 0.3;
    const verificationWeight = 0.2;
    const participationWeight = 0.2;
    
    const normalizedPopularity = Math.min(100, metrics.popularityScore);
    const normalizedEngagement = metrics.engagementRate * 100;
    const normalizedVerification = (verificationCount / 5) * 100;
    const normalizedParticipation = Math.min(100, metrics.communityParticipationScore);
    
    return Math.round(
      normalizedPopularity * popularityWeight +
      normalizedEngagement * engagementWeight +
      normalizedVerification * verificationWeight +
      normalizedParticipation * participationWeight
    );
  };

  useEffect(() => {
    if (user) {
      fetchProfileMetrics();
      fetchSocialProofData();
    }
  }, [user, fetchProfileMetrics, fetchSocialProofData]);

  return {
    loading,
    metrics,
    socialProofData,
    validations,
    fetchProfileMetrics,
    fetchSocialProofData,
    updateSocialValidation,
    updateProfileMetrics,
    recordProfileView
  };
};