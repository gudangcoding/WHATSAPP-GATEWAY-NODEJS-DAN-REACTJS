/**
 * Debug utilities for troubleshooting authentication issues
 */

export const debugAuth = () => {
  console.group('🔍 Auth Debug Info');
  
  // Check localStorage
  console.log('📦 LocalStorage:');
  console.log('- Token:', localStorage.getItem('whatsapp_gateway_token'));
  console.log('- User:', localStorage.getItem('whatsapp_gateway_user'));
  console.log('- Refresh Token:', localStorage.getItem('whatsapp_gateway_refresh_token'));
  
  // Check all localStorage keys
  const allKeys = Object.keys(localStorage);
  const appKeys = allKeys.filter(key => key.includes('whatsapp') || key.includes('wg_'));
  console.log('- All App Keys:', appKeys);
  
  // Check sessionStorage
  console.log('📦 SessionStorage:');
  const sessionKeys = Object.keys(sessionStorage);
  const appSessionKeys = sessionKeys.filter(key => key.includes('whatsapp') || key.includes('wg_'));
  console.log('- App Session Keys:', appSessionKeys);
  
  // Check current URL
  console.log('🌐 Current URL:', window.location.href);
  console.log('🌐 Pathname:', window.location.pathname);
  
  console.groupEnd();
};

export const clearAllAuthData = () => {
  console.log('🧹 Clearing all auth data...');
  
  // Clear localStorage
  const keys = Object.keys(localStorage);
  keys.forEach(key => {
    if (key.includes('whatsapp') || key.includes('wg_')) {
      localStorage.removeItem(key);
      console.log('Removed:', key);
    }
  });
  
  // Clear sessionStorage
  const sessionKeys = Object.keys(sessionStorage);
  sessionKeys.forEach(key => {
    if (key.includes('whatsapp') || key.includes('wg_')) {
      sessionStorage.removeItem(key);
      console.log('Removed from session:', key);
    }
  });
  
  console.log('✅ All auth data cleared');
};

// Make functions available globally for debugging
if (typeof window !== 'undefined') {
  window.debugAuth = debugAuth;
  window.clearAllAuthData = clearAllAuthData;
}

export default {
  debugAuth,
  clearAllAuthData
};