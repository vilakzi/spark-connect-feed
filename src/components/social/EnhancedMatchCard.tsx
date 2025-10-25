import React from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';
import { Heart, MessageCircle, Shield, Users, Star } from 'lucide-react';

interface EnhancedMatch {
  profileId: string;
  displayName: string;
  age: number;
  bio: string;
  profileImageUrl: string;
  compatibilityScore: number;
  aiAnalysis: {
    reasoning: string[];
    strengths: string[];
    potentialConcerns: string[];
    predictionConfidence: number;
  };
  popularityScore: number;
  verificationLevel: number;
  mutualConnections: number;
}

interface EnhancedMatchCardProps {
  match: EnhancedMatch;
  onLike?: (profileId: string) => void;
  onMessage?: (profileId: string) => void;
  onViewDetails?: (profileId: string) => void;
}

export const EnhancedMatchCard: React.FC<EnhancedMatchCardProps> = ({
  match,
  onLike,
  onMessage,
  onViewDetails
}) => {
  const getCompatibilityLevel = (score: number) => {
    if (score >= 80) return { level: 'Excellent', color: 'bg-green-500' };
    if (score >= 60) return { level: 'Good', color: 'bg-blue-500' };
    if (score >= 40) return { level: 'Fair', color: 'bg-yellow-500' };
    return { level: 'Low', color: 'bg-red-500' };
  };

  const compatibility = getCompatibilityLevel(match.compatibilityScore);

  return (
    <Card className="w-full max-w-md mx-auto hover:shadow-lg transition-shadow duration-200">
      <CardHeader className="pb-3">
        <div className="flex items-start gap-3">
          <Avatar className="h-16 w-16">
            <AvatarImage src={match.profileImageUrl} alt={match.displayName} />
            <AvatarFallback>{match.displayName.charAt(0)}</AvatarFallback>
          </Avatar>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="font-semibold text-lg truncate">{match.displayName}</h3>
              <span className="text-muted-foreground">{match.age}</span>
              {match.verificationLevel > 0 && (
                <Shield className="h-4 w-4 text-blue-500" />
              )}
            </div>
            
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-1">
                <Star className="h-3 w-3" />
                <span>{match.popularityScore}</span>
              </div>
              {match.mutualConnections > 0 && (
                <div className="flex items-center gap-1">
                  <Users className="h-3 w-3" />
                  <span>{match.mutualConnections} mutual</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Compatibility Score */}
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium">Compatibility</span>
            <Badge variant="secondary" className={`${compatibility.color} text-white`}>
              {compatibility.level} ({match.compatibilityScore}%)
            </Badge>
          </div>
          <Progress value={match.compatibilityScore} className="h-2" />
          <div className="text-xs text-muted-foreground">
            Confidence: {Math.round(match.aiAnalysis.predictionConfidence * 100)}%
          </div>
        </div>

        {/* Bio */}
        {match.bio && (
          <p className="text-sm text-muted-foreground line-clamp-2">{match.bio}</p>
        )}

        {/* AI Analysis Highlights */}
        <div className="space-y-2">
          <h4 className="text-sm font-medium">Why we matched you:</h4>
          <ul className="text-xs space-y-1">
            {match.aiAnalysis.strengths.slice(0, 2).map((strength, index) => (
              <li key={index} className="flex items-start gap-1">
                <div className="w-1 h-1 bg-green-500 rounded-full mt-2 flex-shrink-0" />
                <span className="text-muted-foreground">{strength}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Reasoning */}
        {match.aiAnalysis.reasoning.length > 0 && (
          <div className="text-xs text-muted-foreground border-t pt-2">
            <span className="font-medium">Match factors: </span>
            {match.aiAnalysis.reasoning.slice(0, 2).join(', ')}
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-2 pt-2">
          <Button
            variant="outline"
            size="sm"
            className="flex-1"
            onClick={() => onMessage?.(match.profileId)}
          >
            <MessageCircle className="h-4 w-4 mr-1" />
            Message
          </Button>
          <Button
            size="sm"
            className="flex-1"
            onClick={() => onLike?.(match.profileId)}
          >
            <Heart className="h-4 w-4 mr-1" />
            Like
          </Button>
        </div>

        {/* View Details */}
        <Button
          variant="ghost"
          size="sm"
          className="w-full text-xs"
          onClick={() => onViewDetails?.(match.profileId)}
        >
          View detailed analysis
        </Button>
      </CardContent>
    </Card>
  );
};