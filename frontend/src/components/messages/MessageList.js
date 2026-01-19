import React, { useState, useEffect } from 'react';
import { 
  PlusIcon, 
  MagnifyingGlassIcon,
  FunnelIcon,
  ArrowDownTrayIcon
} from '@heroicons/react/24/outline';
import MessageCard from './MessageCard';
import SendMessageModal from './SendMessageModal';
import Button from '../common/Button';
import Input from '../common/Input';
import Dropdown, { DropdownItem } from '../common/Dropdown';
import Pagination from '../common/Pagination';
import { useAuth } from '../../contexts/AuthContext';
import { PERMISSIONS } from '../../utils/constants/permissions';
import { useMessageSocket } from '../../hooks/useSocket';

const MessageList = ({ 
  messages = [], 
  loading = false,
  pagination = {},
  devices = [],
  contacts = [],
  onSendMessage,
  onRetryMessage,
  onRefresh,
  onPageChange,
  onSearch,
  onFilter,
  onExport
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [sendModalOpen, setSendModalOpen] = useState(false);
  const [filters, setFilters] = useState({
    status: '',
    type: '',
    device_id: '',
    date_range: ''
  });
  const [actionLoading, setActionLoading] = useState({});
  
  const { checkPermission } = useAuth();
  
  const canSendMessage = checkPermission(PERMISSIONS.MESSAGES_SEND);
  const canViewAll = checkPermission(PERMISSIONS.MESSAGES_VIEW_ALL);

  // Subscribe to message status updates
  const { subscribeToMessageStatus, subscribeToIncomingMessages } = useMessageSocket();

  useEffect(() => {
    // Subscribe to message status updates
    const unsubscribeStatus = subscribeToMessageStatus((data) => {
      // Message status updated via socket
      console.log('Message status updated:', data);
    });

    // Subscribe to incoming messages
    const unsubscribeIncoming = subscribeToIncomingMessages((data) => {
      // New message received
      console.log('New message received:', data);
      if (onRefresh) {
        onRefresh();
      }
    });

    return () => {
      unsubscribeStatus();
      unsubscribeIncoming();
    };
  }, [subscribeToMessageStatus, subscribeToIncomingMessages, onRefresh]);

  const handleSearch = (value) => {
    setSearchTerm(value);
    if (onSearch) {
      onSearch(value);
    }
  };

  const handleFilterChange = (key, value) => {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);
    if (onFilter) {
      onFilter(newFilters);
    }
  };

  const handleSendMessage = async (messageData) => {
    setActionLoading(prev => ({ ...prev, send: true }));
    try {
      await onSendMessage(messageData);
    } finally {
      setActionLoading(prev => ({ ...prev, send: false }));
    }
  };

  const handleRetryMessage = async (messageId) => {
    setActionLoading(prev => ({ ...prev, [messageId]: true }));
    try {
      await onRetryMessage(messageId);
    } finally {
      setActionLoading(prev => ({ ...prev, [messageId]: false }));
    }
  };

  const getStatusCounts = () => {
    const counts = {
      sent: 0,
      delivered: 0,
      read: 0,
      failed: 0,
      pending: 0
    };
    
    messages.forEach(message => {
      if (counts.hasOwnProperty(message.status)) {
        counts[message.status]++;
      }
    });
    
    return counts;
  };

  const statusCounts = getStatusCounts();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Messages</h1>
          <p className="text-gray-600">
            Send and manage WhatsApp messages
          </p>
        </div>
        
        <div className="flex items-center space-x-3">
          {onExport && (
            <Button
              variant="outline"
              onClick={onExport}
              icon={<ArrowDownTrayIcon className="w-4 h-4" />}
            >
              Export
            </Button>
          )}
          
          {canSendMessage && (
            <Button
              onClick={() => setSendModalOpen(true)}
              icon={<PlusIcon className="w-4 h-4" />}
            >
              Send Message
            </Button>
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center">
            <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
            <span className="text-sm text-gray-600">Sent</span>
          </div>
          <div className="text-2xl font-bold text-gray-900 mt-1">
            {statusCounts.sent}
          </div>
        </div>
        
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center">
            <div className="w-2 h-2 bg-blue-500 rounded-full mr-2"></div>
            <span className="text-sm text-gray-600">Delivered</span>
          </div>
          <div className="text-2xl font-bold text-gray-900 mt-1">
            {statusCounts.delivered}
          </div>
        </div>
        
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center">
            <div className="w-2 h-2 bg-purple-500 rounded-full mr-2"></div>
            <span className="text-sm text-gray-600">Read</span>
          </div>
          <div className="text-2xl font-bold text-gray-900 mt-1">
            {statusCounts.read}
          </div>
        </div>
        
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center">
            <div className="w-2 h-2 bg-red-500 rounded-full mr-2"></div>
            <span className="text-sm text-gray-600">Failed</span>
          </div>
          <div className="text-2xl font-bold text-gray-900 mt-1">
            {statusCounts.failed}
          </div>
        </div>
        
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center">
            <div className="w-2 h-2 bg-yellow-500 rounded-full mr-2"></div>
            <span className="text-sm text-gray-600">Pending</span>
          </div>
          <div className="text-2xl font-bold text-gray-900 mt-1">
            {statusCounts.pending}
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <Input
            placeholder="Search messages by recipient or content..."
            value={searchTerm}
            onChange={(e) => handleSearch(e.target.value)}
            startIcon={<MagnifyingGlassIcon className="w-4 h-4" />}
          />
        </div>
        
        <div className="flex items-center space-x-3">
          {/* Status Filter */}
          <Dropdown
            align="right"
            trigger={
              <Button
                variant="outline"
                icon={<FunnelIcon className="w-4 h-4" />}
              >
                Status
              </Button>
            }
          >
            <DropdownItem onClick={() => handleFilterChange('status', '')}>
              All Status
            </DropdownItem>
            <DropdownItem onClick={() => handleFilterChange('status', 'sent')}>
              Sent
            </DropdownItem>
            <DropdownItem onClick={() => handleFilterChange('status', 'delivered')}>
              Delivered
            </DropdownItem>
            <DropdownItem onClick={() => handleFilterChange('status', 'read')}>
              Read
            </DropdownItem>
            <DropdownItem onClick={() => handleFilterChange('status', 'failed')}>
              Failed
            </DropdownItem>
            <DropdownItem onClick={() => handleFilterChange('status', 'pending')}>
              Pending
            </DropdownItem>
          </Dropdown>

          {/* Type Filter */}
          <Dropdown
            align="right"
            trigger={
              <Button
                variant="outline"
                icon={<FunnelIcon className="w-4 h-4" />}
              >
                Type
              </Button>
            }
          >
            <DropdownItem onClick={() => handleFilterChange('type', '')}>
              All Types
            </DropdownItem>
            <DropdownItem onClick={() => handleFilterChange('type', 'text')}>
              Text
            </DropdownItem>
            <DropdownItem onClick={() => handleFilterChange('type', 'image')}>
              Image
            </DropdownItem>
            <DropdownItem onClick={() => handleFilterChange('type', 'video')}>
              Video
            </DropdownItem>
            <DropdownItem onClick={() => handleFilterChange('type', 'document')}>
              Document
            </DropdownItem>
            <DropdownItem onClick={() => handleFilterChange('type', 'location')}>
              Location
            </DropdownItem>
          </Dropdown>

          <Button
            variant="outline"
            onClick={onRefresh}
            loading={loading}
          >
            Refresh
          </Button>
        </div>
      </div>

      {/* Message List */}
      {loading ? (
        <div className="space-y-4">
          {[...Array(5)].map((_, index) => (
            <div key={index} className="animate-pulse">
              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <div className="flex items-start space-x-3">
                  <div className="w-10 h-10 bg-gray-200 rounded-lg"></div>
                  <div className="flex-1">
                    <div className="h-4 bg-gray-200 rounded w-1/4 mb-2"></div>
                    <div className="h-3 bg-gray-200 rounded w-3/4 mb-2"></div>
                    <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : messages.length === 0 ? (
        <div className="text-center py-12">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            {searchTerm ? 'No messages found' : 'No messages yet'}
          </h3>
          <p className="text-gray-500 mb-6">
            {searchTerm 
              ? 'Try adjusting your search terms or filters'
              : 'Send your first WhatsApp message to get started'
            }
          </p>
          {canSendMessage && !searchTerm && (
            <Button
              onClick={() => setSendModalOpen(true)}
              icon={<PlusIcon className="w-4 h-4" />}
            >
              Send First Message
            </Button>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {messages.map((message) => (
            <MessageCard
              key={message.id}
              message={message}
              onRetry={handleRetryMessage}
              loading={actionLoading[message.id]}
            />
          ))}
        </div>
      )}

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <Pagination
          currentPage={pagination.currentPage}
          totalPages={pagination.totalPages}
          totalItems={pagination.totalItems}
          itemsPerPage={pagination.itemsPerPage}
          onPageChange={onPageChange}
          showInfo={true}
        />
      )}

      {/* Send Message Modal */}
      <SendMessageModal
        isOpen={sendModalOpen}
        onClose={() => setSendModalOpen(false)}
        onSubmit={handleSendMessage}
        devices={devices}
        contacts={contacts}
        loading={actionLoading.send}
      />
    </div>
  );
};

export default MessageList;