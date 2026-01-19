import { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useSocket } from '../../hooks/useSocket';
import WebhookList from '../../components/webhooks/WebhookList';
import Alert from '../../components/common/Alert';
import { hasPermission } from '../../utils/constants/permissions';

const WebhooksPage = () => {
  const { user } = useAuth();
  const [error, setError] = useState('');
  const { isConnected } = useSocket();

  // Check permissions
  const canManageWebhooks = hasPermission(user, 'webhooks.manage');
  const canViewWebhooks = hasPermission(user, 'webhooks.view');

  if (!canViewWebhooks) {
    return (
      <div className="p-6">
        <Alert variant="warning">
          You don't have permission to view webhooks. Please contact your administrator.
        </Alert>
      </div>
    );
  }

  const handleWebhookSelect = (webhookId, action) => {
    switch (action) {
      case 'logs':
        // Navigate to webhook logs or open logs modal
        console.log('View logs for webhook:', webhookId);
        // TODO: Implement webhook logs modal or navigation
        break;
      case 'edit':
        console.log('Edit webhook:', webhookId);
        break;
      default:
        console.log('Webhook selected:', webhookId, action);
    }
  };

  return (
    <div className="space-y-6">
      {/* Connection Status Alert */}
      {!isConnected && (
        <Alert variant="warning" className="mb-4">
          Real-time updates are currently unavailable. Some webhook events may not be reflected immediately.
        </Alert>
      )}

      {/* Error Alert */}
      {error && (
        <Alert 
          variant="danger" 
          dismissible 
          onDismiss={() => setError('')}
          className="mb-4"
        >
          {error}
        </Alert>
      )}

      {/* Webhook List */}
      <WebhookList
        showHeader={true}
        showFilters={true}
        showPagination={true}
        limit={10}
        onWebhookSelect={handleWebhookSelect}
        className="bg-white rounded-lg shadow"
      />

      {/* Help Section */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
        <h3 className="text-lg font-medium text-blue-900 mb-3">
          About Webhooks
        </h3>
        <div className="text-sm text-blue-800 space-y-2">
          <p>
            Webhooks allow you to receive real-time notifications when events occur in your WhatsApp system.
            Configure webhook endpoints to integrate with your external systems and applications.
          </p>
          <div className="mt-4">
            <h4 className="font-medium mb-2">Available Events:</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
              <div>• Message Received/Sent/Delivered</div>
              <div>• Device Connected/Disconnected</div>
              <div>• Campaign Started/Completed</div>
              <div>• Auto Reply Triggered</div>
              <div>• Contact Added/Updated</div>
              <div>• QR Code Updated</div>
            </div>
          </div>
          <div className="mt-4">
            <h4 className="font-medium mb-2">Security Features:</h4>
            <div className="text-xs space-y-1">
              <div>• HMAC-SHA256 signature verification with secret keys</div>
              <div>• Custom headers support for authentication</div>
              <div>• Configurable timeout and retry mechanisms</div>
              <div>• Detailed logging and error tracking</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WebhooksPage;