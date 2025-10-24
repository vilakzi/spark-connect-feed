import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import PostCard from '@/components/feed/PostCard';
import CreatePost from '@/components/feed/CreatePost';
import { Skeleton } from '@/components/ui/skeleton';

export default function Home() {
  const { data: posts, isLoading } = useQuery({
    queryKey: ['posts'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      const { data, error } = await supabase
        .rpc('get_feed_posts', {
          viewer_id: user.id,
          limit_count: 20,
          offset_count: 0
        });

      if (error) throw error;
      return data;
    },
  });

  return (
    <div className="space-y-6">
      <CreatePost />
      
      {isLoading ? (
        <div className="space-y-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-card rounded-lg p-6 space-y-4">
              <div className="flex items-center space-x-3">
                <Skeleton className="h-10 w-10 rounded-full" />
                <Skeleton className="h-4 w-32" />
              </div>
              <Skeleton className="h-20 w-full" />
            </div>
          ))}
        </div>
      ) : (
        <div className="space-y-6">
          {posts?.map((post) => (
            <PostCard key={post.id} post={post} />
          ))}
          {posts?.length === 0 && (
            <div className="text-center py-12 text-muted-foreground">
              <p>No posts yet. Be the first to share something!</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
