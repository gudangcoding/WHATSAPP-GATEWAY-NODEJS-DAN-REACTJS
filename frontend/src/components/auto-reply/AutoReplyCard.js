import React, { useState } from 'react';
import { 
  ArrowPathIcon,
  PlayIcon,
  PauseIcon,
  PencilIcon,
  TrashIcon,
  EyeIcon,
  CheckCircleIcon,
  XCircleIcon
} from '@heroicons/react/24/outline';
import Card from '../common/Card';
import Button from '../common/Button';
import { StatusBadge } from '../common/Badge';
import Modal from '../common/Modal';
import { formatDistanceToNow } from 'date-fns';
import { id } from 'date-fns/locale';

const AutoReplyCard = ({ 
  autoReply, 
  onToggle,
  onEdit,
  onDelete,
  onTest,
  onViewDetails,
  loading = false 
}) => {
  const [detailsModalOpen, setDetailsModalOpen] = useState(false);

  const handleViewDetails = () => {
    setDetailsModalOpen(true);
    if (onViewDetails) {
      onViewDetails(autoReply.id);
    }
  };

  const getStatusIcon = (isActive) => {
    return isActive ? <CheckCircleIcon className="w-4 h-4" /> : <XCircleIcon className="w-4 h-4" />;
  };

  const getTriggerTypeLabel = (type) => {
    switch (type) {
      case 'keyword':
        return 'Keyword Match';
      case 'contains':
        return 'Contains Text';
      case 'starts_with':
        return 'Starts With';
      case 'ends_with':
        return 'Ends With';
      case 'exact':
        return 'Exact Match';
      case 'regex':
        return 'Regular Expression';
      default:
        return 'Unknown';
    }
  };

  const truncateText = (text, maxLength = 100) => {
    if (!text) return '';
    return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
  };

  return (
    <>
      <Card className="hover:shadow-md transition-shadow">
        <div className="flex items-start justify-between">
          <div className="flex items-start space-x-3 flex-1">
            <div className="flex-shrink-0">
              <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${
                autoReply.is_active ? 'bg-green-100' : 'bg-gray-100'
              }`}>
                <ArrowPathIcon className={`w-6 h-6 ${
                  autoReply.is_active ? 'text-green-600' : 'text-gray-600'
                }`} />
              </div>
            </div>
            
            <div className="flex-1 min-w-0">
              <h3 className="text-lg font-medium text-gray-900 truncate">
                {autoReply.name}
              </h3>
              <p className="text-sm text-gray-500 truncate">
                {autoReply.description || 'No description'}
              </p>
              
              <div className="mt-2 flex items-center space-x-4">
                <div className="flex items-center space-x-1">
                  {getStatusIcon(autoReply.is_active)}
                  <StatusBadge status={autoReply.is_active ? 'active' : 'inactive'} />
                </div>
                
                <span className="text-xs text-gray-500">
                  Priority: {autoReply.priority || 1}
                </span>
              </div>

              <div className="mt-2 space-y-1">
                <div className="text-sm text-gray-600">
                  <span className="font-medium">Trigger:</span> {getTriggerTypeLabel(autoReply.trigger_type)}
                </div>
                <div className="text-sm text-gray-600">
                  <span className="font-medium">Keywords:</span> {autoReply.keywords || 'None'}
                </div>
                <div className="text-sm text-gray-600">
                  <span className="font-medium">Reply:</span> {truncateText(autoReply.reply_message)}
                </div>
              </div>
              
              <div className="flex items-center space-x-4 mt-3 text-xs text-gray-500">
                {autoReply.triggered_count > 0 && (
                  <span>{autoReply.triggered_count} triggers</span>
                )}
                
                {autoReply.last_triggered_at && (
                  <span>
                    Last triggered: {formatDistanceToNow(new Date(autoReply.last_triggered_at), { 
                      addSuffix: true,
                      locale: id 
                    })}
                  </span>
                )}
                
                <span>
                  Created: {formatDistanceToNow(new Date(autoReply.created_at), { 
                    addSuffix: true,
                    locale: id 
                  })}
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
              variant={autoReply.is_active ? 'warning' : 'success'}
              onClick={() => onToggle(autoReply.id)}
              loading={loading}
              icon={autoReply.is_active ? <PauseIcon className="w-4 h-4" /> : <PlayIcon className="w-4 h-4" />}
            >
              {autoReply.is_active ? 'Disable' : 'Enable'}
            </Button>
            
            <Button
              size="sm"
              variant="outline"
              onClick={() => onEdit(autoReply)}
              icon={<PencilIcon className="w-4 h-4" />}
            />
            
            <Button
              size="sm"
              variant="outline"
              onClick={() => onDelete(autoReply.id)}
              loading={loading}
              icon={<TrashIcon className="w-4 h-4" />}
            />
          </div>
        </div>
      </Card>

      {/* Auto Reply Details Modal */}
      <Modal
        isOpen={detailsModalOpen}
        onClose={() => setDetailsModalOpen(false)}
        title="Auto Reply Details"
        size="lg"
      >
        <div className="space-y-6">
          {/* Basic Info */}
          <div>
            <h4 className="text-sm font-medium text-gray-900 mb-3">Basic Information</h4>
            <div className="bg-gray-50 rounded-lg p-4 space-y-3">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="text-sm font-medium text-gray-700">Name:</span>
                  <p className="text-sm text-gray-900">{autoReply.name}</p>
                </div>
                <div>
                  <span className="text-sm font-medium text-gray-700">Status:</span>
                  <div className="flex items-center space-x-2 mt-1">
                    {getStatusIcon(autoReply.is_active)}
                    <StatusBadge status={autoReply.is_active ? 'active' : 'inactive'} />
                  </div>
                </div>
              </div>
              
              {autoReply.description && (
                <div>
                  <span className="text-sm font-medium text-gray-700">Description:</span>
                  <p className="text-sm text-gray-900 mt-1">{autoReply.description}</p>
                </div>
              )}
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="text-sm font-medium text-gray-700">Priority:</span>
                  <p className="text-sm text-gray-900">{autoReply.priority || 1}</p>
                </div>
                <div>
                  <span className="text-sm font-medium text-gray-700">Device:</span>
                  <p className="text-sm text-gray-900">{autoReply.device_name || 'All devices'}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Trigger Configuration */}
          <div>
            <h4 className="text-sm font-medium text-gray-900 mb-3">Trigger Configuration</h4>
            <div className="bg-gray-50 rounded-lg p-4 space-y-3">
              <div>
                <span className="text-sm font-medium text-gray-700">Trigger Type:</span>
                <p className="text-sm text-gray-900">{getTriggerTypeLabel(autoReply.trigger_type)}</p>
              </div>
              
              <div>
                <span className="text-sm font-medium text-gray-700">Keywords/Pattern:</span>
                <div className="bg-white rounded p-3 border mt-1">
                  <p className="text-sm text-gray-900 font-mono">
                    {autoReply.keywords || autoReply.pattern || 'None'}
                  </p>
                </div>
              </div>
              
              {autoReply.case_sensitive !== undefined && (
                <div className="flex items-center">
                  <span className="text-sm font-medium text-gray-700 mr-2">Case Sensitive:</span>
                  <span className="text-sm text-gray-900">
                    {autoReply.case_sensitive ? 'Yes' : 'No'}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Reply Message */}
          <div>
            <h4 className="text-sm font-medium text-gray-900 mb-3">Reply Message</h4>
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="text-sm font-medium text-gray-700 mb-2">Message Type: 
                <span className="capitalize ml-1">{autoReply.reply_type || 'text'}</span>
              </div>
              <div className="bg-white rounded p-3 border">
                <p className="text-sm text-gray-900 whitespace-pre-wrap">
                  {autoReply.reply_message}
                </p>
                {autoReply.media_url && (
                  <div className="mt-2">
                    <a 
                      href={autoReply.media_url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:text-blue-800 text-sm"
                    >
                      View Media
                    </a>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Statistics */}
          <div>
            <h4 className="text-sm font-medium text-gray-900 mb-3">Statistics</h4>
            <div className="grid grid-cols-3 gap-4">
              <div className="bg-gray-50 rounded-lg p-3 text-center">
                <div className="text-lg font-semibold text-gray-900">
                  {autoReply.triggered_count || 0}
                </div>
                <div className="text-xs text-gray-500">Total Triggers</div>
              </div>
              
              <div className="bg-green-50 rounded-lg p-3 text-center">
                <div className="text-lg font-semibold text-green-600">
                  {autoReply.success_count || 0}
                </div>
                <div className="text-xs text-gray-500">Successful</div>
              </div>
              
              <div className="bg-red-50 rounded-lg p-3 text-center">
                <div className="text-lg font-semibold text-red-600">
                  {autoReply.failed_count || 0}
                </div>
                <div className="text-xs text-gray-500">Failed</div>
              </div>
            </div>
          </div>

          {/* Conditions */}
          {autoReply.conditions && autoReply.conditions.length > 0 && (
            <div>
              <h4 className="text-sm font-medium text-gray-900 mb-3">Additional Conditions</h4>
              <div className="bg-gray-50 rounded-lg p-4">
                <ul className="space-y-2">
                  {autoReply.conditions.map((condition, index) => (
                    <li key={index} className="text-sm text-gray-700">
                      • {condition.description || `${condition.field} ${condition.operator} ${condition.value}`}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}

          {/* Timestamps */}
          <div>
            <h4 className="text-sm font-medium text-gray-900 mb-3">Timeline</h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Created:</span>
                <span>{new Date(autoReply.created_at).toLocaleString()}</span>
              </div>
              {autoReply.updated_at && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Updated:</span>
                  <span>{new Date(autoReply.updated_at).toLocaleString()}</span>
                </div>
              )}
              {autoReply.last_triggered_at && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Last Triggered:</span>
                  <span>{new Date(autoReply.last_triggered_at).toLocaleString()}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </Modal>
    </>
  );
};

export default AutoReplyCard;