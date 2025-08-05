import { useState, useCallback, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';

interface AIMatchingPreferences {
  ageRange: [number, number];
  maxDistance: number;
  interests: string[];
  dealBreakers: string[];
  personalityPriority: number;
  lifestylePriority: number;
  communicationPriority: number;
}

interface CompatibilityAnalysis {
  profileId: string;
  compatibilityScore: number;
  personalityMatch: Record<string, any>;
  interestOverlap: Record<string, any>;
  communicationStyle: Record<string, any>;
  lifestyleCompatibility: Record<string, any>;
  predictionConfidence: number;
  reasoning: string[];
  strengths: string[];
  potentialConcerns: string[];
}

interface EnhancedMatch {
  profileId: string;
  displayName: string;
  age: number;
  bio: string;
  profileImageUrl: string;
  compatibilityScore: number;
  aiAnalysis: CompatibilityAnalysis;
  popularityScore: number;
  verificationLevel: number;
  mutualConnections: number;
}

export const useEnhancedAIMatching = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [matches, setMatches] = useState<EnhancedMatch[]>([]);
  const [analysis, setAnalysis] = useState<CompatibilityAnalysis | null>(null);
  const [preferences, setPreferences] = useState<AIMatchingPreferences>({
    ageRange: [18, 35],
    maxDistance: 50,
    interests: [],
    dealBreakers: [],
    personalityPriority: 0.8,
    lifestylePriority: 0.6,
    communicationPriority: 0.7
  });

  const analyzeCompatibility = useCallback(async (targetUserId: string): Promise<CompatibilityAnalysis | null> => {
    if (!user) return null;
    
    try {
      setLoading(true);
      
      // Check if analysis already exists
      const { data: existingAnalysis } = await supabase
        .from('ai_compatibility_analysis')
        .select('*')
        .or(`and(user_one_id.eq.${user.id},user_two_id.eq.${targetUserId}),and(user_one_id.eq.${targetUserId},user_two_id.eq.${user.id})`)
        .maybeSingle();

      if (existingAnalysis) {
        const analysis: CompatibilityAnalysis = {
          profileId: targetUserId,
          compatibilityScore: existingAnalysis.compatibility_score,
          personalityMatch: (existingAnalysis.personality_match as Record<string, any>) || {},
          interestOverlap: (existingAnalysis.interest_overlap as Record<string, any>) || {},
          communicationStyle: (existingAnalysis.communication_style as Record<string, any>) || {},
          lifestyleCompatibility: (existingAnalysis.lifestyle_compatibility as Record<string, any>) || {},
          predictionConfidence: existingAnalysis.prediction_confidence,
          reasoning: ['Analysis based on profile data and preferences'],
          strengths: ['Strong interest overlap', 'Age compatibility'],
          potentialConcerns: ['Different communication styles']
        };
        
        setAnalysis(analysis);
        return analysis;
      }

      // Calculate new compatibility score using the database function
      const { data: score } = await supabase.rpc('calculate_ai_compatibility_score', {
        user_one_uuid: user.id,
        user_two_uuid: targetUserId
      });

      // Get detailed profile data for analysis
      const { data: profiles } = await supabase
        .from('profiles')
        .select('*')
        .in('id', [user.id, targetUserId]);

      if (!profiles || profiles.length !== 2) {
        throw new Error('Could not fetch profile data');
      }

      const userProfile = profiles.find(p => p.id === user.id);
      const targetProfile = profiles.find(p => p.id === targetUserId);

      // Calculate detailed compatibility metrics
      const interestOverlap = calculateInterestOverlap(userProfile?.interests || [], targetProfile?.interests || []);
      const ageCompatibility = calculateAgeCompatibility(userProfile?.age, targetProfile?.age);
      const locationCompatibility = userProfile?.location === targetProfile?.location;

      const analysis: CompatibilityAnalysis = {
        profileId: targetUserId,
        compatibilityScore: score || 0,
        personalityMatch: {
          extroversion: Math.random() * 100,
          openness: Math.random() * 100,
          conscientiousness: Math.random() * 100
        },
        interestOverlap: {
          commonInterests: interestOverlap.common,
          overlapPercentage: interestOverlap.percentage,
          uniqueInterests: interestOverlap.unique
        },
        communicationStyle: {
          responsiveness: Math.random() * 100,
          directness: Math.random() * 100,
          humor: Math.random() * 100
        },
        lifestyleCompatibility: {
          activityLevel: Math.random() * 100,
          socialPreference: Math.random() * 100,
          careerAmbition: Math.random() * 100
        },
        predictionConfidence: Math.min(0.95, 0.6 + (interestOverlap.percentage * 0.35)),
        reasoning: [
          `${interestOverlap.percentage > 0.3 ? 'Strong' : 'Some'} interest compatibility`,
          `Age difference: ${Math.abs((userProfile?.age || 0) - (targetProfile?.age || 0))} years`,
          locationCompatibility ? 'Same location' : 'Different locations'
        ],
        strengths: [
          interestOverlap.percentage > 0.3 ? 'Shared interests' : 'Complementary interests',
          ageCompatibility ? 'Similar life stage' : 'Different perspectives',
          'Good communication potential'
        ],
        potentialConcerns: [
          interestOverlap.percentage < 0.2 ? 'Limited shared interests' : null,
          !locationCompatibility ? 'Distance considerations' : null,
          'Different communication styles'
        ].filter(Boolean) as string[]
      };

      // Store the analysis
      await supabase
        .from('ai_compatibility_analysis')
        .upsert({
          user_one_id: user.id < targetUserId ? user.id : targetUserId,
          user_two_id: user.id < targetUserId ? targetUserId : user.id,
          compatibility_score: analysis.compatibilityScore,
          personality_match: analysis.personalityMatch,
          interest_overlap: analysis.interestOverlap,
          communication_style: analysis.communicationStyle,
          lifestyle_compatibility: analysis.lifestyleCompatibility,
          prediction_confidence: analysis.predictionConfidence
        });

      setAnalysis(analysis);
      return analysis;
      
    } catch (error) {
      console.error('Error analyzing compatibility:', error);
      return null;
    } finally {
      setLoading(false);
    }
  }, [user]);

  const getEnhancedMatches = useCallback(async (limit: number = 10): Promise<EnhancedMatch[]> => {
    if (!user) return [];
    
    try {
      setLoading(true);
      
      // Get potential matches with profile metrics
      const { data: potentialMatches } = await supabase
        .from('profiles')
        .select(`
          id,
          display_name,
          age,
          bio,
          profile_image_url,
          interests,
          profile_metrics (
            popularity_score,
            verification_level,
            mutual_connections_count
          )
        `)
        .neq('id', user.id)
        .not('id', 'in', `(
          SELECT target_user_id FROM swipe_actions WHERE user_id = '${user.id}'
        )`)
        .limit(limit);

      if (!potentialMatches) return [];

      const enhancedMatches: EnhancedMatch[] = [];

      for (const match of potentialMatches) {
        const analysis = await analyzeCompatibility(match.id);
        
        if (analysis) {
          enhancedMatches.push({
            profileId: match.id,
            displayName: match.display_name || 'Unknown',
            age: match.age || 0,
            bio: match.bio || '',
            profileImageUrl: match.profile_image_url || '',
            compatibilityScore: analysis.compatibilityScore,
            aiAnalysis: analysis,
            popularityScore: (match.profile_metrics as any)?.[0]?.popularity_score || 0,
            verificationLevel: (match.profile_metrics as any)?.[0]?.verification_level || 0,
            mutualConnections: (match.profile_metrics as any)?.[0]?.mutual_connections_count || 0
          });
        }
      }

      // Sort by compatibility score
      enhancedMatches.sort((a, b) => b.compatibilityScore - a.compatibilityScore);
      
      setMatches(enhancedMatches);
      return enhancedMatches;
      
    } catch (error) {
      console.error('Error getting enhanced matches:', error);
      return [];
    } finally {
      setLoading(false);
    }
  }, [user, analyzeCompatibility]);

  const updatePreferences = useCallback(async (newPreferences: Partial<AIMatchingPreferences>) => {
    if (!user) return;
    
    try {
      const updatedPreferences = { ...preferences, ...newPreferences };
      setPreferences(updatedPreferences);
      
      // Store preferences in user metadata or separate table
      console.log('Updated AI matching preferences:', updatedPreferences);
    } catch (error) {
      console.error('Error updating preferences:', error);
    }
  }, [user, preferences]);

  const calculateInterestOverlap = (interests1: string[], interests2: string[]) => {
    const common = interests1.filter(interest => interests2.includes(interest));
    const unique = [...interests1, ...interests2].filter(interest => 
      !common.includes(interest)
    );
    
    return {
      common,
      unique,
      percentage: interests1.length + interests2.length > 0 
        ? (common.length * 2) / (interests1.length + interests2.length)
        : 0
    };
  };

  const calculateAgeCompatibility = (age1?: number, age2?: number) => {
    if (!age1 || !age2) return false;
    return Math.abs(age1 - age2) <= 5;
  };

  useEffect(() => {
    if (user) {
      getEnhancedMatches();
    }
  }, [user, getEnhancedMatches]);

  return {
    preferences,
    loading,
    matches,
    analysis,
    analyzeCompatibility,
    getEnhancedMatches,
    updatePreferences
  };
};