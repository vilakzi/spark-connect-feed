import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';
import { 
  Eye, 
  TrendingUp, 
  TrendingDown, 
  Users, 
  Shield, 
  Star,
  Activity,
  MessageSquare
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

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

interface ProfileMetrics {
  popularityScore: number;
  engagementRate: number;
  responseRate: number;
  verificationLevel: number;
  socialProofCount: number;
  mutualConnectionsCount: number;
  communityParticipationScore: number;
}

interface SocialProofDisplayProps {
  socialProofData: SocialProofData;
  metrics: ProfileMetrics;
  isOwnProfile?: boolean;
}

export const SocialProofDisplay: React.FC<SocialProofDisplayProps> = ({
  socialProofData,
  metrics,
  isOwnProfile = false
}) => {
  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'rising':
        return <TrendingUp className="h-4 w-4 text-green-500" />;
      case 'declining':
        return <TrendingDown className="h-4 w-4 text-red-500" />;
      default:
        return <Activity className="h-4 w-4 text-blue-500" />;
    }
  };

  const getSocialScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-blue-600';
    if (score >= 40) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getVerificationColor = (level: number) => {
    if (level >= 4) return 'text-green-600';
    if (level >= 2) return 'text-blue-600';
    return 'text-gray-600';
  };

  return (
    <div className="space-y-4">
      {/* Social Score Overview */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Star className="h-5 w-5" />
            Social Profile Score
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className={`text-2xl font-bold ${getSocialScoreColor(socialProofData.socialScore)}`}>
                {socialProofData.socialScore}
              </span>
              <div className="flex items-center gap-1">
                {getTrendIcon(socialProofData.popularityTrend)}
                <span className="text-sm text-muted-foreground capitalize">
                  {socialProofData.popularityTrend}
                </span>
              </div>
            </div>
            
            <Progress value={socialProofData.socialScore} className="h-2" />
            
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="space-y-1">
                <div className="flex items-center gap-1">
                  <Shield className={`h-3 w-3 ${getVerificationColor(metrics.verificationLevel)}`} />
                  <span>Verification Level</span>
                </div>
                <div className="text-muted-foreground">
                  {metrics.verificationLevel}/5
                </div>
              </div>
              
              <div className="space-y-1">
                <div className="flex items-center gap-1">
                  <Users className="h-3 w-3" />
                  <span>Connections</span>
                </div>
                <div className="text-muted-foreground">
                  {metrics.mutualConnectionsCount}
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Profile Metrics */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">Profile Activity</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm">Popularity</span>
                  <span className="text-sm font-medium">{Math.round(metrics.popularityScore)}</span>
                </div>
                <Progress value={metrics.popularityScore} className="h-1" />
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm">Engagement</span>
                  <span className="text-sm font-medium">{Math.round(metrics.engagementRate * 100)}%</span>
                </div>
                <Progress value={metrics.engagementRate * 100} className="h-1" />
              </div>
            </div>
            
            <div className="flex items-center justify-between py-2 border-t">
              <div className="flex items-center gap-1">
                <MessageSquare className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">Response Rate</span>
              </div>
              <span className="text-sm font-medium">
                {Math.round(metrics.responseRate * 100)}%
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Profile Views */}
      {isOwnProfile && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Eye className="h-5 w-5" />
              Profile Views
              <Badge variant="secondary">{socialProofData.profileViews}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {socialProofData.recentViewers.length > 0 ? (
              <div className="space-y-3">
                <h4 className="text-sm font-medium">Recent Viewers</h4>
                <div className="space-y-2">
                  {socialProofData.recentViewers.slice(0, 5).map((viewer) => (
                    <div key={viewer.id} className="flex items-center gap-3">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={viewer.profileImageUrl} alt={viewer.displayName} />
                        <AvatarFallback className="text-xs">
                          {viewer.displayName.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium truncate">
                          {viewer.displayName}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {formatDistanceToNow(new Date(viewer.viewedAt), { addSuffix: true })}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                
                {socialProofData.recentViewers.length > 5 && (
                  <div className="text-xs text-muted-foreground text-center pt-2 border-t">
                    +{socialProofData.recentViewers.length - 5} more viewers
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-4 text-muted-foreground">
                <Eye className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No recent profile views</p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Verification Badges */}
      {socialProofData.verificationBadges.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Shield className="h-5 w-5" />
              Verifications
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {socialProofData.verificationBadges.map((badge) => (
                <Badge key={badge} variant="outline" className="capitalize">
                  {badge.replace('_', ' ')}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};