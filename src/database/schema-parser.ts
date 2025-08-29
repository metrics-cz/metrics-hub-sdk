import { z } from 'zod';
import { 
  PostgreSQLType, 
  ColumnDefinition, 
  TableDefinition, 
  IndexDefinition,
  ConstraintDefinition 
} from '../types/database';

export class ZodSchemaParser {
  /**
   * Converts a Zod schema object to PostgreSQL DDL
   */
  static toPostgreSQL(zodSchema: z.ZodObject<any>, tableName: string): string {
    const tableDefinition = this.parseZodObject(zodSchema, tableName);
    return this.generateCreateTableSQL(tableDefinition);
  }

  /**
   * Parse Zod object schema to table definition
   */
  static parseZodObject(zodSchema: z.ZodObject<any>, tableName: string): TableDefinition {
    const shape = zodSchema.shape;
    const columns: ColumnDefinition[] = [];
    const indexes: IndexDefinition[] = [];
    const constraints: ConstraintDefinition[] = [];

    // Always add standard columns
    columns.push({
      name: 'id',
      type: 'UUID',
      nullable: false,
      primaryKey: true,
      defaultValue: 'gen_random_uuid()'
    });

    // Parse each field in the schema
    for (const [fieldName, zodType] of Object.entries(shape)) {
      const column = this.parseZodType(fieldName, zodType as z.ZodTypeAny);
      columns.push(column);

      // Add indexes for certain types
      if (this.shouldCreateIndex(fieldName, zodType as z.ZodTypeAny)) {
        indexes.push({
          name: `idx_${tableName}_${fieldName}`,
          columns: [fieldName]
        });
      }

      // Handle references/foreign keys
      const reference = this.extractReference(fieldName, zodType as z.ZodTypeAny);
      if (reference) {
        constraints.push({
          name: `fk_${tableName}_${fieldName}`,
          type: 'foreign_key',
          definition: `FOREIGN KEY (${fieldName}) REFERENCES ${reference.table}(${reference.column})`
        });
      }
    }

    // Always add timestamps
    columns.push(
      {
        name: 'created_at',
        type: 'TIMESTAMP WITH TIME ZONE',
        nullable: false,
        defaultValue: 'NOW()'
      },
      {
        name: 'updated_at',
        type: 'TIMESTAMP WITH TIME ZONE',
        nullable: false,
        defaultValue: 'NOW()'
      }
    );

    return {
      name: tableName,
      columns,
      indexes,
      constraints
    };
  }

  /**
   * Convert Zod type to PostgreSQL column definition
   */
  static parseZodType(fieldName: string, zodType: z.ZodTypeAny): ColumnDefinition {
    let type: PostgreSQLType = 'TEXT';
    let nullable = true;
    let defaultValue: string | undefined;
    let unique = false;

    // Handle optional types
    if (zodType._def?.typeName === 'ZodOptional') {
      nullable = true;
      zodType = zodType._def.innerType;
    }

    // Handle default values
    if (zodType._def?.typeName === 'ZodDefault') {
      const defaultVal = zodType._def.defaultValue();
      if (typeof defaultVal === 'function') {
        // Handle function defaults like () => new Date()
        if (defaultVal.toString().includes('new Date')) {
          defaultValue = 'NOW()';
        }
      } else {
        defaultValue = this.formatDefaultValue(defaultVal);
      }
      zodType = zodType._def.innerType;
      nullable = false; // Has default, so not nullable
    }

    // Map Zod types to PostgreSQL types using _def.typeName for better compatibility
    const typeName = zodType._def?.typeName;
    
    if (typeName === 'ZodString') {
      type = this.getStringType(zodType as any);
    } else if (typeName === 'ZodNumber') {
      type = this.getNumberType(zodType as any);
    } else if (typeName === 'ZodBoolean') {
      type = 'BOOLEAN';
    } else if (typeName === 'ZodDate') {
      type = 'TIMESTAMP WITH TIME ZONE';
    } else if (typeName === 'ZodObject' || typeName === 'ZodRecord' || typeName === 'ZodArray') {
      type = 'JSONB';
    } else if (typeName === 'ZodEnum') {
      type = 'TEXT'; // We'll add CHECK constraint for enum values
    } else {
      type = 'TEXT'; // Fallback
    }

    return {
      name: fieldName,
      type,
      nullable,
      defaultValue,
      unique
    };
  }

  /**
   * Determine string type based on Zod string constraints
   */
  private static getStringType(zodString: z.ZodString): PostgreSQLType {
    if (zodString._def.checks) {
      for (const check of zodString._def.checks) {
        if (check.kind === 'max' && check.value <= 255) {
          return 'VARCHAR';
        }
        if (check.kind === 'uuid') {
          return 'UUID';
        }
      }
    }
    return 'TEXT';
  }

  /**
   * Determine number type based on Zod number constraints
   */
  private static getNumberType(zodNumber: z.ZodNumber): PostgreSQLType {
    if (zodNumber._def.checks) {
      for (const check of zodNumber._def.checks) {
        if (check.kind === 'int') {
          return 'INTEGER';
        }
        if (check.kind === 'finite') {
          return 'NUMERIC';
        }
      }
    }
    return 'NUMERIC';
  }

  /**
   * Format default value for PostgreSQL
   */
  private static formatDefaultValue(value: any): string {
    if (typeof value === 'string') {
      return `'${value.replace(/'/g, "''")}'`;
    }
    if (typeof value === 'number' || typeof value === 'boolean') {
      return value.toString();
    }
    if (value instanceof Date) {
      return `'${value.toISOString()}'`;
    }
    if (typeof value === 'object') {
      return `'${JSON.stringify(value).replace(/'/g, "''")}'::jsonb`;
    }
    return `'${String(value).replace(/'/g, "''")}'`;
  }

  /**
   * Check if field should have an index
   */
  private static shouldCreateIndex(fieldName: string, zodType: z.ZodTypeAny): boolean {
    // Create indexes for common query fields
    const indexFields = ['email', 'name', 'status', 'type', 'category', 'user_id', 'company_id'];
    if (indexFields.includes(fieldName)) {
      return true;
    }

    // Create index for fields ending with _id (foreign keys)
    if (fieldName.endsWith('_id')) {
      return true;
    }

    return false;
  }

  /**
   * Extract foreign key reference from field name pattern
   */
  private static extractReference(fieldName: string, zodType: z.ZodTypeAny): { table: string; column: string } | null {
    // Auto-detect based on field name pattern (e.g., user_id -> users.id)
    if (fieldName.endsWith('_id') && fieldName !== 'id') {
      const referencedTable = fieldName.slice(0, -3); // Remove '_id'
      const pluralTable = this.pluralize(referencedTable);
      return {
        table: pluralTable,
        column: 'id'
      };
    }

    // Handle company_id specially
    if (fieldName === 'company_id') {
      return {
        table: 'companies',
        column: 'id'
      };
    }

    return null;
  }

  /**
   * Simple pluralization for table names
   */
  private static pluralize(singular: string): string {
    if (singular.endsWith('y')) {
      return singular.slice(0, -1) + 'ies';
    }
    if (singular.endsWith('s') || singular.endsWith('sh') || singular.endsWith('ch') || singular.endsWith('x') || singular.endsWith('z')) {
      return singular + 'es';
    }
    return singular + 's';
  }

  /**
   * Generate CREATE TABLE SQL from table definition
   */
  static generateCreateTableSQL(tableDef: TableDefinition): string {
    const columns = tableDef.columns.map(col => {
      let sql = `"${col.name}" ${col.type}`;
      
      if (!col.nullable) {
        sql += ' NOT NULL';
      }
      
      if (col.defaultValue) {
        sql += ` DEFAULT ${col.defaultValue}`;
      }
      
      if (col.unique && !col.primaryKey) {
        sql += ' UNIQUE';
      }
      
      return sql;
    }).join(',\n    ');

    let sql = `CREATE TABLE IF NOT EXISTS "${tableDef.name}" (\n    ${columns}`;

    // Add constraints
    if (tableDef.constraints && tableDef.constraints.length > 0) {
      const constraints = tableDef.constraints.map(constraint => 
        `CONSTRAINT ${constraint.name} ${constraint.definition}`
      ).join(',\n    ');
      sql += `,\n    ${constraints}`;
    }

    sql += '\n);';

    // Add indexes
    if (tableDef.indexes && tableDef.indexes.length > 0) {
      const indexes = tableDef.indexes.map(index => {
        const uniqueStr = index.unique ? 'UNIQUE ' : '';
        return `CREATE ${uniqueStr}INDEX IF NOT EXISTS "${index.name}" ON "${tableDef.name}" (${index.columns.map(c => `"${c}"`).join(', ')});`;
      }).join('\n');
      sql += '\n\n' + indexes;
    }

    // Add updated_at trigger
    sql += `\n\n-- Add updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_${tableDef.name}_updated_at ON "${tableDef.name}";
CREATE TRIGGER update_${tableDef.name}_updated_at 
    BEFORE UPDATE ON "${tableDef.name}" 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();`;

    return sql;
  }

  /**
   * Generate schema name for app and company
   */
  static generateSchemaName(appId: string, companyId: string): string {
    // Clean and sanitize IDs for use in schema names
    const cleanAppId = appId.replace(/[^a-zA-Z0-9_]/g, '_').toLowerCase();
    const cleanCompanyId = companyId.replace(/[^a-zA-Z0-9_]/g, '_');
    return `app_${cleanAppId}_company_${cleanCompanyId}`;
  }

  /**
   * Generate CREATE SCHEMA SQL
   */
  static generateCreateSchemaSQL(schemaName: string): string {
    return `CREATE SCHEMA IF NOT EXISTS "${schemaName}";`;
  }
}