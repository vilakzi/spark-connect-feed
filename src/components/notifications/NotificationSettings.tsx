import { useState, useEffect } from 'react';
import { Bell, Smartphone, Mail, Heart, Eye, Star, Camera, MessageCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAdvancedNotifications } from '@/hooks/useAdvancedNotifications';
import { cn } from '@/lib/utils';

export const NotificationSettings = () => {
  const { 
    preferences, 
    loading, 
    pushSupported, 
    updatePreferences, 
    requestPushPermission 
  } = useAdvancedNotifications();
  const [hasRequestedPermission, setHasRequestedPermission] = useState(false);

  const notificationTypes = [
    {
      key: 'new_matches' as keyof typeof preferences,
      label: 'New Matches',
      description: 'When someone likes you back',
      icon: Heart,
      color: 'text-red-500'
    },
    {
      key: 'new_messages' as keyof typeof preferences,
      label: 'New Messages',
      description: 'When you receive a message',
      icon: MessageCircle,
      color: 'text-blue-500'
    },
    {
      key: 'profile_views' as keyof typeof preferences,
      label: 'Profile Views',
      description: 'When someone views your profile',
      icon: Eye,
      color: 'text-purple-500'
    },
    {
      key: 'super_likes' as keyof typeof preferences,
      label: 'Super Likes',
      description: 'When someone super likes you',
      icon: Star,
      color: 'text-yellow-500'
    },
    {
      key: 'stories' as keyof typeof preferences,
      label: 'Stories',
      description: 'When someone posts a new story',
      icon: Camera,
      color: 'text-pink-500'
    },
    {
      key: 'marketing' as keyof typeof preferences,
      label: 'Marketing & Tips',
      description: 'Dating tips and app updates',
      icon: Bell,
      color: 'text-green-500'
    }
  ];

  const handleToggle = async (key: keyof typeof preferences) => {
    const newValue = !preferences[key];
    await updatePreferences({ [key]: newValue });
  };

  const handlePushPermissionRequest = async () => {
    const granted = await requestPushPermission();
    setHasRequestedPermission(true);
    if (!granted) {
      console.log('Push permission denied');
    }
  };

  useEffect(() => {
    // Check if permission was already granted
    if ('Notification' in window) {
      setHasRequestedPermission(Notification.permission !== 'default');
    }
  }, []);

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Push Notifications Setup */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Smartphone className="w-5 h-5" />
            Push Notifications
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <p className="font-medium">Browser Notifications</p>
                {pushSupported ? (
                  <Badge variant="secondary" className="text-xs">
                    Supported
                  </Badge>
                ) : (
                  <Badge variant="destructive" className="text-xs">
                    Not Supported
                  </Badge>
                )}
              </div>
              <p className="text-sm text-muted-foreground">
                Get instant notifications even when the app is closed
              </p>
            </div>
            <div className="flex items-center gap-2">
              {pushSupported && !hasRequestedPermission && (
                <Button onClick={handlePushPermissionRequest} size="sm">
                  Enable
                </Button>
              )}
              <Switch
                checked={preferences.push_enabled}
                onCheckedChange={() => handleToggle('push_enabled')}
                disabled={!pushSupported}
              />
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Email Notifications</p>
              <p className="text-sm text-muted-foreground">
                Important updates sent to your email
              </p>
            </div>
            <Switch
              checked={preferences.email_enabled}
              onCheckedChange={() => handleToggle('email_enabled')}
            />
          </div>
        </CardContent>
      </Card>

      {/* Notification Types */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="w-5 h-5" />
            Notification Types
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {notificationTypes.map((type) => {
            const Icon = type.icon;
            return (
              <div key={type.key} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={cn("p-2 rounded-full bg-muted", type.color)}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="font-medium">{type.label}</p>
                    <p className="text-sm text-muted-foreground">{type.description}</p>
                  </div>
                </div>
                <Switch
                  checked={preferences[type.key] as boolean}
                  onCheckedChange={() => handleToggle(type.key)}
                />
              </div>
            );
          })}
        </CardContent>
      </Card>

      {/* Notification Preview */}
      <Card>
        <CardHeader>
          <CardTitle>Notification Style</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="p-3 bg-primary/10 rounded-lg border border-primary/20">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center">
                  <Heart className="w-5 h-5 text-primary-foreground" />
                </div>
                <div>
                  <p className="font-medium text-sm">New Match! 💕</p>
                  <p className="text-sm text-muted-foreground">You have a new match with Sarah</p>
                </div>
              </div>
            </div>
            <p className="text-xs text-muted-foreground">
              This is how notifications will appear in your browser
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};