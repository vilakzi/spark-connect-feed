import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { setupErrorTracking } from './lib/errorTracking'
import { cleanupConsole } from './lib/consoleCleanup'

// Setup global error tracking and console cleanup
setupErrorTracking();
cleanupConsole();

createRoot(document.getElementById("root")!).render(<App />);
