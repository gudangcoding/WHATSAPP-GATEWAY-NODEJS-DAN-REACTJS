import React, { useState, useEffect } from 'react';
import { 
  SignalIcon,
  ClockIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';
import Card from '../common/Card';
import { StatusBadge } from '../common/Badge';
import { useSocket } from '../../hooks/useSocket';

const RealtimeStats = ({
  className = '',
  refreshInterval = 5000, // 5 seconds
  showSystemHealth = true,
  showRecentActivity = true,
  showLiveMetrics = true
}) => {
  const [stats, setStats] = useState({
    messagesPerMinute: 0,
    activeConnections: 0,
    queueDepth: 0,
    systemLoad: 0,
    memoryUsage: 0,
    responseTime: 0,
    errorRate: 0,
    lastUpdated: new Date()
  });

  const [recentActivity, setRecentActivity] = useState([]);
  const [systemHealth, setSystemHealth] = useState({
    status: 'healthy',
    services: {
      database: 'healthy',
      redis: 'healthy',
      queue: 'healthy',
      whatsapp: 'healthy'
    },
    alerts: []
  });

  const { on, off } = useSocket();

  // Socket event handlers for real-time updates
  useEffect(() => {
    const handleStatsUpdate = (data) => {
      setStats(prev => ({
        ...prev,
        ...data,
        lastUpdated: new Date()
      }));
    };

    const handleActivityUpdate = (activity) => {
      setRecentActivity(prev => [
        activity,
        ...prev.slice(0, 9) // Keep only last 10 activities
      ]);
    };

    const handleHealthUpdate = (health) => {
      setSystemHealth(health);
    };

    // Subscribe to real-time events
    on('stats:update', handleStatsUpdate);
    on('activity:new', handleActivityUpdate);
    on('system:health', handleHealthUpdate);

    return () => {
      off('stats:update', handleStatsUpdate);
      off('activity:new', handleActivityUpdate);
      off('system:health', handleHealthUpdate);
    };
  }, [on, off]);

  // Periodic stats refresh
  useEffect(() => {
    const interval = setInterval(() => {
      // Simulate real-time data updates
      setStats(prev => ({
        ...prev,
        messagesPerMinute: Math.floor(Math.random() * 50) + 10,
        activeConnections: Math.floor(Math.random() * 20) + 5,
        queueDepth: Math.floor(Math.random() * 100),
        systemLoad: Math.random() * 100,
        memoryUsage: Math.random() * 100,
        responseTime: Math.floor(Math.random() * 500) + 50,
        errorRate: Math.random() * 5,
        lastUpdated: new Date()
      }));
    }, refreshInterval);

    return () => clearInterval(interval);
  }, [refreshInterval]);

  const getHealthColor = (status) => {
    switch (status) {
      case 'healthy':
        return 'text-green-600';
      case 'warning':
        return 'text-yellow-600';
      case 'critical':
        return 'text-red-600';
      default:
        return 'text-gray-600';
    }
  };

  const getHealthBadgeStatus = (status) => {
    switch (status) {
      case 'healthy':
        return 'success';
      case 'warning':
        return 'warning';
      case 'critical':
        return 'danger';
      default:
        return 'secondary';
    }
  };

  const formatTime = (date) => {
    return new Intl.DateTimeFormat('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    }).format(date);
  };

  const formatDuration = (ms) => {
    if (ms < 1000) return `${ms}ms`;
    if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
    return `${(ms / 60000).toFixed(1)}m`;
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Live Metrics */}
      {showLiveMetrics && (
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-gray-900 flex items-center">
              <SignalIcon className="w-5 h-5 mr-2 text-green-500" />
              Live Metrics
            </h3>
            <div className="flex items-center text-sm text-gray-500">
              <ClockIcon className="w-4 h-4 mr-1" />
              Updated {formatTime(stats.lastUpdated)}
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                {stats.messagesPerMinute}
              </div>
              <div className="text-sm text-gray-600">Messages/min</div>
            </div>
            
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {stats.activeConnections}
              </div>
              <div className="text-sm text-gray-600">Active Connections</div>
            </div>
            
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">
                {stats.queueDepth}
              </div>
              <div className="text-sm text-gray-600">Queue Depth</div>
            </div>
            
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">
                {stats.responseTime}ms
              </div>
              <div className="text-sm text-gray-600">Avg Response</div>
            </div>
          </div>

          <div className="mt-4 pt-4 border-t border-gray-200">
            <div className="grid grid-cols-3 gap-4 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">System Load:</span>
                <span className={`font-medium ${stats.systemLoad > 80 ? 'text-red-600' : stats.systemLoad > 60 ? 'text-yellow-600' : 'text-green-600'}`}>
                  {stats.systemLoad.toFixed(1)}%
                </span>
              </div>
              
              <div className="flex justify-between">
                <span className="text-gray-600">Memory Usage:</span>
                <span className={`font-medium ${stats.memoryUsage > 80 ? 'text-red-600' : stats.memoryUsage > 60 ? 'text-yellow-600' : 'text-green-600'}`}>
                  {stats.memoryUsage.toFixed(1)}%
                </span>
              </div>
              
              <div className="flex justify-between">
                <span className="text-gray-600">Error Rate:</span>
                <span className={`font-medium ${stats.errorRate > 5 ? 'text-red-600' : stats.errorRate > 2 ? 'text-yellow-600' : 'text-green-600'}`}>
                  {stats.errorRate.toFixed(2)}%
                </span>
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* System Health */}
      {showSystemHealth && (
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-gray-900">System Health</h3>
            <StatusBadge status={getHealthBadgeStatus(systemHealth.status)}>
              {systemHealth.status}
            </StatusBadge>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
            {Object.entries(systemHealth.services).map(([service, status]) => (
              <div key={service} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <span className="text-sm font-medium text-gray-700 capitalize">
                  {service}
                </span>
                <StatusBadge status={getHealthBadgeStatus(status)} size="sm">
                  {status}
                </StatusBadge>
              </div>
            ))}
          </div>

          {systemHealth.alerts && systemHealth.alerts.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-sm font-medium text-gray-900 flex items-center">
                <ExclamationTriangleIcon className="w-4 h-4 mr-1 text-yellow-500" />
                Active Alerts
              </h4>
              {systemHealth.alerts.map((alert, index) => (
                <div key={index} className="flex items-center justify-between p-2 bg-yellow-50 border border-yellow-200 rounded">
                  <span className="text-sm text-yellow-800">{alert.message}</span>
                  <span className="text-xs text-yellow-600">{formatTime(new Date(alert.timestamp))}</span>
                </div>
              ))}
            </div>
          )}
        </Card>
      )}

      {/* Recent Activity */}
      {showRecentActivity && (
        <Card className="p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Recent Activity</h3>
          
          {recentActivity.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <ClockIcon className="w-8 h-8 mx-auto mb-2 text-gray-400" />
              <p>No recent activity</p>
            </div>
          ) : (
            <div className="space-y-3">
              {recentActivity.map((activity, index) => (
                <div key={index} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-b-0">
                  <div className="flex items-center space-x-3">
                    <div className={`w-2 h-2 rounded-full ${
                      activity.type === 'success' ? 'bg-green-500' :
                      activity.type === 'error' ? 'bg-red-500' :
                      activity.type === 'warning' ? 'bg-yellow-500' :
                      'bg-blue-500'
                    }`} />
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {activity.title}
                      </p>
                      {activity.description && (
                        <p className="text-xs text-gray-500">
                          {activity.description}
                        </p>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2 text-xs text-gray-500">
                    {activity.trend === 'up' && <ArrowTrendingUpIcon className="w-3 h-3 text-green-500" />}
                    {activity.trend === 'down' && <ArrowTrendingDownIcon className="w-3 h-3 text-red-500" />}
                    <span>{formatTime(new Date(activity.timestamp))}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      )}
    </div>
  );
};

export default RealtimeStats;