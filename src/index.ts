// Main SDK
export { MetricsHubSDK } from "./MetricsHubSDK";

// Enhanced Plugin SDK
export { PluginSDK } from "./plugin/PluginSDK";
export type { PluginManifest, MessageHandler, PluginMessage, NotificationOptions } from "./plugin/PluginSDK";

// Testing SDK
export { TestingSDK, TestUtils } from "./testing/TestingSDK";
export type { MockDataOptions, TestEnvironmentConfig } from "./testing/TestingSDK";

// Configuration and types
export * from './config'
export * from './types'

// Google service clients
export { GoogleAdsClient } from "./services/GoogleAdsClient";
export { GoogleAnalyticsClient } from "./services/GoogleAnalyticsClient";
export { GoogleSheetsClient } from "./services/GoogleSheetsClient";
export { GoogleDriveClient } from "./services/GoogleDriveClient";
export { GmailClient } from "./services/GmailClient";
export { GoogleDocsClient } from "./services/GoogleDocsClient";
export { GoogleSearchConsoleClient } from "./services/GoogleSearchConsoleClient";

// Universal Service Provider Interface
export {
  ServiceProviderInterface,
  ServiceProviderRegistry
} from "./services/ServiceProviderInterface";
export { GoogleAdsServiceProvider } from "./services/GoogleAdsServiceProvider";
export type {
  ServiceAccount,
  ServiceHierarchy,
  ServiceProviderConfig,
  ServiceDataRequest,
  ServiceDataResponse
} from "./services/ServiceProviderInterface";

// OAuth and Connection Management
export { ConnectionManager } from "./services/ConnectionManager";
export type { 
  ConnectionValidationResponse, 
  AccessTokenResponse, 
  RefreshTokenResponse 
} from "./services/ConnectionManager";

// Database functionality
export { MetricsHubSchema, MetricsHubSchemaInstance } from "./database/schema";
export { ZodSchemaParser } from "./database/schema-parser";
export { DatabaseManager } from "./database/database-manager";

// Authentication helpers
export { onAuth, isInIframe } from "./auth/simple-auth";
export type { AuthData } from "./auth/simple-auth";

// Error handling
export { 
  MetricsHubError, 
  GoogleAdsAPIError, 
  ConnectionError, 
  DatabaseError, 
  ValidationError, 
  RateLimitError,
  ErrorUtils 
} from "./errors";
export type { ErrorContext } from "./errors";

// Logging system
export { Logger, ComponentLogger, PerformanceTimer } from "./utils/Logger";
export type { LogLevel, LogContext, LogEntry } from "./utils/Logger";
export { 
  GoogleAdsLogger, 
  GoogleAnalyticsLogger, 
  GoogleSheetsLogger, 
  ConnectionLogger, 
  DatabaseLogger, 
  SDKLogger 
} from "./utils/Logger";

// Re-export zod for convenience
export { z } from 'zod';

