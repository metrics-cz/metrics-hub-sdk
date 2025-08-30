/**
 * Testing SDK for MetricsHub Development
 * 
 * Provides mock data generators, test environment setup, and development helpers
 */

import { MetricsHubSDK } from '../MetricsHubSDK';
import { PluginConfig } from '../types';
import { GoogleAdsAccount, GoogleAdsCampaign, AccountHierarchy } from '../types/google-ads';
import { GoogleAnalyticsAccount, GoogleAnalyticsProperty, GoogleAnalyticsView } from '../types/google-analytics';
import { Logger } from '../utils/Logger';
import { z, ZodSchema } from 'zod';

export interface MockDataOptions {
  count?: number;
  seed?: string;
  realistic?: boolean;
}

export interface TestEnvironmentConfig {
  mockMode: boolean;
  logLevel: 'debug' | 'info' | 'warn' | 'error';
  apiDelay?: number;
  errorRate?: number;
  enableValidation?: boolean;
}

/**
 * Enhanced Testing SDK that extends MetricsHubSDK with testing utilities
 */
export class TestingSDK extends MetricsHubSDK {
  private testConfig: TestEnvironmentConfig;
  private mockConnections: Map<string, any> = new Map();
  private requestLogs: Array<{ endpoint: string; method: string; timestamp: Date; response?: any; error?: any }> = [];

  constructor(config: PluginConfig, testConfig?: Partial<TestEnvironmentConfig>) {
    super(config);
    
    this.testConfig = {
      mockMode: true,
      logLevel: 'debug',
      apiDelay: 100,
      errorRate: 0,
      enableValidation: true,
      ...testConfig
    };
    
    this.setupTestEnvironment();
  }

  // Mock Data Generators

  /**
   * Generate mock Google Ads accounts
   */
  generateMockAccounts(options: MockDataOptions = {}): GoogleAdsAccount[] {
    const count = options.count || 5;
    const accounts: GoogleAdsAccount[] = [];

    for (let i = 0; i < count; i++) {
      accounts.push({
        id: `${1000000000 + i}`,
        resourceName: `customers/${1000000000 + i}`,
        descriptiveName: options.realistic ? this.getRealisticCompanyName() : `Test Account ${i + 1}`,
        manager: Math.random() > 0.7, // 30% chance of being manager account
        testAccount: !options.realistic,
        timeZone: this.getRandomTimezone(),
        currencyCode: this.getRandomCurrency(),
        status: this.getRandomStatus(['ENABLED', 'SUSPENDED', 'CLOSED']),
        conversionTrackingId: Math.random() > 0.5 ? `${800000000 + i}` : undefined
      });
    }

    return accounts;
  }

  /**
   * Generate mock Google Ads campaigns
   */
  generateMockCampaigns(accountId: string, options: MockDataOptions = {}): GoogleAdsCampaign[] {
    const count = options.count || 10;
    const campaigns: GoogleAdsCampaign[] = [];

    for (let i = 0; i < count; i++) {
      campaigns.push({
        id: `${200000000 + i}`,
        name: options.realistic ? this.getRealisticCampaignName() : `Campaign ${i + 1}`,
        status: this.getRandomStatus(['ENABLED', 'PAUSED', 'REMOVED']),
        type: this.getRandomCampaignType(),
        resourceName: `customers/${accountId}/campaigns/${200000000 + i}`,
        startDate: this.getRandomDate(-30).toISOString().split('T')[0],
        endDate: Math.random() > 0.7 ? this.getRandomDate(30).toISOString().split('T')[0] : undefined,
        biddingStrategy: this.getRandomBiddingStrategy(),
        budget: {
          amountMicros: Math.floor(Math.random() * 100000) * 1000000, // Random budget in micros
          deliveryMethod: Math.random() > 0.5 ? 'ACCELERATED' : 'STANDARD'
        },
        metrics: {
          impressions: Math.floor(Math.random() * 100000),
          clicks: Math.floor(Math.random() * 5000),
          cost: Math.floor(Math.random() * 10000) * 1000000, // In micros
          conversions: Math.floor(Math.random() * 100),
          ctr: parseFloat((Math.random() * 10).toFixed(2)),
          averageCpc: Math.floor(Math.random() * 500) * 10000, // In micros
          costPerConversion: Math.floor(Math.random() * 5000) * 10000 // In micros
        }
      });
    }

    return campaigns;
  }

  /**
   * Generate mock account hierarchy
   */
  generateMockAccountHierarchy(options: MockDataOptions = {}): AccountHierarchy {
    const accounts = this.generateMockAccounts({ count: options.count || 5 });
    const managerAccount = accounts.find(acc => acc.manager) || accounts[0];
    const childAccounts = accounts.filter(acc => !acc.manager);

    return {
      managerAccount,
      childAccounts,
      depth: 1
    };
  }

  /**
   * Generate mock Google Analytics accounts
   */
  generateMockAnalyticsAccounts(options: MockDataOptions = {}): GoogleAnalyticsAccount[] {
    const count = options.count || 3;
    const accounts: GoogleAnalyticsAccount[] = [];

    for (let i = 0; i < count; i++) {
      const propertyCount = Math.floor(Math.random() * 3) + 1;
      const properties: GoogleAnalyticsProperty[] = [];

      for (let j = 0; j < propertyCount; j++) {
        const viewCount = Math.floor(Math.random() * 3) + 1;
        const views: GoogleAnalyticsView[] = [];

        for (let k = 0; k < viewCount; k++) {
          views.push({
            id: `${90000000 + (i * 100) + (j * 10) + k}`,
            name: options.realistic ? `${this.getRealisticWebsiteName()} - ${this.getRandomViewType()}` : `View ${k + 1}`,
            type: this.getRandomViewType()
          });
        }

        properties.push({
          id: `UA-${12345678 + (i * 100) + j}-1`,
          name: options.realistic ? this.getRealisticWebsiteName() : `Property ${j + 1}`,
          websiteUrl: options.realistic ? this.getRealisticWebsiteUrl() : `https://example${j + 1}.com`,
          views
        });
      }

      accounts.push({
        id: `${10000000 + i}`,
        name: options.realistic ? this.getRealisticCompanyName() : `Analytics Account ${i + 1}`,
        properties
      });
    }

    return accounts;
  }

  // Test Environment Setup

  /**
   * Enable test mode with mock responses
   */
  enableTestMode(): void {
    this.testConfig.mockMode = true;
    Logger.setLevel(this.testConfig.logLevel);
    Logger.info('Test mode enabled');
  }

  /**
   * Mock a specific connection for testing
   */
  mockConnection(provider: string, data: any): void {
    this.mockConnections.set(provider, data);
    Logger.debug(`Mocked connection for ${provider}`, { data });
  }

  /**
   * Simulate API errors for testing error handling
   */
  simulateError(errorType: 'network' | 'auth' | 'rate_limit' | 'server' | 'validation', probability: number = 1): void {
    this.testConfig.errorRate = probability;
    Logger.info(`Error simulation enabled`, { errorType, probability });
    
    // Store error type for mock responses
    this.mockConnections.set('__error_simulation__', { type: errorType, probability });
  }

  /**
   * Clear all mock data and reset to normal operation
   */
  clearMocks(): void {
    this.mockConnections.clear();
    this.testConfig.errorRate = 0;
    this.requestLogs = [];
    Logger.info('All mocks cleared');
  }

  // Development Helpers

  /**
   * Log all API requests for debugging
   */
  logAPIRequests(enabled: boolean = true): void {
    if (enabled) {
      Logger.enableComponent('API_REQUESTS');
      Logger.info('API request logging enabled');
    } else {
      Logger.disableComponent('API_REQUESTS');
      Logger.info('API request logging disabled');
    }
  }

  /**
   * Validate data against a Zod schema
   */
  validateSchema(data: any, schema: ZodSchema): { valid: boolean; errors?: any[] } {
    try {
      schema.parse(data);
      return { valid: true };
    } catch (error: any) {
      return {
        valid: false,
        errors: error.issues || [{ message: error.message }]
      };
    }
  }

  /**
   * Get API request logs for debugging
   */
  getRequestLogs(): Array<{ endpoint: string; method: string; timestamp: Date; response?: any; error?: any }> {
    return [...this.requestLogs];
  }

  /**
   * Clear request logs
   */
  clearRequestLogs(): void {
    this.requestLogs = [];
    Logger.debug('Request logs cleared');
  }

  /**
   * Measure performance of operations
   */
  async measurePerformance<T>(operation: () => Promise<T>, operationName: string): Promise<{ result: T; duration: number }> {
    const startTime = Date.now();
    
    try {
      const result = await operation();
      const duration = Date.now() - startTime;
      
      Logger.info(`Performance: ${operationName} completed in ${duration}ms`);
      
      return { result, duration };
    } catch (error) {
      const duration = Date.now() - startTime;
      Logger.error(`Performance: ${operationName} failed after ${duration}ms`, error as Error);
      throw error;
    }
  }

  // Private Helper Methods

  private setupTestEnvironment(): void {
    Logger.setLevel(this.testConfig.logLevel);
    
    if (this.testConfig.mockMode) {
      Logger.info('Testing SDK initialized in mock mode', this.testConfig);
    }
  }

  private getRealisticCompanyName(): string {
    const prefixes = ['Tech', 'Digital', 'Smart', 'Global', 'Pro', 'Elite', 'Prime', 'Alpha', 'Beta', 'Mega'];
    const suffixes = ['Solutions', 'Systems', 'Corp', 'Inc', 'Ltd', 'Group', 'Industries', 'Enterprises', 'Partners', 'Labs'];
    
    return `${prefixes[Math.floor(Math.random() * prefixes.length)]} ${suffixes[Math.floor(Math.random() * suffixes.length)]}`;
  }

  private getRealisticCampaignName(): string {
    const types = ['Brand', 'Search', 'Display', 'Video', 'Shopping', 'App', 'Local'];
    const objectives = ['Awareness', 'Conversions', 'Traffic', 'Leads', 'Sales', 'Engagement'];
    const seasons = ['Spring', 'Summer', 'Fall', 'Winter', 'Holiday', 'Back-to-School'];
    
    return `${types[Math.floor(Math.random() * types.length)]} - ${objectives[Math.floor(Math.random() * objectives.length)]} ${seasons[Math.floor(Math.random() * seasons.length)]}`;
  }

  private getRealisticWebsiteName(): string {
    const adjectives = ['Amazing', 'Awesome', 'Best', 'Premium', 'Quality', 'Super', 'Ultimate', 'Perfect'];
    const nouns = ['Store', 'Shop', 'Market', 'Hub', 'Portal', 'Site', 'Platform', 'Place'];
    
    return `${adjectives[Math.floor(Math.random() * adjectives.length)]} ${nouns[Math.floor(Math.random() * nouns.length)]}`;
  }

  private getRealisticWebsiteUrl(): string {
    const domains = ['example', 'test', 'demo', 'sample', 'mock', 'fake', 'dummy'];
    const tlds = ['com', 'org', 'net', 'io', 'co'];
    
    return `https://${domains[Math.floor(Math.random() * domains.length)]}.${tlds[Math.floor(Math.random() * tlds.length)]}`;
  }

  private getRandomStatus<T>(statuses: T[]): T {
    return statuses[Math.floor(Math.random() * statuses.length)];
  }

  private getRandomTimezone(): string {
    const timezones = ['America/New_York', 'America/Los_Angeles', 'Europe/London', 'Europe/Paris', 'Asia/Tokyo', 'Australia/Sydney'];
    return timezones[Math.floor(Math.random() * timezones.length)];
  }

  private getRandomCurrency(): string {
    const currencies = ['USD', 'EUR', 'GBP', 'JPY', 'CAD', 'AUD'];
    return currencies[Math.floor(Math.random() * currencies.length)];
  }

  private getRandomCampaignType(): string {
    const types = ['SEARCH', 'DISPLAY', 'SHOPPING', 'VIDEO', 'APP', 'SMART', 'DISCOVERY'];
    return types[Math.floor(Math.random() * types.length)];
  }

  private getRandomBiddingStrategy(): string {
    const strategies = ['TARGET_CPA', 'TARGET_ROAS', 'MAXIMIZE_CLICKS', 'MAXIMIZE_CONVERSIONS', 'MANUAL_CPC', 'ENHANCED_CPC'];
    return strategies[Math.floor(Math.random() * strategies.length)];
  }

  private getRandomViewType(): string {
    const types = ['All Website Data', 'Mobile Traffic', 'Desktop Traffic', 'Raw Data', 'Test View'];
    return types[Math.floor(Math.random() * types.length)];
  }

  private getRandomDate(daysOffset: number): Date {
    const date = new Date();
    date.setDate(date.getDate() + daysOffset + (Math.random() * 30 - 15)); // Add some randomness
    return date;
  }
}

/**
 * Utility functions for testing
 */
export class TestUtils {
  /**
   * Create a test instance of MetricsHub SDK
   */
  static createTestSDK(overrides?: Partial<PluginConfig>): TestingSDK {
    const config: PluginConfig = {
      companyId: 'test-company-123',
      apiBaseUrl: 'http://localhost:3000',
      debug: true,
      ...overrides
    };

    return new TestingSDK(config);
  }

  /**
   * Wait for a specified amount of time (for testing async operations)
   */
  static async wait(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Generate a random string for testing
   */
  static randomString(length: number = 8): string {
    const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }

  /**
   * Generate a random email for testing
   */
  static randomEmail(): string {
    return `test${this.randomString(5)}@example.com`;
  }

  /**
   * Generate test data that matches a Zod schema
   */
  static generateTestData(schema: ZodSchema): any {
    // This is a simplified implementation
    // In a real implementation, you'd analyze the schema and generate appropriate data
    return {
      id: this.randomString(),
      name: `Test ${this.randomString(4)}`,
      email: this.randomEmail(),
      createdAt: new Date().toISOString()
    };
  }
}