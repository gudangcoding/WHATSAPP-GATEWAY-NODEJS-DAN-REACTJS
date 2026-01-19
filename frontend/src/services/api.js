import axios from 'axios';

// Create axios instance
const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:3000/api/v1',
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  login: (data) => api.post('/auth/login', data),
  register: (data) => api.post('/auth/register', data),
  logout: () => api.post('/auth/logout'),
  getProfile: () => api.get('/auth/profile'),
  updateProfile: (data) => api.put('/auth/profile', data),
  forgotPassword: (data) => api.post('/auth/forgot-password', data),
  resetPassword: (data) => api.post('/auth/reset-password', data),
  verifyEmail: (token) => api.post(`/auth/verify-email/${token}`),
  resendVerification: () => api.post('/auth/resend-verification'),
  enable2FA: () => api.post('/auth/2fa/enable'),
  verify2FA: (data) => api.post('/auth/2fa/verify', data),
  disable2FA: (data) => api.post('/auth/2fa/disable', data),
};

// Devices API
export const devicesAPI = {
  getAll: (params) => api.get('/devices', { params }),
  getById: (id) => api.get(`/devices/${id}`),
  create: (data) => api.post('/devices', data),
  update: (id, data) => api.put(`/devices/${id}`, data),
  delete: (id) => api.delete(`/devices/${id}`),
  connect: (id) => api.post(`/devices/${id}/connect`),
  disconnect: (id) => api.post(`/devices/${id}/disconnect`),
  getQR: (id) => api.get(`/devices/${id}/qr`),
  getStatus: (id) => api.get(`/devices/${id}/status`),
  getStats: (id) => api.get(`/devices/${id}/stats`),
};

// Messages API
export const messagesAPI = {
  getAll: (params) => api.get('/messages', { params }),
  getById: (id) => api.get(`/messages/${id}`),
  send: (data) => api.post('/messages/send', data),
  sendBulk: (data) => api.post('/messages/send-bulk', data),
  schedule: (data) => api.post('/messages/schedule', data),
  cancel: (id) => api.post(`/messages/${id}/cancel`),
  retry: (id) => api.post(`/messages/${id}/retry`),
  getStats: (params) => api.get('/messages/stats', { params }),
  getDeliveryReport: (id) => api.get(`/messages/${id}/delivery-report`),
};

// Contacts API
export const contactsAPI = {
  getAll: (params) => api.get('/contacts', { params }),
  getById: (id) => api.get(`/contacts/${id}`),
  create: (data) => api.post('/contacts', data),
  update: (id, data) => api.put(`/contacts/${id}`, data),
  delete: (id) => api.delete(`/contacts/${id}`),
  import: (data) => api.post('/contacts/import', data),
  export: (params) => api.get('/contacts/export', { params }),
  scrape: (data) => api.post('/contacts/scrape', data),
  getGroups: (params) => api.get('/contacts/groups', { params }),
  createGroup: (data) => api.post('/contacts/groups', data),
  updateGroup: (id, data) => api.put(`/contacts/groups/${id}`, data),
  deleteGroup: (id) => api.delete(`/contacts/groups/${id}`),
};

// Auto Reply API
export const autoReplyAPI = {
  getAll: (params) => api.get('/auto-reply', { params }),
  getById: (id) => api.get(`/auto-reply/${id}`),
  create: (data) => api.post('/auto-reply', data),
  update: (id, data) => api.put(`/auto-reply/${id}`, data),
  delete: (id) => api.delete(`/auto-reply/${id}`),
  toggle: (id) => api.post(`/auto-reply/${id}/toggle`),
  test: (id, data) => api.post(`/auto-reply/${id}/test`, data),
  getLogs: (id, params) => api.get(`/auto-reply/${id}/logs`, { params }),
  getStats: (id, params) => api.get(`/auto-reply/${id}/stats`, { params }),
};

// Campaigns API
export const campaignsAPI = {
  getAll: (params) => api.get('/campaigns', { params }),
  getById: (id) => api.get(`/campaigns/${id}`),
  create: (data) => api.post('/campaigns', data),
  update: (id, data) => api.put(`/campaigns/${id}`, data),
  delete: (id) => api.delete(`/campaigns/${id}`),
  start: (id) => api.post(`/campaigns/${id}/start`),
  pause: (id) => api.post(`/campaigns/${id}/pause`),
  resume: (id) => api.post(`/campaigns/${id}/resume`),
  stop: (id) => api.post(`/campaigns/${id}/stop`),
  getStats: (id) => api.get(`/campaigns/${id}/stats`),
  getTargets: (id, params) => api.get(`/campaigns/${id}/targets`, { params }),
  addTargets: (id, data) => api.post(`/campaigns/${id}/targets`, data),
  removeTarget: (id, targetId) => api.delete(`/campaigns/${id}/targets/${targetId}`),
};

// AI API
export const aiAPI = {
  generateVariation: (data) => api.post('/ai/generate/variation', data),
  optimizeContent: (data) => api.post('/ai/optimize/content', data),
  analyzeSentiment: (data) => api.post('/ai/analyze/sentiment', data),
  generateReply: (data) => api.post('/ai/generate/reply', data),
  optimizeTiming: (data) => api.post('/ai/optimize/timing', data),
  analyzeAudience: (data) => api.post('/ai/analyze/audience', data),
  predictPerformance: (data) => api.post('/ai/predict/performance', data),
  suggestContent: (data) => api.post('/ai/suggest/content', data),
  translate: (data) => api.post('/ai/translate', data),
  getTemplates: (params) => api.get('/ai/templates', { params }),
  createTemplate: (data) => api.post('/ai/templates', data),
  updateTemplate: (id, data) => api.put(`/ai/templates/${id}`, data),
  deleteTemplate: (id) => api.delete(`/ai/templates/${id}`),
  getUsage: (params) => api.get('/ai/usage', { params }),
};

// Webhooks API
export const webhooksAPI = {
  getAll: (params) => api.get('/webhooks', { params }),
  getById: (id) => api.get(`/webhooks/${id}`),
  create: (data) => api.post('/webhooks', data),
  update: (id, data) => api.put(`/webhooks/${id}`, data),
  delete: (id) => api.delete(`/webhooks/${id}`),
  test: (id) => api.post(`/webhooks/${id}/test`),
  getLogs: (id, params) => api.get(`/webhooks/${id}/logs`, { params }),
  getStats: (id) => api.get(`/webhooks/${id}/stats`),
};

// Analytics API
export const analyticsAPI = {
  getDashboard: (params) => api.get('/analytics/dashboard', { params }),
  getMessages: (params) => api.get('/analytics/messages', { params }),
  getDevices: (params) => api.get('/analytics/devices', { params }),
  getCampaigns: (params) => api.get('/analytics/campaigns', { params }),
  getUsers: (params) => api.get('/analytics/users', { params }),
  getRevenue: (params) => api.get('/analytics/revenue', { params }),
  getPerformance: (params) => api.get('/analytics/performance', { params }),
  exportReport: (type, params) => api.get(`/analytics/export/${type}`, { params }),
};

// System API
export const systemAPI = {
  getHealth: () => api.get('/system/health'),
  getStatus: () => api.get('/system/status'),
  getStats: () => api.get('/system/stats'),
  getLogs: (params) => api.get('/system/logs', { params }),
  getConfig: () => api.get('/system/config'),
  updateConfig: (data) => api.put('/system/config', data),
  backup: () => api.post('/system/backup'),
  getBackups: () => api.get('/system/backups'),
  restoreBackup: (id) => api.post(`/system/backups/${id}/restore`),
  clearCache: () => api.post('/system/cache/clear'),
  restartServices: () => api.post('/system/restart'),
};

// Admin API
export const adminAPI = {
  getUsers: (params) => api.get('/admin/users', { params }),
  getUserById: (id) => api.get(`/admin/users/${id}`),
  createUser: (data) => api.post('/admin/users', data),
  updateUser: (id, data) => api.put(`/admin/users/${id}`, data),
  deleteUser: (id) => api.delete(`/admin/users/${id}`),
  suspendUser: (id) => api.post(`/admin/users/${id}/suspend`),
  activateUser: (id) => api.post(`/admin/users/${id}/activate`),
  getUserDevices: (id, params) => api.get(`/admin/users/${id}/devices`, { params }),
  getUserMessages: (id, params) => api.get(`/admin/users/${id}/messages`, { params }),
  getUserStats: (id) => api.get(`/admin/users/${id}/stats`),
  getSystemStats: () => api.get('/admin/stats'),
  getSystemLogs: (params) => api.get('/admin/logs', { params }),
};

export default api;