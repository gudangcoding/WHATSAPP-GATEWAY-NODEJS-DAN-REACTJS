import React, { Fragment } from 'react';
import { Menu, Transition } from '@headlessui/react';
import { ChevronDownIcon } from '@heroicons/react/24/outline';
import clsx from 'clsx';

const Dropdown = ({
  trigger,
  children,
  align = 'right',
  width = 'w-56',
  className
}) => {
  const alignmentClasses = {
    left: 'origin-top-left left-0',
    right: 'origin-top-right right-0'
  };

  return (
    <Menu as="div" className={clsx('relative inline-block text-left', className)}>
      <Menu.Button as={Fragment}>
        {trigger}
      </Menu.Button>

      <Transition
        as={Fragment}
        enter="transition ease-out duration-100"
        enterFrom="transform opacity-0 scale-95"
        enterTo="transform opacity-100 scale-100"
        leave="transition ease-in duration-75"
        leaveFrom="transform opacity-100 scale-100"
        leaveTo="transform opacity-0 scale-95"
      >
        <Menu.Items className={clsx(
          'absolute z-10 mt-2 rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none',
          width,
          alignmentClasses[align]
        )}>
          <div className="py-1">
            {children}
          </div>
        </Menu.Items>
      </Transition>
    </Menu>
  );
};

// Dropdown Item Component
export const DropdownItem = ({
  children,
  onClick,
  href,
  disabled = false,
  danger = false,
  className,
  ...props
}) => {
  const itemClasses = clsx(
    'group flex items-center px-4 py-2 text-sm w-full text-left',
    disabled
      ? 'text-gray-400 cursor-not-allowed'
      : danger
      ? 'text-red-700 hover:bg-red-50 hover:text-red-900'
      : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900',
    className
  );

  const content = (
    <button
      className={itemClasses}
      onClick={onClick}
      disabled={disabled}
      {...props}
    >
      {children}
    </button>
  );

  return (
    <Menu.Item disabled={disabled}>
      {href ? (
        <a href={href} className={itemClasses}>
          {children}
        </a>
      ) : (
        content
      )}
    </Menu.Item>
  );
};

// Dropdown Divider Component
export const DropdownDivider = () => (
  <div className="border-t border-gray-100 my-1" />
);

// Simple Dropdown Button Component
export const DropdownButton = ({
  children,
  variant = 'default',
  size = 'md',
  disabled = false,
  className,
  ...props
}) => {
  const baseClasses = 'inline-flex items-center justify-center font-medium rounded-md transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed';
  
  const variants = {
    default: 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 focus:ring-blue-500',
    primary: 'bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500',
    secondary: 'bg-gray-600 text-white hover:bg-gray-700 focus:ring-gray-500'
  };
  
  const sizes = {
    sm: 'px-3 py-2 text-sm',
    md: 'px-4 py-2 text-sm',
    lg: 'px-4 py-2 text-base'
  };
  
  const classes = clsx(
    baseClasses,
    variants[variant],
    sizes[size],
    className
  );

  return (
    <button className={classes} disabled={disabled} {...props}>
      <span>{children}</span>
      <ChevronDownIcon className="ml-2 -mr-1 h-4 w-4" aria-hidden="true" />
    </button>
  );
};

export default Dropdown;