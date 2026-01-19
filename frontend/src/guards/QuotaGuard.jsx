import React from 'react';
import { useAuth } from '../contexts/AuthContext';

/**
 * Quota Guard Component
 * Conditionally renders children based on quota availability
 */
const QuotaGuard = ({
  children,
  resource,
  action = 'create',
  fallback = null,
  showFallback = true,
  showWarning = true,
  warningThreshold = 80 // Show warning when usage is above this percentage
}) => {
  const { user, checkQuota, getQuotaUsage, loading } = useAuth();

  // Show loading state
  if (loading) {
    return fallback || null;
  }

  // No user logged in
  if (!user) {
    return showFallback ? fallback : null;
  }

  // Check if quota allows the action
  const canPerformAction = checkQuota(resource, action);
  const quotaUsage = getQuotaUsage(resource);

  // If action is not allowed due to quota
  if (!canPerformAction) {
    const quotaExceededFallback = fallback || (
      <div className="quota-exceeded-message">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">
                Quota Limit Reached
              </h3>
              <div className="mt-2 text-sm text-red-700">
                <p>
                  You have reached your {resource} limit ({quotaUsage.used}/{quotaUsage.limit}).
                  Please upgrade your plan or contact support to increase your quota.
                </p>
              </div>
              <div className="mt-3">
                <button
                  type="button"
                  className="bg-red-100 px-3 py-2 rounded-md text-sm font-medium text-red-800 hover:bg-red-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                  onClick={() => {
                    // Navigate to upgrade page or show upgrade modal
                    window.dispatchEvent(new CustomEvent('quota:upgrade', {
                      detail: { resource, usage: quotaUsage }
                    }));
                  }}
                >
                  Upgrade Plan
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );

    return showFallback ? quotaExceededFallback : null;
  }

  // Show warning if approaching quota limit
  if (showWarning && quotaUsage.percentage >= warningThreshold) {
    const warningComponent = (
      <div className="quota-warning-wrapper">
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-4">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-yellow-800">
                <strong>Quota Warning:</strong> You are using {quotaUsage.percentage}% of your {resource} quota 
                ({quotaUsage.used}/{quotaUsage.limit}). Consider upgrading your plan.
              </p>
            </div>
          </div>
        </div>
        {children}
      </div>
    );

    return warningComponent;
  }

  return children;
};

/**
 * Higher-order component for quota checking
 */
export const withQuota = (resource, action = 'create', fallback = null) => (Component) => {
  return function QuotaWrappedComponent(props) {
    return (
      <QuotaGuard 
        resource={resource} 
        action={action}
        fallback={fallback}
      >
        <Component {...props} />
      </QuotaGuard>
    );
  };
};

/**
 * Hook for quota checking in components
 */
export const useQuotaGuard = () => {
  const { checkQuota, getQuotaUsage, user } = useAuth();

  const canPerformAction = (resource, action = 'create') => {
    return checkQuota(resource, action);
  };

  const getUsageInfo = (resource) => {
    return getQuotaUsage(resource);
  };

  const isApproachingLimit = (resource, threshold = 80) => {
    const usage = getQuotaUsage(resource);
    return usage.percentage >= threshold;
  };

  const isAtLimit = (resource) => {
    const usage = getQuotaUsage(resource);
    return usage.used >= usage.limit;
  };

  const getRemainingQuota = (resource) => {
    const usage = getQuotaUsage(resource);
    return Math.max(0, usage.limit - usage.used);
  };

  return {
    canPerformAction,
    getUsageInfo,
    isApproachingLimit,
    isAtLimit,
    getRemainingQuota,
    quotas: user?.quotas || {}
  };
};

export default QuotaGuard;