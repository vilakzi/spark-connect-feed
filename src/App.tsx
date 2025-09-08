import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import ProtectedRoute from "@/components/ProtectedRoute";
import { AdminRoute } from "@/components/admin/AdminRoute";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { Suspense, lazy } from "react";

// Lazy load pages for code splitting
const Index = lazy(() => import("./pages/Index"));
const Auth = lazy(() => import("./pages/Auth"));
const NotFound = lazy(() => import("./pages/NotFound"));

// Lazy load category-specific pages
const HookupFeed = lazy(() => import("./pages/hookup/HookupFeed"));
const CreatorMarketplace = lazy(() => import("./pages/creator/CreatorMarketplace"));
const CreatorProfile = lazy(() => import("./pages/creator/CreatorProfile"));
const CreatorStudio = lazy(() => import("./pages/creator/CreatorStudio"));
const Communities = lazy(() => import("./pages/social/Communities"));
const Events = lazy(() => import("./pages/social/Events"));
const LiveCamLounge = lazy(() => import("./pages/live/LiveCamLounge"));
const LiveStream = lazy(() => import("./pages/live/LiveStream"));
const BroadcastPage = lazy(() => import("./pages/live/BroadcastPage"));
const UserProfile = lazy(() => import("./pages/profile/UserProfile"));

// Lazy load admin pages
const AdminDashboard = lazy(() => import("./pages/admin/AdminDashboard").then(module => ({ default: module.AdminDashboard })));
const UserManagement = lazy(() => import("./pages/admin/UserManagement").then(module => ({ default: module.UserManagement })));
const ContentModeration = lazy(() => import("./pages/admin/ContentModeration").then(module => ({ default: module.ContentModeration })));
const Analytics = lazy(() => import("./pages/admin/Analytics").then(module => ({ default: module.Analytics })));
const AdminSettings = lazy(() => import("./pages/admin/AdminSettings").then(module => ({ default: module.AdminSettings })));

// Loading component for Suspense fallback
const LoadingSpinner = () => (
  <div className="flex items-center justify-center min-h-screen">
    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
  </div>
);

// Optimized QueryClient with performance settings
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      gcTime: 1000 * 60 * 30, // 30 minutes
      refetchOnWindowFocus: false,
      retry: (failureCount, error: Error & { status?: number }) => {
        // Don't retry on 4xx errors
        if (error?.status && error.status >= 400 && error.status < 500) {
          return false;
        }
        return failureCount < 3;
      },
    },
    mutations: {
      retry: 1,
    },
  },
});

const App = () => (
  <ErrorBoundary>
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <ErrorBoundary>
              <Suspense fallback={<LoadingSpinner />}>
                <Routes>
                  <Route path="/auth" element={<Auth />} />
                  <Route path="/" element={
                    <ProtectedRoute>
                      <ErrorBoundary>
                        <Index />
                      </ErrorBoundary>
                    </ProtectedRoute>
                  } />
                  
                  {/* Category-specific Routes */}
                  <Route path="/hookup" element={
                    <ProtectedRoute>
                      <ErrorBoundary>
                        <HookupFeed />
                      </ErrorBoundary>
                    </ProtectedRoute>
                  } />
                  
                  <Route path="/creators" element={
                    <ProtectedRoute>
                      <ErrorBoundary>
                        <CreatorMarketplace />
                      </ErrorBoundary>
                    </ProtectedRoute>
                  } />
                  
                   <Route path="/creator/:username" element={
                    <ProtectedRoute>
                      <ErrorBoundary>
                        <CreatorProfile />
                      </ErrorBoundary>
                    </ProtectedRoute>
                  } />
                  
                  <Route path="/creator/studio" element={
                    <ProtectedRoute>
                      <ErrorBoundary>
                        <CreatorStudio />
                      </ErrorBoundary>
                    </ProtectedRoute>
                  } />
                  
                  <Route path="/communities" element={
                    <ProtectedRoute>
                      <ErrorBoundary>
                        <Communities />
                      </ErrorBoundary>
                    </ProtectedRoute>
                  } />
                  
                  <Route path="/events" element={
                    <ProtectedRoute>
                      <ErrorBoundary>
                        <Events />
                      </ErrorBoundary>
                    </ProtectedRoute>
                  } />
                  
                  <Route path="/live" element={
                    <ProtectedRoute>
                      <ErrorBoundary>
                        <LiveCamLounge />
                      </ErrorBoundary>
                    </ProtectedRoute>
                  } />
                  
                  <Route path="/live/:streamId" element={
                    <ProtectedRoute>
                      <ErrorBoundary>
                        <LiveStream />
                      </ErrorBoundary>
                    </ProtectedRoute>
                  } />
                  
                  <Route path="/live/broadcast" element={
                    <ProtectedRoute>
                      <ErrorBoundary>
                        <BroadcastPage />
                      </ErrorBoundary>
                    </ProtectedRoute>
                  } />
                  
                  {/* Profile Routes */}
                  <Route path="/:username" element={
                    <ErrorBoundary>
                      <UserProfile />
                    </ErrorBoundary>
                  } />
                  
                  {/* Admin Routes */}
                  <Route path="/admin" element={
                    <AdminRoute>
                      <ErrorBoundary>
                        <AdminLayout />
                      </ErrorBoundary>
                    </AdminRoute>
                  }>
                    <Route index element={<AdminDashboard />} />
                    <Route path="users" element={<UserManagement />} />
                    <Route path="content" element={<ContentModeration />} />
                    <Route path="analytics" element={<Analytics />} />
                    <Route path="settings" element={<AdminSettings />} />
                  </Route>
                  
                  {/* 404 Route */}
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </Suspense>
            </ErrorBoundary>
          </BrowserRouter>
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  </ErrorBoundary>
);

export default App;
