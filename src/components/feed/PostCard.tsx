import { Card } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Heart, MessageCircle, Share2, MoreHorizontal } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface PostCardProps {
  post: {
    id: string;
    content: string;
    likes_count: number;
    comments_count: number;
    shares_count: number;
    created_at: string;
    author_display_name: string;
    author_profile_image: string;
    image_url?: string;
    video_url?: string;
  };
}

export default function PostCard({ post }: PostCardProps) {
  return (
    <Card className="p-6">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center space-x-3">
          <Avatar>
            <AvatarImage src={post.author_profile_image} />
            <AvatarFallback>{post.author_display_name?.charAt(0)}</AvatarFallback>
          </Avatar>
          <div>
            <p className="font-semibold">{post.author_display_name}</p>
            <p className="text-sm text-muted-foreground">
              {formatDistanceToNow(new Date(post.created_at), { addSuffix: true })}
            </p>
          </div>
        </div>
        <Button variant="ghost" size="icon">
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </div>

      <p className="mb-4 whitespace-pre-wrap">{post.content}</p>

      {post.image_url && (
        <img 
          src={post.image_url} 
          alt="Post content" 
          className="w-full rounded-lg mb-4 object-cover max-h-96"
        />
      )}

      {post.video_url && (
        <video 
          src={post.video_url} 
          controls 
          className="w-full rounded-lg mb-4"
        />
      )}

      <div className="flex items-center justify-between pt-4 border-t">
        <Button variant="ghost" size="sm" className="space-x-2">
          <Heart className="h-4 w-4" />
          <span>{post.likes_count}</span>
        </Button>
        <Button variant="ghost" size="sm" className="space-x-2">
          <MessageCircle className="h-4 w-4" />
          <span>{post.comments_count}</span>
        </Button>
        <Button variant="ghost" size="sm" className="space-x-2">
          <Share2 className="h-4 w-4" />
          <span>{post.shares_count}</span>
        </Button>
      </div>
    </Card>
  );
}
