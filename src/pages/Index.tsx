import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';

const Index = () => {
  const { user, signOut } = useAuth();

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="text-center space-y-6 max-w-md">
        <h1 className="text-4xl font-bold text-primary mb-4">Welcome to ConnectsBuddy</h1>
        <p className="text-xl text-muted-foreground">Hey {user?.user_metadata?.display_name || user?.email}! 👋</p>
        <p className="text-muted-foreground">Your social connection journey starts here.</p>
        
        <div className="pt-4">
          <Button onClick={signOut} variant="outline">
            Sign Out
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Index;
