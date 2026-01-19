import React, { forwardRef } from 'react';
import clsx from 'clsx';

const Input = forwardRef(({
  label,
  error,
  helperText,
  required = false,
  disabled = false,
  fullWidth = false,
  startIcon,
  endIcon,
  className,
  containerClassName,
  labelClassName,
  ...props
}, ref) => {
  const inputClasses = clsx(
    'block w-full rounded-md border-gray-300 shadow-sm transition-colors duration-200',
    'focus:border-blue-500 focus:ring-blue-500 focus:ring-1',
    'disabled:bg-gray-50 disabled:text-gray-500 disabled:cursor-not-allowed',
    error && 'border-red-300 focus:border-red-500 focus:ring-red-500',
    startIcon && 'pl-10',
    endIcon && 'pr-10',
    className
  );
  
  const containerClasses = clsx(
    fullWidth ? 'w-full' : 'w-auto',
    containerClassName
  );
  
  const labelClasses = clsx(
    'block text-sm font-medium text-gray-700 mb-1',
    disabled && 'text-gray-500',
    labelClassName
  );
  
  return (
    <div className={containerClasses}>
      {label && (
        <label className={labelClasses}>
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      
      <div className="relative">
        {startIcon && (
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <span className="text-gray-400 w-5 h-5">{startIcon}</span>
          </div>
        )}
        
        <input
          ref={ref}
          className={inputClasses}
          disabled={disabled}
          {...props}
        />
        
        {endIcon && (
          <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
            <span className="text-gray-400 w-5 h-5">{endIcon}</span>
          </div>
        )}
      </div>
      
      {error && (
        <p className="mt-1 text-sm text-red-600">{error}</p>
      )}
      
      {helperText && !error && (
        <p className="mt-1 text-sm text-gray-500">{helperText}</p>
      )}
    </div>
  );
});

Input.displayName = 'Input';

export default Input;