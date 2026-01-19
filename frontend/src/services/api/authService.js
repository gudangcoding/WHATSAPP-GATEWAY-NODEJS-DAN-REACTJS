import apiClient from './apiClient';
import { API_ENDPOINTS } from '../../config/api.config';

/**
 * Authentication Service
 * Handles all authentication-related API calls
 */
class AuthService {
  /**
   * User login
   */
  async login(credentials) {
    return await apiClient.post(API_ENDPOINTS.auth.login, credentials);
  }

  /**
   * User registration
   */
  async register(userData) {
    return await apiClient.post(API_ENDPOINTS.auth.register, userData);
  }

  /**
   * User logout
   */
  async logout() {
    return await apiClient.post(API_ENDPOINTS.auth.logout);
  }

  /**
   * Refresh authentication token
   */
  async refreshToken(refreshToken) {
    return await apiClient.post(API_ENDPOINTS.auth.refreshToken, {
      refresh_token: refreshToken
    });
  }

  /**
   * Get user profile
   */
  async getProfile() {
    return await apiClient.get(API_ENDPOINTS.auth.profile);
  }

  /**
   * Update user profile
   */
  async updateProfile(profileData) {
    return await apiClient.put(API_ENDPOINTS.auth.profile, profileData);
  }

  /**
   * Forgot password
   */
  async forgotPassword(email) {
    return await apiClient.post(API_ENDPOINTS.auth.forgotPassword, { email });
  }

  /**
   * Reset password
   */
  async resetPassword(data) {
    return await apiClient.post(API_ENDPOINTS.auth.resetPassword, data);
  }

  /**
   * Change password
   */
  async changePassword(data) {
    return await apiClient.post(API_ENDPOINTS.auth.changePassword, data);
  }

  /**
   * Verify email
   */
  async verifyEmail(token) {
    return await apiClient.post(API_ENDPOINTS.auth.verifyEmail, { token });
  }

  /**
   * Resend email verification
   */
  async resendVerification(email) {
    return await apiClient.post(API_ENDPOINTS.auth.resendVerification, { email });
  }

  /**
   * Enable 2FA
   */
  async enable2FA() {
    return await apiClient.post(API_ENDPOINTS.auth.enable2FA);
  }

  /**
   * Disable 2FA
   */
  async disable2FA(data) {
    return await apiClient.post(API_ENDPOINTS.auth.disable2FA, data);
  }

  /**
   * Verify 2FA code
   */
  async verify2FA(code) {
    return await apiClient.post(API_ENDPOINTS.auth.verify2FA, { code });
  }
}

// Create singleton instance
const authService = new AuthService();

export default authService;