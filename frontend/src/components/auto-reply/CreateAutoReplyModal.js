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
  Cog6ToothIcon,
  InformationCircleIcon
} from '@heroicons/react/24/outline';

const CreateAutoReplyModal = ({ 
  isOpen, 
  onClose, 
  onSubmit, 
  autoReply = null,
  devices = [],
  loading = false 
}) => {
  const [error, setError] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  
  const isEdit = !!autoReply;
  
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    watch,
    setValue
  } = useForm();

  const replyType = watch('reply_type', 'text');
  const triggerType = watch('trigger_type', 'keyword');

  useEffect(() => {
    setValue('reply_type', 'text');
    setValue('trigger_type', 'keyword');
    setValue('priority', 1);
    setValue('is_active', true);
    
    if (autoReply) {
      // Populate form with auto reply data
      setValue('name', autoReply.name || '');
      setValue('description', autoReply.description || '');
      setValue('trigger_type', autoReply.trigger_type || 'keyword');
      setValue('keywords', autoReply.keywords || '');
      setValue('case_sensitive', autoReply.case_sensitive || false);
      setValue('reply_type', autoReply.reply_type || 'text');
      setValue('reply_message', autoReply.reply_message || '');
      setValue('device_id', autoReply.device_id || '');
      setValue('priority', autoReply.priority || 1);
      setValue('is_active', autoReply.is_active !== false);
      setValue('delay_min', autoReply.delay_min || 1);
      setValue('delay_max', autoReply.delay_max || 3);
    } else {
      reset();
    }
  }, [autoReply, setValue, reset]);

  const handleClose = () => {
    reset();
    setError('');
    setSelectedFile(null);
    setPreviewUrl(null);
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

  const handleFormSubmit = async (data) => {
    try {
      setError('');
      
      const formData = new FormData();
      formData.append('name', data.name);
      formData.append('description', data.description || '');
      formData.append('trigger_type', data.trigger_type);
      formData.append('keywords', data.keywords);
      formData.append('case_sensitive', data.case_sensitive);
      formData.append('reply_type', data.reply_type);
      formData.append('reply_message', data.reply_message);
      formData.append('device_id', data.device_id || '');
      formData.append('priority', data.priority);
      formData.append('is_active', data.is_active);
      formData.append('delay_min', data.delay_min || 1);
      formData.append('delay_max', data.delay_max || 3);
      
      if (selectedFile) {
        formData.append('media', selectedFile);
      }
      
      await onSubmit(formData);
      handleClose();
    } catch (err) {
      setError(err.message || `Failed to ${isEdit ? 'update' : 'create'} auto reply`);
    }
  };

  const tabs = [
    {
      key: 'basic',
      label: 'Basic Info',
      icon: <InformationCircleIcon className="w-4 h-4" />
    },
    {
      key: 'trigger',
      label: 'Trigger',
      icon: <Cog6ToothIcon className="w-4 h-4" />
    },
    {
      key: 'reply',
      label: 'Reply',
      icon: <ChatBubbleLeftRightIcon className="w-4 h-4" />
    }
  ];

  const triggerTypes = [
    { value: 'keyword', label: 'Keyword Match', description: 'Trigger when message contains specific keywords' },
    { value: 'contains', label: 'Contains Text', description: 'Trigger when message contains the text anywhere' },
    { value: 'starts_with', label: 'Starts With', description: 'Trigger when message starts with the text' },
    { value: 'ends_with', label: 'Ends With', description: 'Trigger when message ends with the text' },
    { value: 'exact', label: 'Exact Match', description: 'Trigger only when message exactly matches the text' },
    { value: 'regex', label: 'Regular Expression', description: 'Advanced pattern matching using regex' }
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
        form="auto-reply-form"
        loading={loading}
      >
        {isEdit ? 'Update Auto Reply' : 'Create Auto Reply'}
      </Button>
    </>
  );

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={isEdit ? 'Edit Auto Reply' : 'Create New Auto Reply'}
      size="xl"
      footer={footer}
      closeOnOverlayClick={!loading}
    >
      <form id="auto-reply-form" onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
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
                label="Auto Reply Name"
                placeholder="Enter auto reply name"
                required
                error={errors.name?.message}
                {...register('name', {
                  required: 'Auto reply name is required',
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

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Device (Optional)
                  </label>
                  <select
                    className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    {...register('device_id')}
                  >
                    <option value="">All devices</option>
                    {devices.map((device) => (
                      <option key={device.id} value={device.id}>
                        {device.name} ({device.phone_number || 'No number'})
                      </option>
                    ))}
                  </select>
                </div>

                <Input
                  label="Priority"
                  type="number"
                  min="1"
                  max="100"
                  placeholder="1"
                  helperText="Lower numbers = higher priority"
                  error={errors.priority?.message}
                  {...register('priority', {
                    required: 'Priority is required',
                    min: { value: 1, message: 'Priority must be at least 1' },
                    max: { value: 100, message: 'Priority must not exceed 100' }
                  })}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="Min Delay (seconds)"
                  type="number"
                  min="1"
                  max="60"
                  placeholder="1"
                  error={errors.delay_min?.message}
                  {...register('delay_min', {
                    min: { value: 1, message: 'Min delay must be at least 1 second' },
                    max: { value: 60, message: 'Min delay must not exceed 60 seconds' }
                  })}
                />

                <Input
                  label="Max Delay (seconds)"
                  type="number"
                  min="1"
                  max="60"
                  placeholder="3"
                  error={errors.delay_max?.message}
                  {...register('delay_max', {
                    min: { value: 1, message: 'Max delay must be at least 1 second' },
                    max: { value: 60, message: 'Max delay must not exceed 60 seconds' }
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
                  Enable auto reply immediately
                </label>
              </div>
            </div>
          </TabPanel>

          {/* Trigger Configuration */}
          <TabPanel tabKey="trigger">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Trigger Type
                </label>
                <div className="space-y-2">
                  {triggerTypes.map((type) => (
                    <label key={type.value} className="flex items-start">
                      <input
                        type="radio"
                        value={type.value}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 mt-1"
                        {...register('trigger_type')}
                      />
                      <div className="ml-3">
                        <div className="text-sm font-medium text-gray-900">{type.label}</div>
                        <div className="text-xs text-gray-500">{type.description}</div>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {triggerType === 'regex' ? 'Regular Expression Pattern' : 'Keywords/Text'} <span className="text-red-500">*</span>
                </label>
                <textarea
                  placeholder={
                    triggerType === 'keyword' ? 'Enter keywords separated by commas (e.g., hello, hi, halo)' :
                    triggerType === 'regex' ? 'Enter regular expression pattern (e.g., ^(hello|hi).*$)' :
                    'Enter the text to match'
                  }
                  rows={3}
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  {...register('keywords', {
                    required: 'Keywords/pattern is required'
                  })}
                />
                {errors.keywords && (
                  <p className="mt-1 text-sm text-red-600">{errors.keywords.message}</p>
                )}
                
                {triggerType === 'keyword' && (
                  <p className="mt-1 text-xs text-gray-500">
                    Separate multiple keywords with commas. Auto reply will trigger if any keyword is found.
                  </p>
                )}
                
                {triggerType === 'regex' && (
                  <p className="mt-1 text-xs text-gray-500">
                    Use JavaScript regular expression syntax. Be careful with complex patterns.
                  </p>
                )}
              </div>

              {triggerType !== 'regex' && (
                <div className="flex items-center">
                  <input
                    id="case_sensitive"
                    type="checkbox"
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    {...register('case_sensitive')}
                  />
                  <label htmlFor="case_sensitive" className="ml-2 block text-sm text-gray-900">
                    Case sensitive matching
                  </label>
                </div>
              )}

              <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <InformationCircleIcon className="h-5 w-5 text-blue-400" />
                  </div>
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-blue-800">
                      Trigger Examples
                    </h3>
                    <div className="mt-2 text-sm text-blue-700">
                      <ul className="list-disc list-inside space-y-1">
                        <li><strong>Keyword:</strong> "hello, hi, halo" - triggers on any of these words</li>
                        <li><strong>Contains:</strong> "help" - triggers if message contains "help" anywhere</li>
                        <li><strong>Starts with:</strong> "order" - triggers if message starts with "order"</li>
                        <li><strong>Exact:</strong> "yes" - triggers only if message is exactly "yes"</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </TabPanel>

          {/* Reply Configuration */}
          <TabPanel tabKey="reply">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Reply Type
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
                        {...register('reply_type')}
                      />
                      <div className={`
                        flex flex-col items-center p-3 border-2 rounded-lg cursor-pointer transition-colors
                        ${replyType === value 
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
                  Reply Message <span className="text-red-500">*</span>
                </label>
                <textarea
                  placeholder="Enter your auto reply message..."
                  rows={6}
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  {...register('reply_message', {
                    required: 'Reply message is required',
                    maxLength: {
                      value: 4096,
                      message: 'Message must not exceed 4096 characters'
                    }
                  })}
                />
                {errors.reply_message && (
                  <p className="mt-1 text-sm text-red-600">{errors.reply_message.message}</p>
                )}
                
                <p className="mt-1 text-xs text-gray-500">
                  You can use variables like {'{name}'}, {'{phone}'} in your message (if supported by backend).
                </p>
              </div>

              {replyType !== 'text' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Media File
                  </label>
                  <input
                    type="file"
                    accept={
                      replyType === 'image' ? 'image/*' :
                      replyType === 'video' ? 'video/*' :
                      '.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt'
                    }
                    onChange={handleFileChange}
                    className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                  />
                  
                  {previewUrl && replyType === 'image' && (
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

              <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <InformationCircleIcon className="h-5 w-5 text-yellow-400" />
                  </div>
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-yellow-800">
                      Auto Reply Best Practices
                    </h3>
                    <div className="mt-2 text-sm text-yellow-700">
                      <ul className="list-disc list-inside space-y-1">
                        <li>Keep messages concise and helpful</li>
                        <li>Set appropriate delays to avoid spam detection</li>
                        <li>Use higher priority (lower numbers) for important replies</li>
                        <li>Test your auto replies before enabling them</li>
                        <li>Monitor performance and adjust as needed</li>
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

export default CreateAutoReplyModal;