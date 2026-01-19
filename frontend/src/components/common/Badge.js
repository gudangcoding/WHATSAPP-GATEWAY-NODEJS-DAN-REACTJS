import React from 'react';
import clsx from 'clsx';

// Shared variant styles
const variants = {
  default: 'bg-gray-100 text-gray-800',
  primary: 'bg-blue-100 text-blue-800',
  secondary: 'bg-gray-100 text-gray-800',
  success: 'bg-green-100 text-green-800',
  warning: 'bg-yellow-100 text-yellow-800',
  danger: 'bg-red-100 text-red-800',
  info: 'bg-blue-100 text-blue-800',
  dark: 'bg-gray-800 text-white',
  light: 'bg-white text-gray-800 border border-gray-200'
};

const Badge = ({
  children,
  variant = 'default',
  size = 'md',
  rounded = true,
  className,
  ...props
}) => {
  const baseClasses = 'inline-flex items-center font-medium';
  
  const sizes = {
    xs: 'px-2 py-0.5 text-xs',
    sm: 'px-2.5 py-0.5 text-xs',
    md: 'px-3 py-1 text-sm',
    lg: 'px-3 py-1 text-base',
    xl: 'px-4 py-1.5 text-base'
  };
  
  const roundedClasses = {
    xs: 'rounded',
    sm: 'rounded',
    md: 'rounded-md',
    lg: 'rounded-md',
    xl: 'rounded-lg'
  };
  
  const classes = clsx(
    baseClasses,
    variants[variant],
    sizes[size],
    rounded && roundedClasses[size],
    !rounded && 'rounded-none',
    className
  );
  
  return (
    <span className={classes} {...props}>
      {children}
    </span>
  );
};

// Status Badge with predefined colors
export const StatusBadge = ({ status, className, ...props }) => {
  const statusVariants = {
    active: 'success',
    inactive: 'danger',
    pending: 'warning',
    completed: 'success',
    failed: 'danger',
    processing: 'info',
    cancelled: 'secondary',
    draft: 'secondary',
    published: 'success',
    archived: 'secondary',
    online: 'success',
    offline: 'danger',
    connected: 'success',
    disconnected: 'danger',
    pairing: 'warning',
    banned: 'danger'
  };
  
  const variant = statusVariants[status?.toLowerCase()] || 'default';
  
  return (
    <Badge variant={variant} className={className} {...props}>
      {status}
    </Badge>
  );
};

// Dot Badge for notifications
export const DotBadge = ({
  count,
  max = 99,
  showZero = false,
  variant = 'danger',
  size = 'md',
  className,
  children
}) => {
  const displayCount = count > max ? `${max}+` : count;
  const shouldShow = showZero || count > 0;
  
  if (!shouldShow) {
    return children;
  }
  
  const dotSizes = {
    sm: 'h-4 w-4 text-xs',
    md: 'h-5 w-5 text-xs',
    lg: 'h-6 w-6 text-sm'
  };
  
  const dotClasses = clsx(
    'absolute -top-1 -right-1 flex items-center justify-center rounded-full font-bold',
    variants[variant],
    dotSizes[size],
    className
  );
  
  return (
    <div className="relative inline-block">
      {children}
      <span className={dotClasses}>
        {displayCount}
      </span>
    </div>
  );
};

export default Badge;