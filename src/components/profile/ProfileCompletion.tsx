import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { 
  User, 
  Camera, 
  Heart, 
  MapPin, 
  Settings,
  CheckCircle,
  AlertCircle 
} from 'lucide-react';

interface ProfileCompletionProps {
  onEditProfile: () => void;
}

interface CompletionItem {
  id: string;
  label: string;
  completed: boolean;
  icon: React.ComponentType<{ className?: string }>;
  description: string;
}

export const ProfileCompletion = ({ onEditProfile }: ProfileCompletionProps) => {
  const { user } = useAuth();
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    const loadProfile = async () => {
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();

        if (error && error.code !== 'PGRST116') {
          console.error('Error loading profile:', error);
          return;
        }

        setProfile(data);
      } catch (error) {
        console.error('Error:', error);
      } finally {
        setLoading(false);
      }
    };

    loadProfile();
  }, [user]);

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-muted rounded w-1/2"></div>
            <div className="h-2 bg-muted rounded"></div>
            <div className="space-y-2">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-12 bg-muted rounded"></div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const completionItems: CompletionItem[] = [
    {
      id: 'name',
      label: 'Add your name',
      completed: !!(profile?.display_name?.trim()),
      icon: User,
      description: 'Help others know what to call you'
    },
    {
      id: 'photo',
      label: 'Upload profile photos',
      completed: !!(profile?.profile_images?.length > 0),
      icon: Camera,
      description: 'Add at least one photo to get more matches'
    },
    {
      id: 'bio',
      label: 'Write a bio',
      completed: !!(profile?.bio?.trim()),
      icon: Heart,
      description: 'Tell others about yourself'
    },
    {
      id: 'location',
      label: 'Add your location',
      completed: !!(profile?.location?.trim()),
      icon: MapPin,
      description: 'Find people near you'
    },
    {
      id: 'interests',
      label: 'Add interests',
      completed: !!(profile?.interests?.length > 0),
      icon: Heart,
      description: 'Show what you\'re passionate about'
    },
    {
      id: 'privacy',
      label: 'Set privacy preferences',
      completed: !!(profile?.privacy_settings),
      icon: Settings,
      description: 'Control who can see your information'
    }
  ];

  const completedCount = completionItems.filter(item => item.completed).length;
  const completionPercentage = Math.round((completedCount / completionItems.length) * 100);

  const getCompletionLevel = () => {
    if (completionPercentage === 100) return { label: 'Complete', color: 'bg-green-500', variant: 'default' as const };
    if (completionPercentage >= 75) return { label: 'Almost There', color: 'bg-blue-500', variant: 'default' as const };
    if (completionPercentage >= 50) return { label: 'Good Start', color: 'bg-yellow-500', variant: 'secondary' as const };
    return { label: 'Getting Started', color: 'bg-red-500', variant: 'destructive' as const };
  };

  const level = getCompletionLevel();

  return (
    <Card>
      <CardContent className="p-6">
        <div className="space-y-6">
          {/* Header */}
          <div className="text-center space-y-2">
            <h3 className="text-xl font-semibold">Complete Your Profile</h3>
            <p className="text-muted-foreground">
              A complete profile gets 3x more matches!
            </p>
          </div>

          {/* Progress */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Profile Strength</span>
              <Badge variant={level.variant}>
                {level.label}
              </Badge>
            </div>
            <Progress value={completionPercentage} className="h-3" />
            <div className="text-center text-sm text-muted-foreground">
              {completedCount} of {completionItems.length} completed ({completionPercentage}%)
            </div>
          </div>

          {/* Completion Items */}
          <div className="space-y-3">
            {completionItems.map((item) => {
              const Icon = item.icon;
              return (
                <div
                  key={item.id}
                  className={`flex items-center gap-3 p-3 rounded-lg border transition-colors ${
                    item.completed 
                      ? 'bg-green-50 border-green-200 dark:bg-green-950 dark:border-green-800' 
                      : 'bg-muted/50 border-border hover:bg-muted'
                  }`}
                >
                  <div className={`p-2 rounded-full ${
                    item.completed ? 'bg-green-500 text-white' : 'bg-muted text-muted-foreground'
                  }`}>
                    {item.completed ? (
                      <CheckCircle className="w-4 h-4" />
                    ) : (
                      <Icon className="w-4 h-4" />
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className={`font-medium ${
                        item.completed ? 'text-green-700 dark:text-green-300' : 'text-foreground'
                      }`}>
                        {item.label}
                      </span>
                      {item.completed && (
                        <Badge variant="outline" className="text-xs border-green-200 text-green-700">
                          Done
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {item.description}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Action Button */}
          <Button 
            onClick={onEditProfile} 
            className="w-full"
            size="lg"
          >
            {completionPercentage === 100 ? 'Edit Profile' : 'Complete Profile'}
          </Button>

          {/* Tips */}
          {completionPercentage < 100 && (
            <div className="bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
              <div className="flex items-start gap-2">
                <AlertCircle className="w-5 h-5 text-blue-500 mt-0.5" />
                <div className="space-y-1">
                  <h4 className="font-medium text-blue-900 dark:text-blue-100">
                    Pro Tip
                  </h4>
                  <p className="text-sm text-blue-700 dark:text-blue-300">
                    {completionPercentage < 50 
                      ? "Start with adding photos and writing a bio - these have the biggest impact!"
                      : "You're almost there! Complete the remaining items to maximize your visibility."
                    }
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};