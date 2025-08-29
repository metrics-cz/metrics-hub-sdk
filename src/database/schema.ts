import { z } from 'zod';
import { SchemaDefinition } from '../types/database';

/**
 * MetricsHub Schema Definition Builder
 */
export class MetricsHubSchema {
  /**
   * Define a schema with tables
   */
  static define<T extends Record<string, z.ZodObject<any>>>(
    tables: T,
    options?: {
      version?: number;
    }
  ): MetricsHubSchemaInstance<T> {
    return new MetricsHubSchemaInstance(tables, options);
  }
}

/**
 * Schema instance with type-safe table access
 */
export class MetricsHubSchemaInstance<T extends Record<string, z.ZodObject<any>>> {
  public readonly tables: T;
  public readonly version: number;

  constructor(
    tables: T,
    options?: {
      version?: number;
    }
  ) {
    this.tables = tables;
    this.version = options?.version || 1;
  }

  /**
   * Get table names
   */
  getTableNames(): string[] {
    return Object.keys(this.tables);
  }

  /**
   * Validate data against a specific table schema
   */
  validateTableData<K extends keyof T>(
    tableName: K,
    data: unknown
  ): z.infer<T[K]> {
    return this.tables[tableName].parse(data);
  }

  /**
   * Convert schema to serializable format for API transmission
   */
  toSerializable(): SerializableSchema {
    const serializableTables: Record<string, any> = {};
    
    for (const [tableName, zodSchema] of Object.entries(this.tables)) {
      serializableTables[tableName] = {
        shape: this.serializeZodObject(zodSchema),
        description: zodSchema.description
      };
    }

    return {
      tables: serializableTables,
      version: this.version
    };
  }

  /**
   * Serialize Zod object for transmission
   */
  private serializeZodObject(zodSchema: z.ZodObject<any>): any {
    const shape = zodSchema.shape;
    const serializedShape: Record<string, any> = {};

    for (const [fieldName, zodType] of Object.entries(shape)) {
      serializedShape[fieldName] = this.serializeZodType(zodType as z.ZodTypeAny);
    }

    return serializedShape;
  }

  /**
   * Serialize individual Zod type
   */
  private serializeZodType(zodType: z.ZodTypeAny): any {
    const result: any = {
      type: zodType.constructor.name,
      optional: false,
      nullable: false,
      description: zodType.description
    };

    // Handle optional
    if (zodType instanceof z.ZodOptional) {
      result.optional = true;
      zodType = zodType._def.innerType;
    }

    // Handle nullable
    if (zodType instanceof z.ZodNullable) {
      result.nullable = true;
      zodType = zodType._def.innerType;
    }

    // Handle default
    if (zodType instanceof z.ZodDefault) {
      result.hasDefault = true;
      result.defaultValue = zodType._def.defaultValue();
      zodType = zodType._def.innerType;
    }

    // Handle specific types
    if (zodType instanceof z.ZodString) {
      result.zodType = 'string';
      result.checks = zodType._def.checks;
    } else if (zodType instanceof z.ZodNumber) {
      result.zodType = 'number';
      result.checks = zodType._def.checks;
    } else if (zodType instanceof z.ZodBoolean) {
      result.zodType = 'boolean';
    } else if (zodType instanceof z.ZodDate) {
      result.zodType = 'date';
    } else if (zodType instanceof z.ZodObject) {
      result.zodType = 'object';
      result.shape = this.serializeZodObject(zodType);
    } else if (zodType instanceof z.ZodArray) {
      result.zodType = 'array';
      result.element = this.serializeZodType(zodType._def.type);
    } else if (zodType instanceof z.ZodRecord) {
      result.zodType = 'record';
      result.valueType = this.serializeZodType(zodType._def.valueType);
    } else if (zodType instanceof z.ZodEnum) {
      result.zodType = 'enum';
      result.values = zodType._def.values;
    } else if (zodType instanceof z.ZodLiteral) {
      result.zodType = 'literal';
      result.value = zodType._def.value;
    } else {
      result.zodType = 'unknown';
    }

    return result;
  }
}

/**
 * Serializable schema format for API transmission
 */
export interface SerializableSchema {
  tables: Record<string, {
    shape: any;
    description?: string;
  }>;
  version: number;
}

/**
 * Type helpers for extracting types from schema
 */
export type InferSchemaTypes<T extends MetricsHubSchemaInstance<any>> = {
  [K in keyof T['tables']]: z.infer<T['tables'][K]>;
};

export type InferTableType<T extends MetricsHubSchemaInstance<any>, K extends keyof T['tables']> = z.infer<T['tables'][K]>;