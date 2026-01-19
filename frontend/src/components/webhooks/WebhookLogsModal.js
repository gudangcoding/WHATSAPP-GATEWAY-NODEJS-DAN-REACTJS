import { useState, useEffect, useCallback } from 'react';
import Modal from '../common/Modal';
import Button from '../common/Button';
import LoadingSpinner from '../common/LoadingSpinner';
import Alert from '../common/Alert';
import Pagination from '../common/Pagination';
import { StatusBadge } from '../common/Badge';
import { 
  ClockIcon,
  CheckCircleIcon,
  XCircleIcon,
  ArrowPathIcon,
  EyeIcon,
  DocumentTextIcon
} from '@heroicons/react/24/outline';
import { formatDistanceToNow } from 'date-fns';
import { webhooksAPI } from '../../services/api';

const WebhookLogsModal = ({ 
  isOpen, 
  onClose, 
  webhookId,
  webhookName = 'Webhook'
}) => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [selectedLog, setSelectedLog] = useState(null);
  const [detailsModalOpen, setDetailsModalOpen] = useState(false);
  const limit = 20;

  // Load webhook logs
  const loadLogs = useCallback(async (page = 1) => {
    if (!webhookId) return;

    try {
      setLoading(true);
      setError('');

      const response = await webhooksAPI.getLogs(webhookId, {
        page,
        limit,
        sort_by: 'created_at',
        sort_order: 'desc'
      });

      setLogs(response.data.data || []);
      setCurrentPage(response.data.pagination?.page || 1);
      setTotalPages(response.data.pagination?.pages || 1);
      setTotalCount(response.data.pagination?.total || 0);
    } catch (err) {
      console.error('Failed to load webhook logs:', err);
      setError('Failed to load webhook logs. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [webhookId, limit]);

  // Load logs when modal opens or webhook changes
  useEffect(() => {
    if (isOpen && webhookId) {
      loadLogs();
    }
  }, [isOpen, webhookId, loadLogs]);

  const handleClose = () => {
    setLogs([]);
    setError('');
    setCurrentPage(1);
    setSelectedLog(null);
    setDetailsModalOpen(false);
    onClose();
  };

  const handleViewDetails = (log) => {
    setSelectedLog(log);
    setDetailsModalOpen(true);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'success':
        return 'success';
      case 'failed':
        return 'danger';
      case 'pending':
        return 'warning';
      case 'timeout':
        return 'warning';
      default:
        return 'secondary';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'success':
        return <CheckCircleIcon className="w-4 h-4" />;
      case 'failed':
      case 'timeout':
        return <XCircleIcon className="w-4 h-4" />;
      case 'pending':
        return <ClockIcon className="w-4 h-4" />;
      default:
        return <ClockIcon className="w-4 h-4" />;
    }
  };

  const formatResponseTime = (ms) => {
    if (ms < 1000) return `${ms}ms`;
    return `${(ms / 1000).toFixed(2)}s`;
  };

  const footer = (
    <>
      <Button variant="outline" onClick={handleClose}>
        Close
      </Button>
      <Button
        variant="outline"
        onClick={() => loadLogs(currentPage)}
        loading={loading}
        icon={<ArrowPathIcon className="w-4 h-4" />}
      >
        Refresh
      </Button>
    </>
  );

  return (
    <>
      <Modal
        isOpen={isOpen}
        onClose={handleClose}
        title={`Webhook Logs - ${webhookName}`}
        size="xl"
        footer={footer}
      >
        <div className="space-y-4">
          {/* Error Alert */}
          {error && (
            <Alert variant="danger" dismissible onDismiss={() => setError('')}>
              {error}
            </Alert>
          )}

          {/* Stats Summary */}
          {logs.length > 0 && (
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="grid grid-cols-4 gap-4 text-center">
                <div>
                  <div className="text-lg font-semibold text-gray-900">{totalCount}</div>
                  <div className="text-xs text-gray-500">Total Calls</div>
                </div>
                <div>
                  <div className="text-lg font-semibold text-green-600">
                    {logs.filter(log => log.status === 'success').length}
                  </div>
                  <div className="text-xs text-gray-500">Successful</div>
                </div>
                <div>
                  <div className="text-lg font-semibold text-red-600">
                    {logs.filter(log => log.status === 'failed' || log.status === 'timeout').length}
                  </div>
                  <div className="text-xs text-gray-500">Failed</div>
                </div>
                <div>
                  <div className="text-lg font-semibold text-yellow-600">
                    {logs.filter(log => log.status === 'pending').length}
                  </div>
                  <div className="text-xs text-gray-500">Pending</div>
                </div>
              </div>
            </div>
          )}

          {/* Loading State */}
          {loading && logs.length === 0 && (
            <div className="flex items-center justify-center py-12">
              <LoadingSpinner size="lg" />
            </div>
          )}

          {/* Empty State */}
          {!loading && logs.length === 0 && !error && (
            <div className="text-center py-12">
              <DocumentTextIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No logs found</h3>
              <p className="text-gray-600">
                This webhook hasn't been triggered yet or logs have been cleared.
              </p>
            </div>
          )}

          {/* Logs List */}
          {logs.length > 0 && (
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {logs.map((log) => (
                <div key={log.id} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <div className="flex items-center space-x-1">
                          {getStatusIcon(log.status)}
                          <StatusBadge status={getStatusColor(log.status)}>
                            {log.status}
                          </StatusBadge>
                        </div>
                        
                        {log.status_code && (
                          <span className={`text-sm font-mono px-2 py-1 rounded ${
                            log.status_code >= 200 && log.status_code < 300
                              ? 'bg-green-100 text-green-800'
                              : log.status_code >= 400
                              ? 'bg-red-100 text-red-800'
                              : 'bg-gray-100 text-gray-800'
                          }`}>
                            {log.status_code}
                          </span>
                        )}
                        
                        {log.response_time && (
                          <span className="text-sm text-gray-600">
                            {formatResponseTime(log.response_time)}
                          </span>
                        )}
                      </div>
                      
                      <div className="text-sm text-gray-900 mb-1">
                        <span className="font-medium">Event:</span> {log.event_type}
                      </div>
                      
                      {log.error_message && (
                        <div className="text-sm text-red-600 mb-2">
                          <span className="font-medium">Error:</span> {log.error_message}
                        </div>
                      )}
                      
                      <div className="text-xs text-gray-500">
                        {formatDistanceToNow(new Date(log.created_at), { addSuffix: true })}
                        {log.retry_count > 0 && (
                          <span className="ml-2">• Retry #{log.retry_count}</span>
                        )}
                      </div>
                    </div>
                    
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleViewDetails(log)}
                      icon={<EyeIcon className="w-4 h-4" />}
                    >
                      Details
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="mt-4">
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={(page) => {
                  setCurrentPage(page);
                  loadLogs(page);
                }}
                showInfo
                totalItems={totalCount}
                itemsPerPage={limit}
              />
            </div>
          )}
        </div>
      </Modal>

      {/* Log Details Modal */}
      {selectedLog && (
        <Modal
          isOpen={detailsModalOpen}
          onClose={() => setDetailsModalOpen(false)}
          title="Webhook Log Details"
          size="lg"
        >
          <div className="space-y-6 p-6">
            {/* Basic Info */}
            <div>
              <h4 className="text-sm font-medium text-gray-900 mb-3">Request Information</h4>
              <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <span className="text-sm font-medium text-gray-700">Event Type:</span>
                    <p className="text-sm text-gray-900">{selectedLog.event_type}</p>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-gray-700">Status:</span>
                    <div className="flex items-center space-x-2 mt-1">
                      {getStatusIcon(selectedLog.status)}
                      <StatusBadge status={getStatusColor(selectedLog.status)}>
                        {selectedLog.status}
                      </StatusBadge>
                    </div>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <span className="text-sm font-medium text-gray-700">HTTP Method:</span>
                    <p className="text-sm text-gray-900">{selectedLog.method || 'POST'}</p>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-gray-700">Response Time:</span>
                    <p className="text-sm text-gray-900">
                      {selectedLog.response_time ? formatResponseTime(selectedLog.response_time) : 'N/A'}
                    </p>
                  </div>
                </div>
                
                {selectedLog.retry_count > 0 && (
                  <div>
                    <span className="text-sm font-medium text-gray-700">Retry Count:</span>
                    <p className="text-sm text-gray-900">{selectedLog.retry_count}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Response Info */}
            {(selectedLog.status_code || selectedLog.response_body) && (
              <div>
                <h4 className="text-sm font-medium text-gray-900 mb-3">Response Information</h4>
                <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                  {selectedLog.status_code && (
                    <div>
                      <span className="text-sm font-medium text-gray-700">Status Code:</span>
                      <span className={`ml-2 text-sm font-mono px-2 py-1 rounded ${
                        selectedLog.status_code >= 200 && selectedLog.status_code < 300
                          ? 'bg-green-100 text-green-800'
                          : selectedLog.status_code >= 400
                          ? 'bg-red-100 text-red-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {selectedLog.status_code}
                      </span>
                    </div>
                  )}
                  
                  {selectedLog.response_body && (
                    <div>
                      <span className="text-sm font-medium text-gray-700">Response Body:</span>
                      <div className="bg-white rounded p-3 border mt-1">
                        <pre className="text-xs text-gray-900 whitespace-pre-wrap overflow-x-auto">
                          {typeof selectedLog.response_body === 'string' 
                            ? selectedLog.response_body 
                            : JSON.stringify(selectedLog.response_body, null, 2)
                          }
                        </pre>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Error Info */}
            {selectedLog.error_message && (
              <div>
                <h4 className="text-sm font-medium text-gray-900 mb-3">Error Information</h4>
                <div className="bg-red-50 rounded-lg p-4">
                  <p className="text-sm text-red-800">{selectedLog.error_message}</p>
                </div>
              </div>
            )}

            {/* Request Payload */}
            {selectedLog.request_body && (
              <div>
                <h4 className="text-sm font-medium text-gray-900 mb-3">Request Payload</h4>
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="bg-white rounded p-3 border">
                    <pre className="text-xs text-gray-900 whitespace-pre-wrap overflow-x-auto">
                      {typeof selectedLog.request_body === 'string' 
                        ? selectedLog.request_body 
                        : JSON.stringify(selectedLog.request_body, null, 2)
                      }
                    </pre>
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
                  <span>{new Date(selectedLog.created_at).toLocaleString()}</span>
                </div>
                {selectedLog.sent_at && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Sent:</span>
                    <span>{new Date(selectedLog.sent_at).toLocaleString()}</span>
                  </div>
                )}
                {selectedLog.completed_at && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Completed:</span>
                    <span>{new Date(selectedLog.completed_at).toLocaleString()}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </Modal>
      )}
    </>
  );
};

export default WebhookLogsModal;