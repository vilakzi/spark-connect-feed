import { Home, Users, Video, Heart, User } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';

export const BottomNavigation = () => {
  const location = useLocation();
  const { user } = useAuth();

  const navItems = [
    { 
      icon: Home, 
      label: 'Home', 
      path: '/',
      category: 'all'
    },
    { 
      icon: Heart, 
      label: 'Hookup', 
      path: '/hookup',
      category: 'hookup'
    },
    { 
      icon: Users, 
      label: 'Creators', 
      path: '/creators',
      category: 'creator'
    },
    { 
      icon: Video, 
      label: 'Live', 
      path: '/live',
      category: 'live'
    },
    { 
      icon: User, 
      label: 'Profile', 
      path: `/${user?.user_metadata?.username || user?.id}`,
      category: 'profile'
    }
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-t">
      <div className="flex justify-around items-center h-16 px-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path;
          
          return (
            <Link key={item.path} to={item.path} className="flex-1">
              <Button
                variant="ghost"
                size="sm"
                className={cn(
                  "w-full h-12 flex flex-col items-center justify-center space-y-1",
                  isActive && "text-primary bg-primary/10"
                )}
              >
                <Icon className="h-5 w-5" />
                <span className="text-xs">{item.label}</span>
              </Button>
            </Link>
          );
        })}
      </div>
    </nav>
  );
};