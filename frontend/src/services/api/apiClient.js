import axios from 'axios';
import { APP_CONFIG } from '../../config/app.config';
import { HTTP_STATUS, ERROR_CODES } from '../../config/api.config';
import { getStoredToken, removeStoredToken, setStoredToken } from '../../utils/storage/localStorage';

class ApiClient {
  constructor() {
    this.baseURL = APP_CONFIG.api.baseURL;
    this.timeout = APP_CONFIG.api.timeout;
    this.retryAttempts = APP_CONFIG.api.retryAttempts;
    this.retryDelay = APP_CONFIG.api.retryDelay;
    
    // Create axios instance
    this.client = axios.create({
      baseURL: this.baseURL,
      timeout: this.timeout,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      }
    });
    
    // Setup interceptors
    this.setupRequestInterceptor();
    this.setupResponseInterceptor();
    
    // Track request queue for retry logic
    this.requestQueue = new Map();
  }
  
  /**
   * Setup request interceptor
   */
  setupRequestInterceptor() {
    this.client.interceptors.request.use(
      (config) => {
        // Add auth token
        const token = getStoredToken();
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        
        // Add request ID for tracking
        config.metadata = {
          requestId: this.generateRequestId(),
          startTime: Date.now()
        };
        
        // Log request in development
        if (process.env.NODE_ENV === 'development') {
          console.log(`🚀 API Request [${config.metadata.requestId}]:`, {
            method: config.method?.toUpperCase(),
            url: config.url,
            data: config.data
          });
        }
        
        return config;
      },
      (error) => {
        console.error('Request interceptor error:', error);
        return Promise.reject(this.processError(error));
      }
    );
  }
  
  /**
   * Setup response interceptor
   */
  setupResponseInterceptor() {
    this.client.interceptors.response.use(
      (response) => {
        const duration = Date.now() - response.config.metadata.startTime;
        
        // Log response in development
        if (process.env.NODE_ENV === 'development') {
          console.log(`✅ API Response [${response.config.metadata.requestId}]:`, {
            status: response.status,
            duration: `${duration}ms`,
            data: response.data
          });
        }
        
        return response;
      },
      async (error) => {
        const originalRequest = error.config;
        
        // Handle token refresh
        if (error.response?.status === HTTP_STATUS.UNAUTHORIZED && !originalRequest._retry) {
          originalRequest._retry = true;
          
          // Only try refresh if we have a refresh token and this isn't a login request
          const refreshToken = localStorage.getItem(APP_CONFIG.storage.auth.refreshToken);
          const isLoginRequest = originalRequest.url?.includes('/auth/login');
          
          if (refreshToken && !isLoginRequest) {
            try {
              await this.refreshToken();
              const token = getStoredToken();
              if (token) {
                originalRequest.headers.Authorization = `Bearer ${token}`;
                return this.client(originalRequest);
              }
            } catch (refreshError) {
              console.error('Token refresh failed:', refreshError);
              // Only handle auth error if refresh actually failed
              this.handleAuthError();
            }
          } else if (!isLoginRequest) {
            // No refresh token available and not a login request
            this.handleAuthError();
          }
        }
        
        // Handle retry logic for network errors
        if (this.shouldRetry(error) && !originalRequest._retryCount) {
          originalRequest._retryCount = 0;
        }
        
        if (originalRequest._retryCount < this.retryAttempts && this.shouldRetry(error)) {
          originalRequest._retryCount++;
          
          const delay = this.calculateRetryDelay(originalRequest._retryCount);
          await this.sleep(delay);
          
          console.log(`🔄 Retrying request [${originalRequest.metadata?.requestId}] - Attempt ${originalRequest._retryCount}`);
          return this.client(originalRequest);
        }
        
        return Promise.reject(this.processError(error));
      }
    );
  }
  
  /**
   * Process and normalize errors
   */
  processError(error) {
    const processedError = {
      message: 'An unexpected error occurred',
      code: ERROR_CODES.UNKNOWN_ERROR,
      status: null,
      data: null,
      originalError: error
    };
    
    if (error.response) {
      // Server responded with error status
      processedError.status = error.response.status;
      processedError.data = error.response.data;
      
      switch (error.response.status) {
        case HTTP_STATUS.BAD_REQUEST:
          processedError.code = ERROR_CODES.VALIDATION_ERROR;
          processedError.message = error.response.data?.message || 'Invalid request data';
          break;
          
        case HTTP_STATUS.UNAUTHORIZED:
          processedError.code = ERROR_CODES.AUTH_ERROR;
          processedError.message = 'Authentication required';
          break;
          
        case HTTP_STATUS.FORBIDDEN:
          processedError.code = ERROR_CODES.PERMISSION_ERROR;
          processedError.message = 'Access denied';
          break;
          
        case HTTP_STATUS.NOT_FOUND:
          processedError.message = 'Resource not found';
          break;
          
        case HTTP_STATUS.TOO_MANY_REQUESTS:
          processedError.code = ERROR_CODES.QUOTA_ERROR;
          processedError.message = 'Rate limit exceeded';
          break;
          
        case HTTP_STATUS.INTERNAL_SERVER_ERROR:
        case HTTP_STATUS.BAD_GATEWAY:
        case HTTP_STATUS.SERVICE_UNAVAILABLE:
          processedError.code = ERROR_CODES.SERVER_ERROR;
          processedError.message = 'Server error occurred';
          break;
          
        default:
          processedError.message = error.response.data?.message || 'Request failed';
      }
    } else if (error.request) {
      // Network error
      processedError.code = ERROR_CODES.NETWORK_ERROR;
      processedError.message = 'Network connection failed';
    } else {
      // Other error
      processedError.message = error.message || 'An unexpected error occurred';
    }
    
    // Log error
    console.error('🚨 API Error:', processedError);
    
    return processedError;
  }
  
  /**
   * Determine if request should be retried
   */
  shouldRetry(error) {
    // Retry on network errors or 5xx server errors
    return (
      !error.response ||
      error.response.status >= 500 ||
      error.code === 'NETWORK_ERROR' ||
      error.code === 'ECONNABORTED'
    );
  }
  
  /**
   * Calculate retry delay with exponential backoff
   */
  calculateRetryDelay(attempt) {
    return Math.min(this.retryDelay * Math.pow(2, attempt - 1), 10000);
  }
  
  /**
   * Sleep utility for retry delays
   */
  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
  
  /**
   * Generate unique request ID
   */
  generateRequestId() {
    return Math.random().toString(36).substr(2, 9);
  }
  
  /**
   * Handle authentication errors
   */
  handleAuthError() {
    // Only remove token, don't dispatch event immediately
    // Let AuthContext handle the logout process
    console.log('Auth error detected, clearing tokens');
    removeStoredToken();
  }
  
  /**
   * Refresh authentication token
   */
  async refreshToken() {
    const refreshToken = localStorage.getItem(APP_CONFIG.storage.auth.refreshToken);
    if (!refreshToken) {
      throw new Error('No refresh token available');
    }
    
    try {
      const response = await axios.post(`${this.baseURL}/auth/refresh-token`, {
        refreshToken
      });
      
      const { token, refreshToken: newRefreshToken } = response.data.data;
      
      setStoredToken(token);
      if (newRefreshToken) {
        localStorage.setItem(APP_CONFIG.storage.auth.refreshToken, newRefreshToken);
      }
      
      return token;
    } catch (error) {
      removeStoredToken();
      throw error;
    }
  }
  
  /**
   * HTTP Methods
   */
  async get(url, config = {}) {
    const response = await this.client.get(url, config);
    return response.data;
  }
  
  async post(url, data = {}, config = {}) {
    const response = await this.client.post(url, data, config);
    return response.data;
  }
  
  async put(url, data = {}, config = {}) {
    const response = await this.client.put(url, data, config);
    return response.data;
  }
  
  async patch(url, data = {}, config = {}) {
    const response = await this.client.patch(url, data, config);
    return response.data;
  }
  
  async delete(url, config = {}) {
    const response = await this.client.delete(url, config);
    return response.data;
  }
  
  /**
   * Upload file with progress tracking
   */
  async upload(url, file, onProgress = null) {
    const formData = new FormData();
    formData.append('file', file);
    
    const config = {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    };
    
    if (onProgress) {
      config.onUploadProgress = (progressEvent) => {
        const progress = Math.round(
          (progressEvent.loaded * 100) / progressEvent.total
        );
        onProgress(progress);
      };
    }
    
    const response = await this.client.post(url, formData, config);
    return response.data;
  }
  
  /**
   * Cancel request
   */
  cancelRequest(requestId) {
    const source = this.requestQueue.get(requestId);
    if (source) {
      source.cancel('Request cancelled by user');
      this.requestQueue.delete(requestId);
    }
  }
  
  /**
   * Cancel all pending requests
   */
  cancelAllRequests() {
    this.requestQueue.forEach((source) => {
      source.cancel('All requests cancelled');
    });
    this.requestQueue.clear();
  }
}

// Create singleton instance
const apiClient = new ApiClient();

export default apiClient;