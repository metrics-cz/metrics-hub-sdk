import { 
  GoogleAnalyticsAccountsResponse, 
  GoogleAnalyticsReportsResponse,
  GoogleAnalyticsProperty,
  GoogleAnalyticsView,
  CustomDimension,
  Goal,
  Audience,
  GoogleAnalyticsEnhancedResponse
} from '../types/google-analytics';
import { BaseClient } from "./BaseClient";

export class GoogleAnalyticsClient extends BaseClient {
  async getAccounts(): Promise<GoogleAnalyticsAccountsResponse> {
    const queryParams = new URLSearchParams({
      companyId: this.config.companyId
    });

    const endpoint = `/api/plugins/google/analytics/accounts?${queryParams.toString()}`;
    return this.makeRequest<GoogleAnalyticsAccountsResponse>(endpoint);
  }

  async getReports(params: {
    viewId: string;
    startDate: string;
    endDate: string;
  }): Promise<GoogleAnalyticsReportsResponse> {
    const queryParams = new URLSearchParams({
      companyId: this.config.companyId,
      viewId: params.viewId,
      startDate: params.startDate,
      endDate: params.endDate
    });

    const endpoint = `/api/plugins/google/analytics/reports?${queryParams.toString()}`;
    return this.makeRequest<GoogleAnalyticsReportsResponse>(endpoint);
  }

  // Enhanced Analytics Methods
  async getProperties(accountId: string): Promise<GoogleAnalyticsEnhancedResponse<GoogleAnalyticsProperty>> {
    const queryParams = new URLSearchParams({
      companyId: this.config.companyId,
      accountId
    });

    const endpoint = `/api/plugins/google/analytics/properties?${queryParams.toString()}`;
    return this.makeRequest<GoogleAnalyticsEnhancedResponse<GoogleAnalyticsProperty>>(endpoint);
  }

  async getViews(propertyId: string): Promise<GoogleAnalyticsEnhancedResponse<GoogleAnalyticsView>> {
    const queryParams = new URLSearchParams({
      companyId: this.config.companyId,
      propertyId
    });

    const endpoint = `/api/plugins/google/analytics/views?${queryParams.toString()}`;
    return this.makeRequest<GoogleAnalyticsEnhancedResponse<GoogleAnalyticsView>>(endpoint);
  }

  async getCustomDimensions(propertyId: string): Promise<GoogleAnalyticsEnhancedResponse<CustomDimension>> {
    const queryParams = new URLSearchParams({
      companyId: this.config.companyId,
      propertyId
    });

    const endpoint = `/api/plugins/google/analytics/custom-dimensions?${queryParams.toString()}`;
    return this.makeRequest<GoogleAnalyticsEnhancedResponse<CustomDimension>>(endpoint);
  }

  async getGoals(profileId: string): Promise<GoogleAnalyticsEnhancedResponse<Goal>> {
    const queryParams = new URLSearchParams({
      companyId: this.config.companyId,
      profileId
    });

    const endpoint = `/api/plugins/google/analytics/goals?${queryParams.toString()}`;
    return this.makeRequest<GoogleAnalyticsEnhancedResponse<Goal>>(endpoint);
  }

  async getAudiences(propertyId: string): Promise<GoogleAnalyticsEnhancedResponse<Audience>> {
    const queryParams = new URLSearchParams({
      companyId: this.config.companyId,
      propertyId
    });

    const endpoint = `/api/plugins/google/analytics/audiences?${queryParams.toString()}`;
    return this.makeRequest<GoogleAnalyticsEnhancedResponse<Audience>>(endpoint);
  }

  async getRealTimeData(viewId: string, options?: {
    metrics?: string[];
    dimensions?: string[];
  }): Promise<{ success: boolean; data: any; total: number }> {
    const queryParams = new URLSearchParams({
      companyId: this.config.companyId,
      viewId
    });

    if (options?.metrics) {
      queryParams.set('metrics', options.metrics.join(','));
    }

    if (options?.dimensions) {
      queryParams.set('dimensions', options.dimensions.join(','));
    }

    const endpoint = `/api/plugins/google/analytics/realtime?${queryParams.toString()}`;
    return this.makeRequest<{ success: boolean; data: any; total: number }>(endpoint);
  }

  async getCustomReports(viewId: string, params: {
    startDate: string;
    endDate: string;
    metrics: string[];
    dimensions?: string[];
    filters?: string;
    segments?: string[];
    samplingLevel?: 'DEFAULT' | 'FASTER' | 'HIGHER_PRECISION';
    orderBy?: Array<{ fieldName: string; sortOrder: 'ASCENDING' | 'DESCENDING' }>;
    pageSize?: number;
    pageToken?: string;
  }): Promise<GoogleAnalyticsReportsResponse> {
    const body = {
      companyId: this.config.companyId,
      viewId,
      ...params
    };

    const endpoint = `/api/plugins/google/analytics/custom-reports`;
    return this.makeRequest<GoogleAnalyticsReportsResponse>(endpoint, {
      method: 'POST',
      body: JSON.stringify(body)
    });
  }
}