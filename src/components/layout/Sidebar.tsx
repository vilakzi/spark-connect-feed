import { Link, useLocation } from 'react-router-dom';
import { Home, Users, Calendar, Radio, BarChart3 } from 'lucide-react';
import { cn } from '@/lib/utils';

const navItems = [
  { icon: Home, label: 'Home', path: '/' },
  { icon: Users, label: 'Communities', path: '/communities' },
  { icon: Calendar, label: 'Events', path: '/events' },
  { icon: Radio, label: 'Live Streams', path: '/live' },
  { icon: BarChart3, label: 'Dashboard', path: '/dashboard' },
];

export default function Sidebar() {
  const location = useLocation();

  return (
    <div className="sticky top-20 space-y-2">
      {navItems.map((item) => {
        const Icon = item.icon;
        const isActive = location.pathname === item.path;
        
        return (
          <Link
            key={item.path}
            to={item.path}
            className={cn(
              'flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors',
              isActive
                ? 'bg-primary text-primary-foreground'
                : 'hover:bg-accent text-muted-foreground hover:text-foreground'
            )}
          >
            <Icon className="h-5 w-5" />
            <span className="font-medium">{item.label}</span>
          </Link>
        );
      })}
    </div>
  );
}
