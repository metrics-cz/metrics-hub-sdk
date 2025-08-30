# Testing & Development Utilities Guide

## Overview

The MetricsHub SDK provides comprehensive testing utilities to help you develop robust applications with confidence. The testing framework includes mock data generation, API simulation, performance monitoring, and integration testing tools.

## Testing SDK Setup

### Basic Configuration

```typescript
import { TestingSDK, TestUtils } from '@metrics-hub/sdk';

describe('Google Ads Integration', () => {
  let testSDK: TestingSDK;
  
  beforeEach(() => {
    testSDK = TestUtils.createTestSDK();
    testSDK.enableTestMode();
  });
  
  afterEach(() => {
    testSDK.cleanup();
  });
});
```

### Advanced Configuration

```typescript
const testSDK = TestUtils.createTestSDK({
  companyId: 'test-company-123',
  apiBaseUrl: 'https://test-api.metricshub.dev',
  
  // Test-specific settings
  mockDelay: 100, // Simulate API latency
  enableErrorSimulation: true,
  logLevel: 'debug',
  
  // Mock data configuration
  mockData: {
    realistic: true, // Generate realistic test data
    seed: 12345, // Consistent data across test runs
    dateRange: {
      start: '2024-01-01',
      end: '2024-12-31'
    }
  }
});
```

## Mock Data Generation

### Google Ads Mock Data

```typescript
// Generate mock Google Ads accounts
const mockAccounts = testSDK.generateMockAccounts({
  count: 5,
  realistic: true,
  includeHierarchy: true
});

// Generate specific account structure
const mockAccount = testSDK.generateMockAccount({
  id: '123456789',
  descriptiveName: 'Test Account',
  currencyCode: 'USD',
  manager: false,
  status: 'ENABLED'
});

// Generate campaigns with custom properties
const mockCampaigns = testSDK.generateMockCampaigns('123456789', {
  count: 10,
  realistic: true,
  
  // Override specific campaigns
  overrides: [
    { 
      name: 'High Performance Campaign',
      metrics: { clicks: 1000, impressions: 10000, cost: 5000000 }
    },
    { 
      name: 'Low Performance Campaign',
      metrics: { clicks: 50, impressions: 2000, cost: 2000000 }
    }
  ],
  
  // Template for all campaigns
  template: {
    status: 'ENABLED',
    campaignType: 'SEARCH'
  }
});

// Generate ad groups
const mockAdGroups = testSDK.generateMockAdGroups('123456789', 'campaign-1', {
  count: 5,
  realistic: true
});

// Generate keywords
const mockKeywords = testSDK.generateMockKeywords('123456789', 'adgroup-1', {
  count: 20,
  keywordTypes: ['BROAD_MATCH', 'EXACT_MATCH', 'PHRASE_MATCH'],
  realistic: true
});
```

### Google Analytics Mock Data

```typescript
// Generate Analytics accounts
const mockAnalyticsAccounts = testSDK.generateMockAnalyticsAccounts({
  count: 3,
  realistic: true
});

// Generate properties
const mockProperties = testSDK.generateMockAnalyticsProperties('account-1', {
  count: 2,
  realistic: true
});

// Generate reports with custom metrics
const mockReports = testSDK.generateMockAnalyticsReports({
  dateRange: { start: '30daysAgo', end: 'yesterday' },
  metrics: ['sessions', 'users', 'pageviews', 'conversions'],
  realistic: true,
  
  // Custom data patterns
  patterns: {
    weeklySeasonality: true,
    dailySeasonality: true,
    growthTrend: 0.05 // 5% month-over-month growth
  }
});
```

### Google Sheets Mock Data

```typescript
// Generate mock spreadsheet
const mockSpreadsheet = testSDK.generateMockSpreadsheet({
  title: 'Campaign Performance Report',
  sheets: [
    { title: 'Summary', rowCount: 100, columnCount: 10 },
    { title: 'Details', rowCount: 1000, columnCount: 15 }
  ]
});

// Generate cell data
const mockCellData = testSDK.generateMockCellData('A1:E100', {
  headers: ['Campaign', 'Clicks', 'Impressions', 'Cost', 'CTR'],
  dataTypes: ['string', 'number', 'number', 'currency', 'percentage'],
  realistic: true
});
```

## API Mocking

### Basic API Mocking

```typescript
// Mock Google Ads API responses
testSDK.mockConnection('google-ads', {
  accounts: mockAccounts,
  campaigns: mockCampaigns,
  adGroups: mockAdGroups,
  keywords: mockKeywords
});

// Mock specific endpoints
testSDK.mockEndpoint('GET', '/google-ads/customers', {
  response: mockAccounts,
  delay: 100
});

testSDK.mockEndpoint('POST', '/google-ads/campaigns', {
  response: { success: true, campaignId: 'new-campaign-123' },
  statusCode: 201
});
```

### Advanced Mocking Scenarios

```typescript
// Mock different response based on request
testSDK.mockEndpoint('GET', '/google-ads/campaigns/:customerId', (req) => {
  const customerId = req.params.customerId;
  
  if (customerId === '123456789') {
    return {
      response: mockCampaigns,
      delay: 50
    };
  } else {
    return {
      response: { error: 'Customer not found' },
      statusCode: 404
    };
  }
});

// Mock with sequential responses
testSDK.mockEndpointSequence('GET', '/google-ads/accounts', [
  { response: { accounts: [] }, delay: 100 },
  { response: { accounts: mockAccounts.slice(0, 2) }, delay: 150 },
  { response: { accounts: mockAccounts }, delay: 200 }
]);

// Mock connection states
testSDK.mockConnectionState('google-ads', 'connected');
testSDK.mockConnectionState('google-analytics', 'expired');
testSDK.mockConnectionState('google-sheets', 'disconnected');
```

### Error Simulation

```typescript
// Simulate specific error rates
testSDK.simulateError('rate_limit', 0.1); // 10% of requests
testSDK.simulateError('network_timeout', 0.05); // 5% of requests
testSDK.simulateError('auth_expired', 0.02); // 2% of requests

// Simulate errors for specific operations
testSDK.simulateErrorForEndpoint('GET', '/google-ads/campaigns', {
  errorType: 'quota_exceeded',
  probability: 0.3,
  errorResponse: {
    error: {
      code: 'QUOTA_EXCEEDED',
      message: 'API quota exceeded for today'
    }
  }
});

// Simulate intermittent failures
testSDK.simulateIntermittentFailure('google-ads', {
  failurePattern: [false, false, true, false], // Fail every 3rd request
  errorType: 'server_error'
});
```

## Unit Testing Examples

### Testing Google Ads Operations

```typescript
import { MetricsHubSDK } from '@metrics-hub/sdk';
import { TestingSDK, TestUtils } from '@metrics-hub/sdk';

describe('Google Ads Campaign Management', () => {
  let sdk: MetricsHubSDK;
  let testSDK: TestingSDK;
  
  beforeEach(() => {
    testSDK = TestUtils.createTestSDK();
    testSDK.enableTestMode();
    
    sdk = new MetricsHubSDK(testSDK.config);
    
    // Mock successful connection
    testSDK.mockConnectionState('google-ads', 'connected');
  });
  
  describe('listAllAccounts', () => {
    it('should return all accessible accounts', async () => {
      const mockAccounts = testSDK.generateMockAccounts({ count: 5 });
      testSDK.mockConnection('google-ads', { accounts: mockAccounts });
      
      const result = await sdk.ads.listAllAccounts();
      
      expect(result.total).toBe(5);
      expect(result.accounts).toHaveLength(5);
      expect(result.accounts[0]).toHaveProperty('id');
      expect(result.accounts[0]).toHaveProperty('descriptiveName');
    });
    
    it('should handle manager account hierarchies', async () => {
      const mockHierarchy = testSDK.generateMockAccountHierarchy({
        managerAccount: { id: '111111111', descriptiveName: 'Manager Account' },
        childAccounts: 3
      });
      
      testSDK.mockConnection('google-ads', { hierarchy: mockHierarchy });
      
      const result = await sdk.ads.getAccountHierarchy('111111111');
      
      expect(result.hierarchy.managerAccount.id).toBe('111111111');
      expect(result.hierarchy.childAccounts).toHaveLength(3);
    });
    
    it('should handle connection errors', async () => {
      testSDK.mockConnectionState('google-ads', 'expired');
      
      await expect(sdk.ads.listAllAccounts())
        .rejects
        .toThrow('Connection expired');
    });
    
    it('should handle API rate limits', async () => {
      testSDK.simulateError('rate_limit', 1.0);
      
      await expect(sdk.ads.listAllAccounts())
        .rejects
        .toThrow('Rate limit exceeded');
    });
  });
  
  describe('getCampaigns', () => {
    it('should return campaigns for customer', async () => {
      const mockCampaigns = testSDK.generateMockCampaigns('123456789', {
        count: 10,
        realistic: true
      });
      
      testSDK.mockConnection('google-ads', { campaigns: mockCampaigns });
      
      const result = await sdk.ads.getCampaigns('123456789');
      
      expect(result.total).toBe(10);
      expect(result.campaigns).toHaveLength(10);
      expect(result.campaigns[0]).toHaveProperty('metrics');
    });
    
    it('should handle date range filtering', async () => {
      const mockCampaigns = testSDK.generateMockCampaigns('123456789', {
        count: 5,
        dateRange: { start: '2024-01-01', end: '2024-01-31' }
      });
      
      testSDK.mockEndpoint('GET', '/google-ads/campaigns/123456789', (req) => {
        expect(req.query.startDate).toBe('2024-01-01');
        expect(req.query.endDate).toBe('2024-01-31');
        
        return { response: mockCampaigns };
      });
      
      await sdk.ads.getCampaigns('123456789', {
        startDate: '2024-01-01',
        endDate: '2024-01-31'
      });
    });
  });
});
```

### Testing Error Handling

```typescript
describe('Error Handling', () => {
  let sdk: MetricsHubSDK;
  let testSDK: TestingSDK;
  
  beforeEach(() => {
    testSDK = TestUtils.createTestSDK();
    sdk = new MetricsHubSDK(testSDK.config);
  });
  
  it('should handle Google Ads API errors', async () => {
    testSDK.simulateErrorForEndpoint('GET', '/google-ads/campaigns', {
      errorType: 'google_ads_error',
      errorResponse: {
        errors: [{
          errorCode: 'INVALID_CUSTOMER_ID',
          message: 'Customer ID is invalid'
        }]
      }
    });
    
    await expect(sdk.ads.getCampaigns('invalid-id'))
      .rejects
      .toThrow('Customer ID is invalid');
  });
  
  it('should retry on transient errors', async () => {
    let attempts = 0;
    
    testSDK.mockEndpoint('GET', '/google-ads/campaigns', () => {
      attempts++;
      
      if (attempts < 3) {
        return {
          statusCode: 500,
          response: { error: 'Server error' }
        };
      }
      
      return {
        response: testSDK.generateMockCampaigns('123', { count: 1 })
      };
    });
    
    const result = await sdk.ads.getCampaigns('123');
    
    expect(attempts).toBe(3);
    expect(result.campaigns).toHaveLength(1);
  });
  
  it('should handle validation errors', async () => {
    testSDK.simulateErrorForEndpoint('POST', '/google-ads/campaigns', {
      errorType: 'validation_error',
      errorResponse: {
        errors: [{
          field: 'campaign.name',
          message: 'Campaign name is required'
        }]
      }
    });
    
    await expect(sdk.ads.createCampaign('123', {}))
      .rejects
      .toThrow('Campaign name is required');
  });
});
```

### Testing Plugin Development

```typescript
import { PluginSDK } from '@metrics-hub/sdk';

describe('Campaign Optimizer Plugin', () => {
  let pluginSDK: PluginSDK;
  let testSDK: TestingSDK;
  
  beforeEach(async () => {
    testSDK = TestUtils.createTestSDK();
    
    pluginSDK = new PluginSDK(testSDK.config, {
      id: 'test-plugin',
      name: 'Test Plugin',
      version: '1.0.0'
    });
    
    await pluginSDK.initialize();
  });
  
  it('should store and retrieve plugin state', async () => {
    const settings = {
      targetCPA: 50,
      bidAdjustmentLimit: 0.3
    };
    
    await pluginSDK.setState('optimizationSettings', settings);
    const retrieved = await pluginSDK.getState('optimizationSettings');
    
    expect(retrieved).toEqual(settings);
  });
  
  it('should handle inter-plugin messaging', async () => {
    let receivedMessage: any;
    
    pluginSDK.onMessage('test-message', (data) => {
      receivedMessage = data;
    });
    
    await pluginSDK.sendMessage('test-plugin', 'test-message', {
      test: 'data'
    });
    
    // Allow message to be processed
    await TestUtils.wait(10);
    
    expect(receivedMessage).toEqual({ test: 'data' });
  });
  
  it('should validate plugin permissions', async () => {
    // Test without permissions
    const restrictedSDK = new PluginSDK(testSDK.config, {
      id: 'restricted-plugin',
      name: 'Restricted Plugin',
      version: '1.0.0',
      permissions: [] // No permissions
    });
    
    await expect(restrictedSDK.sendMessage('other-plugin', 'test', {}))
      .rejects
      .toThrow('Permission denied');
  });
});
```

## Performance Testing

### Measuring Operation Performance

```typescript
describe('Performance Tests', () => {
  let sdk: MetricsHubSDK;
  let testSDK: TestingSDK;
  
  beforeEach(() => {
    testSDK = TestUtils.createTestSDK();
    sdk = new MetricsHubSDK(testSDK.config);
  });
  
  it('should fetch campaigns within performance threshold', async () => {
    const mockCampaigns = testSDK.generateMockCampaigns('123', { count: 1000 });
    testSDK.mockConnection('google-ads', { 
      campaigns: mockCampaigns,
      delay: 500 // Simulate realistic API delay
    });
    
    const result = await testSDK.measurePerformance(
      () => sdk.ads.getCampaigns('123'),
      'getCampaigns'
    );
    
    expect(result.duration).toBeLessThan(1000); // Should complete within 1 second
    expect(result.result.campaigns).toHaveLength(1000);
  });
  
  it('should handle concurrent requests efficiently', async () => {
    const mockAccounts = testSDK.generateMockAccounts({ count: 10 });
    testSDK.mockConnection('google-ads', { accounts: mockAccounts });
    
    const startTime = Date.now();
    
    const promises = Array(10).fill(0).map(() => 
      sdk.ads.listAllAccounts()
    );
    
    const results = await Promise.all(promises);
    const duration = Date.now() - startTime;
    
    expect(results).toHaveLength(10);
    expect(duration).toBeLessThan(2000); // Should handle concurrency well
  });
  
  it('should maintain performance under load', async () => {
    const mockCampaigns = testSDK.generateMockCampaigns('123', { count: 100 });
    testSDK.mockConnection('google-ads', { campaigns: mockCampaigns });
    
    const iterations = 50;
    const results: number[] = [];
    
    for (let i = 0; i < iterations; i++) {
      const start = Date.now();
      await sdk.ads.getCampaigns('123');
      results.push(Date.now() - start);
    }
    
    const avgDuration = results.reduce((a, b) => a + b, 0) / results.length;
    const maxDuration = Math.max(...results);
    
    expect(avgDuration).toBeLessThan(200);
    expect(maxDuration).toBeLessThan(500);
  });
});
```

### Memory and Resource Testing

```typescript
it('should not leak memory with repeated operations', async () => {
  const initialMemory = process.memoryUsage().heapUsed;
  
  // Perform many operations
  for (let i = 0; i < 1000; i++) {
    const mockData = testSDK.generateMockCampaigns(`customer-${i}`, { count: 10 });
    testSDK.mockConnection('google-ads', { campaigns: mockData });
    
    await sdk.ads.getCampaigns(`customer-${i}`);
    
    // Clear mock data to prevent accumulation
    testSDK.clearMockData();
  }
  
  // Force garbage collection if available
  if (global.gc) {
    global.gc();
  }
  
  const finalMemory = process.memoryUsage().heapUsed;
  const memoryIncrease = finalMemory - initialMemory;
  
  // Memory increase should be reasonable (less than 50MB)
  expect(memoryIncrease).toBeLessThan(50 * 1024 * 1024);
});
```

## Integration Testing

### Full Workflow Testing

```typescript
describe('Campaign Optimization Workflow', () => {
  let sdk: MetricsHubSDK;
  let testSDK: TestingSDK;
  
  beforeEach(() => {
    testSDK = TestUtils.createTestSDK();
    sdk = new MetricsHubSDK(testSDK.config);
    
    // Setup realistic test environment
    testSDK.mockConnectionState('google-ads', 'connected');
    testSDK.mockConnectionState('google-sheets', 'connected');
  });
  
  it('should complete end-to-end optimization workflow', async () => {
    // Step 1: Get accounts
    const mockAccounts = testSDK.generateMockAccounts({ count: 2 });
    testSDK.mockConnection('google-ads', { accounts: mockAccounts });
    
    const accounts = await sdk.ads.listAllAccounts();
    expect(accounts.total).toBe(2);
    
    // Step 2: Get campaigns for each account
    const allCampaigns: any[] = [];
    for (const account of accounts.accounts) {
      const mockCampaigns = testSDK.generateMockCampaigns(account.id, {
        count: 5,
        realistic: true,
        overrides: [
          { metrics: { cost: 100000, conversions: 5 } }, // High CPA campaign
        ]
      });
      
      testSDK.mockEndpoint('GET', `/google-ads/campaigns/${account.id}`, {
        response: mockCampaigns
      });
      
      const campaigns = await sdk.ads.getCampaigns(account.id);
      allCampaigns.push(...campaigns.campaigns);
    }
    
    expect(allCampaigns.length).toBe(10); // 2 accounts × 5 campaigns
    
    // Step 3: Optimize high CPA campaigns
    const optimizations = [];
    for (const campaign of allCampaigns) {
      const cpa = campaign.metrics.cost / Math.max(campaign.metrics.conversions, 1);
      
      if (cpa > 5000) { // CPA > $50
        // Mock optimization API call
        testSDK.mockEndpoint('PUT', `/google-ads/campaigns/${campaign.id}`, {
          response: { success: true }
        });
        
        const optimized = await sdk.ads.updateCampaign(
          campaign.customerId,
          campaign.id,
          { bidModifier: campaign.bidModifier * 0.8 }
        );
        
        optimizations.push({
          campaignId: campaign.id,
          oldCPA: cpa,
          newBidModifier: campaign.bidModifier * 0.8
        });
      }
    }
    
    expect(optimizations.length).toBeGreaterThan(0);
    
    // Step 4: Create optimization report
    const mockSpreadsheet = testSDK.generateMockSpreadsheet({
      title: 'Optimization Report'
    });
    
    testSDK.mockEndpoint('POST', '/google-sheets/spreadsheets', {
      response: mockSpreadsheet
    });
    
    const reportData = optimizations.map(opt => [
      opt.campaignId,
      `$${(opt.oldCPA / 1000000).toFixed(2)}`,
      opt.newBidModifier
    ]);
    
    const report = await sdk.sheets.createSpreadsheet('Optimization Report', [
      { title: 'Optimizations' }
    ]);
    
    testSDK.mockEndpoint('PUT', `/google-sheets/spreadsheets/${report.spreadsheet.spreadsheetId}/values`, {
      response: { updatedRows: reportData.length }
    });
    
    await sdk.sheets.write({
      spreadsheetId: report.spreadsheet.spreadsheetId,
      range: 'Optimizations!A1:C100',
      values: [
        ['Campaign ID', 'Old CPA', 'New Bid Modifier'],
        ...reportData
      ],
      operation: 'update'
    });
    
    // Verify complete workflow
    expect(report).toBeDefined();
    expect(optimizations.length).toBeGreaterThan(0);
  });
});
```

### Testing with Real-World Scenarios

```typescript
describe('Real-World Scenarios', () => {
  it('should handle mixed success/failure responses', async () => {
    const testSDK = TestUtils.createTestSDK();
    const sdk = new MetricsHubSDK(testSDK.config);
    
    const accounts = ['123', '456', '789'];
    const results: any[] = [];
    
    // Configure mixed responses
    testSDK.mockEndpoint('GET', '/google-ads/campaigns/123', {
      response: testSDK.generateMockCampaigns('123', { count: 5 })
    });
    
    testSDK.mockEndpoint('GET', '/google-ads/campaigns/456', {
      statusCode: 403,
      response: { error: 'Insufficient permissions' }
    });
    
    testSDK.mockEndpoint('GET', '/google-ads/campaigns/789', {
      statusCode: 500,
      response: { error: 'Server error' }
    });
    
    // Process all accounts with error handling
    for (const accountId of accounts) {
      try {
        const campaigns = await sdk.ads.getCampaigns(accountId);
        results.push({ accountId, status: 'success', campaigns: campaigns.campaigns });
      } catch (error) {
        results.push({ accountId, status: 'error', error: error.message });
      }
    }
    
    expect(results).toHaveLength(3);
    expect(results[0].status).toBe('success');
    expect(results[1].status).toBe('error');
    expect(results[2].status).toBe('error');
  });
});
```

## Test Utilities

### Custom Test Helpers

```typescript
// test-helpers.ts
import { TestingSDK, TestUtils } from '@metrics-hub/sdk';

export class CustomTestHelpers {
  static async waitForCondition(
    condition: () => boolean | Promise<boolean>,
    timeout: number = 5000,
    interval: number = 100
  ): Promise<void> {
    const start = Date.now();
    
    while (Date.now() - start < timeout) {
      if (await condition()) {
        return;
      }
      await TestUtils.wait(interval);
    }
    
    throw new Error(`Condition not met within ${timeout}ms`);
  }
  
  static createRealisticCampaignScenario(testSDK: TestingSDK) {
    return testSDK.generateMockCampaigns('123456789', {
      count: 20,
      realistic: true,
      overrides: [
        // High performers
        { 
          name: 'Brand Campaign',
          metrics: { clicks: 1000, impressions: 5000, cost: 2000000, conversions: 50 }
        },
        { 
          name: 'Competitor Campaign',
          metrics: { clicks: 800, impressions: 8000, cost: 4000000, conversions: 25 }
        },
        
        // Poor performers
        { 
          name: 'Broad Keywords',
          metrics: { clicks: 100, impressions: 10000, cost: 5000000, conversions: 2 }
        },
        { 
          name: 'Display Campaign',
          metrics: { clicks: 50, impressions: 50000, cost: 1000000, conversions: 1 }
        }
      ]
    });
  }
  
  static mockOptimizationScenario(testSDK: TestingSDK) {
    // Mock successful optimization APIs
    testSDK.mockEndpoint('PUT', /\/google-ads\/campaigns\/.*/, {
      response: { success: true, updated: true }
    });
    
    // Mock report creation
    testSDK.mockEndpoint('POST', '/google-sheets/spreadsheets', {
      response: {
        spreadsheet: {
          spreadsheetId: 'test-spreadsheet-123',
          spreadsheetUrl: 'https://sheets.google.com/test'
        }
      }
    });
  }
}

// Usage in tests
it('should optimize campaigns in realistic scenario', async () => {
  const testSDK = TestUtils.createTestSDK();
  const campaigns = CustomTestHelpers.createRealisticCampaignScenario(testSDK);
  
  CustomTestHelpers.mockOptimizationScenario(testSDK);
  
  // Run your optimization logic
  const results = await optimizeCampaigns(campaigns);
  
  // Verify realistic optimizations
  expect(results.optimized.length).toBeGreaterThan(0);
});
```

This comprehensive testing guide provides all the tools and patterns needed to thoroughly test MetricsHub SDK applications with confidence and reliability.