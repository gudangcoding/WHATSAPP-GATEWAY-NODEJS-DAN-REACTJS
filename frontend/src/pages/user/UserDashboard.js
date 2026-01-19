import React, { useState, useEffect } from 'react';
import { useQuery } from 'react-query';
import { Link } from 'react-router-dom';
import { devicesAPI, messagesAPI, analyticsAPI } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import {
  DevicePhoneMobileIcon,
  ChatBubbleOvalLeftEllipsisIcon,
  UsersIcon,
  BoltIcon,
  MegaphoneIcon,
  ChartBarIcon,
  PlusIcon,
  PlayIcon,
  PauseIcon,
  CheckCircleIcon,
  ExclamationCircleIcon,
  ClockIcon
} from '@heroicons/react/24/outline';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';

const UserDashboard = () => {
  const { user } = useAuth();
  const [timeRange, setTimeRange] = useState('7d');

  // Fetch user devices
  const { data: devicesData, isLoading: devicesLoading } = useQuery(
    'user-devices',
    () => devicesAPI.getAll(),
    { refetchInterval: 30000 }
  );

  // Fetch message stats
  const { data: messageStats, isLoading: messageLoading } = useQuery(
    ['message-stats', timeRange],
    () => messagesAPI.getStats({ period: timeRange }),
    { refetchInterval: 60000 }
  );

  // Fetch dashboard analytics
  const { data: dashboardData, isLoading: dashboardLoading } = useQuery(
    ['dashboard-analytics', timeRange],
    () => analyticsAPI.getDashboard({ period: timeRange }),
    { refetchInterval: 60000 }
  );

  const devices = devicesData?.data?.data || [];
  const stats = messageStats?.data?.data || {};
  const analytics = dashboardData?.data?.data || {};

  const connectedDevices = devices.filter(d => d.status === 'connected').length;
  const totalDevices = devices.length;

  const overviewCards = [
    {
      title: 'Active Devices',
      value: `${connectedDevices}/${totalDevices}`,
      subtitle: `${totalDevices - connectedDevices} offline`,
      icon: DevicePhoneMobileIcon,
      color: connectedDevices > 0 ? 'green' : 'gray',
      action: { label: 'Manage', href: '/dashboard/devices' }
    },
    {
      title: 'Messages Today',
      value: stats.today || 0,
      subtitle: `${stats.todayDelivered || 0} delivered`,
      icon: ChatBubbleOvalLeftEllipsisIcon,
      color: 'blue',
      action: { label: 'Send Message', href: '/dashboard/messages' }
    },
    {
      title: 'Total Contacts',
      value: analytics.totalContacts || 0,
      subtitle: `${analytics.newContactsToday || 0} added today`,
      icon: UsersIcon,
      color: 'purple',
      action: { label: 'Manage', href: '/dashboard/contacts' }
    },
    {
      title: 'Active Campaigns',
      value: analytics.activeCampaigns || 0,
      subtitle: `${analytics.completedCampaigns || 0} completed`,
      icon: MegaphoneIcon,
      color: 'orange',
      action: { label: 'Create', href: '/dashboard/campaigns' }
    }
  ];

  // Mock data for charts
  const messageChart = [
    { name: 'Mon', sent: 120, delivered: 115, failed: 5 },
    { name: 'Tue', sent: 190, delivered: 182, failed: 8 },
    { name: 'Wed', sent: 80, delivered: 78, failed: 2 },
    { name: 'Thu', sent: 160, delivered: 158, failed: 2 },
    { name: 'Fri', sent: 220, delivered: 210, failed: 10 },
    { name: 'Sat', sent: 180, delivered: 175, failed: 5 },
    { name: 'Sun', sent: 140, delivered: 138, failed: 2 }
  ];

  const quickActions = [
    {
      title: 'Send Message',
      description: 'Send a single message to a contact',
      icon: ChatBubbleOvalLeftEllipsisIcon,
      href: '/dashboard/messages',
      color: 'blue'
    },
    {
      title: 'Add Device',
      description: 'Connect a new WhatsApp device',
      icon: DevicePhoneMobileIcon,
      href: '/dashboard/devices',
      color: 'green'
    },
    {
      title: 'Create Campaign',
      description: 'Start a new message campaign',
      icon: MegaphoneIcon,
      href: '/dashboard/campaigns',
      color: 'purple'
    },
    {
      title: 'Setup Auto Reply',
      description: 'Configure automatic responses',
      icon: BoltIcon,
      href: '/dashboard/auto-reply',
      color: 'yellow'
    }
  ];

  if (devicesLoading || messageLoading || dashboardLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Welcome Header */}
      <div className="bg-gradient-to-r from-whatsapp-500 to-whatsapp-600 rounded-lg shadow-lg p-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Welcome back, {user?.name}!</h1>
            <p className="mt-1 text-whatsapp-100">
              Here's what's happening with your WhatsApp Gateway today.
            </p>
          </div>
          <div className="hidden md:block">
            <div className="flex items-center space-x-4">
              <div className="text-center">
                <div className="text-2xl font-bold">{connectedDevices}</div>
                <div className="text-sm text-whatsapp-100">Connected</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold">{stats.today || 0}</div>
                <div className="text-sm text-whatsapp-100">Messages Today</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {overviewCards.map((card, index) => (
          <div key={index} className="card hover:shadow-lg transition-shadow">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <card.icon className={`h-8 w-8 text-${card.color}-600`} />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">{card.title}</p>
                  <p className="text-2xl font-semibold text-gray-900">{card.value}</p>
                  <p className="text-sm text-gray-500">{card.subtitle}</p>
                </div>
              </div>
            </div>
            <div className="mt-4">
              <Link
                to={card.action.href}
                className={`text-sm font-medium text-${card.color}-600 hover:text-${card.color}-500`}
              >
                {card.action.label} →
              </Link>
            </div>
          </div>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="card">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-medium text-gray-900">Quick Actions</h3>
          <Link
            to="/dashboard/messages"
            className="btn-primary"
          >
            <PlusIcon className="h-4 w-4 mr-2" />
            Send Message
          </Link>
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {quickActions.map((action, index) => (
            <Link
              key={index}
              to={action.href}
              className="group relative rounded-lg p-4 border border-gray-200 hover:border-gray-300 hover:shadow-md transition-all"
            >
              <div className="flex items-center">
                <div className={`flex-shrink-0 p-2 bg-${action.color}-100 rounded-lg`}>
                  <action.icon className={`h-6 w-6 text-${action.color}-600`} />
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-900 group-hover:text-gray-700">
                    {action.title}
                  </p>
                  <p className="text-xs text-gray-500">{action.description}</p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* Charts and Recent Activity */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Message Analytics */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-gray-900">Message Analytics</h3>
            <select
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value)}
              className="input text-sm"
            >
              <option value="7d">Last 7 Days</option>
              <option value="30d">Last 30 Days</option>
              <option value="90d">Last 90 Days</option>
            </select>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={messageChart}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Line type="monotone" dataKey="sent" stroke="#3b82f6" strokeWidth={2} />
              <Line type="monotone" dataKey="delivered" stroke="#22c55e" strokeWidth={2} />
              <Line type="monotone" dataKey="failed" stroke="#ef4444" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
          <div className="mt-4 flex justify-center space-x-6">
            <div className="flex items-center">
              <div className="w-3 h-3 bg-blue-500 rounded mr-2"></div>
              <span className="text-sm text-gray-600">Sent</span>
            </div>
            <div className="flex items-center">
              <div className="w-3 h-3 bg-green-500 rounded mr-2"></div>
              <span className="text-sm text-gray-600">Delivered</span>
            </div>
            <div className="flex items-center">
              <div className="w-3 h-3 bg-red-500 rounded mr-2"></div>
              <span className="text-sm text-gray-600">Failed</span>
            </div>
          </div>
        </div>

        {/* Device Status */}
        <div className="card">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Device Status</h3>
          <div className="space-y-4">
            {devices.length === 0 ? (
              <div className="text-center py-8">
                <DevicePhoneMobileIcon className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">No devices</h3>
                <p className="mt-1 text-sm text-gray-500">Get started by adding your first WhatsApp device.</p>
                <div className="mt-6">
                  <Link to="/dashboard/devices" className="btn-primary">
                    <PlusIcon className="h-4 w-4 mr-2" />
                    Add Device
                  </Link>
                </div>
              </div>
            ) : (
              devices.slice(0, 5).map((device) => (
                <div key={device.id} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                  <div className="flex items-center">
                    <div className={`w-3 h-3 rounded-full mr-3 ${
                      device.status === 'connected' ? 'bg-green-400' :
                      device.status === 'connecting' ? 'bg-yellow-400' : 'bg-gray-400'
                    }`} />
                    <div>
                      <p className="text-sm font-medium text-gray-900">{device.name}</p>
                      <p className="text-xs text-gray-500">{device.phone_number}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      device.status === 'connected' ? 'bg-green-100 text-green-800' :
                      device.status === 'connecting' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {device.status}
                    </span>
                    {device.status === 'connected' && (
                      <CheckCircleIcon className="h-4 w-4 text-green-500" />
                    )}
                    {device.status === 'connecting' && (
                      <ClockIcon className="h-4 w-4 text-yellow-500" />
                    )}
                    {device.status === 'disconnected' && (
                      <ExclamationCircleIcon className="h-4 w-4 text-gray-500" />
                    )}
                  </div>
                </div>
              ))
            )}
            {devices.length > 5 && (
              <div className="text-center">
                <Link
                  to="/dashboard/devices"
                  className="text-sm text-whatsapp-600 hover:text-whatsapp-500"
                >
                  View all {devices.length} devices →
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Recent Messages */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-medium text-gray-900">Recent Messages</h3>
          <Link
            to="/dashboard/messages"
            className="text-sm text-whatsapp-600 hover:text-whatsapp-500"
          >
            View all →
          </Link>
        </div>
        <div className="overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Recipient
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Message
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Time
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {[
                { id: 1, to: '+62812345678', message: 'Hello, how can I help you?', status: 'delivered', time: '2 min ago' },
                { id: 2, to: '+62812345679', message: 'Thank you for your order!', status: 'delivered', time: '5 min ago' },
                { id: 3, to: '+62812345680', message: 'Your appointment is confirmed', status: 'sent', time: '10 min ago' },
                { id: 4, to: '+62812345681', message: 'Welcome to our service!', status: 'failed', time: '15 min ago' }
              ].map((message) => (
                <tr key={message.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {message.to}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500 max-w-xs truncate">
                    {message.message}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      message.status === 'delivered' ? 'bg-green-100 text-green-800' :
                      message.status === 'sent' ? 'bg-blue-100 text-blue-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {message.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {message.time}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default UserDashboard;