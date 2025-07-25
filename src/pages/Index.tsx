import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { InstagramFeed } from '@/components/feed/InstagramFeed';
import { LogOut, Heart } from 'lucide-react';

const Index = () => {
  const { user, signOut } = useAuth();

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-sm border-b border-border">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Heart className="w-6 h-6 text-primary" />
            <h1 className="text-xl font-bold text-primary">ConnectsBuddy</h1>
          </div>
          
          <div className="flex items-center gap-3">
            <span className="text-sm text-muted-foreground hidden sm:block">
              {user?.user_metadata?.display_name || user?.email}
            </span>
            <Button onClick={signOut} variant="ghost" size="sm">
              <LogOut className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </header>

      {/* Feed */}
      <main>
        <InstagramFeed />
      </main>
    </div>
  );
};

export default Index;
