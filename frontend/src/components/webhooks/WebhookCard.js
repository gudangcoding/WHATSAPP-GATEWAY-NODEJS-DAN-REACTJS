import { useState } from 'react';
import { 
  LinkIcon,
  PencilIcon,
  TrashIcon,
  EyeIcon,
  PlayIcon,
  PauseIcon,
  ArrowPathIcon,
  ClockIcon,
  CheckCircleIcon,
  XCircleIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';
import Card from '../common/Card';
import Button from '../common/Button';
import { StatusBadge } from '../common/Badge';
import Modal from '../common/Modal';
import WebhookLogsModal from './WebhookLogsModal';
import { formatDistanceToNow } from 'date-fns';

const WebhookCard = ({ 
  webhook, 
  onEdit,
  onDelete,
  onToggle,
  onTest,
  onViewLogs,
  loading = false 
}) => {
  const [detailsModalOpen, setDetailsModalOpen] = useState(false);
  const [logsModalOpen, setLogsModalOpen] = useState(false);

  const handleViewDetails = () => {
    setDetailsModalOpen(true);
  };

  const handleTest = () => {
    if (onTest) {
      onTest(webhook.id);
    }
  };

  const handleViewLogs = () => {
    setLogsModalOpen(true);
  };

  const handleToggle = () => {
    if (onToggle) {
      onToggle(webhook.id);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'active':
        return 'success';
      case 'inactive':
        return 'secondary';
      case 'error':
        return 'danger';
      default:
        return 'secondary';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'active':
        return <CheckCircleIcon className="w-4 h-4" />;
      case 'inactive':
        return <XCircleIcon className="w-4 h-4" />;
      case 'error':
        return <ExclamationTriangleIcon className="w-4 h-4" />;
      default:
        return <XCircleIcon className="w-4 h-4" />;
    }
  };

  const getEventTypeLabel = (events) => {
    if (!events || events.length === 0) return 'No events';
    if (events.length === 1) return events[0];
    if (events.length <= 3) return events.join(', ');
    return `${events.slice(0, 2).join(', ')} +${events.length - 2} more`;
  };

  const truncateUrl = (url, maxLength = 50) => {
    if (!url) return '';
    return url.length > maxLength ? url.substring(0, maxLength) + '...' : url;
  };

  return (
    <>
      <Card className="hover:shadow-md transition-shadow">
        <div className="flex items-start justify-between p-6">
          <div className="flex items-start space-x-4 flex-1">
            <div className="flex-shrink-0">
              <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${
                webhook.is_active ? 'bg-blue-100' : 'bg-gray-100'
              }`}>
                <LinkIcon className={`w-6 h-6 ${
                  webhook.is_active ? 'text-blue-600' : 'text-gray-600'
                }`} />
              </div>
            </div>
            
            <div className="flex-1 min-w-0">
              <h3 className="text-lg font-medium text-gray-900 truncate">
                {webhook.name}
              </h3>
              <p className="text-sm text-gray-500 truncate">
                {webhook.description || 'No description'}
              </p>
              
              <div className="mt-2 flex items-center space-x-4">
                <div className="flex items-center space-x-1">
                  {getStatusIcon(webhook.status)}
                  <StatusBadge status={getStatusColor(webhook.status)}>
                    {webhook.status}
                  </StatusBadge>
                </div>
                
                {webhook.last_triggered_at && (
                  <span className="text-xs text-gray-500">
                    Last triggered: {formatDistanceToNow(new Date(webhook.last_triggered_at), { addSuffix: true })}
                  </span>
                )}
              </div>

              <div className="mt-3 space-y-2">
                <div className="text-sm text-gray-600">
                  <span className="font-medium">URL:</span> {truncateUrl(webhook.url)}
                </div>
                <div className="text-sm text-gray-600">
                  <span className="font-medium">Events:</span> {getEventTypeLabel(webhook.events)}
                </div>
                <div className="text-sm text-gray-600">
                  <span className="font-medium">Method:</span> {webhook.method || 'POST'}
                </div>
              </div>
              
              <div className="flex items-center space-x-4 mt-3 text-xs text-gray-500">
                {webhook.success_count > 0 && (
                  <span className="text-green-600">{webhook.success_count} successful</span>
                )}
                
                {webhook.failure_count > 0 && (
                  <span className="text-red-600">{webhook.failure_count} failed</span>
                )}
                
                <span>
                  Created: {formatDistanceToNow(new Date(webhook.created_at), { addSuffix: true })}
                </span>
              </div>
            </div>
          </div>
          
          <div className="flex items-center space-x-2 ml-4">
            <Button
              size="sm"
              variant="outline"
              onClick={handleViewDetails}
              icon={<EyeIcon className="w-4 h-4" />}
            />
            
            <Button
              size="sm"
              variant="outline"
              onClick={handleTest}
              loading={loading}
              icon={<ArrowPathIcon className="w-4 h-4" />}
            >
              Test
            </Button>
            
            <Button
              size="sm"
              variant={webhook.is_active ? 'warning' : 'success'}
              onClick={handleToggle}
              loading={loading}
              icon={webhook.is_active ? <PauseIcon className="w-4 h-4" /> : <PlayIcon className="w-4 h-4" />}
            >
              {webhook.is_active ? 'Disable' : 'Enable'}
            </Button>
            
            <Button
              size="sm"
              variant="outline"
              onClick={() => onEdit(webhook)}
              icon={<PencilIcon className="w-4 h-4" />}
            />
            
            <Button
              size="sm"
              variant="outline"
              onClick={() => onDelete(webhook.id)}
              loading={loading}
              icon={<TrashIcon className="w-4 h-4" />}
            />
          </div>
        </div>
      </Card>

      {/* Webhook Details Modal */}
      <Modal
        isOpen={detailsModalOpen}
        onClose={() => setDetailsModalOpen(false)}
        title="Webhook Details"
        size="lg"
      >
        <div className="space-y-6 p-6">
          {/* Basic Info */}
          <div>
            <h4 className="text-sm font-medium text-gray-900 mb-3">Basic Information</h4>
            <div className="bg-gray-50 rounded-lg p-4 space-y-3">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="text-sm font-medium text-gray-700">Name:</span>
                  <p className="text-sm text-gray-900">{webhook.name}</p>
                </div>
                <div>
                  <span className="text-sm font-medium text-gray-700">Status:</span>
                  <div className="flex items-center space-x-2 mt-1">
                    {getStatusIcon(webhook.status)}
                    <StatusBadge status={getStatusColor(webhook.status)}>
                      {webhook.status}
                    </StatusBadge>
                  </div>
                </div>
              </div>
              
              {webhook.description && (
                <div>
                  <span className="text-sm font-medium text-gray-700">Description:</span>
                  <p className="text-sm text-gray-900 mt-1">{webhook.description}</p>
                </div>
              )}
            </div>
          </div>

          {/* Webhook Configuration */}
          <div>
            <h4 className="text-sm font-medium text-gray-900 mb-3">Configuration</h4>
            <div className="bg-gray-50 rounded-lg p-4 space-y-3">
              <div>
                <span className="text-sm font-medium text-gray-700">URL:</span>
                <div className="bg-white rounded p-3 border mt-1">
                  <p className="text-sm text-gray-900 font-mono break-all">
                    {webhook.url}
                  </p>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="text-sm font-medium text-gray-700">Method:</span>
                  <p className="text-sm text-gray-900">{webhook.method || 'POST'}</p>
                </div>
                <div>
                  <span className="text-sm font-medium text-gray-700">Timeout:</span>
                  <p className="text-sm text-gray-900">{webhook.timeout || 30}s</p>
                </div>
              </div>
              
              <div>
                <span className="text-sm font-medium text-gray-700">Events:</span>
                <div className="flex flex-wrap gap-2 mt-2">
                  {webhook.events?.map((event, index) => (
                    <span 
                      key={index}
                      className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-blue-100 text-blue-800"
                    >
                      {event}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Headers */}
          {webhook.headers && Object.keys(webhook.headers).length > 0 && (
            <div>
              <h4 className="text-sm font-medium text-gray-900 mb-3">Custom Headers</h4>
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="space-y-2">
                  {Object.entries(webhook.headers).map(([key, value]) => (
                    <div key={key} className="flex justify-between text-sm">
                      <span className="font-medium text-gray-700">{key}:</span>
                      <span className="text-gray-900 font-mono">{value}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Statistics */}
          <div>
            <h4 className="text-sm font-medium text-gray-900 mb-3">Statistics</h4>
            <div className="grid grid-cols-3 gap-4">
              <div className="bg-gray-50 rounded-lg p-3 text-center">
                <div className="text-lg font-semibold text-gray-900">
                  {(webhook.success_count || 0) + (webhook.failure_count || 0)}
                </div>
                <div className="text-xs text-gray-500">Total Calls</div>
              </div>
              
              <div className="bg-green-50 rounded-lg p-3 text-center">
                <div className="text-lg font-semibold text-green-600">
                  {webhook.success_count || 0}
                </div>
                <div className="text-xs text-gray-500">Successful</div>
              </div>
              
              <div className="bg-red-50 rounded-lg p-3 text-center">
                <div className="text-lg font-semibold text-red-600">
                  {webhook.failure_count || 0}
                </div>
                <div className="text-xs text-gray-500">Failed</div>
              </div>
            </div>
            
            {(webhook.success_count || 0) + (webhook.failure_count || 0) > 0 && (
              <div className="mt-3 text-center">
                <span className="text-sm text-gray-600">
                  Success Rate: {(((webhook.success_count || 0) / ((webhook.success_count || 0) + (webhook.failure_count || 0))) * 100).toFixed(1)}%
                </span>
              </div>
            )}
          </div>

          {/* Timestamps */}
          <div>
            <h4 className="text-sm font-medium text-gray-900 mb-3">Timeline</h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Created:</span>
                <span>{new Date(webhook.created_at).toLocaleString()}</span>
              </div>
              {webhook.updated_at && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Updated:</span>
                  <span>{new Date(webhook.updated_at).toLocaleString()}</span>
                </div>
              )}
              {webhook.last_triggered_at && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Last Triggered:</span>
                  <span>{new Date(webhook.last_triggered_at).toLocaleString()}</span>
                </div>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end space-x-3 pt-4 border-t">
            <Button
              variant="outline"
              onClick={handleViewLogs}
              icon={<ClockIcon className="w-4 h-4" />}
            >
              View Logs
            </Button>
            <Button
              variant="outline"
              onClick={handleTest}
              icon={<ArrowPathIcon className="w-4 h-4" />}
            >
              Test Webhook
            </Button>
          </div>
        </div>
      </Modal>

      {/* Webhook Logs Modal */}
      <WebhookLogsModal
        isOpen={logsModalOpen}
        onClose={() => setLogsModalOpen(false)}
        webhookId={webhook.id}
        webhookName={webhook.name}
      />
    </>
  );
};

export default WebhookCard;