import React from 'react';
import { 
  ChartBarIcon,
  UserGroupIcon,
  ChatBubbleLeftRightIcon,
  DevicePhoneMobileIcon,
  ArrowPathIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  ClockIcon
} from '@heroicons/react/24/outline';
import AnalyticsCard from './AnalyticsCard';
import LoadingSpinner from '../common/LoadingSpinner';

const MetricsGrid = ({
  metrics = {},
  loading = false,
  error = null,
  timeRange = '7d',
  onCardClick = null,
  className = ''
}) => {
  if (loading) {
    return (
      <div className={`flex items-center justify-center py-12 ${className}`}>
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (error) {
    return (
      <div className={`text-center py-12 ${className}`}>
        <ExclamationTriangleIcon className="w-12 h-12 text-red-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">Failed to load metrics</h3>
        <p className="text-gray-600">{error}</p>
      </div>
    );
  }

  const {
    totalMessages = 0,
    totalDevices = 0,
    totalContacts = 0,
    totalCampaigns = 0,
    activeAutoReplies = 0,
    messagesSent = 0,
    messagesReceived = 0,
    messagesDelivered = 0,
    messagesFailed = 0,
    devicesOnline = 0,
    devicesOffline = 0,
    campaignsActive = 0,
    campaignsCompleted = 0,
    autoReplyTriggers = 0,
    deliveryRate = 0,
    responseRate = 0,
    uptime = 0,
    // Previous period data for comparison
    previousPeriod = {}
  } = metrics;

  const metricsConfig = [
    // Messages Overview
    {
      title: 'Total Messages',
      value: totalMessages,
      previousValue: previousPeriod.totalMessages,
      icon: ChatBubbleLeftRightIcon,
      iconColor: 'text-blue-600',
      iconBgColor: 'bg-blue-100',
      tooltip: 'Total messages sent and received',
      onClick: () => onCardClick?.('messages')
    },
    {
      title: 'Messages Sent',
      value: messagesSent,
      previousValue: previousPeriod.messagesSent,
      icon: ChatBubbleLeftRightIcon,
      iconColor: 'text-green-600',
      iconBgColor: 'bg-green-100',
      tooltip: 'Messages sent from your devices',
      onClick: () => onCardClick?.('messages-sent')
    },
    {
      title: 'Messages Received',
      value: messagesReceived,
      previousValue: previousPeriod.messagesReceived,
      icon: ChatBubbleLeftRightIcon,
      iconColor: 'text-purple-600',
      iconBgColor: 'bg-purple-100',
      tooltip: 'Messages received on your devices',
      onClick: () => onCardClick?.('messages-received')
    },
    {
      title: 'Delivery Rate',
      value: deliveryRate,
      previousValue: previousPeriod.deliveryRate,
      changeType: 'percentage',
      icon: CheckCircleIcon,
      iconColor: 'text-emerald-600',
      iconBgColor: 'bg-emerald-100',
      tooltip: 'Percentage of messages successfully delivered',
      subtitle: `${messagesDelivered} delivered, ${messagesFailed} failed`
    },

    // Devices Overview
    {
      title: 'Total Devices',
      value: totalDevices,
      previousValue: previousPeriod.totalDevices,
      icon: DevicePhoneMobileIcon,
      iconColor: 'text-indigo-600',
      iconBgColor: 'bg-indigo-100',
      tooltip: 'Total WhatsApp devices configured',
      subtitle: `${devicesOnline} online, ${devicesOffline} offline`,
      onClick: () => onCardClick?.('devices')
    },
    {
      title: 'Devices Online',
      value: devicesOnline,
      previousValue: previousPeriod.devicesOnline,
      icon: CheckCircleIcon,
      iconColor: 'text-green-600',
      iconBgColor: 'bg-green-100',
      tooltip: 'Devices currently connected and active'
    },
    {
      title: 'System Uptime',
      value: `${uptime}%`,
      previousValue: previousPeriod.uptime,
      changeType: 'percentage',
      icon: ClockIcon,
      iconColor: 'text-blue-600',
      iconBgColor: 'bg-blue-100',
      tooltip: 'System availability percentage'
    },
    {
      title: 'Response Rate',
      value: responseRate,
      previousValue: previousPeriod.responseRate,
      changeType: 'percentage',
      icon: ArrowPathIcon,
      iconColor: 'text-orange-600',
      iconBgColor: 'bg-orange-100',
      tooltip: 'Percentage of messages that received responses'
    },

    // Contacts & Campaigns
    {
      title: 'Total Contacts',
      value: totalContacts,
      previousValue: previousPeriod.totalContacts,
      icon: UserGroupIcon,
      iconColor: 'text-cyan-600',
      iconBgColor: 'bg-cyan-100',
      tooltip: 'Total contacts in your address book',
      onClick: () => onCardClick?.('contacts')
    },
    {
      title: 'Total Campaigns',
      value: totalCampaigns,
      previousValue: previousPeriod.totalCampaigns,
      icon: ChartBarIcon,
      iconColor: 'text-pink-600',
      iconBgColor: 'bg-pink-100',
      tooltip: 'Total message campaigns created',
      subtitle: `${campaignsActive} active, ${campaignsCompleted} completed`,
      onClick: () => onCardClick?.('campaigns')
    },
    {
      title: 'Active Auto Replies',
      value: activeAutoReplies,
      previousValue: previousPeriod.activeAutoReplies,
      icon: ArrowPathIcon,
      iconColor: 'text-violet-600',
      iconBgColor: 'bg-violet-100',
      tooltip: 'Auto reply rules currently active',
      onClick: () => onCardClick?.('auto-replies')
    },
    {
      title: 'Auto Reply Triggers',
      value: autoReplyTriggers,
      previousValue: previousPeriod.autoReplyTriggers,
      icon: ArrowPathIcon,
      iconColor: 'text-amber-600',
      iconBgColor: 'bg-amber-100',
      tooltip: 'Auto replies triggered in selected period'
    }
  ];

  return (
    <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 ${className}`}>
      {metricsConfig.map((metric, index) => (
        <AnalyticsCard
          key={index}
          {...metric}
        />
      ))}
    </div>
  );
};

export default MetricsGrid;