import React, { useState, useCallback, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';
import { Input } from '@/components/ui/input';
import { 
  PenTool, 
  Globe, 
  Users, 
  Lock, 
  MapPin, 
  Calendar,
  Hash,
  AtSign,
  Save,
  Send,
  Clock,
  Eye,
  FileText,
  Sparkles,
  X
} from 'lucide-react';
import { MediaUploader } from './MediaUploader';
import { useFeedPosting } from '@/hooks/useFeedPosting';
import { toast } from '@/hooks/use-toast';

interface MediaFile {
  file: File;
  preview: string;
  type: string;
  id: string;
  compressed?: File;
  edited?: boolean;
}

interface PostComposerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onPostCreated?: () => void;
}

const PRIVACY_OPTIONS = [
  { value: 'public', label: 'Public', icon: Globe, description: 'Everyone can see this post' },
  { value: 'friends', label: 'Friends Only', icon: Users, description: 'Only your matches can see this' },
  { value: 'private', label: 'Private', icon: Lock, description: 'Only you can see this' }
] as const;

const HASHTAG_SUGGESTIONS = [
  '#love', '#life', '#happy', '#beautiful', '#nature', '#travel', 
  '#photography', '#art', '#music', '#food', '#fitness', '#style',
  '#motivation', '#inspiration', '#adventure', '#memories'
];

export const PostComposer: React.FC<PostComposerProps> = ({
  open,
  onOpenChange,
  onPostCreated
}) => {
  const { createPost, uploading, uploadProgress } = useFeedPosting();
  
  const [content, setContent] = useState('');
  const [mediaFiles, setMediaFiles] = useState<MediaFile[]>([]);
  const [location, setLocation] = useState('');
  const [privacyLevel, setPrivacyLevel] = useState<'public' | 'friends' | 'private'>('public');
  const [scheduledDate, setScheduledDate] = useState('');
  const [scheduledTime, setScheduledTime] = useState('');
  const [hashtags, setHashtags] = useState<string[]>([]);
  const [mentions, setMentions] = useState<string[]>([]);
  const [newHashtag, setNewHashtag] = useState('');
  const [newMention, setNewMention] = useState('');
  const [showHashtagSuggestions, setShowHashtagSuggestions] = useState(false);

  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [content]);

  // Extract hashtags and mentions from content
  const handleContentChange = useCallback((value: string) => {
    setContent(value);
    
    // Auto-extract hashtags
    const hashtagMatches = value.match(/#(\w+)/g);
    if (hashtagMatches) {
      const extractedHashtags = hashtagMatches.map(tag => tag.slice(1));
      setHashtags(prev => [...new Set([...prev, ...extractedHashtags])]);
    }

    // Auto-extract mentions
    const mentionMatches = value.match(/@(\w+)/g);
    if (mentionMatches) {
      const extractedMentions = mentionMatches.map(mention => mention.slice(1));
      setMentions(prev => [...new Set([...prev, ...extractedMentions])]);
    }
  }, []);

  const addHashtag = useCallback((tag: string) => {
    const cleanTag = tag.replace('#', '').trim();
    if (cleanTag && !hashtags.includes(cleanTag)) {
      setHashtags(prev => [...prev, cleanTag]);
      setNewHashtag('');
      setShowHashtagSuggestions(false);
    }
  }, [hashtags]);

  const removeHashtag = useCallback((tag: string) => {
    setHashtags(prev => prev.filter(t => t !== tag));
  }, []);

  const addMention = useCallback((mention: string) => {
    const cleanMention = mention.replace('@', '').trim();
    if (cleanMention && !mentions.includes(cleanMention)) {
      setMentions(prev => [...prev, cleanMention]);
      setNewMention('');
    }
  }, [mentions]);

  const removeMention = useCallback((mention: string) => {
    setMentions(prev => prev.filter(m => m !== mention));
  }, []);

  const getCurrentLocation = useCallback(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          try {
            // You would typically use a geocoding service here
            // For now, we'll just use coordinates
            const { latitude, longitude } = position.coords;
            setLocation(`${latitude.toFixed(4)}, ${longitude.toFixed(4)}`);
            toast({
              title: "Location added",
              description: "Your current location has been added to the post"
            });
          } catch (error) {
            console.error('Error getting location:', error);
          }
        },
        (error) => {
          console.error('Geolocation error:', error);
          toast({
            title: "Location unavailable",
            description: "Could not get your current location",
            variant: "destructive"
          });
        }
      );
    }
  }, []);

  const handleSubmit = useCallback(async (isDraft: boolean = false) => {
    if (!content.trim() && mediaFiles.length === 0) {
      toast({
        title: "Content required",
        description: "Please add some content or media to your post",
        variant: "destructive"
      });
      return;
    }

    const scheduledAt = scheduledDate && scheduledTime 
      ? new Date(`${scheduledDate}T${scheduledTime}`)
      : undefined;

    const postData = {
      content: content.trim(),
      mediaFiles,
      location: location.trim(),
      hashtags,
      mentions,
      privacyLevel,
      scheduledAt,
      isDraft
    };

    const postId = await createPost(postData);
    
    if (postId) {
      // Reset form
      setContent('');
      setMediaFiles([]);
      setLocation('');
      setHashtags([]);
      setMentions([]);
      setScheduledDate('');
      setScheduledTime('');
      setPrivacyLevel('public');
      
      onOpenChange(false);
      onPostCreated?.();
    }
  }, [content, mediaFiles, location, hashtags, mentions, privacyLevel, scheduledDate, scheduledTime, createPost, onOpenChange, onPostCreated]);

  const selectedPrivacy = PRIVACY_OPTIONS.find(option => option.value === privacyLevel);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <PenTool className="w-5 h-5" />
            Create Post
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Content Input */}
          <div>
            <Textarea
              ref={textareaRef}
              placeholder="What's on your mind?"
              value={content}
              onChange={(e) => handleContentChange(e.target.value)}
              className="min-h-[120px] resize-none text-lg border-none p-0 focus-visible:ring-0"
              style={{ overflow: 'hidden' }}
            />
          </div>

          {/* Media Uploader */}
          <MediaUploader
            mediaFiles={mediaFiles}
            onMediaChange={setMediaFiles}
            maxFiles={10}
            uploading={uploading}
            uploadProgress={uploadProgress}
          />

          {/* Tags and Mentions */}
          <div className="space-y-4">
            {/* Hashtags */}
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Hash className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm font-medium">Hashtags</span>
              </div>
              
              <div className="flex flex-wrap gap-2 mb-2">
                {hashtags.map((tag) => (
                  <Badge key={tag} variant="secondary" className="gap-1">
                    #{tag}
                    <X 
                      className="w-3 h-3 cursor-pointer" 
                      onClick={() => removeHashtag(tag)}
                    />
                  </Badge>
                ))}
              </div>

              <div className="relative">
                <Input
                  placeholder="Add hashtag..."
                  value={newHashtag}
                  onChange={(e) => setNewHashtag(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      addHashtag(newHashtag);
                    }
                  }}
                  onFocus={() => setShowHashtagSuggestions(true)}
                />
                
                {showHashtagSuggestions && (
                  <Card className="absolute top-full left-0 right-0 z-10 mt-1">
                    <CardContent className="p-2">
                      <div className="flex flex-wrap gap-1">
                        {HASHTAG_SUGGESTIONS
                          .filter(tag => !hashtags.includes(tag.slice(1)))
                          .slice(0, 8)
                          .map((tag) => (
                            <Button
                              key={tag}
                              variant="ghost"
                              size="sm"
                              onClick={() => addHashtag(tag)}
                              className="h-6 px-2 text-xs"
                            >
                              {tag}
                            </Button>
                          ))
                        }
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            </div>

            {/* Mentions */}
            <div>
              <div className="flex items-center gap-2 mb-2">
                <AtSign className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm font-medium">Mentions</span>
              </div>
              
              <div className="flex flex-wrap gap-2 mb-2">
                {mentions.map((mention) => (
                  <Badge key={mention} variant="secondary" className="gap-1">
                    @{mention}
                    <X 
                      className="w-3 h-3 cursor-pointer" 
                      onClick={() => removeMention(mention)}
                    />
                  </Badge>
                ))}
              </div>

              <Input
                placeholder="Add mention..."
                value={newMention}
                onChange={(e) => setNewMention(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    addMention(newMention);
                  }
                }}
              />
            </div>
          </div>

          <Separator />

          {/* Post Options */}
          <div className="space-y-4">
            {/* Privacy and Location */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Privacy</label>
                <Select value={privacyLevel} onValueChange={(value: typeof PRIVACY_OPTIONS[number]['value']) => setPrivacyLevel(value)}>
                  <SelectTrigger>
                    <SelectValue>
                      <div className="flex items-center gap-2">
                        {selectedPrivacy && <selectedPrivacy.icon className="w-4 h-4" />}
                        {selectedPrivacy?.label}
                      </div>
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {PRIVACY_OPTIONS.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        <div className="flex items-center gap-2">
                          <option.icon className="w-4 h-4" />
                          <div>
                            <div>{option.label}</div>
                            <div className="text-xs text-muted-foreground">
                              {option.description}
                            </div>
                          </div>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">Location</label>
                <div className="flex gap-2">
                  <Input
                    placeholder="Add location..."
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    className="flex-1"
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={getCurrentLocation}
                  >
                    <MapPin className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>

            {/* Scheduling */}
            <div>
              <label className="text-sm font-medium mb-2 flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                Schedule Post (Optional)
              </label>
              <div className="grid grid-cols-2 gap-2">
                <Input
                  type="date"
                  value={scheduledDate}
                  onChange={(e) => setScheduledDate(e.target.value)}
                  min={new Date().toISOString().split('T')[0]}
                />
                <Input
                  type="time"
                  value={scheduledTime}
                  onChange={(e) => setScheduledTime(e.target.value)}
                />
              </div>
            </div>
          </div>

          <Separator />

          {/* Action Buttons */}
          <div className="flex justify-between items-center">
            <div className="text-sm text-muted-foreground">
              {content.length} characters
            </div>
            
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => handleSubmit(true)}
                disabled={uploading}
                className="gap-2"
              >
                <Save className="w-4 h-4" />
                Save Draft
              </Button>
              
              <Button
                onClick={() => handleSubmit(false)}
                disabled={uploading || (!content.trim() && mediaFiles.length === 0)}
                className="gap-2"
              >
                {uploading ? (
                  <>
                    <Clock className="w-4 h-4 animate-spin" />
                    Posting...
                  </>
                ) : scheduledDate ? (
                  <>
                    <Calendar className="w-4 h-4" />
                    Schedule
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    Post
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};