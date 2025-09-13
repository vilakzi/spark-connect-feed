import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Play, Square, RotateCcw, Zap, Clock, Cpu } from 'lucide-react';
import { logInfo } from '@/lib/secureLogger';

interface BenchmarkResult {
  name: string;
  duration: number;
  score: number;
  timestamp: number;
  metadata?: Record<string, any>;
}

interface BenchmarkSuite {
  renderBenchmark: () => Promise<BenchmarkResult>;
  memoryBenchmark: () => Promise<BenchmarkResult>;
  computeBenchmark: () => Promise<BenchmarkResult>;
}

export const PerformanceBenchmark = () => {
  const [isRunning, setIsRunning] = useState(false);
  const [results, setResults] = useState<BenchmarkResult[]>([]);
  const [currentTest, setCurrentTest] = useState<string>('');
  const [progress, setProgress] = useState(0);

  // Benchmark suite implementation
  const benchmarkSuite: BenchmarkSuite = {
    renderBenchmark: async () => {
      const startTime = performance.now();
      
      // Simulate heavy rendering operations
      const container = document.createElement('div');
      container.style.position = 'absolute';
      container.style.top = '-9999px';
      document.body.appendChild(container);
      
      for (let i = 0; i < 1000; i++) {
        const element = document.createElement('div');
        const span = document.createElement('span');
        span.textContent = `Benchmark Item ${i}`; // Safe text content instead of innerHTML
        element.appendChild(span);
        element.style.backgroundColor = `hsl(${i % 360}, 70%, 50%)`;
        container.appendChild(element);
      }
      
      // Force layout recalculation
      container.offsetHeight;
      
      // Clean up
      document.body.removeChild(container);
      
      const duration = performance.now() - startTime;
      const score = Math.max(0, 100 - duration / 10);
      
      return {
        name: 'Render Performance',
        duration,
        score,
        timestamp: Date.now(),
        metadata: { elementsCreated: 1000 }
      };
    },

    memoryBenchmark: async () => {
      const startMemory = (performance as any).memory?.usedJSHeapSize || 0;
      const startTime = performance.now();
      
      // Create memory pressure
      const arrays = [];
      for (let i = 0; i < 100; i++) {
        arrays.push(new Array(1000).fill(Math.random()));
      }
      
      // Force garbage collection if available
      if ('gc' in window) {
        (window as any).gc();
      }
      
      const endMemory = (performance as any).memory?.usedJSHeapSize || 0;
      const duration = performance.now() - startTime;
      const memoryUsed = endMemory - startMemory;
      const score = Math.max(0, 100 - memoryUsed / 100000);
      
      return {
        name: 'Memory Management',
        duration,
        score,
        timestamp: Date.now(),
        metadata: { 
          memoryUsed,
          arraysCreated: arrays.length 
        }
      };
    },

    computeBenchmark: async () => {
      const startTime = performance.now();
      
      // CPU-intensive calculations
      let result = 0;
      for (let i = 0; i < 1000000; i++) {
        result += Math.sin(i) * Math.cos(i) + Math.sqrt(i);
      }
      
      const duration = performance.now() - startTime;
      const score = Math.max(0, 100 - duration / 5);
      
      return {
        name: 'Compute Performance',
        duration,
        score,
        timestamp: Date.now(),
        metadata: { 
          iterations: 1000000,
          result: result.toFixed(2)
        }
      };
    }
  };

  const runFullBenchmark = useCallback(async () => {
    setIsRunning(true);
    setProgress(0);
    setResults([]);
    
    const tests = [
      { name: 'Render Performance', test: benchmarkSuite.renderBenchmark },
      { name: 'Memory Management', test: benchmarkSuite.memoryBenchmark },
      { name: 'Compute Performance', test: benchmarkSuite.computeBenchmark }
    ];
    
    const newResults: BenchmarkResult[] = [];
    
    for (let i = 0; i < tests.length; i++) {
      setCurrentTest(tests[i].name);
      setProgress(((i + 1) / tests.length) * 100);
      
      try {
        const result = await tests[i].test();
        newResults.push(result);
        
        logInfo('Benchmark completed', {
          test: result.name,
          duration: result.duration,
          score: result.score
        }, 'PerformanceBenchmark');
        
        // Add small delay between tests
        await new Promise(resolve => setTimeout(resolve, 100));
      } catch (error) {
        logInfo('Benchmark failed', {
          test: tests[i].name,
          error: (error as Error).message
        }, 'PerformanceBenchmark');
      }
    }
    
    setResults(newResults);
    setCurrentTest('');
    setIsRunning(false);
  }, []);

  const getScoreColor = (score: number): "default" | "secondary" | "destructive" | "outline" => {
    if (score >= 80) return 'secondary';
    if (score >= 60) return 'default';
    if (score >= 40) return 'destructive';
    return 'outline';
  };

  const getOverallScore = (): number => {
    if (results.length === 0) return 0;
    return results.reduce((sum, result) => sum + result.score, 0) / results.length;
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-primary" />
            <CardTitle>Performance Benchmark</CardTitle>
          </div>
          <div className="flex gap-2">
            <Button
              onClick={runFullBenchmark}
              disabled={isRunning}
              size="sm"
            >
              {isRunning ? (
                <Square className="h-4 w-4 mr-2" />
              ) : (
                <Play className="h-4 w-4 mr-2" />
              )}
              {isRunning ? 'Running...' : 'Run Benchmark'}
            </Button>
            <Button
              onClick={() => setResults([])}
              variant="outline"
              size="sm"
              disabled={isRunning}
            >
              <RotateCcw className="h-4 w-4" />
            </Button>
          </div>
        </div>
        <CardDescription>
          Measure your application's performance across different metrics
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-6">
        {isRunning && (
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Running: {currentTest}</span>
              <span>{progress.toFixed(0)}%</span>
            </div>
            <Progress value={progress} className="w-full" />
          </div>
        )}

        {results.length > 0 && (
          <Tabs defaultValue="overview" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="details">Details</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-4">
              <div className="text-center">
                <div className="text-2xl font-bold mb-2">
                  Overall Score: {getOverallScore().toFixed(1)}
                </div>
                <Badge variant={getScoreColor(getOverallScore())}>
                  {getOverallScore() >= 80 ? 'Excellent' : 
                   getOverallScore() >= 60 ? 'Good' : 
                   getOverallScore() >= 40 ? 'Fair' : 'Needs Improvement'}
                </Badge>
              </div>

              <div className="grid gap-4 md:grid-cols-3">
                {results.map((result, index) => (
                  <Card key={index}>
                    <CardContent className="p-4 text-center">
                      <div className="flex items-center justify-center mb-2">
                        {result.name.includes('Render') && <Cpu className="h-4 w-4" />}
                        {result.name.includes('Memory') && <Cpu className="h-4 w-4" />}
                        {result.name.includes('Compute') && <Clock className="h-4 w-4" />}
                      </div>
                      <h3 className="font-medium text-sm mb-2">{result.name}</h3>
                      <div className="text-lg font-bold mb-1">
                        {result.score.toFixed(1)}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {result.duration.toFixed(1)}ms
                      </div>
                      <Badge variant={getScoreColor(result.score)} className="mt-2">
                        Score
                      </Badge>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="details" className="space-y-4">
              {results.map((result, index) => (
                <Card key={index}>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm">{result.name}</CardTitle>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="font-medium">Duration:</span> {result.duration.toFixed(2)}ms
                      </div>
                      <div>
                        <span className="font-medium">Score:</span> {result.score.toFixed(1)}
                      </div>
                      {result.metadata && Object.entries(result.metadata).map(([key, value]) => (
                        <div key={key} className="col-span-2">
                          <span className="font-medium">{key}:</span> {String(value)}
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </TabsContent>
          </Tabs>
        )}

        {!isRunning && results.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            <Zap className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Run a benchmark to measure your app's performance</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};