/**
 * Universal Service Provider Interface
 *
 * This interface defines a common contract for all marketing platform integrations,
 * enabling plugins to work across multiple services (Google Ads, Facebook, LinkedIn, etc.)
 * while maintaining consistent access patterns and hierarchy management.
 */

export interface ServiceAccount {
  id: string;
  name: string;
  displayName: string; // Enhanced name for generic accounts
  type: 'manager' | 'account' | 'sub_account';
  status: 'active' | 'suspended' | 'disabled';
  parentId?: string;
  parentType?: 'manager' | 'sub_manager';
  permissions: string[];
  metadata: {
    platform: string;
    originalName?: string;
    hasGenericName: boolean;
    hierarchy: {
      level: number;
      path: string[];
    };
    lastAccessed?: Date;
    accountDetails?: Record<string, any>;
  };
}

export interface ServiceHierarchy {
  rootAccounts: ServiceAccount[];
  relationships: Map<string, string>; // childId -> parentId
  accessMatrix: Map<string, string[]>; // accountId -> accessibleChildIds
  totalAccounts: number;
  discoveryMethod: 'direct' | 'hierarchy_traversal' | 'parent_credentials';
}

export interface ServiceProviderConfig {
  platform: string;
  companyId: string;
  credentials: {
    accessToken: string;
    refreshToken?: string;
    customerId?: string;
    managerId?: string;
  };
  options: {
    enableHierarchyTraversal: boolean;
    maxDepth: number;
    includeDisabledAccounts: boolean;
    enhanceGenericNames: boolean;
  };
}

export interface ServiceDataRequest {
  accountId: string;
  parentAccountId?: string; // For MCC child account access
  dataType: 'campaigns' | 'keywords' | 'ads' | 'metrics' | 'custom';
  filters?: Record<string, any>;
  dateRange?: {
    startDate: string;
    endDate: string;
  };
}

export interface ServiceDataResponse<T = any> {
  success: boolean;
  data: T[];
  total: number;
  accountInfo: {
    accountId: string;
    accountName: string;
    accessMethod: 'direct' | 'parent_mcc' | 'delegated';
  };
  metadata: {
    fetchedAt: Date;
    cached: boolean;
    permissions: string[];
  };
}

/**
 * Universal Service Provider Interface
 * All marketing platform integrations must implement this interface
 */
export abstract class ServiceProviderInterface {
  protected config: ServiceProviderConfig;

  constructor(config: ServiceProviderConfig) {
    this.config = config;
  }

  /**
   * Discover all accessible accounts using platform-specific hierarchy patterns
   * For Google Ads: Uses MCC hierarchy with login-customer-id pattern
   * For Facebook: Uses Business Manager hierarchy
   * For LinkedIn: Uses Company/Campaign Manager hierarchy
   */
  abstract discoverAccounts(): Promise<ServiceHierarchy>;

  /**
   * Get account details with enhanced naming for generic accounts
   */
  abstract getAccountDetails(accountId: string): Promise<ServiceAccount>;

  /**
   * Fetch data from specific account using appropriate access method
   * Automatically handles parent account credentials for child account access
   */
  abstract fetchAccountData<T>(request: ServiceDataRequest): Promise<ServiceDataResponse<T>>;

  /**
   * Test account access and permissions
   */
  abstract testAccess(accountId: string): Promise<{
    accessible: boolean;
    method: 'direct' | 'parent_credentials' | 'delegated';
    permissions: string[];
    errors?: string[];
  }>;

  /**
   * Get all accessible child accounts for a manager account
   * Uses parent account credentials to access children
   */
  abstract getChildAccounts(managerId: string): Promise<ServiceAccount[]>;

  /**
   * Validate and refresh credentials if needed
   */
  abstract validateCredentials(): Promise<{
    valid: boolean;
    expiresAt?: Date;
    scopes: string[];
    refreshed?: boolean;
  }>;

  // Utility methods
  protected enhanceAccountName(account: ServiceAccount): string {
    if (!account.name ||
        account.name.startsWith('Account ') ||
        account.name.trim() === '' ||
        account.name === account.id) {

      const typeLabel = account.type === 'manager' ? 'Manager' : 'Account';
      const shortId = account.id.substring(0, 6) + '...';
      return `${typeLabel} (${shortId})`;
    }
    return account.name;
  }

  protected buildHierarchyPath(accountId: string, relationships: Map<string, string>): string[] {
    const path: string[] = [accountId];
    let currentId = accountId;

    while (relationships.has(currentId)) {
      const parentId = relationships.get(currentId)!;
      path.unshift(parentId);
      currentId = parentId;
    }

    return path;
  }
}

/**
 * Service Provider Registry
 * Manages all available service providers and enables dynamic provider selection
 */
export class ServiceProviderRegistry {
  private static providers = new Map<string, typeof ServiceProviderInterface>();

  static register(platform: string, providerClass: typeof ServiceProviderInterface) {
    this.providers.set(platform, providerClass);
  }

  static create(platform: string, config: ServiceProviderConfig): ServiceProviderInterface {
    const ProviderClass = this.providers.get(platform);
    if (!ProviderClass) {
      throw new Error(`Service provider for platform '${platform}' not found`);
    }
    return new (ProviderClass as any)(config);
  }

  static getAvailablePlatforms(): string[] {
    return Array.from(this.providers.keys());
  }
}