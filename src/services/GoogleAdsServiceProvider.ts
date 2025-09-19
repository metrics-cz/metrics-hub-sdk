/**
 * Google Ads Service Provider
 *
 * Implements the ServiceProviderInterface for Google Ads with proper MCC hierarchy support.
 * Uses the Funnel.io/Make.com pattern for accessing child accounts through parent MCC credentials.
 */

import {
  ServiceProviderInterface,
  ServiceAccount,
  ServiceHierarchy,
  ServiceProviderConfig,
  ServiceDataRequest,
  ServiceDataResponse
} from './ServiceProviderInterface';
import { BaseClient } from './BaseClient';
import { PluginConfig } from '../types';

interface GoogleAdsAccount {
  customerId: string;
  descriptiveName: string;
  manager: boolean;
  status: string;
  currencyCode: string;
  testAccount: boolean;
  timeZone: string;
}

interface GoogleAdsMCCRelationship {
  managerId: string;
  childId: string;
  status: string;
}

export class GoogleAdsServiceProvider extends ServiceProviderInterface {
  private client: BaseClient;

  constructor(config: ServiceProviderConfig) {
    super(config);
    // Convert ServiceProviderConfig to PluginConfig for BaseClient
    const pluginConfig: PluginConfig = {
      companyId: config.companyId,
      apiBaseUrl: (typeof window !== 'undefined' && (window as any).NEXT_PUBLIC_API_URL) || '',
      debug: true
    };
    this.client = new BaseClient(pluginConfig);
  }

  /**
   * Custom HTTP request method for service provider operations
   */
  private async makeHttpRequest<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const baseUrl = (typeof window !== 'undefined' && (window as any).NEXT_PUBLIC_API_URL) || '';
    const url = `${baseUrl}${endpoint}`;

    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      }
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    return await response.json();
  }

  /**
   * Discover all accessible accounts using proper MCC hierarchy traversal
   * This implements the Funnel.io/Make.com pattern for comprehensive account access
   */
  async discoverAccounts(): Promise<ServiceHierarchy> {
    console.log('[GoogleAds-SP] Starting comprehensive account discovery');

    try {
      // Step 1: Get all directly accessible accounts
      const directAccounts = await this.getDirectlyAccessibleAccounts();
      console.log(`[GoogleAds-SP] Found ${directAccounts.length} directly accessible accounts`);

      // Step 2: Identify MCC accounts and perform hierarchy traversal
      const mccAccounts = directAccounts.filter(acc => acc.manager);
      console.log(`[GoogleAds-SP] Found ${mccAccounts.length} MCC accounts for hierarchy traversal`);

      // Step 3: Traverse MCC hierarchy to find all child accounts
      const allAccounts = new Map<string, ServiceAccount>();
      const relationships = new Map<string, string>();
      const accessMatrix = new Map<string, string[]>();

      // Add direct accounts first
      for (const account of directAccounts) {
        const serviceAccount = this.convertToServiceAccount(account);
        allAccounts.set(account.customerId, serviceAccount);
      }

      // Step 4: For each MCC, discover child accounts using parent credentials
      for (const mccAccount of mccAccounts) {
        console.log(`[GoogleAds-SP] Traversing MCC ${mccAccount.customerId} for child accounts`);

        try {
          const childAccounts = await this.getChildAccountsWithMCCCredentials(mccAccount.customerId);
          console.log(`[GoogleAds-SP] Found ${childAccounts.length} child accounts under MCC ${mccAccount.customerId}`);

          const accessibleChildIds: string[] = [];

          for (const childAccount of childAccounts) {
            const serviceAccount = this.convertToServiceAccount(childAccount, mccAccount.customerId);

            // Only add if not already discovered through direct access
            if (!allAccounts.has(childAccount.customerId)) {
              allAccounts.set(childAccount.customerId, serviceAccount);
            }

            // Track relationship
            relationships.set(childAccount.customerId, mccAccount.customerId);
            accessibleChildIds.push(childAccount.customerId);

            // Recursively check if this child is also an MCC
            if (childAccount.manager) {
              console.log(`[GoogleAds-SP] Child account ${childAccount.customerId} is also an MCC, checking its children`);
              await this.traverseSubMCC(childAccount.customerId, mccAccount.customerId, allAccounts, relationships, accessMatrix);
            }
          }

          accessMatrix.set(mccAccount.customerId, accessibleChildIds);

        } catch (error: any) {
          console.warn(`[GoogleAds-SP] Failed to traverse MCC ${mccAccount.customerId}:`, error?.message || error);
          // Continue with other MCCs even if one fails
        }
      }

      const hierarchy: ServiceHierarchy = {
        rootAccounts: Array.from(allAccounts.values()).filter(acc => !relationships.has(acc.id)),
        relationships,
        accessMatrix,
        totalAccounts: allAccounts.size,
        discoveryMethod: 'hierarchy_traversal'
      };

      console.log(`[GoogleAds-SP] Comprehensive discovery complete:`, {
        totalAccounts: hierarchy.totalAccounts,
        rootAccounts: hierarchy.rootAccounts.length,
        mccRelationships: relationships.size,
        directAccess: directAccounts.length
      });

      return hierarchy;

    } catch (error: any) {
      console.error('[GoogleAds-SP] Error during account discovery:', error);
      throw new Error(`Failed to discover Google Ads accounts: ${error?.message || error}`);
    }
  }

  /**
   * Get child accounts using parent MCC credentials (Funnel.io pattern)
   */
  private async getChildAccountsWithMCCCredentials(mccId: string): Promise<GoogleAdsAccount[]> {
    const endpoint = `/api/proxy/google-ads/mcc-children`;
    const response = await this.makeHttpRequest<{accounts: GoogleAdsAccount[]}>(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        companyId: this.config.companyId,
        mccCustomerId: mccId,
        useParentCredentials: true, // Key: use parent MCC credentials for access
      })
    });

    return response.accounts || [];
  }

  /**
   * Recursively traverse sub-MCC hierarchies
   */
  private async traverseSubMCC(
    subMccId: string,
    rootMccId: string,
    allAccounts: Map<string, ServiceAccount>,
    relationships: Map<string, string>,
    accessMatrix: Map<string, string[]>
  ): Promise<void> {
    try {
      const childAccounts = await this.getChildAccountsWithMCCCredentials(subMccId);
      const accessibleChildIds: string[] = [];

      for (const childAccount of childAccounts) {
        const serviceAccount = this.convertToServiceAccount(childAccount, subMccId);

        if (!allAccounts.has(childAccount.customerId)) {
          allAccounts.set(childAccount.customerId, serviceAccount);
        }

        relationships.set(childAccount.customerId, subMccId);
        accessibleChildIds.push(childAccount.customerId);

        // Continue recursion for nested MCCs
        if (childAccount.manager) {
          await this.traverseSubMCC(childAccount.customerId, rootMccId, allAccounts, relationships, accessMatrix);
        }
      }

      accessMatrix.set(subMccId, accessibleChildIds);

    } catch (error: any) {
      console.warn(`[GoogleAds-SP] Failed to traverse sub-MCC ${subMccId}:`, error?.message || error);
    }
  }

  /**
   * Get directly accessible accounts (traditional method)
   */
  private async getDirectlyAccessibleAccounts(): Promise<GoogleAdsAccount[]> {
    const endpoint = `/api/proxy/google-ads/accounts`;
    const response = await this.makeHttpRequest<{accounts: GoogleAdsAccount[]}>(endpoint, {
      method: 'GET'
    });
    return response.accounts || [];
  }

  /**
   * Convert Google Ads account to universal ServiceAccount format
   */
  private convertToServiceAccount(account: GoogleAdsAccount, parentId?: string): ServiceAccount {
    const hasGenericName = !account.descriptiveName ||
                          account.descriptiveName.startsWith('Account ') ||
                          account.descriptiveName.trim() === '' ||
                          account.descriptiveName === account.customerId;

    const serviceAccount: ServiceAccount = {
      id: account.customerId,
      name: account.descriptiveName,
      displayName: hasGenericName ? this.enhanceAccountName({
        id: account.customerId,
        name: account.descriptiveName,
        type: account.manager ? 'manager' : 'account'
      } as ServiceAccount) : account.descriptiveName,
      type: account.manager ? 'manager' : 'account',
      status: account.status.toLowerCase() as 'active' | 'suspended' | 'disabled',
      parentId,
      permissions: account.manager ? ['read', 'manage_children'] : ['read'],
      metadata: {
        platform: 'google_ads',
        originalName: account.descriptiveName,
        hasGenericName,
        hierarchy: {
          level: parentId ? 1 : 0,
          path: parentId ? [parentId, account.customerId] : [account.customerId]
        },
        accountDetails: {
          currencyCode: account.currencyCode,
          timeZone: account.timeZone,
          testAccount: account.testAccount
        }
      }
    };

    return serviceAccount;
  }

  async getAccountDetails(accountId: string): Promise<ServiceAccount> {
    const endpoint = `/api/proxy/google-ads/account-details`;
    const response = await this.makeHttpRequest<{account: GoogleAdsAccount}>(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        companyId: this.config.companyId,
        customerId: accountId
      })
    });

    return this.convertToServiceAccount(response.account);
  }

  async fetchAccountData<T>(request: ServiceDataRequest): Promise<ServiceDataResponse<T>> {
    const endpoint = this.getDataEndpoint(request.dataType);
    const requestBody: any = {
      companyId: this.config.companyId,
      customerId: request.accountId,
      ...request.filters
    };

    // Use parent account credentials for child account access (Funnel.io pattern)
    if (request.parentAccountId) {
      requestBody.loginCustomerId = request.parentAccountId;
    }

    const response = await this.makeHttpRequest<any>(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody)
    });

    return {
      success: response.success,
      data: response[request.dataType] || response.data || [],
      total: response.total || 0,
      accountInfo: {
        accountId: request.accountId,
        accountName: response.accountName || request.accountId,
        accessMethod: request.parentAccountId ? 'parent_mcc' : 'direct'
      },
      metadata: {
        fetchedAt: new Date(),
        cached: false,
        permissions: ['read']
      }
    };
  }

  private getDataEndpoint(dataType: string): string {
    switch (dataType) {
      case 'campaigns':
        return '/api/plugins/google/ads/campaigns';
      case 'keywords':
        return '/api/plugins/google/ads/keywords';
      default:
        throw new Error(`Unsupported data type: ${dataType}`);
    }
  }

  async testAccess(accountId: string): Promise<{
    accessible: boolean;
    method: 'direct' | 'parent_credentials' | 'delegated';
    permissions: string[];
    errors?: string[];
  }> {
    try {
      await this.getAccountDetails(accountId);
      return {
        accessible: true,
        method: 'direct',
        permissions: ['read']
      };
    } catch (error: any) {
      return {
        accessible: false,
        method: 'direct',
        permissions: [],
        errors: [error?.message || String(error)]
      };
    }
  }

  async getChildAccounts(managerId: string): Promise<ServiceAccount[]> {
    const accounts = await this.getChildAccountsWithMCCCredentials(managerId);
    return accounts.map(account => this.convertToServiceAccount(account, managerId));
  }

  async validateCredentials(): Promise<{
    valid: boolean;
    expiresAt?: Date;
    scopes: string[];
    refreshed?: boolean;
  }> {
    try {
      const endpoint = `/api/auth/validate-google-ads`;
      const response = await this.makeHttpRequest<any>(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          companyId: this.config.companyId
        })
      });

      return {
        valid: response.valid,
        expiresAt: response.expiresAt ? new Date(response.expiresAt) : undefined,
        scopes: response.scopes || [],
        refreshed: response.refreshed
      };
    } catch (error) {
      return {
        valid: false,
        scopes: []
      };
    }
  }
}