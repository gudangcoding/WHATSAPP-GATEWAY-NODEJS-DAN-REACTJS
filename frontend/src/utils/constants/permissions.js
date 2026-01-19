/**
 * RBAC Permissions System
 * Defines all permissions and roles for the application
 */

// Permission Categories
export const PERMISSION_CATEGORIES = {
  DEVICES: 'devices',
  MESSAGES: 'messages',
  CONTACTS: 'contacts',
  AUTO_REPLY: 'auto_reply',
  CAMPAIGNS: 'campaigns',
  AI_TOOLS: 'ai_tools',
  ANALYTICS: 'analytics',
  WEBHOOKS: 'webhooks',
  USERS: 'users',
  SYSTEM: 'system',
  BILLING: 'billing'
};

// Permission Actions
export const PERMISSION_ACTIONS = {
  VIEW: 'view',
  CREATE: 'create',
  EDIT: 'edit',
  DELETE: 'delete',
  MANAGE: 'manage',
  EXECUTE: 'execute'
};

// Permission Scopes
export const PERMISSION_SCOPES = {
  OWN: 'own',
  ALL: 'all',
  TEAM: 'team'
};

// All Permissions Definition
export const PERMISSIONS = {
  // Device Permissions
  DEVICES_VIEW_OWN: 'devices.view_own',
  DEVICES_CREATE: 'devices.create',
  DEVICES_EDIT_OWN: 'devices.edit_own',
  DEVICES_DELETE_OWN: 'devices.delete_own',
  DEVICES_MANAGE_OWN: 'devices.manage_own',
  DEVICES_VIEW_ALL: 'devices.view_all',
  DEVICES_MANAGE_ALL: 'devices.manage_all',
  
  // Message Permissions
  MESSAGES_VIEW_OWN: 'messages.view_own',
  MESSAGES_SEND: 'messages.send',
  MESSAGES_EDIT_OWN: 'messages.edit_own',
  MESSAGES_DELETE_OWN: 'messages.delete_own',
  MESSAGES_VIEW_ALL: 'messages.view_all',
  MESSAGES_MANAGE_ALL: 'messages.manage_all',
  
  // Contact Permissions
  CONTACTS_VIEW_OWN: 'contacts.view_own',
  CONTACTS_CREATE: 'contacts.create',
  CONTACTS_EDIT_OWN: 'contacts.edit_own',
  CONTACTS_DELETE_OWN: 'contacts.delete_own',
  CONTACTS_IMPORT: 'contacts.import',
  CONTACTS_EXPORT_OWN: 'contacts.export_own',
  CONTACTS_VIEW_ALL: 'contacts.view_all',
  CONTACTS_MANAGE_ALL: 'contacts.manage_all',
  
  // Auto Reply Permissions
  AUTO_REPLY_VIEW_OWN: 'auto_reply.view_own',
  AUTO_REPLY_CREATE: 'auto_reply.create',
  AUTO_REPLY_EDIT_OWN: 'auto_reply.edit_own',
  AUTO_REPLY_DELETE_OWN: 'auto_reply.delete_own',
  AUTO_REPLY_MANAGE_OWN: 'auto_reply.manage_own',
  AUTO_REPLY_VIEW_ALL: 'auto_reply.view_all',
  AUTO_REPLY_MANAGE_ALL: 'auto_reply.manage_all',
  
  // Campaign Permissions
  CAMPAIGNS_VIEW_OWN: 'campaigns.view_own',
  CAMPAIGNS_CREATE: 'campaigns.create',
  CAMPAIGNS_EDIT_OWN: 'campaigns.edit_own',
  CAMPAIGNS_DELETE_OWN: 'campaigns.delete_own',
  CAMPAIGNS_MANAGE_OWN: 'campaigns.manage_own',
  CAMPAIGNS_VIEW_ALL: 'campaigns.view_all',
  CAMPAIGNS_MANAGE_ALL: 'campaigns.manage_all',
  
  // AI Tools Permissions
  AI_TOOLS_USE: 'ai_tools.use',
  AI_TOOLS_MANAGE: 'ai_tools.manage',
  AI_TOOLS_ADMIN: 'ai_tools.admin',
  
  // Analytics Permissions
  ANALYTICS_VIEW_OWN: 'analytics.view_own',
  ANALYTICS_EXPORT_OWN: 'analytics.export_own',
  ANALYTICS_VIEW_ALL: 'analytics.view_all',
  ANALYTICS_GLOBAL: 'analytics.global',
  
  // Webhook Permissions
  WEBHOOKS_VIEW_OWN: 'webhooks.view_own',
  WEBHOOKS_CREATE: 'webhooks.create',
  WEBHOOKS_EDIT_OWN: 'webhooks.edit_own',
  WEBHOOKS_DELETE_OWN: 'webhooks.delete_own',
  WEBHOOKS_MANAGE_OWN: 'webhooks.manage_own',
  WEBHOOKS_VIEW_ALL: 'webhooks.view_all',
  WEBHOOKS_MANAGE_ALL: 'webhooks.manage_all',
  
  // User Management Permissions
  USERS_VIEW_ALL: 'users.view_all',
  USERS_CREATE: 'users.create',
  USERS_EDIT: 'users.edit',
  USERS_DELETE: 'users.delete',
  USERS_MANAGE_PERMISSIONS: 'users.manage_permissions',
  USERS_IMPERSONATE: 'users.impersonate',
  
  // System Permissions
  SYSTEM_MONITORING: 'system.monitoring',
  SYSTEM_LOGS: 'system.logs',
  SYSTEM_SETTINGS: 'system.settings',
  SYSTEM_MAINTENANCE: 'system.maintenance',
  SYSTEM_BACKUP: 'system.backup',
  
  // Billing Permissions
  BILLING_VIEW: 'billing.view',
  BILLING_MANAGE: 'billing.manage',
  
  // Profile Permissions
  PROFILE_VIEW_OWN: 'profile.view_own',
  PROFILE_EDIT_OWN: 'profile.edit_own',
  
  // API Key Permissions
  API_KEYS_VIEW_OWN: 'api_keys.view_own',
  API_KEYS_CREATE: 'api_keys.create',
  API_KEYS_DELETE_OWN: 'api_keys.delete_own',
  API_KEYS_MANAGE_ALL: 'api_keys.manage_all'
};

// Role Definitions
export const ROLES = {
  SUPER_ADMIN: 'super_admin',
  ADMIN: 'admin',
  USER: 'user',
  VIEWER: 'viewer'
};

// Role Permissions Mapping
export const ROLE_PERMISSIONS = {
  [ROLES.SUPER_ADMIN]: [
    // All permissions
    ...Object.values(PERMISSIONS)
  ],
  
  [ROLES.ADMIN]: [
    // User permissions
    PERMISSIONS.DEVICES_VIEW_OWN,
    PERMISSIONS.DEVICES_CREATE,
    PERMISSIONS.DEVICES_MANAGE_OWN,
    PERMISSIONS.MESSAGES_VIEW_OWN,
    PERMISSIONS.MESSAGES_SEND,
    PERMISSIONS.MESSAGES_MANAGE_OWN,
    PERMISSIONS.CONTACTS_VIEW_OWN,
    PERMISSIONS.CONTACTS_CREATE,
    PERMISSIONS.CONTACTS_MANAGE_OWN,
    PERMISSIONS.CONTACTS_IMPORT,
    PERMISSIONS.CONTACTS_EXPORT_OWN,
    PERMISSIONS.AUTO_REPLY_VIEW_OWN,
    PERMISSIONS.AUTO_REPLY_CREATE,
    PERMISSIONS.AUTO_REPLY_MANAGE_OWN,
    PERMISSIONS.CAMPAIGNS_VIEW_OWN,
    PERMISSIONS.CAMPAIGNS_CREATE,
    PERMISSIONS.CAMPAIGNS_MANAGE_OWN,
    PERMISSIONS.AI_TOOLS_USE,
    PERMISSIONS.ANALYTICS_VIEW_OWN,
    PERMISSIONS.ANALYTICS_EXPORT_OWN,
    PERMISSIONS.WEBHOOKS_VIEW_OWN,
    PERMISSIONS.WEBHOOKS_CREATE,
    PERMISSIONS.WEBHOOKS_MANAGE_OWN,
    PERMISSIONS.PROFILE_VIEW_OWN,
    PERMISSIONS.PROFILE_EDIT_OWN,
    PERMISSIONS.API_KEYS_VIEW_OWN,
    PERMISSIONS.API_KEYS_CREATE,
    PERMISSIONS.API_KEYS_DELETE_OWN,
    
    // Admin permissions
    PERMISSIONS.DEVICES_VIEW_ALL,
    PERMISSIONS.DEVICES_MANAGE_ALL,
    PERMISSIONS.MESSAGES_VIEW_ALL,
    PERMISSIONS.MESSAGES_MANAGE_ALL,
    PERMISSIONS.CONTACTS_VIEW_ALL,
    PERMISSIONS.CONTACTS_MANAGE_ALL,
    PERMISSIONS.AUTO_REPLY_VIEW_ALL,
    PERMISSIONS.AUTO_REPLY_MANAGE_ALL,
    PERMISSIONS.CAMPAIGNS_VIEW_ALL,
    PERMISSIONS.CAMPAIGNS_MANAGE_ALL,
    PERMISSIONS.AI_TOOLS_MANAGE,
    PERMISSIONS.ANALYTICS_VIEW_ALL,
    PERMISSIONS.ANALYTICS_GLOBAL,
    PERMISSIONS.WEBHOOKS_VIEW_ALL,
    PERMISSIONS.WEBHOOKS_MANAGE_ALL,
    PERMISSIONS.USERS_VIEW_ALL,
    PERMISSIONS.USERS_CREATE,
    PERMISSIONS.USERS_EDIT,
    PERMISSIONS.USERS_MANAGE_PERMISSIONS,
    PERMISSIONS.SYSTEM_MONITORING,
    PERMISSIONS.SYSTEM_LOGS,
    PERMISSIONS.API_KEYS_MANAGE_ALL
  ],
  
  [ROLES.USER]: [
    // Own resource permissions
    PERMISSIONS.DEVICES_VIEW_OWN,
    PERMISSIONS.DEVICES_CREATE,
    PERMISSIONS.DEVICES_MANAGE_OWN,
    PERMISSIONS.MESSAGES_VIEW_OWN,
    PERMISSIONS.MESSAGES_SEND,
    PERMISSIONS.MESSAGES_EDIT_OWN,
    PERMISSIONS.MESSAGES_DELETE_OWN,
    PERMISSIONS.CONTACTS_VIEW_OWN,
    PERMISSIONS.CONTACTS_CREATE,
    PERMISSIONS.CONTACTS_EDIT_OWN,
    PERMISSIONS.CONTACTS_DELETE_OWN,
    PERMISSIONS.CONTACTS_IMPORT,
    PERMISSIONS.CONTACTS_EXPORT_OWN,
    PERMISSIONS.AUTO_REPLY_VIEW_OWN,
    PERMISSIONS.AUTO_REPLY_CREATE,
    PERMISSIONS.AUTO_REPLY_MANAGE_OWN,
    PERMISSIONS.CAMPAIGNS_VIEW_OWN,
    PERMISSIONS.CAMPAIGNS_CREATE,
    PERMISSIONS.CAMPAIGNS_MANAGE_OWN,
    PERMISSIONS.AI_TOOLS_USE,
    PERMISSIONS.ANALYTICS_VIEW_OWN,
    PERMISSIONS.ANALYTICS_EXPORT_OWN,
    PERMISSIONS.WEBHOOKS_VIEW_OWN,
    PERMISSIONS.WEBHOOKS_CREATE,
    PERMISSIONS.WEBHOOKS_MANAGE_OWN,
    PERMISSIONS.PROFILE_VIEW_OWN,
    PERMISSIONS.PROFILE_EDIT_OWN,
    PERMISSIONS.API_KEYS_VIEW_OWN,
    PERMISSIONS.API_KEYS_CREATE,
    PERMISSIONS.API_KEYS_DELETE_OWN
  ],
  
  [ROLES.VIEWER]: [
    // Read-only permissions
    PERMISSIONS.DEVICES_VIEW_OWN,
    PERMISSIONS.MESSAGES_VIEW_OWN,
    PERMISSIONS.CONTACTS_VIEW_OWN,
    PERMISSIONS.AUTO_REPLY_VIEW_OWN,
    PERMISSIONS.CAMPAIGNS_VIEW_OWN,
    PERMISSIONS.ANALYTICS_VIEW_OWN,
    PERMISSIONS.WEBHOOKS_VIEW_OWN,
    PERMISSIONS.PROFILE_VIEW_OWN,
    PERMISSIONS.API_KEYS_VIEW_OWN
  ]
};

// Permission Helper Functions
export const hasPermission = (userPermissions, requiredPermission) => {
  if (!userPermissions || !Array.isArray(userPermissions)) {
    return false;
  }
  return userPermissions.includes(requiredPermission);
};

export const hasAnyPermission = (userPermissions, requiredPermissions) => {
  if (!userPermissions || !Array.isArray(userPermissions)) {
    return false;
  }
  return requiredPermissions.some(permission => 
    userPermissions.includes(permission)
  );
};

export const hasAllPermissions = (userPermissions, requiredPermissions) => {
  if (!userPermissions || !Array.isArray(userPermissions)) {
    return false;
  }
  return requiredPermissions.every(permission => 
    userPermissions.includes(permission)
  );
};

export const getRolePermissions = (role) => {
  return ROLE_PERMISSIONS[role] || [];
};

export const canAccessResource = (userPermissions, resource, action, scope = 'own') => {
  const permission = `${resource}.${action}_${scope}`;
  return hasPermission(userPermissions, permission);
};

export const getPermissionLevel = (userPermissions, resource) => {
  const levels = ['none', 'view', 'edit', 'manage', 'admin'];
  
  for (let i = levels.length - 1; i >= 0; i--) {
    const level = levels[i];
    const permission = `${resource}.${level}_own`;
    
    if (hasPermission(userPermissions, permission)) {
      return level;
    }
  }
  
  return 'none';
};

// Permission Groups for UI
export const PERMISSION_GROUPS = {
  'Device Management': [
    PERMISSIONS.DEVICES_VIEW_OWN,
    PERMISSIONS.DEVICES_CREATE,
    PERMISSIONS.DEVICES_MANAGE_OWN,
    PERMISSIONS.DEVICES_VIEW_ALL,
    PERMISSIONS.DEVICES_MANAGE_ALL
  ],
  'Message Management': [
    PERMISSIONS.MESSAGES_VIEW_OWN,
    PERMISSIONS.MESSAGES_SEND,
    PERMISSIONS.MESSAGES_MANAGE_OWN,
    PERMISSIONS.MESSAGES_VIEW_ALL,
    PERMISSIONS.MESSAGES_MANAGE_ALL
  ],
  'Contact Management': [
    PERMISSIONS.CONTACTS_VIEW_OWN,
    PERMISSIONS.CONTACTS_CREATE,
    PERMISSIONS.CONTACTS_MANAGE_OWN,
    PERMISSIONS.CONTACTS_IMPORT,
    PERMISSIONS.CONTACTS_EXPORT_OWN,
    PERMISSIONS.CONTACTS_VIEW_ALL,
    PERMISSIONS.CONTACTS_MANAGE_ALL
  ],
  'Campaign Management': [
    PERMISSIONS.CAMPAIGNS_VIEW_OWN,
    PERMISSIONS.CAMPAIGNS_CREATE,
    PERMISSIONS.CAMPAIGNS_MANAGE_OWN,
    PERMISSIONS.CAMPAIGNS_VIEW_ALL,
    PERMISSIONS.CAMPAIGNS_MANAGE_ALL
  ],
  'System Administration': [
    PERMISSIONS.USERS_VIEW_ALL,
    PERMISSIONS.USERS_CREATE,
    PERMISSIONS.USERS_EDIT,
    PERMISSIONS.USERS_DELETE,
    PERMISSIONS.USERS_MANAGE_PERMISSIONS,
    PERMISSIONS.SYSTEM_MONITORING,
    PERMISSIONS.SYSTEM_LOGS,
    PERMISSIONS.SYSTEM_SETTINGS,
    PERMISSIONS.SYSTEM_MAINTENANCE
  ]
};

export default {
  PERMISSIONS,
  ROLES,
  ROLE_PERMISSIONS,
  PERMISSION_CATEGORIES,
  PERMISSION_ACTIONS,
  PERMISSION_SCOPES,
  PERMISSION_GROUPS,
  hasPermission,
  hasAnyPermission,
  hasAllPermissions,
  getRolePermissions,
  canAccessResource,
  getPermissionLevel
};