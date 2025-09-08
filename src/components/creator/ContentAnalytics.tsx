import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  BarChart3, 
  TrendingUp, 
  Eye, 
  Heart, 
  MessageSquare, 
  Share2,
  Clock,
  Users,
  Filter,
  Download,
  Calendar
} from 'lucide-react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart } from 'recharts';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';

interface ContentMetrics {
  id: string;
  title: string;
  type: 'post' | 'stream' | 'story';
  views: number;
  likes: number;
  comments: number;
  shares: number;
  engagement_rate: number;
  created_at: string;
  revenue_cents?: number;
  thumbnail?: string;
}

export const ContentAnalytics = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [contentMetrics, setContentMetrics] = useState<ContentMetrics[]>([]);
  const [selectedTimeframe, setSelectedTimeframe] = useState('7d');
  const [selectedContentType, setSelectedContentType] = useState('all');
  const [sortBy, setSortBy] = useState('views');

  // Mock data for demonstration
  const mockContentData = [
    {
      id: '1',
      title: 'Morning Routine Vlog',
      type: 'post' as const,
      views: 15420,
      likes: 1205,
      comments: 89,
      shares: 45,
      engagement_rate: 8.7,
      created_at: '2024-01-08',
      revenue_cents: 2450
    },
    {
      id: '2', 
      title: 'Live Q&A Session',
      type: 'stream' as const,
      views: 12330,
      likes: 1840,
      comments: 234,
      shares: 67,
      engagement_rate: 17.4,
      created_at: '2024-01-07',
      revenue_cents: 5670
    },
    {
      id: '3',
      title: 'Quick Update',
      type: 'story' as const,
      views: 8765,
      likes: 567,
      comments: 23,
      shares: 12,
      engagement_rate: 6.9,
      created_at: '2024-01-06',
      revenue_cents: 0
    },
    {
      id: '4',
      title: 'Tutorial: Getting Started',
      type: 'post' as const,
      views: 9876,
      likes: 892,
      comments: 156,
      shares: 89,
      engagement_rate: 11.5,
      created_at: '2024-01-05',
      revenue_cents: 3200
    },
    {
      id: '5',
      title: 'Behind the Scenes',
      type: 'post' as const,
      views: 7654,
      likes: 654,
      comments: 78,
      shares: 34,
      engagement_rate: 10.0,
      created_at: '2024-01-04',
      revenue_cents: 1890
    }
  ];

  const engagementTrendData = [
    { date: 'Jan 1', views: 1200, engagement: 5.2, revenue: 45 },
    { date: 'Jan 2', views: 1350, engagement: 6.1, revenue: 52 },
    { date: 'Jan 3', views: 980, engagement: 4.8, revenue: 38 },
    { date: 'Jan 4', views: 1680, engagement: 7.3, revenue: 67 },
    { date: 'Jan 5', views: 2100, engagement: 8.9, revenue: 89 },
    { date: 'Jan 6', views: 1890, engagement: 7.8, revenue: 76 },
    { date: 'Jan 7', views: 2350, engagement: 9.4, revenue: 98 }
  ];

  const performanceByTypeData = [
    { type: 'Posts', count: 15, avgViews: 12500, avgEngagement: 8.3 },
    { type: 'Streams', count: 8, avgViews: 18600, avgEngagement: 12.7 },
    { type: 'Stories', count: 25, avgViews: 6800, avgEngagement: 5.9 }
  ];

  useEffect(() => {
    setContentMetrics(mockContentData);
  }, [selectedTimeframe, selectedContentType]);

  const filteredContent = contentMetrics
    .filter(content => selectedContentType === 'all' || content.type === selectedContentType)
    .sort((a, b) => {
      switch (sortBy) {
        case 'views': return b.views - a.views;
        case 'engagement': return b.engagement_rate - a.engagement_rate;
        case 'revenue': return (b.revenue_cents || 0) - (a.revenue_cents || 0);
        case 'date': return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        default: return 0;
      }
    });

  const totalMetrics = contentMetrics.reduce((acc, content) => ({
    views: acc.views + content.views,
    likes: acc.likes + content.likes,
    comments: acc.comments + content.comments,
    shares: acc.shares + content.shares,
    revenue: acc.revenue + (content.revenue_cents || 0)
  }), { views: 0, likes: 0, comments: 0, shares: 0, revenue: 0 });

  const avgEngagement = contentMetrics.length > 0 
    ? contentMetrics.reduce((acc, content) => acc + content.engagement_rate, 0) / contentMetrics.length 
    : 0;

  return (
    <div className="space-y-6">
      {/* Header & Filters */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between space-y-4 sm:space-y-0">
        <div>
          <h2 className="text-2xl font-bold">Content Analytics</h2>
          <p className="text-muted-foreground">Analyze your content performance</p>
        </div>
        
        <div className="flex items-center space-x-3">
          <Select value={selectedTimeframe} onValueChange={setSelectedTimeframe}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">Last 7 days</SelectItem>
              <SelectItem value="30d">Last 30 days</SelectItem>
              <SelectItem value="90d">Last 90 days</SelectItem>
            </SelectContent>
          </Select>
          
          <Select value={selectedContentType} onValueChange={setSelectedContentType}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="post">Posts</SelectItem>
              <SelectItem value="stream">Streams</SelectItem>
              <SelectItem value="story">Stories</SelectItem>
            </SelectContent>
          </Select>
          
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Views</p>
                <p className="text-2xl font-bold">{totalMetrics.views.toLocaleString()}</p>
              </div>
              <Eye className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Likes</p>
                <p className="text-2xl font-bold">{totalMetrics.likes.toLocaleString()}</p>
              </div>
              <Heart className="h-8 w-8 text-red-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Comments</p>
                <p className="text-2xl font-bold">{totalMetrics.comments.toLocaleString()}</p>
              </div>
              <MessageSquare className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Avg. Engagement</p>
                <p className="text-2xl font-bold">{avgEngagement.toFixed(1)}%</p>
              </div>
              <TrendingUp className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Revenue</p>
                <p className="text-2xl font-bold">${(totalMetrics.revenue / 100).toFixed(0)}</p>
              </div>
              <BarChart3 className="h-8 w-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Engagement Trends */}
        <Card>
          <CardHeader>
            <CardTitle>Engagement Trends</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={engagementTrendData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Area type="monotone" dataKey="views" stackId="1" stroke="#8884d8" fill="#8884d8" fillOpacity={0.6} />
                <Area type="monotone" dataKey="engagement" stackId="2" stroke="#82ca9d" fill="#82ca9d" fillOpacity={0.6} />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Performance by Type */}
        <Card>
          <CardHeader>
            <CardTitle>Performance by Content Type</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={performanceByTypeData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="type" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="avgViews" fill="#8884d8" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Content Performance Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Individual Content Performance</CardTitle>
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="views">Sort by Views</SelectItem>
                <SelectItem value="engagement">Sort by Engagement</SelectItem>
                <SelectItem value="revenue">Sort by Revenue</SelectItem>
                <SelectItem value="date">Sort by Date</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {filteredContent.map(content => (
              <div key={content.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                <div className="flex-1">
                  <div className="flex items-center space-x-3">
                    <h3 className="font-medium">{content.title}</h3>
                    <Badge variant="outline" className="capitalize">{content.type}</Badge>
                  </div>
                  <div className="flex items-center space-x-6 mt-2 text-sm text-muted-foreground">
                    <span className="flex items-center space-x-1">
                      <Eye className="h-3 w-3" />
                      <span>{content.views.toLocaleString()}</span>
                    </span>
                    <span className="flex items-center space-x-1">
                      <Heart className="h-3 w-3" />
                      <span>{content.likes.toLocaleString()}</span>
                    </span>
                    <span className="flex items-center space-x-1">
                      <MessageSquare className="h-3 w-3" />
                      <span>{content.comments}</span>
                    </span>
                    <span className="flex items-center space-x-1">
                      <Share2 className="h-3 w-3" />
                      <span>{content.shares}</span>
                    </span>
                    <span className="flex items-center space-x-1">
                      <Calendar className="h-3 w-3" />
                      <span>{new Date(content.created_at).toLocaleDateString()}</span>
                    </span>
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-medium text-lg">{content.engagement_rate}%</div>
                  <div className="text-sm text-muted-foreground">engagement</div>
                  {content.revenue_cents && content.revenue_cents > 0 && (
                    <div className="text-sm text-green-600 font-medium">
                      ${(content.revenue_cents / 100).toFixed(2)}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};