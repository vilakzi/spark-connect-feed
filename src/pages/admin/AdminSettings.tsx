import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { useState } from 'react';
import { toast } from '@/hooks/use-toast';
import { 
  Settings as SettingsIcon, 
  Shield, 
  Bell, 
  Database,
  Mail,
  Users,
  Save,
  AlertTriangle
} from 'lucide-react';

export const AdminSettings = () => {
  const [settings, setSettings] = useState({
    platformName: 'ConnectsBuddy',
    enableSignups: true,
    enableNotifications: true,
    autoApproveContent: false,
    enableEmailVerification: true,
    maxFileSize: '10',
    sessionTimeout: '24',
    enableTwoFactor: false
  });

  const handleSave = () => {
    toast({
      title: "Settings saved",
      description: "Platform settings have been updated successfully"
    });
  };

  const handleReset = () => {
    setSettings({
      platformName: 'ConnectsBuddy',
      enableSignups: true,
      enableNotifications: true,
      autoApproveContent: false,
      enableEmailVerification: true,
      maxFileSize: '10',
      sessionTimeout: '24',
      enableTwoFactor: false
    });
    
    toast({
      title: "Settings reset",
      description: "All settings have been reset to defaults"
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground">Admin Settings</h1>
        <p className="text-muted-foreground">Configure platform settings and preferences</p>
      </div>

      {/* Platform Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <SettingsIcon className="h-5 w-5" />
            Platform Configuration
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="platformName">Platform Name</Label>
            <Input
              id="platformName"
              value={settings.platformName}
              onChange={(e) => setSettings(prev => ({ ...prev, platformName: e.target.value }))}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Enable User Signups</Label>
              <p className="text-sm text-muted-foreground">
                Allow new users to register on the platform
              </p>
            </div>
            <Switch
              checked={settings.enableSignups}
              onCheckedChange={(checked) => 
                setSettings(prev => ({ ...prev, enableSignups: checked }))
              }
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Email Verification Required</Label>
              <p className="text-sm text-muted-foreground">
                Require email verification for new accounts
              </p>
            </div>
            <Switch
              checked={settings.enableEmailVerification}
              onCheckedChange={(checked) => 
                setSettings(prev => ({ ...prev, enableEmailVerification: checked }))
              }
            />
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="maxFileSize">Max File Size (MB)</Label>
              <Input
                id="maxFileSize"
                type="number"
                value={settings.maxFileSize}
                onChange={(e) => setSettings(prev => ({ ...prev, maxFileSize: e.target.value }))}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="sessionTimeout">Session Timeout (hours)</Label>
              <Input
                id="sessionTimeout"
                type="number"
                value={settings.sessionTimeout}
                onChange={(e) => setSettings(prev => ({ ...prev, sessionTimeout: e.target.value }))}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Security Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Security & Privacy
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Two-Factor Authentication</Label>
              <p className="text-sm text-muted-foreground">
                Require 2FA for admin accounts
              </p>
            </div>
            <Switch
              checked={settings.enableTwoFactor}
              onCheckedChange={(checked) => 
                setSettings(prev => ({ ...prev, enableTwoFactor: checked }))
              }
            />
          </div>

          <Separator />

          <div className="space-y-4">
            <h4 className="font-medium">Security Status</h4>
            <div className="grid gap-3">
              <div className="flex items-center justify-between">
                <span className="text-sm">RLS Policies</span>
                <Badge className="bg-green-500">Active</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">JWT Verification</span>
                <Badge className="bg-green-500">Active</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Database Encryption</span>
                <Badge className="bg-green-500">Active</Badge>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Content Moderation */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Content Moderation
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Auto-approve Content</Label>
              <p className="text-sm text-muted-foreground">
                Automatically approve new content submissions
              </p>
            </div>
            <Switch
              checked={settings.autoApproveContent}
              onCheckedChange={(checked) => 
                setSettings(prev => ({ ...prev, autoApproveContent: checked }))
              }
            />
          </div>

          {settings.autoApproveContent && (
            <div className="flex items-center gap-2 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <AlertTriangle className="h-4 w-4 text-yellow-600" />
              <p className="text-sm text-yellow-800">
                Auto-approval is enabled. Content will be published immediately without review.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Notifications */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Notifications
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>System Notifications</Label>
              <p className="text-sm text-muted-foreground">
                Enable platform-wide notifications
              </p>
            </div>
            <Switch
              checked={settings.enableNotifications}
              onCheckedChange={(checked) => 
                setSettings(prev => ({ ...prev, enableNotifications: checked }))
              }
            />
          </div>
        </CardContent>
      </Card>

      {/* Database Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            Database Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3">
            <div className="flex items-center justify-between">
              <span className="text-sm">Connection Status</span>
              <Badge className="bg-green-500">Connected</Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">Real-time Updates</span>
              <Badge className="bg-green-500">Active</Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">Backup Status</span>
              <Badge className="bg-green-500">Up to date</Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <div className="flex gap-4">
        <Button onClick={handleSave} className="flex items-center gap-2">
          <Save className="h-4 w-4" />
          Save Settings
        </Button>
        
        <Button variant="outline" onClick={handleReset}>
          Reset to Defaults
        </Button>
      </div>
    </div>
  );
};