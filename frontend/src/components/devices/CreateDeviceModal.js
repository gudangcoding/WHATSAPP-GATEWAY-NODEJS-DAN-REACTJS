import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import Modal from '../common/Modal';
import Input from '../common/Input';
import Button from '../common/Button';
import Alert from '../common/Alert';

const CreateDeviceModal = ({ isOpen, onClose, onSubmit, loading = false }) => {
  const [error, setError] = useState('');
  
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset
  } = useForm();

  const handleClose = () => {
    reset();
    setError('');
    onClose();
  };

  const handleFormSubmit = async (data) => {
    try {
      setError('');
      await onSubmit(data);
      handleClose();
    } catch (err) {
      setError(err.message || 'Failed to create device');
    }
  };

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
        form="create-device-form"
        loading={loading}
      >
        Create Device
      </Button>
    </>
  );

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Create New Device"
      size="md"
      footer={footer}
      closeOnOverlayClick={!loading}
    >
      <form id="create-device-form" onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
        {error && (
          <Alert variant="danger" dismissible onDismiss={() => setError('')}>
            {error}
          </Alert>
        )}

        <Input
          label="Device Name"
          placeholder="Enter device name (e.g., Main Device, Support Team)"
          required
          error={errors.name?.message}
          {...register('name', {
            required: 'Device name is required',
            minLength: {
              value: 3,
              message: 'Device name must be at least 3 characters'
            },
            maxLength: {
              value: 50,
              message: 'Device name must not exceed 50 characters'
            }
          })}
        />

        <Input
          label="Description"
          placeholder="Optional description for this device"
          error={errors.description?.message}
          {...register('description', {
            maxLength: {
              value: 200,
              message: 'Description must not exceed 200 characters'
            }
          })}
        />

        <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-blue-800">
                What happens next?
              </h3>
              <div className="mt-2 text-sm text-blue-700">
                <ul className="list-disc list-inside space-y-1">
                  <li>Device will be created in "disconnected" state</li>
                  <li>Click "Start" to begin the pairing process</li>
                  <li>Scan the QR code with WhatsApp on your phone</li>
                  <li>Device will be ready to send/receive messages</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </form>
    </Modal>
  );
};

export default CreateDeviceModal;