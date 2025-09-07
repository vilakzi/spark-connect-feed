import { MainLayout } from '@/components/layout/MainLayout';
import { SwipeInterface } from '@/components/swipe/SwipeInterface';
import { MatchesList } from '@/components/matches/MatchesList';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

const HookupFeed = () => {
  return (
    <MainLayout>
      <div className="container max-w-md mx-auto px-4">
        <Tabs defaultValue="discover" className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-6">
            <TabsTrigger value="discover">Discover</TabsTrigger>
            <TabsTrigger value="matches">Matches</TabsTrigger>
          </TabsList>
          
          <TabsContent value="discover" className="space-y-4">
            <SwipeInterface />
          </TabsContent>
          
          <TabsContent value="matches" className="space-y-4">
            <MatchesList />
          </TabsContent>
        </Tabs>
      </div>
    </MainLayout>
  );
};

export default HookupFeed;