import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from '@/components/ui/sonner';
import MainLayout from '@/components/layout/MainLayout';
import AuthLayout from '@/components/layout/AuthLayout';
import Home from '@/pages/Home';
import Profile from '@/pages/Profile';
import Communities from '@/pages/Communities';
import CommunityDetail from '@/pages/CommunityDetail';
import Events from '@/pages/Events';
import EventDetail from '@/pages/EventDetail';
import Messages from '@/pages/Messages';
import LiveStreams from '@/pages/LiveStreams';
import StreamView from '@/pages/StreamView';
import CreatorDashboard from '@/pages/CreatorDashboard';
import Login from '@/pages/Login';
import Signup from '@/pages/Signup';
import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Session } from '@supabase/supabase-js';

const queryClient = new QueryClient();

function App() {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <QueryClientProvider client={queryClient}>
      <Router>
        <Routes>
          {!session ? (
            <>
              <Route element={<AuthLayout />}>
                <Route path="/login" element={<Login />} />
                <Route path="/signup" element={<Signup />} />
              </Route>
              <Route path="*" element={<Navigate to="/login" replace />} />
            </>
          ) : (
            <>
              <Route element={<MainLayout />}>
                <Route path="/" element={<Home />} />
                <Route path="/profile/:userId" element={<Profile />} />
                <Route path="/communities" element={<Communities />} />
                <Route path="/communities/:communityId" element={<CommunityDetail />} />
                <Route path="/events" element={<Events />} />
                <Route path="/events/:eventId" element={<EventDetail />} />
                <Route path="/messages" element={<Messages />} />
                <Route path="/live" element={<LiveStreams />} />
                <Route path="/live/:streamId" element={<StreamView />} />
                <Route path="/dashboard" element={<CreatorDashboard />} />
              </Route>
              <Route path="*" element={<Navigate to="/" replace />} />
            </>
          )}
        </Routes>
      </Router>
      <Toaster />
    </QueryClientProvider>
  );
}

export default App;
