import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';
import { 
  TrendingUp, 
  TrendingDown,
  Users, 
  DollarSign, 
  Eye, 
  Heart,
  Target,
  Trophy,
  Calendar,
  BarChart3,
  PieChart,
  Activity,
  Zap,
  Star,
  PlayCircle,
  MessageSquare
} from 'lucide-react';
import { useCreatorAnalytics } from '@/hooks/useCreatorAnalytics';
import { useAuth } from '@/hooks/useAuth';
import { LineChart, Line, AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart as RechartsPieChart, Cell } from 'recharts';

const COLORS = ['#8884d8', '#82ca9d', '#ffc658', '#ff7c7c', '#8dd1e1'];

export const CreatorDashboard = () => {
  const { user } = useAuth();
  const {
    loading,
    error,
    dashboardSummary,
    analytics,
    goals,
    achievements,
    fetchDashboardSummary,
    fetchAnalytics,
    getAnalyticsSummary
  } = useCreatorAnalytics();

  const [selectedTimeframe, setSelectedTimeframe] = useState<'today' | 'week' | 'month'>('week');

  // Prepare chart data
  const chartData = analytics.slice(-7).map(day => ({
    date: new Date(day.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    views: day.total_views,
    revenue: day.revenue_cents / 100,
    engagement: day.engagement_rate,
    followers: day.total_followers
  }));

  const revenueBreakdown = dashboardSummary ? [
    { name: 'Tips', value: 45, color: '#8884d8' },
    { name: 'Subscriptions', value: 30, color: '#82ca9d' },
    { name: 'Streams', value: 15, color: '#ffc658' },
    { name: 'Content', value: 10, color: '#ff7c7c' }
  ] : [];

  const topContentData = [
    { title: 'Morning Vlog #142', views: 15420, engagement: 8.7 },
    { title: 'Q&A Live Stream', views: 12330, engagement: 12.4 },
    { title: 'Tutorial: New Feature', views: 9876, engagement: 6.2 },
    { title: 'Behind the Scenes', views: 8765, engagement: 9.1 },
    { title: 'Collaboration Post', views: 7654, engagement: 11.3 }
  ];

  if (loading && !dashboardSummary) {
    return (
      <div className="container mx-auto p-6 space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-muted rounded w-1/3 mb-6"></div>
          <div className="grid gap-6 md:grid-cols-4 mb-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-32 bg-muted rounded"></div>
            ))}
          </div>
          <div className="h-96 bg-muted rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Creator Dashboard</h1>
          <p className="text-muted-foreground">Track your performance and grow your audience</p>
        </div>
        <Button onClick={fetchDashboardSummary} variant="outline">
          <Activity className="h-4 w-4 mr-2" />
          Refresh Data
        </Button>
      </div>

      {/* Key Metrics Cards */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between space-y-0 pb-2">
              <div className="text-sm font-medium">Total Views</div>
              <Eye className="h-4 w-4 text-muted-foreground" />
            </div>
            <div className="text-2xl font-bold">
              {dashboardSummary?.today_views.toLocaleString() || '0'}
            </div>
            <p className="text-xs text-muted-foreground">
              <span className="text-green-600 flex items-center">
                <TrendingUp className="h-3 w-3 mr-1" />
                +12.5% from last week
              </span>
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between space-y-0 pb-2">
              <div className="text-sm font-medium">Total Followers</div>
              <Users className="h-4 w-4 text-muted-foreground" />
            </div>
            <div className="text-2xl font-bold">
              {dashboardSummary?.total_followers.toLocaleString() || '0'}
            </div>
            <p className="text-xs text-muted-foreground">
              <span className="text-green-600 flex items-center">
                <TrendingUp className="h-3 w-3 mr-1" />
                +{dashboardSummary?.monthly_growth.toFixed(1) || '0'}% this month
              </span>
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between space-y-0 pb-2">
              <div className="text-sm font-medium">Revenue</div>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </div>
            <div className="text-2xl font-bold">
              ${((dashboardSummary?.today_revenue_cents || 0) / 100).toFixed(2)}
            </div>
            <p className="text-xs text-muted-foreground">
              <span className="text-green-600 flex items-center">
                <TrendingUp className="h-3 w-3 mr-1" />
                +8.2% from yesterday
              </span>
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between space-y-0 pb-2">
              <div className="text-sm font-medium">Engagement Rate</div>
              <Heart className="h-4 w-4 text-muted-foreground" />
            </div>
            <div className="text-2xl font-bold">
              {dashboardSummary?.engagement_rate.toFixed(1) || '0'}%
            </div>
            <p className="text-xs text-muted-foreground">
              <span className="text-red-600 flex items-center">
                <TrendingDown className="h-3 w-3 mr-1" />
                -2.1% from last week
              </span>
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs value={selectedTimeframe} onValueChange={(value) => setSelectedTimeframe(value as any)}>
        <div className="flex items-center justify-between">
          <TabsList>
            <TabsTrigger value="today">Today</TabsTrigger>
            <TabsTrigger value="week">This Week</TabsTrigger>
            <TabsTrigger value="month">This Month</TabsTrigger>
          </TabsList>
        </div>

        {/* Analytics Charts */}
        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <BarChart3 className="h-5 w-5" />
                <span>Views & Engagement</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={chartData}>
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

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <DollarSign className="h-5 w-5" />
                <span>Revenue Breakdown</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <RechartsPieChart>
                  <Tooltip />
                  <RechartsPieChart data={revenueBreakdown}>
                    {revenueBreakdown.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </RechartsPieChart>
                </RechartsPieChart>
              </ResponsiveContainer>
              <div className="grid grid-cols-2 gap-4 mt-4">
                {revenueBreakdown.map((item, index) => (
                  <div key={item.name} className="flex items-center space-x-2">
                    <div className={`w-3 h-3 rounded-full`} style={{ backgroundColor: COLORS[index] }}></div>
                    <span className="text-sm">{item.name}: {item.value}%</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Goals and Achievements */}
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Active Goals */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Target className="h-5 w-5" />
                <span>Active Goals</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {goals.length > 0 ? goals.map(goal => (
                <div key={goal.id} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-medium capitalize">{goal.goal_type} Goal</span>
                    <Badge variant={goal.current_value >= goal.target_value ? "default" : "secondary"}>
                      {goal.current_value.toLocaleString()} / {goal.target_value.toLocaleString()}
                    </Badge>
                  </div>
                  <Progress 
                    value={(goal.current_value / goal.target_value) * 100} 
                    className="h-2"
                  />
                  {goal.deadline && (
                    <p className="text-xs text-muted-foreground">
                      Deadline: {new Date(goal.deadline).toLocaleDateString()}
                    </p>
                  )}
                </div>
              )) : (
                <p className="text-muted-foreground text-center py-8">
                  No active goals. Set some targets to track your progress!
                </p>
              )}
            </CardContent>
          </Card>

          {/* Recent Achievements */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Trophy className="h-5 w-5" />
                <span>Recent Achievements</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {dashboardSummary?.recent_achievements?.length > 0 ? 
                dashboardSummary.recent_achievements.map((achievement: any, index: number) => (
                  <div key={index} className="flex items-center space-x-3 p-2 rounded-lg bg-muted/50">
                    <div className="flex-shrink-0">
                      <Star className="h-5 w-5 text-yellow-500" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium capitalize">
                        {achievement.type.replace('_', ' ')}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(achievement.earned_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                )) : (
                <p className="text-muted-foreground text-center py-8 text-sm">
                  Keep creating to earn achievements!
                </p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Top Performing Content */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Zap className="h-5 w-5" />
              <span>Top Performing Content</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {topContentData.map((content, index) => (
                <div key={index} className="flex items-center space-x-4 p-3 rounded-lg hover:bg-muted/50 transition-colors">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                      <span className="text-sm font-medium">{index + 1}</span>
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{content.title}</p>
                    <p className="text-sm text-muted-foreground">
                      {content.views.toLocaleString()} views • {content.engagement}% engagement
                    </p>
                  </div>
                  <div className="flex-shrink-0">
                    <Button variant="ghost" size="sm">
                      <Eye className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </Tabs>
    </div>
  );
};