/**
 * Standardized Error System for MetricsHub SDK
 * 
 * Provides structured error handling with context, retry logic, and debugging information
 */

export interface ErrorContext {
  [key: string]: any;
}

/**
 * Base MetricsHub error class with enhanced debugging information
 */
export class MetricsHubError extends Error {
  public readonly code: string;
  public readonly statusCode: number;
  public readonly retryable: boolean;
  public readonly context: ErrorContext;
  public readonly timestamp: Date;
  public readonly originalError?: Error;

  constructor(
    message: string,
    code: string = 'UNKNOWN_ERROR',
    statusCode: number = 500,
    options: {
      retryable?: boolean;
      context?: ErrorContext;
      originalError?: Error;
    } = {}
  ) {
    super(message);
    this.name = 'MetricsHubError';
    this.code = code;
    this.statusCode = statusCode;
    this.retryable = options.retryable ?? false;
    this.context = options.context || {};
    this.timestamp = new Date();
    this.originalError = options.originalError;

    // Maintain proper stack trace (Node.js specific)
    if (typeof (Error as any).captureStackTrace === 'function') {
      (Error as any).captureStackTrace(this, MetricsHubError);
    }
  }

  /**
   * Convert error to JSON for logging/debugging
   */
  toJSON(): object {
    return {
      name: this.name,
      message: this.message,
      code: this.code,
      statusCode: this.statusCode,
      retryable: this.retryable,
      context: this.context,
      timestamp: this.timestamp.toISOString(),
      stack: this.stack,
      originalError: this.originalError ? {
        name: this.originalError.name,
        message: this.originalError.message,
        stack: this.originalError.stack
      } : undefined
    };
  }

  /**
   * Check if this error should trigger a retry
   */
  shouldRetry(): boolean {
    return this.retryable && (this.statusCode >= 500 || this.statusCode === 429);
  }
}

/**
 * Google Ads API specific errors
 */
export class GoogleAdsAPIError extends MetricsHubError {
  public readonly googleErrorCode: string;
  public readonly quotaExceeded: boolean;
  public readonly fieldPath?: string;

  constructor(
    message: string,
    googleErrorCode: string,
    options: {
      statusCode?: number;
      quotaExceeded?: boolean;
      fieldPath?: string;
      context?: ErrorContext;
      originalError?: Error;
    } = {}
  ) {
    super(
      message, 
      `GOOGLE_ADS_${googleErrorCode}`, 
      options.statusCode || 400,
      {
        retryable: options.quotaExceeded || false,
        context: {
          ...options.context,
          googleErrorCode,
          quotaExceeded: options.quotaExceeded || false,
          fieldPath: options.fieldPath
        },
        originalError: options.originalError
      }
    );
    
    this.name = 'GoogleAdsAPIError';
    this.googleErrorCode = googleErrorCode;
    this.quotaExceeded = options.quotaExceeded || false;
    this.fieldPath = options.fieldPath;
  }

  static fromGoogleAdsResponse(response: any, customerId?: string): GoogleAdsAPIError {
    const error = response.errors?.[0];
    const errorCode = error?.errorCode || 'UNKNOWN_GOOGLE_ADS_ERROR';
    const message = error?.message || 'Unknown Google Ads API error';
    const fieldPath = error?.location?.fieldPathElements?.map((e: any) => e.fieldName).join('.');

    return new GoogleAdsAPIError(message, errorCode, {
      statusCode: response.status || 400,
      quotaExceeded: errorCode.includes('QUOTA') || errorCode.includes('RATE_LIMIT'),
      fieldPath,
      context: {
        customerId,
        fullResponse: response
      }
    });
  }
}

/**
 * Connection and authentication errors
 */
export class ConnectionError extends MetricsHubError {
  public readonly provider: string;
  public readonly companyId: string;
  public readonly expired: boolean;

  constructor(
    message: string,
    provider: string,
    companyId: string,
    options: {
      expired?: boolean;
      statusCode?: number;
      context?: ErrorContext;
      originalError?: Error;
    } = {}
  ) {
    super(
      message,
      `CONNECTION_${provider.toUpperCase()}_ERROR`,
      options.statusCode || 401,
      {
        retryable: !options.expired,
        context: {
          ...options.context,
          provider,
          companyId,
          expired: options.expired || false
        },
        originalError: options.originalError
      }
    );

    this.name = 'ConnectionError';
    this.provider = provider;
    this.companyId = companyId;
    this.expired = options.expired || false;
  }
}

/**
 * Database operation errors
 */
export class DatabaseError extends MetricsHubError {
  public readonly operation: string;
  public readonly tableName?: string;

  constructor(
    message: string,
    operation: string,
    options: {
      tableName?: string;
      statusCode?: number;
      retryable?: boolean;
      context?: ErrorContext;
      originalError?: Error;
    } = {}
  ) {
    super(
      message,
      `DATABASE_${operation.toUpperCase()}_ERROR`,
      options.statusCode || 500,
      {
        retryable: options.retryable ?? true,
        context: {
          ...options.context,
          operation,
          tableName: options.tableName
        },
        originalError: options.originalError
      }
    );

    this.name = 'DatabaseError';
    this.operation = operation;
    this.tableName = options.tableName;
  }
}

/**
 * Schema validation errors
 */
export class ValidationError extends MetricsHubError {
  public readonly validationErrors: any[];
  public readonly fieldPath?: string;

  constructor(
    message: string,
    validationErrors: any[] = [],
    options: {
      fieldPath?: string;
      context?: ErrorContext;
    } = {}
  ) {
    super(
      message,
      'VALIDATION_ERROR',
      400,
      {
        retryable: false,
        context: {
          ...options.context,
          validationErrors,
          fieldPath: options.fieldPath
        }
      }
    );

    this.name = 'ValidationError';
    this.validationErrors = validationErrors;
    this.fieldPath = options.fieldPath;
  }

  static fromZodError(zodError: any): ValidationError {
    const issues = zodError.issues || [];
    const message = `Validation failed: ${issues.map((i: any) => `${i.path.join('.')}: ${i.message}`).join(', ')}`;
    
    return new ValidationError(message, issues, {
      context: { zodError }
    });
  }
}

/**
 * Rate limiting errors
 */
export class RateLimitError extends MetricsHubError {
  public readonly retryAfter?: number;
  public readonly limit: number;
  public readonly remaining: number;

  constructor(
    message: string,
    limit: number,
    remaining: number,
    options: {
      retryAfter?: number;
      context?: ErrorContext;
    } = {}
  ) {
    super(
      message,
      'RATE_LIMIT_ERROR',
      429,
      {
        retryable: true,
        context: {
          ...options.context,
          limit,
          remaining,
          retryAfter: options.retryAfter
        }
      }
    );

    this.name = 'RateLimitError';
    this.retryAfter = options.retryAfter;
    this.limit = limit;
    this.remaining = remaining;
  }
}

/**
 * Utility functions for error handling
 */
export class ErrorUtils {
  /**
   * Check if an error is retryable
   */
  static isRetryable(error: any): boolean {
    if (error instanceof MetricsHubError) {
      return error.shouldRetry();
    }
    
    // Network errors are generally retryable
    if (error.code === 'NETWORK_ERROR' || error.code === 'ECONNRESET') {
      return true;
    }
    
    // HTTP 5xx and 429 errors are retryable
    const status = error.status || error.statusCode;
    return status >= 500 || status === 429;
  }

  /**
   * Extract error details for logging
   */
  static getErrorDetails(error: any): ErrorContext {
    if (error instanceof MetricsHubError) {
      return error.toJSON();
    }

    return {
      name: error.name || 'Unknown',
      message: error.message || 'Unknown error',
      stack: error.stack,
      code: error.code,
      status: error.status || error.statusCode
    };
  }

  /**
   * Create a user-friendly error message
   */
  static getUserFriendlyMessage(error: any): string {
    if (error instanceof ConnectionError && error.expired) {
      return `Your ${error.provider} connection has expired. Please reconnect to continue.`;
    }

    if (error instanceof GoogleAdsAPIError && error.quotaExceeded) {
      return 'Google Ads API quota exceeded. Please try again later.';
    }

    if (error instanceof RateLimitError) {
      return `Rate limit exceeded. Please try again in ${error.retryAfter || 60} seconds.`;
    }

    if (error instanceof ValidationError) {
      return `Invalid data: ${error.message}`;
    }

    // Default to the error message, but sanitize it
    const message = error.message || 'An unexpected error occurred';
    return message.includes('401') || message.includes('unauthorized') 
      ? 'Authentication failed. Please check your credentials.'
      : message;
  }
}