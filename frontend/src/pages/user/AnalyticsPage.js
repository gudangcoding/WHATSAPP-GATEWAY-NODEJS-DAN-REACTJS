import React, { useState, useEffect } from 'react';
import { 
  ChartBarIcon,
  CalendarDaysIcon,
  ArrowPathIcon,
  FunnelIcon,
  ArrowDownTrayIcon,
  Cog6ToothIcon
} from '@heroicons/react/24/outline';
import MetricsGrid from '../../components/analytics/MetricsGrid';
import ChartCard from '../../components/analytics/ChartCard';
import RealtimeStats from '../../components/analytics/RealtimeStats';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import Dropdown from '../../components/common/Dropdown';
import Tabs, { TabPanel } from '../../components/common/Tabs';
import Alert from '../../components/common/Alert';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { useAuth } from '../../contexts/AuthContext';
import { analyticsAPI } from '../../services/api';
import { hasPermission, PERMISSIONS } from '../../utils/constants/permissions';

const AnalyticsPage = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [metrics, setMetrics] = useState({});
  const [chartData, setChartData] = useState({});
  const [selectedTimeRange, setSelectedTimeRange] = useState('7d');
  const [selectedDevice, setSelectedDevice] = useState('');
  const [devices, setDevices] = useState([]);
  const [activeTab, setActiveTab] = useState('overview');

  const { user } = useAuth();

  // Check permissions
  const canViewAnalytics = hasPermission(user?.permissions, PERMISSIONS.ANALYTICS_VIEW);
  const canExportData = hasPermission(user?.permissions, PERMISSIONS.ANALYTICS_EXPORT);

  // Time range options
  const timeRangeOptions = [
    { value: '1d', label: 'Last 24 Hours' },
    { value: '7d', label: 'Last 7 Days' },
    { value: '30d', label: 'Last 30 Days' },
    { value: '90d', label: 'Last 3 Months' },
    { value: '1y', label: 'Last Year' }
  ];

  // Load analytics data
  const loadAnalytics = async () => {
    try {
      setLoading(true);
      setError('');

      const params = {
        timeRange: selectedTimeRange,
        deviceId: selectedDevice || undefined
      };

      const [metricsResponse, chartsResponse, devicesResponse] = await Promise.all([
        analyticsAPI.getDashboard(params),
        analyticsAPI.getMessages(params),
        analyticsAPI.getDevices({ limit: 100 })
      ]);

      setMetrics(metricsResponse.data);
      setChartData(chartsResponse.data);
      setDevices(devicesResponse.data.devices || []);
    } catch (err) {
      console.error('Failed to load analytics:', err);
      setError('Failed to load analytics data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (canViewAnalytics) {
      loadAnalytics();
    }
  }, [selectedTimeRange, selectedDevice, canViewAnalytics]);

  // Handle metric card clicks
  const handleMetricClick = (metricType) => {
    // Navigate to detailed view or show modal
    console.log('Metric clicked:', metricType);
  };

  // Handle data export
  const handleExport = async (type = 'csv') => {
    try {
      const params = {
        timeRange: selectedTimeRange,
        deviceId: selectedDevice || undefined,
        format: type
      };

      const response = await analyticsAPI.exportReport('dashboard', params);
      
      // Create download link
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `analytics_${selectedTimeRange}_${Date.now()}.${type}`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Failed to export data:', err);
      setError('Failed to export data. Please try again.');
    }
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

  const tabs = [
    {
      key: 'overview',
      label: 'Overview',
      icon: <ChartBarIcon className="w-4 h-4" />
    },
    {
      key: 'messages',
      label: 'Messages',
      icon: <ChartBarIcon className="w-4 h-4" />
    },
    {
      key: 'devices',
      label: 'Devices',
      icon: <ChartBarIcon className="w-4 h-4" />
    },
    {
      key: 'campaigns',
      label: 'Campaigns',
      icon: <ChartBarIcon className="w-4 h-4" />
    },
    {
      key: 'realtime',
      label: 'Real-time',
      icon: <ArrowPathIcon className="w-4 h-4" />
    }
  ];

  if (!canViewAnalytics) {
    return (
      <div className="p-6">
        <Alert variant="warning">
          You don't have permission to view analytics.
        </Alert>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Analytics</h1>
          <p className="text-gray-600 mt-2">
            Monitor your WhatsApp gateway performance and insights
          </p>
        </div>

        <div className="flex items-center space-x-3">
          {/* Device Filter */}
          <Dropdown
            options={[
              { value: '', label: 'All Devices' },
              ...devices.map(device => ({
                value: device.id,
                label: `${device.name} (${device.phone_number || 'No number'})`
              }))
            ]}
            value={selectedDevice}
            onChange={setSelectedDevice}
            placeholder="Filter by device"
            className="min-w-[200px]"
          />

          {/* Time Range Filter */}
          <Dropdown
            options={timeRangeOptions}
            value={selectedTimeRange}
            onChange={setSelectedTimeRange}
            className="min-w-[150px]"
          />

          {/* Export Button */}
          {canExportData && (
            <Button
              variant="outline"
              onClick={() => handleExport('csv')}
              icon={<ArrowDownTrayIcon className="w-4 h-4" />}
              disabled={loading}
            >
              Export
            </Button>
          )}

          {/* Refresh Button */}
          <Button
            variant="outline"
            onClick={loadAnalytics}
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

      {/* Analytics Tabs */}
      <Tabs
        tabs={tabs}
        defaultTab="overview"
        onChange={setActiveTab}
        variant="underline"
      >
        {/* Overview Tab */}
        <TabPanel tabKey="overview">
          <div className="space-y-6">
            {/* Metrics Grid */}
            <MetricsGrid
              metrics={metrics}
              loading={loading}
              error={error}
              timeRange={selectedTimeRange}
              onCardClick={handleMetricClick}
            />

            {/* Charts Row */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <ChartCard
                title="Messages Over Time"
                subtitle="Messages sent and received"
                type="line"
                data={prepareChartData(chartData.messagesOverTime, 'line')}
                loading={loading}
                timeRangeOptions={timeRangeOptions}
                selectedTimeRange={selectedTimeRange}
                onTimeRangeChange={setSelectedTimeRange}
              />

              <ChartCard
                title="Message Types Distribution"
                subtitle="Breakdown by message type"
                type="doughnut"
                data={prepareChartData(chartData.messageTypes, 'doughnut')}
                loading={loading}
              />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <ChartCard
                title="Device Performance"
                subtitle="Messages per device"
                type="bar"
                data={prepareChartData(chartData.devicePerformance, 'bar')}
                loading={loading}
              />

              <ChartCard
                title="Delivery Status"
                subtitle="Message delivery rates"
                type="pie"
                data={prepareChartData(chartData.deliveryStatus, 'pie')}
                loading={loading}
              />
            </div>
          </div>
        </TabPanel>

        {/* Messages Tab */}
        <TabPanel tabKey="messages">
          <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <ChartCard
                title="Message Volume Trends"
                subtitle="Daily message volume"
                type="line"
                data={prepareChartData(chartData.messageVolume, 'line')}
                loading={loading}
              />

              <ChartCard
                title="Peak Hours Analysis"
                subtitle="Messages by hour of day"
                type="bar"
                data={prepareChartData(chartData.peakHours, 'bar')}
                loading={loading}
              />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <ChartCard
                title="Response Time Distribution"
                subtitle="Average response times"
                type="line"
                data={prepareChartData(chartData.responseTime, 'line')}
                loading={loading}
              />

              <ChartCard
                title="Failed Messages Analysis"
                subtitle="Failure reasons breakdown"
                type="doughnut"
                data={prepareChartData(chartData.failureReasons, 'doughnut')}
                loading={loading}
              />
            </div>
          </div>
        </TabPanel>

        {/* Devices Tab */}
        <TabPanel tabKey="devices">
          <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <ChartCard
                title="Device Uptime"
                subtitle="Connection stability over time"
                type="line"
                data={prepareChartData(chartData.deviceUptime, 'line')}
                loading={loading}
              />

              <ChartCard
                title="Device Load Distribution"
                subtitle="Messages per device"
                type="bar"
                data={prepareChartData(chartData.deviceLoad, 'bar')}
                loading={loading}
              />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <ChartCard
                title="Connection Events"
                subtitle="Connect/disconnect events"
                type="line"
                data={prepareChartData(chartData.connectionEvents, 'line')}
                loading={loading}
              />

              <ChartCard
                title="Device Status Overview"
                subtitle="Current device status"
                type="pie"
                data={prepareChartData(chartData.deviceStatus, 'pie')}
                loading={loading}
              />
            </div>
          </div>
        </TabPanel>

        {/* Campaigns Tab */}
        <TabPanel tabKey="campaigns">
          <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <ChartCard
                title="Campaign Performance"
                subtitle="Success rates over time"
                type="line"
                data={prepareChartData(chartData.campaignPerformance, 'line')}
                loading={loading}
              />

              <ChartCard
                title="Campaign Types"
                subtitle="Distribution by campaign type"
                type="doughnut"
                data={prepareChartData(chartData.campaignTypes, 'doughnut')}
                loading={loading}
              />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <ChartCard
                title="Target Audience Reach"
                subtitle="Audience engagement metrics"
                type="bar"
                data={prepareChartData(chartData.audienceReach, 'bar')}
                loading={loading}
              />

              <ChartCard
                title="Campaign ROI"
                subtitle="Return on investment trends"
                type="line"
                data={prepareChartData(chartData.campaignROI, 'line')}
                loading={loading}
              />
            </div>
          </div>
        </TabPanel>

        {/* Real-time Tab */}
        <TabPanel tabKey="realtime">
          <RealtimeStats
            showSystemHealth={true}
            showRecentActivity={true}
            showLiveMetrics={true}
            refreshInterval={5000}
          />
        </TabPanel>
      </Tabs>
    </div>
  );
};

export default AnalyticsPage;