import React, { useState } from 'react';
import clsx from 'clsx';

const Tabs = ({
  tabs,
  defaultTab,
  onChange,
  variant = 'default',
  size = 'md',
  fullWidth = false,
  className,
  children
}) => {
  const [activeTab, setActiveTab] = useState(defaultTab || tabs[0]?.key);
  
  const handleTabChange = (tabKey) => {
    setActiveTab(tabKey);
    if (onChange) {
      onChange(tabKey);
    }
  };
  
  const variants = {
    default: {
      container: 'border-b border-gray-200',
      tab: 'border-b-2 border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300',
      activeTab: 'border-blue-500 text-blue-600'
    },
    pills: {
      container: 'bg-gray-100 p-1 rounded-lg',
      tab: 'text-gray-500 hover:text-gray-700 rounded-md',
      activeTab: 'bg-white text-gray-900 shadow-sm'
    },
    underline: {
      container: '',
      tab: 'text-gray-500 hover:text-gray-700 pb-2',
      activeTab: 'text-blue-600 border-b-2 border-blue-600'
    }
  };
  
  const sizes = {
    sm: 'px-3 py-2 text-sm',
    md: 'px-4 py-2 text-sm',
    lg: 'px-6 py-3 text-base'
  };
  
  const variantConfig = variants[variant];
  
  const containerClasses = clsx(
    'flex',
    fullWidth && 'w-full',
    variantConfig.container,
    className
  );
  
  const getTabClasses = (tab) => clsx(
    'font-medium transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2',
    sizes[size],
    fullWidth && 'flex-1 text-center',
    variantConfig.tab,
    activeTab === tab.key && variantConfig.activeTab,
    tab.disabled && 'opacity-50 cursor-not-allowed'
  );
  
  return (
    <div>
      <nav className={containerClasses} aria-label="Tabs">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            type="button"
            className={getTabClasses(tab)}
            onClick={() => !tab.disabled && handleTabChange(tab.key)}
            disabled={tab.disabled}
            aria-current={activeTab === tab.key ? 'page' : undefined}
          >
            {tab.icon && (
              <span className="mr-2 w-4 h-4 inline-block">
                {tab.icon}
              </span>
            )}
            {tab.label}
            {tab.badge && (
              <span className="ml-2 bg-gray-100 text-gray-900 py-0.5 px-2 rounded-full text-xs">
                {tab.badge}
              </span>
            )}
          </button>
        ))}
      </nav>
      
      <div className="mt-4">
        {children ? (
          React.Children.map(children, (child, index) => {
            if (React.isValidElement(child) && child.props.tabKey === activeTab) {
              return child;
            }
            return null;
          })
        ) : (
          tabs.find(tab => tab.key === activeTab)?.content
        )}
      </div>
    </div>
  );
};

// Tab Panel Component
export const TabPanel = ({ tabKey, children, className }) => {
  return (
    <div className={className} role="tabpanel">
      {children}
    </div>
  );
};

export default Tabs;