import { z } from "zod";
import { GoogleAdsClient } from "./services/GoogleAdsClient";
import { GoogleAnalyticsClient } from "./services/GoogleAnalyticsClient";
import { GoogleSheetsClient } from "./services/GoogleSheetsClient";
import { GoogleDriveClient } from "./services/GoogleDriveClient";
import { GmailClient } from "./services/GmailClient";
import { GoogleDocsClient } from "./services/GoogleDocsClient";
import { GoogleSearchConsoleClient } from "./services/GoogleSearchConsoleClient";
import { PluginConfig } from "./types";
import { MetricsHubConfig } from "./types/database";
import { MetricsHubSchemaInstance } from "./database/schema";
import { DatabaseManager } from "./database/database-manager";

export class MetricsHubSDK {
    // Google service integrations (existing functionality)
    public ads: GoogleAdsClient;
    public analytics: GoogleAnalyticsClient;
    public sheets: GoogleSheetsClient;
    public drive: GoogleDriveClient;
    public gmail: GmailClient;
    public searchConsole: GoogleSearchConsoleClient;
    public docs: GoogleDocsClient;

    // Backward compatibility aliases
    public googleAds: GoogleAdsClient;
    public googleAnalytics: GoogleAnalyticsClient;

    // Database functionality (new)
    public tables?: any; // Will be dynamically typed based on schema
    private dbManager?: DatabaseManager;
    private schema?: MetricsHubSchemaInstance<any>;
    private config: PluginConfig;

    // Constructor 1: Original PluginConfig (backward compatibility)
    constructor(config: PluginConfig);
    // Constructor 2: Enhanced config with database schema
    constructor(config: MetricsHubConfig, schema: MetricsHubSchemaInstance<any>);
    // Implementation
    constructor(config: PluginConfig | MetricsHubConfig, schema?: MetricsHubSchemaInstance<any>) {
        this.config = {
            ...config,
            companyId: (config.companyId !== undefined && config.companyId !== null) ? config.companyId : "",
        };
        this.schema = schema;

        // Set default API base URL
        this.config.apiBaseUrl = config.apiBaseUrl || 'https://metrics-hub-six.vercel.app';

        // Initialize Google service clients (existing functionality)
        this.ads = new GoogleAdsClient(this.config);
        this.analytics = new GoogleAnalyticsClient(this.config);
        this.sheets = new GoogleSheetsClient(this.config);
        this.drive = new GoogleDriveClient(this.config);
        this.gmail = new GmailClient(this.config);
        this.searchConsole = new GoogleSearchConsoleClient(this.config);
        this.docs = new GoogleDocsClient(this.config);

        // Add aliases for backward compatibility
        this.googleAds = this.ads;
        this.googleAnalytics = this.analytics;

        // Initialize database functionality if schema and appId are provided
        if (schema && this.hasMetricsHubConfig(config)) {
            this.initializeDatabase(config, schema);
        }
    }

    /**
     * Type guard to check if config has MetricsHubConfig properties
     */
    private hasMetricsHubConfig(config: PluginConfig | MetricsHubConfig): config is MetricsHubConfig {
        return 'appId' in config && typeof (config as any).appId === 'string';
    }

    /**
     * Initialize database functionality
     */
    private initializeDatabase(config: MetricsHubConfig, schema: MetricsHubSchemaInstance<any>) {
        this.dbManager = new DatabaseManager(config);
        
        // Create dynamic table operations
        const tableOperations: any = {};
        
        for (const [tableName, zodSchema] of Object.entries(schema.tables)) {
            tableOperations[tableName] = this.dbManager.createTableOperations(
                tableName,
                zodSchema as z.ZodObject<any>,
                schema
            );
        }
        
        this.tables = tableOperations;
    }

    /**
     * Update configuration (existing functionality)
     */
    public updateConfig(newConfig: Partial<{ apiKey: string; companyId: string; apiBaseUrl?: string }>) {
        this.config = { ...this.config, ...newConfig };
        this.ads.updateConfig(this.config);
        this.analytics.updateConfig(this.config);
        this.sheets.updateConfig(this.config);
        this.drive.updateConfig(this.config);
        this.gmail.updateConfig(this.config);
        this.searchConsole.updateConfig(this.config);
        this.docs.updateConfig(this.config);
    }

    /**
     * Get current configuration
     */
    public getConfig() {
        return this.config;
    }

    /**
     * Check if database functionality is available
     */
    public hasDatabaseSupport(): boolean {
        return !!this.tables && !!this.dbManager && !!this.schema;
    }

    /**
     * Get schema information (if available)
     */
    public getSchema(): MetricsHubSchemaInstance<any> | undefined {
        return this.schema;
    }
}