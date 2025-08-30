/**
 * Enhanced Plugin SDK Framework for MetricsHub
 * 
 * Provides plugin lifecycle management, inter-plugin communication,
 * state management, and UI helpers for iframe-based plugins
 */

import { MetricsHubSDK } from '../MetricsHubSDK';
import { PluginConfig } from '../types';
import { ComponentLogger, Logger } from '../utils/Logger';
import { MetricsHubError } from '../errors';

export interface PluginManifest {
  id: string;
  name: string;
  version: string;
  description?: string;
  author?: string;
  homepage?: string;
  keywords?: string[];
  permissions?: string[];
  dependencies?: Record<string, string>;
  config?: Record<string, any>;
}

export interface MessageHandler {
  (data: any, sender: string): void | Promise<void>;
}

export interface PluginMessage {
  id: string;
  type: string;
  data: any;
  sender: string;
  timestamp: Date;
  targetPlugin?: string;
}

export interface NotificationOptions {
  duration?: number;
  actionText?: string;
  onAction?: () => void;
  persistent?: boolean;
}

export interface PluginState {
  [key: string]: any;
}

/**
 * Enhanced Plugin SDK that extends MetricsHubSDK with plugin-specific features
 */
export class PluginSDK extends MetricsHubSDK {
  protected logger: ComponentLogger;
  private messageHandlers: Map<string, MessageHandler[]> = new Map();
  private pluginState: PluginState = {};
  private manifest?: PluginManifest;
  private isRegistered: boolean = false;

  constructor(config: PluginConfig, manifest?: PluginManifest) {
    super(config);
    this.manifest = manifest;
    this.logger = Logger.createComponentLogger(`Plugin:${manifest?.name || 'Unknown'}`);
    
    // Initialize plugin message listener
    this.initializeMessageListener();
  }

  // Plugin Lifecycle Management
  
  /**
   * Register the plugin with the MetricsHub platform
   */
  async registerPlugin(manifest?: PluginManifest): Promise<void> {
    const pluginManifest = manifest || this.manifest;
    
    if (!pluginManifest) {
      throw new MetricsHubError('Plugin manifest is required for registration', 'MISSING_MANIFEST', 400);
    }

    try {
      const endpoint = '/api/plugins/register';
      await this.makeRequest(endpoint, {
        method: 'POST',
        body: JSON.stringify({
          companyId: this.config.companyId,
          manifest: pluginManifest
        })
      });

      this.manifest = pluginManifest;
      this.isRegistered = true;
      this.logger.info('Plugin registered successfully', { pluginId: pluginManifest.id });
    } catch (error) {
      this.logger.error('Failed to register plugin', error as Error, { manifest: pluginManifest });
      throw new MetricsHubError(
        'Plugin registration failed',
        'PLUGIN_REGISTRATION_FAILED',
        500,
        { originalError: error as Error }
      );
    }
  }

  /**
   * Unregister the plugin from the MetricsHub platform
   */
  async unregisterPlugin(): Promise<void> {
    if (!this.manifest || !this.isRegistered) {
      this.logger.warn('Plugin is not registered');
      return;
    }

    try {
      const endpoint = '/api/plugins/unregister';
      await this.makeRequest(endpoint, {
        method: 'POST',
        body: JSON.stringify({
          companyId: this.config.companyId,
          pluginId: this.manifest.id
        })
      });

      this.isRegistered = false;
      this.logger.info('Plugin unregistered successfully', { pluginId: this.manifest.id });
    } catch (error) {
      this.logger.error('Failed to unregister plugin', error as Error);
      throw new MetricsHubError(
        'Plugin unregistration failed',
        'PLUGIN_UNREGISTRATION_FAILED',
        500,
        { originalError: error as Error }
      );
    }
  }

  // Inter-plugin Communication

  /**
   * Register a message handler for a specific message type
   */
  onMessage(type: string, handler: MessageHandler): void {
    if (!this.messageHandlers.has(type)) {
      this.messageHandlers.set(type, []);
    }
    
    const handlers = this.messageHandlers.get(type)!;
    handlers.push(handler);
    
    this.logger.debug('Message handler registered', { type, handlerCount: handlers.length });
  }

  /**
   * Send a message to a specific plugin
   */
  async sendMessage(targetPlugin: string, type: string, data: any): Promise<void> {
    const message: PluginMessage = {
      id: this.generateMessageId(),
      type,
      data,
      sender: this.manifest?.id || 'unknown',
      timestamp: new Date(),
      targetPlugin
    };

    try {
      // Send via postMessage for iframe communication
      if (typeof window !== 'undefined' && window.parent) {
        window.parent.postMessage({
          type: 'PLUGIN_MESSAGE',
          message
        }, '*');
      }

      // Also send via API for server-side plugins
      const endpoint = '/api/plugins/message';
      await this.makeRequest(endpoint, {
        method: 'POST',
        body: JSON.stringify({
          companyId: this.config.companyId,
          message
        })
      });

      this.logger.debug('Message sent', { targetPlugin, type, messageId: message.id });
    } catch (error) {
      this.logger.error('Failed to send message', error as Error, { targetPlugin, type });
      throw new MetricsHubError(
        'Message sending failed',
        'MESSAGE_SEND_FAILED',
        500,
        { originalError: error as Error, context: { targetPlugin, type } }
      );
    }
  }

  /**
   * Broadcast a message to all plugins
   */
  async broadcastMessage(type: string, data: any): Promise<void> {
    await this.sendMessage('*', type, data);
  }

  // Plugin State Management

  /**
   * Set a value in the plugin state
   */
  setState(key: string, value: any): void {
    this.pluginState[key] = value;
    this.logger.debug('State updated', { key, valueType: typeof value });
    
    // Persist state to local storage if in browser
    if (typeof localStorage !== 'undefined' && this.manifest) {
      const stateKey = `metricshub_plugin_${this.manifest.id}_state`;
      localStorage.setItem(stateKey, JSON.stringify(this.pluginState));
    }
  }

  /**
   * Get a value from the plugin state
   */
  getState(key: string): any {
    return this.pluginState[key];
  }

  /**
   * Get all plugin state
   */
  getAllState(): PluginState {
    return { ...this.pluginState };
  }

  /**
   * Clear all plugin state
   */
  clearState(): void {
    this.pluginState = {};
    this.logger.debug('State cleared');
    
    // Clear from local storage if in browser
    if (typeof localStorage !== 'undefined' && this.manifest) {
      const stateKey = `metricshub_plugin_${this.manifest.id}_state`;
      localStorage.removeItem(stateKey);
    }
  }

  /**
   * Load state from local storage (browser only)
   */
  private loadStateFromStorage(): void {
    if (typeof localStorage !== 'undefined' && this.manifest) {
      const stateKey = `metricshub_plugin_${this.manifest.id}_state`;
      const storedState = localStorage.getItem(stateKey);
      
      if (storedState) {
        try {
          this.pluginState = JSON.parse(storedState);
          this.logger.debug('State loaded from storage', { keys: Object.keys(this.pluginState) });
        } catch (error) {
          this.logger.warn('Failed to parse stored state', { error });
        }
      }
    }
  }

  // UI Helper Methods (for iframe plugins)

  /**
   * Resize the plugin iframe
   */
  resize(width?: number, height?: number): void {
    if (typeof window !== 'undefined' && window.parent) {
      window.parent.postMessage({
        type: 'PLUGIN_RESIZE',
        width,
        height
      }, '*');
      
      this.logger.debug('Resize requested', { width, height });
    }
  }

  /**
   * Show a notification to the user
   */
  showNotification(
    type: 'success' | 'error' | 'warning' | 'info', 
    message: string, 
    options?: NotificationOptions
  ): void {
    if (typeof window !== 'undefined' && window.parent) {
      window.parent.postMessage({
        type: 'PLUGIN_NOTIFICATION',
        notification: {
          type,
          message,
          ...options
        }
      }, '*');
      
      this.logger.info('Notification shown', { type, message });
    }
  }

  /**
   * Request fullscreen mode for the plugin
   */
  requestFullscreen(): void {
    if (typeof window !== 'undefined' && window.parent) {
      window.parent.postMessage({
        type: 'PLUGIN_FULLSCREEN_REQUEST'
      }, '*');
      
      this.logger.debug('Fullscreen requested');
    }
  }

  /**
   * Exit fullscreen mode
   */
  exitFullscreen(): void {
    if (typeof window !== 'undefined' && window.parent) {
      window.parent.postMessage({
        type: 'PLUGIN_FULLSCREEN_EXIT'
      }, '*');
      
      this.logger.debug('Fullscreen exit requested');
    }
  }

  /**
   * Open a URL in a new tab/window
   */
  openUrl(url: string, target: '_blank' | '_self' | '_parent' = '_blank'): void {
    if (typeof window !== 'undefined' && window.parent) {
      window.parent.postMessage({
        type: 'PLUGIN_OPEN_URL',
        url,
        target
      }, '*');
      
      this.logger.debug('URL open requested', { url, target });
    }
  }

  // Utility Methods

  /**
   * Check if the plugin is registered
   */
  isPluginRegistered(): boolean {
    return this.isRegistered;
  }

  /**
   * Get the plugin manifest
   */
  getManifest(): PluginManifest | undefined {
    return this.manifest;
  }

  /**
   * Get plugin information
   */
  getPluginInfo(): { id: string; name: string; version: string } | null {
    if (!this.manifest) return null;
    
    return {
      id: this.manifest.id,
      name: this.manifest.name,
      version: this.manifest.version
    };
  }

  // Private Methods

  private initializeMessageListener(): void {
    if (typeof window !== 'undefined') {
      window.addEventListener('message', this.handleIncomingMessage.bind(this));
      
      // Load state from storage on initialization
      this.loadStateFromStorage();
    }
  }

  private async handleIncomingMessage(event: MessageEvent): Promise<void> {
    if (event.data?.type === 'PLUGIN_MESSAGE') {
      const message: PluginMessage = event.data.message;
      
      // Check if message is for this plugin
      if (message.targetPlugin !== '*' && message.targetPlugin !== this.manifest?.id) {
        return;
      }
      
      // Don't handle our own messages
      if (message.sender === this.manifest?.id) {
        return;
      }
      
      const handlers = this.messageHandlers.get(message.type) || [];
      
      for (const handler of handlers) {
        try {
          await handler(message.data, message.sender);
        } catch (error) {
          this.logger.error('Message handler failed', error as Error, {
            messageType: message.type,
            sender: message.sender
          });
        }
      }
    }
  }

  private generateMessageId(): string {
    return `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private async makeRequest<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${this.config.apiBaseUrl}${endpoint}`;
    
    const headers = {
      'Content-Type': 'application/json',
      ...(this.config.apiKey && { 'Authorization': `Bearer ${this.config.apiKey}` }),
      ...options.headers
    };

    this.logger.debug(`Making request to ${url}`);

    try {
      const response = await fetch(url, {
        ...options,
        headers
      });

      if (!response.ok) {
        throw new MetricsHubError(
          `HTTP ${response.status}: ${response.statusText}`,
          'HTTP_ERROR',
          response.status
        );
      }

      return await response.json();
    } catch (error) {
      this.logger.error('Request failed', error as Error, { url, method: options.method });
      throw error;
    }
  }
}