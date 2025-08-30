import { ConnectionInfo } from '../types/google-ads';
import { BaseClient } from './BaseClient';

export interface ConnectionValidationResponse {
  success: boolean;
  isValid: boolean;
  expiresIn?: number;
  needsRefresh?: boolean;
  error?: string;
}

export interface AccessTokenResponse {
  success: boolean;
  accessToken?: string;
  expiresIn?: number;
  tokenType?: string;
  error?: string;
}

export interface RefreshTokenResponse {
  success: boolean;
  accessToken?: string;
  expiresIn?: number;
  refreshToken?: string;
  error?: string;
}

/**
 * OAuth Token Management for MetricsHub integrations
 * 
 * Handles access token retrieval, refresh, and connection validation
 * for various OAuth providers (Google Ads, Analytics, etc.)
 */
export class ConnectionManager extends BaseClient {
  
  /**
   * Get a valid access token for the specified provider
   * 
   * @param provider - OAuth provider (e.g., 'google', 'google-ads', 'google-analytics')
   * @param forceRefresh - Force token refresh even if current token is valid
   */
  async getAccessToken(provider: string, forceRefresh: boolean = false): Promise<string> {
    const params = new URLSearchParams({
      companyId: this.config.companyId,
      provider,
      forceRefresh: forceRefresh.toString()
    });

    const endpoint = `/api/plugins/oauth/access-token?${params.toString()}`;
    const response = await this.makeRequest<AccessTokenResponse>(endpoint);

    if (!response.success || !response.accessToken) {
      throw new Error(`Failed to get access token for ${provider}: ${response.error || 'Unknown error'}`);
    }

    return response.accessToken;
  }

  /**
   * Refresh OAuth token for the specified provider
   * 
   * @param provider - OAuth provider
   */
  async refreshToken(provider: string): Promise<RefreshTokenResponse> {
    const params = new URLSearchParams({
      companyId: this.config.companyId,
      provider
    });

    const endpoint = `/api/plugins/oauth/refresh-token`;
    const response = await this.makeRequest<RefreshTokenResponse>(endpoint, {
      method: 'POST',
      body: JSON.stringify({ 
        companyId: this.config.companyId, 
        provider 
      })
    });

    if (!response.success) {
      throw new Error(`Failed to refresh token for ${provider}: ${response.error || 'Unknown error'}`);
    }

    return response;
  }

  /**
   * Validate existing connection for the specified provider
   * 
   * @param provider - OAuth provider
   */
  async validateConnection(provider: string): Promise<boolean> {
    const params = new URLSearchParams({
      companyId: this.config.companyId,
      provider
    });

    const endpoint = `/api/plugins/oauth/validate?${params.toString()}`;
    
    try {
      const response = await this.makeRequest<ConnectionValidationResponse>(endpoint);
      return response.success && response.isValid;
    } catch (error) {
      this.log(`Connection validation failed for ${provider}: ${error}`);
      return false;
    }
  }

  /**
   * Get detailed connection information for the specified provider
   * 
   * @param provider - OAuth provider
   */
  async getConnectionInfo(provider: string): Promise<ConnectionInfo> {
    const params = new URLSearchParams({
      companyId: this.config.companyId,
      provider
    });

    const endpoint = `/api/plugins/oauth/connection-info?${params.toString()}`;
    const response = await this.makeRequest<{ success: boolean; connection: ConnectionInfo; error?: string }>(endpoint);

    if (!response.success || !response.connection) {
      throw new Error(`Failed to get connection info for ${provider}: ${response.error || 'Not connected'}`);
    }

    return response.connection;
  }

  /**
   * Check if a specific provider is connected and has valid credentials
   * 
   * @param provider - OAuth provider
   */
  async isConnected(provider: string): Promise<boolean> {
    try {
      const connectionInfo = await this.getConnectionInfo(provider);
      return connectionInfo.isConnected;
    } catch (error) {
      return false;
    }
  }

  /**
   * Get authorization URL for connecting a new provider
   * 
   * @param provider - OAuth provider
   * @param redirectUri - Redirect URI after authorization
   * @param scopes - Requested OAuth scopes
   */
  async getAuthorizationUrl(provider: string, redirectUri: string, scopes?: string[]): Promise<string> {
    const body = {
      companyId: this.config.companyId,
      provider,
      redirectUri,
      scopes: scopes || []
    };

    const endpoint = `/api/plugins/oauth/authorize-url`;
    const response = await this.makeRequest<{ success: boolean; authUrl?: string; error?: string }>(endpoint, {
      method: 'POST',
      body: JSON.stringify(body)
    });

    if (!response.success || !response.authUrl) {
      throw new Error(`Failed to get authorization URL for ${provider}: ${response.error || 'Unknown error'}`);
    }

    return response.authUrl;
  }

  /**
   * Revoke access for the specified provider
   * 
   * @param provider - OAuth provider
   */
  async revokeConnection(provider: string): Promise<boolean> {
    const body = {
      companyId: this.config.companyId,
      provider
    };

    const endpoint = `/api/plugins/oauth/revoke`;
    
    try {
      const response = await this.makeRequest<{ success: boolean; error?: string }>(endpoint, {
        method: 'POST',
        body: JSON.stringify(body)
      });

      return response.success;
    } catch (error) {
      this.log(`Failed to revoke connection for ${provider}: ${error}`);
      return false;
    }
  }

  /**
   * Get all connected providers for the current company
   */
  async getConnectedProviders(): Promise<string[]> {
    const params = new URLSearchParams({
      companyId: this.config.companyId
    });

    const endpoint = `/api/plugins/oauth/connected-providers?${params.toString()}`;
    const response = await this.makeRequest<{ success: boolean; providers: string[]; error?: string }>(endpoint);

    if (!response.success) {
      throw new Error(`Failed to get connected providers: ${response.error || 'Unknown error'}`);
    }

    return response.providers || [];
  }
}