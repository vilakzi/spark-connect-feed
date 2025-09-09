/**
 * Secure logging system that replaces console.log statements
 * Only logs in development, filters sensitive data in production
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogEntry {
  level: LogLevel;
  message: string;
  timestamp: number;
  component?: string;
  userId?: string;
}

class SecureLogger {
  private isDevelopment = process.env.NODE_ENV === 'development';
  private sensitivePatterns = [
    /password/i,
    /token/i,
    /secret/i,
    /key/i,
    /auth/i,
    /session/i
  ];

  private sanitizeData(data: any): any {
    if (typeof data === 'string') {
      // Check if string contains sensitive information
      if (this.sensitivePatterns.some(pattern => pattern.test(data))) {
        return '[REDACTED]';
      }
      return data;
    }

    if (typeof data === 'object' && data !== null) {
      const sanitized: any = {};
      for (const [key, value] of Object.entries(data)) {
        if (this.sensitivePatterns.some(pattern => pattern.test(key))) {
          sanitized[key] = '[REDACTED]';
        } else {
          sanitized[key] = this.sanitizeData(value);
        }
      }
      return sanitized;
    }

    return data;
  }

  private log(level: LogLevel, message: string, data?: any, component?: string) {
    if (!this.isDevelopment && level === 'debug') {
      return; // Skip debug logs in production
    }

    const sanitizedData = data ? this.sanitizeData(data) : undefined;
    const entry: LogEntry = {
      level,
      message,
      timestamp: Date.now(),
      component
    };

    if (this.isDevelopment) {
      const logMethod = console[level] || console.log;
      if (sanitizedData) {
        logMethod(`[${component || 'App'}] ${message}`, sanitizedData);
      } else {
        logMethod(`[${component || 'App'}] ${message}`);
      }
    } else {
      // In production, could send to external logging service
      // For now, only log errors to console
      if (level === 'error') {
        console.error(message, sanitizedData);
      }
    }
  }

  debug(message: string, data?: any, component?: string) {
    this.log('debug', message, data, component);
  }

  info(message: string, data?: any, component?: string) {
    this.log('info', message, data, component);
  }

  warn(message: string, data?: any, component?: string) {
    this.log('warn', message, data, component);
  }

  error(message: string, data?: any, component?: string) {
    this.log('error', message, data, component);
  }
}

export const secureLogger = new SecureLogger();

// Convenience methods
export const logDebug = (message: string, data?: any, component?: string) => 
  secureLogger.debug(message, data, component);

export const logInfo = (message: string, data?: any, component?: string) => 
  secureLogger.info(message, data, component);

export const logWarn = (message: string, data?: any, component?: string) => 
  secureLogger.warn(message, data, component);

export const logError = (message: string, data?: any, component?: string) => 
  secureLogger.error(message, data, component);