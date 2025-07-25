import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { ContentCard } from './ContentCard';
import { useAuth } from '@/hooks/useAuth';
import { Loader2, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
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

const CONTENT_PER_PAGE = 10;

export const ContentFeed = () => {
  const { user } = useAuth();
  const [content, setContent] = useState<ContentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [offset, setOffset] = useState(0);

  const fetchContent = useCallback(async (isLoadMore = false) => {
    if (!user) return;

    try {
      const currentOffset = isLoadMore ? offset : 0;
      
      // Fetch admin content that's published and approved
      const { data: adminContent, error: adminError } = await supabase
        .from('admin_content')
        .select('*')
        .eq('status', 'published')
        .eq('visibility', 'public')
        .eq('approval_status', 'approved')
        .order('created_at', { ascending: false })
        .range(currentOffset, currentOffset + Math.floor(CONTENT_PER_PAGE / 2) - 1);

      if (adminError) {
        console.error('Error fetching admin content:', adminError);
      }

      // Fetch active posts that haven't expired and are paid
      const { data: posts, error: postsError } = await supabase
        .from('posts')
        .select(`
          id,
          caption,
          content_url,
          post_type,
          created_at,
          expires_at,
          is_promoted,
          payment_status,
          provider_id
        `)
        .eq('payment_status', 'paid')
        .gt('expires_at', new Date().toISOString())
        .order('created_at', { ascending: false })
        .range(currentOffset, currentOffset + Math.floor(CONTENT_PER_PAGE / 2) - 1);

      if (postsError) {
        console.error('Error fetching posts:', postsError);
      }

      // Transform admin content to ContentItem format
      const transformedAdminContent: ContentItem[] = (adminContent || []).map(item => ({
        id: item.id,
        title: item.title,
        description: item.description,
        file_url: item.file_url,
        thumbnail_url: item.thumbnail_url,
        content_type: item.content_type,
        view_count: item.view_count || 0,
        like_count: item.like_count || 0,
        share_count: item.share_count || 0,
        is_promoted: item.is_promoted || false,
        category: item.category,
        created_at: item.created_at,
        admin_id: item.admin_id,
        approval_status: item.approval_status
      }));

      // Transform posts to ContentItem format
      const transformedPosts: ContentItem[] = (posts || []).map(item => ({
        id: item.id,
        title: `${item.post_type} Post`,
        caption: item.caption,
        file_url: item.content_url,
        content_type: 'image/jpeg', // Default for posts, could be enhanced
        view_count: 0, // Posts don't have view count tracking yet
        like_count: 0, // Posts don't have like count tracking yet
        share_count: 0, // Posts don't have share count tracking yet
        is_promoted: item.is_promoted || false,
        created_at: item.created_at,
        provider_id: item.provider_id,
        post_type: item.post_type,
        expires_at: item.expires_at
      }));

      // Combine and sort all content by creation date
      const allContent = [...transformedAdminContent, ...transformedPosts]
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

      if (isLoadMore) {
        setContent(prev => [...prev, ...allContent]);
      } else {
        setContent(allContent);
      }

      setHasMore(allContent.length === CONTENT_PER_PAGE);
      setOffset(currentOffset + allContent.length);
    } catch (error) {
      console.error('Error fetching content:', error);
      toast({
        title: "Error loading content",
        description: "Please try again later",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [user, offset]);

  const loadMore = useCallback(async () => {
    if (loadingMore || !hasMore) return;
    setLoadingMore(true);
    await fetchContent(true);
  }, [fetchContent, loadingMore, hasMore]);

  const handleScroll = useCallback(() => {
    if (
      window.innerHeight + document.documentElement.scrollTop >=
      document.documentElement.offsetHeight - 1000
    ) {
      loadMore();
    }
  }, [loadMore]);

  useEffect(() => {
    fetchContent();
  }, []);

  useEffect(() => {
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [handleScroll]);

  const handleRefresh = () => {
    setLoading(true);
    setOffset(0);
    setHasMore(true);
    fetchContent();
  };

  const handleLike = async (contentId: string) => {
    // Handle like logic - could track user likes in future
    console.log('Liked content:', contentId);
  };

  const handleShare = async (contentId: string) => {
    // Handle share logic - could increment share count
    console.log('Shared content:', contentId);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (content.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-8 text-center">
        <h2 className="text-2xl font-bold text-foreground mb-4">No content available</h2>
        <p className="text-muted-foreground mb-6">
          No published content or active posts found. Check back later!
        </p>
        <Button onClick={handleRefresh} className="gap-2">
          <RefreshCw className="w-4 h-4" />
          Refresh
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-foreground">Content Feed</h1>
          <Button onClick={handleRefresh} variant="outline" size="sm" className="gap-2">
            <RefreshCw className="w-4 h-4" />
            Refresh
          </Button>
        </div>

        {/* Content Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {content.map((item) => (
            <ContentCard
              key={item.id}
              content={item}
              onLike={handleLike}
              onShare={handleShare}
            />
          ))}
        </div>

        {/* Loading More */}
        {loadingMore && (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-primary" />
          </div>
        )}

        {/* End Message */}
        {!hasMore && content.length > 0 && (
          <div className="text-center py-8">
            <p className="text-muted-foreground">You've seen all content!</p>
          </div>
        )}
      </div>
    </div>
  );
};