import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card } from '@/components/ui/card';
import { Image, Video, Send } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useQueryClient } from '@tanstack/react-query';

export default function CreatePost() {
  const [content, setContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const queryClient = useQueryClient();

  const handleSubmit = async () => {
    if (!content.trim()) return;

    setIsSubmitting(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { error } = await supabase
        .from('posts')
        .insert({
          user_id: user.id,
          content: content.trim(),
          media_type: 'text',
          privacy_level: 'public'
        });

      if (error) throw error;

      setContent('');
      toast.success('Post created successfully!');
      queryClient.invalidateQueries({ queryKey: ['posts'] });
    } catch (error) {
      console.error('Error creating post:', error);
      toast.error('Failed to create post');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="p-4">
      <Textarea
        placeholder="What's on your mind?"
        value={content}
        onChange={(e) => setContent(e.target.value)}
        className="min-h-[100px] resize-none border-none focus-visible:ring-0 text-base"
      />
      <div className="flex items-center justify-between mt-4">
        <div className="flex space-x-2">
          <Button variant="ghost" size="sm">
            <Image className="h-4 w-4 mr-2" />
            Photo
          </Button>
          <Button variant="ghost" size="sm">
            <Video className="h-4 w-4 mr-2" />
            Video
          </Button>
        </div>
        <Button 
          onClick={handleSubmit} 
          disabled={!content.trim() || isSubmitting}
          size="sm"
        >
          <Send className="h-4 w-4 mr-2" />
          Post
        </Button>
      </div>
    </Card>
  );
}
