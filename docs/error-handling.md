# Error Handling & Logging Guide

## Overview

The MetricsHub SDK provides a comprehensive error handling and logging system designed to help developers build robust applications with clear debugging information and graceful error recovery.

## Error System Architecture

### Base Error Class

All MetricsHub SDK errors inherit from the `MetricsHubError` base class:

```typescript
import { MetricsHubError } from '@metrics-hub/sdk';

// All errors include:
// - Structured error codes
// - HTTP status codes
// - Retry logic information
// - Rich context data
// - Timestamp tracking
```

### Specialized Error Types

#### 1. GoogleAdsAPIError

Handles Google Ads API specific errors:

```typescript
import { GoogleAdsAPIError } from '@metrics-hub/sdk';

try {
  const campaigns = await sdk.ads.getCampaigns('123456789');
} catch (error) {
  if (error instanceof GoogleAdsAPIError) {
    console.log('Google Error Code:', error.googleErrorCode);
    console.log('Quota Exceeded:', error.quotaExceeded);
    console.log('Field Path:', error.fieldPath);
    
    // Handle quota exceeded
    if (error.quotaExceeded) {
      console.log('API quota exceeded, waiting before retry...');
      await new Promise(resolve => setTimeout(resolve, 60000));
      // Retry logic here
    }
  }
}
```

#### 2. ConnectionError

Manages OAuth and authentication errors:

```typescript
import { ConnectionError } from '@metrics-hub/sdk';

try {
  const accounts = await sdk.ads.listAllAccounts();
} catch (error) {
  if (error instanceof ConnectionError) {
    console.log('Provider:', error.provider);
    console.log('Company ID:', error.companyId);
    console.log('Token Expired:', error.expired);
    
    if (error.expired) {
      // Redirect to re-authentication
      window.location.href = `/auth/${error.provider}`;
    }
  }
}
```

#### 3. ValidationError

Handles schema validation and input errors:

```typescript
import { ValidationError } from '@metrics-hub/sdk';

try {
  await sdk.someApiCall(invalidData);
} catch (error) {
  if (error instanceof ValidationError) {
    console.log('Validation Errors:', error.validationErrors);
    console.log('Field Path:', error.fieldPath);
    
    // Show user-friendly validation messages
    error.validationErrors.forEach(validationError => {
      console.log(`${validationError.path}: ${validationError.message}`);
    });
  }
}
```

#### 4. RateLimitError

Manages API rate limiting:

```typescript
import { RateLimitError } from '@metrics-hub/sdk';

async function withRateLimit<T>(operation: () => Promise<T>): Promise<T> {
  try {
    return await operation();
  } catch (error) {
    if (error instanceof RateLimitError) {
      console.log(`Rate limited. Retry after ${error.retryAfter} seconds`);
      console.log(`Limit: ${error.limit}, Remaining: ${error.remaining}`);
      
      // Wait and retry
      await new Promise(resolve => 
        setTimeout(resolve, (error.retryAfter || 60) * 1000)
      );
      
      return withRateLimit(operation);
    }
    throw error;
  }
}
```

#### 5. DatabaseError

Handles database operation errors:

```typescript
import { DatabaseError } from '@metrics-hub/sdk';

try {
  await sdk.tables.insert('campaigns', data);
} catch (error) {
  if (error instanceof DatabaseError) {
    console.log('Operation:', error.operation);
    console.log('Table:', error.tableName);
    console.log('Retryable:', error.retryable);
    
    if (error.retryable) {
      // Implement retry logic
      console.log('Database operation failed, retrying...');
    }
  }
}
```

## Error Utilities

### Checking Retry Logic

```typescript
import { ErrorUtils } from '@metrics-hub/sdk';

async function safeApiCall<T>(operation: () => Promise<T>): Promise<T> {
  let retries = 3;
  
  while (retries > 0) {
    try {
      return await operation();
    } catch (error) {
      if (ErrorUtils.isRetryable(error) && retries > 1) {
        retries--;
        console.log(`Retrying in 2 seconds... (${retries} retries left)`);
        await new Promise(resolve => setTimeout(resolve, 2000));
        continue;
      }
      throw error;
    }
  }
}
```

### Getting Error Details

```typescript
import { ErrorUtils } from '@metrics-hub/sdk';

function logError(error: any) {
  const details = ErrorUtils.getErrorDetails(error);
  
  console.log('Error Details:', JSON.stringify(details, null, 2));
  
  // Send to logging service
  loggingService.error('SDK Error', details);
}
```

### User-Friendly Messages

```typescript
import { ErrorUtils } from '@metrics-hub/sdk';

function showUserError(error: any) {
  const userMessage = ErrorUtils.getUserFriendlyMessage(error);
  
  // Show to user
  alert(userMessage);
  
  // Examples of generated messages:
  // "Your Google Ads connection has expired. Please reconnect to continue."
  // "Google Ads API quota exceeded. Please try again later."
  // "Rate limit exceeded. Please try again in 60 seconds."
  // "Invalid data: Campaign name is required"
}
```

## Logging System

### Basic Setup

```typescript
import { Logger } from '@metrics-hub/sdk';

// Set global log level
Logger.setLevel('debug'); // trace, debug, info, warn, error

// Enable specific components
Logger.enableComponent('GoogleAds');
Logger.enableComponent('Connection');
Logger.enableComponent('Database');
Logger.enableComponent('Plugin');
```

### Component-Specific Logging

```typescript
import { GoogleAdsLogger, ConnectionLogger } from '@metrics-hub/sdk';

// Google Ads specific logging
GoogleAdsLogger.info('Starting campaign fetch', {
  customerId: '123456789',
  dateRange: '2024-01-01 to 2024-01-31'
});

GoogleAdsLogger.error('Campaign fetch failed', {
  customerId: '123456789',
  error: error.message,
  retryable: error.retryable
});

// Connection specific logging
ConnectionLogger.debug('Token refresh started', {
  provider: 'google-ads',
  expiresAt: tokenInfo.expiresAt
});

ConnectionLogger.warn('Token expires soon', {
  provider: 'google-ads',
  expiresIn: '5 minutes'
});
```

### Performance Monitoring

```typescript
import { PerformanceTimer } from '@metrics-hub/sdk';

async function monitoredOperation() {
  const timer = PerformanceTimer.start('campaign-analysis');
  
  try {
    // Your operation here
    const campaigns = await sdk.ads.getCampaigns('123456789');
    
    timer.end({ 
      customerId: '123456789',
      campaignsFound: campaigns.campaigns.length 
    });
    
    return campaigns;
  } catch (error) {
    timer.end({ 
      error: error.message,
      failed: true 
    });
    throw error;
  }
}
```

### Custom Loggers

```typescript
import { Logger } from '@metrics-hub/sdk';

// Create application-specific logger
const AppLogger = Logger.createLogger('MyApp');

AppLogger.info('Application started');
AppLogger.debug('Processing user request', { userId: '123', action: 'fetch-campaigns' });
AppLogger.error('Operation failed', { error: error.message, userId: '123' });
```

## Error Handling Patterns

### 1. The Graceful Degradation Pattern

```typescript
async function getCampaignsWithFallback(customerId: string) {
  try {
    // Try main API
    return await sdk.ads.getCampaigns(customerId);
  } catch (error) {
    if (error instanceof GoogleAdsAPIError && error.quotaExceeded) {
      // Fall back to cached data
      return await getCachedCampaigns(customerId);
    }
    
    if (error instanceof ConnectionError && error.expired) {
      // Return empty state, prompt for re-auth
      return { campaigns: [], total: 0, needsAuth: true };
    }
    
    throw error;
  }
}
```

### 2. The Circuit Breaker Pattern

```typescript
class CircuitBreaker {
  private failures = 0;
  private lastFailure?: Date;
  private isOpen = false;
  
  async execute<T>(operation: () => Promise<T>): Promise<T> {
    if (this.isOpen) {
      throw new Error('Circuit breaker is open');
    }
    
    try {
      const result = await operation();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      throw error;
    }
  }
  
  private onSuccess() {
    this.failures = 0;
    this.isOpen = false;
  }
  
  private onFailure() {
    this.failures++;
    this.lastFailure = new Date();
    
    if (this.failures >= 5) {
      this.isOpen = true;
      setTimeout(() => this.isOpen = false, 60000); // Reset after 1 minute
    }
  }
}

const googleAdsBreaker = new CircuitBreaker();

async function safeGoogleAdsCall<T>(operation: () => Promise<T>): Promise<T> {
  return googleAdsBreaker.execute(operation);
}
```

### 3. The Retry with Exponential Backoff Pattern

```typescript
async function retryWithBackoff<T>(
  operation: () => Promise<T>,
  maxRetries: number = 3,
  baseDelay: number = 1000
): Promise<T> {
  let lastError: any;
  
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;
      
      if (!ErrorUtils.isRetryable(error) || attempt === maxRetries) {
        throw error;
      }
      
      const delay = baseDelay * Math.pow(2, attempt);
      const jitter = Math.random() * 1000; // Add randomness
      
      console.log(`Attempt ${attempt + 1} failed, retrying in ${delay + jitter}ms`);
      await new Promise(resolve => setTimeout(resolve, delay + jitter));
    }
  }
  
  throw lastError;
}
```

## Error Monitoring Integration

### Sentry Integration

```typescript
import { ErrorUtils } from '@metrics-hub/sdk';
import * as Sentry from '@sentry/browser';

function setupErrorMonitoring() {
  // Capture MetricsHub SDK errors
  const originalConsoleError = console.error;
  console.error = function(message: any, ...args: any[]) {
    if (message instanceof Error || typeof message === 'string') {
      const errorDetails = ErrorUtils.getErrorDetails(message);
      
      Sentry.captureException(message, {
        tags: {
          sdk: 'metrics-hub',
          component: errorDetails.component || 'unknown'
        },
        extra: errorDetails
      });
    }
    
    originalConsoleError.apply(console, [message, ...args]);
  };
}
```

### Custom Error Tracking

```typescript
import { MetricsHubError } from '@metrics-hub/sdk';

class ErrorTracker {
  private errors: Array<{ error: MetricsHubError; timestamp: Date }> = [];
  
  track(error: MetricsHubError) {
    this.errors.push({ error, timestamp: new Date() });
    
    // Keep only last 100 errors
    if (this.errors.length > 100) {
      this.errors = this.errors.slice(-100);
    }
    
    // Send to analytics
    this.sendToAnalytics(error);
  }
  
  private sendToAnalytics(error: MetricsHubError) {
    analytics.track('SDK Error', {
      errorCode: error.code,
      errorType: error.name,
      retryable: error.retryable,
      statusCode: error.statusCode,
      provider: error.context?.provider,
      component: error.context?.component
    });
  }
  
  getErrorStats() {
    const last24Hours = Date.now() - 24 * 60 * 60 * 1000;
    const recentErrors = this.errors.filter(
      e => e.timestamp.getTime() > last24Hours
    );
    
    const errorsByType = recentErrors.reduce((acc, { error }) => {
      acc[error.name] = (acc[error.name] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    return {
      total: recentErrors.length,
      byType: errorsByType,
      retryableCount: recentErrors.filter(e => e.error.retryable).length
    };
  }
}

const errorTracker = new ErrorTracker();

// Use in your error handling
try {
  await sdk.ads.getCampaigns('123456789');
} catch (error) {
  if (error instanceof MetricsHubError) {
    errorTracker.track(error);
  }
  throw error;
}
```

## Best Practices

### 1. Always Handle Expected Errors

```typescript
// Bad
const campaigns = await sdk.ads.getCampaigns(customerId);

// Good
try {
  const campaigns = await sdk.ads.getCampaigns(customerId);
  return campaigns;
} catch (error) {
  if (error instanceof ConnectionError && error.expired) {
    // Handle expired connection
    return { campaigns: [], needsReauth: true };
  }
  
  if (error instanceof GoogleAdsAPIError && error.quotaExceeded) {
    // Handle quota exceeded
    return { campaigns: [], quotaExceeded: true };
  }
  
  throw error; // Re-throw unexpected errors
}
```

### 2. Use Structured Logging

```typescript
// Bad
console.log('Error occurred:', error.message);

// Good
GoogleAdsLogger.error('Campaign fetch failed', {
  customerId,
  errorCode: error.code,
  errorType: error.name,
  retryable: error.retryable,
  userAction: 'manual_refresh',
  timestamp: new Date().toISOString()
});
```

### 3. Implement Progressive Error Recovery

```typescript
async function robustGetCampaigns(customerId: string) {
  // Try 1: Current data
  try {
    return await sdk.ads.getCampaigns(customerId);
  } catch (error) {
    if (error instanceof RateLimitError) {
      // Try 2: Wait and retry once
      await new Promise(resolve => setTimeout(resolve, 60000));
      try {
        return await sdk.ads.getCampaigns(customerId);
      } catch (retryError) {
        // Fall through to cached data
      }
    }
  }
  
  // Try 3: Cached data
  try {
    const cached = await getCachedCampaigns(customerId);
    if (cached) {
      return { ...cached, fromCache: true };
    }
  } catch (cacheError) {
    // Cache failed, fall through
  }
  
  // Try 4: Minimal data structure
  return {
    campaigns: [],
    total: 0,
    error: 'Unable to fetch campaigns. Please try again later.'
  };
}
```

### 4. Log Context Information

```typescript
async function contextualOperation(customerId: string, operation: string) {
  const context = {
    customerId,
    operation,
    timestamp: new Date().toISOString(),
    userAgent: navigator.userAgent,
    sessionId: getSessionId()
  };
  
  try {
    GoogleAdsLogger.info(`Starting ${operation}`, context);
    
    const result = await performOperation(customerId, operation);
    
    GoogleAdsLogger.info(`Completed ${operation}`, {
      ...context,
      success: true,
      resultCount: result?.length || 0
    });
    
    return result;
  } catch (error) {
    GoogleAdsLogger.error(`Failed ${operation}`, {
      ...context,
      error: ErrorUtils.getErrorDetails(error),
      success: false
    });
    
    throw error;
  }
}
```

## Debugging Tips

### 1. Enable Debug Logging

```typescript
// Enable debug logging for troubleshooting
Logger.setLevel('debug');
Logger.enableComponent('GoogleAds');
Logger.enableComponent('Connection');
Logger.enableComponent('API_REQUESTS');

// Your operations here - all API calls will be logged
const accounts = await sdk.ads.listAllAccounts();
```

### 2. Use Error Context

```typescript
// Errors include rich context for debugging
catch (error) {
  console.log('Error context:', error.context);
  // Outputs: { customerId: '123456789', operation: 'getCampaigns', ... }
}
```

### 3. Performance Debugging

```typescript
// Monitor performance for slow operations
const timer = PerformanceTimer.start('slow-operation');

try {
  const result = await somePotentiallySlowOperation();
  timer.end({ resultSize: result.length });
} catch (error) {
  timer.end({ error: error.message, failed: true });
}
```

This comprehensive error handling and logging system ensures your MetricsHub SDK applications are robust, debuggable, and provide excellent user experiences even when things go wrong.