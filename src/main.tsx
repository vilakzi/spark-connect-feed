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
  // Show a fallback error message with safe DOM manipulation
  const rootElement = document.getElementById("root");
  if (rootElement) {
    // Clear existing content safely
    rootElement.textContent = '';
    
    // Create error container
    const errorContainer = document.createElement('div');
    errorContainer.style.cssText = 'display: flex; align-items: center; justify-content: center; height: 100vh; font-family: Arial, sans-serif;';
    
    const errorBox = document.createElement('div');
    errorBox.style.cssText = 'text-align: center; padding: 20px; border: 1px solid #ff0000; border-radius: 8px; background: #fff;';
    
    const title = document.createElement('h1');
    title.style.color = '#ff0000';
    title.textContent = 'App Failed to Start';
    
    const message = document.createElement('p');
    message.textContent = `Error: ${error instanceof Error ? error.message : 'Unknown error'}`;
    
    const reloadButton = document.createElement('button');
    reloadButton.style.cssText = 'padding: 10px 20px; margin-top: 10px; cursor: pointer;';
    reloadButton.textContent = 'Reload Page';
    reloadButton.addEventListener('click', () => location.reload());
    
    errorBox.appendChild(title);
    errorBox.appendChild(message);
    errorBox.appendChild(reloadButton);
    errorContainer.appendChild(errorBox);
    rootElement.appendChild(errorContainer);
  }
}
