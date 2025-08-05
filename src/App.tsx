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
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import NotFound from "./pages/NotFound";
import { AdminDashboard } from "./pages/admin/AdminDashboard";
import { UserManagement } from "./pages/admin/UserManagement";
import { ContentModeration } from "./pages/admin/ContentModeration";
import { Analytics } from "./pages/admin/Analytics";
import { AdminSettings } from "./pages/admin/AdminSettings";

// Optimized QueryClient with performance settings
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      gcTime: 1000 * 60 * 30, // 30 minutes
      refetchOnWindowFocus: false,
      retry: (failureCount, error: any) => {
        // Don't retry on 4xx errors
        if (error?.status >= 400 && error?.status < 500) {
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
              <Routes>
                <Route path="/auth" element={<Auth />} />
                <Route path="/" element={
                  <ProtectedRoute>
                    <ErrorBoundary>
                      <Index />
                    </ErrorBoundary>
                  </ProtectedRoute>
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
                
                {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                <Route path="*" element={<NotFound />} />
              </Routes>
            </ErrorBoundary>
          </BrowserRouter>
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  </ErrorBoundary>
);

export default App;
