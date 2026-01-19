import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { authAPI } from '../services/api';
import { 
  getStoredToken, 
  setStoredToken, 
  removeStoredToken,
  getStoredUser,
  setStoredUser
} from '../utils/storage/localStorage';
import { APP_CONFIG } from '../config/app.config';
import { ROLES, getRolePermissions, hasPermission } from '../utils/constants/permissions';
import { debugAuth } from '../utils/debug';
import toast from 'react-hot-toast';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(getStoredToken());
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [permissions, setPermissions] = useState([]);

  // Initialize auth state
  useEffect(() => {
    const initAuth = async () => {
      console.log('🚀 Initializing auth...');
      debugAuth();
      
      const savedToken = getStoredToken();
      const savedUser = getStoredUser();
      
      console.log('📦 Saved token exists:', !!savedToken);
      console.log('👤 Saved user exists:', !!savedUser);
      
      if (savedToken && savedUser) {
        try {
          console.log('✅ Setting initial auth state from storage');
          // Set initial state from storage
          setUser(savedUser);
          setToken(savedToken);
          setIsAuthenticated(true);
          setPermissions(getRolePermissions(savedUser.role));
          
          console.log('🔄 Verifying token with server...');
          // Verify token is still valid in background
          const response = await authAPI.getProfile();
          const userData = response.data;
          
          console.log('✅ Token verified, user data:', userData);
          
          // Update with fresh data if different
          if (JSON.stringify(userData) !== JSON.stringify(savedUser)) {
            console.log('🔄 Updating user data with fresh info');
            setUser(userData);
            setStoredUser(userData);
            setPermissions(getRolePermissions(userData.role));
          }
          
        } catch (error) {
          console.error('❌ Token verification failed:', error);
          // Only clear auth if it's actually an auth error (401)
          if (error.status === 401) {
            console.log('🧹 Clearing invalid auth data');
            removeStoredToken();
            setUser(null);
            setToken(null);
            setIsAuthenticated(false);
            setPermissions([]);
          } else {
            console.log('⚠️ Network error, keeping user logged in');
          }
          // For other errors (network, etc), keep the user logged in
        }
      } else {
        console.log('❌ No saved auth data found');
        // No saved auth data
        setUser(null);
        setToken(null);
        setIsAuthenticated(false);
        setPermissions([]);
      }
      
      console.log('✅ Auth initialization complete');
      setLoading(false);
    };

    initAuth();
  }, []);

  // Login function
  const login = useCallback(async (email, password, rememberMe = false) => {
    try {
      console.log('🔐 Starting login process...');
      setLoading(true);
      
      const response = await authAPI.login({ 
        email, 
        password, 
        remember_me: rememberMe 
      });
      
      console.log('✅ Login API response:', response);
      
      const { token: newToken, user: userData, refresh_token } = response.data;
      
      console.log('📦 Storing auth data...');
      // Store auth data
      setStoredToken(newToken);
      setStoredUser(userData);
      
      if (refresh_token) {
        localStorage.setItem('whatsapp_gateway_refresh_token', refresh_token);
      }
      
      console.log('🔄 Updating auth state...');
      // Update state
      setToken(newToken);
      setUser(userData);
      setIsAuthenticated(true);
      setPermissions(getRolePermissions(userData.role));
      
      console.log('✅ Login successful, user:', userData);
      toast.success('Login berhasil!');
      
      const redirectTo = userData.role === 'admin' || userData.role === 'super_admin' ? '/admin' : '/dashboard';
      console.log('🔄 Redirecting to:', redirectTo);
      
      return { 
        success: true, 
        user: userData,
        redirectTo
      };
      
    } catch (error) {
      console.error('❌ Login failed:', error);
      const message = error.message || 'Login gagal';
      toast.error(message);
      return { success: false, error: message };
    } finally {
      setLoading(false);
    }
  }, []);

  // Register function
  const register = useCallback(async (userData) => {
    try {
      setLoading(true);
      
      const response = await authAPI.register(userData);
      
      toast.success('Registrasi berhasil! Silakan periksa email untuk verifikasi.');
      return { success: true, data: response.data };
      
    } catch (error) {
      const message = error.message || 'Registrasi gagal';
      toast.error(message);
      return { success: false, error: message };
    } finally {
      setLoading(false);
    }
  }, []);

  // Logout function
  const logout = useCallback(async () => {
    try {
      // Call logout API
      await authAPI.logout();
    } catch (error) {
      // Continue with logout even if API call fails
      console.error('Logout API error:', error);
    } finally {
      // Clear local state and storage
      removeStoredToken();
      setUser(null);
      setToken(null);
      setIsAuthenticated(false);
      setPermissions([]);
      
      toast.success('Logout berhasil');
    }
  }, []);

  // Forgot password function
  const forgotPassword = useCallback(async (email) => {
    try {
      await authAPI.forgotPassword({ email });
      toast.success('Link reset password telah dikirim ke email Anda');
      return { success: true };
    } catch (error) {
      const message = error.message || 'Gagal mengirim email reset';
      toast.error(message);
      return { success: false, error: message };
    }
  }, []);

  // Reset password function
  const resetPassword = useCallback(async (token, password) => {
    try {
      await authAPI.resetPassword({ token, password });
      toast.success('Password berhasil direset');
      return { success: true };
    } catch (error) {
      const message = error.message || 'Gagal reset password';
      toast.error(message);
      return { success: false, error: message };
    }
  }, []);

  // Update profile function
  const updateProfile = useCallback(async (profileData) => {
    try {
      const response = await authAPI.updateProfile(profileData);
      const updatedUser = response.data;
      
      setUser(updatedUser);
      setStoredUser(updatedUser);
      
      toast.success('Profile berhasil diupdate');
      return { success: true, data: updatedUser };
      
    } catch (error) {
      const message = error.message || 'Gagal update profile';
      toast.error(message);
      return { success: false, error: message };
    }
  }, []);

  // Change password function
  const changePassword = useCallback(async (currentPassword, newPassword) => {
    try {
      await authAPI.changePassword({ 
        current_password: currentPassword, 
        new_password: newPassword 
      });
      
      toast.success('Password berhasil diubah');
      return { success: true };
      
    } catch (error) {
      const message = error.message || 'Gagal mengubah password';
      toast.error(message);
      return { success: false, error: message };
    }
  }, []);

  // Permission checking functions
  const checkPermission = useCallback((permission) => {
    return hasPermission(permissions, permission);
  }, [permissions]);

  const checkAnyPermission = useCallback((requiredPermissions) => {
    return requiredPermissions.some(permission => 
      hasPermission(permissions, permission)
    );
  }, [permissions]);

  const checkAllPermissions = useCallback((requiredPermissions) => {
    return requiredPermissions.every(permission => 
      hasPermission(permissions, permission)
    );
  }, [permissions]);

  // Quota checking function
  const checkQuota = useCallback((resource, action = 'create') => {
    if (!user?.quotas || !user.quotas[resource]) {
      return false;
    }
    
    const quota = user.quotas[resource];
    
    if (action === 'create') {
      return quota.used < quota.limit;
    }
    
    return true;
  }, [user]);

  // Get quota usage
  const getQuotaUsage = useCallback((resource) => {
    if (!user?.quotas || !user.quotas[resource]) {
      return { used: 0, limit: 0, percentage: 0 };
    }
    
    const quota = user.quotas[resource];
    const percentage = quota.limit > 0 ? (quota.used / quota.limit) * 100 : 0;
    
    return {
      used: quota.used,
      limit: quota.limit,
      percentage: Math.round(percentage)
    };
  }, [user]);

  // Refresh user data
  const refreshUser = useCallback(async () => {
    try {
      const response = await authAPI.getProfile();
      const userData = response.data;
      
      setUser(userData);
      setStoredUser(userData);
      setPermissions(getRolePermissions(userData.role));
      
      return userData;
    } catch (error) {
      console.error('Failed to refresh user data:', error);
      return null;
    }
  }, []);

  // Listen for auth errors from API client
  useEffect(() => {
    const handleAuthError = () => {
      // Only logout if we're currently authenticated
      if (isAuthenticated) {
        console.log('Auth error received, logging out');
        logout();
      }
    };

    // Listen for storage changes (cross-tab logout)
    const handleStorageChange = (event) => {
      if (event.key === APP_CONFIG.storage.auth.token && !event.newValue && isAuthenticated) {
        // Token was removed in another tab
        setUser(null);
        setToken(null);
        setIsAuthenticated(false);
        setPermissions([]);
      }
    };

    window.addEventListener('auth:error', handleAuthError);
    window.addEventListener('storage', handleStorageChange);
    
    return () => {
      window.removeEventListener('auth:error', handleAuthError);
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [logout, isAuthenticated]);

  const value = {
    // State
    user,
    token,
    loading,
    isAuthenticated,
    permissions,
    
    // Computed properties
    isAdmin: user?.role === ROLES.ADMIN || user?.role === ROLES.SUPER_ADMIN,
    isSuperAdmin: user?.role === ROLES.SUPER_ADMIN,
    isUser: user?.role === ROLES.USER,
    
    // Auth methods
    login,
    register,
    logout,
    forgotPassword,
    resetPassword,
    updateProfile,
    changePassword,
    refreshUser,
    
    // Permission methods
    checkPermission,
    checkAnyPermission,
    checkAllPermissions,
    
    // Quota methods
    checkQuota,
    getQuotaUsage
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};