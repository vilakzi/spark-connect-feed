export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
}

interface LogContext {
  [key: string]: any;
}

interface LogEntry {
  level: LogLevel;
  message: string;
  context?: LogContext;
  timestamp: Date;
  component?: string;
  userId?: string;
}

class Logger {
  private isDevelopment = import.meta.env.DEV;
  private minLevel = this.isDevelopment ? LogLevel.DEBUG : LogLevel.WARN;

  private formatMessage(entry: LogEntry): string {
    const timestamp = entry.timestamp.toISOString();
    const level = LogLevel[entry.level];
    const component = entry.component ? `[${entry.component}]` : '';
    
    return `${timestamp} ${level} ${component} ${entry.message}`;
  }

  private shouldLog(level: LogLevel): boolean {
    return level >= this.minLevel;
  }

  private log(level: LogLevel, message: string, context?: LogContext, component?: string): void {
    if (!this.shouldLog(level)) return;

    const entry: LogEntry = {
      level,
      message,
      context,
      timestamp: new Date(),
      component,
    };

    const formattedMessage = this.formatMessage(entry);

    // In production, you would send to logging service
    if (!this.isDevelopment && level >= LogLevel.ERROR) {
      // TODO: Send to error tracking service (Sentry, LogRocket, etc.)
    }

    // Console output for development
    if (this.isDevelopment) {
      switch (level) {
        case LogLevel.DEBUG:
          console.debug(formattedMessage, context);
          break;
        case LogLevel.INFO:
          console.info(formattedMessage, context);
          break;
        case LogLevel.WARN:
          console.warn(formattedMessage, context);
          break;
        case LogLevel.ERROR:
          console.error(formattedMessage, context);
          break;
      }
    }
  }

  debug(message: string, context?: LogContext, component?: string): void {
    this.log(LogLevel.DEBUG, message, context, component);
  }

  info(message: string, context?: LogContext, component?: string): void {
    this.log(LogLevel.INFO, message, context, component);
  }

  warn(message: string, context?: LogContext, component?: string): void {
    this.log(LogLevel.WARN, message, context, component);
  }

  error(message: string, context?: LogContext, component?: string): void {
    this.log(LogLevel.ERROR, message, context, component);
  }
}

export const logger = new Logger();

// Convenience functions for common use cases
export const logError = (error: Error | unknown, context?: LogContext, component?: string) => {
  const errorMessage = error instanceof Error ? error.message : String(error);
  const errorContext = {
    ...context,
    stack: error instanceof Error ? error.stack : undefined,
  };
  logger.error(errorMessage, errorContext, component);
};

export const logApiError = (endpoint: string, error: Error | unknown, context?: LogContext) => {
  logError(error, { ...context, endpoint }, 'API');
};