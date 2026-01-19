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
  MapPinIcon,
  UserIcon
} from '@heroicons/react/24/outline';

const SendMessageModal = ({ 
  isOpen, 
  onClose, 
  onSubmit, 
  devices = [],
  contacts = [],
  loading = false 
}) => {
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('text');
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    watch,
    setValue
  } = useForm();

  const messageType = watch('type', 'text');
  const recipient = watch('recipient');

  useEffect(() => {
    setValue('type', activeTab);
  }, [activeTab, setValue]);

  const handleClose = () => {
    reset();
    setError('');
    setSelectedFile(null);
    setPreviewUrl(null);
    setActiveTab('text');
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
      formData.append('recipient', data.recipient);
      formData.append('device_id', data.device_id);
      formData.append('type', data.type);
      
      if (data.type === 'text') {
        formData.append('content', data.content);
      } else if (data.type === 'location') {
        formData.append('latitude', data.latitude);
        formData.append('longitude', data.longitude);
        formData.append('address', data.address || '');
      } else {
        if (selectedFile) {
          formData.append('media', selectedFile);
        }
        if (data.caption) {
          formData.append('caption', data.caption);
        }
      }
      
      await onSubmit(formData);
      handleClose();
    } catch (err) {
      setError(err.message || 'Failed to send message');
    }
  };

  const tabs = [
    {
      key: 'text',
      label: 'Text',
      icon: <ChatBubbleLeftRightIcon className="w-4 h-4" />
    },
    {
      key: 'image',
      label: 'Image',
      icon: <PhotoIcon className="w-4 h-4" />
    },
    {
      key: 'video',
      label: 'Video',
      icon: <VideoCameraIcon className="w-4 h-4" />
    },
    {
      key: 'document',
      label: 'Document',
      icon: <DocumentIcon className="w-4 h-4" />
    },
    {
      key: 'location',
      label: 'Location',
      icon: <MapPinIcon className="w-4 h-4" />
    }
  ];

  const availableDevices = devices.filter(device => device.status === 'connected');

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
        form="send-message-form"
        loading={loading}
      >
        Send Message
      </Button>
    </>
  );

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Send Message"
      size="lg"
      footer={footer}
      closeOnOverlayClick={!loading}
    >
      <form id="send-message-form" onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
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

        {/* Recipient */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Recipient <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <input
              list="contacts"
              placeholder="Enter phone number (e.g., 628123456789)"
              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 pl-10"
              {...register('recipient', {
                required: 'Recipient is required',
                pattern: {
                  value: /^[1-9]\d{1,14}$/,
                  message: 'Please enter a valid phone number'
                }
              })}
            />
            <UserIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            
            <datalist id="contacts">
              {contacts.map((contact) => (
                <option key={contact.id} value={contact.phone_number}>
                  {contact.name} - {contact.phone_number}
                </option>
              ))}
            </datalist>
          </div>
          {errors.recipient && (
            <p className="mt-1 text-sm text-red-600">{errors.recipient.message}</p>
          )}
        </div>

        {/* Device Selection */}
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

        {/* Message Type Tabs */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Message Type
          </label>
          <Tabs
            tabs={tabs}
            defaultTab="text"
            onChange={setActiveTab}
            variant="pills"
          >
            {/* Text Message */}
            <TabPanel tabKey="text">
              <div className="mt-4">
                <textarea
                  placeholder="Enter your message..."
                  rows={4}
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  {...register('content', {
                    required: activeTab === 'text' ? 'Message content is required' : false,
                    maxLength: {
                      value: 4096,
                      message: 'Message must not exceed 4096 characters'
                    }
                  })}
                />
                {errors.content && (
                  <p className="mt-1 text-sm text-red-600">{errors.content.message}</p>
                )}
              </div>
            </TabPanel>

            {/* Image Message */}
            <TabPanel tabKey="image">
              <div className="mt-4 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Select Image
                  </label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                  />
                </div>
                
                {previewUrl && (
                  <div>
                    <img 
                      src={previewUrl} 
                      alt="Preview" 
                      className="max-w-full h-48 object-cover rounded-lg"
                    />
                  </div>
                )}
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Caption (Optional)
                  </label>
                  <textarea
                    placeholder="Enter image caption..."
                    rows={2}
                    className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    {...register('caption')}
                  />
                </div>
              </div>
            </TabPanel>

            {/* Video Message */}
            <TabPanel tabKey="video">
              <div className="mt-4 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Select Video
                  </label>
                  <input
                    type="file"
                    accept="video/*"
                    onChange={handleFileChange}
                    className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Caption (Optional)
                  </label>
                  <textarea
                    placeholder="Enter video caption..."
                    rows={2}
                    className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    {...register('caption')}
                  />
                </div>
              </div>
            </TabPanel>

            {/* Document Message */}
            <TabPanel tabKey="document">
              <div className="mt-4 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Select Document
                  </label>
                  <input
                    type="file"
                    accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt"
                    onChange={handleFileChange}
                    className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Caption (Optional)
                  </label>
                  <textarea
                    placeholder="Enter document description..."
                    rows={2}
                    className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    {...register('caption')}
                  />
                </div>
              </div>
            </TabPanel>

            {/* Location Message */}
            <TabPanel tabKey="location">
              <div className="mt-4 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <Input
                    label="Latitude"
                    type="number"
                    step="any"
                    placeholder="-6.2088"
                    error={errors.latitude?.message}
                    {...register('latitude', {
                      required: activeTab === 'location' ? 'Latitude is required' : false,
                      min: { value: -90, message: 'Invalid latitude' },
                      max: { value: 90, message: 'Invalid latitude' }
                    })}
                  />
                  
                  <Input
                    label="Longitude"
                    type="number"
                    step="any"
                    placeholder="106.8456"
                    error={errors.longitude?.message}
                    {...register('longitude', {
                      required: activeTab === 'location' ? 'Longitude is required' : false,
                      min: { value: -180, message: 'Invalid longitude' },
                      max: { value: 180, message: 'Invalid longitude' }
                    })}
                  />
                </div>
                
                <Input
                  label="Address (Optional)"
                  placeholder="Enter location address..."
                  {...register('address')}
                />
                
                <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
                  <p className="text-sm text-blue-700">
                    <strong>Tip:</strong> You can get coordinates from Google Maps by right-clicking on a location.
                  </p>
                </div>
              </div>
            </TabPanel>
          </Tabs>
        </div>

        <input type="hidden" {...register('type')} />
      </form>
    </Modal>
  );
};

export default SendMessageModal;