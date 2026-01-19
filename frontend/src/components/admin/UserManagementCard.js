import React, { useState } from 'react';
import { 
  UserIcon,
  PencilIcon,
  TrashIcon,
  EyeIcon,
  ShieldCheckIcon,
  ShieldExclamationIcon,
  ClockIcon,
  DevicePhoneMobileIcon,
  ChatBubbleLeftRightIcon
} from '@heroicons/react/24/outline';
import Card from '../common/Card';
import Button from '../common/Button';
import { StatusBadge } from '../common/Badge';
import Modal from '../common/Modal';
import { formatDistanceToNow } from 'date-fns';

const UserManagementCard = ({ 
  user, 
  onEdit,
  onDelete,
  onSuspend,
  onActivate,
  onViewDetails,
  loading = false 
}) => {
  const [detailsModalOpen, setDetailsModalOpen] = useState(false);

  const handleViewDetails = () => {
    setDetailsModalOpen(true);
    if (onViewDetails) {
      onViewDetails(user.id);
    }
  };

  const handleSuspend = () => {
    if (window.confirm(`Are you sure you want to ${user.status === 'suspended' ? 'activate' : 'suspend'} ${user.name}?`)) {
      if (user.status === 'suspended') {
        onActivate(user.id);
      } else {
        onSuspend(user.id);
      }
    }
  };

  const handleDelete = () => {
    if (window.confirm(`Are you sure you want to delete ${user.name}? This action cannot be undone.`)) {
      onDelete(user.id);
    }
  };

  const getRoleIcon = (role) => {
    switch (role) {
      case 'admin':
      case 'super_admin':
        return <ShieldCheckIcon className="w-4 h-4" />;
      default:
        return <UserIcon className="w-4 h-4" />;
    }
  };

  const getRoleColor = (role) => {
    switch (role) {
      case 'super_admin':
        return 'text-purple-600 bg-purple-100';
      case 'admin':
        return 'text-blue-600 bg-blue-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'active':
        return 'success';
      case 'suspended':
        return 'danger';
      case 'pending':
        return 'warning';
      default:
        return 'secondary';
    }
  };

  return (
    <>
      <Card className="hover:shadow-md transition-shadow">
        <div className="flex items-start justify-between p-6">
          <div className="flex items-start space-x-4 flex-1">
            <div className="flex-shrink-0">
              <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center">
                <UserIcon className="w-6 h-6 text-gray-600" />
              </div>
            </div>
            
            <div className="flex-1 min-w-0">
              <div className="flex items-center space-x-2 mb-1">
                <h3 className="text-lg font-medium text-gray-900 truncate">
                  {user.name}
                </h3>
                <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getRoleColor(user.role)}`}>
                  {getRoleIcon(user.role)}
                  <span className="ml-1 capitalize">{user.role.replace('_', ' ')}</span>
                </div>
              </div>
              
              <p className="text-sm text-gray-500 truncate mb-2">
                {user.email}
              </p>
              
              <div className="flex items-center space-x-4 mb-3">
                <StatusBadge status={getStatusColor(user.status)}>
                  {user.status}
                </StatusBadge>
                
                {user.email_verified_at && (
                  <div className="flex items-center text-xs text-green-600">
                    <ShieldCheckIcon className="w-3 h-3 mr-1" />
                    Verified
                  </div>
                )}
              </div>

              <div className="grid grid-cols-3 gap-4 text-sm text-gray-600">
                <div className="flex items-center">
                  <DevicePhoneMobileIcon className="w-4 h-4 mr-1" />
                  <span>{user.devices_count || 0} devices</span>
                </div>
                
                <div className="flex items-center">
                  <ChatBubbleLeftRightIcon className="w-4 h-4 mr-1" />
                  <span>{user.messages_count || 0} messages</span>
                </div>
                
                <div className="flex items-center">
                  <ClockIcon className="w-4 h-4 mr-1" />
                  <span>
                    {user.last_login_at 
                      ? formatDistanceToNow(new Date(user.last_login_at), { addSuffix: true })
                      : 'Never'
                    }
                  </span>
                </div>
              </div>
              
              <div className="flex items-center space-x-4 mt-3 text-xs text-gray-500">
                <span>
                  Created: {formatDistanceToNow(new Date(user.created_at), { addSuffix: true })}
                </span>
                
                {user.subscription_plan && (
                  <span className="capitalize">
                    Plan: {user.subscription_plan}
                  </span>
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
            
            <Button
              size="sm"
              variant="outline"
              onClick={() => onEdit(user)}
              icon={<PencilIcon className="w-4 h-4" />}
            />
            
            <Button
              size="sm"
              variant={user.status === 'suspended' ? 'success' : 'warning'}
              onClick={handleSuspend}
              loading={loading}
              icon={user.status === 'suspended' ? <ShieldCheckIcon className="w-4 h-4" /> : <ShieldExclamationIcon className="w-4 h-4" />}
            >
              {user.status === 'suspended' ? 'Activate' : 'Suspend'}
            </Button>
            
            <Button
              size="sm"
              variant="outline"
              onClick={handleDelete}
              loading={loading}
              icon={<TrashIcon className="w-4 h-4" />}
            />
          </div>
        </div>
      </Card>

      {/* User Details Modal */}
      <Modal
        isOpen={detailsModalOpen}
        onClose={() => setDetailsModalOpen(false)}
        title="User Details"
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
                  <p className="text-sm text-gray-900">{user.name}</p>
                </div>
                <div>
                  <span className="text-sm font-medium text-gray-700">Email:</span>
                  <p className="text-sm text-gray-900">{user.email}</p>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="text-sm font-medium text-gray-700">Role:</span>
                  <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getRoleColor(user.role)} mt-1`}>
                    {getRoleIcon(user.role)}
                    <span className="ml-1 capitalize">{user.role.replace('_', ' ')}</span>
                  </div>
                </div>
                <div>
                  <span className="text-sm font-medium text-gray-700">Status:</span>
                  <div className="mt-1">
                    <StatusBadge status={getStatusColor(user.status)}>
                      {user.status}
                    </StatusBadge>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Usage Statistics */}
          <div>
            <h4 className="text-sm font-medium text-gray-900 mb-3">Usage Statistics</h4>
            <div className="grid grid-cols-3 gap-4">
              <div className="bg-blue-50 rounded-lg p-3 text-center">
                <div className="text-lg font-semibold text-blue-600">
                  {user.devices_count || 0}
                </div>
                <div className="text-xs text-gray-500">Devices</div>
              </div>
              
              <div className="bg-green-50 rounded-lg p-3 text-center">
                <div className="text-lg font-semibold text-green-600">
                  {user.messages_count || 0}
                </div>
                <div className="text-xs text-gray-500">Messages</div>
              </div>
              
              <div className="bg-purple-50 rounded-lg p-3 text-center">
                <div className="text-lg font-semibold text-purple-600">
                  {user.campaigns_count || 0}
                </div>
                <div className="text-xs text-gray-500">Campaigns</div>
              </div>
            </div>
          </div>

          {/* Account Details */}
          <div>
            <h4 className="text-sm font-medium text-gray-900 mb-3">Account Details</h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Created:</span>
                <span>{new Date(user.created_at).toLocaleString()}</span>
              </div>
              
              {user.email_verified_at && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Email Verified:</span>
                  <span>{new Date(user.email_verified_at).toLocaleString()}</span>
                </div>
              )}
              
              {user.last_login_at && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Last Login:</span>
                  <span>{new Date(user.last_login_at).toLocaleString()}</span>
                </div>
              )}
              
              {user.subscription_plan && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Subscription:</span>
                  <span className="capitalize">{user.subscription_plan}</span>
                </div>
              )}
            </div>
          </div>

          {/* Permissions */}
          {user.permissions && user.permissions.length > 0 && (
            <div>
              <h4 className="text-sm font-medium text-gray-900 mb-3">Permissions</h4>
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex flex-wrap gap-2">
                  {user.permissions.map((permission, index) => (
                    <span 
                      key={index}
                      className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-blue-100 text-blue-800"
                    >
                      {permission}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </Modal>
    </>
  );
};

export default UserManagementCard;