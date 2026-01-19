import React, { useState, useEffect } from 'react';
import { 
  PlusIcon, 
  MagnifyingGlassIcon,
  FunnelIcon,
  ArrowDownTrayIcon,
  MegaphoneIcon
} from '@heroicons/react/24/outline';
import CampaignCard from './CampaignCard';
import CreateCampaignModal from './CreateCampaignModal';
import Button from '../common/Button';
import Input from '../common/Input';
import Dropdown, { DropdownItem } from '../common/Dropdown';
import Pagination from '../common/Pagination';
import { ConfirmModal } from '../common/Modal';
import { useAuth } from '../../contexts/AuthContext';
import { PERMISSIONS } from '../../utils/constants/permissions';
import { useSystemSocket } from '../../hooks/useSocket';

const CampaignList = ({ 
  campaigns = [], 
  devices = [],
  contacts = [],
  groups = [],
  loading = false,
  pagination = {},
  onCreateCampaign,
  onUpdateCampaign,
  onStartCampaign,
  onPauseCampaign,
  onResumeCampaign,
  onStopCampaign,
  onDeleteCampaign,
  onExportReport,
  onRefresh,
  onPageChange,
  onSearch,
  onFilter
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [campaignModalOpen, setCampaignModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [selectedCampaign, setSelectedCampaign] = useState(null);
  const [selectedCampaignId, setSelectedCampaignId] = useState(null);
  const [filters, setFilters] = useState({
    status: '',
    device_id: '',
    date_range: ''
  });
  const [actionLoading, setActionLoading] = useState({});
  
  const { checkPermission, checkQuota, getQuotaUsage } = useAuth();
  
  const canCreateCampaign = checkPermission(PERMISSIONS.CAMPAIGNS_CREATE);
  const canManageCampaigns = checkPermission(PERMISSIONS.CAMPAIGNS_MANAGE_OWN);
  const canViewAll = checkPermission(PERMISSIONS.CAMPAIGNS_VIEW_ALL);
  const hasQuota = checkQuota('campaigns');
  const quotaUsage = getQuotaUsage('campaigns');

  // Subscribe to system notifications for quota warnings
  const { subscribeToQuotaWarnings } = useSystemSocket();

  useEffect(() => {
    const unsubscribeQuota = subscribeToQuotaWarnings((data) => {
      if (data.resource === 'campaigns') {
        // Handle quota warning
        console.log('Campaign quota warning:', data);
      }
    });

    return () => {
      unsubscribeQuota();
    };
  }, [subscribeToQuotaWarnings]);

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

  const handleCreateCampaign = async (campaignData) => {
    if (!hasQuota) {
      throw new Error('Campaign quota exceeded. Please upgrade your plan.');
    }
    
    setActionLoading(prev => ({ ...prev, create: true }));
    try {
      await onCreateCampaign(campaignData);
    } finally {
      setActionLoading(prev => ({ ...prev, create: false }));
    }
  };

  const handleUpdateCampaign = async (campaignData) => {
    setActionLoading(prev => ({ ...prev, update: true }));
    try {
      await onUpdateCampaign(selectedCampaign.id, campaignData);
      setCampaignModalOpen(false);
      setSelectedCampaign(null);
    } finally {
      setActionLoading(prev => ({ ...prev, update: false }));
    }
  };

  const handleEditCampaign = (campaign) => {
    setSelectedCampaign(campaign);
    setCampaignModalOpen(true);
  };

  const handleCampaignAction = async (action, campaignId) => {
    setActionLoading(prev => ({ ...prev, [campaignId]: true }));
    try {
      switch (action) {
        case 'start':
          await onStartCampaign(campaignId);
          break;
        case 'pause':
          await onPauseCampaign(campaignId);
          break;
        case 'resume':
          await onResumeCampaign(campaignId);
          break;
        case 'stop':
          await onStopCampaign(campaignId);
          break;
        default:
          break;
      }
    } finally {
      setActionLoading(prev => ({ ...prev, [campaignId]: false }));
    }
  };

  const handleDeleteCampaign = (campaignId) => {
    setSelectedCampaignId(campaignId);
    setDeleteModalOpen(true);
  };

  const confirmDeleteCampaign = async () => {
    if (!selectedCampaignId) return;
    
    setActionLoading(prev => ({ ...prev, delete: true }));
    try {
      await onDeleteCampaign(selectedCampaignId);
      setDeleteModalOpen(false);
      setSelectedCampaignId(null);
    } finally {
      setActionLoading(prev => ({ ...prev, delete: false }));
    }
  };

  const handleExportReport = async () => {
    setActionLoading(prev => ({ ...prev, export: true }));
    try {
      await onExportReport(filters);
    } finally {
      setActionLoading(prev => ({ ...prev, export: false }));
    }
  };

  const getStatusCounts = () => {
    const counts = {
      draft: 0,
      scheduled: 0,
      running: 0,
      paused: 0,
      completed: 0,
      stopped: 0,
      failed: 0
    };
    
    campaigns.forEach(campaign => {
      if (counts.hasOwnProperty(campaign.status)) {
        counts[campaign.status]++;
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
          <h1 className="text-2xl font-bold text-gray-900">Campaigns</h1>
          <p className="text-gray-600">
            Create and manage WhatsApp broadcast campaigns
          </p>
        </div>
        
        <div className="flex items-center space-x-3">
          {onExportReport && (
            <Button
              variant="outline"
              onClick={handleExportReport}
              loading={actionLoading.export}
              icon={<ArrowDownTrayIcon className="w-4 h-4" />}
            >
              Export Report
            </Button>
          )}
          
          {canCreateCampaign && (
            <Button
              onClick={() => {
                setSelectedCampaign(null);
                setCampaignModalOpen(true);
              }}
              disabled={!hasQuota}
              icon={<PlusIcon className="w-4 h-4" />}
            >
              Create Campaign
            </Button>
          )}
        </div>
      </div>

      {/* Quota Warning */}
      {!hasQuota && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-yellow-800">
                Campaign quota exceeded!
              </h3>
              <div className="mt-2 text-sm text-yellow-700">
                <p>You have used {quotaUsage.used} of {quotaUsage.limit} campaigns. Please upgrade your plan to create more campaigns.</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center">
            <div className="w-2 h-2 bg-gray-500 rounded-full mr-2"></div>
            <span className="text-sm text-gray-600">Draft</span>
          </div>
          <div className="text-2xl font-bold text-gray-900 mt-1">
            {statusCounts.draft}
          </div>
        </div>
        
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center">
            <div className="w-2 h-2 bg-blue-500 rounded-full mr-2"></div>
            <span className="text-sm text-gray-600">Scheduled</span>
          </div>
          <div className="text-2xl font-bold text-gray-900 mt-1">
            {statusCounts.scheduled}
          </div>
        </div>
        
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center">
            <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
            <span className="text-sm text-gray-600">Running</span>
          </div>
          <div className="text-2xl font-bold text-gray-900 mt-1">
            {statusCounts.running}
          </div>
        </div>
        
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center">
            <div className="w-2 h-2 bg-yellow-500 rounded-full mr-2"></div>
            <span className="text-sm text-gray-600">Paused</span>
          </div>
          <div className="text-2xl font-bold text-gray-900 mt-1">
            {statusCounts.paused}
          </div>
        </div>
        
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center">
            <div className="w-2 h-2 bg-purple-500 rounded-full mr-2"></div>
            <span className="text-sm text-gray-600">Completed</span>
          </div>
          <div className="text-2xl font-bold text-gray-900 mt-1">
            {statusCounts.completed}
          </div>
        </div>
        
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center">
            <div className="w-2 h-2 bg-orange-500 rounded-full mr-2"></div>
            <span className="text-sm text-gray-600">Stopped</span>
          </div>
          <div className="text-2xl font-bold text-gray-900 mt-1">
            {statusCounts.stopped}
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
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <Input
            placeholder="Search campaigns by name or description..."
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
            <DropdownItem onClick={() => handleFilterChange('status', 'draft')}>
              Draft
            </DropdownItem>
            <DropdownItem onClick={() => handleFilterChange('status', 'scheduled')}>
              Scheduled
            </DropdownItem>
            <DropdownItem onClick={() => handleFilterChange('status', 'running')}>
              Running
            </DropdownItem>
            <DropdownItem onClick={() => handleFilterChange('status', 'paused')}>
              Paused
            </DropdownItem>
            <DropdownItem onClick={() => handleFilterChange('status', 'completed')}>
              Completed
            </DropdownItem>
            <DropdownItem onClick={() => handleFilterChange('status', 'stopped')}>
              Stopped
            </DropdownItem>
            <DropdownItem onClick={() => handleFilterChange('status', 'failed')}>
              Failed
            </DropdownItem>
          </Dropdown>

          {/* Device Filter */}
          <Dropdown
            align="right"
            trigger={
              <Button
                variant="outline"
                icon={<FunnelIcon className="w-4 h-4" />}
              >
                Device
              </Button>
            }
          >
            <DropdownItem onClick={() => handleFilterChange('device_id', '')}>
              All Devices
            </DropdownItem>
            {devices.map((device) => (
              <DropdownItem 
                key={device.id} 
                onClick={() => handleFilterChange('device_id', device.id)}
              >
                {device.name}
              </DropdownItem>
            ))}
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

      {/* Campaign Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, index) => (
            <div key={index} className="animate-pulse">
              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <div className="flex items-start space-x-3">
                  <div className="w-12 h-12 bg-gray-200 rounded-lg"></div>
                  <div className="flex-1">
                    <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                    <div className="h-3 bg-gray-200 rounded w-1/2 mb-2"></div>
                    <div className="h-3 bg-gray-200 rounded w-2/3"></div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : campaigns.length === 0 ? (
        <div className="text-center py-12">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <MegaphoneIcon className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            {searchTerm ? 'No campaigns found' : 'No campaigns yet'}
          </h3>
          <p className="text-gray-500 mb-6">
            {searchTerm 
              ? 'Try adjusting your search terms or filters'
              : 'Create your first broadcast campaign to reach multiple contacts at once'
            }
          </p>
          {canCreateCampaign && !searchTerm && hasQuota && (
            <Button
              onClick={() => {
                setSelectedCampaign(null);
                setCampaignModalOpen(true);
              }}
              icon={<PlusIcon className="w-4 h-4" />}
            >
              Create First Campaign
            </Button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {campaigns.map((campaign) => (
            <CampaignCard
              key={campaign.id}
              campaign={campaign}
              onStart={(id) => handleCampaignAction('start', id)}
              onPause={(id) => handleCampaignAction('pause', id)}
              onResume={(id) => handleCampaignAction('resume', id)}
              onStop={(id) => handleCampaignAction('stop', id)}
              onEdit={canManageCampaigns ? handleEditCampaign : null}
              onDelete={canManageCampaigns ? handleDeleteCampaign : null}
              loading={actionLoading[campaign.id]}
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

      {/* Create/Edit Campaign Modal */}
      <CreateCampaignModal
        isOpen={campaignModalOpen}
        onClose={() => {
          setCampaignModalOpen(false);
          setSelectedCampaign(null);
        }}
        onSubmit={selectedCampaign ? handleUpdateCampaign : handleCreateCampaign}
        campaign={selectedCampaign}
        devices={devices}
        contacts={contacts}
        groups={groups}
        loading={actionLoading.create || actionLoading.update}
      />

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        onConfirm={confirmDeleteCampaign}
        title="Delete Campaign"
        message="Are you sure you want to delete this campaign? This action cannot be undone."
        confirmText="Delete"
        variant="danger"
        loading={actionLoading.delete}
      />
    </div>
  );
};

export default CampaignList;