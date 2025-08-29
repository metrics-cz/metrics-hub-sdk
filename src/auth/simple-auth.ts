/**
 * Dead Simple PostMessage Authentication for MetricsHub Applications
 * 
 * Just listens for auth data from parent window - no complexity!
 */

export interface AuthData {
  companyToken: string;
  companyId: string;
  appId: string;
  mode?: 'development' | 'production';
}

/**
 * Simple helper to listen for auth data from parent MetricsHub platform
 * 
 * Usage:
 * ```
 * import { onAuth } from '@metrics-hub/sdk';
 * 
 * onAuth((authData) => {
 *   const sdk = new MetricsHubSDK(authData, schema);
 *   // Start your app
 * });
 * ```
 */
export function onAuth(callback: (authData: AuthData) => void): void {
  window.addEventListener('message', (event) => {
    // Check if this is MetricsHub auth data
    if (event.data?.type === 'METRICSHUB_AUTH') {
      const authData: AuthData = {
        companyToken: event.data.companyToken,
        companyId: event.data.companyId,
        appId: event.data.appId,
        mode: event.data.mode || 'production'
      };
      
      // Call the callback with auth data
      callback(authData);
    }
  });
}

/**
 * Check if we're running inside an iframe
 */
export function isInIframe(): boolean {
  try {
    return window.self !== window.top;
  } catch (e) {
    return true;
  }
}