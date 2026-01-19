import React, { useState, useEffect, useCallback } from 'react';
import { 
  PlusIcon,
  MagnifyingGlassIcon,
  ArrowPathIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';
import AutoReplyCard from './AutoReplyCard';
import CreateAutoReplyModal from './CreateAutoReplyModal';
import Button from '../common/Button';
import Input from '../common/Input';
import Dropdown from '../common/Dropdown';
import Pagination from '../common/Pagination';
import LoadingSpinner from '../common/LoadingSpinner';
import Alert from '../common/Alert';
import { useSocket } from '../../hooks/useSocket';
import { autoReplyAPI, devicesAPI } from '../../services/api';

const AutoReplyList = ({ 
  className = '',
  showHeader = true,
  showFilters = true,
  showPagination = true,
  limit = 10,
  onAutoReplySelect = null
}) => {
  const [autoReplies, setAutoReplies] = useState([]);
  const [devices, setDevices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDevice, setSelectedDevice] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [sortBy, setSortBy] = useState('created_at');
  const [sortOrder, setSortOrder] = useState('desc');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [editingAutoReply, setEditingAutoReply] = useState(null);
  const [actionLoading, setActionLoading] = useState({});

  const { on, off } = useSocket();

  // Load auto replies
  const loadAutoReplies = useCallback(async (page = 1) => {
    try {
      setLoading(true);
      setError('');

      const params = {
        page,
        limit,
        search: searchTerm,
        device_id: selectedDevice,
        status: statusFilter,
        sort_by: sortBy,
        sort_order: sortOrder
      };

      const response = await autoReplyAPI.getAll(params);
      
      setAutoReplies(response.data.data || []);
      setCurrentPage(response.data.pagination?.page || 1);
      setTotalPages(response.data.pagination?.pages || 1);
      setTotalCount(response.data.pagination?.total || 0);
    } catch (err) {
      console.error('Failed to load auto replies:', err);
      setError('Failed to load auto replies. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [searchTerm, selectedDevice, statusFilter, sortBy, sortOrder, limit]);

  // Load devices for filter
  const loadDevices = useCallback(async () => {
    try {
      const response = await devicesAPI.getAll({ limit: 100 });
      setDevices(response.data.data || []);
    } catch (err) {
      console.error('Failed to load devices:', err);
    }
  }, []);

  // Initial load
  useEffect(() => {
    loadAutoReplies();
    loadDevices();
  }, [loadAutoReplies, loadDevices]);

  // Socket event handlers
  useEffect(() => {
    const handleAutoReplyUpdate = (data) => {
      setAutoReplies(prev => 
        prev.map(autoReply => 
          autoReply.id === data.id ? { ...autoReply, ...data } : autoReply
        )
      );
    };

    const handleAutoReplyCreated = (data) => {
      setAutoReplies(prev => [data, ...prev]);
      setTotalCount(prev => prev + 1);
    };

    const handleAutoReplyDeleted = (data) => {
      setAutoReplies(prev => prev.filter(autoReply => autoReply.id !== data.id));
      setTotalCount(prev => prev - 1);
    };

    on('auto_reply:updated', handleAutoReplyUpdate);
    on('auto_reply:created', handleAutoReplyCreated);
    on('auto_reply:deleted', handleAutoReplyDeleted);

    return () => {
      off('auto_reply:updated', handleAutoReplyUpdate);
      off('auto_reply:created', handleAutoReplyCreated);
      off('auto_reply:deleted', handleAutoReplyDeleted);
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
      case 'device':
        setSelectedDevice(value);
        break;
      case 'status':
        setStatusFilter(value);
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

  // Handle auto reply actions
  const handleToggleAutoReply = async (id) => {
    try {
      setActionLoading(prev => ({ ...prev, [id]: true }));
      await autoReplyAPI.toggle(id);
      
      // Update local state
      setAutoReplies(prev => 
        prev.map(autoReply => 
          autoReply.id === id 
            ? { ...autoReply, is_active: !autoReply.is_active }
            : autoReply
        )
      );
    } catch (err) {
      console.error('Failed to toggle auto reply:', err);
      setError('Failed to toggle auto reply. Please try again.');
    } finally {
      setActionLoading(prev => ({ ...prev, [id]: false }));
    }
  };

  const handleEditAutoReply = (autoReply) => {
    setEditingAutoReply(autoReply);
    setCreateModalOpen(true);
  };

  const handleDeleteAutoReply = async (id) => {
    if (!window.confirm('Are you sure you want to delete this auto reply?')) {
      return;
    }

    try {
      setActionLoading(prev => ({ ...prev, [id]: true }));
      await autoReplyAPI.delete(id);
      
      // Remove from local state
      setAutoReplies(prev => prev.filter(autoReply => autoReply.id !== id));
      setTotalCount(prev => prev - 1);
    } catch (err) {
      console.error('Failed to delete auto reply:', err);
      setError('Failed to delete auto reply. Please try again.');
    } finally {
      setActionLoading(prev => ({ ...prev, [id]: false }));
    }
  };

  const handleTestAutoReply = async (id) => {
    try {
      setActionLoading(prev => ({ ...prev, [`test_${id}`]: true }));
      
      const testMessage = prompt('Enter a test message to check if this auto reply would trigger:');
      if (!testMessage) return;
      
      const response = await autoReplyAPI.test(id, { message: testMessage });
      
      if (response.data.would_trigger) {
        alert(`✅ Auto reply would trigger!\n\nReply: ${response.data.reply_message}`);
      } else {
        alert('❌ Auto reply would not trigger for this message.');
      }
    } catch (err) {
      console.error('Failed to test auto reply:', err);
      setError('Failed to test auto reply. Please try again.');
    } finally {
      setActionLoading(prev => ({ ...prev, [`test_${id}`]: false }));
    }
  };

  // Handle create/update auto reply
  const handleSubmitAutoReply = async (formData) => {
    try {
      if (editingAutoReply) {
        const response = await autoReplyAPI.update(editingAutoReply.id, formData);
        
        // Update local state
        setAutoReplies(prev => 
          prev.map(autoReply => 
            autoReply.id === editingAutoReply.id ? response.data : autoReply
          )
        );
      } else {
        const response = await autoReplyAPI.create(formData);
        
        // Add to local state
        setAutoReplies(prev => [response.data, ...prev]);
        setTotalCount(prev => prev + 1);
      }
    } catch (err) {
      console.error('Failed to save auto reply:', err);
      throw new Error('Failed to save auto reply. Please try again.');
    }
  };

  const handleCloseModal = () => {
    setCreateModalOpen(false);
    setEditingAutoReply(null);
  };

  // Filter options
  const statusOptions = [
    { value: '', label: 'All Status' },
    { value: 'active', label: 'Active' },
    { value: 'inactive', label: 'Inactive' }
  ];

  const deviceOptions = [
    { value: '', label: 'All Devices' },
    ...devices.map(device => ({
      value: device.id,
      label: `${device.name} (${device.phone_number || 'No number'})`
    }))
  ];

  const sortOptions = [
    { value: 'created_at:desc', label: 'Newest First' },
    { value: 'created_at:asc', label: 'Oldest First' },
    { value: 'name:asc', label: 'Name A-Z' },
    { value: 'name:desc', label: 'Name Z-A' },
    { value: 'priority:asc', label: 'Priority (High to Low)' },
    { value: 'priority:desc', label: 'Priority (Low to High)' },
    { value: 'triggered_count:desc', label: 'Most Triggered' },
    { value: 'triggered_count:asc', label: 'Least Triggered' }
  ];

  if (loading && autoReplies.length === 0) {
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
            <h2 className="text-2xl font-bold text-gray-900">Auto Replies</h2>
            <p className="text-gray-600 mt-1">
              Manage automated responses for incoming messages
            </p>
          </div>
          
          <Button
            onClick={() => setCreateModalOpen(true)}
            icon={<PlusIcon className="w-4 h-4" />}
          >
            Create Auto Reply
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
              placeholder="Search auto replies..."
              value={searchTerm}
              onChange={(e) => handleSearch(e.target.value)}
              icon={<MagnifyingGlassIcon className="w-4 h-4" />}
            />
            
            <Dropdown
              options={deviceOptions}
              value={selectedDevice}
              onChange={(value) => handleFilterChange('device', value)}
              placeholder="Filter by device"
            />
            
            <Dropdown
              options={statusOptions}
              value={statusFilter}
              onChange={(value) => handleFilterChange('status', value)}
              placeholder="Filter by status"
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
              {totalCount} auto repl{totalCount === 1 ? 'y' : 'ies'} found
            </div>
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => loadAutoReplies(currentPage)}
              loading={loading}
              icon={<ArrowPathIcon className="w-4 h-4" />}
            >
              Refresh
            </Button>
          </div>
        </div>
      )}

      {/* Auto Reply List */}
      {autoReplies.length === 0 ? (
        <div className="text-center py-12">
          <ExclamationTriangleIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No auto replies found</h3>
          <p className="text-gray-600 mb-6">
            {searchTerm || selectedDevice || statusFilter
              ? 'Try adjusting your filters to see more results.'
              : 'Create your first auto reply to get started with automated responses.'
            }
          </p>
          {!searchTerm && !selectedDevice && !statusFilter && (
            <Button
              onClick={() => setCreateModalOpen(true)}
              icon={<PlusIcon className="w-4 h-4" />}
            >
              Create Auto Reply
            </Button>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {autoReplies.map((autoReply) => (
            <AutoReplyCard
              key={autoReply.id}
              autoReply={autoReply}
              onToggle={handleToggleAutoReply}
              onEdit={handleEditAutoReply}
              onDelete={handleDeleteAutoReply}
              onTest={handleTestAutoReply}
              onViewDetails={onAutoReplySelect}
              loading={actionLoading[autoReply.id]}
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
              loadAutoReplies(page);
            }}
            showInfo
            totalItems={totalCount}
            itemsPerPage={limit}
          />
        </div>
      )}

      {/* Create/Edit Modal */}
      <CreateAutoReplyModal
        isOpen={createModalOpen}
        onClose={handleCloseModal}
        onSubmit={handleSubmitAutoReply}
        autoReply={editingAutoReply}
        devices={devices}
        loading={actionLoading.modal}
      />
    </div>
  );
};

export default AutoReplyList;