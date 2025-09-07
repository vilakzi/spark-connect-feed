import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Heart, Share2, Eye } from 'lucide-react';

// Simplified feed component to avoid TypeScript errors during Phase 1
interface SimpleFeedItem {
  id: string;
  title: string;
  description?: string;
  created_at: string;
  like_count: number;
  view_count: number;
}

// Mock data for display
const mockFeedData: SimpleFeedItem[] = [
  {
    id: '1',
    title: 'Welcome to the Platform',
    description: 'Discover amazing content from our community',
    created_at: new Date().toISOString(),
    like_count: 15,
    view_count: 100,
  },
  {
    id: '2', 
    title: 'Featured Content',
    description: 'Check out this trending content in your area',
    created_at: new Date(Date.now() - 86400000).toISOString(),
    like_count: 28,
    view_count: 234,
  },
];

export const SimpleFeed = () => {
  return (
    <div className="space-y-4">
      <div className="text-center py-8">
        <h2 className="text-2xl font-bold mb-2">Content Feed</h2>
        <p className="text-muted-foreground">
          The full feed experience is being optimized for better performance
        </p>
      </div>
      
      {mockFeedData.map((item) => (
        <Card key={item.id} className="overflow-hidden">
          <CardHeader>
            <CardTitle className="text-lg">{item.title}</CardTitle>
            <CardDescription>{item.description}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between pt-2">
              <div className="flex items-center gap-4">
                <Button variant="ghost" size="sm" className="gap-2">
                  <Heart className="w-4 h-4" />
                  <span>{item.like_count}</span>
                </Button>
                <Button variant="ghost" size="sm" className="gap-2">
                  <Share2 className="w-4 h-4" />
                  Share
                </Button>
              </div>
              <div className="flex items-center gap-1 text-muted-foreground">
                <Eye className="w-4 h-4" />
                <span className="text-sm">{item.view_count}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};