# Google Ads Integration Guide

## Overview

The enhanced MetricsHub SDK provides comprehensive Google Ads account management capabilities that were previously missing. This guide covers all the new features for managing Google Ads accounts, hierarchies, and campaigns.

## Table of Contents

1. [Account Discovery](#account-discovery)
2. [Account Management](#account-management)
3. [Hierarchy Management](#hierarchy-management)
4. [Campaign Operations](#campaign-operations)
5. [Error Handling](#error-handling)
6. [Best Practices](#best-practices)
7. [Common Patterns](#common-patterns)
8. [Troubleshooting](#troubleshooting)

---

## Account Discovery

### Get All Accessible Customer IDs

The most basic operation - get all customer IDs your authentication has access to:

```typescript
async function getAccessibleCustomers() {
  try {
    const result = await sdk.ads.getAccessibleCustomers();
    
    console.log(`Found ${result.total} accessible customers:`);
    result.customers.forEach(customerId => {
      console.log(`- Customer ID: ${customerId}`);
    });
    
    return result.customers;
  } catch (error) {
    console.error('Failed to get accessible customers:', error);
    return [];
  }
}
```

**Response Format:**
```typescript
{
  success: boolean;
  customers: string[];  // Array of customer IDs
  total: number;
}
```

### List All Accounts with Details

Get comprehensive information about all accessible accounts:

```typescript
async function listAllAccountsWithDetails() {
  try {
    const result = await sdk.ads.listAllAccounts();
    
    console.log(`Found ${result.total} accounts:`);
    
    result.accounts.forEach(account => {
      console.log(`\n📊 ${account.descriptiveName}`);
      console.log(`   ID: ${account.id}`);
      console.log(`   Status: ${account.status}`);
      console.log(`   Manager Account: ${account.manager ? 'Yes' : 'No'}`);
      console.log(`   Test Account: ${account.testAccount ? 'Yes' : 'No'}`);
      console.log(`   Currency: ${account.currencyCode}`);
      console.log(`   Time Zone: ${account.timeZone}`);
      
      if (account.conversionTrackingId) {
        console.log(`   Conversion Tracking ID: ${account.conversionTrackingId}`);
      }
    });
    
    // Handle hierarchies if present
    if (result.hierarchies && result.hierarchies.length > 0) {
      console.log('\n🏢 Account Hierarchies:');
      result.hierarchies.forEach((hierarchy, index) => {
        console.log(`\n${index + 1}. Manager: ${hierarchy.managerAccount.descriptiveName}`);
        console.log(`   Child Accounts: ${hierarchy.childAccounts.length}`);
        hierarchy.childAccounts.forEach(child => {
          console.log(`   - ${child.descriptiveName} (${child.id})`);
        });
      });
    }
    
    return result;
  } catch (error) {
    console.error('Failed to list accounts:', error);
    throw error;
  }
}
```

**Response Format:**
```typescript
{
  success: boolean;
  accounts: GoogleAdsAccount[];
  total: number;
  hierarchies?: AccountHierarchy[];
}
```

---

## Account Management

### Get Detailed Account Information

Get comprehensive details for a specific account:

```typescript
async function getAccountDetails(customerId: string) {
  try {
    const result = await sdk.ads.getAccountDetails(customerId);
    
    const account = result.account;
    console.log(`\n📋 Account Details for ${account.descriptiveName}:`);
    console.log(`   Customer ID: ${account.id}`);
    console.log(`   Resource Name: ${account.resourceName}`);
    console.log(`   Status: ${account.status}`);
    console.log(`   Type: ${account.manager ? 'Manager (MCC)' : 'Standard'}`);
    console.log(`   Test Account: ${account.testAccount ? 'Yes' : 'No'}`);
    console.log(`   Currency: ${account.currencyCode}`);
    console.log(`   Time Zone: ${account.timeZone}`);
    
    if (account.conversionTrackingId) {
      console.log(`   Conversion Tracking: ${account.conversionTrackingId}`);
    }
    
    return account;
  } catch (error) {
    console.error(`Failed to get details for customer ${customerId}:`, error);
    throw error;
  }
}
```

**Response Format:**
```typescript
{
  success: boolean;
  account: GoogleAdsAccount;
}
```

### Filter Accounts by Type

Separate manager accounts from standard accounts:

```typescript
async function categorizeAccounts() {
  try {
    const result = await sdk.ads.listAllAccounts();
    
    const managerAccounts = result.accounts.filter(account => account.manager);
    const standardAccounts = result.accounts.filter(account => !account.manager);
    
    console.log(`\n👨‍💼 Manager Accounts (${managerAccounts.length}):`);
    managerAccounts.forEach(account => {
      console.log(`   - ${account.descriptiveName} (${account.id})`);
    });
    
    console.log(`\n🏢 Standard Accounts (${standardAccounts.length}):`);
    standardAccounts.forEach(account => {
      console.log(`   - ${account.descriptiveName} (${account.id})`);
    });
    
    return {
      managers: managerAccounts,
      standard: standardAccounts
    };
  } catch (error) {
    console.error('Failed to categorize accounts:', error);
    throw error;
  }
}
```

---

## Hierarchy Management

### Get Complete Account Hierarchy

Understand the relationship between manager and child accounts:

```typescript
async function getCompleteHierarchy(managerId?: string) {
  try {
    const result = await sdk.ads.getAccountHierarchy(managerId);
    
    const hierarchy = result.hierarchy;
    
    console.log(`\n🏗️ Account Hierarchy:`);
    console.log(`Manager: ${hierarchy.managerAccount.descriptiveName}`);
    console.log(`└─ ID: ${hierarchy.managerAccount.id}`);
    console.log(`└─ Status: ${hierarchy.managerAccount.status}`);
    console.log(`└─ Currency: ${hierarchy.managerAccount.currencyCode}`);
    console.log(`└─ Child Accounts: ${hierarchy.childAccounts.length}`);
    
    hierarchy.childAccounts.forEach((child, index) => {
      const isLast = index === hierarchy.childAccounts.length - 1;
      const connector = isLast ? '└──' : '├──';
      
      console.log(`   ${connector} ${child.descriptiveName}`);
      console.log(`   ${isLast ? '    ' : '│   '}└─ ID: ${child.id}`);
      console.log(`   ${isLast ? '    ' : '│   '}└─ Status: ${child.status}`);
      console.log(`   ${isLast ? '    ' : '│   '}└─ Currency: ${child.currencyCode}`);
    });
    
    return hierarchy;
  } catch (error) {
    console.error('Failed to get account hierarchy:', error);
    throw error;
  }
}
```

### Get All MCC (Manager) Accounts

Find all Manager Customer Center accounts:

```typescript
async function getAllMCCAccounts() {
  try {
    const result = await sdk.ads.getMCCAccounts();
    
    console.log(`\n👑 MCC Accounts (${result.total}):`);
    
    result.accounts.forEach(mcc => {
      console.log(`\n${mcc.descriptiveName}`);
      console.log(`   ID: ${mcc.id}`);
      console.log(`   Status: ${mcc.status}`);
      console.log(`   Currency: ${mcc.currencyCode}`);
      console.log(`   Time Zone: ${mcc.timeZone}`);
    });
    
    return result.accounts;
  } catch (error) {
    console.error('Failed to get MCC accounts:', error);
    throw error;
  }
}
```

### Get Child Accounts for MCC

Get all accounts managed by a specific MCC:

```typescript
async function getChildAccountsForMCC(mccId: string) {
  try {
    const result = await sdk.ads.getChildAccounts(mccId);
    
    console.log(`\n👶 Child Accounts for MCC ${mccId} (${result.total}):`);
    
    result.accounts.forEach((child, index) => {
      console.log(`\n${index + 1}. ${child.descriptiveName}`);
      console.log(`   ID: ${child.id}`);
      console.log(`   Status: ${child.status}`);
      console.log(`   Currency: ${child.currencyCode}`);
      console.log(`   Test Account: ${child.testAccount ? 'Yes' : 'No'}`);
    });
    
    return result.accounts;
  } catch (error) {
    console.error(`Failed to get child accounts for MCC ${mccId}:`, error);
    throw error;
  }
}
```

---

## Campaign Operations

### Enhanced Campaign Retrieval

Get campaigns with enhanced metadata:

```typescript
async function getCampaignsWithDetails(customerId: string) {
  try {
    const result = await sdk.ads.getCampaigns(customerId);
    
    console.log(`\n📈 Campaigns for Customer ${customerId} (${result.total}):`);
    
    if (result.accountInfo) {
      console.log(`Account: ${result.accountInfo.accountName}`);
    }
    
    let totalSpend = 0;
    let totalClicks = 0;
    let totalImpressions = 0;
    
    result.campaigns.forEach((campaign, index) => {
      console.log(`\n${index + 1}. ${campaign.name}`);
      console.log(`   ID: ${campaign.id}`);
      console.log(`   Status: ${campaign.status}`);
      console.log(`   Type: ${campaign.type}`);
      
      if (campaign.startDate) {
        console.log(`   Start Date: ${campaign.startDate}`);
      }
      
      if (campaign.endDate) {
        console.log(`   End Date: ${campaign.endDate}`);
      }
      
      if (campaign.biddingStrategy) {
        console.log(`   Bidding: ${campaign.biddingStrategy}`);
      }
      
      if (campaign.budget) {
        const budgetAmount = campaign.budget.amountMicros / 1000000;
        console.log(`   Budget: $${budgetAmount.toFixed(2)} (${campaign.budget.deliveryMethod})`);
      }
      
      // Metrics
      const metrics = campaign.metrics;
      console.log(`   Performance:`);
      console.log(`     - Impressions: ${metrics.impressions.toLocaleString()}`);
      console.log(`     - Clicks: ${metrics.clicks.toLocaleString()}`);
      console.log(`     - Cost: $${(metrics.cost / 1000000).toFixed(2)}`);
      console.log(`     - Conversions: ${metrics.conversions}`);
      
      if (metrics.ctr) {
        console.log(`     - CTR: ${metrics.ctr.toFixed(2)}%`);
      }
      
      if (metrics.averageCpc) {
        console.log(`     - Avg CPC: $${(metrics.averageCpc / 1000000).toFixed(2)}`);
      }
      
      if (metrics.costPerConversion) {
        console.log(`     - Cost/Conv: $${(metrics.costPerConversion / 1000000).toFixed(2)}`);
      }
      
      // Accumulate totals
      totalSpend += metrics.cost;
      totalClicks += metrics.clicks;
      totalImpressions += metrics.impressions;
    });
    
    // Summary
    console.log(`\n📊 Summary:`);
    console.log(`   Total Campaigns: ${result.total}`);
    console.log(`   Total Spend: $${(totalSpend / 1000000).toFixed(2)}`);
    console.log(`   Total Clicks: ${totalClicks.toLocaleString()}`);
    console.log(`   Total Impressions: ${totalImpressions.toLocaleString()}`);
    
    if (totalImpressions > 0) {
      const overallCTR = (totalClicks / totalImpressions) * 100;
      console.log(`   Overall CTR: ${overallCTR.toFixed(2)}%`);
    }
    
    if (totalClicks > 0) {
      const avgCPC = totalSpend / totalClicks / 1000000;
      console.log(`   Average CPC: $${avgCPC.toFixed(2)}`);
    }
    
    return result;
  } catch (error) {
    console.error(`Failed to get campaigns for ${customerId}:`, error);
    throw error;
  }
}
```

### Campaign Performance Analysis

Analyze campaign performance across accounts:

```typescript
async function analyzeCampaignPerformance(customerIds: string[]) {
  const analysis = {
    totalAccounts: customerIds.length,
    totalCampaigns: 0,
    totalSpend: 0,
    totalClicks: 0,
    totalConversions: 0,
    topPerformers: [] as Array<{
      campaignName: string;
      customerId: string;
      clicks: number;
      conversions: number;
      ctr: number;
    }>
  };
  
  for (const customerId of customerIds) {
    try {
      const result = await sdk.ads.getCampaigns(customerId);
      analysis.totalCampaigns += result.total;
      
      for (const campaign of result.campaigns) {
        analysis.totalSpend += campaign.metrics.cost;
        analysis.totalClicks += campaign.metrics.clicks;
        analysis.totalConversions += campaign.metrics.conversions;
        
        // Track top performers
        if (campaign.metrics.clicks > 1000) { // Threshold for significant traffic
          analysis.topPerformers.push({
            campaignName: campaign.name,
            customerId: customerId,
            clicks: campaign.metrics.clicks,
            conversions: campaign.metrics.conversions,
            ctr: campaign.metrics.ctr || 0
          });
        }
      }
      
      // Small delay to respect rate limits
      await new Promise(resolve => setTimeout(resolve, 100));
      
    } catch (error) {
      console.warn(`Failed to analyze customer ${customerId}:`, error.message);
    }
  }
  
  // Sort top performers by clicks
  analysis.topPerformers.sort((a, b) => b.clicks - a.clicks);
  analysis.topPerformers = analysis.topPerformers.slice(0, 10); // Top 10
  
  console.log(`\n🎯 Campaign Performance Analysis:`);
  console.log(`   Accounts Analyzed: ${analysis.totalAccounts}`);
  console.log(`   Total Campaigns: ${analysis.totalCampaigns}`);
  console.log(`   Total Spend: $${(analysis.totalSpend / 1000000).toFixed(2)}`);
  console.log(`   Total Clicks: ${analysis.totalClicks.toLocaleString()}`);
  console.log(`   Total Conversions: ${analysis.totalConversions}`);
  
  if (analysis.totalClicks > 0) {
    const avgCTR = (analysis.totalClicks / (analysis.totalSpend * 1000)) * 100;
    console.log(`   Average CTR: ${avgCTR.toFixed(2)}%`);
  }
  
  console.log(`\n🏆 Top Performing Campaigns:`);
  analysis.topPerformers.forEach((campaign, index) => {
    console.log(`   ${index + 1}. ${campaign.campaignName}`);
    console.log(`      Customer: ${campaign.customerId}`);
    console.log(`      Clicks: ${campaign.clicks.toLocaleString()}`);
    console.log(`      Conversions: ${campaign.conversions}`);
    console.log(`      CTR: ${campaign.ctr.toFixed(2)}%`);
  });
  
  return analysis;
}
```

---

## Error Handling

### Comprehensive Error Handling

Handle all types of Google Ads API errors:

```typescript
import { GoogleAdsAPIError, ConnectionError, RateLimitError } from '@metrics-hub/sdk';

async function robustAccountFetching(customerId: string, maxRetries: number = 3) {
  let attempt = 0;
  
  while (attempt < maxRetries) {
    try {
      return await sdk.ads.getCampaigns(customerId);
    } catch (error) {
      attempt++;
      
      if (error instanceof GoogleAdsAPIError) {
        if (error.quotaExceeded) {
          console.log(`Quota exceeded for customer ${customerId}, waiting...`);
          await new Promise(resolve => setTimeout(resolve, 60000)); // Wait 1 minute
        } else if (error.googleErrorCode === 'CUSTOMER_NOT_FOUND') {
          console.error(`Customer ${customerId} not found`);
          throw error; // Don't retry for this error
        } else {
          console.warn(`Google Ads API error (attempt ${attempt}):`, error.message);
        }
      } else if (error instanceof ConnectionError) {
        if (error.expired) {
          console.error('Authentication expired, please reconnect');
          throw error; // Don't retry, need user intervention
        }
      } else if (error instanceof RateLimitError) {
        const waitTime = error.retryAfter || 60;
        console.log(`Rate limited, waiting ${waitTime} seconds...`);
        await new Promise(resolve => setTimeout(resolve, waitTime * 1000));
      } else {
        console.warn(`Unexpected error (attempt ${attempt}):`, error.message);
      }
      
      if (attempt >= maxRetries) {
        console.error(`Failed after ${maxRetries} attempts`);
        throw error;
      }
      
      // Exponential backoff
      const backoffDelay = Math.pow(2, attempt) * 1000;
      await new Promise(resolve => setTimeout(resolve, backoffDelay));
    }
  }
}
```

---

## Best Practices

### 1. Account Discovery Pattern

Always start with account discovery to understand what you have access to:

```typescript
async function initializeGoogleAdsData() {
  console.log('🔍 Discovering accessible accounts...');
  
  // Step 1: Get all accessible customers
  const customers = await sdk.ads.getAccessibleCustomers();
  console.log(`Found ${customers.total} accessible customers`);
  
  // Step 2: Get detailed information for all accounts
  const accounts = await sdk.ads.listAllAccounts();
  console.log(`Retrieved details for ${accounts.total} accounts`);
  
  // Step 3: Identify account structure
  const mccAccounts = accounts.accounts.filter(acc => acc.manager);
  const standardAccounts = accounts.accounts.filter(acc => !acc.manager);
  
  console.log(`Account structure: ${mccAccounts.length} MCC, ${standardAccounts.length} standard`);
  
  // Step 4: Build hierarchy map
  const hierarchyMap = new Map();
  if (accounts.hierarchies) {
    accounts.hierarchies.forEach(hierarchy => {
      hierarchyMap.set(hierarchy.managerAccount.id, hierarchy.childAccounts);
    });
  }
  
  return {
    allAccounts: accounts.accounts,
    mccAccounts,
    standardAccounts,
    hierarchyMap
  };
}
```

### 2. Efficient Data Fetching

Batch operations and implement rate limiting:

```typescript
class GoogleAdsDataFetcher {
  private requestQueue: Array<() => Promise<any>> = [];
  private isProcessing = false;
  private rateLimit = 10; // requests per second
  
  async fetchCampaignsForAccounts(customerIds: string[]) {
    const results = new Map();
    
    // Queue all requests
    customerIds.forEach(customerId => {
      this.requestQueue.push(async () => {
        try {
          const campaigns = await sdk.ads.getCampaigns(customerId);
          results.set(customerId, campaigns);
          console.log(`✅ Fetched ${campaigns.total} campaigns for ${customerId}`);
        } catch (error) {
          console.error(`❌ Failed to fetch campaigns for ${customerId}:`, error.message);
          results.set(customerId, { error: error.message });
        }
      });
    });
    
    // Process queue with rate limiting
    await this.processQueue();
    
    return results;
  }
  
  private async processQueue() {
    if (this.isProcessing) return;
    this.isProcessing = true;
    
    const delayMs = 1000 / this.rateLimit;
    
    while (this.requestQueue.length > 0) {
      const request = this.requestQueue.shift();
      if (request) {
        await request();
        await new Promise(resolve => setTimeout(resolve, delayMs));
      }
    }
    
    this.isProcessing = false;
  }
}
```

### 3. Account Monitoring

Set up monitoring for account status changes:

```typescript
class AccountMonitor {
  private lastKnownAccounts = new Map();
  
  async checkForAccountChanges() {
    try {
      const currentAccounts = await sdk.ads.listAllAccounts();
      const currentMap = new Map(
        currentAccounts.accounts.map(acc => [acc.id, acc])
      );
      
      // Check for new accounts
      for (const [id, account] of currentMap) {
        if (!this.lastKnownAccounts.has(id)) {
          console.log(`🆕 New account detected: ${account.descriptiveName} (${id})`);
          this.onNewAccount(account);
        }
      }
      
      // Check for removed accounts
      for (const [id] of this.lastKnownAccounts) {
        if (!currentMap.has(id)) {
          const removedAccount = this.lastKnownAccounts.get(id);
          console.log(`🗑️ Account removed: ${removedAccount.descriptiveName} (${id})`);
          this.onAccountRemoved(removedAccount);
        }
      }
      
      // Check for status changes
      for (const [id, currentAccount] of currentMap) {
        const lastKnown = this.lastKnownAccounts.get(id);
        if (lastKnown && lastKnown.status !== currentAccount.status) {
          console.log(`🔄 Account status changed: ${currentAccount.descriptiveName}`);
          console.log(`   ${lastKnown.status} → ${currentAccount.status}`);
          this.onAccountStatusChanged(lastKnown, currentAccount);
        }
      }
      
      this.lastKnownAccounts = currentMap;
      
    } catch (error) {
      console.error('Failed to check for account changes:', error);
    }
  }
  
  private onNewAccount(account: GoogleAdsAccount) {
    // Handle new account discovery
  }
  
  private onAccountRemoved(account: GoogleAdsAccount) {
    // Handle account removal
  }
  
  private onAccountStatusChanged(oldAccount: GoogleAdsAccount, newAccount: GoogleAdsAccount) {
    // Handle status changes
  }
}
```

---

## Common Patterns

### Multi-Account Dashboard

```typescript
async function buildMultiAccountDashboard() {
  console.log('🚀 Building multi-account dashboard...');
  
  const dashboard = {
    summary: {
      totalAccounts: 0,
      activeAccounts: 0,
      totalCampaigns: 0,
      totalSpend: 0,
      totalClicks: 0
    },
    accountDetails: [] as Array<{
      account: GoogleAdsAccount;
      campaignCount: number;
      totalSpend: number;
      status: string;
    }>
  };
  
  // Get all accounts
  const accounts = await sdk.ads.listAllAccounts();
  dashboard.summary.totalAccounts = accounts.total;
  dashboard.summary.activeAccounts = accounts.accounts.filter(acc => acc.status === 'ENABLED').length;
  
  // Process each account
  for (const account of accounts.accounts) {
    if (!account.manager) { // Skip MCC accounts for campaign data
      try {
        const campaigns = await sdk.ads.getCampaigns(account.id);
        
        const accountSpend = campaigns.campaigns.reduce((sum, camp) => 
          sum + camp.metrics.cost, 0
        );
        
        const accountClicks = campaigns.campaigns.reduce((sum, camp) => 
          sum + camp.metrics.clicks, 0
        );
        
        dashboard.summary.totalCampaigns += campaigns.total;
        dashboard.summary.totalSpend += accountSpend;
        dashboard.summary.totalClicks += accountClicks;
        
        dashboard.accountDetails.push({
          account,
          campaignCount: campaigns.total,
          totalSpend: accountSpend,
          status: account.status
        });
        
        // Rate limiting
        await new Promise(resolve => setTimeout(resolve, 200));
        
      } catch (error) {
        console.warn(`Failed to get campaigns for ${account.descriptiveName}:`, error.message);
        dashboard.accountDetails.push({
          account,
          campaignCount: 0,
          totalSpend: 0,
          status: 'ERROR'
        });
      }
    }
  }
  
  // Display dashboard
  console.log('\n📊 Multi-Account Dashboard');
  console.log('========================');
  console.log(`Total Accounts: ${dashboard.summary.totalAccounts}`);
  console.log(`Active Accounts: ${dashboard.summary.activeAccounts}`);
  console.log(`Total Campaigns: ${dashboard.summary.totalCampaigns}`);
  console.log(`Total Spend: $${(dashboard.summary.totalSpend / 1000000).toFixed(2)}`);
  console.log(`Total Clicks: ${dashboard.summary.totalClicks.toLocaleString()}`);
  
  console.log('\n📈 Account Performance:');
  dashboard.accountDetails
    .sort((a, b) => b.totalSpend - a.totalSpend)
    .slice(0, 10)
    .forEach((detail, index) => {
      console.log(`${index + 1}. ${detail.account.descriptiveName}`);
      console.log(`   Campaigns: ${detail.campaignCount}`);
      console.log(`   Spend: $${(detail.totalSpend / 1000000).toFixed(2)}`);
      console.log(`   Status: ${detail.status}`);
    });
  
  return dashboard;
}
```

---

## Troubleshooting

### Common Issues and Solutions

#### 1. "Customer not found" Error

```typescript
// Check if customer ID exists in accessible customers
async function validateCustomerId(customerId: string) {
  const accessibleCustomers = await sdk.ads.getAccessibleCustomers();
  
  if (!accessibleCustomers.customers.includes(customerId)) {
    console.error(`Customer ID ${customerId} is not accessible`);
    console.log('Accessible customers:', accessibleCustomers.customers);
    return false;
  }
  
  return true;
}
```

#### 2. Permission Issues

```typescript
async function checkPermissions() {
  try {
    // Test basic account access
    await sdk.ads.getAccessibleCustomers();
    console.log('✅ Basic account access working');
    
    // Test account details access
    const accounts = await sdk.ads.listAllAccounts();
    console.log(`✅ Can access ${accounts.total} account details`);
    
    // Test campaign access
    if (accounts.accounts.length > 0) {
      const firstAccount = accounts.accounts.find(acc => !acc.manager);
      if (firstAccount) {
        await sdk.ads.getCampaigns(firstAccount.id);
        console.log('✅ Campaign access working');
      }
    }
    
  } catch (error) {
    console.error('❌ Permission check failed:', error.message);
    
    if (error instanceof ConnectionError) {
      console.log('💡 Solution: Check OAuth scopes and reconnect');
    }
  }
}
```

#### 3. Rate Limiting

```typescript
class RateLimitHandler {
  private requestCount = 0;
  private windowStart = Date.now();
  private maxRequestsPerMinute = 100;
  
  async makeRequest<T>(requestFunc: () => Promise<T>): Promise<T> {
    await this.enforceRateLimit();
    
    try {
      const result = await requestFunc();
      this.requestCount++;
      return result;
    } catch (error) {
      if (error instanceof RateLimitError) {
        console.log(`Rate limited, waiting ${error.retryAfter} seconds...`);
        await new Promise(resolve => setTimeout(resolve, error.retryAfter * 1000));
        return this.makeRequest(requestFunc);
      }
      throw error;
    }
  }
  
  private async enforceRateLimit() {
    const now = Date.now();
    const windowElapsed = now - this.windowStart;
    
    if (windowElapsed >= 60000) { // Reset window every minute
      this.requestCount = 0;
      this.windowStart = now;
      return;
    }
    
    if (this.requestCount >= this.maxRequestsPerMinute) {
      const waitTime = 60000 - windowElapsed;
      console.log(`Rate limit reached, waiting ${waitTime}ms...`);
      await new Promise(resolve => setTimeout(resolve, waitTime));
      this.requestCount = 0;
      this.windowStart = Date.now();
    }
  }
}
```

This comprehensive guide covers all aspects of the enhanced Google Ads integration. The new account management features provide the foundation for building sophisticated Google Ads applications that were previously impossible with the basic SDK.