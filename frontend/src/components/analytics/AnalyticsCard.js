import React from 'react';
import { 
  ArrowUpIcon, 
  ArrowDownIcon,
  InformationCircleIcon
} from '@heroicons/react/24/outline';
import Card from '../common/Card';
import LoadingSpinner from '../common/LoadingSpinner';

const AnalyticsCard = ({
  title,
  value,
  previousValue,
  change,
  changeType = 'percentage', // 'percentage' | 'absolute'
  icon: Icon,
  iconColor = 'text-blue-600',
  iconBgColor = 'bg-blue-100',
  loading = false,
  trend = null, // 'up' | 'down' | null
  subtitle = null,
  tooltip = null,
  className = '',
  onClick = null,
  ...props
}) => {
  const calculateChange = () => {
    if (previousValue === null || previousValue === undefined || previousValue === 0) {
      return null;
    }
    
    if (changeType === 'percentage') {
      return ((value - previousValue) / previousValue) * 100;
    } else {
      return value - previousValue;
    }
  };

  const changeValue = change !== undefined ? change : calculateChange();
  const isPositive = changeValue > 0;
  const isNegative = changeValue < 0;
  
  const getTrendIcon = () => {
    if (trend === 'up' || (trend === null && isPositive)) {
      return <ArrowUpIcon className="w-4 h-4" />;
    } else if (trend === 'down' || (trend === null && isNegative)) {
      return <ArrowDownIcon className="w-4 h-4" />;
    }
    return null;
  };

  const getTrendColor = () => {
    if (trend === 'up' || (trend === null && isPositive)) {
      return 'text-green-600';
    } else if (trend === 'down' || (trend === null && isNegative)) {
      return 'text-red-600';
    }
    return 'text-gray-500';
  };

  const formatValue = (val) => {
    if (typeof val === 'number') {
      if (val >= 1000000) {
        return `${(val / 1000000).toFixed(1)}M`;
      } else if (val >= 1000) {
        return `${(val / 1000).toFixed(1)}K`;
      }
      return val.toLocaleString();
    }
    return val;
  };

  const formatChange = (val) => {
    if (val === null || val === undefined) return null;
    
    const absValue = Math.abs(val);
    if (changeType === 'percentage') {
      return `${absValue.toFixed(1)}%`;
    } else {
      return formatValue(absValue);
    }
  };

  return (
    <Card 
      className={`p-6 ${onClick ? 'cursor-pointer hover:shadow-md transition-shadow' : ''} ${className}`}
      onClick={onClick}
      {...props}
    >
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <div className="flex items-center space-x-2 mb-1">
            <p className="text-sm font-medium text-gray-600">{title}</p>
            {tooltip && (
              <div className="group relative">
                <InformationCircleIcon className="w-4 h-4 text-gray-400 cursor-help" />
                <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap z-10">
                  {tooltip}
                  <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-gray-900"></div>
                </div>
              </div>
            )}
          </div>
          
          {loading ? (
            <div className="flex items-center space-x-2">
              <LoadingSpinner size="sm" />
              <span className="text-gray-400">Loading...</span>
            </div>
          ) : (
            <>
              <p className="text-2xl font-bold text-gray-900 mb-1">
                {formatValue(value)}
              </p>
              
              {subtitle && (
                <p className="text-xs text-gray-500 mb-2">{subtitle}</p>
              )}
              
              {changeValue !== null && (
                <div className={`flex items-center space-x-1 text-sm ${getTrendColor()}`}>
                  {getTrendIcon()}
                  <span>
                    {isPositive ? '+' : ''}{formatChange(changeValue)}
                    {changeType === 'percentage' && ' from last period'}
                  </span>
                </div>
              )}
            </>
          )}
        </div>
        
        {Icon && (
          <div className={`flex-shrink-0 w-12 h-12 ${iconBgColor} rounded-lg flex items-center justify-center ml-4`}>
            <Icon className={`w-6 h-6 ${iconColor}`} />
          </div>
        )}
      </div>
    </Card>
  );
};

export default AnalyticsCard;