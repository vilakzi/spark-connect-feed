import { logger } from './logger';

interface ErrorInfo {
  componentStack?: string;
  errorBoundary?: string;
  userId?: string;
  userAgent?: string;
  url?: string;
  timestamp?: Date;
}

interface ErrorReporter {
  reportError(error: Error, errorInfo?: ErrorInfo): void;
  reportUnhandledRejection(event: PromiseRejectionEvent): void;
  reportGlobalError(event: ErrorEvent): void;
}

class ProductionErrorReporter implements ErrorReporter {
  reportError(error: Error, errorInfo?: ErrorInfo): void {
    logger.error('Component Error', {
      message: error.message,
      stack: error.stack,
      ...errorInfo,
    });

    // TODO: In production, send to error tracking service
    // Example: Sentry.captureException(error, { extra: errorInfo });
  }

  reportUnhandledRejection(event: PromiseRejectionEvent): void {
    logger.error('Unhandled Promise Rejection', {
      reason: event.reason,
      promise: event.promise,
    });

    // TODO: Send to error tracking service
  }

  reportGlobalError(event: ErrorEvent): void {
    logger.error('Global Error', {
      message: event.message,
      filename: event.filename,
      lineno: event.lineno,
      colno: event.colno,
      error: event.error,
    });

    // TODO: Send to error tracking service
  }
}

class DevelopmentErrorReporter implements ErrorReporter {
  reportError(error: Error, errorInfo?: ErrorInfo): void {
    console.group('🔥 Component Error');
    console.error('Error:', error);
    console.error('Error Info:', errorInfo);
    console.groupEnd();
  }

  reportUnhandledRejection(event: PromiseRejectionEvent): void {
    console.group('🔥 Unhandled Promise Rejection');
    console.error('Reason:', event.reason);
    console.error('Promise:', event.promise);
    console.groupEnd();
  }

  reportGlobalError(event: ErrorEvent): void {
    console.group('🔥 Global Error');
    console.error('Message:', event.message);
    console.error('File:', event.filename);
    console.error('Line:', event.lineno);
    console.error('Column:', event.colno);
    console.error('Error:', event.error);
    console.groupEnd();
  }
}

// Global error handlers setup
export const setupErrorTracking = (): void => {
  const reporter = import.meta.env.DEV 
    ? new DevelopmentErrorReporter() 
    : new ProductionErrorReporter();

  // Handle unhandled promise rejections
  window.addEventListener('unhandledrejection', (event) => {
    reporter.reportUnhandledRejection(event);
  });

  // Handle global errors
  window.addEventListener('error', (event) => {
    reporter.reportGlobalError(event);
  });
};

export const errorReporter = import.meta.env.DEV 
  ? new DevelopmentErrorReporter() 
  : new ProductionErrorReporter();