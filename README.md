# MetricsHub SDK

Official unified SDK for building MetricsHub applications. Get everything in one package: auto-generated database + all Google services, without separate hosting.

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
⚡ **Schema-First**: Automatic table creation from TypeScript schemas  
🔐 **Multi-tenant**: Company-scoped isolation with enterprise security  
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
// All Google services are pre-configured and ready to use
const campaigns = await sdk.ads.getCampaigns();
const analyticsReports = await sdk.analytics.getReports();
const spreadsheetData = await sdk.sheets.read('spreadsheet-id', 'Sheet1!A1:Z100');
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

## Available Operations

### Database
- `sdk.tables.{tableName}.insert(data)` - Insert record
- `sdk.tables.{tableName}.select(options)` - Select records  
- `sdk.tables.{tableName}.update(id, data)` - Update record
- `sdk.tables.{tableName}.delete(id)` - Delete record
- `sdk.tables.{tableName}.count(where)` - Count records

### Google Services  
- `sdk.googleAds` - Google Ads API
- `sdk.googleAnalytics` - Google Analytics API
- `sdk.sheets` - Google Sheets API
- `sdk.drive` - Google Drive API
- `sdk.gmail` - Gmail API
- `sdk.docs` - Google Docs API
- `sdk.searchConsole` - Search Console API

## TypeScript Support

Full TypeScript support with automatic type inference from your Zod schemas.

## License

MIT