import React, { useState, useEffect } from 'react';
import { PlusIcon, MagnifyingGlassIcon } from '@heroicons/react/24/outline';
import DeviceCard from './DeviceCard';
import CreateDeviceModal from './CreateDeviceModal';
import Button from '../common/Button';
import Input from '../common/Input';
import Alert from '../common/Alert';
import { ConfirmModal } from '../common/Modal';
import { useAuth } from '../../contexts/AuthContext';
import { PERMISSIONS } from '../../utils/constants/permissions';

const DeviceList = ({ 
  devices = [], 
  loading = false, 
  onCreateDevice,
  onStartDevice,
  onStopDevice,
  onRestartDevice,
  onDeleteDevice,
  onShowQR,
  onRefresh
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [selectedDevice, setSelectedDevice] = useState(null);
  const [actionLoading, setActionLoading] = useState({});
  
  const { checkPermission, checkQuota, getQuotaUsage } = useAuth();
  
  const canCreateDevice = checkPermission(PERMISSIONS.DEVICES_CREATE);
  const canManageDevices = checkPermission(PERMISSIONS.DEVICES_MANAGE_OWN);
  const hasQuota = checkQuota('devices');
  const quotaUsage = getQuotaUsage('devices');

  // Filter devices based on search term
  const filteredDevices = devices.filter(device =>
    device.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (device.phone_number && device.phone_number.includes(searchTerm))
  );

  const handleCreateDevice = async (deviceData) => {
    if (!hasQuota) {
      throw new Error('Device quota exceeded. Please upgrade your plan.');
    }
    
    setActionLoading(prev => ({ ...prev, create: true }));
    try {
      await onCreateDevice(deviceData);
    } finally {
      setActionLoading(prev => ({ ...prev, create: false }));
    }
  };

  const handleDeviceAction = async (action, deviceId) => {
    setActionLoading(prev => ({ ...prev, [deviceId]: true }));
    try {
      switch (action) {
        case 'start':
          await onStartDevice(deviceId);
          break;
        case 'stop':
          await onStopDevice(deviceId);
          break;
        case 'restart':
          await onRestartDevice(deviceId);
          break;
        default:
          break;
      }
    } finally {
      setActionLoading(prev => ({ ...prev, [deviceId]: false }));
    }
  };

  const handleDeleteDevice = (deviceId) => {
    const device = devices.find(d => d.id === deviceId);
    setSelectedDevice(device);
    setDeleteModalOpen(true);
  };

  const confirmDeleteDevice = async () => {
    if (!selectedDevice) return;
    
    setActionLoading(prev => ({ ...prev, delete: true }));
    try {
      await onDeleteDevice(selectedDevice.id);
      setDeleteModalOpen(false);
      setSelectedDevice(null);
    } finally {
      setActionLoading(prev => ({ ...prev, delete: false }));
    }
  };

  const getStatusCounts = () => {
    const counts = {
      connected: 0,
      pairing: 0,
      disconnected: 0,
      banned: 0
    };
    
    devices.forEach(device => {
      if (counts.hasOwnProperty(device.status)) {
        counts[device.status]++;
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
          <h1 className="text-2xl font-bold text-gray-900">Devices</h1>
          <p className="text-gray-600">
            Manage your WhatsApp devices and connections
          </p>
        </div>
        
        {canCreateDevice && (
          <Button
            onClick={() => setCreateModalOpen(true)}
            icon={<PlusIcon className="w-4 h-4" />}
            disabled={!hasQuota}
          >
            Add Device
          </Button>
        )}
      </div>

      {/* Quota Warning */}
      {!hasQuota && (
        <Alert variant="warning">
          <strong>Device quota exceeded!</strong> You have used {quotaUsage.used} of {quotaUsage.limit} devices. 
          Please upgrade your plan to add more devices.
        </Alert>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center">
            <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
            <span className="text-sm text-gray-600">Connected</span>
          </div>
          <div className="text-2xl font-bold text-gray-900 mt-1">
            {statusCounts.connected}
          </div>
        </div>
        
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center">
            <div className="w-2 h-2 bg-yellow-500 rounded-full mr-2"></div>
            <span className="text-sm text-gray-600">Pairing</span>
          </div>
          <div className="text-2xl font-bold text-gray-900 mt-1">
            {statusCounts.pairing}
          </div>
        </div>
        
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center">
            <div className="w-2 h-2 bg-gray-500 rounded-full mr-2"></div>
            <span className="text-sm text-gray-600">Disconnected</span>
          </div>
          <div className="text-2xl font-bold text-gray-900 mt-1">
            {statusCounts.disconnected}
          </div>
        </div>
        
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center">
            <div className="w-2 h-2 bg-red-500 rounded-full mr-2"></div>
            <span className="text-sm text-gray-600">Banned</span>
          </div>
          <div className="text-2xl font-bold text-gray-900 mt-1">
            {statusCounts.banned}
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <Input
            placeholder="Search devices by name or phone number..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            startIcon={<MagnifyingGlassIcon className="w-4 h-4" />}
          />
        </div>
        
        <Button
          variant="outline"
          onClick={onRefresh}
          loading={loading}
        >
          Refresh
        </Button>
      </div>

      {/* Device Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, index) => (
            <div key={index} className="animate-pulse">
              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <div className="flex items-start space-x-3">
                  <div className="w-12 h-12 bg-gray-200 rounded-lg"></div>
                  <div className="flex-1">
                    <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                    <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                  </div>
                </div>
                <div className="mt-4 grid grid-cols-3 gap-4">
                  <div className="h-8 bg-gray-200 rounded"></div>
                  <div className="h-8 bg-gray-200 rounded"></div>
                  <div className="h-8 bg-gray-200 rounded"></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : filteredDevices.length === 0 ? (
        <div className="text-center py-12">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            {searchTerm ? 'No devices found' : 'No devices yet'}
          </h3>
          <p className="text-gray-500 mb-6">
            {searchTerm 
              ? 'Try adjusting your search terms'
              : 'Create your first device to start sending WhatsApp messages'
            }
          </p>
          {canCreateDevice && !searchTerm && hasQuota && (
            <Button
              onClick={() => setCreateModalOpen(true)}
              icon={<PlusIcon className="w-4 h-4" />}
            >
              Create First Device
            </Button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredDevices.map((device) => (
            <DeviceCard
              key={device.id}
              device={device}
              onStart={(id) => handleDeviceAction('start', id)}
              onStop={(id) => handleDeviceAction('stop', id)}
              onRestart={(id) => handleDeviceAction('restart', id)}
              onDelete={handleDeleteDevice}
              onShowQR={onShowQR}
              loading={actionLoading[device.id]}
            />
          ))}
        </div>
      )}

      {/* Create Device Modal */}
      <CreateDeviceModal
        isOpen={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        onSubmit={handleCreateDevice}
        loading={actionLoading.create}
      />

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        onConfirm={confirmDeleteDevice}
        title="Delete Device"
        message={`Are you sure you want to delete "${selectedDevice?.name}"? This action cannot be undone.`}
        confirmText="Delete"
        variant="danger"
        loading={actionLoading.delete}
      />
    </div>
  );
};

export default DeviceList;