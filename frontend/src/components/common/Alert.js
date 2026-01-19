import React from 'react';
import clsx from 'clsx';
import {
  CheckCircleIcon,
  ExclamationTriangleIcon,
  XCircleIcon,
  InformationCircleIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';

const Alert = ({
  children,
  variant = 'info',
  title,
  dismissible = false,
  onDismiss,
  icon = true,
  className,
  ...props
}) => {
  const variants = {
    success: {
      container: 'bg-green-50 border-green-200 text-green-800',
      icon: CheckCircleIcon,
      iconColor: 'text-green-400',
      title: 'text-green-800',
      dismissButton: 'text-green-500 hover:text-green-600'
    },
    warning: {
      container: 'bg-yellow-50 border-yellow-200 text-yellow-800',
      icon: ExclamationTriangleIcon,
      iconColor: 'text-yellow-400',
      title: 'text-yellow-800',
      dismissButton: 'text-yellow-500 hover:text-yellow-600'
    },
    danger: {
      container: 'bg-red-50 border-red-200 text-red-800',
      icon: XCircleIcon,
      iconColor: 'text-red-400',
      title: 'text-red-800',
      dismissButton: 'text-red-500 hover:text-red-600'
    },
    info: {
      container: 'bg-blue-50 border-blue-200 text-blue-800',
      icon: InformationCircleIcon,
      iconColor: 'text-blue-400',
      title: 'text-blue-800',
      dismissButton: 'text-blue-500 hover:text-blue-600'
    }
  };
  
  const variantConfig = variants[variant];
  const IconComponent = variantConfig.icon;
  
  const containerClasses = clsx(
    'border rounded-md p-4',
    variantConfig.container,
    className
  );
  
  return (
    <div className={containerClasses} {...props}>
      <div className="flex">
        {icon && (
          <div className="flex-shrink-0">
            <IconComponent className={clsx('h-5 w-5', variantConfig.iconColor)} aria-hidden="true" />
          </div>
        )}
        <div className={clsx('flex-1', icon && 'ml-3')}>
          {title && (
            <h3 className={clsx('text-sm font-medium', variantConfig.title)}>
              {title}
            </h3>
          )}
          <div className={clsx('text-sm', title && 'mt-2')}>
            {children}
          </div>
        </div>
        {dismissible && (
          <div className="ml-auto pl-3">
            <div className="-mx-1.5 -my-1.5">
              <button
                type="button"
                className={clsx(
                  'inline-flex rounded-md p-1.5 focus:outline-none focus:ring-2 focus:ring-offset-2',
                  variantConfig.dismissButton
                )}
                onClick={onDismiss}
              >
                <span className="sr-only">Dismiss</span>
                <XMarkIcon className="h-5 w-5" aria-hidden="true" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// Toast Alert Component (for react-hot-toast custom styling)
export const ToastAlert = ({ variant = 'info', title, message, onDismiss }) => {
  return (
    <Alert
      variant={variant}
      title={title}
      dismissible={!!onDismiss}
      onDismiss={onDismiss}
      className="max-w-sm shadow-lg"
    >
      {message}
    </Alert>
  );
};

export default Alert;