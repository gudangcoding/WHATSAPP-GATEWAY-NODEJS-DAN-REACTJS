import React, { useState } from 'react';
import { 
  UserIcon,
  PhoneIcon,
  ChatBubbleLeftRightIcon,
  PencilIcon,
  TrashIcon,
  EyeIcon,
  TagIcon
} from '@heroicons/react/24/outline';
import Card from '../common/Card';
import Button from '../common/Button';
import Badge from '../common/Badge';
import Modal from '../common/Modal';
import { formatDistanceToNow } from 'date-fns';
import { id } from 'date-fns/locale';

const ContactCard = ({ 
  contact, 
  onEdit, 
  onDelete,
  onSendMessage,
  onViewDetails,
  loading = false 
}) => {
  const [detailsModalOpen, setDetailsModalOpen] = useState(false);

  const handleViewDetails = () => {
    setDetailsModalOpen(true);
    if (onViewDetails) {
      onViewDetails(contact.id);
    }
  };

  const getContactInitials = (name) => {
    if (!name) return 'U';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const formatPhoneNumber = (phone) => {
    if (!phone) return '';
    // Format: +62 812-3456-789
    const cleaned = phone.replace(/\D/g, '');
    if (cleaned.startsWith('62')) {
      return `+${cleaned.slice(0, 2)} ${cleaned.slice(2, 5)}-${cleaned.slice(5, 9)}-${cleaned.slice(9)}`;
    }
    return phone;
  };

  return (
    <>
      <Card className="hover:shadow-md transition-shadow">
        <div className="flex items-start justify-between">
          <div className="flex items-start space-x-3 flex-1">
            <div className="flex-shrink-0">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                {contact.avatar_url ? (
                  <img 
                    src={contact.avatar_url} 
                    alt={contact.name}
                    className="w-12 h-12 rounded-full object-cover"
                  />
                ) : (
                  <span className="text-blue-600 font-medium text-sm">
                    {getContactInitials(contact.name)}
                  </span>
                )}
              </div>
            </div>
            
            <div className="flex-1 min-w-0">
              <h4 className="text-lg font-medium text-gray-900 truncate">
                {contact.name || 'Unknown Contact'}
              </h4>
              
              <div className="flex items-center space-x-1 mt-1">
                <PhoneIcon className="w-4 h-4 text-gray-400" />
                <span className="text-sm text-gray-600">
                  {formatPhoneNumber(contact.phone_number)}
                </span>
              </div>
              
              {contact.email && (
                <p className="text-sm text-gray-500 mt-1">
                  {contact.email}
                </p>
              )}
              
              {contact.tags && contact.tags.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-2">
                  {contact.tags.slice(0, 3).map((tag, index) => (
                    <Badge key={index} variant="secondary" size="xs">
                      {tag}
                    </Badge>
                  ))}
                  {contact.tags.length > 3 && (
                    <Badge variant="secondary" size="xs">
                      +{contact.tags.length - 3}
                    </Badge>
                  )}
                </div>
              )}
              
              <div className="flex items-center space-x-4 mt-3 text-xs text-gray-500">
                {contact.last_message_at && (
                  <span>
                    Last message: {formatDistanceToNow(new Date(contact.last_message_at), { 
                      addSuffix: true,
                      locale: id 
                    })}
                  </span>
                )}
                
                {contact.message_count > 0 && (
                  <span>{contact.message_count} messages</span>
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
              variant="primary"
              onClick={() => onSendMessage(contact)}
              icon={<ChatBubbleLeftRightIcon className="w-4 h-4" />}
            />
            
            <Button
              size="sm"
              variant="outline"
              onClick={() => onEdit(contact)}
              icon={<PencilIcon className="w-4 h-4" />}
            />
            
            <Button
              size="sm"
              variant="outline"
              onClick={() => onDelete(contact.id)}
              loading={loading}
              icon={<TrashIcon className="w-4 h-4" />}
            />
          </div>
        </div>
      </Card>

      {/* Contact Details Modal */}
      <Modal
        isOpen={detailsModalOpen}
        onClose={() => setDetailsModalOpen(false)}
        title="Contact Details"
        size="lg"
      >
        <div className="space-y-6">
          {/* Contact Info */}
          <div className="flex items-start space-x-4">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
              {contact.avatar_url ? (
                <img 
                  src={contact.avatar_url} 
                  alt={contact.name}
                  className="w-16 h-16 rounded-full object-cover"
                />
              ) : (
                <span className="text-blue-600 font-medium text-lg">
                  {getContactInitials(contact.name)}
                </span>
              )}
            </div>
            
            <div className="flex-1">
              <h3 className="text-xl font-semibold text-gray-900">
                {contact.name || 'Unknown Contact'}
              </h3>
              <p className="text-gray-600 mt-1">
                {formatPhoneNumber(contact.phone_number)}
              </p>
              {contact.email && (
                <p className="text-gray-600 mt-1">{contact.email}</p>
              )}
            </div>
          </div>

          {/* Tags */}
          {contact.tags && contact.tags.length > 0 && (
            <div>
              <h4 className="text-sm font-medium text-gray-900 mb-2 flex items-center">
                <TagIcon className="w-4 h-4 mr-1" />
                Tags
              </h4>
              <div className="flex flex-wrap gap-2">
                {contact.tags.map((tag, index) => (
                  <Badge key={index} variant="secondary">
                    {tag}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Additional Info */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <h4 className="text-sm font-medium text-gray-900 mb-2">Group</h4>
              <p className="text-sm text-gray-600">
                {contact.group_name || 'No group assigned'}
              </p>
            </div>
            
            <div>
              <h4 className="text-sm font-medium text-gray-900 mb-2">Source</h4>
              <p className="text-sm text-gray-600 capitalize">
                {contact.source || 'Manual'}
              </p>
            </div>
          </div>

          {/* Notes */}
          {contact.notes && (
            <div>
              <h4 className="text-sm font-medium text-gray-900 mb-2">Notes</h4>
              <div className="bg-gray-50 rounded-lg p-3">
                <p className="text-sm text-gray-700 whitespace-pre-wrap">
                  {contact.notes}
                </p>
              </div>
            </div>
          )}

          {/* Statistics */}
          <div>
            <h4 className="text-sm font-medium text-gray-900 mb-3">Statistics</h4>
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center">
                <div className="text-lg font-semibold text-gray-900">
                  {contact.message_count || 0}
                </div>
                <div className="text-xs text-gray-500">Messages</div>
              </div>
              
              <div className="text-center">
                <div className="text-lg font-semibold text-gray-900">
                  {contact.campaign_count || 0}
                </div>
                <div className="text-xs text-gray-500">Campaigns</div>
              </div>
              
              <div className="text-center">
                <div className="text-lg font-semibold text-gray-900">
                  {contact.response_rate || 0}%
                </div>
                <div className="text-xs text-gray-500">Response Rate</div>
              </div>
            </div>
          </div>

          {/* Timestamps */}
          <div>
            <h4 className="text-sm font-medium text-gray-900 mb-2">Timeline</h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Added:</span>
                <span>{new Date(contact.created_at).toLocaleString()}</span>
              </div>
              {contact.last_message_at && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Last Message:</span>
                  <span>{new Date(contact.last_message_at).toLocaleString()}</span>
                </div>
              )}
              {contact.updated_at && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Updated:</span>
                  <span>{new Date(contact.updated_at).toLocaleString()}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </Modal>
    </>
  );
};

export default ContactCard;