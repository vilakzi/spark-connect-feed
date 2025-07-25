import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { ContentCard } from './ContentCard';

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
  admin_id?: string;
  approval_status?: string;
  provider_id?: string;
  caption?: string;
  post_type?: string;
  expires_at?: string;
}

export function ContentOnlyFeed() {
  const [contentItems, setContentItems] = useState<ContentItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchContent = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from('posts') // or your media table
        .select('*')
        .order('created_at', { ascending: false });
      if (!error && data) {
        setContentItems(
          data.map((item: any) => ({
            id: item.id,
            title: item.title ?? '',
            description: item.description ?? '',
            file_url: item.file_url ?? item.content_url ?? '',
            thumbnail_url: item.thumbnail_url ?? '',
            content_type: item.content_type ?? item.post_type ?? '',
            view_count: item.view_count ?? 0,
            like_count: item.like_count ?? 0,
            share_count: item.share_count ?? 0,
            is_promoted: item.is_promoted ?? false,
            category: item.category ?? '',
            created_at: item.created_at,
            admin_id: item.admin_id ?? '',
            approval_status: item.approval_status ?? '',
            provider_id: item.provider_id ?? '',
            caption: item.caption ?? '',
            post_type: item.post_type ?? '',
            expires_at: item.expires_at ?? '',
          }))
        );
      }
      setLoading(false);
    };
    fetchContent();
  }, []);

  if (loading) return <div>Loading...</div>;
  if (contentItems.length === 0) return <div>No content found.</div>;

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
      {contentItems.map(item => (
        <ContentCard key={item.id} content={item} />
      ))}
    </div>
  );
}