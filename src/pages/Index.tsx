import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { usePresence } from '@/hooks/usePresence';
import { useActivityTracker } from '@/hooks/useActivityTracker';
import { useChat } from '@/hooks/useChat';
import { useProfileViews } from '@/hooks/useProfileViews';
import { Button } from '@/components/ui/button';
import { EnhancedFeed } from '@/components/feed/EnhancedFeed';
import { SwipeInterface } from '@/components/swipe/SwipeInterface';
import { MatchesList } from '@/components/matches/MatchesList';
import { NotificationCenter } from '@/components/notifications/NotificationCenter';
import { ProfileEdit } from '@/components/profile/ProfileEdit';
import { ProfileCompletion } from '@/components/profile/ProfileCompletion';
import { ConversationList } from '@/components/chat/ConversationList';
import { ChatInterface } from '@/components/chat/ChatInterface';
import { StoriesInterface } from '@/components/stories/StoriesInterface';
import { ProfileViewsTracker } from '@/components/social/ProfileViewsTracker';
import { NotificationSettings } from '@/components/notifications/NotificationSettings';
import { LogOut, Heart, Users, Layers, Star, User, MessageCircle, Settings, Search, Camera, TrendingUp, Eye } from 'lucide-react';
import { useAdminCheck } from '@/hooks/useAdminCheck';

type ViewMode = 'feed' | 'discover' | 'stories' | 'insights' | 'matches' | 'profile' | 'editProfile' | 'notifications' | 'chat' | 'chatInterface';

const Index = () => {
  const { user, signOut } = useAuth();
  const { updatePresence } = usePresence();
  const { dailyStats } = useActivityTracker();
  const { isAdmin } = useAdminCheck();
  const { trackProfileView } = useProfileViews();
  const [currentView, setCurrentView] = useState<ViewMode>('feed');
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null);
  const { createConversation } = useChat();

  // Initialize real-time features
  useEffect(() => {
    if (user) {
      // Track page view activity
      console.log('User viewed page');
    }
  }, [user]);

  const handleStartChat = async (matchId: string) => {
    const conversationId = await createConversation(matchId);
    if (conversationId) {
      setSelectedConversationId(conversationId);
      setCurrentView('chatInterface');
    }
  };

  const handleConversationSelect = (conversationId: string) => {
    setSelectedConversationId(conversationId);
    setCurrentView('chatInterface');
  };

  const handleBackToChat = () => {
    setSelectedConversationId(null);
    setCurrentView('chat');
  };

  const renderContent = () => {
    switch (currentView) {
      case 'feed':
        return <EnhancedFeed />;
      case 'discover':
        return <SwipeInterface />;
      case 'stories':
        return <StoriesInterface />;
      case 'insights':
        return <ProfileViewsTracker />;
      case 'matches':
        return <MatchesList onStartChat={handleStartChat} />;
      case 'chat':
        return <ConversationList onConversationSelect={handleConversationSelect} />;
      case 'chatInterface':
        return selectedConversationId ? (
          <ChatInterface 
            conversationId={selectedConversationId} 
            onBack={handleBackToChat}
          />
        ) : null;
      case 'profile':
        return (
          <ProfileCompletion 
            onEditProfile={() => setCurrentView('editProfile')}
            onNotificationSettings={() => setCurrentView('notifications')}
          />
        );
      case 'editProfile':
        return <ProfileEdit onBack={() => setCurrentView('profile')} />;
      case 'notifications':
        return <NotificationSettings onBack={() => setCurrentView('profile')} />;
      default:
        return <EnhancedFeed />;
    }
  };

  // Don't render navigation for edit profile, notifications, and chat interface views
  if (currentView === 'editProfile' || currentView === 'chatInterface' || currentView === 'notifications') {
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
            {isAdmin && (
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => window.open('/admin', '_blank')}
                className="hidden sm:flex"
              >
                <Settings className="w-4 h-4 mr-2" />
                Admin
              </Button>
            )}
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
        {currentView === 'profile' ? (
          <div className="container mx-auto px-4 py-6 max-w-md">
            {renderContent()}
          </div>
        ) : currentView === 'discover' ? (
          <div className="h-full flex items-center justify-center p-4">
            <div className="w-full max-w-sm h-full">
              {renderContent()}
            </div>
          </div>
        ) : (
          renderContent()
        )}
      </main>

      {/* Bottom Navigation */}
      <nav className="sticky bottom-0 bg-background border-t border-border">
        <div className="container mx-auto px-4">
          <div className="flex justify-around py-2">
            <Button
              variant={currentView === 'feed' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setCurrentView('feed')}
              className="flex flex-col items-center gap-1 h-auto py-2 px-3"
            >
              <Layers className="w-5 h-5" />
              <span className="text-xs">Feed</span>
            </Button>
            
            <Button
              variant={currentView === 'discover' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setCurrentView('discover')}
              className="flex flex-col items-center gap-1 h-auto py-2 px-3"
            >
              <Search className="w-5 h-5" />
              <span className="text-xs">Discover</span>
            </Button>

            <Button
              variant={currentView === 'stories' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setCurrentView('stories')}
              className="flex flex-col items-center gap-1 h-auto py-2 px-3"
            >
              <Camera className="w-5 h-5" />
              <span className="text-xs">Stories</span>
            </Button>
            
            <Button
              variant={currentView === 'matches' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setCurrentView('matches')}
              className="flex flex-col items-center gap-1 h-auto py-2 px-3"
            >
              <Users className="w-5 h-5" />
              <span className="text-xs">Matches</span>
            </Button>
            
            <Button
              variant={currentView === 'chat' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setCurrentView('chat')}
              className="flex flex-col items-center gap-1 h-auto py-2 px-3"
            >
              <MessageCircle className="w-5 h-5" />
              <span className="text-xs">Chat</span>
            </Button>

            <Button
              variant={currentView === 'insights' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setCurrentView('insights')}
              className="flex flex-col items-center gap-1 h-auto py-2 px-3"
            >
              <TrendingUp className="w-5 h-5" />
              <span className="text-xs">Insights</span>
            </Button>
            
            <Button
              variant={currentView === 'profile' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setCurrentView('profile')}
              className="flex flex-col items-center gap-1 h-auto py-2 px-3"
            >
              <User className="w-5 h-5" />
              <span className="text-xs">Profile</span>
            </Button>
          </div>
        </div>
      </nav>
    </div>
  );
};

export default Index;
