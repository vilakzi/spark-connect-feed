import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { setupErrorTracking } from './lib/errorTracking'
import { cleanupConsole } from './lib/consoleCleanup'

console.log('🚀 Starting ConnectsBuddy app...');

try {
  // Setup global error tracking and console cleanup
  console.log('⚙️ Setting up error tracking...');
  setupErrorTracking();
  
  console.log('🧹 Setting up console cleanup...');
  cleanupConsole();

  console.log('🎯 Getting root element...');
  const rootElement = document.getElementById("root");
  if (!rootElement) {
    throw new Error('Root element not found!');
  }

  console.log('📦 Creating React root...');
  const root = createRoot(rootElement);
  
  console.log('🎨 Rendering App...');
  root.render(<App />);
  
  console.log('✅ App successfully initialized!');
} catch (error) {
  console.error('❌ Failed to initialize app:', error);
  // Show a fallback error message
  const rootElement = document.getElementById("root");
  if (rootElement) {
    rootElement.innerHTML = `
      <div style="display: flex; align-items: center; justify-content: center; height: 100vh; font-family: Arial, sans-serif;">
        <div style="text-align: center; padding: 20px; border: 1px solid #ff0000; border-radius: 8px; background: #fff;">
          <h1 style="color: #ff0000;">App Failed to Start</h1>
          <p>Error: ${error instanceof Error ? error.message : 'Unknown error'}</p>
          <button onclick="location.reload()" style="padding: 10px 20px; margin-top: 10px; cursor: pointer;">Reload Page</button>
        </div>
      </div>
    `;
  }
}
