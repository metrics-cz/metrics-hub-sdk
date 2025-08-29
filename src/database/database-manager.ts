import { z } from 'zod';
import { 
  MetricsHubConfig, 
  TableOperations, 
  QueryOptions, 
  WhereCondition, 
  ApiResponse 
} from '../types/database';
import { MetricsHubSchemaInstance } from './schema';
import { ZodSchemaParser } from './schema-parser';

/**
 * Database Manager for handling table operations and API calls
 */
export class DatabaseManager {
  private config: MetricsHubConfig;
  private createdTables = new Set<string>();
  private schemaName: string;

  constructor(config: MetricsHubConfig) {
    this.config = config;
    this.schemaName = ZodSchemaParser.generateSchemaName(
      config.appId, 
      config.companyId || 'unknown'
    );
  }

  /**
   * Create table operations for a specific table
   */
  createTableOperations<T>(
    tableName: string,
    zodSchema: z.ZodObject<any>,
    schemaInstance: MetricsHubSchemaInstance<any>
  ): TableOperations<T> {
    return new TableOperationsImpl<T>(
      tableName,
      zodSchema,
      schemaInstance,
      this
    );
  }

  /**
   * Ensure table exists in database
   */
  async ensureTable(tableName: string, zodSchema: z.ZodObject<any>): Promise<void> {
    const tableKey = `${this.schemaName}.${tableName}`;
    
    if (this.createdTables.has(tableKey)) {
      return;
    }

    try {
      // Check if table exists
      const exists = await this.checkTableExists(tableName);
      
      if (!exists) {
        // Create table
        await this.createTable(tableName, zodSchema);
      }
      
      this.createdTables.add(tableKey);
    } catch (error) {
      console.error(`Failed to ensure table ${tableName}:`, error);
      throw error;
    }
  }

  /**
   * Check if table exists
   */
  private async checkTableExists(tableName: string): Promise<boolean> {
    try {
      const response = await this.apiCall('POST', '/check-table', {
        schemaName: this.schemaName,
        tableName
      });
      
      return response.data?.exists || false;
    } catch (error) {
      return false;
    }
  }

  /**
   * Create table in database
   */
  private async createTable(tableName: string, zodSchema: z.ZodObject<any>): Promise<void> {
    // First ensure schema exists
    await this.ensureSchema();

    // Generate DDL
    const ddl = ZodSchemaParser.toPostgreSQL(zodSchema, tableName);
    
    // Send to API
    const response = await this.apiCall('POST', '/ensure-table', {
      schemaName: this.schemaName,
      tableName,
      ddl,
      zodSchema: this.serializeZodSchema(zodSchema)
    });

    if (!response.success) {
      throw new Error(`Failed to create table ${tableName}: ${response.error}`);
    }
  }

  /**
   * Ensure schema exists
   */
  private async ensureSchema(): Promise<void> {
    const response = await this.apiCall('POST', '/ensure-schema', {
      schemaName: this.schemaName,
      appId: this.config.appId,
      companyId: this.config.companyId
    });

    if (!response.success) {
      throw new Error(`Failed to create schema ${this.schemaName}: ${response.error}`);
    }
  }

  /**
   * Execute database query
   */
  async query(
    tableName: string,
    operation: 'select' | 'insert' | 'update' | 'delete',
    options: any
  ): Promise<ApiResponse> {
    return this.apiCall('POST', '/query', {
      schemaName: this.schemaName,
      tableName,
      operation,
      options
    });
  }

  /**
   * Make API call to MetricsHub backend
   */
  private async apiCall(
    method: 'GET' | 'POST',
    endpoint: string,
    data?: any
  ): Promise<ApiResponse> {
    const baseUrl = this.config.apiBaseUrl || 'https://metrics-hub-six.vercel.app';
    const mode = this.config.mode || 'production';
    const fullUrl = `${baseUrl}/api/proxy/sdk/${mode}${endpoint}`;

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'X-MetricsHub-App-ID': this.config.appId,
    };

    if (this.config.companyToken) {
      headers['Authorization'] = `Bearer ${this.config.companyToken}`;
    }

    if (this.config.apiKey) {
      headers['X-MetricsHub-API-Key'] = this.config.apiKey;
    }

    if (this.config.companyId) {
      headers['X-MetricsHub-Company-ID'] = this.config.companyId;
    }

    try {
      const response = await fetch(fullUrl, {
        method,
        headers,
        body: method === 'POST' ? JSON.stringify(data) : undefined,
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || `HTTP ${response.status}`);
      }

      return result;
    } catch (error) {
      console.error(`API call failed: ${method} ${endpoint}`, error);
      throw error;
    }
  }

  /**
   * Serialize Zod schema for API transmission
   */
  private serializeZodSchema(zodSchema: z.ZodObject<any>): any {
    // This would normally use the schema serialization logic
    // For now, return a simplified version
    return {
      shape: Object.keys(zodSchema.shape),
      description: zodSchema.description
    };
  }
}

/**
 * Implementation of TableOperations interface
 */
class TableOperationsImpl<T> implements TableOperations<T> {
  constructor(
    private tableName: string,
    private zodSchema: z.ZodObject<any>,
    private schemaInstance: MetricsHubSchemaInstance<any>,
    private dbManager: DatabaseManager
  ) {}

  async select(options?: QueryOptions): Promise<T[]> {
    await this.dbManager.ensureTable(this.tableName, this.zodSchema);
    
    const response = await this.dbManager.query(this.tableName, 'select', options);
    
    if (!response.success) {
      throw new Error(response.error || 'Select operation failed');
    }

    return response.data || [];
  }

  async selectOne(options?: QueryOptions): Promise<T | null> {
    const results = await this.select({ ...options, limit: 1 });
    return results.length > 0 ? results[0] : null;
  }

  async insert(data: Partial<T>): Promise<T> {
    await this.dbManager.ensureTable(this.tableName, this.zodSchema);
    
    // Validate data with Zod schema
    const validatedData = this.zodSchema.parse(data);
    
    const response = await this.dbManager.query(this.tableName, 'insert', {
      data: validatedData
    });
    
    if (!response.success) {
      throw new Error(response.error || 'Insert operation failed');
    }

    return response.data;
  }

  async insertMany(data: Partial<T>[]): Promise<T[]> {
    await this.dbManager.ensureTable(this.tableName, this.zodSchema);
    
    // Validate all data
    const validatedData = data.map(item => this.zodSchema.parse(item));
    
    const response = await this.dbManager.query(this.tableName, 'insert', {
      data: validatedData,
      multiple: true
    });
    
    if (!response.success) {
      throw new Error(response.error || 'Insert many operation failed');
    }

    return response.data || [];
  }

  async update(id: string, data: Partial<T>): Promise<T> {
    await this.dbManager.ensureTable(this.tableName, this.zodSchema);
    
    const response = await this.dbManager.query(this.tableName, 'update', {
      where: [{ column: 'id', operator: 'eq', value: id }],
      data
    });
    
    if (!response.success) {
      throw new Error(response.error || 'Update operation failed');
    }

    return response.data;
  }

  async updateWhere(where: WhereCondition[], data: Partial<T>): Promise<T[]> {
    await this.dbManager.ensureTable(this.tableName, this.zodSchema);
    
    const response = await this.dbManager.query(this.tableName, 'update', {
      where,
      data,
      returnAll: true
    });
    
    if (!response.success) {
      throw new Error(response.error || 'Update where operation failed');
    }

    return response.data || [];
  }

  async delete(id: string): Promise<boolean> {
    await this.dbManager.ensureTable(this.tableName, this.zodSchema);
    
    const response = await this.dbManager.query(this.tableName, 'delete', {
      where: [{ column: 'id', operator: 'eq', value: id }]
    });
    
    return response.success;
  }

  async deleteWhere(where: WhereCondition[]): Promise<number> {
    await this.dbManager.ensureTable(this.tableName, this.zodSchema);
    
    const response = await this.dbManager.query(this.tableName, 'delete', {
      where,
      returnCount: true
    });
    
    if (!response.success) {
      throw new Error(response.error || 'Delete where operation failed');
    }

    return response.data?.deletedCount || 0;
  }

  async count(where?: WhereCondition[]): Promise<number> {
    await this.dbManager.ensureTable(this.tableName, this.zodSchema);
    
    const response = await this.dbManager.query(this.tableName, 'select', {
      count: true,
      where
    });
    
    if (!response.success) {
      throw new Error(response.error || 'Count operation failed');
    }

    return response.data?.count || 0;
  }
}