import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import Modal from '../common/Modal';
import Input from '../common/Input';
import Button from '../common/Button';
import Alert from '../common/Alert';
import Tabs, { TabPanel } from '../common/Tabs';
import { 
  ChatBubbleLeftRightIcon,
  PhotoIcon,
  VideoCameraIcon,
  DocumentIcon,
  UsersIcon,
  ClockIcon,
  CalendarIcon
} from '@heroicons/react/24/outline';

const CreateCampaignModal = ({ 
  isOpen, 
  onClose, 
  onSubmit, 
  campaign = null,
  devices = [],
  contacts = [],
  groups = [],
  loading = false 
}) => {
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('basic');
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [selectedTargets, setSelectedTargets] = useState([]);
  const [targetType, setTargetType] = useState('contacts');
  
  const isEdit = !!campaign;
  
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    watch,
    setValue
  } = useForm();

  const messageType = watch('message_type', 'text');
  const scheduleType = watch('schedule_type', 'now');

  useEffect(() => {
    setValue('message_type', 'text');
    setValue('schedule_type', 'now');
    
    if (campaign) {
      // Populate form with campaign data
      setValue('name', campaign.name || '');
      setValue('description', campaign.description || '');
      setValue('message_type', campaign.message_type || 'text');
      setValue('message_content', campaign.message_content || '');
      setValue('device_id', campaign.device_id || '');
      setValue('delay_min', campaign.delay_min || 1);
      setValue('delay_max', campaign.delay_max || 5);
      setValue('schedule_type', campaign.scheduled_at ? 'later' : 'now');
      
      if (campaign.scheduled_at) {
        const scheduledDate = new Date(campaign.scheduled_at);
        setValue('scheduled_date', scheduledDate.toISOString().split('T')[0]);
        setValue('scheduled_time', scheduledDate.toTimeString().slice(0, 5));
      }
      
      setSelectedTargets(campaign.targets || []);
    } else {
      reset();
      setSelectedTargets([]);
    }
  }, [campaign, setValue, reset]);

  const handleClose = () => {
    reset();
    setError('');
    setSelectedFile(null);
    setPreviewUrl(null);
    setSelectedTargets([]);
    setTargetType('contacts');
    setActiveTab('basic');
    onClose();
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedFile(file);
      
      // Create preview for images
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = (e) => setPreviewUrl(e.target.result);
        reader.readAsDataURL(file);
      } else {
        setPreviewUrl(null);
      }
    }
  };

  const handleTargetSelection = (target) => {
    const isSelected = selectedTargets.some(t => t.id === target.id);
    if (isSelected) {
      setSelectedTargets(prev => prev.filter(t => t.id !== target.id));
    } else {
      setSelectedTargets(prev => [...prev, target]);
    }
  };

  const handleSelectAllTargets = () => {
    const currentTargets = targetType === 'contacts' ? contacts : groups;
    if (selectedTargets.length === currentTargets.length) {
      setSelectedTargets([]);
    } else {
      setSelectedTargets(currentTargets);
    }
  };

  const handleFormSubmit = async (data) => {
    try {
      setError('');
      
      if (selectedTargets.length === 0) {
        setError('Please select at least one target');
        return;
      }
      
      const formData = new FormData();
      formData.append('name', data.name);
      formData.append('description', data.description || '');
      formData.append('message_type', data.message_type);
      formData.append('message_content', data.message_content);
      formData.append('device_id', data.device_id);
      formData.append('delay_min', data.delay_min);
      formData.append('delay_max', data.delay_max);
      formData.append('targets', JSON.stringify(selectedTargets.map(t => ({
        id: t.id,
        type: targetType === 'contacts' ? 'contact' : 'group'
      }))));
      
      if (data.schedule_type === 'later') {
        const scheduledDateTime = new Date(`${data.scheduled_date}T${data.scheduled_time}`);
        formData.append('scheduled_at', scheduledDateTime.toISOString());
      }
      
      if (selectedFile) {
        formData.append('media', selectedFile);
      }
      
      await onSubmit(formData);
      handleClose();
    } catch (err) {
      setError(err.message || `Failed to ${isEdit ? 'update' : 'create'} campaign`);
    }
  };

  const tabs = [
    {
      key: 'basic',
      label: 'Basic Info',
      icon: <ChatBubbleLeftRightIcon className="w-4 h-4" />
    },
    {
      key: 'message',
      label: 'Message',
      icon: <ChatBubbleLeftRightIcon className="w-4 h-4" />
    },
    {
      key: 'targets',
      label: 'Targets',
      icon: <UsersIcon className="w-4 h-4" />
    },
    {
      key: 'schedule',
      label: 'Schedule',
      icon: <CalendarIcon className="w-4 h-4" />
    }
  ];

  const availableDevices = devices.filter(device => device.status === 'connected');
  const currentTargets = targetType === 'contacts' ? contacts : groups;

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
        form="campaign-form"
        loading={loading}
      >
        {isEdit ? 'Update Campaign' : 'Create Campaign'}
      </Button>
    </>
  );

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={isEdit ? 'Edit Campaign' : 'Create New Campaign'}
      size="xl"
      footer={footer}
      closeOnOverlayClick={!loading}
    >
      <form id="campaign-form" onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
        {error && (
          <Alert variant="danger" dismissible onDismiss={() => setError('')}>
            {error}
          </Alert>
        )}

        {availableDevices.length === 0 && (
          <Alert variant="warning">
            No connected devices available. Please connect a device first.
          </Alert>
        )}

        <Tabs
          tabs={tabs}
          defaultTab="basic"
          onChange={setActiveTab}
          variant="underline"
        >
          {/* Basic Information */}
          <TabPanel tabKey="basic">
            <div className="space-y-4">
              <Input
                label="Campaign Name"
                placeholder="Enter campaign name"
                required
                error={errors.name?.message}
                {...register('name', {
                  required: 'Campaign name is required',
                  minLength: {
                    value: 3,
                    message: 'Campaign name must be at least 3 characters'
                  },
                  maxLength: {
                    value: 100,
                    message: 'Campaign name must not exceed 100 characters'
                  }
                })}
              />

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  placeholder="Enter campaign description (optional)"
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

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Device <span className="text-red-500">*</span>
                </label>
                <select
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  {...register('device_id', {
                    required: 'Please select a device'
                  })}
                >
                  <option value="">Select a device</option>
                  {availableDevices.map((device) => (
                    <option key={device.id} value={device.id}>
                      {device.name} ({device.phone_number || 'No number'})
                    </option>
                  ))}
                </select>
                {errors.device_id && (
                  <p className="mt-1 text-sm text-red-600">{errors.device_id.message}</p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="Min Delay (seconds)"
                  type="number"
                  min="1"
                  max="300"
                  placeholder="1"
                  error={errors.delay_min?.message}
                  {...register('delay_min', {
                    required: 'Min delay is required',
                    min: { value: 1, message: 'Min delay must be at least 1 second' },
                    max: { value: 300, message: 'Min delay must not exceed 300 seconds' }
                  })}
                />

                <Input
                  label="Max Delay (seconds)"
                  type="number"
                  min="1"
                  max="300"
                  placeholder="5"
                  error={errors.delay_max?.message}
                  {...register('delay_max', {
                    required: 'Max delay is required',
                    min: { value: 1, message: 'Max delay must be at least 1 second' },
                    max: { value: 300, message: 'Max delay must not exceed 300 seconds' }
                  })}
                />
              </div>
            </div>
          </TabPanel>

          {/* Message Content */}
          <TabPanel tabKey="message">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Message Type
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {[
                    { value: 'text', label: 'Text', icon: ChatBubbleLeftRightIcon },
                    { value: 'image', label: 'Image', icon: PhotoIcon },
                    { value: 'video', label: 'Video', icon: VideoCameraIcon },
                    { value: 'document', label: 'Document', icon: DocumentIcon }
                  ].map(({ value, label, icon: Icon }) => (
                    <label key={value} className="relative">
                      <input
                        type="radio"
                        value={value}
                        className="sr-only"
                        {...register('message_type')}
                      />
                      <div className={`
                        flex flex-col items-center p-3 border-2 rounded-lg cursor-pointer transition-colors
                        ${messageType === value 
                          ? 'border-blue-500 bg-blue-50 text-blue-700' 
                          : 'border-gray-200 hover:border-gray-300'
                        }
                      `}>
                        <Icon className="w-6 h-6 mb-1" />
                        <span className="text-xs font-medium">{label}</span>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Message Content <span className="text-red-500">*</span>
                </label>
                <textarea
                  placeholder="Enter your message content..."
                  rows={6}
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  {...register('message_content', {
                    required: 'Message content is required',
                    maxLength: {
                      value: 4096,
                      message: 'Message must not exceed 4096 characters'
                    }
                  })}
                />
                {errors.message_content && (
                  <p className="mt-1 text-sm text-red-600">{errors.message_content.message}</p>
                )}
              </div>

              {messageType !== 'text' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Media File
                  </label>
                  <input
                    type="file"
                    accept={
                      messageType === 'image' ? 'image/*' :
                      messageType === 'video' ? 'video/*' :
                      '.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt'
                    }
                    onChange={handleFileChange}
                    className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                  />
                  
                  {previewUrl && messageType === 'image' && (
                    <div className="mt-2">
                      <img 
                        src={previewUrl} 
                        alt="Preview" 
                        className="max-w-full h-48 object-cover rounded-lg"
                      />
                    </div>
                  )}
                </div>
              )}
            </div>
          </TabPanel>

          {/* Target Selection */}
          <TabPanel tabKey="targets">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Target Type
                </label>
                <div className="flex space-x-4">
                  <label className="flex items-center">
                    <input
                      type="radio"
                      value="contacts"
                      checked={targetType === 'contacts'}
                      onChange={(e) => {
                        setTargetType(e.target.value);
                        setSelectedTargets([]);
                      }}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                    />
                    <span className="ml-2 text-sm text-gray-700">Individual Contacts</span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="radio"
                      value="groups"
                      checked={targetType === 'groups'}
                      onChange={(e) => {
                        setTargetType(e.target.value);
                        setSelectedTargets([]);
                      }}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                    />
                    <span className="ml-2 text-sm text-gray-700">Contact Groups</span>
                  </label>
                </div>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-gray-700">
                  Select {targetType === 'contacts' ? 'Contacts' : 'Groups'} ({selectedTargets.length} selected)
                </span>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleSelectAllTargets}
                >
                  {selectedTargets.length === currentTargets.length ? 'Deselect All' : 'Select All'}
                </Button>
              </div>

              <div className="max-h-64 overflow-y-auto border border-gray-200 rounded-md">
                {currentTargets.length === 0 ? (
                  <div className="p-4 text-center text-gray-500">
                    No {targetType} available
                  </div>
                ) : (
                  <div className="divide-y divide-gray-200">
                    {currentTargets.map((target) => (
                      <label
                        key={target.id}
                        className="flex items-center p-3 hover:bg-gray-50 cursor-pointer"
                      >
                        <input
                          type="checkbox"
                          checked={selectedTargets.some(t => t.id === target.id)}
                          onChange={() => handleTargetSelection(target)}
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        />
                        <div className="ml-3 flex-1">
                          <div className="text-sm font-medium text-gray-900">
                            {target.name}
                          </div>
                          <div className="text-sm text-gray-500">
                            {targetType === 'contacts' ? target.phone_number : `${target.contact_count || 0} contacts`}
                          </div>
                        </div>
                      </label>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </TabPanel>

          {/* Schedule */}
          <TabPanel tabKey="schedule">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  When to send
                </label>
                <div className="space-y-2">
                  <label className="flex items-center">
                    <input
                      type="radio"
                      value="now"
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                      {...register('schedule_type')}
                    />
                    <span className="ml-2 text-sm text-gray-700">Send immediately</span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="radio"
                      value="later"
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                      {...register('schedule_type')}
                    />
                    <span className="ml-2 text-sm text-gray-700">Schedule for later</span>
                  </label>
                </div>
              </div>

              {scheduleType === 'later' && (
                <div className="grid grid-cols-2 gap-4">
                  <Input
                    label="Date"
                    type="date"
                    min={new Date().toISOString().split('T')[0]}
                    error={errors.scheduled_date?.message}
                    {...register('scheduled_date', {
                      required: scheduleType === 'later' ? 'Scheduled date is required' : false
                    })}
                  />

                  <Input
                    label="Time"
                    type="time"
                    error={errors.scheduled_time?.message}
                    {...register('scheduled_time', {
                      required: scheduleType === 'later' ? 'Scheduled time is required' : false
                    })}
                  />
                </div>
              )}

              <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <ClockIcon className="h-5 w-5 text-blue-400" />
                  </div>
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-blue-800">
                      Campaign Timing
                    </h3>
                    <div className="mt-2 text-sm text-blue-700">
                      <ul className="list-disc list-inside space-y-1">
                        <li>Messages will be sent with random delays between min and max delay</li>
                        <li>This helps avoid being detected as spam</li>
                        <li>Scheduled campaigns will start automatically at the specified time</li>
                        <li>You can pause or stop campaigns at any time</li>
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

export default CreateCampaignModal;