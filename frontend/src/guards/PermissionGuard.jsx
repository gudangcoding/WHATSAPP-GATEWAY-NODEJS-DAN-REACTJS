import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import { hasPermission, hasAnyPermission, hasAllPermissions } from '../utils/constants/permissions';

/**
 * Permission Guard Component
 * Conditionally renders children based on user permissions
 */
const PermissionGuard = ({
  children,
  permission,
  permissions,
  requireAll = false,
  fallback = null,
  showFallback = true
}) => {
  const { permissions: userPermissions, loading } = useAuth();

  // Show loading state
  if (loading) {
    return fallback || null;
  }

  // Check single permission
  if (permission) {
    const hasAccess = hasPermission(userPermissions, permission);
    if (!hasAccess) {
      return showFallback ? fallback : null;
    }
  }

  // Check multiple permissions
  if (permissions && Array.isArray(permissions)) {
    const hasAccess = requireAll
      ? hasAllPermissions(userPermissions, permissions)
      : hasAnyPermission(userPermissions, permissions);
    
    if (!hasAccess) {
      return showFallback ? fallback : null;
    }
  }

  return children;
};

/**
 * Higher-order component for permission checking
 */
export const withPermission = (permission, fallback = null) => (Component) => {
  return function PermissionWrappedComponent(props) {
    return (
      <PermissionGuard permission={permission} fallback={fallback}>
        <Component {...props} />
      </PermissionGuard>
    );
  };
};

/**
 * Hook for permission checking in components
 */
export const usePermissionGuard = () => {
  const { permissions, checkPermission, checkAnyPermission, checkAllPermissions } = useAuth();

  return {
    hasPermission: (permission) => checkPermission(permission),
    hasAnyPermission: (permissionList) => checkAnyPermission(permissionList),
    hasAllPermissions: (permissionList) => checkAllPermissions(permissionList),
    permissions
  };
};

export default PermissionGuard;