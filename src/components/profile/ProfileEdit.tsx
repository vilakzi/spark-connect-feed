import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { ImageUpload } from './ImageUpload';
import { InterestTags } from './InterestTags';
import { LocationSettings } from './LocationSettings';
import { DiscoverySettings } from './DiscoverySettings';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, Save, User, Camera, Heart, Settings, MapPin, Search, Shield } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ProfileFormData {
  display_name: string;
  bio: string;
  age: number;
  location: string;
  gender: string;
  interests: string[];
  profile_images: string[];
  privacy_settings: {
    showContact: boolean;
    showLastSeen: boolean;
    showLocation: boolean;
    allowMessages: boolean;
    showOnlineStatus: boolean;
    profileVisibility: 'public' | 'private';
  };
}

interface ProfileEditProps {
  onBack: () => void;
}

const defaultPrivacySettings = {
  showContact: false,
  showLastSeen: true,
  showLocation: true,
  allowMessages: true,
  showOnlineStatus: true,
  profileVisibility: 'public' as const
};

export const ProfileEdit = ({ onBack }: ProfileEditProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [activeSection, setActiveSection] = useState<'basic' | 'photos' | 'interests' | 'location' | 'discovery' | 'privacy'>('basic');
  
  const [formData, setFormData] = useState<ProfileFormData>({
    display_name: '',
    bio: '',
    age: 18,
    location: '',
    gender: '',
    interests: [],
    profile_images: [],
    privacy_settings: defaultPrivacySettings
  });

  // Load existing profile data
  useEffect(() => {
    if (!user) return;

    const loadProfile = async () => {
      setLoading(true);
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

        if (data) {
          setFormData({
            display_name: data.display_name || '',
            bio: data.bio || '',
            age: data.age || 18,
            location: data.location || '',
            gender: data.gender || '',
            interests: data.interests || [],
            profile_images: data.profile_images || [],
            privacy_settings: typeof data.privacy_settings === 'object' && data.privacy_settings
              ? { ...defaultPrivacySettings, ...data.privacy_settings }
              : defaultPrivacySettings
          });
        }
      } catch (error) {
        console.error('Error:', error);
      } finally {
        setLoading(false);
      }
    };

    loadProfile();
  }, [user]);

  const updateFormData = (updates: Partial<ProfileFormData>) => {
    setFormData(prev => ({ ...prev, ...updates }));
  };

  const updatePrivacySettings = (updates: Partial<ProfileFormData['privacy_settings']>) => {
    setFormData(prev => ({
      ...prev,
      privacy_settings: { ...prev.privacy_settings, ...updates }
    }));
  };

  const saveProfile = async () => {
    if (!user) return;

    setSaving(true);
    try {
      const profileData = {
        display_name: formData.display_name,
        bio: formData.bio,
        age: formData.age,
        location: formData.location,
        gender: formData.gender,
        interests: formData.interests,
        profile_images: formData.profile_images,
        profile_image_url: formData.profile_images[0] || null,
        privacy_settings: formData.privacy_settings,
        updated_at: new Date().toISOString()
      };

      const { error } = await supabase
        .from('profiles')
        .upsert({ id: user.id, ...profileData });

      if (error) {
        throw error;
      }

      toast({
        title: "Profile saved!",
        description: "Your profile has been updated successfully"
      });
    } catch (error) {
      console.error('Error saving profile:', error);
      toast({
        title: "Save failed",
        description: "Could not save profile. Please try again.",
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };

  const getCompletionPercentage = () => {
    let completed = 0;
    const total = 6;

    if (formData.display_name.trim()) completed++;
    if (formData.bio.trim()) completed++;
    if (formData.age > 0) completed++;
    if (formData.location.trim()) completed++;
    if (formData.profile_images.length > 0) completed++;
    if (formData.interests.length > 0) completed++;

    return Math.round((completed / total) * 100);
  };

  const sections = [
    { id: 'basic' as const, label: 'Basic Info', icon: User },
    { id: 'photos' as const, label: 'Photos', icon: Camera },
    { id: 'interests' as const, label: 'Interests', icon: Heart },
    { id: 'location' as const, label: 'Location', icon: MapPin },
    { id: 'discovery' as const, label: 'Discovery', icon: Search },
    { id: 'privacy' as const, label: 'Privacy', icon: Shield }
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-sm border-b border-border">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <Button variant="ghost" onClick={onBack}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          
          <div className="flex items-center gap-4">
            <div className="text-sm">
              <span className="text-muted-foreground">Profile: </span>
              <span className="font-medium">{getCompletionPercentage()}% complete</span>
            </div>
            <Button onClick={saveProfile} disabled={saving}>
              <Save className="w-4 h-4 mr-2" />
              {saving ? 'Saving...' : 'Save'}
            </Button>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Section Navigation */}
          <Card className="lg:col-span-1 h-fit">
            <CardContent className="p-4">
              <nav className="space-y-1">
                {sections.map(section => {
                  const Icon = section.icon;
                  return (
                    <Button
                      key={section.id}
                      variant={activeSection === section.id ? "default" : "ghost"}
                      className="w-full justify-start"
                      onClick={() => setActiveSection(section.id)}
                    >
                      <Icon className="w-4 h-4 mr-2" />
                      {section.label}
                    </Button>
                  );
                })}
              </nav>
            </CardContent>
          </Card>

          {/* Content */}
          <div className="lg:col-span-3">
            {activeSection === 'basic' && (
              <Card>
                <CardHeader>
                  <CardTitle>Basic Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="display_name">Display Name *</Label>
                      <Input
                        id="display_name"
                        value={formData.display_name}
                        onChange={(e) => updateFormData({ display_name: e.target.value })}
                        placeholder="Your name"
                      />
                    </div>
                    <div>
                      <Label htmlFor="age">Age *</Label>
                      <Input
                        id="age"
                        type="number"
                        min="18"
                        max="100"
                        value={formData.age}
                        onChange={(e) => updateFormData({ age: parseInt(e.target.value) || 18 })}
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="bio">Bio</Label>
                    <Textarea
                      id="bio"
                      value={formData.bio}
                      onChange={(e) => updateFormData({ bio: e.target.value })}
                      placeholder="Tell others about yourself..."
                      rows={4}
                      maxLength={500}
                    />
                    <div className="text-sm text-muted-foreground mt-1">
                      {formData.bio.length}/500 characters
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="location">Location</Label>
                      <div className="relative">
                        <MapPin className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                        <Input
                          id="location"
                          value={formData.location}
                          onChange={(e) => updateFormData({ location: e.target.value })}
                          placeholder="City, Country"
                          className="pl-10"
                        />
                      </div>
                    </div>
                    <div>
                      <Label htmlFor="gender">Gender</Label>
                      <Select value={formData.gender} onValueChange={(value) => updateFormData({ gender: value })}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select gender" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="male">Male</SelectItem>
                          <SelectItem value="female">Female</SelectItem>
                          <SelectItem value="non-binary">Non-binary</SelectItem>
                          <SelectItem value="prefer-not-to-say">Prefer not to say</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {activeSection === 'photos' && (
              <Card>
                <CardHeader>
                  <CardTitle>Profile Photos</CardTitle>
                </CardHeader>
                <CardContent>
                  <ImageUpload
                    currentImages={formData.profile_images}
                    onImagesChange={(images) => updateFormData({ profile_images: images })}
                    maxImages={6}
                  />
                </CardContent>
              </Card>
            )}

            {activeSection === 'interests' && (
              <Card>
                <CardHeader>
                  <CardTitle>Interests & Hobbies</CardTitle>
                </CardHeader>
                <CardContent>
                  <InterestTags
                    selectedInterests={formData.interests}
                    onInterestsChange={(interests) => updateFormData({ interests })}
                    maxInterests={10}
                  />
                </CardContent>
              </Card>
            )}

            {activeSection === 'location' && <LocationSettings />}
            
            {activeSection === 'discovery' && <DiscoverySettings />}

            {activeSection === 'privacy' && (
              <Card>
                <CardHeader>
                  <CardTitle>Privacy Settings</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <Label>Profile Visibility</Label>
                        <p className="text-sm text-muted-foreground">
                          Control who can see your profile
                        </p>
                      </div>
                      <Select 
                        value={formData.privacy_settings.profileVisibility} 
                        onValueChange={(value: 'public' | 'private') => 
                          updatePrivacySettings({ profileVisibility: value })
                        }
                      >
                        <SelectTrigger className="w-32">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="public">Public</SelectItem>
                          <SelectItem value="private">Private</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <Separator />

                    <div className="flex items-center justify-between">
                      <div>
                        <Label>Show Online Status</Label>
                        <p className="text-sm text-muted-foreground">
                          Let others see when you're online
                        </p>
                      </div>
                      <Switch
                        checked={formData.privacy_settings.showOnlineStatus}
                        onCheckedChange={(checked) => updatePrivacySettings({ showOnlineStatus: checked })}
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <Label>Show Last Seen</Label>
                        <p className="text-sm text-muted-foreground">
                          Show when you were last active
                        </p>
                      </div>
                      <Switch
                        checked={formData.privacy_settings.showLastSeen}
                        onCheckedChange={(checked) => updatePrivacySettings({ showLastSeen: checked })}
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <Label>Show Location</Label>
                        <p className="text-sm text-muted-foreground">
                          Display your location on your profile
                        </p>
                      </div>
                      <Switch
                        checked={formData.privacy_settings.showLocation}
                        onCheckedChange={(checked) => updatePrivacySettings({ showLocation: checked })}
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <Label>Allow Messages</Label>
                        <p className="text-sm text-muted-foreground">
                          Let matches send you messages
                        </p>
                      </div>
                      <Switch
                        checked={formData.privacy_settings.allowMessages}
                        onCheckedChange={(checked) => updatePrivacySettings({ allowMessages: checked })}
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <Label>Show Contact Info</Label>
                        <p className="text-sm text-muted-foreground">
                          Display contact information to matches
                        </p>
                      </div>
                      <Switch
                        checked={formData.privacy_settings.showContact}
                        onCheckedChange={(checked) => updatePrivacySettings({ showContact: checked })}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};