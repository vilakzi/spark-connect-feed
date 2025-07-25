import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Loader2 } from 'lucide-react';

interface MediaPost {
  id: string;
  media_url: string;
  media_type: 'image' | 'video';
  caption?: string;
  created_at?: string;
}

export const InstagramFeed = () => {
  const [mediaPosts, setMediaPosts] = useState<MediaPost[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMedia = async () => {
      setLoading(true);
      // Replace 'media_posts' with a valid table name, e.g., 'posts'
      const { data, error } = await supabase
        .from('posts')
        .select('*')
        .order('created_at', { ascending: false });

      if (!error && data) {
        setMediaPosts(
          data.map((item: any) => ({
            id: item.id,
            media_url: item.content_url,
            media_type: item.post_type,
            caption: item.caption,
            created_at: item.created_at,
          }))
        );
      }
      setLoading(false);
    };

    fetchMedia();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (mediaPosts.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-8 text-center">
        <h2 className="text-2xl font-bold text-foreground mb-4">No media found</h2>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {mediaPosts.map((post) => (
            <div key={post.id} className="rounded shadow bg-white p-2">
              {post.media_type === 'image' ? (
                <img src={post.media_url} alt={post.caption || ''} className="w-full h-auto rounded" />
              ) : (
                <video controls src={post.media_url} className="w-full h-auto rounded" />
              )}
              {post.caption && <div className="mt-2 text-sm">{post.caption}</div>}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};