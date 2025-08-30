# Plugin Development Guide

## Overview

The MetricsHub SDK provides a comprehensive plugin development framework that allows you to extend MetricsHub functionality with custom applications, automation, and integrations. Plugins can run as background processes, iframe applications, or scheduled tasks.

## Plugin Architecture

### Plugin Types

1. **Background Plugins**: Serverless functions that run in response to events
2. **Iframe Plugins**: Web applications embedded in MetricsHub UI
3. **Scheduled Plugins**: Automated tasks that run on predefined schedules
4. **Webhook Plugins**: HTTP endpoints that respond to external events

### Plugin Lifecycle

```typescript
import { PluginSDK } from '@metrics-hub/sdk';

// 1. Plugin Registration
const pluginSDK = new PluginSDK(config, manifest);
await pluginSDK.registerPlugin();

// 2. Initialization
await pluginSDK.initialize();

// 3. Event Handling
pluginSDK.onMessage('data-sync', handleDataSync);

// 4. Cleanup
process.on('SIGTERM', async () => {
  await pluginSDK.cleanup();
});
```

## Basic Plugin Setup

### 1. Create Plugin Manifest

```typescript
import { PluginManifest } from '@metrics-hub/sdk';

const manifest: PluginManifest = {
  id: 'campaign-optimizer',
  name: 'Campaign Optimizer',
  version: '1.2.0',
  description: 'Automatically optimize campaign bids based on performance metrics',
  author: 'Your Company',
  
  // Plugin configuration
  type: 'background', // 'background' | 'iframe' | 'scheduled' | 'webhook'
  
  // Required permissions
  permissions: [
    'google-ads',
    'google-analytics',
    'database:read',
    'database:write'
  ],
  
  // Runtime settings
  settings: {
    memory: 512, // MB
    timeout: 300, // seconds
    concurrent: false // single instance
  },
  
  // Scheduling (for scheduled plugins)
  schedule: {
    cron: '0 */6 * * *', // Every 6 hours
    timezone: 'UTC'
  },
  
  // UI configuration (for iframe plugins)
  ui: {
    width: 1200,
    height: 800,
    resizable: true,
    fullscreenCapable: true
  },
  
  // Configuration schema
  configSchema: {
    targetCPA: { type: 'number', min: 1, max: 1000, default: 50 },
    bidAdjustmentLimit: { type: 'number', min: 0.1, max: 2.0, default: 0.3 },
    minimumConversions: { type: 'integer', min: 1, default: 10 }
  }
};
```

### 2. Initialize Plugin SDK

```typescript
import { PluginSDK, MetricsHubSDK } from '@metrics-hub/sdk';

const config = {
  companyId: process.env.COMPANY_ID!,
  apiBaseUrl: process.env.METRICSHUB_API_URL!
};

const pluginSDK = new PluginSDK(config, manifest);

// Initialize the plugin
async function initialize() {
  try {
    await pluginSDK.registerPlugin();
    console.log('Plugin registered successfully');
    
    await pluginSDK.initialize();
    console.log('Plugin initialized');
    
    // Plugin is ready for use
    startPluginLogic();
  } catch (error) {
    console.error('Plugin initialization failed:', error);
    process.exit(1);
  }
}

initialize();
```

## Plugin State Management

### Persistent State

```typescript
// Store plugin configuration
await pluginSDK.setState('optimizationSettings', {
  targetCPA: 45,
  bidAdjustmentLimit: 0.25,
  minimumConversions: 15,
  excludedCampaigns: ['123456789']
});

// Retrieve configuration
const settings = await pluginSDK.getState('optimizationSettings');
console.log('Current settings:', settings);

// Store optimization history
await pluginSDK.setState('lastOptimization', {
  timestamp: new Date(),
  campaignsOptimized: 12,
  totalImprovementPercent: 18.5,
  errors: 0
});

// Get optimization history
const history = await pluginSDK.getState('lastOptimization');
```

### Temporary State

```typescript
// Use for runtime data that doesn't need persistence
pluginSDK.setTempState('currentBatch', {
  customerId: '123456789',
  campaignIds: ['111', '222', '333'],
  startTime: Date.now()
});

const currentBatch = pluginSDK.getTempState('currentBatch');
```

### State Validation

```typescript
import { z } from 'zod';

const settingsSchema = z.object({
  targetCPA: z.number().min(1).max(1000),
  bidAdjustmentLimit: z.number().min(0.1).max(2.0),
  minimumConversions: z.number().int().min(1)
});

// Validate before storing
try {
  const validSettings = settingsSchema.parse(userSettings);
  await pluginSDK.setState('optimizationSettings', validSettings);
} catch (error) {
  console.error('Invalid settings:', error.issues);
}
```

## Inter-Plugin Communication

### Sending Messages

```typescript
// Send message to specific plugin
await pluginSDK.sendMessage('analytics-dashboard', 'optimization-complete', {
  campaignId: '123456789',
  optimization: {
    oldCPA: 75.50,
    newCPA: 45.25,
    improvement: 40.1,
    timestamp: new Date()
  }
});

// Broadcast to all plugins
await pluginSDK.broadcast('global-settings-changed', {
  setting: 'timezone',
  oldValue: 'EST',
  newValue: 'PST'
});

// Send with options
await pluginSDK.sendMessage('reporting-plugin', 'generate-report', reportData, {
  priority: 'high',
  timeout: 60000, // 60 seconds
  requireAck: true
});
```

### Receiving Messages

```typescript
// Listen for specific message types
pluginSDK.onMessage('performance-alert', async (data, sender) => {
  console.log(`Performance alert from ${sender}:`, data);
  
  if (data.alertType === 'high-cpa' && data.campaignId) {
    await optimizeCampaignBids(data.campaignId);
  }
});

// Listen for data sync events
pluginSDK.onMessage('data-sync', async (data) => {
  console.log('Data sync event:', data);
  
  switch (data.type) {
    case 'campaigns-updated':
      await refreshCampaignOptimizations();
      break;
      
    case 'accounts-added':
      await initializeNewAccounts(data.accountIds);
      break;
  }
});

// Handle plugin lifecycle events
pluginSDK.onMessage('system:shutdown', async () => {
  console.log('System shutting down, cleaning up...');
  await cleanupOptimizations();
  process.exit(0);
});
```

### Message Patterns

```typescript
// Request-Response Pattern
pluginSDK.onMessage('get-optimization-stats', async (query, sender) => {
  const stats = await getOptimizationStats(query.dateRange);
  
  await pluginSDK.sendMessage(sender, 'optimization-stats-response', {
    requestId: query.requestId,
    stats
  });
});

// Publisher-Subscriber Pattern
class EventBus {
  private subscribers = new Map<string, Function[]>();
  
  subscribe(event: string, callback: Function) {
    if (!this.subscribers.has(event)) {
      this.subscribers.set(event, []);
    }
    this.subscribers.get(event)!.push(callback);
    
    // Listen for the event via plugin messaging
    pluginSDK.onMessage(event, callback);
  }
  
  async publish(event: string, data: any) {
    await pluginSDK.broadcast(event, data);
  }
}

const eventBus = new EventBus();
eventBus.subscribe('campaign-optimized', handleCampaignOptimized);
```

## Iframe Plugin Development

### Basic Setup

```typescript
// iframe-plugin.html
<!DOCTYPE html>
<html>
<head>
  <title>Campaign Optimizer Dashboard</title>
  <script src="https://unpkg.com/@metrics-hub/sdk/dist/iframe-plugin.js"></script>
</head>
<body>
  <div id="app">
    <h1>Campaign Optimizer</h1>
    <div id="dashboard"></div>
  </div>
  
  <script>
    const pluginSDK = new PluginSDK({
      companyId: 'your-company-id'
    }, manifest);
    
    // Initialize plugin
    pluginSDK.initialize().then(() => {
      renderDashboard();
    });
  </script>
</body>
</html>
```

### UI Integration

```typescript
// Resize plugin window
pluginSDK.resize(1400, 900);

// Request fullscreen
pluginSDK.requestFullscreen();

// Show notifications
pluginSDK.showNotification('success', 'Campaigns optimized successfully!', {
  duration: 5000,
  actionText: 'View Details',
  onAction: () => {
    showOptimizationDetails();
  }
});

// Show loading state
pluginSDK.showLoading('Optimizing campaigns...');
pluginSDK.hideLoading();

// Update plugin title
pluginSDK.setTitle(`Optimizer - ${optimizedCount} campaigns`);
```

### Data Visualization

```typescript
// Render optimization results
async function renderDashboard() {
  const optimizationData = await pluginSDK.getState('optimizationHistory');
  const currentSettings = await pluginSDK.getState('optimizationSettings');
  
  // Create charts using your preferred library
  const chart = new Chart(document.getElementById('performanceChart'), {
    type: 'line',
    data: {
      labels: optimizationData.dates,
      datasets: [{
        label: 'Average CPA',
        data: optimizationData.cpaValues,
        borderColor: 'rgb(75, 192, 192)',
        tension: 0.1
      }]
    },
    options: {
      responsive: true,
      plugins: {
        title: {
          display: true,
          text: 'Optimization Performance'
        }
      }
    }
  });
  
  // Update settings form
  document.getElementById('targetCPA').value = currentSettings.targetCPA;
  document.getElementById('bidLimit').value = currentSettings.bidAdjustmentLimit;
}

// Handle settings updates
document.getElementById('settingsForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  
  const newSettings = {
    targetCPA: parseFloat(document.getElementById('targetCPA').value),
    bidAdjustmentLimit: parseFloat(document.getElementById('bidLimit').value),
    minimumConversions: parseInt(document.getElementById('minConversions').value)
  };
  
  try {
    await pluginSDK.setState('optimizationSettings', newSettings);
    pluginSDK.showNotification('success', 'Settings updated successfully');
    
    // Trigger optimization with new settings
    await pluginSDK.sendMessage('campaign-optimizer', 'run-optimization', {
      immediate: true,
      settings: newSettings
    });
  } catch (error) {
    pluginSDK.showNotification('error', 'Failed to update settings');
  }
});
```

## Background Plugin Examples

### Campaign Optimization Plugin

```typescript
class CampaignOptimizerPlugin {
  private sdk: MetricsHubSDK;
  private settings: OptimizationSettings;
  
  constructor(private pluginSDK: PluginSDK) {
    this.sdk = new MetricsHubSDK(pluginSDK.config);
  }
  
  async initialize() {
    // Load settings
    this.settings = await this.pluginSDK.getState('optimizationSettings') || {
      targetCPA: 50,
      bidAdjustmentLimit: 0.3,
      minimumConversions: 10
    };
    
    // Listen for optimization requests
    this.pluginSDK.onMessage('run-optimization', this.runOptimization.bind(this));
    
    // Schedule automatic optimization
    setInterval(() => this.runOptimization(), 6 * 60 * 60 * 1000); // Every 6 hours
  }
  
  async runOptimization(params?: { immediate?: boolean; settings?: any }) {
    try {
      if (params?.settings) {
        this.settings = params.settings;
        await this.pluginSDK.setState('optimizationSettings', this.settings);
      }
      
      const accounts = await this.sdk.ads.listAllAccounts();
      const results = [];
      
      for (const account of accounts.accounts) {
        if (account.manager) continue; // Skip manager accounts
        
        const campaigns = await this.sdk.ads.getCampaigns(account.id, {
          startDate: '30daysAgo',
          endDate: 'yesterday'
        });
        
        for (const campaign of campaigns.campaigns) {
          const optimized = await this.optimizeCampaign(account.id, campaign);
          if (optimized) {
            results.push(optimized);
          }
        }
      }
      
      // Store results
      await this.pluginSDK.setState('lastOptimization', {
        timestamp: new Date(),
        campaignsOptimized: results.length,
        improvements: results,
        settings: this.settings
      });
      
      // Notify other plugins
      await this.pluginSDK.broadcast('optimization-complete', {
        campaignsOptimized: results.length,
        totalImprovement: results.reduce((sum, r) => sum + r.improvementPercent, 0)
      });
      
    } catch (error) {
      console.error('Optimization failed:', error);
      
      await this.pluginSDK.sendMessage('alerting-plugin', 'error-alert', {
        plugin: 'campaign-optimizer',
        error: error.message,
        severity: 'high'
      });
    }
  }
  
  private async optimizeCampaign(customerId: string, campaign: any) {
    // Skip if insufficient data
    if (!campaign.metrics.conversions || campaign.metrics.conversions < this.settings.minimumConversions) {
      return null;
    }
    
    const currentCPA = campaign.metrics.cost / campaign.metrics.conversions;
    const targetCPA = this.settings.targetCPA;
    
    if (currentCPA <= targetCPA * 1.1) {
      return null; // Already performing well
    }
    
    // Calculate bid adjustment
    const adjustmentRatio = Math.min(
      targetCPA / currentCPA,
      1 - this.settings.bidAdjustmentLimit
    );
    
    const newBidAdjustment = campaign.bidModifier * adjustmentRatio;
    
    // Apply optimization
    try {
      await this.sdk.ads.updateCampaign(customerId, campaign.id, {
        bidModifier: newBidAdjustment
      });
      
      return {
        campaignId: campaign.id,
        campaignName: campaign.name,
        oldCPA: currentCPA,
        targetCPA: targetCPA,
        oldBidModifier: campaign.bidModifier,
        newBidModifier: newBidAdjustment,
        improvementPercent: ((currentCPA - targetCPA) / currentCPA) * 100
      };
    } catch (error) {
      console.error(`Failed to optimize campaign ${campaign.id}:`, error);
      return null;
    }
  }
}

// Initialize plugin
const optimizer = new CampaignOptimizerPlugin(pluginSDK);
optimizer.initialize();
```

### Data Sync Plugin

```typescript
class DataSyncPlugin {
  private syncInProgress = false;
  
  constructor(private pluginSDK: PluginSDK, private sdk: MetricsHubSDK) {}
  
  async initialize() {
    // Listen for sync triggers
    this.pluginSDK.onMessage('trigger-sync', this.syncData.bind(this));
    this.pluginSDK.onMessage('account-connected', this.syncNewAccount.bind(this));
    
    // Scheduled sync every hour
    setInterval(() => this.syncData(), 60 * 60 * 1000);
  }
  
  async syncData(options: { accounts?: string[], force?: boolean } = {}) {
    if (this.syncInProgress && !options.force) {
      return { status: 'already_running' };
    }
    
    this.syncInProgress = true;
    
    try {
      const accounts = options.accounts || await this.getAccountsToSync();
      const syncResults = [];
      
      for (const accountId of accounts) {
        const result = await this.syncAccount(accountId);
        syncResults.push(result);
        
        // Notify progress
        await this.pluginSDK.sendMessage('data-sync-ui', 'sync-progress', {
          accountId,
          completed: syncResults.length,
          total: accounts.length,
          result
        });
      }
      
      // Store sync history
      await this.pluginSDK.setState('lastSync', {
        timestamp: new Date(),
        accountsSynced: accounts.length,
        results: syncResults
      });
      
      return { status: 'completed', results: syncResults };
    } finally {
      this.syncInProgress = false;
    }
  }
  
  private async syncAccount(accountId: string) {
    const startTime = Date.now();
    
    try {
      // Sync campaigns
      const campaigns = await this.sdk.ads.getCampaigns(accountId);
      await this.sdk.tables.upsert('campaigns', campaigns.campaigns);
      
      // Sync ad groups
      const adGroups = await this.sdk.ads.getAdGroups(accountId);
      await this.sdk.tables.upsert('ad_groups', adGroups.adGroups);
      
      // Sync keywords
      const keywords = await this.sdk.ads.getKeywords(accountId);
      await this.sdk.tables.upsert('keywords', keywords.keywords);
      
      const duration = Date.now() - startTime;
      
      return {
        accountId,
        status: 'success',
        duration,
        recordsSynced: {
          campaigns: campaigns.campaigns.length,
          adGroups: adGroups.adGroups.length,
          keywords: keywords.keywords.length
        }
      };
    } catch (error) {
      return {
        accountId,
        status: 'error',
        error: error.message,
        duration: Date.now() - startTime
      };
    }
  }
  
  private async getAccountsToSync(): Promise<string[]> {
    const accounts = await this.sdk.ads.listAllAccounts();
    return accounts.accounts
      .filter(account => !account.manager)
      .map(account => account.id);
  }
}
```

## Scheduled Plugin Examples

### Automated Reporting Plugin

```typescript
class ReportingPlugin {
  constructor(private pluginSDK: PluginSDK, private sdk: MetricsHubSDK) {}
  
  async initialize() {
    // Listen for manual report requests
    this.pluginSDK.onMessage('generate-report', this.generateReport.bind(this));
    
    // Daily report generation (triggered by scheduler)
    this.pluginSDK.onMessage('scheduled-execution', async (data) => {
      if (data.schedule === 'daily-reports') {
        await this.generateDailyReports();
      }
    });
  }
  
  async generateDailyReports() {
    const accounts = await this.sdk.ads.listAllAccounts();
    const reports = [];
    
    for (const account of accounts.accounts) {
      if (account.manager) continue;
      
      const report = await this.generateAccountReport(account);
      reports.push(report);
      
      // Create and share spreadsheet
      await this.createSpreadsheetReport(account, report);
    }
    
    // Send summary email
    await this.sendSummaryEmail(reports);
  }
  
  private async generateAccountReport(account: any) {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const dateString = yesterday.toISOString().split('T')[0];
    
    const [campaigns, analytics] = await Promise.all([
      this.sdk.ads.getCampaigns(account.id, {
        startDate: dateString,
        endDate: dateString
      }),
      this.sdk.analytics.getReports({
        viewId: account.analyticsViewId,
        startDate: dateString,
        endDate: dateString
      }).catch(() => null) // Analytics may not be connected
    ]);
    
    const summary = {
      accountId: account.id,
      accountName: account.descriptiveName,
      date: dateString,
      campaigns: {
        total: campaigns.total,
        active: campaigns.campaigns.filter(c => c.status === 'ENABLED').length,
        totalSpend: campaigns.campaigns.reduce((sum, c) => sum + c.metrics.cost, 0),
        totalClicks: campaigns.campaigns.reduce((sum, c) => sum + c.metrics.clicks, 0),
        totalImpressions: campaigns.campaigns.reduce((sum, c) => sum + c.metrics.impressions, 0)
      },
      analytics: analytics ? {
        sessions: analytics.summary.totalSessions,
        users: analytics.summary.totalUsers,
        pageviews: analytics.summary.totalPageviews,
        conversions: analytics.summary.totalConversions
      } : null
    };
    
    return summary;
  }
  
  private async createSpreadsheetReport(account: any, report: any) {
    const spreadsheet = await this.sdk.sheets.createSpreadsheet(
      `Daily Report - ${account.descriptiveName} - ${report.date}`,
      [
        { title: 'Summary' },
        { title: 'Campaign Details' }
      ]
    );
    
    // Summary sheet
    await this.sdk.sheets.write({
      spreadsheetId: spreadsheet.spreadsheet.spreadsheetId,
      range: 'Summary!A1:B10',
      values: [
        ['Account', account.descriptiveName],
        ['Date', report.date],
        ['Total Campaigns', report.campaigns.total],
        ['Active Campaigns', report.campaigns.active],
        ['Total Spend', `$${(report.campaigns.totalSpend / 1000000).toFixed(2)}`],
        ['Total Clicks', report.campaigns.totalClicks],
        ['Total Impressions', report.campaigns.totalImpressions],
        ...(report.analytics ? [
          ['Sessions', report.analytics.sessions],
          ['Users', report.analytics.users],
          ['Conversions', report.analytics.conversions]
        ] : [])
      ]
    });
    
    // Share with stakeholders
    const stakeholders = await this.pluginSDK.getState('reportingStakeholders') || [];
    if (stakeholders.length > 0) {
      await this.sdk.sheets.shareSpreadsheet(
        spreadsheet.spreadsheet.spreadsheetId,
        stakeholders,
        'reader'
      );
    }
    
    return spreadsheet;
  }
}
```

## Plugin Deployment

### Environment Configuration

```typescript
// plugin.config.js
module.exports = {
  development: {
    companyId: 'dev-company-123',
    apiBaseUrl: 'https://dev-metricshub.vercel.app',
    debug: true,
    logLevel: 'debug'
  },
  
  staging: {
    companyId: process.env.STAGING_COMPANY_ID,
    apiBaseUrl: 'https://staging-metricshub.vercel.app',
    debug: false,
    logLevel: 'info'
  },
  
  production: {
    companyId: process.env.COMPANY_ID,
    apiBaseUrl: process.env.METRICSHUB_API_URL,
    debug: false,
    logLevel: 'warn'
  }
};

// Load configuration
const env = process.env.NODE_ENV || 'development';
const config = require('./plugin.config.js')[env];
```

### Build and Package

```bash
# package.json
{
  "name": "campaign-optimizer-plugin",
  "version": "1.2.0",
  "main": "dist/index.js",
  "scripts": {
    "build": "tsc && npm run bundle",
    "bundle": "webpack --mode production",
    "deploy:staging": "npm run build && metricshub-cli deploy --env staging",
    "deploy:prod": "npm run build && metricshub-cli deploy --env production"
  },
  "dependencies": {
    "@metrics-hub/sdk": "^1.0.0"
  }
}

# Build
npm run build

# Deploy
metricshub-cli deploy --plugin campaign-optimizer --env production
```

### Testing

```typescript
// tests/plugin.test.ts
import { TestingSDK, TestUtils } from '@metrics-hub/sdk';
import { CampaignOptimizerPlugin } from '../src/plugin';

describe('Campaign Optimizer Plugin', () => {
  let testSDK: TestingSDK;
  let plugin: CampaignOptimizerPlugin;
  
  beforeEach(async () => {
    testSDK = TestUtils.createTestSDK();
    testSDK.enableTestMode();
    
    plugin = new CampaignOptimizerPlugin(testSDK);
    await plugin.initialize();
  });
  
  it('should optimize high CPA campaigns', async () => {
    // Generate mock campaigns with high CPA
    const mockCampaigns = testSDK.generateMockCampaigns('123456789', {
      count: 5,
      overrides: [
        { metrics: { cost: 50000, conversions: 10 } }, // CPA = $5
        { metrics: { cost: 100000, conversions: 10 } }, // CPA = $10 (should optimize)
        { metrics: { cost: 150000, conversions: 10 } }  // CPA = $15 (should optimize)
      ]
    });
    
    testSDK.mockConnection('google-ads', {
      campaigns: mockCampaigns
    });
    
    // Run optimization
    const result = await plugin.runOptimization();
    
    expect(result.campaignsOptimized).toBe(2); // Only high CPA campaigns
    expect(result.improvements.length).toBe(2);
  });
  
  it('should handle API errors gracefully', async () => {
    testSDK.simulateError('rate_limit', 1.0);
    
    const result = await plugin.runOptimization();
    
    expect(result.status).toBe('error');
    expect(result.error).toContain('Rate limit');
  });
});
```

This comprehensive plugin development guide provides everything needed to create powerful MetricsHub SDK plugins that extend functionality with custom applications, automation, and integrations.