// Console cleanup utility for Phase 1
// This removes all console.log/error statements in production

export const cleanupConsole = () => {
  if (import.meta.env.PROD) {
    // Override console methods in production
    const noop = () => {};
    
    console.log = noop;
    console.debug = noop;
    console.info = noop;
    
    // Keep warn and error for critical issues but limit them
    const originalWarn = console.warn;
    const originalError = console.error;
    
    console.warn = (...args: any[]) => {
      // Only log if it's a React or critical system warning
      if (args[0]?.includes?.('React') || args[0]?.includes?.('Warning')) {
        originalWarn.apply(console, args);
      }
    };
    
    console.error = (...args: any[]) => {
      // Only log critical errors
      if (args[0]?.includes?.('Error') || args[0]?.includes?.('Failed')) {
        originalError.apply(console, args);
      }
    };
  }
};
