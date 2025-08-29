import { z } from 'zod';

// Extended configuration for database functionality
export interface MetricsHubConfig {
  appId: string;
  companyId: string;
  companyToken?: string;
  mode?: 'development' | 'production' | 'local';
  apiKey?: string;
  apiBaseUrl?: string;
  databaseUrl?: string; // For local mode
  debug?: boolean;
}

// Schema Definition Types
export interface TableSchema {
  [key: string]: z.ZodTypeAny;
}

export interface SchemaDefinition {
  tables: {
    [tableName: string]: z.ZodObject<any>;
  };
  version?: number;
}

// Database Operation Types
export interface QueryOptions {
  select?: string | string[];
  where?: WhereCondition[];
  orderBy?: OrderByCondition[];
  limit?: number;
  offset?: number;
}

export interface WhereCondition {
  column: string;
  operator: 'eq' | 'neq' | 'gt' | 'gte' | 'lt' | 'lte' | 'like' | 'ilike' | 'in' | 'is' | 'not';
  value: any;
}

export interface OrderByCondition {
  column: string;
  direction: 'asc' | 'desc';
}

// API Response Types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// Database Table Operations
export interface TableOperations<T> {
  select(options?: QueryOptions): Promise<T[]>;
  selectOne(options?: QueryOptions): Promise<T | null>;
  insert(data: Partial<T>): Promise<T>;
  insertMany(data: Partial<T>[]): Promise<T[]>;
  update(id: string, data: Partial<T>): Promise<T>;
  updateWhere(where: WhereCondition[], data: Partial<T>): Promise<T[]>;
  delete(id: string): Promise<boolean>;
  deleteWhere(where: WhereCondition[]): Promise<number>;
  count(where?: WhereCondition[]): Promise<number>;
}

// PostgreSQL Type Mapping
export type PostgreSQLType = 
  | 'TEXT'
  | 'VARCHAR'
  | 'INTEGER'
  | 'BIGINT'
  | 'NUMERIC'
  | 'DECIMAL'
  | 'BOOLEAN'
  | 'DATE'
  | 'TIME'
  | 'TIMESTAMP'
  | 'TIMESTAMP WITH TIME ZONE'
  | 'JSONB'
  | 'JSON'
  | 'UUID'
  | 'BYTEA';

export interface ColumnDefinition {
  name: string;
  type: PostgreSQLType;
  nullable: boolean;
  defaultValue?: string;
  primaryKey?: boolean;
  unique?: boolean;
  references?: {
    table: string;
    column: string;
  };
}

export interface TableDefinition {
  name: string;
  columns: ColumnDefinition[];
  indexes?: IndexDefinition[];
  constraints?: ConstraintDefinition[];
}

export interface IndexDefinition {
  name: string;
  columns: string[];
  unique?: boolean;
  type?: 'btree' | 'gin' | 'gist' | 'hash';
}

export interface ConstraintDefinition {
  name: string;
  type: 'check' | 'foreign_key' | 'unique' | 'primary_key';
  definition: string;
}