import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import Modal from '../common/Modal';
import Input from '../common/Input';
import Button from '../common/Button';
import Alert from '../common/Alert';
import { TagIcon, XMarkIcon } from '@heroicons/react/24/outline';

const ContactModal = ({ 
  isOpen, 
  onClose, 
  onSubmit, 
  contact = null,
  groups = [],
  loading = false 
}) => {
  const [error, setError] = useState('');
  const [tags, setTags] = useState([]);
  const [tagInput, setTagInput] = useState('');
  
  const isEdit = !!contact;
  
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue
  } = useForm();

  useEffect(() => {
    if (contact) {
      // Populate form with contact data
      setValue('name', contact.name || '');
      setValue('phone_number', contact.phone_number || '');
      setValue('email', contact.email || '');
      setValue('group_id', contact.group_id || '');
      setValue('notes', contact.notes || '');
      setTags(contact.tags || []);
    } else {
      // Reset form for new contact
      reset();
      setTags([]);
    }
  }, [contact, setValue, reset]);

  const handleClose = () => {
    reset();
    setError('');
    setTags([]);
    setTagInput('');
    onClose();
  };

  const handleFormSubmit = async (data) => {
    try {
      setError('');
      
      const contactData = {
        ...data,
        tags: tags
      };
      
      await onSubmit(contactData);
      handleClose();
    } catch (err) {
      setError(err.message || `Failed to ${isEdit ? 'update' : 'create'} contact`);
    }
  };

  const addTag = () => {
    const tag = tagInput.trim();
    if (tag && !tags.includes(tag)) {
      setTags([...tags, tag]);
      setTagInput('');
    }
  };

  const removeTag = (tagToRemove) => {
    setTags(tags.filter(tag => tag !== tagToRemove));
  };

  const handleTagKeyPress = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addTag();
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
        form="contact-form"
        loading={loading}
      >
        {isEdit ? 'Update Contact' : 'Create Contact'}
      </Button>
    </>
  );

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={isEdit ? 'Edit Contact' : 'Create New Contact'}
      size="lg"
      footer={footer}
      closeOnOverlayClick={!loading}
    >
      <form id="contact-form" onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
        {error && (
          <Alert variant="danger" dismissible onDismiss={() => setError('')}>
            {error}
          </Alert>
        )}

        {/* Basic Information */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            label="Name"
            placeholder="Enter contact name"
            required
            error={errors.name?.message}
            {...register('name', {
              required: 'Name is required',
              minLength: {
                value: 2,
                message: 'Name must be at least 2 characters'
              },
              maxLength: {
                value: 100,
                message: 'Name must not exceed 100 characters'
              }
            })}
          />

          <Input
            label="Phone Number"
            placeholder="628123456789"
            required
            error={errors.phone_number?.message}
            {...register('phone_number', {
              required: 'Phone number is required',
              pattern: {
                value: /^[1-9]\d{1,14}$/,
                message: 'Please enter a valid phone number'
              }
            })}
          />
        </div>

        <Input
          label="Email"
          type="email"
          placeholder="contact@example.com"
          error={errors.email?.message}
          {...register('email', {
            pattern: {
              value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
              message: 'Please enter a valid email address'
            }
          })}
        />

        {/* Group Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Group
          </label>
          <select
            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            {...register('group_id')}
          >
            <option value="">No group</option>
            {groups.map((group) => (
              <option key={group.id} value={group.id}>
                {group.name}
              </option>
            ))}
          </select>
        </div>

        {/* Tags */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Tags
          </label>
          
          {/* Tag Input */}
          <div className="flex space-x-2 mb-2">
            <input
              type="text"
              placeholder="Add a tag..."
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyPress={handleTagKeyPress}
              className="flex-1 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            />
            <Button
              type="button"
              variant="outline"
              onClick={addTag}
              disabled={!tagInput.trim()}
              icon={<TagIcon className="w-4 h-4" />}
            >
              Add
            </Button>
          </div>
          
          {/* Tag List */}
          {tags.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {tags.map((tag, index) => (
                <span
                  key={index}
                  className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                >
                  {tag}
                  <button
                    type="button"
                    onClick={() => removeTag(tag)}
                    className="ml-1 inline-flex items-center justify-center w-4 h-4 rounded-full text-blue-400 hover:text-blue-600"
                  >
                    <XMarkIcon className="w-3 h-3" />
                  </button>
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Notes */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Notes
          </label>
          <textarea
            placeholder="Add notes about this contact..."
            rows={3}
            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            {...register('notes', {
              maxLength: {
                value: 1000,
                message: 'Notes must not exceed 1000 characters'
              }
            })}
          />
          {errors.notes && (
            <p className="mt-1 text-sm text-red-600">{errors.notes.message}</p>
          )}
        </div>

        {/* Help Text */}
        <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-blue-800">
                Contact Information
              </h3>
              <div className="mt-2 text-sm text-blue-700">
                <ul className="list-disc list-inside space-y-1">
                  <li>Phone number should be in international format without + sign</li>
                  <li>Tags help organize and filter contacts</li>
                  <li>Groups can be used for targeted campaigns</li>
                  <li>Notes are private and visible only to you</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </form>
    </Modal>
  );
};

export default ContactModal;