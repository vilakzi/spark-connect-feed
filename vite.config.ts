import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
  },
  plugins: [
    react(),
    mode === 'development' &&
    componentTagger(),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: (id: string) => {
          // Core React libraries
          if (id.includes('react') || id.includes('react-dom') || id.includes('react-router-dom')) {
            return 'react-vendor';
          }
          
          // All Radix UI components
          if (id.includes('@radix-ui/')) {
            return 'radix-vendor';
          }
          
          // Major UI libraries
          if (id.includes('lucide-react') || id.includes('tailwind-merge') || 
              id.includes('class-variance-authority') || id.includes('sonner')) {
            return 'ui-vendor';
          }
          
          // Data and state management
          if (id.includes('@tanstack/react-query') || id.includes('@supabase/supabase-js')) {
            return 'data-vendor';
          }
          
          // Chart libraries
          if (id.includes('recharts')) {
            return 'chart-vendor';
          }
          
          // If it's a node_modules dependency but not categorized above, put it in vendor
          if (id.includes('node_modules')) {
            return 'vendor';
          }
        }
      }
    },
    chunkSizeWarningLimit: 600, // Increase limit to 600kb
    target: 'esnext',
    minify: 'esbuild', // Use esbuild instead of terser for faster builds
  },
}));
