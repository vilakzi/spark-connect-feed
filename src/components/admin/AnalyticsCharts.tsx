import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';

interface UserGrowthData {
  date: string;
  newUsers: number;
  totalUsers: number;
}

interface EngagementData {
  date: string;
  messages: number;
  matches: number;
  posts: number;
}

interface AnalyticsChartsProps {
  userGrowthData: UserGrowthData[];
  engagementData: EngagementData[];
}

export const AnalyticsCharts: React.FC<AnalyticsChartsProps> = ({
  userGrowthData,
  engagementData
}) => {
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const formatTooltipDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { 
      weekday: 'short', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  return (
    <div className="grid gap-4 md:grid-cols-2">
      {/* User Growth Chart */}
      <Card className="col-span-2">
        <CardHeader>
          <CardTitle>User Growth (Last 30 Days)</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={userGrowthData}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis 
                dataKey="date" 
                tickFormatter={formatDate}
                className="text-sm text-muted-foreground"
              />
              <YAxis className="text-sm text-muted-foreground" />
              <Tooltip 
                labelFormatter={(value) => formatTooltipDate(value as string)}
                contentStyle={{
                  backgroundColor: 'hsl(var(--background))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '6px'
                }}
              />
              <Line 
                type="monotone" 
                dataKey="totalUsers" 
                stroke="hsl(var(--primary))" 
                strokeWidth={2}
                name="Total Users"
                dot={{ fill: 'hsl(var(--primary))', r: 4 }}
                activeDot={{ r: 6 }}
              />
              <Line 
                type="monotone" 
                dataKey="newUsers" 
                stroke="hsl(var(--chart-2))" 
                strokeWidth={2}
                name="New Users"
                dot={{ fill: 'hsl(var(--chart-2))', r: 4 }}
                activeDot={{ r: 6 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Daily Engagement Chart */}
      <Card className="col-span-2">
        <CardHeader>
          <CardTitle>Daily Engagement (Last 7 Days)</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={engagementData}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis 
                dataKey="date" 
                tickFormatter={formatDate}
                className="text-sm text-muted-foreground"
              />
              <YAxis className="text-sm text-muted-foreground" />
              <Tooltip 
                labelFormatter={(value) => formatTooltipDate(value as string)}
                contentStyle={{
                  backgroundColor: 'hsl(var(--background))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '6px'
                }}
              />
              <Bar 
                dataKey="messages" 
                fill="hsl(var(--chart-1))" 
                name="Messages"
                radius={[2, 2, 0, 0]}
              />
              <Bar 
                dataKey="matches" 
                fill="hsl(var(--chart-2))" 
                name="Matches"
                radius={[2, 2, 0, 0]}
              />
              <Bar 
                dataKey="posts" 
                fill="hsl(var(--chart-3))" 
                name="Posts"
                radius={[2, 2, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
};