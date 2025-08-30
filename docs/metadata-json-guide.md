# Complete MetricsHub Integration metadata.json Guide

The `metadata.json` file defines how your integration appears and behaves within the MetricsHub platform. This file is essential for plugin registration, UI generation, and execution configuration.

## Core Required Fields (Executor Validation)

Every integration must include these mandatory fields:

```json
{
  "name": "integration-name",              // 1-100 chars, unique identifier
  "version": "1.0.0",                     // Semantic version (X.Y.Z)
  "description": "What this integration does", // 1-500 chars
  "entrypoint": "index.js",               // Main execution file
  "command": "node index.js",             // Docker run command
  "runtime": "node:18-alpine"             // Docker base image
}
```

### Field Validation Rules

- **name**: Alphanumeric + hyphens only, must be unique across the entire MetricsHub system
- **version**: Must follow semantic versioning (1.0.0, 2.1.3, etc.)
- **description**: 1-500 characters describing what the integration does
- **entrypoint**: Path to main file (relative to integration root)
- **command**: Command to execute the integration
- **runtime**: Docker base image or execution environment

## Optional Core Fields

```json
{
  "timeout": 300000,                      // Execution timeout (ms, default: 300000)
  "resources": {
    "memory": "512MB",                    // Docker memory limit (default: "256m")
    "cpu": "1.0"                         // Docker CPU limit (default: "0.5")
  },
  "environment": {                        // Environment variables
    "NODE_ENV": "production",
    "LOG_LEVEL": "info"
  },
  "dependencies": ["package1", "package2"] // External dependencies
}
```

## Extended UI Configuration Fields

### Basic Info

```json
{
  "displayName": "Human Readable Name",   // UI display name
  "category": "advertising",              // Integration category
  "provider": "google-ads",              // Service provider
  "type": "server-side",                 // Execution type
  "executionType": "scheduled"           // Trigger type
}
```

#### Categories
- `advertising`: Ad platforms (Google Ads, Facebook Ads)
- `analytics`: Analytics platforms (Google Analytics, Adobe)
- `crm`: Customer relationship management
- `ecommerce`: E-commerce platforms
- `email`: Email marketing platforms
- `social`: Social media platforms
- `database`: Database connectors
- `api`: Generic API integrations
- `notification`: Notification services

#### Types
- `server-side`: Backend integration running in Docker
- `iframe`: Frontend iframe plugin
- `webhook`: Webhook receiver
- `cron`: Scheduled background job

#### Execution Types
- `scheduled`: Runs on a schedule
- `webhook`: Triggered by external events
- `manual`: User-triggered execution
- `realtime`: Real-time iframe plugin

### Capabilities

```json
{
  "supports": {
    "oauth": true,                        // OAuth authentication
    "scheduling": true,                   // Scheduled execution
    "notifications": true,                // Push notifications
    "webhooks": false,                   // Webhook triggers
    "streaming": false,                  // Real-time streaming
    "realtime": true                     // Real-time updates
  }
}
```

## User Configuration Form

Define user-configurable settings that appear in the MetricsHub UI:

```json
{
  "configuration": {
    "textField": {
      "type": "text",
      "label": "Display Label",
      "description": "Help text for users",
      "required": true,
      "placeholder": "Enter text here",
      "validation": "^[a-zA-Z0-9]+$",     // Regex validation
      "maxLength": 100
    },
    "numberField": {
      "type": "number",
      "label": "Numeric Value",
      "description": "Enter a number",
      "default": 10,
      "min": 1,
      "max": 100,
      "step": 1,
      "required": false
    },
    "selectField": {
      "type": "select",
      "label": "Choose Option",
      "description": "Select from dropdown",
      "options": [
        {"value": "option1", "label": "Option 1"},
        {"value": "option2", "label": "Option 2"}
      ],
      "default": "option1",
      "multiple": false,
      "required": true
    },
    "checkboxField": {
      "type": "checkbox",
      "label": "Enable Feature",
      "description": "Toggle this feature on/off",
      "default": false
    },
    "secretField": {
      "type": "secret",
      "label": "API Key",
      "description": "Your secret API key",
      "required": true,
      "placeholder": "sk-..."
    },
    "textareaField": {
      "type": "textarea",
      "label": "Long Text",
      "description": "Multi-line text input",
      "rows": 4,
      "maxLength": 1000,
      "placeholder": "Enter multiple lines..."
    },
    "objectField": {
      "type": "object",
      "label": "Advanced Settings",
      "description": "Nested configuration object",
      "properties": {
        "subField1": {
          "type": "text",
          "label": "Sub Field",
          "default": "value"
        },
        "subField2": {
          "type": "number",
          "label": "Sub Number",
          "default": 42
        }
      },
      "required": false
    },
    "arrayField": {
      "type": "array",
      "label": "List of Items",
      "description": "Multiple values",
      "items": {
        "type": "text",
        "placeholder": "Enter item"
      },
      "minItems": 1,
      "maxItems": 10,
      "default": ["item1", "item2"]
    }
  }
}
```

### Field Types Reference

| Type     | Description        | Properties                            |
|----------|--------------------|------------------------------------- |
| text     | Single-line text   | placeholder, validation, maxLength   |
| textarea | Multi-line text    | rows, maxLength, placeholder         |
| number   | Numeric input      | min, max, step, default              |
| select   | Dropdown selection | options[], multiple, default         |
| checkbox | Boolean toggle     | default                              |
| secret   | Encrypted field    | placeholder, validation              |
| object   | Nested object      | properties{}                         |
| array    | List of values     | items{}, minItems, maxItems          |

## OAuth Configuration

For integrations requiring OAuth authentication:

```json
{
  "oauth": {
    "provider": "google",                 // google|microsoft|salesforce|custom
    "scopes": [
      "https://www.googleapis.com/auth/adwords",
      "https://www.googleapis.com/auth/analytics.readonly"
    ],
    "authUrl": "https://accounts.google.com/o/oauth2/auth",
    "tokenUrl": "https://oauth2.googleapis.com/token",
    "refreshUrl": "https://oauth2.googleapis.com/token", // Optional
    "clientIdRequired": true,             // Require custom OAuth app
    "clientSecretRequired": true,         // Require OAuth secret
    "pkce": true,                        // Use PKCE for security
    "additionalParams": {                // Extra OAuth parameters
      "access_type": "offline",
      "prompt": "consent"
    }
  }
}
```

### OAuth Providers

- **google**: Google OAuth 2.0
- **microsoft**: Microsoft OAuth 2.0
- **salesforce**: Salesforce OAuth 2.0
- **facebook**: Facebook OAuth 2.0
- **custom**: Custom OAuth implementation

## Scheduling Settings

For scheduled integrations:

```json
{
  "scheduling": {
    "defaultFrequency": 86400,            // Default interval (seconds)
    "minimumFrequency": 3600,             // Minimum interval (1 hour)
    "maximumFrequency": 604800,           // Maximum interval (1 week)
    "timezone": "UTC",                    // Default timezone
    "cronSupport": true,                  // Allow cron expressions
    "businessHoursOnly": false,           // Restrict to business hours
    "retryPolicy": {
      "maxRetries": 3,
      "retryDelay": 300,                  // Seconds between retries
      "backoffMultiplier": 2.0
    }
  }
}
```

## Output Schema Definition

Define what data your integration produces:

```json
{
  "outputs": {
    "notifications": {
      "type": "structured",               // structured|unstructured
      "schema": {
        "accountId": "string",
        "accountName": "string",
        "alertType": "string",
        "severity": "string",
        "score": "number",
        "metrics": "object",
        "summary": "string",
        "recommendations": "array",
        "timestamp": "string"
      }
    },
    "metrics": {                          // Metrics this integration produces
      "healthScore": "number",
      "costChange": "number",
      "impressionChange": "number",
      "conversionRate": "number"
    },
    "data": {                            // Data export format
      "type": "json",                    // json|csv|xml
      "schema": {
        "accounts": {
          "type": "array",
          "items": {
            "id": "string",
            "name": "string",
            "status": "string",
            "metrics": "object"
          }
        }
      }
    }
  }
}
```

## Resource Requirements

Define computational requirements:

```json
{
  "requirements": {
    "memory": "512MB",                    // Memory allocation
    "timeout": 600,                      // Max execution time (seconds)
    "network": true,                     // Internet access required
    "storage": "100MB",                  // Temporary storage needed
    "cpu": "1.0",                       // CPU allocation
    "diskSpace": "1GB",                 // Persistent disk space
    "ports": [8080, 8081]               // Required ports (for services)
  }
}
```

### Memory Formats
- Use Docker format: "256MB", "512MB", "1GB", "2GB"
- Minimum: "128MB"
- Maximum: "8GB"

### CPU Formats
- Decimal values: "0.1", "0.5", "1.0", "2.0"
- Minimum: "0.1"
- Maximum: "4.0"

## Advanced Metadata

### Permissions
```json
{
  "permissions": [
    "google-ads",
    "google-analytics", 
    "notifications",
    "file-storage"
  ]
}
```

### Tags and Keywords
```json
{
  "tags": [
    "advertising",
    "google",
    "performance",
    "dashboard"
  ],
  "keywords": [
    "google-ads",
    "advertising",
    "ppc",
    "campaigns"
  ]
}
```

### Compatibility
```json
{
  "compatibility": {
    "minSdkVersion": "1.2.0",
    "maxSdkVersion": "2.0.0",
    "browserSupport": ["chrome", "firefox", "safari", "edge"],
    "minBrowserVersions": {
      "chrome": "61",
      "firefox": "60", 
      "safari": "11",
      "edge": "16"
    },
    "nodeVersion": ">=18.0.0"
  }
}
```

### Documentation Links
```json
{
  "author": "Your Company",
  "homepage": "https://yoursite.com/integration",
  "documentation": "https://docs.yoursite.com/integration",
  "repository": "https://github.com/yourorg/integration",
  "license": "MIT",
  "changelog": "https://github.com/yourorg/integration/releases"
}
```

## Complete Example

Here's a complete metadata.json for a Google Ads iframe plugin:

```json
{
  "name": "google-ads-accounts-overview",
  "version": "1.0.0",
  "description": "Production MetricsHub plugin displaying Google Ads accounts overview with comprehensive performance metrics",
  "entrypoint": "public/index.html",
  "command": "iframe",
  "runtime": "browser-iframe",
  "timeout": 300000,
  "resources": {
    "memory": "128MB",
    "cpu": "0.2"
  },
  "environment": {
    "NODE_ENV": "production",
    "PLUGIN_TYPE": "iframe"
  },
  "displayName": "Google Ads Accounts Overview",
  "category": "advertising",
  "provider": "google-ads",
  "type": "iframe",
  "executionType": "realtime",
  "supports": {
    "oauth": true,
    "scheduling": false,
    "notifications": true,
    "webhooks": false,
    "streaming": false,
    "realtime": true
  },
  "oauth": {
    "provider": "google",
    "scopes": [
      "https://www.googleapis.com/auth/adwords"
    ],
    "clientIdRequired": false,
    "clientSecretRequired": false
  },
  "configuration": {
    "refreshInterval": {
      "type": "number",
      "label": "Auto-refresh Interval",
      "description": "How often to automatically refresh account data (in seconds)",
      "default": 300,
      "min": 60,
      "max": 3600,
      "required": false
    },
    "autoRefresh": {
      "type": "checkbox",
      "label": "Enable Auto-refresh",
      "description": "Automatically refresh account data at specified intervals",
      "default": true
    }
  },
  "outputs": {
    "data": {
      "type": "json",
      "schema": {
        "accounts": {
          "type": "array",
          "items": {
            "accountId": "string",
            "accountName": "string",
            "metrics": "object"
          }
        }
      }
    }
  },
  "requirements": {
    "memory": "128MB",
    "timeout": 300,
    "network": true,
    "cpu": "0.2"
  },
  "permissions": ["google-ads"],
  "tags": ["advertising", "google-ads", "iframe"],
  "author": "MetricsHub Team",
  "license": "ISC"
}
```

## Validation and Best Practices

### Validation Rules

1. **Name Validation**: Must be lowercase, alphanumeric with hyphens only
2. **Version Validation**: Must follow semantic versioning exactly
3. **Required Fields**: All required configuration fields must have proper validation
4. **OAuth Scopes**: Must be valid URLs for the specified provider
5. **Resource Limits**: Must be within platform constraints
6. **Dependencies**: Must be available packages/services

### Best Practices

1. **Descriptive Names**: Use clear, descriptive names for configuration fields
2. **Helpful Descriptions**: Provide clear descriptions for all user-facing fields
3. **Sensible Defaults**: Set reasonable default values for optional fields
4. **Validation**: Add regex validation for text fields where appropriate
5. **Resource Efficiency**: Request only the resources you actually need
6. **Error Handling**: Plan for configuration errors and validation failures

### Common Mistakes

1. **Missing Required Fields**: Always include all mandatory fields
2. **Invalid Resource Formats**: Use proper Docker memory/CPU formats
3. **Incorrect OAuth Scopes**: Verify scopes match the provider's documentation
4. **Overly Permissive**: Don't request more permissions than needed
5. **Poor Field Types**: Choose appropriate field types for user inputs

## Integration Testing

Before deploying, validate your metadata.json:

1. **Schema Validation**: Ensure JSON is valid and follows required structure
2. **Field Testing**: Test all configuration fields in the MetricsHub UI
3. **Resource Testing**: Verify resource requirements are adequate
4. **OAuth Testing**: Test OAuth flow with actual provider
5. **Output Validation**: Confirm output schema matches actual data

This comprehensive guide covers all aspects of creating effective metadata.json files for MetricsHub integrations. Use it as a reference when building your own integrations.