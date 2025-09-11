import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Activity, Cpu, MemoryStick, Clock, AlertTriangle, TrendingUp } from 'lucide-react';
import { getPerformanceMetrics, performanceAnalytics } from '@/lib/performanceAnalytics';
import { logInfo } from '@/lib/secureLogger';

export const PerformanceDashboard = () => {
  const [metrics, setMetrics] = useState(getPerformanceMetrics());
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setMetrics(getPerformanceMetrics());
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  const handleClearData = () => {
    performanceAnalytics.clear();
    setMetrics(getPerformanceMetrics());
    logInfo('Performance data cleared', {}, 'PerformanceDashboard');
  };

  const handleLogSummary = () => {
    performanceAnalytics.logSummary();
  };

  if (!isVisible && import.meta.env.PROD) {
    return null; // Hide in production unless toggled
  }

  const getStatusColor = (value: number, threshold: number) => {
    if (value > threshold * 2) return 'destructive';
    if (value > threshold) return 'secondary';
    return 'default';
  };

  const formatBytes = (bytes: number) => {
    const mb = bytes / (1024 * 1024);
    return `${mb.toFixed(1)} MB`;
  };

  return (
    <div className="fixed bottom-4 right-4 z-50">
      {!isVisible ? (
        <Button
          variant="outline"
          size="sm"
          onClick={() => setIsVisible(true)}
          className="shadow-lg"
        >
          <Activity className="h-4 w-4 mr-2" />
          Performance
        </Button>
      ) : (
        <Card className="w-96 max-h-96 shadow-xl">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Activity className="h-4 w-4" />
                <CardTitle className="text-sm">Performance Monitor</CardTitle>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsVisible(false)}
              >
                ×
              </Button>
            </div>
            <CardDescription className="text-xs">
              Real-time app performance metrics
            </CardDescription>
          </CardHeader>

          <CardContent className="pt-0 space-y-4">
            <Tabs defaultValue="overview" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="details">Details</TabsTrigger>
              </TabsList>

              <TabsContent value="overview" className="space-y-3 mt-3">
                {/* Average Render Time */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      Avg Render Time
                    </div>
                    <Badge variant={getStatusColor(metrics.averageRenderTime, 50)}>
                      {metrics.averageRenderTime.toFixed(1)}ms
                    </Badge>
                  </div>
                  <Progress value={Math.min(metrics.averageRenderTime, 100)} className="h-1" />
                </div>

                {/* Memory Usage */}
                {metrics.memory && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-1">
                        <MemoryStick className="h-3 w-3" />
                        Memory Usage
                      </div>
                      <Badge variant={getStatusColor(metrics.memory.used, 25 * 1024 * 1024)}>
                        {formatBytes(metrics.memory.used)}
                      </Badge>
                    </div>
                    <Progress 
                      value={(metrics.memory.used / metrics.memory.limit) * 100} 
                      className="h-1" 
                    />
                  </div>
                )}

                {/* Performance Issues */}
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-1">
                    <AlertTriangle className="h-3 w-3" />
                    Issues
                  </div>
                  <div className="flex gap-1">
                    {metrics.slowRenders > 0 && (
                      <Badge variant="destructive">{metrics.slowRenders} slow renders</Badge>
                    )}
                    {metrics.slowNavigations > 0 && (
                      <Badge variant="destructive">{metrics.slowNavigations} slow nav</Badge>
                    )}
                    {metrics.slowAPICalls > 0 && (
                      <Badge variant="destructive">{metrics.slowAPICalls} slow API</Badge>
                    )}
                    {metrics.slowRenders === 0 && metrics.slowNavigations === 0 && metrics.slowAPICalls === 0 && (
                      <Badge variant="default">All good</Badge>
                    )}
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="details" className="space-y-2 mt-3">
                <div className="text-xs space-y-1">
                  <div className="flex justify-between">
                    <span>Total Entries:</span>
                    <span>{metrics.totalEntries}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Avg Navigation:</span>
                    <span>{metrics.averageNavigationTime.toFixed(1)}ms</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Avg API Time:</span>
                    <span>{metrics.averageAPITime.toFixed(1)}ms</span>
                  </div>
                  {metrics.memory && (
                    <>
                      <div className="flex justify-between">
                        <span>Memory Used:</span>
                        <span>{formatBytes(metrics.memory.used)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Memory Total:</span>
                        <span>{formatBytes(metrics.memory.total)}</span>
                      </div>
                    </>
                  )}
                </div>

                <div className="flex gap-1 pt-2">
                  <Button size="sm" variant="outline" onClick={handleLogSummary} className="text-xs flex-1">
                    Log Summary
                  </Button>
                  <Button size="sm" variant="outline" onClick={handleClearData} className="text-xs flex-1">
                    Clear Data
                  </Button>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      )}
    </div>
  );
};