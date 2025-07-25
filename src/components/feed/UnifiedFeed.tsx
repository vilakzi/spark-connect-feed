import { ContentCard } from './ContentCard';
import { ProfileCard } from './ProfileCard';
// import { Button } from './Button';
import { Button } from '../ui/button';
import { RefreshCw } from 'lucide-react';
import { Card, CardContent } from '../ui/card';

interface FeedItemBase {
  id: string | number;
  type: 'profile' | 'content';
  [key: string]: any;
}

interface ProfileFeedItem extends FeedItemBase {
  type: 'profile';
  display_name: string;
  // Add other Profile properties as needed
}

interface ContentFeedItem extends FeedItemBase {
  type: 'content';
  // Add other Content properties as needed
}

type FeedItem = ProfileFeedItem | ContentFeedItem;

interface FeedProps {
  feedItems: FeedItem[];
  loading: boolean;
  refreshing: boolean;
  hasMore: boolean;
  loadingMore: boolean;
  onRefresh: () => void;
  onLike: (id: string | number) => void;
  onShare: (item: FeedItem) => void;
}

export function Feed({
  feedItems,
  loading,
  refreshing,
  hasMore,
  loadingMore,
  onRefresh,
  onLike,
  onShare,
}: FeedProps) {
  const handleRefresh = () => {
    if (!refreshing) {
      onRefresh();
    }
  };

  const handleProfileLike = (id) => {
    onLike(id);
  };

  const handleContentLike = (id) => {
    onLike(id);
  };

  const handleShare = (item) => {
    onShare(item);
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
        {/* Enhanced refresh button */}
        <div className="flex justify-center mb-4">
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={refreshing}
            className="gap-2"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
            {refreshing ? 'Loading...' : 'Refresh'}
          </Button>
        </div>

        {/* Feed Items with modular rendering */}
        {feedItems.map((item) => (
          <Card key={`${item.type}-${item.id}`} className="overflow-hidden">
            <CardContent className="p-0">
              {item.type === 'profile' ? (
                <ProfileCard
                  profile={{ ...item, id: String(item.id) }}
                  onLike={() => handleProfileLike(String(item.id))}
                  onMessage={() => {/* Optionally implement messaging */}}
                />
              ) : (
                <ContentCard
                  content={item as any}
                  onLike={() => handleContentLike(item.id)}
                  onShare={() => handleShare(item)}
                />
              )}
            </CardContent>
          </Card>
        ))}

        {/* Enhanced loading more indicator */}
        {loadingMore && (
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
          </div>
        )}

        {/* Enhanced no more content state */}
        {!hasMore && feedItems.length > 0 && (
          <div className="text-center py-8 space-y-2">
            <p className="text-muted-foreground">You've seen all available content!</p>
            <Button variant="outline" size="sm" onClick={handleRefresh} className="gap-2">
              <RefreshCw className="w-4 h-4" />
              Load Fresh Content
            </Button>
          </div>
        )}

        {/* Enhanced empty state */}
        {!loading && feedItems.length === 0 && (
          <div className="text-center py-12 space-y-4">
            <p className="text-lg text-muted-foreground">No content available right now</p>
            <p className="text-sm text-muted-foreground">Check back later for new posts and profiles!</p>
            <Button onClick={handleRefresh} className="gap-2">
              <RefreshCw className="w-4 h-4" />
              Try Again
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}