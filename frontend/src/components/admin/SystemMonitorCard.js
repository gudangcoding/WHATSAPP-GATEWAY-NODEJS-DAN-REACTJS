import React, { useState, useEffect } from 'react';
import { 
  CpuChipIcon,
  CircleStackIcon,
  ServerIcon,
  SignalIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon
} from '@heroicons/react/24/outline';
import Card from '../common/Card';
import { StatusBadge } from '../common/Badge';
import LoadingSpinner from '../common/LoadingSpinner';

const SystemMonitorCard = ({
  title,
  systemStats = {},
  loading = false,
  error = null,
  refreshInterval = 30000, // 30 seconds
  className = ''
}) => {
  const [stats, setStats] = useState({
    cpu: { usage: 0, cores: 0, load: [0, 0, 0] },
    memory: { used: 0, total: 0, percentage: 0 },
    disk: { used: 0, total: 0, percentage: 0 },
    network: { rx: 0, tx: 0 },
    uptime: 0,
    processes: 0,
    connections: 0,
    lastUpdated: new Date(),
    ...systemStats
  });

  // Simulate real-time updates
  useEffect(() => {
    if (loading) return;

    const interval = setInterval(() => {
      setStats(prev => ({
        ...prev,
        cpu: {
          ...prev.cpu,
          usage: Math.max(0, Math.min(100, prev.cpu.usage + (Math.random() - 0.5) * 10))
        },
        memory: {
          ...prev.memory,
          percentage: Math.max(0, Math.min(100, prev.memory.percentage + (Math.random() - 0.5) * 5))
        },
        disk: {
          ...prev.disk,
          percentage: Math.max(0, Math.min(100, prev.disk.percentage + (Math.random() - 0.5) * 2))
        },
        connections: Math.max(0, prev.connections + Math.floor((Math.random() - 0.5) * 5)),
        lastUpdated: new Date()
      }));
    }, refreshInterval);

    return () => clearInterval(interval);
  }, [loading, refreshInterval]);

  const formatBytes = (bytes) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatUptime = (seconds) => {
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    
    if (days > 0) {
      return `${days}d ${hours}h ${minutes}m`;
    } else if (hours > 0) {
      return `${hours}h ${minutes}m`;
    } else {
      return `${minutes}m`;
    }
  };

  const getStatusColor = (percentage) => {
    if (percentage >= 90) return 'text-red-600 bg-red-100';
    if (percentage >= 75) return 'text-yellow-600 bg-yellow-100';
    return 'text-green-600 bg-green-100';
  };

  const getStatusIcon = (percentage) => {
    if (percentage >= 90) return <XCircleIcon className="w-4 h-4" />;
    if (percentage >= 75) return <ExclamationTriangleIcon className="w-4 h-4" />;
    return <CheckCircleIcon className="w-4 h-4" />;
  };

  if (loading) {
    return (
      <Card className={`p-6 ${className}`}>
        <div className="flex items-center justify-center py-8">
          <LoadingSpinner size="lg" />
        </div>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className={`p-6 ${className}`}>
        <div className="text-center py-8">
          <ExclamationTriangleIcon className="w-12 h-12 text-red-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Monitor Error</h3>
          <p className="text-gray-600">{error}</p>
        </div>
      </Card>
    );
  }

  return (
    <Card className={`p-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-medium text-gray-900 flex items-center">
          <ServerIcon className="w-5 h-5 mr-2 text-blue-600" />
          {title || 'System Monitor'}
        </h3>
        <div className="flex items-center text-sm text-gray-500">
          <ClockIcon className="w-4 h-4 mr-1" />
          Updated {stats.lastUpdated.toLocaleTimeString()}
        </div>
      </div>

      {/* System Overview */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="text-center">
          <div className="text-2xl font-bold text-blue-600">
            {formatUptime(stats.uptime)}
          </div>
          <div className="text-sm text-gray-600">Uptime</div>
        </div>
        
        <div className="text-center">
          <div className="text-2xl font-bold text-green-600">
            {stats.processes}
          </div>
          <div className="text-sm text-gray-600">Processes</div>
        </div>
        
        <div className="text-center">
          <div className="text-2xl font-bold text-purple-600">
            {stats.connections}
          </div>
          <div className="text-sm text-gray-600">Connections</div>
        </div>
        
        <div className="text-center">
          <div className="text-2xl font-bold text-orange-600">
            {stats.cpu.cores}
          </div>
          <div className="text-sm text-gray-600">CPU Cores</div>
        </div>
      </div>

      {/* Resource Usage */}
      <div className="space-y-4">
        {/* CPU Usage */}
        <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
          <div className="flex items-center space-x-3">
            <CpuChipIcon className="w-6 h-6 text-blue-600" />
            <div>
              <div className="font-medium text-gray-900">CPU Usage</div>
              <div className="text-sm text-gray-600">
                Load: {stats.cpu.load.map(l => l.toFixed(2)).join(', ')}
              </div>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <div className={`flex items-center px-2 py-1 rounded-full text-sm font-medium ${getStatusColor(stats.cpu.usage)}`}>
              {getStatusIcon(stats.cpu.usage)}
              <span className="ml-1">{stats.cpu.usage.toFixed(1)}%</span>
            </div>
          </div>
        </div>

        {/* Memory Usage */}
        <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
          <div className="flex items-center space-x-3">
            <CircleStackIcon className="w-6 h-6 text-green-600" />
            <div>
              <div className="font-medium text-gray-900">Memory Usage</div>
              <div className="text-sm text-gray-600">
                {formatBytes(stats.memory.used)} / {formatBytes(stats.memory.total)}
              </div>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <div className={`flex items-center px-2 py-1 rounded-full text-sm font-medium ${getStatusColor(stats.memory.percentage)}`}>
              {getStatusIcon(stats.memory.percentage)}
              <span className="ml-1">{stats.memory.percentage.toFixed(1)}%</span>
            </div>
          </div>
        </div>

        {/* Disk Usage */}
        <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
          <div className="flex items-center space-x-3">
            <ServerIcon className="w-6 h-6 text-purple-600" />
            <div>
              <div className="font-medium text-gray-900">Disk Usage</div>
              <div className="text-sm text-gray-600">
                {formatBytes(stats.disk.used)} / {formatBytes(stats.disk.total)}
              </div>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <div className={`flex items-center px-2 py-1 rounded-full text-sm font-medium ${getStatusColor(stats.disk.percentage)}`}>
              {getStatusIcon(stats.disk.percentage)}
              <span className="ml-1">{stats.disk.percentage.toFixed(1)}%</span>
            </div>
          </div>
        </div>

        {/* Network Usage */}
        <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
          <div className="flex items-center space-x-3">
            <SignalIcon className="w-6 h-6 text-orange-600" />
            <div>
              <div className="font-medium text-gray-900">Network I/O</div>
              <div className="text-sm text-gray-600">
                RX: {formatBytes(stats.network.rx)} | TX: {formatBytes(stats.network.tx)}
              </div>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <StatusBadge status="success" size="sm">
              Active
            </StatusBadge>
          </div>
        </div>
      </div>

      {/* Progress Bars */}
      <div className="mt-6 space-y-3">
        <div>
          <div className="flex justify-between text-sm mb-1">
            <span className="text-gray-600">CPU</span>
            <span className="font-medium">{stats.cpu.usage.toFixed(1)}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className={`h-2 rounded-full transition-all duration-300 ${
                stats.cpu.usage >= 90 ? 'bg-red-500' :
                stats.cpu.usage >= 75 ? 'bg-yellow-500' :
                'bg-green-500'
              }`}
              style={{ width: `${Math.min(100, stats.cpu.usage)}%` }}
            />
          </div>
        </div>

        <div>
          <div className="flex justify-between text-sm mb-1">
            <span className="text-gray-600">Memory</span>
            <span className="font-medium">{stats.memory.percentage.toFixed(1)}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className={`h-2 rounded-full transition-all duration-300 ${
                stats.memory.percentage >= 90 ? 'bg-red-500' :
                stats.memory.percentage >= 75 ? 'bg-yellow-500' :
                'bg-green-500'
              }`}
              style={{ width: `${Math.min(100, stats.memory.percentage)}%` }}
            />
          </div>
        </div>

        <div>
          <div className="flex justify-between text-sm mb-1">
            <span className="text-gray-600">Disk</span>
            <span className="font-medium">{stats.disk.percentage.toFixed(1)}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className={`h-2 rounded-full transition-all duration-300 ${
                stats.disk.percentage >= 90 ? 'bg-red-500' :
                stats.disk.percentage >= 75 ? 'bg-yellow-500' :
                'bg-green-500'
              }`}
              style={{ width: `${Math.min(100, stats.disk.percentage)}%` }}
            />
          </div>
        </div>
      </div>
    </Card>
  );
};

export default SystemMonitorCard;