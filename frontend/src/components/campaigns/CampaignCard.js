import React, { useState, useEffect } from 'react';
import { 
  MegaphoneIcon,
  PlayIcon,
  PauseIcon,
  StopIcon,
  EyeIcon,
  PencilIcon,
  TrashIcon,
  ClockIcon,
  CheckCircleIcon,
  XCircleIcon,
  UsersIcon
} from '@heroicons/react/24/outline';
import Card from '../common/Card';
import Button from '../common/Button';
import { StatusBadge } from '../common/Badge';
import Modal from '../common/Modal';
import { useCampaignSocket } from '../../hooks/useSocket';
import { formatDistanceToNow } from 'date-fns';
import { id } from 'date-fns/locale';

const CampaignCard = ({ 
  campaign, 
  onStart, 
  onPause,
  onResume,
  onStop, 
  onEdit,
  onDelete,
  onViewDetails,
  loading = false 
}) => {
  const [detailsModalOpen, setDetailsModalOpen] = useState(false);
  const [campaignStatus, setCampaignStatus] = useState(campaign.status);
  const [progress, setProgress] = useState(campaign.progress || 0);
  const [stats, setStats] = useState(campaign.stats || {});

  // Subscribe to campaign socket events
  const { subscribeToProgress, subscribeToStatus } = useCampaignSocket(campaign.id);

  useEffect(() => {
    // Subscribe to campaign progress updates
    const unsubscribeProgress = subscribeToProgress((data) => {
      setProgress(data.progress);
      setStats(data.stats);
    });

    // Subscribe to campaign status updates
    const unsubscribeStatus = subscribeToStatus((data) => {
      setCampaignStatus(data.status);
      if (data.stats) {
        setStats(data.stats);
      }
    });

    return () => {
      unsubscribeProgress();
      unsubscribeStatus();
    };
  }, [subscribeToProgress, subscribeToStatus]);

  const getStatusColor = (status) => {
    switch (status) {
      case 'running':
        return 'success';
      case 'paused':
        return 'warning';
      case 'completed':
        return 'info';
      case 'stopped':
      case 'failed':
        return 'danger';
      case 'scheduled':
        return 'secondary';
      default:
        return 'secondary';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'running':
        return <PlayIcon className="w-4 h-4" />;
      case 'paused':
        return <PauseIcon className="w-4 h-4" />;
      case 'completed':
        return <CheckCircleIcon className="w-4 h-4" />;
      case 'stopped':
      case 'failed':
        return <XCircleIcon className="w-4 h-4" />;
      case 'scheduled':
        return <ClockIcon className="w-4 h-4" />;
      default:
        return <MegaphoneIcon className="w-4 h-4" />;
    }
  };

  const handleViewDetails = () => {
    setDetailsModalOpen(true);
    if (onViewDetails) {
      onViewDetails(campaign.id);
    }
  };

  const canStart = ['draft', 'scheduled', 'stopped'].includes(campaignStatus) && !loading;
  const canPause = campaignStatus === 'running' && !loading;
  const canResume = campaignStatus === 'paused' && !loading;
  const canStop = ['running', 'paused'].includes(campaignStatus) && !loading;
  const canEdit = ['draft', 'scheduled', 'stopped', 'completed'].includes(campaignStatus) && !loading;
  const canDelete = ['draft', 'stopped', 'completed', 'failed'].includes(campaignStatus) && !loading;

  const progressPercentage = Math.round(progress * 100) || 0;

  return (
    <>
      <Card className="hover:shadow-md transition-shadow">
        <div className="flex items-start justify-between">
          <div className="flex items-start space-x-3 flex-1">
            <div className="flex-shrink-0">
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <MegaphoneIcon className="w-6 h-6 text-purple-600" />
              </div>
            </div>
            
            <div className="flex-1 min-w-0">
              <h3 className="text-lg font-medium text-gray-900 truncate">
                {campaign.name}
              </h3>
              <p className="text-sm text-gray-500 truncate">
                {campaign.description || 'No description'}
              </p>
              
              <div className="mt-2 flex items-center space-x-4">
                <div className="flex items-center space-x-1">
                  {getStatusIcon(campaignStatus)}
                  <StatusBadge status={campaignStatus} />
                </div>
                
                <div className="flex items-center space-x-1">
                  <UsersIcon className="w-4 h-4 text-gray-400" />
                  <span className="text-sm text-gray-600">
                    {campaign.target_count || 0} targets
                  </span>
                </div>
              </div>

              {/* Progress Bar for Running Campaigns */}
              {['running', 'paused'].includes(campaignStatus) && (
                <div className="mt-3">
                  <div className="flex justify-between text-sm text-gray-600 mb-1">
                    <span>Progress</span>
                    <span>{progressPercentage}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${progressPercentage}%` }}
                    ></div>
                  </div>
                </div>
              )}
              
              <div className="flex items-center space-x-4 mt-3 text-xs text-gray-500">
                {campaign.scheduled_at && new Date(campaign.scheduled_at) > new Date() && (
                  <span>
                    Scheduled: {formatDistanceToNow(new Date(campaign.scheduled_at), { 
                      addSuffix: true,
                      locale: id 
                    })}
                  </span>
                )}
                
                {campaign.created_at && (
                  <span>
                    Created: {formatDistanceToNow(new Date(campaign.created_at), { 
                      addSuffix: true,
                      locale: id 
                    })}
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
            
            {canStart && (
              <Button
                size="sm"
                variant="success"
                onClick={() => onStart(campaign.id)}
                loading={loading}
                icon={<PlayIcon className="w-4 h-4" />}
              >
                Start
              </Button>
            )}
            
            {canPause && (
              <Button
                size="sm"
                variant="warning"
                onClick={() => onPause(campaign.id)}
                loading={loading}
                icon={<PauseIcon className="w-4 h-4" />}
              >
                Pause
              </Button>
            )}
            
            {canResume && (
              <Button
                size="sm"
                variant="success"
                onClick={() => onResume(campaign.id)}
                loading={loading}
                icon={<PlayIcon className="w-4 h-4" />}
              >
                Resume
              </Button>
            )}
            
            {canStop && (
              <Button
                size="sm"
                variant="danger"
                onClick={() => onStop(campaign.id)}
                loading={loading}
                icon={<StopIcon className="w-4 h-4" />}
              >
                Stop
              </Button>
            )}
            
            {canEdit && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => onEdit(campaign)}
                icon={<PencilIcon className="w-4 h-4" />}
              />
            )}
            
            {canDelete && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => onDelete(campaign.id)}
                loading={loading}
                icon={<TrashIcon className="w-4 h-4" />}
              />
            )}
          </div>
        </div>
        
        {/* Campaign Stats */}
        {(stats.sent || stats.delivered || stats.failed) && (
          <div className="mt-4 grid grid-cols-3 gap-4 pt-4 border-t border-gray-200">
            <div className="text-center">
              <div className="text-lg font-semibold text-gray-900">
                {stats.sent || 0}
              </div>
              <div className="text-xs text-gray-500">Sent</div>
            </div>
            
            <div className="text-center">
              <div className="text-lg font-semibold text-green-600">
                {stats.delivered || 0}
              </div>
              <div className="text-xs text-gray-500">Delivered</div>
            </div>
            
            <div className="text-center">
              <div className="text-lg font-semibold text-red-600">
                {stats.failed || 0}
              </div>
              <div className="text-xs text-gray-500">Failed</div>
            </div>
          </div>
        )}
      </Card>

      {/* Campaign Details Modal */}
      <Modal
        isOpen={detailsModalOpen}
        onClose={() => setDetailsModalOpen(false)}
        title="Campaign Details"
        size="xl"
      >
        <div className="space-y-6">
          {/* Campaign Info */}
          <div>
            <h4 className="text-sm font-medium text-gray-900 mb-3">Campaign Information</h4>
            <div className="bg-gray-50 rounded-lg p-4 space-y-3">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="text-sm font-medium text-gray-700">Name:</span>
                  <p className="text-sm text-gray-900">{campaign.name}</p>
                </div>
                <div>
                  <span className="text-sm font-medium text-gray-700">Status:</span>
                  <div className="flex items-center space-x-2 mt-1">
                    {getStatusIcon(campaignStatus)}
                    <StatusBadge status={campaignStatus} />
                  </div>
                </div>
              </div>
              
              {campaign.description && (
                <div>
                  <span className="text-sm font-medium text-gray-700">Description:</span>
                  <p className="text-sm text-gray-900 mt-1">{campaign.description}</p>
                </div>
              )}
            </div>
          </div>

          {/* Message Content */}
          <div>
            <h4 className="text-sm font-medium text-gray-900 mb-3">Message Content</h4>
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="text-sm font-medium text-gray-700 mb-2">Message Type: 
                <span className="capitalize ml-1">{campaign.message_type || 'text'}</span>
              </div>
              <div className="bg-white rounded p-3 border">
                <p className="text-sm text-gray-900 whitespace-pre-wrap">
                  {campaign.message_content}
                </p>
                {campaign.media_url && (
                  <div className="mt-2">
                    <a 
                      href={campaign.media_url} 
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
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-gray-50 rounded-lg p-3 text-center">
                <div className="text-lg font-semibold text-gray-900">
                  {campaign.target_count || 0}
                </div>
                <div className="text-xs text-gray-500">Total Targets</div>
              </div>
              
              <div className="bg-blue-50 rounded-lg p-3 text-center">
                <div className="text-lg font-semibold text-blue-600">
                  {stats.sent || 0}
                </div>
                <div className="text-xs text-gray-500">Sent</div>
              </div>
              
              <div className="bg-green-50 rounded-lg p-3 text-center">
                <div className="text-lg font-semibold text-green-600">
                  {stats.delivered || 0}
                </div>
                <div className="text-xs text-gray-500">Delivered</div>
              </div>
              
              <div className="bg-red-50 rounded-lg p-3 text-center">
                <div className="text-lg font-semibold text-red-600">
                  {stats.failed || 0}
                </div>
                <div className="text-xs text-gray-500">Failed</div>
              </div>
            </div>
          </div>

          {/* Progress */}
          {['running', 'paused', 'completed'].includes(campaignStatus) && (
            <div>
              <h4 className="text-sm font-medium text-gray-900 mb-3">Progress</h4>
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex justify-between text-sm text-gray-600 mb-2">
                  <span>Overall Progress</span>
                  <span>{progressPercentage}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3">
                  <div 
                    className="bg-blue-600 h-3 rounded-full transition-all duration-300"
                    style={{ width: `${progressPercentage}%` }}
                  ></div>
                </div>
              </div>
            </div>
          )}

          {/* Timestamps */}
          <div>
            <h4 className="text-sm font-medium text-gray-900 mb-3">Timeline</h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Created:</span>
                <span>{new Date(campaign.created_at).toLocaleString()}</span>
              </div>
              {campaign.scheduled_at && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Scheduled:</span>
                  <span>{new Date(campaign.scheduled_at).toLocaleString()}</span>
                </div>
              )}
              {campaign.started_at && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Started:</span>
                  <span>{new Date(campaign.started_at).toLocaleString()}</span>
                </div>
              )}
              {campaign.completed_at && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Completed:</span>
                  <span>{new Date(campaign.completed_at).toLocaleString()}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </Modal>
    </>
  );
};

export default CampaignCard;