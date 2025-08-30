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
  }
