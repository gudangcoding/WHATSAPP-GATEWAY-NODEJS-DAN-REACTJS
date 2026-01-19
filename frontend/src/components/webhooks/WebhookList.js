import { useState, useEffect, useCallback } from 'react';
import { 
  PlusIcon,
  MagnifyingGlassIcon,
  ArrowPathIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';
import WebhookCard from './WebhookCard';
import CreateWebhookModal from './CreateWebhookModal';
import WebhookLogsModal from './WebhookLogsModal';
import Button from '../common/Button';
import Input from '../common/Input';
import Dropdown from '../common/Dropdown';
import Pagination from '../common/Pagination';
import LoadingSpinner from '../common/LoadingSpinner';
import Alert from '../common/Alert';
import { useSocket } from '../../hooks/useSocket';
import { webhooksAPI } from '../../services/api';

const WebhookList = ({ 
  className = '',
  showHeader = true,
  showFilters = true,
  showPagination = true,
  limit = 10,
  onWebhookSelect = null
}) => {
  const [webhooks, setWebhooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [eventFilter, setEventFilter] = useState('');
  const [sortBy, setSortBy] = useState('created_at');
  const [sortOrder, setSortOrder] = useState('desc');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [editingWebhook, setEditingWebhook] = useState(null);
  const [actionLoading, setActionLoading] = useState({});
  const [logsModalOpen, setLogsModalOpen] = useState(false);
  const [selectedWebhookForLogs, setSelectedWebhookForLogs] = useState(null);

  const { on, off } = useSocket();

  // Load webhooks
  const loadWebhooks = useCallback(async (page = 1) => {
    try {
      setLoading(true);
      setError('');

      const params = {
        page,
        limit,
        search: searchTerm,
        status: statusFilter,
        event: eventFilter,
        sort_by: sortBy,
        sort_order: sortOrder
      };

      const response = await webhooksAPI.getAll(params);
      
      setWebhooks(response.data.data || []);
      setCurrentPage(response.data.pagination?.page || 1);
      setTotalPages(response.data.pagination?.pages || 1);
      setTotalCount(response.data.pagination?.total || 0);
    } catch (err) {
      console.error('Failed to load webhooks:', err);
      setError('Failed to load webhooks. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [searchTerm, statusFilter, eventFilter, sortBy, sortOrder, limit]);

  // Initial load
  useEffect(() => {
    loadWebhooks();
  }, [loadWebhooks]);

  // Socket event handlers
  useEffect(() => {
    const handleWebhookUpdate = (data) => {
      setWebhooks(prev => 
        prev.map(webhook => 
          webhook.id === data.id ? { ...webhook, ...data } : webhook
        )
      );
    };

    const handleWebhookCreated = (data) => {
      setWebhooks(prev => [data, ...prev]);
      setTotalCount(prev => prev + 1);
    };

    const handleWebhookDeleted = (data) => {
      setWebhooks(prev => prev.filter(webhook => webhook.id !== data.id));
      setTotalCount(prev => prev - 1);
    };

    const handleWebhookTriggered = (data) => {
      setWebhooks(prev => 
        prev.map(webhook => 
          webhook.id === data.webhook_id 
            ? { 
                ...webhook, 
                last_triggered_at: data.triggered_at,
                success_count: data.success ? (webhook.success_count || 0) + 1 : webhook.success_count,
                failure_count: !data.success ? (webhook.failure_count || 0) + 1 : webhook.failure_count
              }
            : webhook
        )
      );
    };

    on('webhook:updated', handleWebhookUpdate);
    on('webhook:created', handleWebhookCreated);
    on('webhook:deleted', handleWebhookDeleted);
    on('webhook:triggered', handleWebhookTriggered);

    return () => {
      off('webhook:updated', handleWebhookUpdate);
      off('webhook:created', handleWebhookCreated);
      off('webhook:deleted', handleWebhookDeleted);
      off('webhook:triggered', handleWebhookTriggered);
    };
  }, [on, off]);

  // Handle search
  const handleSearch = useCallback((value) => {
    setSearchTerm(value);
    setCurrentPage(1);
  }, []);

  // Handle filter changes
  const handleFilterChange = useCallback((filterType, value) => {
    switch (filterType) {
      case 'status':
        setStatusFilter(value);
        break;
      case 'event':
        setEventFilter(value);
        break;
      case 'sort':
        const [field, order] = value.split(':');
        setSortBy(field);
        setSortOrder(order);
        break;
      default:
        break;
    }
    setCurrentPage(1);
  }, []);

  // Handle webhook actions
  const handleToggleWebhook = async (id) => {
    try {
      setActionLoading(prev => ({ ...prev, [id]: true }));
      await webhooksAPI.toggle(id);
      
      // Update local state
      setWebhooks(prev => 
        prev.map(webhook => 
          webhook.id === id 
            ? { ...webhook, is_active: !webhook.is_active }
            : webhook
        )
      );
    } catch (err) {
      console.error('Failed to toggle webhook:', err);
      setError('Failed to toggle webhook. Please try again.');
    } finally {
      setActionLoading(prev => ({ ...prev, [id]: false }));
    }
  };

  const handleEditWebhook = (webhook) => {
    setEditingWebhook(webhook);
    setCreateModalOpen(true);
  };

  const handleDeleteWebhook = async (id) => {
    if (!window.confirm('Are you sure you want to delete this webhook?')) {
      return;
    }

    try {
      setActionLoading(prev => ({ ...prev, [id]: true }));
      await webhooksAPI.delete(id);
      
      // Remove from local state
      setWebhooks(prev => prev.filter(webhook => webhook.id !== id));
      setTotalCount(prev => prev - 1);
    } catch (err) {
      console.error('Failed to delete webhook:', err);
      setError('Failed to delete webhook. Please try again.');
    } finally {
      setActionLoading(prev => ({ ...prev, [id]: false }));
    }
  };

  const handleTestWebhook = async (id) => {
    try {
      setActionLoading(prev => ({ ...prev, [`test_${id}`]: true }));
      
      const response = await webhooksAPI.test(id);
      
      if (response.data.success) {
        alert(`✅ Webhook test successful!\n\nResponse: ${response.data.status_code} ${response.data.status_text}`);
      } else {
        alert(`❌ Webhook test failed!\n\nError: ${response.data.error}`);
      }
    } catch (err) {
      console.error('Failed to test webhook:', err);
      alert(`❌ Webhook test failed!\n\nError: ${err.message}`);
    } finally {
      setActionLoading(prev => ({ ...prev, [`test_${id}`]: false }));
    }
  };

  const handleViewLogs = (id) => {
    const webhook = webhooks.find(w => w.id === id);
    if (webhook) {
      setSelectedWebhookForLogs(webhook);
      setLogsModalOpen(true);
    }
  };

  // Handle create/update webhook
  const handleSubmitWebhook = async (webhookData) => {
    try {
      if (editingWebhook) {
        const response = await webhooksAPI.update(editingWebhook.id, webhookData);
        
        // Update local state
        setWebhooks(prev => 
          prev.map(webhook => 
            webhook.id === editingWebhook.id ? response.data : webhook
          )
        );
      } else {
        const response = await webhooksAPI.create(webhookData);
        
        // Add to local state
        setWebhooks(prev => [response.data, ...prev]);
        setTotalCount(prev => prev + 1);
      }
    } catch (err) {
      console.error('Failed to save webhook:', err);
      throw new Error('Failed to save webhook. Please try again.');
    }
  };

  const handleCloseModal = () => {
    setCreateModalOpen(false);
    setEditingWebhook(null);
  };

  // Filter options
  const statusOptions = [
    { value: '', label: 'All Status' },
    { value: 'active', label: 'Active' },
    { value: 'inactive', label: 'Inactive' },
    { value: 'error', label: 'Error' }
  ];

  const eventOptions = [
    { value: '', label: 'All Events' },
    { value: 'message.received', label: 'Message Received' },
    { value: 'message.sent', label: 'Message Sent' },
    { value: 'message.delivered', label: 'Message Delivered' },
    { value: 'device.connected', label: 'Device Connected' },
    { value: 'device.disconnected', label: 'Device Disconnected' },
    { value: 'campaign.started', label: 'Campaign Started' },
    { value: 'campaign.completed', label: 'Campaign Completed' }
  ];

  const sortOptions = [
    { value: 'created_at:desc', label: 'Newest First' },
    { value: 'created_at:asc', label: 'Oldest First' },
    { value: 'name:asc', label: 'Name A-Z' },
    { value: 'name:desc', label: 'Name Z-A' },
    { value: 'last_triggered_at:desc', label: 'Recently Triggered' },
    { value: 'success_count:desc', label: 'Most Successful' }
  ];

  if (loading && webhooks.length === 0) {
    return (
      <div className="flex items-center justify-center py-12">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className={className}>
      {/* Header */}
      {showHeader && (
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Webhooks</h2>
            <p className="text-gray-600 mt-1">
              Manage webhook endpoints for real-time event notifications
            </p>
          </div>
          
          <Button
            onClick={() => setCreateModalOpen(true)}
            icon={<PlusIcon className="w-4 h-4" />}
          >
            Create Webhook
          </Button>
        </div>
      )}

      {/* Error Alert */}
      {error && (
        <Alert 
          variant="danger" 
          className="mb-6"
          dismissible 
          onDismiss={() => setError('')}
        >
          {error}
        </Alert>
      )}

      {/* Filters */}
      {showFilters && (
        <div className="bg-white rounded-lg border border-gray-200 p-4 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Input
              placeholder="Search webhooks..."
              value={searchTerm}
              onChange={(e) => handleSearch(e.target.value)}
              icon={<MagnifyingGlassIcon className="w-4 h-4" />}
            />
            
            <Dropdown
              options={statusOptions}
              value={statusFilter}
              onChange={(value) => handleFilterChange('status', value)}
              placeholder="Filter by status"
            />
            
            <Dropdown
              options={eventOptions}
              value={eventFilter}
              onChange={(value) => handleFilterChange('event', value)}
              placeholder="Filter by event"
            />
            
            <Dropdown
              options={sortOptions}
              value={`${sortBy}:${sortOrder}`}
              onChange={(value) => handleFilterChange('sort', value)}
              placeholder="Sort by"
            />
          </div>
          
          <div className="flex items-center justify-between mt-4">
            <div className="text-sm text-gray-600">
              {totalCount} webhook{totalCount === 1 ? '' : 's'} found
            </div>
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => loadWebhooks(currentPage)}
              loading={loading}
              icon={<ArrowPathIcon className="w-4 h-4" />}
            >
              Refresh
            </Button>
          </div>
        </div>
      )}

      {/* Webhook List */}
      {webhooks.length === 0 ? (
        <div className="text-center py-12">
          <ExclamationTriangleIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No webhooks found</h3>
          <p className="text-gray-600 mb-6">
            {searchTerm || statusFilter || eventFilter
              ? 'Try adjusting your filters to see more results.'
              : 'Create your first webhook to receive real-time event notifications.'
            }
          </p>
          {!searchTerm && !statusFilter && !eventFilter && (
            <Button
              onClick={() => setCreateModalOpen(true)}
              icon={<PlusIcon className="w-4 h-4" />}
            >
              Create Webhook
            </Button>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {webhooks.map((webhook) => (
            <WebhookCard
              key={webhook.id}
              webhook={webhook}
              onToggle={handleToggleWebhook}
              onEdit={handleEditWebhook}
              onDelete={handleDeleteWebhook}
              onTest={handleTestWebhook}
              onViewLogs={handleViewLogs}
              loading={actionLoading[webhook.id]}
            />
          ))}
        </div>
      )}

      {/* Pagination */}
      {showPagination && totalPages > 1 && (
        <div className="mt-6">
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={(page) => {
              setCurrentPage(page);
              loadWebhooks(page);
            }}
            showInfo
            totalItems={totalCount}
            itemsPerPage={limit}
          />
        </div>
      )}

      {/* Create/Edit Modal */}
      <CreateWebhookModal
        isOpen={createModalOpen}
        onClose={handleCloseModal}
        onSubmit={handleSubmitWebhook}
        webhook={editingWebhook}
        loading={actionLoading.modal}
      />

      {/* Webhook Logs Modal */}
      {selectedWebhookForLogs && (
        <WebhookLogsModal
          isOpen={logsModalOpen}
          onClose={() => {
            setLogsModalOpen(false);
            setSelectedWebhookForLogs(null);
          }}
          webhookId={selectedWebhookForLogs.id}
          webhookName={selectedWebhookForLogs.name}
        />
      )}
    </div>
  );
};

export default WebhookList;