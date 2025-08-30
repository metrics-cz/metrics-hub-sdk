# Getting Started with MetricsHub SDK

## Overview

The MetricsHub SDK is a powerful, unified toolkit for building sophisticated MetricsHub applications. It provides seamless integration with Google services, advanced OAuth management, comprehensive error handling, and a robust plugin development framework.

## Installation

```bash
npm install @metrics-hub/sdk zod
```

## Quick Start

### 1. Basic Setup

```typescript
import { MetricsHubSDK } from '@metrics-hub/sdk';

const sdk = new MetricsHubSDK({
  companyId: 'your-company-id',
  apiBaseUrl: 'https://your-metricshub-instance.com',
  debug: true // Enable debug logging
});
```

### 2. Your First API Call

```typescript
// Get Google Ads accounts
try {
  const accounts = await sdk.ads.listAllAccounts();
  console.log(`Found ${accounts.total} accounts:`, accounts.accounts);
} catch (error) {
  console.error('Failed to fetch accounts:', error.message);
}
```

### 3. Handle Connections

```typescript
// Check if Google Ads is connected
const isConnected = await sdk.connection.isConnected('google-ads');

if (!isConnected) {
  console.log('Please connect your Google Ads account');
  // Redirect user to OAuth flow
  const authUrl = await sdk.connection.getAuthorizationUrl(
    'google-ads',
    'https://your-app.com/callback'
  );
}
```

## Core Concepts

### 1. SDK Structure

The MetricsHub SDK is organized into several key areas:

- **Google Services** (`sdk.ads`, `sdk.analytics`, `sdk.sheets`, etc.)
- **Connection Management** (`sdk.connection`)
- **Database Operations** (`sdk.tables` - when schema is provided)
- **Error Handling** (Structured error classes)
- **Logging** (Component-based logging system)

### 2. Error Handling

All SDK operations use structured error handling:

```typescript
import { GoogleAdsAPIError, ConnectionError } from '@metrics-hub/sdk';

try {
  const campaigns = await sdk.ads.getCampaigns('123456789');
} catch (error) {
  if (error instanceof GoogleAdsAPIError && error.quotaExceeded) {
    console.log('API quota exceeded, please try again later');
  } else if (error instanceof ConnectionError && error.expired) {
    console.log('Connection expired, please reauthenticate');
  } else {
    console.error('Unexpected error:', error.message);
  }
}
```

### 3. Logging

Enable logging to debug issues:

```typescript
import { Logger } from '@metrics-hub/sdk';

// Set global log level
Logger.setLevel('debug');

// Enable specific components
Logger.enableComponent('GoogleAds');
Logger.enableComponent('Connection');
```

## Common Use Cases

### Account Management

#### List All Google Ads Accounts

```typescript
async function listAccounts() {
  try {
    // Get all accessible accounts
    const result = await sdk.ads.listAllAccounts();
    
    console.log(`Total accounts: ${result.total}`);
    
    result.accounts.forEach(account => {
      console.log(`${account.descriptiveName} (${account.id})`);
      console.log(`  Manager: ${account.manager}`);
      console.log(`  Status: ${account.status}`);
      console.log(`  Currency: ${account.currencyCode}`);
    });
    
    // Handle hierarchies if present
    if (result.hierarchies) {
      result.hierarchies.forEach(hierarchy => {
        console.log(`\nHierarchy for ${hierarchy.managerAccount.descriptiveName}:`);
        hierarchy.childAccounts.forEach(child => {
          console.log(`  - ${child.descriptiveName} (${child.id})`);
        });
      });
    }
  } catch (error) {
    console.error('Failed to list accounts:', error);
  }
}
```

#### Get Account Hierarchy

```typescript
async function getAccountHierarchy(managerId?: string) {
  try {
    const result = await sdk.ads.getAccountHierarchy(managerId);
    
    console.log('Account Hierarchy:');
    console.log(`Manager: ${result.hierarchy.managerAccount.descriptiveName}`);
    console.log(`Child Accounts: ${result.hierarchy.childAccounts.length}`);
    
    result.hierarchy.childAccounts.forEach((child, index) => {
      console.log(`  ${index + 1}. ${child.descriptiveName} (${child.id})`);
    });
  } catch (error) {
    console.error('Failed to get hierarchy:', error);
  }
}
```

### Campaign Analysis

```typescript
async function analyzeCampaigns(customerId: string) {
  try {
    const result = await sdk.ads.getCampaigns(customerId);
    
    console.log(`Found ${result.total} campaigns for customer ${customerId}`);
    
    // Analyze performance
    const totalCost = result.campaigns.reduce((sum, campaign) => 
      sum + (campaign.metrics.cost || 0), 0
    );
    
    const totalClicks = result.campaigns.reduce((sum, campaign) => 
      sum + (campaign.metrics.clicks || 0), 0
    );
    
    console.log(`Total Spend: $${(totalCost / 1000000).toFixed(2)}`);
    console.log(`Total Clicks: ${totalClicks.toLocaleString()}`);
    
    // Find top performing campaigns
    const topCampaigns = result.campaigns
      .sort((a, b) => (b.metrics.clicks || 0) - (a.metrics.clicks || 0))
      .slice(0, 5);
    
    console.log('\nTop 5 Campaigns by Clicks:');
    topCampaigns.forEach((campaign, index) => {
      console.log(`${index + 1}. ${campaign.name}: ${campaign.metrics.clicks} clicks`);
    });
    
  } catch (error) {
    console.error('Failed to analyze campaigns:', error);
  }
}
```

### Google Analytics Integration

```typescript
async function getAnalyticsInsights() {
  try {
    // Get all Analytics accounts
    const accounts = await sdk.analytics.getAccounts();
    console.log(`Found ${accounts.total} Analytics accounts`);
    
    // Get properties for first account
    if (accounts.accounts.length > 0) {
      const firstAccount = accounts.accounts[0];
      const properties = await sdk.analytics.getProperties(firstAccount.id);
      
      console.log(`Account "${firstAccount.name}" has ${properties.total} properties`);
      
      // Get views for first property
      if (properties.data.length > 0) {
        const firstProperty = properties.data[0];
        const views = await sdk.analytics.getViews(firstProperty.id);
        
        console.log(`Property "${firstProperty.name}" has ${views.total} views`);
        
        // Get report for first view
        if (views.data.length > 0) {
          const firstView = views.data[0];
          const reports = await sdk.analytics.getReports({
            viewId: firstView.id,
            startDate: '30daysAgo',
            endDate: 'today'
          });
          
          console.log(`\nLast 30 days summary for ${firstView.name}:`);
          console.log(`Sessions: ${reports.summary.totalSessions}`);
          console.log(`Users: ${reports.summary.totalUsers}`);
          console.log(`Pageviews: ${reports.summary.totalPageviews}`);
        }
      }
    }
  } catch (error) {
    console.error('Failed to get Analytics insights:', error);
  }
}
```

### Google Sheets Operations

```typescript
async function createAndPopulateSheet() {
  try {
    // Create new spreadsheet
    const spreadsheet = await sdk.sheets.createSpreadsheet('Campaign Analysis', [
      { 
        title: 'Campaigns', 
        gridProperties: { rowCount: 1000, columnCount: 10 } 
      },
      { 
        title: 'Summary' 
      }
    ]);
    
    console.log(`Created spreadsheet: ${spreadsheet.spreadsheet.spreadsheetId}`);
    
    // Add headers
    await sdk.sheets.write({
      spreadsheetId: spreadsheet.spreadsheet.spreadsheetId,
      range: 'Campaigns!A1:E1',
      values: [['Campaign Name', 'Status', 'Clicks', 'Cost', 'CTR']],
      operation: 'update'
    });
    
    // Format headers
    await sdk.sheets.formatCells(
      spreadsheet.spreadsheet.spreadsheetId,
      'Campaigns!A1:E1',
      {
        backgroundColor: { red: 0.2, green: 0.6, blue: 0.9 },
        textFormat: { bold: true, foregroundColor: { red: 1, green: 1, blue: 1 } }
      }
    );
    
    // Get campaign data and populate sheet
    const campaigns = await sdk.ads.getCampaigns('123456789');
    const rows = campaigns.campaigns.map(campaign => [
      campaign.name,
      campaign.status,
      campaign.metrics.clicks,
      `$${(campaign.metrics.cost / 1000000).toFixed(2)}`,
      `${(campaign.metrics.ctr || 0).toFixed(2)}%`
    ]);
    
    await sdk.sheets.write({
      spreadsheetId: spreadsheet.spreadsheet.spreadsheetId,
      range: `Campaigns!A2:E${rows.length + 1}`,
      values: rows,
      operation: 'update'
    });
    
    // Share with team
    await sdk.sheets.shareSpreadsheet(
      spreadsheet.spreadsheet.spreadsheetId,
      ['team@company.com'],
      'editor'
    );
    
    console.log('✅ Spreadsheet created and shared successfully');
    
  } catch (error) {
    console.error('Failed to create spreadsheet:', error);
  }
}
```

## Plugin Development

### Basic Plugin Setup

```typescript
import { PluginSDK } from '@metrics-hub/sdk';

const manifest = {
  id: 'campaign-optimizer',
  name: 'Campaign Optimizer',
  version: '1.0.0',
  description: 'Automatically optimize campaign bids based on performance',
  permissions: ['google-ads']
};

const pluginSDK = new PluginSDK({
  companyId: 'your-company-id',
  apiBaseUrl: 'https://your-metricshub-instance.com'
}, manifest);

// Register the plugin
await pluginSDK.registerPlugin();
```

### Plugin State Management

```typescript
// Store user preferences
pluginSDK.setState('optimizationSettings', {
  targetCPA: 50,
  bidAdjustmentLimit: 0.2,
  minimumConversions: 10
});

// Get stored settings
const settings = pluginSDK.getState('optimizationSettings');

// Store optimization results
pluginSDK.setState('lastOptimization', {
  timestamp: new Date(),
  campaignsOptimized: 15,
  avgImprovementPercent: 12.5
});
```

### Inter-Plugin Communication

```typescript
// Listen for messages from other plugins
pluginSDK.onMessage('performance-alert', async (data, sender) => {
  console.log(`Received performance alert from ${sender}:`, data);
  
  if (data.campaignId && data.metricType === 'cpa') {
    // Automatically adjust bids for high CPA campaigns
    await optimizeCampaignBids(data.campaignId);
  }
});

// Send optimization results to analytics plugin
await pluginSDK.sendMessage('analytics-dashboard', 'optimization-complete', {
  campaignId: '123456789',
  oldCPA: 75.50,
  newCPA: 45.25,
  improvement: '40.1%'
});
```

### UI Integration (for iframe plugins)

```typescript
// Show success notification
pluginSDK.showNotification('success', 'Campaigns optimized successfully!', {
  duration: 5000,
  actionText: 'View Report',
  onAction: () => {
    // Show detailed report
    displayOptimizationReport();
  }
});

// Resize plugin when showing detailed view
pluginSDK.resize(1200, 800);

// Request fullscreen for comprehensive dashboard
pluginSDK.requestFullscreen();
```

## Testing Your Application

### Setting up Tests

```typescript
import { TestingSDK, TestUtils } from '@metrics-hub/sdk';

describe('Campaign Analysis', () => {
  let testSDK: TestingSDK;
  
  beforeEach(() => {
    testSDK = TestUtils.createTestSDK();
    testSDK.enableTestMode();
  });
  
  it('should analyze campaign performance', async () => {
    // Generate mock campaigns
    const mockCampaigns = testSDK.generateMockCampaigns('123456789', {
      count: 10,
      realistic: true
    });
    
    // Mock the API response
    testSDK.mockConnection('google-ads', {
      campaigns: mockCampaigns
    });
    
    // Test your analysis function
    const result = await analyzeCampaignPerformance('123456789');
    
    expect(result).toBeDefined();
    expect(result.totalCampaigns).toBe(10);
  });
  
  it('should handle API errors gracefully', async () => {
    // Simulate API errors
    testSDK.simulateError('rate_limit', 1.0);
    
    await expect(
      analyzeCampaignPerformance('123456789')
    ).rejects.toThrow('Rate limit exceeded');
  });
});
```

### Performance Testing

```typescript
async function testPerformance() {
  const testSDK = TestUtils.createTestSDK();
  
  const result = await testSDK.measurePerformance(
    async () => {
      const accounts = await sdk.ads.listAllAccounts();
      return accounts.accounts.length;
    },
    'listAllAccounts'
  );
  
  console.log(`Operation took ${result.duration}ms`);
  console.log(`Processed ${result.result} accounts`);
}
```

## Environment Configuration

### Development Environment

```typescript
// .env.development
const config = {
  companyId: 'dev-company-123',
  apiBaseUrl: 'https://dev-metricshub.vercel.app',
  debug: true
};

const sdk = new MetricsHubSDK(config);

// Enable comprehensive logging
Logger.setLevel('debug');
Logger.enableComponent('GoogleAds');
Logger.enableComponent('Connection');
Logger.enableComponent('API_REQUESTS');
```

### Production Environment

```typescript
// .env.production
const config = {
  companyId: process.env.METRICSHUB_COMPANY_ID,
  apiBaseUrl: process.env.METRICSHUB_API_URL,
  apiKey: process.env.METRICSHUB_API_KEY,
  debug: false
};

const sdk = new MetricsHubSDK(config);

// Production logging
Logger.setLevel('warn');
```

## Best Practices

### 1. Connection Management

Always check connection status before making API calls:

```typescript
async function safeApiCall() {
  const isConnected = await sdk.connection.isConnected('google-ads');
  
  if (!isConnected) {
    throw new Error('Google Ads not connected. Please authenticate.');
  }
  
  return await sdk.ads.getCampaigns('123456789');
}
```

### 2. Error Handling

Use specific error types for better user experience:

```typescript
import { GoogleAdsAPIError, ConnectionError, RateLimitError } from '@metrics-hub/sdk';

async function handleApiCall() {
  try {
    return await sdk.ads.getCampaigns('123456789');
  } catch (error) {
    if (error instanceof GoogleAdsAPIError && error.quotaExceeded) {
      // Wait and retry
      await TestUtils.wait(60000);
      return handleApiCall();
    } else if (error instanceof ConnectionError && error.expired) {
      // Redirect to auth
      window.location.href = '/auth/google-ads';
    } else if (error instanceof RateLimitError) {
      // Wait for rate limit reset
      await TestUtils.wait((error.retryAfter || 60) * 1000);
      return handleApiCall();
    } else {
      // Handle other errors
      console.error('API call failed:', error.message);
      throw error;
    }
  }
}
```

### 3. Performance Optimization

Use batch operations when possible:

```typescript
// Instead of individual sheet updates
for (const row of data) {
  await sdk.sheets.write(/* individual row */);
}

// Use batch operations
await sdk.sheets.write({
  spreadsheetId: 'sheet-id',
  range: 'Sheet1!A1:Z100',
  values: data,
  operation: 'update'
});
```

### 4. Logging Strategy

Use structured logging with context:

```typescript
import { GoogleAdsLogger } from '@metrics-hub/sdk';

GoogleAdsLogger.info('Starting campaign analysis', {
  customerId: '123456789',
  dateRange: '2024-01-01 to 2024-01-31',
  userAction: 'manual_refresh'
});
```

## Next Steps

1. **[API Reference](./api-reference.md)** - Comprehensive API documentation
2. **[Google Ads Integration](./google-ads-guide.md)** - Advanced Google Ads features
3. **[OAuth Setup](./oauth-guide.md)** - Complete OAuth integration guide
4. **[Plugin Development](./plugin-guide.md)** - Build advanced plugins
5. **[Error Handling](./error-handling.md)** - Master error handling patterns

## Support

- **GitHub Issues**: [Report bugs and feature requests](https://github.com/metrics-cz/metrics-hub/issues)
- **Documentation**: [Complete API reference](./api-reference.md)
- **Examples**: [Sample applications](../examples/)

Happy building with MetricsHub SDK! 🚀