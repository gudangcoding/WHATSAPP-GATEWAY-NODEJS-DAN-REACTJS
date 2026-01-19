import { APP_CONFIG } from '../../config/app.config';

/**
 * Local Storage Utilities with error handling and encryption support
 */

/**
 * Set item in localStorage with error handling
 */
export const setStorageItem = (key, value) => {
  try {
    const serializedValue = JSON.stringify(value);
    localStorage.setItem(key, serializedValue);
    return true;
  } catch (error) {
    console.error('Error setting localStorage item:', error);
    return false;
  }
};

/**
 * Get item from localStorage with error handling
 */
export const getStorageItem = (key, defaultValue = null) => {
  try {
    const item = localStorage.getItem(key);
    if (item === null) return defaultValue;
    return JSON.parse(item);
  } catch (error) {
    console.error('Error getting localStorage item:', error);
    return defaultValue;
  }
};

/**
 * Remove item from localStorage
 */
export const removeStorageItem = (key) => {
  try {
    localStorage.removeItem(key);
    return true;
  } catch (error) {
    console.error('Error removing localStorage item:', error);
    return false;
  }
};

/**
 * Clear all localStorage items with app prefix
 */
export const clearAppStorage = () => {
  try {
    const keys = Object.keys(localStorage);
    const appKeys = keys.filter(key => 
      key.startsWith('whatsapp_gateway_') || 
      key.startsWith('wg_')
    );
    
    appKeys.forEach(key => localStorage.removeItem(key));
    return true;
  } catch (error) {
    console.error('Error clearing app storage:', error);
    return false;
  }
};

/**
 * Check if localStorage is available
 */
export const isStorageAvailable = () => {
  try {
    const test = '__storage_test__';
    localStorage.setItem(test, test);
    localStorage.removeItem(test);
    return true;
  } catch (error) {
    return false;
  }
};

/**
 * Get storage usage information
 */
export const getStorageUsage = () => {
  if (!isStorageAvailable()) return null;
  
  try {
    let totalSize = 0;
    const keys = Object.keys(localStorage);
    
    keys.forEach(key => {
      const value = localStorage.getItem(key);
      totalSize += key.length + (value?.length || 0);
    });
    
    return {
      used: totalSize,
      available: 5 * 1024 * 1024 - totalSize, // Assume 5MB limit
      percentage: (totalSize / (5 * 1024 * 1024)) * 100
    };
  } catch (error) {
    console.error('Error calculating storage usage:', error);
    return null;
  }
};

// Auth-specific storage functions
export const setStoredToken = (token) => {
  return setStorageItem(APP_CONFIG.storage.auth.token, token);
};

export const getStoredToken = () => {
  return getStorageItem(APP_CONFIG.storage.auth.token);
};

export const removeStoredToken = () => {
  removeStorageItem(APP_CONFIG.storage.auth.token);
  removeStorageItem(APP_CONFIG.storage.auth.refreshToken);
  removeStorageItem(APP_CONFIG.storage.auth.user);
};

export const setStoredUser = (user) => {
  return setStorageItem(APP_CONFIG.storage.auth.user, user);
};

export const getStoredUser = () => {
  return getStorageItem(APP_CONFIG.storage.auth.user);
};

// Preferences storage functions
export const setStoredTheme = (theme) => {
  return setStorageItem(APP_CONFIG.storage.preferences.theme, theme);
};

export const getStoredTheme = () => {
  return getStorageItem(APP_CONFIG.storage.preferences.theme, 'light');
};

export const setStoredLanguage = (language) => {
  return setStorageItem(APP_CONFIG.storage.preferences.language, language);
};

export const getStoredLanguage = () => {
  return getStorageItem(APP_CONFIG.storage.preferences.language, 'en');
};

export const setStoredSidebarState = (collapsed) => {
  return setStorageItem(APP_CONFIG.storage.preferences.sidebar, collapsed);
};

export const getStoredSidebarState = () => {
  return getStorageItem(APP_CONFIG.storage.preferences.sidebar, false);
};

// Cache management
export const setCacheItem = (key, data, ttl = APP_CONFIG.storage.cache.ttl) => {
  const cacheKey = `${APP_CONFIG.storage.cache.prefix}${key}`;
  const cacheData = {
    data,
    timestamp: Date.now(),
    ttl
  };
  
  return setStorageItem(cacheKey, cacheData);
};

export const getCacheItem = (key) => {
  const cacheKey = `${APP_CONFIG.storage.cache.prefix}${key}`;
  const cacheData = getStorageItem(cacheKey);
  
  if (!cacheData) return null;
  
  const { data, timestamp, ttl } = cacheData;
  const now = Date.now();
  
  // Check if cache is expired
  if (now - timestamp > ttl) {
    removeStorageItem(cacheKey);
    return null;
  }
  
  return data;
};

export const removeCacheItem = (key) => {
  const cacheKey = `${APP_CONFIG.storage.cache.prefix}${key}`;
  return removeStorageItem(cacheKey);
};

export const clearExpiredCache = () => {
  try {
    const keys = Object.keys(localStorage);
    const cacheKeys = keys.filter(key => 
      key.startsWith(APP_CONFIG.storage.cache.prefix)
    );
    
    const now = Date.now();
    let clearedCount = 0;
    
    cacheKeys.forEach(key => {
      const cacheData = getStorageItem(key);
      if (cacheData && cacheData.timestamp && cacheData.ttl) {
        if (now - cacheData.timestamp > cacheData.ttl) {
          removeStorageItem(key);
          clearedCount++;
        }
      }
    });
    
    return clearedCount;
  } catch (error) {
    console.error('Error clearing expired cache:', error);
    return 0;
  }
};

// Storage event listener for cross-tab synchronization
export const addStorageListener = (callback) => {
  const handleStorageChange = (event) => {
    if (event.key && event.key.startsWith('whatsapp_gateway_')) {
      callback({
        key: event.key,
        oldValue: event.oldValue,
        newValue: event.newValue,
        url: event.url
      });
    }
  };
  
  window.addEventListener('storage', handleStorageChange);
  
  // Return cleanup function
  return () => {
    window.removeEventListener('storage', handleStorageChange);
  };
};

export default {
  setStorageItem,
  getStorageItem,
  removeStorageItem,
  clearAppStorage,
  isStorageAvailable,
  getStorageUsage,
  setStoredToken,
  getStoredToken,
  removeStoredToken,
  setStoredUser,
  getStoredUser,
  setStoredTheme,
  getStoredTheme,
  setStoredLanguage,
  getStoredLanguage,
  setStoredSidebarState,
  getStoredSidebarState,
  setCacheItem,
  getCacheItem,
  removeCacheItem,
  clearExpiredCache,
  addStorageListener
};