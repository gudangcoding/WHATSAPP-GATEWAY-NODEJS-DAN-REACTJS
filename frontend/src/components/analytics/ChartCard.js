import React, { useState } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  Filler
} from 'chart.js';
import { Line, Bar, Doughnut, Pie } from 'react-chartjs-2';
import { 
  ArrowsPointingOutIcon,
  ArrowDownTrayIcon,
  Cog6ToothIcon
} from '@heroicons/react/24/outline';
import Card from '../common/Card';
import Button from '../common/Button';
import Dropdown from '../common/Dropdown';
import LoadingSpinner from '../common/LoadingSpinner';
import Modal from '../common/Modal';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  Filler
);

const ChartCard = ({
  title,
  subtitle,
  type = 'line', // 'line' | 'bar' | 'doughnut' | 'pie'
  data,
  options = {},
  loading = false,
  error = null,
  height = 300,
  showControls = true,
  showFullscreen = true,
  showExport = true,
  showSettings = false,
  timeRangeOptions = [],
  selectedTimeRange = null,
  onTimeRangeChange = null,
  onExport = null,
  onSettingsChange = null,
  className = '',
  ...props
}) => {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);

  // Default chart options
  const defaultOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
      },
      title: {
        display: false,
      },
      tooltip: {
        mode: 'index',
        intersect: false,
      },
    },
    scales: type === 'line' || type === 'bar' ? {
      x: {
        display: true,
        grid: {
          display: false,
        },
      },
      y: {
        display: true,
        beginAtZero: true,
        grid: {
          color: 'rgba(0, 0, 0, 0.1)',
        },
      },
    } : {},
    interaction: {
      mode: 'nearest',
      axis: 'x',
      intersect: false,
    },
    ...options,
  };

  const renderChart = (fullscreen = false) => {
    const chartHeight = fullscreen ? 500 : height;
    
    if (loading) {
      return (
        <div 
          className="flex items-center justify-center" 
          style={{ height: chartHeight }}
        >
          <LoadingSpinner size="lg" />
        </div>
      );
    }

    if (error) {
      return (
        <div 
          className="flex items-center justify-center text-red-500" 
          style={{ height: chartHeight }}
        >
          <div className="text-center">
            <p className="font-medium">Failed to load chart</p>
            <p className="text-sm text-gray-500 mt-1">{error}</p>
          </div>
        </div>
      );
    }

    if (!data || !data.datasets || data.datasets.length === 0) {
      return (
        <div 
          className="flex items-center justify-center text-gray-500" 
          style={{ height: chartHeight }}
        >
          <div className="text-center">
            <p className="font-medium">No data available</p>
            <p className="text-sm text-gray-400 mt-1">Data will appear here when available</p>
          </div>
        </div>
      );
    }

    const chartProps = {
      data,
      options: defaultOptions,
      height: chartHeight,
    };

    switch (type) {
      case 'bar':
        return <Bar {...chartProps} />;
      case 'doughnut':
        return <Doughnut {...chartProps} />;
      case 'pie':
        return <Pie {...chartProps} />;
      case 'line':
      default:
        return <Line {...chartProps} />;
    }
  };

  const handleExport = () => {
    if (onExport) {
      onExport({ title, data, type });
    } else {
      // Default export as image
      const canvas = document.querySelector('canvas');
      if (canvas) {
        const url = canvas.toDataURL('image/png');
        const link = document.createElement('a');
        link.download = `${title.replace(/\s+/g, '_').toLowerCase()}_chart.png`;
        link.href = url;
        link.click();
      }
    }
  };

  return (
    <>
      <Card className={`${className}`} {...props}>
        {/* Header */}
        <div className="flex items-center justify-between p-6 pb-4">
          <div>
            <h3 className="text-lg font-medium text-gray-900">{title}</h3>
            {subtitle && (
              <p className="text-sm text-gray-500 mt-1">{subtitle}</p>
            )}
          </div>
          
          {showControls && (
            <div className="flex items-center space-x-2">
              {/* Time Range Selector */}
              {timeRangeOptions.length > 0 && (
                <Dropdown
                  options={timeRangeOptions}
                  value={selectedTimeRange}
                  onChange={onTimeRangeChange}
                  size="sm"
                  className="min-w-[120px]"
                />
              )}
              
              {/* Export Button */}
              {showExport && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleExport}
                  icon={<ArrowDownTrayIcon className="w-4 h-4" />}
                  disabled={loading || error}
                />
              )}
              
              {/* Settings Button */}
              {showSettings && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSettingsOpen(true)}
                  icon={<Cog6ToothIcon className="w-4 h-4" />}
                />
              )}
              
              {/* Fullscreen Button */}
              {showFullscreen && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsFullscreen(true)}
                  icon={<ArrowsPointingOutIcon className="w-4 h-4" />}
                  disabled={loading || error}
                />
              )}
            </div>
          )}
        </div>
        
        {/* Chart */}
        <div className="px-6 pb-6">
          {renderChart()}
        </div>
      </Card>

      {/* Fullscreen Modal */}
      <Modal
        isOpen={isFullscreen}
        onClose={() => setIsFullscreen(false)}
        title={title}
        size="full"
        closeOnOverlayClick={true}
      >
        <div className="p-6">
          {renderChart(true)}
        </div>
      </Modal>

      {/* Settings Modal */}
      {showSettings && (
        <Modal
          isOpen={settingsOpen}
          onClose={() => setSettingsOpen(false)}
          title="Chart Settings"
          size="md"
        >
          <div className="p-6">
            <p className="text-gray-600">Chart settings will be implemented here.</p>
            {/* Add chart configuration options */}
          </div>
        </Modal>
      )}
    </>
  );
};

export default ChartCard;