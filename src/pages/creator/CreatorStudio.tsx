import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { MainLayout } from '@/components/layout/MainLayout';
import { CreatorDashboard } from '@/components/creator/CreatorDashboard';
import { ContentAnalytics } from '@/components/creator/ContentAnalytics';
import { GoalsManager } from '@/components/creator/GoalsManager';
import { Card, CardContent } from '@/components/ui/card';
import { 
  BarChart3, 
  Target, 
  TrendingUp, 
  Users,
  DollarSign,
  Settings,
  Bell,
  Shield
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';

const CreatorStudio = () => {
  const { user } = useAuth();

  if (!user) {
    return (
      <MainLayout>
        <div className="container mx-auto p-6 text-center">
          <h1 className="text-2xl font-bold mb-4">Creator Studio</h1>
          <p className="text-muted-foreground">Please sign in to access your creator dashboard.</p>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="container mx-auto p-6">
        <div className="space-y-6">
          {/* Header */}
          <div className="border-b pb-6">
            <h1 className="text-3xl font-bold">Creator Studio</h1>
            <p className="text-muted-foreground mt-2">
              Manage your content, track performance, and grow your audience
            </p>
          </div>

          {/* Main Tabs */}
          <Tabs defaultValue="dashboard" className="space-y-6">
            <TabsList className="grid w-full grid-cols-6">
              <TabsTrigger value="dashboard" className="flex items-center space-x-2">
                <BarChart3 className="h-4 w-4" />
                <span className="hidden sm:inline">Dashboard</span>
              </TabsTrigger>
              <TabsTrigger value="analytics" className="flex items-center space-x-2">
                <TrendingUp className="h-4 w-4" />
                <span className="hidden sm:inline">Analytics</span>
              </TabsTrigger>
              <TabsTrigger value="goals" className="flex items-center space-x-2">
                <Target className="h-4 w-4" />
                <span className="hidden sm:inline">Goals</span>
              </TabsTrigger>
              <TabsTrigger value="audience" className="flex items-center space-x-2">
                <Users className="h-4 w-4" />
                <span className="hidden sm:inline">Audience</span>
              </TabsTrigger>
              <TabsTrigger value="monetization" className="flex items-center space-x-2">
                <DollarSign className="h-4 w-4" />
                <span className="hidden sm:inline">Revenue</span>
              </TabsTrigger>
              <TabsTrigger value="settings" className="flex items-center space-x-2">
                <Settings className="h-4 w-4" />
                <span className="hidden sm:inline">Settings</span>
              </TabsTrigger>
            </TabsList>

            {/* Dashboard Tab */}
            <TabsContent value="dashboard" className="space-y-6">
              <CreatorDashboard />
            </TabsContent>

            {/* Analytics Tab */}
            <TabsContent value="analytics" className="space-y-6">
              <ContentAnalytics />
            </TabsContent>

            {/* Goals Tab */}
            <TabsContent value="goals" className="space-y-6">
              <GoalsManager />
            </TabsContent>

            {/* Audience Tab */}
            <TabsContent value="audience" className="space-y-6">
              <div className="grid gap-6">
                <Card>
                  <CardContent className="p-6">
                    <div className="text-center py-12">
                      <Users className="h-16 w-16 mx-auto mb-4 opacity-50" />
                      <h3 className="text-lg font-medium mb-2">Audience Insights</h3>
                      <p className="text-muted-foreground">
                        Detailed audience analytics coming soon
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* Monetization Tab */}
            <TabsContent value="monetization" className="space-y-6">
              <div className="grid gap-6">
                <Card>
                  <CardContent className="p-6">
                    <div className="text-center py-12">
                      <DollarSign className="h-16 w-16 mx-auto mb-4 opacity-50" />
                      <h3 className="text-lg font-medium mb-2">Revenue Analytics</h3>
                      <p className="text-muted-foreground">
                        Comprehensive revenue tracking coming soon
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* Settings Tab */}
            <TabsContent value="settings" className="space-y-6">
              <div className="grid gap-6">
                <Card>
                  <CardContent className="p-6">
                    <div className="text-center py-12">
                      <Settings className="h-16 w-16 mx-auto mb-4 opacity-50" />
                      <h3 className="text-lg font-medium mb-2">Creator Settings</h3>
                      <p className="text-muted-foreground">
                        Advanced creator tools and settings coming soon
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </MainLayout>
  );
};

export default CreatorStudio;