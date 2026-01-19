import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import { ROLES } from '../utils/constants/permissions';

/**
 * Role Guard Component
 * Conditionally renders children based on user role
 */
const RoleGuard = ({
  children,
  role,
  roles,
  requireAll = false,
  fallback = null,
  showFallback = true,
  allowHigherRoles = true
}) => {
  const { user, loading } = useAuth();

  // Show loading state
  if (loading) {
    return fallback || null;
  }

  // No user logged in
  if (!user) {
    return showFallback ? fallback : null;
  }

  const userRole = user.role;

  // Role hierarchy for allowHigherRoles
  const roleHierarchy = {
    [ROLES.VIEWER]: 0,
    [ROLES.USER]: 1,
    [ROLES.ADMIN]: 2,
    [ROLES.SUPER_ADMIN]: 3
  };

  // Check single role
  if (role) {
    let hasAccess = userRole === role;
    
    // Allow higher roles if specified
    if (allowHigherRoles && !hasAccess) {
      const userRoleLevel = roleHierarchy[userRole] || 0;
      const requiredRoleLevel = roleHierarchy[role] || 0;
      hasAccess = userRoleLevel >= requiredRoleLevel;
    }
    
    if (!hasAccess) {
      return showFallback ? fallback : null;
    }
  }

  // Check multiple roles
  if (roles && Array.isArray(roles)) {
    let hasAccess = false;
    
    if (requireAll) {
      // User must have all specified roles (unlikely scenario)
      hasAccess = roles.every(r => userRole === r);
    } else {
      // User must have at least one of the specified roles
      hasAccess = roles.includes(userRole);
      
      // Allow higher roles if specified
      if (allowHigherRoles && !hasAccess) {
        const userRoleLevel = roleHierarchy[userRole] || 0;
        hasAccess = roles.some(r => {
          const requiredRoleLevel = roleHierarchy[r] || 0;
          return userRoleLevel >= requiredRoleLevel;
        });
      }
    }
    
    if (!hasAccess) {
      return showFallback ? fallback : null;
    }
  }

  return children;
};

/**
 * Higher-order component for role checking
 */
export const withRole = (role, fallback = null, allowHigherRoles = true) => (Component) => {
  return function RoleWrappedComponent(props) {
    return (
      <RoleGuard 
        role={role} 
        fallback={fallback}
        allowHigherRoles={allowHigherRoles}
      >
        <Component {...props} />
      </RoleGuard>
    );
  };
};

/**
 * Hook for role checking in components
 */
export const useRoleGuard = () => {
  const { user, isAdmin, isSuperAdmin, isUser } = useAuth();

  const hasRole = (role, allowHigherRoles = true) => {
    if (!user) return false;
    
    const userRole = user.role;
    if (userRole === role) return true;
    
    if (allowHigherRoles) {
      const roleHierarchy = {
        [ROLES.VIEWER]: 0,
        [ROLES.USER]: 1,
        [ROLES.ADMIN]: 2,
        [ROLES.SUPER_ADMIN]: 3
      };
      
      const userRoleLevel = roleHierarchy[userRole] || 0;
      const requiredRoleLevel = roleHierarchy[role] || 0;
      return userRoleLevel >= requiredRoleLevel;
    }
    
    return false;
  };

  const hasAnyRole = (roles, allowHigherRoles = true) => {
    return roles.some(role => hasRole(role, allowHigherRoles));
  };

  return {
    hasRole,
    hasAnyRole,
    isAdmin,
    isSuperAdmin,
    isUser,
    userRole: user?.role
  };
};

export default RoleGuard;