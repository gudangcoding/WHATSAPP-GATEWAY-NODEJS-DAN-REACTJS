import React from 'react';
import clsx from 'clsx';

const LoadingSpinner = ({ 
  size = 'md', 
  color = 'primary', 
  className = '',
  text = null 
}) => {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8',
    xl: 'w-12 h-12',
  };

  const colorClasses = {
    primary: 'text-primary-600',
    white: 'text-white',
    gray: 'text-gray-600',
    whatsapp: 'text-whatsapp-600',
  };

  return (
    <div className={clsx('flex items-center justify-center', className)}>
      <div className="flex flex-col items-center space-y-2">
        <div
          className={clsx(
            'animate-spin rounded-full border-2 border-current border-t-transparent',
            sizeClasses[size],
            colorClasses[color]
          )}
        />
        {text && (
          <p className={clsx('text-sm', colorClasses[color])}>
            {text}
          </p>
        )}
      </div>
    </div>
  );
};

export default LoadingSpinner;