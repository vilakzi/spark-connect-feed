import { ReactNode } from 'react';
import { BottomNavigation } from './BottomNavigation';
import { TopHeader } from './TopHeader';

interface MainLayoutProps {
  children: ReactNode;
  showBottomNav?: boolean;
}

export const MainLayout = ({ children, showBottomNav = true }: MainLayoutProps) => {
  return (
    <div className="min-h-screen bg-background">
      <TopHeader />
      <main className="pb-16 pt-16">
        {children}
      </main>
      {showBottomNav && <BottomNavigation />}
    </div>
  );
};