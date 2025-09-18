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
    async getCampaigns(customerId: string, loginCustomerId?: string): Promise<GoogleAdsCampaignsResponse> {
      const params = new URLSearchParams({
        companyId: this.config.companyId,
        customerId
      })

      // Add MCC context if provided for accessing child accounts
      if (loginCustomerId) {
        params.set('loginCustomerId', loginCustomerId)
      }

      const endpoint = `/api/plugins/google/ads/campaigns?${params.toString()}`
      return this.makeRequest<GoogleAdsCampaignsResponse>(endpoint)
    }

    async getKeywords(customerId: string, options: {
      campaignId?: string
      adGroupId?: string
      loginCustomerId?: string
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

      // Add MCC context if provided for accessing child accounts
      if (options.loginCustomerId) {
        params.set('loginCustomerId', options.loginCustomerId)
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
     * Get campaigns for child account through MCC permissions
     * This method implements the Funnel.io/Make.com pattern for accessing child accounts
     * @param childCustomerId - The child account ID to get campaigns for
     * @param mccCustomerId - The parent MCC account ID to use for permissions
     */
    async getCampaignsForChildAccount(childCustomerId: string, mccCustomerId: string): Promise<GoogleAdsCampaignsResponse> {
      return this.getCampaigns(childCustomerId, mccCustomerId);
    }

    /**
     * Get keywords for child account through MCC permissions
     * @param childCustomerId - The child account ID to get keywords for
     * @param mccCustomerId - The parent MCC account ID to use for permissions
     * @param options - Additional options like campaignId, adGroupId
     */
    async getKeywordsForChildAccount(childCustomerId: string, mccCustomerId: string, options: {
      campaignId?: string
      adGroupId?: string
    } = {}): Promise<GoogleAdsKeywordsResponse> {
      return this.getKeywords(childCustomerId, {
        ...options,
        loginCustomerId: mccCustomerId
      });
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

    /**
     * Get comprehensive accounts list for plugin use with enhanced display names
     * This method is optimized for plugin consumption with all accounts and enhanced naming
     */
    async getAccountsForPlugin(): Promise<GoogleAdsAccount[]> {
      try {
        console.log('[SDK-GADS] Fetching accounts optimized for plugin consumption');

        // Use comprehensive account fetching (all accessible accounts)
        const accountsResponse = await this.listAllAccounts();
        if (!accountsResponse.success) {
          throw new Error('Failed to fetch accounts');
        }

        console.log('[SDK-GADS] Successfully fetched', accountsResponse.accounts.length, 'accounts');

        // Enhance accounts with better display names for generic accounts
        const enhancedAccounts = accountsResponse.accounts.map(account => {
          // Create enhanced copy of account
          const enhancedAccount = { ...account };

          // Check if account has generic name and enhance it
          if (!account.descriptiveName ||
              account.descriptiveName.startsWith('Account ') ||
              account.descriptiveName.trim() === '' ||
              account.descriptiveName === account.id) {

            console.log(`[SDK-GADS] Enhancing account ${account.id} with generic name: "${account.descriptiveName}"`);

            // Create a more descriptive name based on account type and ID
            const accountType = account.manager ? 'MCC' : 'Ads Account';
            const shortId = account.id.substring(0, 6) + '...';

            enhancedAccount.descriptiveName = `${accountType} (${shortId})`;

            // Add flag to indicate this was a generic name that was enhanced
            (enhancedAccount as any).hasGenericName = true;
          } else {
            (enhancedAccount as any).hasGenericName = false;
          }

          return enhancedAccount;
        });

        console.log(`[SDK-GADS] Enhanced ${enhancedAccounts.length} accounts:`, {
          total: enhancedAccounts.length,
          mccAccounts: enhancedAccounts.filter(acc => acc.manager).length,
          withGenericNames: enhancedAccounts.filter(acc => (acc as any).hasGenericName).length
        });

        return enhancedAccounts;

      } catch (error) {
        console.error('[SDK-GADS] Error in getAccountsForPlugin:', error);
        throw error;
      }
    }
  }
