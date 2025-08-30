/**
 * Comprehensive Logging System for MetricsHub SDK
 * 
 * Provides structured logging with levels, context, and debugging utilities
 */

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

export interface LogContext {
  [key: string]: any;
}

export interface LogEntry {
  level: LogLevel;
  message: string;
  context?: LogContext;
  timestamp: Date;
  component?: string;
  requestId?: string;
}

/**
 * Enhanced Logger class with multiple output formats and context support
 */
export class Logger {
  private static currentLevel: LogLevel = 'info';
  private static enabledComponents: Set<string> = new Set();
  private static logEntries: LogEntry[] = [];
  private static maxEntries: number = 1000;
  private static requestId?: string;

  /**
   * Set the minimum log level
   */
  static setLevel(level: LogLevel): void {
    this.currentLevel = level;
  }

  /**
   * Get current log level
   */
  static getLevel(): LogLevel {
    return this.currentLevel;
  }

  /**
   * Enable logging for specific components
   */
  static enableComponent(component: string): void {
    this.enabledComponents.add(component);
  }

  /**
   * Disable logging for specific components
   */
  static disableComponent(component: string): void {
    this.enabledComponents.delete(component);
  }

  /**
   * Set request ID for correlation
   */
  static setRequestId(requestId: string): void {
    this.requestId = requestId;
  }

  /**
   * Clear request ID
   */
  static clearRequestId(): void {
    this.requestId = undefined;
  }

  /**
   * Debug level logging
   */
  static debug(message: string, context?: LogContext, component?: string): void {
    this.log('debug', message, context, component);
  }

  /**
   * Info level logging
   */
  static info(message: string, context?: LogContext, component?: string): void {
    this.log('info', message, context, component);
  }

  /**
   * Warning level logging
   */
  static warn(message: string, context?: LogContext, component?: string): void {
    this.log('warn', message, context, component);
  }

  /**
   * Error level logging with optional Error object
   */
  static error(message: string, error?: Error, context?: LogContext, component?: string): void {
    const errorContext = error ? {
      ...context,
      error: {
        name: error.name,
        message: error.message,
        stack: error.stack,
        code: (error as any).code,
        status: (error as any).status || (error as any).statusCode
      }
    } : context;

    this.log('error', message, errorContext, component);
  }

  /**
   * Core logging method
   */
  private static log(level: LogLevel, message: string, context?: LogContext, component?: string): void {
    // Check if logging is enabled for this level
    if (!this.shouldLog(level)) {
      return;
    }

    // Check if logging is enabled for this component
    if (component && this.enabledComponents.size > 0 && !this.enabledComponents.has(component)) {
      return;
    }

    const entry: LogEntry = {
      level,
      message,
      context,
      timestamp: new Date(),
      component,
      requestId: this.requestId
    };

    // Store log entry for debugging
    this.storeLogEntry(entry);

    // Output to console
    this.outputToConsole(entry);
  }

  /**
   * Check if we should log for the given level
   */
  private static shouldLog(level: LogLevel): boolean {
    const levels: LogLevel[] = ['debug', 'info', 'warn', 'error'];
    const currentIndex = levels.indexOf(this.currentLevel);
    const requestedIndex = levels.indexOf(level);
    return requestedIndex >= currentIndex;
  }

  /**
   * Store log entry in memory for debugging
   */
  private static storeLogEntry(entry: LogEntry): void {
    this.logEntries.push(entry);
    
    // Keep only the most recent entries
    if (this.logEntries.length > this.maxEntries) {
      this.logEntries = this.logEntries.slice(-this.maxEntries);
    }
  }

  /**
   * Output log entry to console with appropriate formatting
   */
  private static outputToConsole(entry: LogEntry): void {
    const timestamp = entry.timestamp.toISOString();
    const component = entry.component ? `[${entry.component}]` : '';
    const requestId = entry.requestId ? `[${entry.requestId}]` : '';
    const prefix = `${timestamp} ${component}${requestId}`.trim();

    const message = prefix ? `${prefix} ${entry.message}` : entry.message;

    switch (entry.level) {
      case 'debug':
        console.debug(message, entry.context || '');
        break;
      case 'info':
        console.info(message, entry.context || '');
        break;
      case 'warn':
        console.warn(message, entry.context || '');
        break;
      case 'error':
        console.error(message, entry.context || '');
        break;
    }
  }

  /**
   * Get recent log entries for debugging
   */
  static getRecentLogs(count: number = 50): LogEntry[] {
    return this.logEntries.slice(-count);
  }

  /**
   * Get logs filtered by level
   */
  static getLogsByLevel(level: LogLevel, count: number = 50): LogEntry[] {
    return this.logEntries
      .filter(entry => entry.level === level)
      .slice(-count);
  }

  /**
   * Get logs filtered by component
   */
  static getLogsByComponent(component: string, count: number = 50): LogEntry[] {
    return this.logEntries
      .filter(entry => entry.component === component)
      .slice(-count);
  }

  /**
   * Clear all stored log entries
   */
  static clearLogs(): void {
    this.logEntries = [];
  }

  /**
   * Export logs as JSON for debugging
   */
  static exportLogs(): string {
    return JSON.stringify(this.logEntries, null, 2);
  }

  /**
   * Create a component-specific logger
   */
  static createComponentLogger(component: string): ComponentLogger {
    return new ComponentLogger(component);
  }
}

/**
 * Component-specific logger that automatically includes component context
 */
export class ComponentLogger {
  constructor(private component: string) {}

  debug(message: string, context?: LogContext): void {
    Logger.debug(message, context, this.component);
  }

  info(message: string, context?: LogContext): void {
    Logger.info(message, context, this.component);
  }

  warn(message: string, context?: LogContext): void {
    Logger.warn(message, context, this.component);
  }

  error(message: string, error?: Error, context?: LogContext): void {
    Logger.error(message, error, context, this.component);
  }

  /**
   * Log API request/response for debugging
   */
  logRequest(method: string, url: string, options?: {
    body?: any;
    headers?: Record<string, string>;
    params?: Record<string, string>;
  }): void {
    this.debug(`${method} ${url}`, {
      type: 'api_request',
      method,
      url,
      ...options
    });
  }

  /**
   * Log API response for debugging
   */
  logResponse(method: string, url: string, status: number, options?: {
    data?: any;
    duration?: number;
  }): void {
    const level = status >= 400 ? 'error' : status >= 300 ? 'warn' : 'debug';
    
    const logMethod = level === 'error' ? this.error.bind(this) : 
                      level === 'warn' ? this.warn.bind(this) : this.debug.bind(this);

    logMethod(`${method} ${url} - ${status}`, undefined, {
      type: 'api_response',
      method,
      url,
      status,
      ...options
    });
  }

  /**
   * Log performance metrics
   */
  logPerformance(operation: string, duration: number, context?: LogContext): void {
    const level = duration > 5000 ? 'warn' : 'debug';
    const message = `${operation} completed in ${duration}ms`;
    
    if (level === 'warn') {
      this.warn(message, { ...context, duration, type: 'performance' });
    } else {
      this.debug(message, { ...context, duration, type: 'performance' });
    }
  }
}

/**
 * Performance timing utilities
 */
export class PerformanceTimer {
  private startTime: number;
  private logger: ComponentLogger;
  private operation: string;

  constructor(operation: string, logger: ComponentLogger) {
    this.operation = operation;
    this.logger = logger;
    this.startTime = Date.now();
  }

  /**
   * End timing and log performance
   */
  end(context?: LogContext): number {
    const duration = Date.now() - this.startTime;
    this.logger.logPerformance(this.operation, duration, context);
    return duration;
  }

  /**
   * Create a performance timer
   */
  static start(operation: string, component: string = 'Performance'): PerformanceTimer {
    const logger = Logger.createComponentLogger(component);
    return new PerformanceTimer(operation, logger);
  }
}

// Create default component loggers for SDK services
export const GoogleAdsLogger = Logger.createComponentLogger('GoogleAds');
export const GoogleAnalyticsLogger = Logger.createComponentLogger('GoogleAnalytics');
export const GoogleSheetsLogger = Logger.createComponentLogger('GoogleSheets');
export const ConnectionLogger = Logger.createComponentLogger('Connection');
export const DatabaseLogger = Logger.createComponentLogger('Database');
export const SDKLogger = Logger.createComponentLogger('SDK');