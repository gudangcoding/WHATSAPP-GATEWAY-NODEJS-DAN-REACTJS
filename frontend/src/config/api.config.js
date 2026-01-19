// API Configuration and Endpoints
export const API_ENDPOINTS = {
  // Authentication
  auth: {
    login: '/auth/login',
    logout: '/auth/logout',
    register: '/auth/register',
    refreshToken: '/auth/refresh-token',
    forgotPassword: '/auth/forgot-password',
    resetPassword: '/auth/reset-password',
    changePassword: '/auth/change-password',
    profile: '/auth/profile',
    verifyEmail: '/auth/verify-email',
    resendVerification: '/auth/resend-verification',
    enable2FA: '/auth/2fa/enable',
    disable2FA: '/auth/2fa/disable',
    verify2FA: '/auth/2fa/verify'
  },
  
  // Devices
  devices: {
    list: '/devices',
    create: '/devices',
    get: (id) => `/devices/${id}`,
    update: (id) => `/devices/${id}`,
    delete: (id) => `/devices/${id}`,
    connect: (id) => `/devices/${id}/connect`,
    disconnect: (id) => `/devices/${id}/disconnect`,
    restart: (id) => `/devices/${id}/restart`,
    qrCode: (id) => `/devices/${id}/qr`,
    status: (id) => `/devices/${id}/status`,
    logs: (id) => `/devices/${id}/logs`,
    stats: (id) => `/devices/${id}/stats`
  },
  
  // Messages
  messages: {
    list: '/messages',
    send: '/messages/send',
    sendBulk: '/messages/send-bulk',
    get: (id) => `/messages/${id}`,
    resend: (id) => `/messages/${id}/resend`,
    delete: (id) => `/messages/${id}`,
    stats: '/messages/stats',
    deliveryReport: (id) => `/messages/${id}/delivery-report`,
    templates: '/messages/templates'
  },
  
  // Contacts
  contacts: {
    list: '/contacts',
    create: '/contacts',
    get: (id) => `/contacts/${id}`,
    update: (id) => `/contacts/${id}`,
    delete: (id) => `/contacts/${id}`,
    import: '/contacts/import',
    export: '/contacts/export',
    scrape: '/contacts/scrape',
    groups: '/contacts/groups',
    groupCreate: '/contacts/groups',
    groupUpdate: (id) => `/contacts/groups/${id}`,
    groupDelete: (id) => `/contacts/groups/${id}`
  },
  
  // Auto Reply
  autoReply: {
    list: '/auto-reply',
    create: '/auto-reply',
    get: (id) => `/auto-reply/${id}`,
    update: (id) => `/auto-reply/${id}`,
    delete: (id) => `/auto-reply/${id}`,
    toggle: (id) => `/auto-reply/${id}/toggle`,
    test: (id) => `/auto-reply/${id}/test`,
    logs: (id) => `/auto-reply/${id}/logs`,
    stats: (id) => `/auto-reply/${id}/stats`
  },
  
  // Campaigns
  campaigns: {
    list: '/campaigns',
    create: '/campaigns',
    get: (id) => `/campaigns/${id}`,
    update: (id) => `/campaigns/${id}`,
    delete: (id) => `/campaigns/${id}`,
    start: (id) => `/campaigns/${id}/start`,
    pause: (id) => `/campaigns/${id}/pause`,
    resume: (id) => `/campaigns/${id}/resume`,
    stop: (id) => `/campaigns/${id}/stop`,
    stats: (id) => `/campaigns/${id}/stats`,
    targets: (id) => `/campaigns/${id}/targets`,
    addTargets: (id) => `/campaigns/${id}/targets`,
    removeTarget: (id, targetId) => `/campaigns/${id}/targets/${targetId}`
  },
  
  // AI Tools
  ai: {
    generateVariation: '/ai/generate/variation',
    optimizeContent: '/ai/optimize/content',
    analyzeSentiment: '/ai/analyze/sentiment',
    generateReply: '/ai/generate/reply',
    optimizeTiming: '/ai/optimize/timing',
    analyzeAudience: '/ai/analyze/audience',
    predictPerformance: '/ai/predict/performance',
    suggestContent: '/ai/suggest/content',
    translate: '/ai/translate',
    templates: '/ai/templates',
    usage: '/ai/usage'
  },
  
  // Analytics
  analytics: {
    dashboard: '/analytics/dashboard',
    messages: '/analytics/messages',
    devices: '/analytics/devices',
    campaigns: '/analytics/campaigns',
    users: '/analytics/users',
    revenue: '/analytics/revenue',
    performance: '/analytics/performance',
    export: (type) => `/analytics/export/${type}`
  },
  
  // Webhooks
  webhooks: {
    list: '/webhooks',
    create: '/webhooks',
    get: (id) => `/webhooks/${id}`,
    update: (id) => `/webhooks/${id}`,
    delete: (id) => `/webhooks/${id}`,
    test: (id) => `/webhooks/${id}/test`,
    logs: (id) => `/webhooks/${id}/logs`,
    stats: (id) => `/webhooks/${id}/stats`
  },
  
  // System
  system: {
    health: '/system/health',
    status: '/system/status',
    stats: '/system/stats',
    logs: '/system/logs',
    config: '/system/config',
    backup: '/system/backup',
    backups: '/system/backups',
    restoreBackup: (id) => `/system/backups/${id}/restore`,
    clearCache: '/system/cache/clear',
    restart: '/system/restart'
  },
  
  // Admin
  admin: {
    users: '/admin/users',
    userCreate: '/admin/users',
    userGet: (id) => `/admin/users/${id}`,
    userUpdate: (id) => `/admin/users/${id}`,
    userDelete: (id) => `/admin/users/${id}`,
    userSuspend: (id) => `/admin/users/${id}/suspend`,
    userActivate: (id) => `/admin/users/${id}/activate`,
    userDevices: (id) => `/admin/users/${id}/devices`,
    userMessages: (id) => `/admin/users/${id}/messages`,
    userStats: (id) => `/admin/users/${id}/stats`,
    systemStats: '/admin/stats',
    systemLogs: '/admin/logs'
  },
  
  // File Upload
  upload: {
    image: '/upload/image',
    document: '/upload/document',
    video: '/upload/video',
    audio: '/upload/audio',
    avatar: '/upload/avatar'
  }
};

// HTTP Status Codes
export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  NO_CONTENT: 204,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  UNPROCESSABLE_ENTITY: 422,
  TOO_MANY_REQUESTS: 429,
  INTERNAL_SERVER_ERROR: 500,
  BAD_GATEWAY: 502,
  SERVICE_UNAVAILABLE: 503
};

// Error Codes
export const ERROR_CODES = {
  NETWORK_ERROR: 'NETWORK_ERROR',
  AUTH_ERROR: 'AUTH_ERROR',
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  PERMISSION_ERROR: 'PERMISSION_ERROR',
  QUOTA_ERROR: 'QUOTA_ERROR',
  SERVER_ERROR: 'SERVER_ERROR',
  UNKNOWN_ERROR: 'UNKNOWN_ERROR'
};

export default { API_ENDPOINTS, HTTP_STATUS, ERROR_CODES };