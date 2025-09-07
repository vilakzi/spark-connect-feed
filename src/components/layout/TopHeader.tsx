import { useState } from 'react';
import { Bell, MessageCircle, Search, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useAuth } from '@/hooks/useAuth';
import { NotificationCenter } from '@/components/notifications/NotificationCenter';
import { Link } from 'react-router-dom';

export const TopHeader = () => {
  const { user } = useAuth();
  const [showNotifications, setShowNotifications] = useState(false);

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b">
      <div className="container flex h-16 items-center justify-between px-4">
        <Link to="/" className="text-xl font-bold gradient-text">
          ConnectsBuddy
        </Link>
        
        <div className="flex items-center space-x-2">
          <Button variant="ghost" size="icon">
            <Search className="h-5 w-5" />
          </Button>
          
          <Button 
            variant="ghost" 
            size="icon"
            onClick={() => setShowNotifications(!showNotifications)}
          >
            <Bell className="h-5 w-5" />
          </Button>
          
          <Button variant="ghost" size="icon">
            <MessageCircle className="h-5 w-5" />
          </Button>
          
          <Link to={`/${user?.user_metadata?.username || user?.id}`}>
            <Avatar className="h-8 w-8">
              <AvatarImage src={user?.user_metadata?.avatar_url} />
              <AvatarFallback>
                <User className="h-4 w-4" />
              </AvatarFallback>
            </Avatar>
          </Link>
        </div>
      </div>
      
      {showNotifications && (
        <div className="absolute top-full left-0 right-0 bg-background border-b">
          <NotificationCenter />
        </div>
      )}
    </header>
  );
};