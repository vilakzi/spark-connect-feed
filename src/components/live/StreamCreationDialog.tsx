import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Video, Settings, Users, DollarSign, Tag } from 'lucide-react';
import { useEnhancedLiveStream } from '@/hooks/useEnhancedLiveStream';
import { toast } from '@/hooks/use-toast';

interface StreamCreationDialogProps {
  onStreamCreated: (streamId: string) => void;
  children: React.ReactNode;
}

export const StreamCreationDialog = ({ onStreamCreated, children }: StreamCreationDialogProps) => {
  const { createStream } = useEnhancedLiveStream();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: 'Just Chatting',
    is_private: false,
    price_per_minute: 0,
    max_viewers: undefined as number | undefined,
    tags: [] as string[],
    quality_settings: {
      resolution: '720p',
      bitrate: 2500,
      fps: 30
    }
  });

  const [currentTag, setCurrentTag] = useState('');

  const categories = [
    'Just Chatting',
    'Gaming',
    'Music',
    'Art',
    'Fitness',
    'Cooking',
    'Travel',
    'Education',
    'Technology',
    'Entertainment'
  ];

  const qualityPresets = {
    '480p': { resolution: '480p', bitrate: 1000, fps: 30 },
    '720p': { resolution: '720p', bitrate: 2500, fps: 30 },
    '1080p': { resolution: '1080p', bitrate: 4500, fps: 30 },
    '1080p60': { resolution: '1080p', bitrate: 6000, fps: 60 }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim()) {
      toast({
        title: "Error",
        description: "Stream title is required",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const stream = await createStream(formData);
      onStreamCreated(stream.id);
      setOpen(false);
      toast({
        title: "Stream Created",
        description: "Your stream has been set up successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create stream",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const addTag = () => {
    if (currentTag.trim() && !formData.tags.includes(currentTag.trim())) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, currentTag.trim()]
      }));
      setCurrentTag('');
    }
  };

  const removeTag = (tagToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }));
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Video className="h-5 w-5" />
            <span>Create Live Stream</span>
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Stream Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">Stream Title *</Label>
                <Input
                  id="title"
                  placeholder="Enter a catchy title for your stream"
                  value={formData.title}
                  onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  placeholder="Tell viewers what your stream is about..."
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="category">Category</Label>
                <Select 
                  value={formData.category} 
                  onValueChange={(value) => setFormData(prev => ({ ...prev, category: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map(category => (
                      <SelectItem key={category} value={category}>
                        {category}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Tags</Label>
                <div className="flex space-x-2">
                  <Input
                    placeholder="Add a tag..."
                    value={currentTag}
                    onChange={(e) => setCurrentTag(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
                  />
                  <Button type="button" onClick={addTag} variant="outline" size="sm">
                    <Tag className="h-4 w-4" />
                  </Button>
                </div>
                {formData.tags.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {formData.tags.map(tag => (
                      <Badge key={tag} variant="secondary" className="cursor-pointer" onClick={() => removeTag(tag)}>
                        {tag} ×
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Privacy & Monetization */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center space-x-2">
                <Users className="h-5 w-5" />
                <span>Privacy & Monetization</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label>Private Stream</Label>
                  <p className="text-sm text-muted-foreground">Only invited viewers can join</p>
                </div>
                <Switch
                  checked={formData.is_private}
                  onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_private: checked }))}
                />
              </div>

              {formData.is_private && (
                <div className="space-y-2">
                  <Label htmlFor="price">Price per Minute ($)</Label>
                  <Input
                    id="price"
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="0.00"
                    value={formData.price_per_minute}
                    onChange={(e) => setFormData(prev => ({ ...prev, price_per_minute: parseFloat(e.target.value) || 0 }))}
                  />
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="max_viewers">Max Viewers (optional)</Label>
                <Input
                  id="max_viewers"
                  type="number"
                  min="1"
                  placeholder="Unlimited"
                  value={formData.max_viewers || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, max_viewers: parseInt(e.target.value) || undefined }))}
                />
              </div>
            </CardContent>
          </Card>

          {/* Quality Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center space-x-2">
                <Settings className="h-5 w-5" />
                <span>Stream Quality</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Quality Preset</Label>
                <Select 
                  value={formData.quality_settings.resolution} 
                  onValueChange={(value) => {
                    const preset = qualityPresets[value as keyof typeof qualityPresets];
                    if (preset) {
                      setFormData(prev => ({ ...prev, quality_settings: preset }));
                    }
                  }}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(qualityPresets).map(([key, preset]) => (
                      <SelectItem key={key} value={preset.resolution}>
                        {key} - {preset.bitrate} kbps, {preset.fps} FPS
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Resolution</Label>
                  <Input
                    value={formData.quality_settings.resolution}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      quality_settings: { ...prev.quality_settings, resolution: e.target.value }
                    }))}
                    disabled
                  />
                </div>
                <div className="space-y-2">
                  <Label>Bitrate (kbps)</Label>
                  <Input
                    type="number"
                    value={formData.quality_settings.bitrate}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      quality_settings: { ...prev.quality_settings, bitrate: parseInt(e.target.value) || 2500 }
                    }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label>FPS</Label>
                  <Input
                    type="number"
                    value={formData.quality_settings.fps}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      quality_settings: { ...prev.quality_settings, fps: parseInt(e.target.value) || 30 }
                    }))}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className="flex space-x-4">
            <Button type="submit" className="flex-1" disabled={loading}>
              {loading ? 'Creating...' : 'Create Stream'}
            </Button>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};