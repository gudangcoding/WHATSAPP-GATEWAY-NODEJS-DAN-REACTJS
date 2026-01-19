import React, { useState } from 'react';
import { 
  ChatBubbleLeftRightIcon,
  CheckIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  ArrowPathIcon,
  EyeIcon,
  DocumentIcon,
  PhotoIcon,
  VideoCameraIcon,
  MapPinIcon
} from '@heroicons/react/24/outline';
import Card from '../common/Card';
import Button from '../common/Button';
import { StatusBadge } from '../common/Badge';
import Modal from '../common/Modal';
import { formatDistanceToNow } from 'date-fns';
import { id } from 'date-fns/locale';

const MessageCard = ({ 
  message, 
  onRetry, 
  onViewDetails,
  loading = false 
}) => {
  const [detailsModalOpen, setDetailsModalOpen] = useState(false);

  const getStatusIcon = (status) => {
    switch (status) {
      case 'sent':
        return <CheckIcon className="w-4 h-4" />;
      case 'delivered':
        return <CheckCircleIcon className="w-4 h-4" />;
      case 'read':
        return <CheckCircleIcon className="w-4 h-4 text-blue-500" />;
      case 'failed':
        return <XCircleIcon className="w-4 h-4" />;
      case 'pending':
        return <ClockIcon className="w-4 h-4" />;
      default:
        return <ChatBubbleLeftRightIcon className="w-4 h-4" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'sent':
      case 'delivered':
        return 'success';
      case 'read':
        return 'info';
      case 'failed':
        return 'danger';
      case 'pending':
        return 'warning';
      default:
        return 'secondary';
    }
  };

  const getMessageTypeIcon = (type) => {
    switch (type) {
      case 'image':
        return <PhotoIcon className="w-4 h-4" />;
      case 'video':
        return <VideoCameraIcon className="w-4 h-4" />;
      case 'document':
        return <DocumentIcon className="w-4 h-4" />;
      case 'location':
        return <MapPinIcon className="w-4 h-4" />;
      default:
        return <ChatBubbleLeftRightIcon className="w-4 h-4" />;
    }
  };

  const truncateMessage = (text, maxLength = 100) => {
    if (!text) return '';
    return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
  };

  const handleViewDetails = () => {
    setDetailsModalOpen(true);
    if (onViewDetails) {
      onViewDetails(message.id);
    }
  };

  const canRetry = message.status === 'failed' && !loading;

  return (
    <>
      <Card className="hover:shadow-md transition-shadow">
        <div className="flex items-start justify-between">
          <div className="flex items-start space-x-3 flex-1">
            <div className="flex-shrink-0">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                {getMessageTypeIcon(message.type)}
              </div>
            </div>
            
            <div className="flex-1 min-w-0">
              <div className="flex items-center space-x-2 mb-1">
                <h4 className="text-sm font-medium text-gray-900 truncate">
                  {message.recipient_name || message.recipient}
                </h4>
                <span className="text-xs text-gray-500">
                  {message.recipient}
                </span>
              </div>
              
              <p className="text-sm text-gray-600 mb-2">
                {truncateMessage(message.content)}
              </p>
              
              <div className="flex items-center space-x-4 text-xs text-gray-500">
                <div className="flex items-center space-x-1">
                  {getStatusIcon(message.status)}
                  <StatusBadge status={message.status} />
                </div>
                
                <span>
                  {formatDistanceToNow(new Date(message.created_at), { 
                    addSuffix: true,
                    locale: id 
                  })}
                </span>
                
                {message.device_name && (
                  <span>via {message.device_name}</span>
                )}
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
            
            {canRetry && (
              <Button
                size="sm"
                variant="warning"
                onClick={() => onRetry(message.id)}
                loading={loading}
                icon={<ArrowPathIcon className="w-4 h-4" />}
              >
                Retry
              </Button>
            )}
          </div>
        </div>
        
        {/* Message metadata */}
        {(message.campaign_name || message.auto_reply_name) && (
          <div className="mt-3 pt-3 border-t border-gray-200">
            <div className="flex items-center space-x-4 text-xs text-gray-500">
              {message.campaign_name && (
                <span>Campaign: {message.campaign_name}</span>
              )}
              {message.auto_reply_name && (
                <span>Auto Reply: {message.auto_reply_name}</span>
              )}
            </div>
          </div>
        )}
      </Card>

      {/* Message Details Modal */}
      <Modal
        isOpen={detailsModalOpen}
        onClose={() => setDetailsModalOpen(false)}
        title="Message Details"
        size="lg"
      >
        <div className="space-y-4">
          {/* Recipient Info */}
          <div>
            <h4 className="text-sm font-medium text-gray-900 mb-2">Recipient</h4>
            <div className="bg-gray-50 rounded-lg p-3">
              <p className="text-sm font-medium">{message.recipient_name || 'Unknown'}</p>
              <p className="text-sm text-gray-600">{message.recipient}</p>
            </div>
          </div>

          {/* Message Content */}
          <div>
            <h4 className="text-sm font-medium text-gray-900 mb-2">Content</h4>
            <div className="bg-gray-50 rounded-lg p-3">
              <div className="flex items-center space-x-2 mb-2">
                {getMessageTypeIcon(message.type)}
                <span className="text-sm font-medium capitalize">{message.type} Message</span>
              </div>
              <p className="text-sm text-gray-700 whitespace-pre-wrap">
                {message.content}
              </p>
              {message.media_url && (
                <div className="mt-2">
                  <a 
                    href={message.media_url} 
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

          {/* Status & Timing */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <h4 className="text-sm font-medium text-gray-900 mb-2">Status</h4>
              <div className="flex items-center space-x-2">
                {getStatusIcon(message.status)}
                <StatusBadge status={message.status} />
              </div>
            </div>
            
            <div>
              <h4 className="text-sm font-medium text-gray-900 mb-2">Device</h4>
              <p className="text-sm text-gray-600">{message.device_name || 'Unknown'}</p>
            </div>
          </div>

          {/* Timestamps */}
          <div>
            <h4 className="text-sm font-medium text-gray-900 mb-2">Timeline</h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Created:</span>
                <span>{new Date(message.created_at).toLocaleString()}</span>
              </div>
              {message.sent_at && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Sent:</span>
                  <span>{new Date(message.sent_at).toLocaleString()}</span>
                </div>
              )}
              {message.delivered_at && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Delivered:</span>
                  <span>{new Date(message.delivered_at).toLocaleString()}</span>
                </div>
              )}
              {message.read_at && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Read:</span>
                  <span>{new Date(message.read_at).toLocaleString()}</span>
                </div>
              )}
            </div>
          </div>

          {/* Error Details */}
          {message.status === 'failed' && message.error_message && (
            <div>
              <h4 className="text-sm font-medium text-gray-900 mb-2">Error Details</h4>
              <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                <p className="text-sm text-red-700">{message.error_message}</p>
              </div>
            </div>
          )}
        </div>
      </Modal>
    </>
  );
};

export default MessageCard;