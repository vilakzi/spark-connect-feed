import { Outlet } from 'react-router-dom';
import { AdminSidebar } from './AdminSidebar';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { LogOut, Bell } from 'lucide-react';

export const AdminLayout = () => {
  const { signOut, user } = useAuth();

  return (
    <div className="min-h-screen bg-background">
      <div className="flex h-screen">
        <AdminSidebar />
        
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Top Header */}
          <header className="bg-card border-b border-border px-6 py-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-foreground">Admin Dashboard</h2>
                <p className="text-sm text-muted-foreground">Manage your ConnectsBuddy platform</p>
              </div>
              
              <div className="flex items-center gap-4">
                <Button variant="ghost" size="sm">
                  <Bell className="h-4 w-4" />
                </Button>
                
                <div className="flex items-center gap-2 text-sm">
                  <span className="text-muted-foreground">Welcome,</span>
                  <span className="font-medium">{user?.email}</span>
                </div>
                
                <Button variant="outline" size="sm" onClick={signOut}>
                  <LogOut className="h-4 w-4 mr-2" />
                  Sign Out
                </Button>
              </div>
            </div>
          </header>

          {/* Main Content */}
          <main className="flex-1 overflow-auto p-6">
            <Outlet />
          </main>
        </div>
      </div>
    </div>
  );
};