import { 
  GoogleAdsCampaignsResponse, 
  GoogleAdsKeywordsResponse,
  GoogleAdsAccountsResponse,
  GoogleAdsCustomersResponse,
  GoogleAdsAccountDetailsResponse,
  GoogleAdsHierarchyResponse,
  GoogleAdsAccount,
  AccountHierarchy
} from '../types/google-ads';
import { BaseClient } from './BaseClient';

export class GoogleAdsClient extends BaseClient {
    async getCampaigns(customerId: string): Promise<GoogleAdsCampaignsResponse> {
      const params = new URLSearchParams({
        companyId: this.config.companyId,
        customerId
      })

      const endpoint = `/api/plugins/google/ads/campaigns?${params.toString()}`
      return this.makeRequest<GoogleAdsCampaignsResponse>(endpoint)
    }

    async getKeywords(customerId: string, options: {
      campaignId?: string
      adGroupId?: string
    } = {}): Promise<GoogleAdsKeywordsResponse> {
      const params = new URLSearchParams({
        companyId: this.config.companyId,
        customerId
      })

      if (options.campaignId) {
        params.set('campaignId', options.campaignId)
      }

      if (options.adGroupId) {
        params.set('adGroupId', options.adGroupId)
      }

      const endpoint = `/api/plugins/google/ads/keywords?${params.toString()}`
      return this.makeRequest<GoogleAdsKeywordsResponse>(endpoint)
    }

    // Account Management Methods
    async getAccessibleCustomers(): Promise<GoogleAdsCustomersResponse> {
      const params = new URLSearchParams({
        companyId: this.config.companyId
      })

      const endpoint = `/api/plugins/google/ads/customers?${params.toString()}`
      return this.makeRequest<GoogleAdsCustomersResponse>(endpoint)
    }

    async getAccountDetails(customerId: string): Promise<GoogleAdsAccountDetailsResponse> {
      const params = new URLSearchParams({
        companyId: this.config.companyId,
        customerId
      })

      const endpoint = `/api/plugins/google/ads/account-details?${params.toString()}`
      return this.makeRequest<GoogleAdsAccountDetailsResponse>(endpoint)
    }

    async listAllAccounts(): Promise<GoogleAdsAccountsResponse> {
      const params = new URLSearchParams({
        companyId: this.config.companyId
      })

      const endpoint = `/api/plugins/google/ads/accounts?${params.toString()}`
      return this.makeRequest<GoogleAdsAccountsResponse>(endpoint)
    }

    async getAccountHierarchy(managerId?: string): Promise<GoogleAdsHierarchyResponse> {
      const params = new URLSearchParams({
        companyId: this.config.companyId
      })
      
      if (managerId) {
        params.set('managerId', managerId)
      }

      const endpoint = `/api/plugins/google/ads/account-hierarchy?${params.toString()}`
      return this.makeRequest<GoogleAdsHierarchyResponse>(endpoint)
    }

    async getMCCAccounts(): Promise<GoogleAdsAccountsResponse> {
      const params = new URLSearchParams({
        companyId: this.config.companyId,
        managerOnly: 'true'
      })

      const endpoint = `/api/plugins/google/ads/accounts?${params.toString()}`
      return this.makeRequest<GoogleAdsAccountsResponse>(endpoint)
    }

    async getChildAccounts(mccId: string): Promise<GoogleAdsAccountsResponse> {
      const params = new URLSearchParams({
        companyId: this.config.companyId,
        parentCustomerId: mccId
      })

      const endpoint = `/api/plugins/google/ads/child-accounts?${params.toString()}`
      return this.makeRequest<GoogleAdsAccountsResponse>(endpoint)
    }

    /**
     * Get all accessible accounts including MCC client accounts
     * This method combines direct accounts + all MCC client accounts for comprehensive access
     */
    async getAllAccountsWithMCCClients(): Promise<GoogleAdsAccount[]> {
      try {
        console.log('[SDK-GADS] Fetching all accounts including MCC clients');

        // Step 1: Get all directly accessible accounts
        const directAccountsResponse = await this.listAllAccounts();
        if (!directAccountsResponse.success) {
          throw new Error('Failed to get direct accounts');
        }

        const allAccounts: GoogleAdsAccount[] = [...directAccountsResponse.accounts];
        console.log('[SDK-GADS] Found', directAccountsResponse.accounts.length, 'direct accounts');

        // Step 2: Identify MCC accounts and get their client accounts
        const mccAccounts = directAccountsResponse.accounts.filter(account => account.manager);
        console.log('[SDK-GADS] Found', mccAccounts.length, 'MCC accounts');

        for (const mccAccount of mccAccounts) {
          try {
            console.log('[SDK-GADS] Fetching clients for MCC:', mccAccount.descriptiveName, 'ID:', mccAccount.id);

            const childAccountsResponse = await this.getChildAccounts(mccAccount.id);
            if (childAccountsResponse.success && childAccountsResponse.accounts.length > 0) {
              console.log('[SDK-GADS] Found', childAccountsResponse.accounts.length, 'client accounts under', mccAccount.descriptiveName);

              // Add parent MCC info to child accounts for reference
              const clientAccountsWithParent = childAccountsResponse.accounts.map(account => ({
                ...account,
                parentMCC: {
                  id: mccAccount.id,
                  name: mccAccount.descriptiveName
                }
              }));

              allAccounts.push(...clientAccountsWithParent);
            } else {
              console.log('[SDK-GADS] No client accounts found for MCC:', mccAccount.descriptiveName);
            }
          } catch (error) {
            console.warn('[SDK-GADS] Failed to get client accounts for MCC', mccAccount.id, ':', error);
            // Continue with other MCCs even if one fails
          }
        }

        console.log('[SDK-GADS] Total accounts (direct + MCC clients):', allAccounts.length);
        return allAccounts;

      } catch (error) {
        console.error('[SDK-GADS] Error in getAllAccountsWithMCCClients:', error);
        throw error;
      }
    }
  }
