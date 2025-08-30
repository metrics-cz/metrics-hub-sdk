# MetricsHub SDK API Reference

## Overview

The MetricsHub SDK provides a comprehensive suite of tools for building powerful MetricsHub applications with database integration, Google services, OAuth management, and advanced plugin capabilities.

## Table of Contents

1. [Core SDK Classes](#core-sdk-classes)
2. [Google Services](#google-services)
3. [OAuth & Connection Management](#oauth--connection-management)
4. [Error Handling](#error-handling)
5. [Logging System](#logging-system)
6. [Plugin Development](#plugin-development)
7. [Testing Utilities](#testing-utilities)
8. [Type Definitions](#type-definitions)

---

## Core SDK Classes

### MetricsHubSDK

The main SDK class that provides access to all Google services, database operations, and connection management.

```typescript
import { MetricsHubSDK } from '@metrics-hub/sdk';

const sdk = new MetricsHubSDK({
  companyId: 'your-company-id',
  apiBaseUrl: 'https://your-metricshub-instance.com',
  apiKey: 'optional-api-key',
  debug: true
});
```

#### Properties

- `ads: GoogleAdsClient` - Google Ads API client
- `analytics: GoogleAnalyticsClient` - Google Analytics API client
- `sheets: GoogleSheetsClient` - Google Sheets API client
- `drive: GoogleDriveClient` - Google Drive API client
- `gmail: GmailClient` - Gmail API client
- `docs: GoogleDocsClient` - Google Docs API client
- `searchConsole: GoogleSearchConsoleClient` - Search Console API client
- `connection: ConnectionManager` - OAuth and connection management
- `tables?: any` - Database tables (when schema is provided)

#### Methods

- `updateConfig(config)` - Update SDK configuration
- `getConfig()` - Get current configuration
- `hasDatabaseSupport()` - Check if database functionality is available
- `getSchema()` - Get schema information

---

## Google Services

### GoogleAdsClient

Enhanced Google Ads client with comprehensive account management.

#### Account Management

```typescript
// Get all accessible customer accounts
const customers = await sdk.ads.getAccessibleCustomers();
// Returns: { success: boolean, customers: string[], total: number }

// Get detailed account information
const accountDetails = await sdk.ads.getAccountDetails('123456789');
// Returns: { success: boolean, account: GoogleAdsAccount }

// List all accounts with hierarchy information
const accounts = await sdk.ads.listAllAccounts();
// Returns: { success: boolean, accounts: GoogleAdsAccount[], total: number, hierarchies?: AccountHierarchy[] }

// Get account hierarchy structure
const hierarchy = await sdk.ads.getAccountHierarchy('manager-id');
// Returns: { success: boolean, hierarchy: AccountHierarchy }

// Get MCC (Manager) accounts only
const mccAccounts = await sdk.ads.getMCCAccounts();

// Get child accounts under an MCC
const childAccounts = await sdk.ads.getChildAccounts('mcc-id');
```

#### Campaign Management

```typescript
// Get campaigns for a customer
const campaigns = await sdk.ads.getCampaigns('123456789');

// Get keywords with optional filtering
const keywords = await sdk.ads.getKeywords('123456789', {
  campaignId: 'campaign-id',
  adGroupId: 'adgroup-id'
});
```

### GoogleAnalyticsClient

Enhanced Analytics client with comprehensive property and view management.

#### Account & Property Management

```typescript
// Get all Analytics accounts
const accounts = await sdk.analytics.getAccounts();

// Get properties for an account
const properties = await sdk.analytics.getProperties('account-id');

// Get views for a property
const views = await sdk.analytics.getViews('property-id');

// Get custom dimensions
const customDimensions = await sdk.analytics.getCustomDimensions('property-id');

// Get goals for a profile
const goals = await sdk.analytics.getGoals('profile-id');

// Get audiences
const audiences = await sdk.analytics.getAudiences('property-id');
```

#### Reporting

```typescript
// Get standard reports
const reports = await sdk.analytics.getReports({
  viewId: 'view-id',
  startDate: '2024-01-01',
  endDate: '2024-01-31'
});

// Get real-time data
const realtimeData = await sdk.analytics.getRealTimeData('view-id', {
  metrics: ['rt:activeUsers'],
  dimensions: ['rt:country']
});

// Custom reports with advanced filtering
const customReports = await sdk.analytics.getCustomReports('view-id', {
  startDate: '2024-01-01',
  endDate: '2024-01-31',
  metrics: ['ga:sessions', 'ga:users'],
  dimensions: ['ga:country', 'ga:deviceCategory'],
  filters: 'ga:country==United States',
  orderBy: [{ fieldName: 'ga:sessions', sortOrder: 'DESCENDING' }],
  pageSize: 100
});
```

### GoogleSheetsClient

Advanced spreadsheet operations with formatting and sharing capabilities.

#### Spreadsheet Management

```typescript
// Create a new spreadsheet
const newSpreadsheet = await sdk.sheets.createSpreadsheet('My Spreadsheet', [
  { title: 'Data', gridProperties: { rowCount: 1000, columnCount: 26 } },
  { title: 'Analysis' }
]);

// Share spreadsheet with users
await sdk.sheets.shareSpreadsheet('spreadsheet-id', ['user@example.com'], 'editor');

// Get spreadsheet metadata
const metadata = await sdk.sheets.getSpreadsheetMetadata('spreadsheet-id');
```

#### Sheet Operations

```typescript
// Add a new sheet
const newSheet = await sdk.sheets.addSheet('spreadsheet-id', {
  title: 'New Sheet',
  gridProperties: { rowCount: 500, columnCount: 10 }
});

// Duplicate an existing sheet
const duplicatedSheet = await sdk.sheets.duplicateSheet('spreadsheet-id', 123, 'Copy of Sheet');

// Delete a sheet
await sdk.sheets.deleteSheet('spreadsheet-id', 123);

// Update sheet properties
await sdk.sheets.updateSheetProperties('spreadsheet-id', 123, {
  title: 'Updated Title'
});
```

#### Data Operations

```typescript
// Read data
const data = await sdk.sheets.read({
  spreadsheetId: 'spreadsheet-id',
  range: 'Sheet1!A1:Z100',
  valueRenderOption: 'FORMATTED_VALUE'
});

// Write data
await sdk.sheets.write({
  spreadsheetId: 'spreadsheet-id',
  range: 'Sheet1!A1:C10',
  values: [['Header 1', 'Header 2', 'Header 3'], ['Value 1', 'Value 2', 'Value 3']],
  operation: 'update'
});
```

#### Advanced Features

```typescript
// Protect a range
await sdk.sheets.protectRange('spreadsheet-id', 'Sheet1!A1:A10', 'Protected headers', {
  warningOnly: false,
  editors: ['admin@example.com']
});

// Add a chart
await sdk.sheets.addChart('spreadsheet-id', 123, {
  title: 'Sales Chart',
  chartType: 'COLUMN',
  sourceRange: {
    sheetId: 123,
    startRowIndex: 0,
    endRowIndex: 10,
    startColumnIndex: 0,
    endColumnIndex: 2
  }
});

// Format cells
await sdk.sheets.formatCells('spreadsheet-id', 'Sheet1!A1:C1', {
  backgroundColor: { red: 0.2, green: 0.6, blue: 0.9 },
  textFormat: { bold: true, fontSize: 12 },
  horizontalAlignment: 'CENTER'
});

// Batch update operations
await sdk.sheets.batchUpdate('spreadsheet-id', [
  {
    updateCells: {
      range: { sheetId: 123 },
      fields: 'userEnteredFormat.backgroundColor'
    }
  }
]);
```

---

## OAuth & Connection Management

### ConnectionManager

Comprehensive OAuth token and connection management.

#### Token Management

```typescript
// Get a valid access token
const token = await sdk.connection.getAccessToken('google-ads');

// Force refresh a token
const token = await sdk.connection.getAccessToken('google-ads', true);

// Refresh token manually
const refreshResult = await sdk.connection.refreshToken('google-ads');
```

#### Connection Status

```typescript
// Validate a connection
const isValid = await sdk.connection.validateConnection('google-ads');

// Get detailed connection information
const connectionInfo = await sdk.connection.getConnectionInfo('google-ads');
/* Returns:
{
  provider: 'google-ads',
  companyId: 'company-123',
  isConnected: true,
  lastRefresh: Date,
  expiresAt: Date,
  scopes: ['https://www.googleapis.com/auth/adwords'],
  email: 'user@example.com'
}
*/

// Check if a provider is connected
const isConnected = await sdk.connection.isConnected('google-analytics');

// Get all connected providers
const providers = await sdk.connection.getConnectedProviders();
```

#### Authorization Flow

```typescript
// Get authorization URL for new connection
const authUrl = await sdk.connection.getAuthorizationUrl(
  'google-ads',
  'https://your-app.com/callback',
  ['https://www.googleapis.com/auth/adwords']
);

// Revoke a connection
const revoked = await sdk.connection.revokeConnection('google-ads');
```

---

## Error Handling

### Error Classes

The SDK provides structured error handling with specific error types:

#### MetricsHubError (Base Class)

```typescript
import { MetricsHubError, ErrorUtils } from '@metrics-hub/sdk';

try {
  await sdk.ads.getCampaigns('invalid-id');
} catch (error) {
  if (error instanceof MetricsHubError) {
    console.log('Error Code:', error.code);
    console.log('Status:', error.statusCode);
    console.log('Retryable:', error.shouldRetry());
    console.log('Context:', error.context);
    console.log('Timestamp:', error.timestamp);
  }
}
```

#### Specialized Error Types

```typescript
// Google Ads API errors
import { GoogleAdsAPIError } from '@metrics-hub/sdk';

try {
  await sdk.ads.getCampaigns('123');
} catch (error) {
  if (error instanceof GoogleAdsAPIError) {
    if (error.quotaExceeded) {
      console.log('Quota exceeded, retry later');
    }
    console.log('Google Error Code:', error.googleErrorCode);
    console.log('Field Path:', error.fieldPath);
  }
}

// Connection errors
import { ConnectionError } from '@metrics-hub/sdk';

try {
  const token = await sdk.connection.getAccessToken('google-ads');
} catch (error) {
  if (error instanceof ConnectionError) {
    if (error.expired) {
      console.log('Token expired, please reconnect');
    }
    console.log('Provider:', error.provider);
  }
}

// Rate limit errors
import { RateLimitError } from '@metrics-hub/sdk';

try {
  await sdk.ads.getCampaigns('123');
} catch (error) {
  if (error instanceof RateLimitError) {
    console.log(`Rate limited. Retry after ${error.retryAfter} seconds`);
    console.log(`Limit: ${error.limit}, Remaining: ${error.remaining}`);
  }
}
```

#### Error Utilities

```typescript
import { ErrorUtils } from '@metrics-hub/sdk';

// Check if error is retryable
const shouldRetry = ErrorUtils.isRetryable(error);

// Get structured error details
const details = ErrorUtils.getErrorDetails(error);

// Get user-friendly message
const message = ErrorUtils.getUserFriendlyMessage(error);
```

---

## Logging System

### Logger Configuration

```typescript
import { Logger } from '@metrics-hub/sdk';

// Set log level
Logger.setLevel('debug'); // 'debug' | 'info' | 'warn' | 'error'

// Enable logging for specific components
Logger.enableComponent('GoogleAds');
Logger.enableComponent('API_REQUESTS');

// Set request ID for correlation
Logger.setRequestId('req-123');
```

### Component Loggers

```typescript
import { 
  GoogleAdsLogger, 
  GoogleAnalyticsLogger, 
  ConnectionLogger,
  DatabaseLogger 
} from '@metrics-hub/sdk';

// Use pre-configured component loggers
GoogleAdsLogger.info('Fetching campaigns', { customerId: '123' });
ConnectionLogger.warn('Token expires soon', { provider: 'google-ads', expiresIn: 300 });

// Create custom component logger
const customLogger = Logger.createComponentLogger('MyComponent');
customLogger.debug('Custom operation started');
```

### Performance Monitoring

```typescript
import { PerformanceTimer } from '@metrics-hub/sdk';

// Measure operation performance
const timer = PerformanceTimer.start('fetchCampaigns', 'GoogleAds');
try {
  const campaigns = await sdk.ads.getCampaigns('123');
  timer.end({ campaignCount: campaigns.total });
} catch (error) {
  timer.end({ error: true });
}
```

### Log Retrieval

```typescript
// Get recent logs
const recentLogs = Logger.getRecentLogs(50);

// Get logs by level
const errorLogs = Logger.getLogsByLevel('error', 20);

// Get logs by component
const adsLogs = Logger.getLogsByComponent('GoogleAds', 30);

// Export all logs
const allLogs = Logger.exportLogs();

// Clear logs
Logger.clearLogs();
```

---

## Plugin Development

### PluginSDK

Extended SDK for building advanced plugins with lifecycle management and inter-plugin communication.

#### Basic Setup

```typescript
import { PluginSDK } from '@metrics-hub/sdk';

const manifest = {
  id: 'my-plugin',
  name: 'My Awesome Plugin',
  version: '1.0.0',
  description: 'A plugin that does awesome things',
  author: 'Your Name',
  permissions: ['google-ads', 'google-analytics']
};

const pluginSDK = new PluginSDK(config, manifest);
```

#### Plugin Lifecycle

```typescript
// Register plugin
await pluginSDK.registerPlugin();

// Check registration status
const isRegistered = pluginSDK.isPluginRegistered();

// Get plugin information
const info = pluginSDK.getPluginInfo();

// Unregister plugin
await pluginSDK.unregisterPlugin();
```

#### State Management

```typescript
// Set state (persisted to localStorage in browser)
pluginSDK.setState('lastSync', new Date());
pluginSDK.setState('userPreferences', { theme: 'dark', language: 'en' });

// Get state
const lastSync = pluginSDK.getState('lastSync');
const preferences = pluginSDK.getState('userPreferences');

// Get all state
const allState = pluginSDK.getAllState();

// Clear state
pluginSDK.clearState();
```

#### Inter-Plugin Communication

```typescript
// Register message handler
pluginSDK.onMessage('data-update', async (data, sender) => {
  console.log(`Received data update from ${sender}:`, data);
  // Process the update
});

// Send message to specific plugin
await pluginSDK.sendMessage('analytics-plugin', 'refresh-data', {
  dateRange: { start: '2024-01-01', end: '2024-01-31' }
});

// Broadcast message to all plugins
await pluginSDK.broadcastMessage('global-refresh', { timestamp: Date.now() });
```

#### UI Helpers (for iframe plugins)

```typescript
// Resize plugin iframe
pluginSDK.resize(800, 600);

// Show notification
pluginSDK.showNotification('success', 'Data synced successfully', {
  duration: 3000,
  actionText: 'View Details',
  onAction: () => console.log('View details clicked')
});

// Request fullscreen
pluginSDK.requestFullscreen();

// Exit fullscreen
pluginSDK.exitFullscreen();

// Open URL
pluginSDK.openUrl('https://help.example.com', '_blank');
```

---

## Testing Utilities

### TestingSDK

Comprehensive testing utilities with mock data generation and environment setup.

#### Basic Setup

```typescript
import { TestingSDK, TestUtils } from '@metrics-hub/sdk';

// Create test SDK instance
const testSDK = TestUtils.createTestSDK({
  companyId: 'test-company',
  debug: true
});

// Or create with custom test config
const testSDK = new TestingSDK(config, {
  mockMode: true,
  logLevel: 'debug',
  apiDelay: 100,
  errorRate: 0.1
});
```

#### Mock Data Generation

```typescript
// Generate realistic Google Ads accounts
const accounts = testSDK.generateMockAccounts({
  count: 10,
  realistic: true
});

// Generate campaigns for testing
const campaigns = testSDK.generateMockCampaigns('123456789', {
  count: 20,
  realistic: true
});

// Generate account hierarchy
const hierarchy = testSDK.generateMockAccountHierarchy({
  count: 5
});

// Generate Analytics accounts
const analyticsAccounts = testSDK.generateMockAnalyticsAccounts({
  count: 3,
  realistic: true
});
```

#### Test Environment

```typescript
// Enable test mode
testSDK.enableTestMode();

// Mock connections
testSDK.mockConnection('google-ads', {
  isConnected: true,
  accessToken: 'mock-token'
});

// Simulate errors
testSDK.simulateError('rate_limit', 0.1); // 10% chance of rate limit error

// Clear all mocks
testSDK.clearMocks();
```

#### Development Helpers

```typescript
// Enable API request logging
testSDK.logAPIRequests(true);

// Validate data against schema
const validation = testSDK.validateSchema(data, mySchema);
if (!validation.valid) {
  console.log('Validation errors:', validation.errors);
}

// Get request logs
const logs = testSDK.getRequestLogs();

// Measure performance
const result = await testSDK.measurePerformance(
  async () => await someExpensiveOperation(),
  'expensiveOperation'
);
```

#### Test Utilities

```typescript
// Wait for async operations
await TestUtils.wait(1000);

// Generate random test data
const randomId = TestUtils.randomString(8);
const randomEmail = TestUtils.randomEmail();

// Generate data matching schema
const testData = TestUtils.generateTestData(userSchema);
```

---

## Type Definitions

### Core Types

```typescript
interface PluginConfig {
  companyId: string;
  apiBaseUrl?: string;
  apiKey?: string;
  debug?: boolean;
}

interface GoogleAdsAccount {
  id: string;
  resourceName: string;
  descriptiveName: string;
  manager: boolean;
  testAccount: boolean;
  timeZone: string;
  currencyCode: string;
  status: 'ENABLED' | 'SUSPENDED' | 'CLOSED';
  conversionTrackingId?: string;
}

interface AccountHierarchy {
  managerAccount: GoogleAdsAccount;
  childAccounts: GoogleAdsAccount[];
  depth: number;
}

interface ConnectionInfo {
  provider: string;
  companyId: string;
  isConnected: boolean;
  lastRefresh?: Date;
  expiresAt?: Date;
  scopes: string[];
  email?: string;
}
```

### Plugin Types

```typescript
interface PluginManifest {
  id: string;
  name: string;
  version: string;
  description?: string;
  author?: string;
  homepage?: string;
  keywords?: string[];
  permissions?: string[];
  dependencies?: Record<string, string>;
  config?: Record<string, any>;
}

interface PluginMessage {
  id: string;
  type: string;
  data: any;
  sender: string;
  timestamp: Date;
  targetPlugin?: string;
}

interface NotificationOptions {
  duration?: number;
  actionText?: string;
  onAction?: () => void;
  persistent?: boolean;
}
```

### Testing Types

```typescript
interface MockDataOptions {
  count?: number;
  seed?: string;
  realistic?: boolean;
}

interface TestEnvironmentConfig {
  mockMode: boolean;
  logLevel: 'debug' | 'info' | 'warn' | 'error';
  apiDelay?: number;
  errorRate?: number;
  enableValidation?: boolean;
}
```

---

## Best Practices

### Error Handling

1. Always use try-catch blocks with SDK operations
2. Check for specific error types to provide appropriate handling
3. Use `ErrorUtils.isRetryable()` for retry logic
4. Provide user-friendly error messages with `ErrorUtils.getUserFriendlyMessage()`

### Logging

1. Set appropriate log levels for different environments
2. Use component-specific loggers for better organization
3. Include relevant context in log messages
4. Use performance timers for monitoring critical operations

### OAuth Management

1. Always validate connections before making API calls
2. Handle token refresh automatically where possible
3. Provide clear feedback when reauthentication is needed
4. Store connection status for offline handling

### Plugin Development

1. Always register plugins before use
2. Use state management for persistence across sessions
3. Handle inter-plugin messages gracefully
4. Provide proper cleanup in plugin lifecycle

### Testing

1. Use TestingSDK for comprehensive testing scenarios
2. Generate realistic mock data for better test coverage
3. Test error conditions with error simulation
4. Validate data structures with schema validation

This API reference provides comprehensive coverage of all SDK features. For implementation examples and guides, see the additional documentation files.