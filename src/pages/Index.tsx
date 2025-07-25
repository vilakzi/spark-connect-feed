import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { usePresence } from '@/hooks/usePresence';
import { useActivityTracker } from '@/hooks/useActivityTracker';
import { Button } from '@/components/ui/button';
import { InstagramFeed } from '@/components/feed/InstagramFeed';
import { SwipeInterface } from '@/components/swipe/SwipeInterface';
import { MatchesList } from '@/components/matches/MatchesList';
import { NotificationCenter } from '@/components/notifications/NotificationCenter';
import { ProfileEdit } from '@/components/profile/ProfileEdit';
import { ProfileCompletion } from '@/components/profile/ProfileCompletion';
import { LogOut, Heart, Users, Layers, Star, User } from 'lucide-react';

type ViewMode = 'swipe' | 'feed' | 'matches' | 'profile' | 'editProfile';

const Index = () => {
  const { user, signOut } = useAuth();
  const { updatePresence } = usePresence();
  const { dailyStats } = useActivityTracker();
  const [currentView, setCurrentView] = useState<ViewMode>('swipe');

  // Initialize real-time features
  useEffect(() => {
    if (user) {
      updatePresence();
    }
  }, [user, updatePresence]);

  const renderContent = () => {
    switch (currentView) {
      case 'swipe':
        return <SwipeInterface />;
      case 'feed':
        return <InstagramFeed />;
      case 'matches':
        return <MatchesList />;
      case 'profile':
        return <ProfileCompletion onEditProfile={() => setCurrentView('editProfile')} />;
      case 'editProfile':
        return <ProfileEdit onBack={() => setCurrentView('profile')} />;
      default:
        return <SwipeInterface />;
    }
  };

  // Don't render navigation for edit profile view
  if (currentView === 'editProfile') {
    return renderContent();
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-sm border-b border-border">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Heart className="w-6 h-6 text-primary" />
            <h1 className="text-xl font-bold text-primary">ConnectsBuddy</h1>
          </div>
          
          <div className="flex items-center gap-3">
            <NotificationCenter />
            <span className="text-sm text-muted-foreground hidden sm:block">
              {user?.user_metadata?.display_name || user?.email}
            </span>
            <Button onClick={signOut} variant="ghost" size="sm">
              <LogOut className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 relative">
        {currentView === 'swipe' ? (
          <div className="h-[calc(100vh-140px)] p-4">
            {renderContent()}
          </div>
        ) : currentView === 'profile' ? (
          <div className="container mx-auto px-4 py-6 max-w-md">
            {renderContent()}
          </div>
        ) : (
          <div className="container mx-auto px-4 py-6">
            {renderContent()}
          </div>
        )}
      </main>

      {/* Bottom Navigation */}
      <nav className="sticky bottom-0 bg-background border-t border-border">
        <div className="container mx-auto px-4">
          <div className="flex justify-around py-2">
            <Button
              variant={currentView === 'swipe' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setCurrentView('swipe')}
              className="flex flex-col items-center gap-1 h-auto py-2 px-4"
            >
              <Star className="w-5 h-5" />
              <span className="text-xs">Discover</span>
            </Button>
            
            <Button
              variant={currentView === 'matches' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setCurrentView('matches')}
              className="flex flex-col items-center gap-1 h-auto py-2 px-4"
            >
              <Users className="w-5 h-5" />
              <span className="text-xs">Matches</span>
            </Button>
            
            <Button
              variant={currentView === 'profile' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setCurrentView('profile')}
              className="flex flex-col items-center gap-1 h-auto py-2 px-4"
            >
              <User className="w-5 h-5" />
              <span className="text-xs">Profile</span>
            </Button>
            
            <Button
              variant={currentView === 'feed' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setCurrentView('feed')}
              className="flex flex-col items-center gap-1 h-auto py-2 px-4"
            >
              <Layers className="w-5 h-5" />
              <span className="text-xs">Feed</span>
            </Button>
          </div>
        </div>
      </nav>
    </div>
  );
};

export default Index;
