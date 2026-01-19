import React from 'react';
import clsx from 'clsx';

const Card = ({
  children,
  title,
  subtitle,
  actions,
  padding = 'default',
  shadow = 'default',
  border = true,
  hover = false,
  className,
  headerClassName,
  bodyClassName,
  ...props
}) => {
  const cardClasses = clsx(
    'bg-white rounded-lg',
    border && 'border border-gray-200',
    shadow === 'none' && '',
    shadow === 'sm' && 'shadow-sm',
    shadow === 'default' && 'shadow',
    shadow === 'md' && 'shadow-md',
    shadow === 'lg' && 'shadow-lg',
    shadow === 'xl' && 'shadow-xl',
    hover && 'hover:shadow-lg transition-shadow duration-200',
    className
  );
  
  const paddingClasses = {
    none: '',
    sm: 'p-3',
    default: 'p-4',
    lg: 'p-6',
    xl: 'p-8'
  };
  
  const headerClasses = clsx(
    'border-b border-gray-200 pb-3 mb-4',
    headerClassName
  );
  
  const bodyClasses = clsx(
    paddingClasses[padding],
    bodyClassName
  );
  
  const hasHeader = title || subtitle || actions;
  
  return (
    <div className={cardClasses} {...props}>
      {hasHeader && (
        <div className={clsx(paddingClasses[padding], 'pb-0')}>
          <div className={headerClasses}>
            <div className="flex items-center justify-between">
              <div>
                {title && (
                  <h3 className="text-lg font-medium text-gray-900">
                    {title}
                  </h3>
                )}
                {subtitle && (
                  <p className="mt-1 text-sm text-gray-500">
                    {subtitle}
                  </p>
                )}
              </div>
              {actions && (
                <div className="flex items-center space-x-2">
                  {actions}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
      
      <div className={hasHeader ? paddingClasses[padding] : bodyClasses}>
        {children}
      </div>
    </div>
  );
};

// Stats Card Component
export const StatsCard = ({
  title,
  value,
  change,
  changeType = 'neutral',
  icon,
  color = 'blue',
  loading = false
}) => {
  const colorClasses = {
    blue: 'bg-blue-50 text-blue-600',
    green: 'bg-green-50 text-green-600',
    yellow: 'bg-yellow-50 text-yellow-600',
    red: 'bg-red-50 text-red-600',
    purple: 'bg-purple-50 text-purple-600',
    gray: 'bg-gray-50 text-gray-600'
  };
  
  const changeClasses = {
    positive: 'text-green-600',
    negative: 'text-red-600',
    neutral: 'text-gray-600'
  };
  
  if (loading) {
    return (
      <Card className="animate-pulse">
        <div className="flex items-center">
          <div className="flex-shrink-0">
            <div className="w-8 h-8 bg-gray-200 rounded-md"></div>
          </div>
          <div className="ml-5 w-0 flex-1">
            <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
            <div className="h-6 bg-gray-200 rounded w-1/2"></div>
          </div>
        </div>
      </Card>
    );
  }
  
  return (
    <Card>
      <div className="flex items-center">
        <div className="flex-shrink-0">
          <div className={clsx('p-2 rounded-md', colorClasses[color])}>
            {icon}
          </div>
        </div>
        <div className="ml-5 w-0 flex-1">
          <dl>
            <dt className="text-sm font-medium text-gray-500 truncate">
              {title}
            </dt>
            <dd className="flex items-baseline">
              <div className="text-2xl font-semibold text-gray-900">
                {value}
              </div>
              {change && (
                <div className={clsx('ml-2 flex items-baseline text-sm font-semibold', changeClasses[changeType])}>
                  {change}
                </div>
              )}
            </dd>
          </dl>
        </div>
      </div>
    </Card>
  );
};

export default Card;