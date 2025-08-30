/**
 * Google Ads API Types
 * 
 * Comprehensive types for Google Ads API integration
 */

// Account Management Types
export interface GoogleAdsAccount {
  id: string;
  resourceName: string;
  descriptiveName: string;
  manager: boolean;
  testAccount: boolean;
  timeZone: string;
  currencyCode: string;
  status: 'ENABLED' | 'SUSPENDED' | 'CLOSED';
  conversionTrackingId?: string;
}

export interface AccountHierarchy {
  managerAccount: GoogleAdsAccount;
  childAccounts: GoogleAdsAccount[];
  depth: number;
}

export interface GoogleAdsAccountsResponse {
  success: boolean;
  accounts: GoogleAdsAccount[];
  total: number;
  hierarchies?: AccountHierarchy[];
}

export interface ConnectionInfo {
  provider: string;
  companyId: string;
  isConnected: boolean;
  lastRefresh?: Date;
  expiresAt?: Date;
  scopes: string[];
  email?: string;
}

// Campaign Types (Enhanced)
export interface GoogleAdsCampaign {
  id: string
  name: string
  status: 'ENABLED' | 'PAUSED' | 'REMOVED'
  type: string
  resourceName: string
  startDate?: string
  endDate?: string
  biddingStrategy?: string
  budget?: {
    amountMicros: number
    deliveryMethod: string
  }
  metrics: {
    impressions: number
    clicks: number
    cost: number
    conversions: number
    ctr?: number
    averageCpc?: number
    costPerConversion?: number
  }
}

export interface GoogleAdsKeyword {
  text: string
  matchType: 'EXACT' | 'PHRASE' | 'BROAD' | 'BROAD_MODIFIED'
  resourceName: string
  adGroup: {
    id: string
    name: string
  }
  campaign: {
    id: string
    name: string
  }
  metrics: {
    impressions: number
    clicks: number
    cost: number
    conversions: number
    ctr: number
    averageCpc: number
    qualityScore: number | null
  }
}

export interface GoogleAdsCampaignsResponse {
  success: boolean
  campaigns: GoogleAdsCampaign[]
  total: number
  accountInfo?: {
    customerId: string
    accountName: string
  }
}

export interface GoogleAdsKeywordsResponse {
  success: boolean
  keywords: GoogleAdsKeyword[]
  total: number
  filters: {
    customerId: string
    campaignId: string | null
    adGroupId: string | null
  }
}

// Hook Options
export interface UseGoogleAdsOptions {
  customerId: string
  campaignId?: string
  adGroupId?: string
  refreshInterval?: number
  enabled?: boolean
}

// Additional Response Types
export interface GoogleAdsCustomersResponse {
  success: boolean;
  customers: string[];
  total: number;
}

export interface GoogleAdsAccountDetailsResponse {
  success: boolean;
  account: GoogleAdsAccount;
}

export interface GoogleAdsHierarchyResponse {
  success: boolean;
  hierarchy: AccountHierarchy;
}

// Error Types
export interface GoogleAdsError {
  code: string;
  message: string;
  details?: {
    errors?: Array<{
      errorCode: string;
      message: string;
      location?: {
        fieldPathElements: Array<{
          fieldName: string;
          index?: number;
        }>;
      };
    }>;
  };
}