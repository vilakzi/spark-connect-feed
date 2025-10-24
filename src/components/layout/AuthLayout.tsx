import { Outlet } from 'react-router-dom';

export default function AuthLayout() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-primary/5 p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center space-x-2 mb-4">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary to-primary/60" />
            <span className="font-bold text-3xl">Connects Buddy</span>
          </div>
          <p className="text-muted-foreground">Connect, share, and grow together</p>
        </div>
        <Outlet />
      </div>
    </div>
  );
}
