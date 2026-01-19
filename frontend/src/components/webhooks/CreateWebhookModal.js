import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import Modal from '../common/Modal';
import Input from '../common/Input';
import Button from '../common/Button';
import Alert from '../common/Alert';
import Tabs, { TabPanel } from '../common/Tabs';
import { 
  LinkIcon,
  Cog6ToothIcon,
  InformationCircleIcon,
  PlusIcon,
  TrashIcon
} from '@heroicons/react/24/outline';

const CreateWebhookModal = ({ 
  isOpen, 
  onClose, 
  onSubmit, 
  webhook = null,
  loading = false 
}) => {
  const [error, setError] = useState('');
  const [customHeaders, setCustomHeaders] = useState([]);
  const [selectedEvents, setSelectedEvents] = useState([]);
  
  const isEdit = !!webhook;
  
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    watch,
    setValue
  } = useForm();

  const method = watch('method', 'POST');

  // Available webhook events
  const availableEvents = [
    { value: 'message.received', label: 'Message Received', description: 'When a new message is received' },
    { value: 'message.sent', label: 'Message Sent', description: 'When a message is successfully sent' },
    { value: 'message.delivered', label: 'Message Delivered', description: 'When a message is delivered' },
    { value: 'message.read', label: 'Message Read', description: 'When a message is read by recipient' },
    { value: 'message.failed', label: 'Message Failed', description: 'When a message fails to send' },
    { value: 'device.connected', label: 'Device Connected', description: 'When a device connects successfully' },
    { value: 'device.disconnected', label: 'Device Disconnected', description: 'When a device disconnects' },
    { value: 'device.qr_updated', label: 'QR Code Updated', description: 'When device QR code is updated' },
    { value: 'contact.added', label: 'Contact Added', description: 'When a new contact is added' },
    { value: 'contact.updated', label: 'Contact Updated', description: 'When a contact is updated' },
    { value: 'campaign.started', label: 'Campaign Started', description: 'When a campaign starts' },
    { value: 'campaign.completed', label: 'Campaign Completed', description: 'When a campaign completes' },
    { value: 'auto_reply.triggered', label: 'Auto Reply Triggered', description: 'When an auto reply is triggered' }
  ];

  useEffect(() => {
    if (webhook) {
      // Populate form with webhook data
      setValue('name', webhook.name || '');
      setValue('description', webhook.description || '');
      setValue('url', webhook.url || '');
      setValue('method', webhook.method || 'POST');
      setValue('timeout', webhook.timeout || 30);
      setValue('is_active', webhook.is_active !== false);
      setValue('secret', webhook.secret || '');
      
      setSelectedEvents(webhook.events || []);
      setCustomHeaders(
        webhook.headers 
          ? Object.entries(webhook.headers).map(([key, value]) => ({ key, value }))
          : []
      );
    } else {
      reset();
      setSelectedEvents([]);
      setCustomHeaders([]);
    }
  }, [webhook, setValue, reset]);

  const handleClose = () => {
    reset();
    setError('');
    setSelectedEvents([]);
    setCustomHeaders([]);
    onClose();
  };

  const handleEventToggle = (eventValue) => {
    setSelectedEvents(prev => 
      prev.includes(eventValue)
        ? prev.filter(e => e !== eventValue)
        : [...prev, eventValue]
    );
  };

  const addCustomHeader = () => {
    setCustomHeaders(prev => [...prev, { key: '', value: '' }]);
  };

  const removeCustomHeader = (index) => {
    setCustomHeaders(prev => prev.filter((_, i) => i !== index));
  };

  const updateCustomHeader = (index, field, value) => {
    setCustomHeaders(prev => 
      prev.map((header, i) => 
        i === index ? { ...header, [field]: value } : header
      )
    );
  };

  const handleFormSubmit = async (data) => {
    try {
      setError('');
      
      if (selectedEvents.length === 0) {
        setError('Please select at least one event to listen for');
        return;
      }
      
      // Prepare headers object
      const headers = {};
      customHeaders.forEach(({ key, value }) => {
        if (key.trim() && value.trim()) {
          headers[key.trim()] = value.trim();
        }
      });
      
      const webhookData = {
        name: data.name,
        description: data.description || '',
        url: data.url,
        method: data.method,
        timeout: parseInt(data.timeout) || 30,
        is_active: data.is_active,
        secret: data.secret || '',
        events: selectedEvents,
        headers: Object.keys(headers).length > 0 ? headers : null
      };
      
      await onSubmit(webhookData);
      handleClose();
    } catch (err) {
      setError(err.message || `Failed to ${isEdit ? 'update' : 'create'} webhook`);
    }
  };

  const tabs = [
    {
      key: 'basic',
      label: 'Basic Info',
      icon: <InformationCircleIcon className="w-4 h-4" />
    },
    {
      key: 'events',
      label: 'Events',
      icon: <LinkIcon className="w-4 h-4" />
    },
    {
      key: 'advanced',
      label: 'Advanced',
      icon: <Cog6ToothIcon className="w-4 h-4" />
    }
  ];

  const footer = (
    <>
      <Button
        variant="outline"
        onClick={handleClose}
        disabled={loading}
      >
        Cancel
      </Button>
      <Button
        type="submit"
        form="webhook-form"
        loading={loading}
      >
        {isEdit ? 'Update Webhook' : 'Create Webhook'}
      </Button>
    </>
  );

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={isEdit ? 'Edit Webhook' : 'Create New Webhook'}
      size="xl"
      footer={footer}
      closeOnOverlayClick={!loading}
    >
      <form id="webhook-form" onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
        {error && (
          <Alert variant="danger" dismissible onDismiss={() => setError('')}>
            {error}
          </Alert>
        )}

        <Tabs
          tabs={tabs}
          defaultTab="basic"
          variant="underline"
        >
          {/* Basic Information */}
          <TabPanel tabKey="basic">
            <div className="space-y-4">
              <Input
                label="Webhook Name"
                placeholder="Enter webhook name"
                required
                error={errors.name?.message}
                {...register('name', {
                  required: 'Webhook name is required',
                  minLength: {
                    value: 3,
                    message: 'Name must be at least 3 characters'
                  },
                  maxLength: {
                    value: 100,
                    message: 'Name must not exceed 100 characters'
                  }
                })}
              />

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  placeholder="Enter description (optional)"
                  rows={3}
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  {...register('description', {
                    maxLength: {
                      value: 500,
                      message: 'Description must not exceed 500 characters'
                    }
                  })}
                />
                {errors.description && (
                  <p className="mt-1 text-sm text-red-600">{errors.description.message}</p>
                )}
              </div>

              <Input
                label="Webhook URL"
                type="url"
                placeholder="https://your-server.com/webhook"
                required
                error={errors.url?.message}
                {...register('url', {
                  required: 'Webhook URL is required',
                  pattern: {
                    value: /^https?:\/\/.+/,
                    message: 'Please enter a valid URL (http:// or https://)'
                  }
                })}
              />

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    HTTP Method
                  </label>
                  <select
                    className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    {...register('method')}
                  >
                    <option value="POST">POST</option>
                    <option value="PUT">PUT</option>
                    <option value="PATCH">PATCH</option>
                  </select>
                </div>

                <Input
                  label="Timeout (seconds)"
                  type="number"
                  min="5"
                  max="300"
                  placeholder="30"
                  error={errors.timeout?.message}
                  {...register('timeout', {
                    min: { value: 5, message: 'Timeout must be at least 5 seconds' },
                    max: { value: 300, message: 'Timeout must not exceed 300 seconds' }
                  })}
                />
              </div>

              <div className="flex items-center">
                <input
                  id="is_active"
                  type="checkbox"
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  {...register('is_active')}
                />
                <label htmlFor="is_active" className="ml-2 block text-sm text-gray-900">
                  Enable webhook immediately
                </label>
              </div>
            </div>
          </TabPanel>

          {/* Events Configuration */}
          <TabPanel tabKey="events">
            <div className="space-y-4">
              <div>
                <h4 className="text-sm font-medium text-gray-900 mb-3">
                  Select Events to Listen For
                </h4>
                <p className="text-sm text-gray-600 mb-4">
                  Choose which events should trigger this webhook. You can select multiple events.
                </p>
                
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {availableEvents.map((event) => (
                    <label key={event.value} className="flex items-start space-x-3 p-3 border rounded-lg hover:bg-gray-50 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={selectedEvents.includes(event.value)}
                        onChange={() => handleEventToggle(event.value)}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded mt-1"
                      />
                      <div className="flex-1">
                        <div className="text-sm font-medium text-gray-900">{event.label}</div>
                        <div className="text-xs text-gray-500">{event.description}</div>
                        <div className="text-xs text-gray-400 font-mono mt-1">{event.value}</div>
                      </div>
                    </label>
                  ))}
                </div>
                
                {selectedEvents.length > 0 && (
                  <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <div className="text-sm font-medium text-blue-900 mb-2">
                      Selected Events ({selectedEvents.length})
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {selectedEvents.map((event) => (
                        <span 
                          key={event}
                          className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-blue-100 text-blue-800"
                        >
                          {event}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </TabPanel>

          {/* Advanced Configuration */}
          <TabPanel tabKey="advanced">
            <div className="space-y-6">
              {/* Secret Key */}
              <div>
                <Input
                  label="Secret Key (Optional)"
                  type="password"
                  placeholder="Enter secret key for webhook verification"
                  helperText="Used to verify webhook authenticity via HMAC signature"
                  {...register('secret')}
                />
              </div>

              {/* Custom Headers */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-sm font-medium text-gray-900">Custom Headers</h4>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={addCustomHeader}
                    icon={<PlusIcon className="w-4 h-4" />}
                  >
                    Add Header
                  </Button>
                </div>
                
                {customHeaders.length === 0 ? (
                  <div className="text-sm text-gray-500 text-center py-4 border-2 border-dashed border-gray-300 rounded-lg">
                    No custom headers added. Click "Add Header" to add custom HTTP headers.
                  </div>
                ) : (
                  <div className="space-y-3">
                    {customHeaders.map((header, index) => (
                      <div key={index} className="flex items-center space-x-3">
                        <div className="flex-1">
                          <input
                            type="text"
                            placeholder="Header name (e.g., Authorization)"
                            value={header.key}
                            onChange={(e) => updateCustomHeader(index, 'key', e.target.value)}
                            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                          />
                        </div>
                        <div className="flex-1">
                          <input
                            type="text"
                            placeholder="Header value"
                            value={header.value}
                            onChange={(e) => updateCustomHeader(index, 'value', e.target.value)}
                            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                          />
                        </div>
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          onClick={() => removeCustomHeader(index)}
                          icon={<TrashIcon className="w-4 h-4" />}
                        />
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Webhook Information */}
              <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <InformationCircleIcon className="h-5 w-5 text-blue-400" />
                  </div>
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-blue-800">
                      Webhook Information
                    </h3>
                    <div className="mt-2 text-sm text-blue-700">
                      <ul className="list-disc list-inside space-y-1">
                        <li>Webhooks will be called with {method} method</li>
                        <li>Request body will contain event data in JSON format</li>
                        <li>Timeout is set to {watch('timeout') || 30} seconds</li>
                        <li>Failed webhooks will be retried up to 3 times</li>
                        <li>Use secret key for HMAC-SHA256 signature verification</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </TabPanel>
        </Tabs>
      </form>
    </Modal>
  );
};

export default CreateWebhookModal;