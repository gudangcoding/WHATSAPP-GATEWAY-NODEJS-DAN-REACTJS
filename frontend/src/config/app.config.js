// Application Configuration
export const APP_CONFIG = {
  // App Info
  name: process.env.REACT_APP_NAME || 'WhatsApp Gateway SaaS',
  version: process.env.REACT_APP_VERSION || '1.0.0',
  description: 'Professional WhatsApp Business API Platform',
  
  // API Configuration
  api: {
    baseURL: process.env.REACT_APP_API_URL || 'http://localhost:3000/api/v1',
    timeout: parseInt(process.env.REACT_APP_API_TIMEOUT) || 30000,
    retryAttempts: 3,
    retryDelay: 1000
  },
  
  // Socket Configuration
  socket: {
    url: process.env.REACT_APP_SOCKET_URL || 'http://localhost:3000',
    options: {
      transports: ['websocket', 'polling'],
      timeout: 20000,
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000
    }
  },
  
  // Features
  features: {
    aiTools: process.env.REACT_APP_ENABLE_AI === 'true',
    analytics: process.env.REACT_APP_ENABLE_ANALYTICS === 'true',
    notifications: process.env.REACT_APP_ENABLE_NOTIFICATIONS !== 'false',
    darkMode: process.env.REACT_APP_ENABLE_DARK_MODE !== 'false',
    multiLanguage: process.env.REACT_APP_ENABLE_I18N === 'true'
  },
  
  // UI Configuration
  ui: {
    theme: {
      defaultTheme: 'light',
      storageKey: 'whatsapp-gateway-theme'
    },
    sidebar: {
      defaultCollapsed: false,
      storageKey: 'whatsapp-gateway-sidebar'
    },
    pagination: {
      defaultPageSize: 20,
      pageSizeOptions: [10, 20, 50, 100]
    },
    notifications: {
      position: 'top-right',
      maxNotifications: 5,
      defaultDuration: 5000
    }
  },
  
  // File Upload
  upload: {
    maxFileSize: 10 * 1024 * 1024, // 10MB
    allowedImageTypes: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
    allowedDocumentTypes: [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    ],
    allowedVideoTypes: ['video/mp4', 'video/avi', 'video/mov'],
    allowedAudioTypes: ['audio/mp3', 'audio/wav', 'audio/ogg']
  },
  
  // Validation
  validation: {
    phoneNumber: {
      minLength: 10,
      maxLength: 15,
      pattern: /^[1-9]\d{1,14}$/
    },
    message: {
      maxLength: 4096
    },
    campaign: {
      nameMaxLength: 100,
      descriptionMaxLength: 500
    }
  },
  
  // Performance
  performance: {
    virtualScrolling: {
      itemHeight: 72,
      overscan: 5
    },
    debounceDelay: 300,
    throttleDelay: 100
  },
  
  // Storage Keys
  storage: {
    auth: {
      token: 'whatsapp_gateway_token',
      refreshToken: 'whatsapp_gateway_refresh_token',
      user: 'whatsapp_gateway_user'
    },
    preferences: {
      theme: 'whatsapp_gateway_theme',
      language: 'whatsapp_gateway_language',
      sidebar: 'whatsapp_gateway_sidebar'
    },
    cache: {
      prefix: 'wg_cache_',
      ttl: 5 * 60 * 1000 // 5 minutes
    }
  },
  
  // External Services
  external: {
    googleMaps: {
      apiKey: process.env.REACT_APP_GOOGLE_MAPS_API_KEY
    },
    analytics: {
      googleAnalyticsId: process.env.REACT_APP_GA_ID
    }
  }
};

export default APP_CONFIG;