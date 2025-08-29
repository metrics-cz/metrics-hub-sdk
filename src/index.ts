// Main SDK
export { MetricsHubSDK } from "./MetricsHubSDK";

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

// Database functionality
export { MetricsHubSchema, MetricsHubSchemaInstance } from "./database/schema";
export { ZodSchemaParser } from "./database/schema-parser";
export { DatabaseManager } from "./database/database-manager";

// Authentication helpers
export { onAuth, isInIframe } from "./auth/simple-auth";

// Re-export zod for convenience
export { z } from 'zod'; 
