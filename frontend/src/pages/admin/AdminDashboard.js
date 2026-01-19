import React, { useState, useEffect } from 'react';
import { 
  UsersIcon,
  DevicePhoneMobileIcon,
  ChatBubbleLeftRightIcon,
  ChartBarIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  ClockIcon,
  ServerIcon,
  ArrowPathIcon
} from '@heroicons/react/24/outline';
import MetricsGrid from '../../components/analytics/MetricsGrid';
import ChartCard from '../../components/analytics/ChartCard';
import SystemMonitorCard from '../../components/admin/SystemMonitorCard';
import UserManagementCard from '../../components/admin/UserManagementCard';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import Alert from '../../components/common/Alert';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { useAuth } from '../../contexts/AuthContext';
import { adminAPI, analyticsAPI, systemAPI } from '../../services/api';
import { hasPermission, PERMISSIONS } from '../../utils/constants/permissions';

const AdminDashboard = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [systemStats, setSystemStats] = useState({});
  const [systemHealth, setSystemHealth] = useState({});
  const [recentUsers, setRecentUsers] = useState([]);
  const [chartData, setChartData] = useState({});
  const [timeRange, setTimeRange] = useState('7d');

  const { user } = useAuth();

  // Check permissions
  const canViewUsers = hasPermission(user?.permissions, PERMISSIONS.USER_VIEW_ALL);
  const canViewSystem = hasPermission(user?.permissions, PERMISSIONS.SYSTEM_VIEW);

  // Load admin dashboard data
  const loadDashboardData = async () => {
    try {
      setLoading(true);
      setError('');

      const [statsResponse, healthResponse, usersResponse, analyticsResponse] = await Promise.all([
        adminAPI.getSystemStats(),
        systemAPI.getHealth(),
        canViewUsers ? adminAPI.getUsers({ limit: 5, sort: 'created_at', order: 'desc' }) : Promise.resolve({ data: { data: [] } }),
        analyticsAPI.getDashboard({ timeRange, admin: true })
      ]);

      setSystemStats(statsResponse.data);
      setSystemHealth(healthResponse.data);
      setRecentUsers(usersResponse.data.data || []);
      setChartData(analyticsResponse.data);
    } catch (err) {
      console.error('Failed to load admin dashboard:', err);
      setError('Failed to load dashboard data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, [timeRange, canViewUsers]);

  // Prepare metrics for MetricsGrid
  const adminMetrics = {
    totalUsers: systemStats.totalUsers || 0,
    totalDevices: systemStats.totalDevices || 0,
    totalMessages: systemStats.totalMessages || 0,
    totalCampaigns: systemStats.totalCampaigns || 0,
    activeUsers: systemStats.activeUsers || 0,
    activeDevices: systemStats.activeDevices || 0,
    messagesDelivered: systemStats.messagesDelivered || 0,
    messagesFailed: systemStats.messagesFailed || 0,
    systemUptime: systemHealth.uptime || 0,
    responseTime: systemHealth.responseTime || 0,
    deliveryRate: systemStats.deliveryRate || 0,
    errorRate: systemStats.errorRate || 0,
    previousPeriod: systemStats.previousPeriod || {}
  };

  // Prepare chart data
  const prepareChartData = (data, type) => {
    if (!data || !data.labels || !data.datasets) {
      return null;
    }

    const colors = {
      primary: 'rgba(59, 130, 246, 0.8)',
      secondary: 'rgba(16, 185, 129, 0.8)',
      tertiary: 'rgba(245, 101, 101, 0.8)',
      quaternary: 'rgba(139, 92, 246, 0.8)'
    };

    return {
      labels: data.labels,
      datasets: data.datasets.map((dataset, index) => ({
        ...dataset,
        backgroundColor: Object.values(colors)[index % Object.keys(colors).length],
        borderColor: Object.values(colors)[index % Object.keys(colors).length].replace('0.8', '1'),
        borderWidth: 2,
        fill: type === 'line' ? false : true
      }))
    };
  };

  // Handle user management actions
  const handleEditUser = (user) => {
    console.log('Edit user:', user);
    // Implement user edit modal
  };

  const handleDeleteUser = async (userId) => {
    try {
      await adminAPI.deleteUser(userId);
      setRecentUsers(prev => prev.filter(u => u.id !== userId));
    } catch (err) {
      console.error('Failed to delete user:', err);
      setError('Failed to delete user. Please try again.');
    }
  };

  const handleSuspendUser = async (userId) => {
    try {
      await adminAPI.suspendUser(userId);
      setRecentUsers(prev => prev.map(u => 
        u.id === userId ? { ...u, status: 'suspended' } : u
      ));
    } catch (err) {
      console.error('Failed to suspend user:', err);
      setError('Failed to suspend user. Please try again.');
    }
  };

  const handleActivateUser = async (userId) => {
    try {
      await adminAPI.activateUser(userId);
      setRecentUsers(prev => prev.map(u => 
        u.id === userId ? { ...u, status: 'active' } : u
      ));
    } catch (err) {
      console.error('Failed to activate user:', err);
      setError('Failed to activate user. Please try again.');
    }
  };

  const timeRangeOptions = [
    { value: '1d', label: 'Last 24 Hours' },
    { value: '7d', label: 'Last 7 Days' },
    { value: '30d', label: 'Last 30 Days' },
    { value: '90d', label: 'Last 3 Months' }
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
          <p className="text-gray-600 mt-2">
            Monitor and manage your WhatsApp Gateway system
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value)}
            className="block w-40 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          >
            {timeRangeOptions.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>

          <Button
            variant="outline"
            onClick={loadDashboardData}
            loading={loading}
            icon={<ArrowPathIcon className="w-4 h-4" />}
          >
            Refresh
          </Button>
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <Alert 
          variant="danger" 
          dismissible 
          onDismiss={() => setError('')}
        >
          {error}
        </Alert>
      )}

      {/* System Health Alert */}
      {systemHealth.status && (
        <Alert 
          variant={systemHealth.status === 'healthy' ? 'success' : 'danger'}
          icon={systemHealth.status === 'healthy' ? <CheckCircleIcon className="w-5 h-5" /> : <ExclamationTriangleIcon className="w-5 h-5" />}
        >
          <div>
            <h3 className="font-medium">
              System Status: {systemHealth.status === 'healthy' ? 'All Systems Operational' : 'System Issues Detected'}
            </h3>
            <p className="mt-1 text-sm">
              Last updated: {new Date().toLocaleString()}
            </p>
          </div>
        </Alert>
      )}

      {/* Admin Metrics Grid */}
      <MetricsGrid
        metrics={adminMetrics}
        loading={loading}
        error={error}
        timeRange={timeRange}
      />

      {/* System Monitor and Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* System Monitor */}
        {canViewSystem && (
          <SystemMonitorCard
            title="System Performance"
            systemStats={systemHealth}
            loading={loading}
            refreshInterval={30000}
          />
        )}

        {/* System Overview Chart */}
        <ChartCard
          title="System Activity Overview"
          subtitle="Messages and user activity"
          type="line"
          data={prepareChartData(chartData.systemActivity, 'line')}
          loading={loading}
          timeRangeOptions={timeRangeOptions}
          selectedTimeRange={timeRange}
          onTimeRangeChange={setTimeRange}
        />
      </div>

      {/* Analytics Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ChartCard
          title="User Growth"
          subtitle="New user registrations over time"
          type="bar"
          data={prepareChartData(chartData.userGrowth, 'bar')}
          loading={loading}
        />

        <ChartCard
          title="Device Status Distribution"
          subtitle="Current device connection status"
          type="doughnut"
          data={prepareChartData(chartData.deviceStatus, 'doughnut')}
          loading={loading}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ChartCard
          title="Message Volume Trends"
          subtitle="Daily message processing volume"
          type="line"
          data={prepareChartData(chartData.messageVolume, 'line')}
          loading={loading}
        />

        <ChartCard
          title="System Performance Metrics"
          subtitle="Response time and throughput"
          type="line"
          data={prepareChartData(chartData.performance, 'line')}
          loading={loading}
        />
      </div>

      {/* Recent Users Management */}
      {canViewUsers && recentUsers.length > 0 && (
        <Card className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-medium text-gray-900">Recent Users</h3>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {/* Navigate to users page */}}
            >
              View All Users
            </Button>
          </div>
          
          <div className="space-y-4">
            {recentUsers.map((user) => (
              <UserManagementCard
                key={user.id}
                user={user}
                onEdit={handleEditUser}
                onDelete={handleDeleteUser}
                onSuspend={handleSuspendUser}
                onActivate={handleActivateUser}
                loading={loading}
              />
            ))}
          </div>
        </Card>
      )}

      {/* Recent System Activity */}
      <Card className="p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-6">Recent System Activity</h3>
        <div className="flow-root">
          <ul className="-mb-8">
            {[
              { 
                id: 1, 
                type: 'user', 
                content: 'New user registered: john@example.com', 
                time: '2 minutes ago', 
                icon: UsersIcon, 
                iconColor: 'text-blue-600' 
              },
              { 
                id: 2, 
                type: 'device', 
                content: 'Device "Sales Team" connected successfully', 
                time: '5 minutes ago', 
                icon: DevicePhoneMobileIcon, 
                iconColor: 'text-green-600' 
              },
              { 
                id: 3, 
                type: 'message', 
                content: 'Bulk message campaign completed: 1,250 messages sent', 
                time: '10 minutes ago', 
                icon: ChatBubbleLeftRightIcon, 
                iconColor: 'text-purple-600' 
              },
              { 
                id: 4, 
                type: 'system', 
                content: 'System backup completed successfully', 
                time: '1 hour ago', 
                icon: CheckCircleIcon, 
                iconColor: 'text-green-600' 
              }
            ].map((item, itemIdx, items) => (
              <li key={item.id}>
                <div className="relative pb-8">
                  {itemIdx !== items.length - 1 ? (
                    <span className="absolute top-4 left-4 -ml-px h-full w-0.5 bg-gray-200" />
                  ) : null}
                  <div className="relative flex space-x-3">
                    <div>
                      <span className="h-8 w-8 rounded-full bg-gray-100 flex items-center justify-center ring-8 ring-white">
                        <item.icon className={`h-5 w-5 ${item.iconColor}`} />
                      </span>
                    </div>
                    <div className="min-w-0 flex-1 pt-1.5 flex justify-between space-x-4">
                      <div>
                        <p className="text-sm text-gray-900">{item.content}</p>
                      </div>
                      <div className="text-right text-sm whitespace-nowrap text-gray-500">
                        {item.time}
                      </div>
                    </div>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </Card>
    </div>
  );
};

export default AdminDashboard;