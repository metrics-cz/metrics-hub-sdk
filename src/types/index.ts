/**
 * MetricsHub SDK Types
 * 
 * All TypeScript types for the MetricsHub SDK system
 */

// Google Services
export * from './google-ads'
export * from './google-analytics'

// Database Types
export * from './database'

// Core SDK Types (enhanced from PluginConfig)
export interface PluginConfig {
  companyId: string
  apiBaseUrl?: string
  apiKey?: string
  debug?: boolean
}

// Remove circular dependency - MetricsHubConfig will be defined in database.ts

export interface PluginError {
  message: string
  code?: string
  status?: number
  details?: any
}

export interface BaseApiResponse {
  success: boolean
  error?: string
  details?: any
}

// Common hook options
export interface BaseHookOptions {
  refreshInterval?: number
  enabled?: boolean
  onError?: (error: PluginError) => void
  onSuccess?: (data: any) => void
}

// SWR-like return type
export interface HookReturn<T> {
  data: T | undefined
  error: PluginError | undefined
  loading: boolean
  mutate: () => Promise<void>
}