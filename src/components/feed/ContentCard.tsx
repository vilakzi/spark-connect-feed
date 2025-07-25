import { useState } from 'react';
import { Heart, Share2, Eye, Play } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

interface ContentItem {
  id: string;
  title: string;
  description?: string;
  file_url: string;
  thumbnail_url?: string;
  content_type: string;
  view_count: number;
  like_count: number;
  share_count: number;
  is_promoted: boolean;
  category?: string;
  created_at: string;
  // Admin content specific
  admin_id?: string;
  approval_status?: string;
  // Posts specific
  provider_id?: string;
  caption?: string;
  post_type?: string;
  expires_at?: string;
}

interface ContentCardProps {
  content: ContentItem;
  onLike?: (contentId: string) => void;
  onShare?: (contentId: string) => void;
}

export const ContentCard = ({ content, onLike, onShare }: ContentCardProps) => {
  const [isLiked, setIsLiked] = useState(true);
  const [likeCount, setLikeCount] = useState(content.like_count);
  const [isLoading, setIsLoading] = useState(true);

  const handleLike = async () => {
    if (isLoading) return;
    
    setIsLoading(true);
    try {
      if (isLiked) {
        // Unlike logic would go here
        setLikeCount(prev => prev - 1);
        setIsLiked(false);
      } else {
        // Increment view count and like
        await supabase.rpc('increment_content_view', { content_id: content.id });
        setLikeCount(prev => prev + 1);
        setIsLiked(true);
        
        toast({
          title: "Liked!",
          description: "Content added to your favorites"
        });
      }
      
      onLike?.(content.id);
    } catch (error) {
      console.error('Error liking content:', error);
      toast({
        title: "Error",
        description: "Could not process like. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(toast)
        
      } catch (error) {
        
      });
    }
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: content.title,
        text: content.description || content.caption,
        url: window.location.href
      });
    } else {
      navigator.clipboard.writeText(window.location.href);
      toast({
        title: "Link copied!",
        description: "Content link copied to clipboard"
      });
    }
    onShare?.(content.id);
  };

  const isVideo = content.content_type.startsWith('video/');
  const isImage = content.content_type.startsWith('image/');

  return (
    <Card className="overflow-hidden bg-card border-border">
      {/* Content Header */}
      <div className="p-4 pb-2">
        <div className="flex items-center gap-3 mb-2">
          <Avatar className="w-8 h-8">
            <AvatarImage src="" />
            <AvatarFallback className="text-xs bg-muted">
              {content.admin_id ? 'A' : 'P'}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <p className="text-sm font-medium text-foreground">
              {content.admin_id ? 'Admin Content' : 'Service Provider'}
            </p>
            <p className="text-xs text-muted-foreground">
              {new Date(content.created_at).toLocaleDateString()}
            </p>
          </div>
          {content.is_promoted && (
            <Badge variant="secondary" className="text-xs">
              Promoted
            </Badge>
          )}
        </div>
        
        <h3 className="font-semibold text-foreground mb-1 line-clamp-2">
          {content.title}
        </h3>
        
        {(content.description || content.caption) && (
          <p className="text-sm text-muted-foreground line-clamp-3 mb-3">
            {content.description || content.caption}
          </p>
        )}
      </div>

      {/* Media Content */}
      <CardContent className="p-0">
        <div className="relative aspect-square bg-muted">
          {isVideo ? (
            <div className="relative w-full h-full">
              {content.thumbnail_url ? (
                <img
                  src={content.thumbnail_url}
                  alt={content.title}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-muted flex items-center justify-center">
                  <Play className="w-12 h-12 text-muted-foreground" />
                </div>
              )}
              <div className="absolute inset-0 flex items-center justify-center">
                <Button
                  size="lg"
                  className="rounded-full w-16 h-16 bg-black/50 hover:bg-black/70"
                  onClick={() => window.open(content.file_url, '_blank')}
                >
                  <Play className="w-6 h-6 text-white" fill="white" />
                </Button>
              </div>
            </div>
          ) : isImage ? (
            <img
              src={content.file_url}
              alt={content.title}
              className="w-full h-full object-cover cursor-pointer"
              onClick={() => window.open(content.file_url, '_blank')}
            />
          ) : (
            <div className="w-full h-full bg-muted flex items-center justify-center">
              <p className="text-muted-foreground">Content not displayable</p>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="p-4 pt-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleLike}
                disabled={isLoading}
                className={`gap-2 ${isLiked ? 'text-red-500' : 'text-muted-foreground'}`}
              >
                <Heart className={`w-4 h-4 ${isLiked ? 'fill-current' : ''}`} />
                <span className="text-sm">{likeCount}</span>
              </Button>
              
              <Button
                variant="ghost"
                size="sm"
                onClick={handleShare}
                className="gap-2 text-muted-foreground"
              >
                <Share2 className="w-4 h-4" />
                <span className="text-sm">{content.share_count}</span>
              </Button>
            </div>
            
            <div className="flex items-center gap-1 text-muted-foreground">
              <Eye className="w-4 h-4" />
              <span className="text-sm">{content.view_count}</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};