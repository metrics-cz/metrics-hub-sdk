# MetricsHub SDK

A powerful, unified toolkit for building sophisticated MetricsHub applications. Provides seamless integration with Google services, advanced OAuth management, comprehensive error handling, and a robust plugin development framework.

## 🏗️ Architecture Overview

MetricsHub applications follow a **dual-component architecture**:

1. **🖼️ Iframe App** - Interactive UI running in the browser
2. **⚙️ Server Integration** - Background processing, crons, and data fetching

Both components share the **same database** via the unified SDK, enabling seamless data flow between UI and background processes.

```
┌─────────────────┐    ┌──────────────────┐
│   Iframe App    │    │Server Integration│
│  (Interactive   │    │ (Crons & Data    │
│      UI)        │    │   Processing)    │
└─────────┬───────┘    └─────────┬────────┘
          │                      │
          └──────────┬───────────┘
                     │
          ┌──────────▼──────────┐
          │   Shared Database   │
          │   (Auto-generated)  │
          └─────────────────────┘
```

## ✨ Features

🚀 **Unified Package**: Database + Google services in one SDK  
📊 **Auto-Generated Database**: Instant PostgreSQL with Zod schema validation  
🔧 **Complete Google Suite**: Ads, Analytics, Sheets, Drive, Gmail, Docs, Search Console  
🏗️ **Advanced Google Ads**: Account management, hierarchy handling, campaign optimization  
🔐 **OAuth Management**: Automatic token refresh, connection monitoring, multi-provider auth  
⚠️ **Structured Errors**: Specialized error classes with retry logic and debugging info  
📝 **Component Logging**: Granular logging system with performance monitoring  
🔌 **Plugin Framework**: Build custom extensions with state management and messaging  
🧪 **Testing Utilities**: Mock data generation, API simulation, performance testing  
📱 **Iframe Ready**: PostMessage auth for embedded applications  
🎯 **TypeScript Native**: Full type safety and auto-completion  

## 📦 Installation

```bash
npm install @metrics-hub/sdk zod
```

## 🚀 Quick Start

### 1. Define Your Schema

```typescript
import { MetricsHubSDK, MetricsHubSchema, z } from '@metrics-hub/sdk';

// Define database schema with Zod
const appSchema = MetricsHubSchema.define({
  // User table
  users: z.object({
    name: z.string().min(1).max(100),
    email: z.string().email(),
    role: z.enum(['admin', 'user']),
    lastActive: z.date().optional()
  }),
  
  // Analytics data table
  analytics: z.object({
    eventName: z.string(),
    userId: z.string(),
    properties: z.record(z.any()),
    timestamp: z.date().default(() => new Date())
  }),
  
  // Google Ads campaigns
  campaigns: z.object({
    campaignId: z.string(),
    name: z.string(),
    status: z.enum(['active', 'paused', 'ended']),
    budget: z.number(),
    impressions: z.number().default(0),
    clicks: z.number().default(0)
  })
});
```

### 2. Initialize SDK

```typescript
// Configuration for both iframe and server
const config = {
  appId: 'your-app-id',           // Your app identifier
  companyId: 'company-123',       // Current company/tenant
  companyToken: 'auth-token',     // Authentication token
  mode: 'development',            // 'development' or 'production'
  apiBaseUrl: 'https://your-metricshub-instance.com'
};

const sdk = new MetricsHubSDK(config, appSchema);
```

### 3. Database Operations

```typescript
// Insert data (auto-validates with Zod)
const newUser = await sdk.tables.users.insert({
  name: 'John Doe',
  email: 'john@example.com',
  role: 'user'
});

// Query data
const activeUsers = await sdk.tables.users.select({
  where: [{ column: 'role', operator: 'eq', value: 'user' }],
  limit: 10,
  orderBy: [{ column: 'name', direction: 'asc' }]
});

// Update records
await sdk.tables.users.update(newUser.id, {
  lastActive: new Date()
});

// Count records
const userCount = await sdk.tables.users.count();

// Complex operations
const recentAnalytics = await sdk.tables.analytics.select({
  where: [
    { column: 'timestamp', operator: 'gte', value: new Date('2024-01-01') },
    { column: 'eventName', operator: 'in', value: ['page_view', 'click'] }
  ],
  orderBy: [{ column: 'timestamp', direction: 'desc' }],
  limit: 100
});
```

### 4. Google Services Integration

```typescript
// Google Ads with advanced account management
const accounts = await sdk.ads.listAllAccounts();
const hierarchy = await sdk.ads.getAccountHierarchy('manager-account-id');
const campaigns = await sdk.ads.getCampaigns('customer-id');

// Google Analytics
const analyticsReports = await sdk.analytics.getReports({
  viewId: 'view-id',
  startDate: '30daysAgo',
  endDate: 'yesterday'
});

// Google Sheets with formatting
const spreadsheet = await sdk.sheets.createSpreadsheet('Report', [
  { title: 'Summary' },
  { title: 'Details' }
]);

// Other Google Services
const driveFiles = await sdk.drive.listFiles();
const emails = await sdk.gmail.getMessages({ query: 'is:unread' });
const documents = await sdk.docs.getDocument('doc-id');
const searchConsoleData = await sdk.searchConsole.getSites();
```

## 🏢 Application Architecture

### Two-Component Structure

Every MetricsHub application consists of **two separate code repositories**:

> **🚨 IMPORTANT**: The "Server Integration" is **NOT for building APIs or servers**. It's specifically for **scheduled cron jobs** that run automatically on MetricsHub's executor server. If you need APIs, build them separately and use the SDK there.

#### 1. 📱 **Iframe App** (`my-app-ui/`)
- **Purpose**: Interactive user interface
- **Environment**: Browser (embedded in iframe)
- **Use Cases**: Dashboards, forms, user interactions, data visualization
- **Authentication**: PostMessage from parent window

```typescript
// iframe-app/src/main.ts
import { MetricsHubSDK, onAuth } from '@metrics-hub/sdk';
import { appSchema } from './schema';

// Wait for authentication from parent window
const authData = await onAuth();

// Initialize SDK with auth data
const sdk = new MetricsHubSDK({
  appId: authData.appId,
  companyId: authData.companyId,
  companyToken: authData.companyToken,
  mode: 'production'
}, appSchema);

// Build your UI
async function loadDashboard() {
  const campaigns = await sdk.tables.campaigns.select({ limit: 10 });
  const users = await sdk.tables.users.count();
  
  // Render dashboard with data
  renderDashboard({ campaigns, userCount: users });
}
```

#### 2. ⚙️ **Server Integration** (`my-app-integration/`)
- **Purpose**: ⏰ **CRON JOBS ONLY** - Scheduled background tasks
- **Environment**: MetricsHub Executor Server (managed execution)
- **Use Cases**: Daily data sync, automated reports, scheduled data fetching
- **Authentication**: Direct API tokens
- **⚠️ Important**: This is NOT for building APIs or web servers - only scheduled tasks!

```typescript
// integration/src/daily-sync.ts - CRON JOB ONLY
import { MetricsHubSDK } from '@metrics-hub/sdk';
import { appSchema } from './schema';

// ⚠️ This is a CRON JOB, not an API server!
// It runs automatically on MetricsHub's executor server

const sdk = new MetricsHubSDK({
  appId: process.env.APP_ID,
  companyId: process.env.COMPANY_ID,
  companyToken: process.env.COMPANY_TOKEN,
  mode: 'production'
}, appSchema);

// This function runs automatically at scheduled times (e.g., daily at 3 AM)
export async function dailyDataSync() {
  try {
    console.log('🚀 Starting daily data sync cron job...');
    
    // Fetch fresh data from Google Ads
    const campaigns = await sdk.ads.getCampaigns();
    
    // Store in shared database (iframe app can read this data)
    for (const campaign of campaigns) {
      await sdk.tables.campaigns.insert({
        campaignId: campaign.id,
        name: campaign.name,
        status: campaign.status,
        budget: campaign.budget,
        impressions: campaign.impressions || 0,
        clicks: campaign.clicks || 0
      });
    }
    
    console.log(`✅ Synced ${campaigns.length} campaigns successfully`);
  } catch (error) {
    console.error('❌ Daily sync cron job failed:', error);
  }
}

// ⏰ Schedule configuration (set when uploading integration):
// - Daily at 3 AM: "0 3 * * *"  
// - Every hour: "0 * * * *"
// - Weekly: "0 0 * * 0"
```

### 🔄 Data Flow Example

```typescript
// Shared schema (same in both apps)
const appSchema = MetricsHubSchema.define({
  campaigns: z.object({
    campaignId: z.string(),
    name: z.string(),
    status: z.enum(['active', 'paused', 'ended']),
    budget: z.number(),
    lastSynced: z.date().default(() => new Date())
  })
});

// CRON INTEGRATION: Fetches and stores data on schedule
async function fetchCampaignData() {
  // ⏰ This runs automatically at scheduled times
  const campaigns = await sdk.ads.getCampaigns();
  
  for (const campaign of campaigns) {
    await sdk.tables.campaigns.insert({
      campaignId: campaign.id,
      name: campaign.name,
      status: campaign.status,
      budget: campaign.budget
    });
  }
}

// Iframe app: Displays the data
async function showCampaigns() {
  const campaigns = await sdk.tables.campaigns.select({
    orderBy: [{ column: 'lastSynced', direction: 'desc' }]
  });
  
  // Render in UI
  campaigns.forEach(campaign => {
    console.log(`${campaign.name}: $${campaign.budget}`);
  });
}
```

## 🔧 Enhanced Features

### Google Ads Account Management

```typescript
// List all accessible Google Ads accounts
const accounts = await sdk.ads.listAllAccounts();

// Get account hierarchy for manager accounts
const hierarchy = await sdk.ads.getAccountHierarchy('manager-account-id');

// Get detailed account information
const accountDetails = await sdk.ads.getAccountDetails('customer-id');

// Get MCC (Manager) accounts
const mccAccounts = await sdk.ads.getMCCAccounts();

// Get child accounts for a manager
const childAccounts = await sdk.ads.getChildAccounts('mcc-id');
```

### OAuth Connection Management

```typescript
// Check connection status
const isConnected = await sdk.connection.isConnected('google-ads');

// Get authorization URL for OAuth flow
const authUrl = await sdk.connection.getAuthorizationUrl(
  'google-ads',
  'https://your-app.com/callback'
);

// Get connection information
const connectionInfo = await sdk.connection.getConnectionInfo('google-ads');

// Refresh expired tokens automatically
const token = await sdk.connection.getAccessToken('google-ads');
```

### Advanced Error Handling

```typescript
import { 
  GoogleAdsAPIError, 
  ConnectionError, 
  RateLimitError,
  ValidationError,
  ErrorUtils 
} from '@metrics-hub/sdk';

try {
  const campaigns = await sdk.ads.getCampaigns('customer-id');
} catch (error) {
  if (error instanceof GoogleAdsAPIError && error.quotaExceeded) {
    console.log('API quota exceeded, waiting...');
  } else if (error instanceof ConnectionError && error.expired) {
    console.log('Connection expired, please reauthenticate');
  } else if (error instanceof RateLimitError) {
    console.log(`Rate limited, retry after ${error.retryAfter} seconds`);
  }
  
  // Get user-friendly error message
  const friendlyMessage = ErrorUtils.getUserFriendlyMessage(error);
}
```

### Component-Based Logging

```typescript
import { Logger, GoogleAdsLogger, ConnectionLogger } from '@metrics-hub/sdk';

// Set global log level
Logger.setLevel('debug');

// Enable specific components
Logger.enableComponent('GoogleAds');
Logger.enableComponent('Connection');

// Use component-specific loggers
GoogleAdsLogger.info('Fetching campaigns', { customerId: '123456789' });
ConnectionLogger.warn('Token expires soon', { provider: 'google-ads' });
```

### Plugin Development

```typescript
import { PluginSDK } from '@metrics-hub/sdk';

const pluginSDK = new PluginSDK(config, {
  id: 'campaign-optimizer',
  name: 'Campaign Optimizer',
  version: '1.0.0',
  permissions: ['google-ads']
});

// Plugin state management
await pluginSDK.setState('settings', { targetCPA: 50 });
const settings = await pluginSDK.getState('settings');

// Inter-plugin communication
pluginSDK.onMessage('optimization-request', async (data) => {
  // Handle optimization request
});

await pluginSDK.sendMessage('reporting-plugin', 'optimization-complete', {
  campaignsOptimized: 15,
  improvement: '12.5%'
});
```

### Testing Utilities

```typescript
import { TestingSDK, TestUtils } from '@metrics-hub/sdk';

const testSDK = TestUtils.createTestSDK();
testSDK.enableTestMode();

// Generate mock data
const mockCampaigns = testSDK.generateMockCampaigns('123456789', {
  count: 10,
  realistic: true
});

// Mock API responses
testSDK.mockConnection('google-ads', { campaigns: mockCampaigns });

// Simulate errors
testSDK.simulateError('rate_limit', 0.1); // 10% error rate

// Performance testing
const result = await testSDK.measurePerformance(
  () => sdk.ads.getCampaigns('123456789'),
  'getCampaigns'
);
```

## 📚 Documentation

### Getting Started
- **[Getting Started Guide](./docs/getting-started.md)** - Quick start with examples
- **[API Reference](./docs/api-reference.md)** - Complete API documentation

### Advanced Features
- **[Google Ads Integration](./docs/google-ads-guide.md)** - Advanced Google Ads features
- **[OAuth Setup](./docs/oauth-guide.md)** - Complete OAuth integration guide
- **[Error Handling](./docs/error-handling.md)** - Master error handling patterns

### Development
- **[Plugin Development](./docs/plugin-guide.md)** - Build custom extensions
- **[Metadata.json Guide](./docs/metadata-json-guide.md)** - Complete integration metadata reference
- **[Testing Guide](./docs/testing-guide.md)** - Testing utilities and patterns


## Available Operations

### Database
- `sdk.tables.{tableName}.insert(data)` - Insert record
- `sdk.tables.{tableName}.select(options)` - Select records  
- `sdk.tables.{tableName}.update(id, data)` - Update record
- `sdk.tables.{tableName}.delete(id)` - Delete record
- `sdk.tables.{tableName}.count(where)` - Count records

### Google Services  
- `sdk.ads` - Google Ads API with account management
- `sdk.analytics` - Google Analytics API
- `sdk.sheets` - Google Sheets API with formatting
- `sdk.drive` - Google Drive API
- `sdk.gmail` - Gmail API
- `sdk.docs` - Google Docs API
- `sdk.searchConsole` - Search Console API

### Connection Management
- `sdk.connection.isConnected(provider)` - Check connection status
- `sdk.connection.getAuthorizationUrl(provider, redirectUrl)` - Get OAuth URL
- `sdk.connection.getConnectionInfo(provider)` - Get connection details

### Plugin Development
- `new PluginSDK(config, manifest)` - Create plugin SDK
- `pluginSDK.setState(key, value)` - Store plugin state
- `pluginSDK.getState(key)` - Retrieve plugin state
- `pluginSDK.sendMessage(target, type, data)` - Send messages
- `pluginSDK.onMessage(type, handler)` - Listen for messages

## 🎯 TypeScript Support

Full TypeScript support with automatic type inference from your Zod schemas and comprehensive error types.

```typescript
// Automatic type inference from schema
const user = await sdk.tables.users.insert({
  name: 'John Doe',     // ✓ string
  email: 'john@...',    // ✓ email validation
  role: 'admin'         // ✓ enum validation
  // lastActive: ...    // ✓ optional field
});

// Type-safe error handling
import type { 
  GoogleAdsAPIError, 
  ConnectionError,
  ValidationError 
} from '@metrics-hub/sdk';

// Full IntelliSense support
const campaigns = await sdk.ads.getCampaigns(customerId);
campaigns.campaigns.forEach(campaign => {
  // ✓ Full type safety
  console.log(campaign.name, campaign.metrics.clicks);
});
```

## 🚀 Performance & Reliability

- **Automatic Retry Logic**: Built-in exponential backoff for transient failures
- **Connection Pooling**: Optimized database connections
- **Rate Limit Handling**: Automatic rate limit detection and queuing
- **Memory Efficient**: Streaming for large datasets
- **Error Recovery**: Graceful degradation and fallback strategies

## 🛠️ Development Tools

- **Mock Data Generation**: Realistic test data for development
- **API Simulation**: Full offline development capabilities
- **Performance Profiling**: Built-in performance monitoring
- **Debug Logging**: Granular logging for troubleshooting
- **Type Validation**: Runtime schema validation with Zod

## 🤝 Contributing

We welcome contributions! Please see our GitHub repository for contribution guidelines.

## 📞 Support

- **GitHub Issues**: [Report bugs and feature requests](https://github.com/metrics-cz/metrics-hub/issues)
- **Documentation**: [Complete guides and API reference](./docs/)
- **Community**: Join our community for support and discussions

## License

MIT