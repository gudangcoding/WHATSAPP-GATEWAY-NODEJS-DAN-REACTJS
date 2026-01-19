import React, { useState, useEffect } from 'react';
import { 
  ChartBarIcon,
  ClockIcon,
  CheckCircleIcon,
  XCircleIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon
} from '@heroicons/react/24/outline';
import AutoReplyList from '../../components/auto-reply/AutoReplyList';
import Card from '../../components/common/Card';
import { StatusBadge } from '../../components/common/Badge';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import Alert from '../../components/common/Alert';
import { useSocket, useSystemSocket } from '../../hooks/useSocket';
import { autoReplyAPI, analyticsAPI } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import { hasPermission, PERMISSIONS } from '../../utils/constants/permissions';

const AutoReplyPage = () => {
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    inactive: 0,
    triggered_today: 0,
    success_rate: 0
  });
  const [recentActivity, setRecentActivity] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const { user } = useAuth();
  const { on, off } = useSocket();
  const { subscribeToNotifications } = useSystemSocket();

  // Check permissions
  const canView = hasPermission(user?.permissions, PERMISSIONS.AUTO_REPLY_VIEW_OWN);

  // Load dashboard stats
  const loadStats = async () => {
    try {
      setLoading(true);
      setError('');

      const [statsResponse, activityResponse] = await Promise.all([
        analyticsAPI.getDashboard({ module: 'auto_reply' }),
        autoReplyAPI.getAll({ limit: 5, sort_by: 'last_triggered_at', sort_order: 'desc' })
      ]);

      setStats(statsResponse.data.auto_reply || {});
      setRecentActivity(activityResponse.data.data || []);
    } catch (err) {
      console.error('Failed to load auto reply stats:', err);
      setError('Failed to load dashboard data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (canView) {
      loadStats();
    }
  }, [canView]);

  // Socket event handlers
  useEffect(() => {
    const handleAutoReplyTriggered = (data) => {
      setStats(prev => ({
        ...prev,
        triggered_today: prev.triggered_today + 1
      }));
      
      // Update recent activity
      setRecentActivity(prev => [
        {
          id: data.auto_reply_id,
          name: data.auto_reply_name,
          triggered_at: new Date().toISOString(),
          status: data.success ? 'success' : 'failed',
          contact_name: data.contact_name,
          message: data.message
        },
        ...prev.slice(0, 4)
      ]);
    };

    const handleAutoReplyStatusChange = (data) => {
      if (data.is_active) {
        setStats(prev => ({
          ...prev,
          active: prev.active + 1,
          inactive: Math.max(0, prev.inactive - 1)
        }));
      } else {
        setStats(prev => ({
          ...prev,
          active: Math.max(0, prev.active - 1),
          inactive: prev.inactive + 1
        }));
      }
    };

    on('auto_reply:triggered', handleAutoReplyTriggered);
    on('auto_reply:status_changed', handleAutoReplyStatusChange);

    return () => {
      off('auto_reply:triggered', handleAutoReplyTriggered);
      off('auto_reply:status_changed', handleAutoReplyStatusChange);
    };
  }, [on, off]);

  // System notifications
  useEffect(() => {
    const unsubscribe = subscribeToNotifications((notification) => {
      if (notification.type === 'auto_reply_quota_warning') {
        setError(`Auto Reply Quota Warning: ${notification.message}`);
      }
    });

    return unsubscribe;
  }, [subscribeToNotifications]);

  if (!canView) {
    return (
      <div className="p-6">
        <Alert variant="warning">
          <ExclamationTriangleIcon className="w-5 h-5" />
          <span>You don't have permission to view auto replies.</span>
        </Alert>
      </div>
    );
  }

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
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Auto Reply</h1>
        <p className="text-gray-600 mt-2">
          Set up automated responses to handle incoming messages efficiently
        </p>
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

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
        <Card className="p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <ChartBarIcon className="w-8 h-8 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Auto Replies</p>
              <p className="text-2xl font-bold text-gray-900">{stats.total || 0}</p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <CheckCircleIcon className="w-8 h-8 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Active</p>
              <p className="text-2xl font-bold text-gray-900">{stats.active || 0}</p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <XCircleIcon className="w-8 h-8 text-gray-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Inactive</p>
              <p className="text-2xl font-bold text-gray-900">{stats.inactive || 0}</p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <ClockIcon className="w-8 h-8 text-orange-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Triggered Today</p>
              <p className="text-2xl font-bold text-gray-900">{stats.triggered_today || 0}</p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                <span className="text-purple-600 font-bold text-sm">%</span>
              </div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Success Rate</p>
              <p className="text-2xl font-bold text-gray-900">
                {stats.success_rate ? `${stats.success_rate.toFixed(1)}%` : '0%'}
              </p>
            </div>
          </div>
        </Card>
      </div>

      {/* Recent Activity */}
      {recentActivity.length > 0 && (
        <Card className="p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Recent Activity</h3>
          <div className="space-y-3">
            {recentActivity.map((activity, index) => (
              <div key={index} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-b-0">
                <div className="flex items-center space-x-3">
                  <div className={`w-2 h-2 rounded-full ${
                    activity.status === 'success' ? 'bg-green-500' : 'bg-red-500'
                  }`} />
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      {activity.name}
                    </p>
                    <p className="text-xs text-gray-500">
                      Triggered by {activity.contact_name || 'Unknown contact'}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <StatusBadge 
                    status={activity.status === 'success' ? 'success' : 'error'} 
                    size="sm"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    {new Date(activity.triggered_at).toLocaleTimeString()}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Info Card for New Users */}
      {stats.total === 0 && (
        <Card className="p-6 bg-blue-50 border-blue-200">
          <div className="flex items-start space-x-3">
            <InformationCircleIcon className="w-6 h-6 text-blue-600 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="text-lg font-medium text-blue-900 mb-2">
                Welcome to Auto Reply!
              </h3>
              <p className="text-blue-800 mb-4">
                Auto replies help you respond to messages automatically based on keywords, patterns, or conditions. 
                This is perfect for handling common questions, providing instant responses, or managing messages when you're away.
              </p>
              <div className="space-y-2 text-sm text-blue-700">
                <p><strong>Getting Started:</strong></p>
                <ul className="list-disc list-inside space-y-1 ml-4">
                  <li>Create your first auto reply using the button above</li>
                  <li>Set up trigger keywords or patterns</li>
                  <li>Configure your automated response message</li>
                  <li>Test and activate your auto reply</li>
                </ul>
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* Auto Reply List */}
      <AutoReplyList
        showHeader={false}
      />
    </div>
  );
};

export default AutoReplyPage;