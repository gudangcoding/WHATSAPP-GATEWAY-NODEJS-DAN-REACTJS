import React, { useState } from 'react';
import { 
  PlusIcon, 
  MagnifyingGlassIcon,
  FunnelIcon,
  ArrowDownTrayIcon,
  ArrowUpTrayIcon,
  UsersIcon
} from '@heroicons/react/24/outline';
import ContactCard from './ContactCard';
import ContactModal from './ContactModal';
import ImportContactsModal from './ImportContactsModal';
import Button from '../common/Button';
import Input from '../common/Input';
import Dropdown, { DropdownItem, DropdownDivider } from '../common/Dropdown';
import Pagination from '../common/Pagination';
import { ConfirmModal } from '../common/Modal';
import { useAuth } from '../../contexts/AuthContext';
import { PERMISSIONS } from '../../utils/constants/permissions';

const ContactList = ({ 
  contacts = [], 
  groups = [],
  loading = false,
  pagination = {},
  onCreateContact,
  onUpdateContact,
  onDeleteContact,
  onImportContacts,
  onExportContacts,
  onSendMessage,
  onRefresh,
  onPageChange,
  onSearch,
  onFilter
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [contactModalOpen, setContactModalOpen] = useState(false);
  const [importModalOpen, setImportModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [selectedContact, setSelectedContact] = useState(null);
  const [selectedContactId, setSelectedContactId] = useState(null);
  const [filters, setFilters] = useState({
    group_id: '',
    tags: '',
    source: ''
  });
  const [actionLoading, setActionLoading] = useState({});
  
  const { checkPermission, checkQuota, getQuotaUsage } = useAuth();
  
  const canCreateContact = checkPermission(PERMISSIONS.CONTACTS_CREATE);
  const canEditContact = checkPermission(PERMISSIONS.CONTACTS_EDIT_OWN);
  const canDeleteContact = checkPermission(PERMISSIONS.CONTACTS_DELETE_OWN);
  const canImportContacts = checkPermission(PERMISSIONS.CONTACTS_IMPORT);
  const canExportContacts = checkPermission(PERMISSIONS.CONTACTS_EXPORT_OWN);
  const hasQuota = checkQuota('contacts');
  const quotaUsage = getQuotaUsage('contacts');

  const handleSearch = (value) => {
    setSearchTerm(value);
    if (onSearch) {
      onSearch(value);
    }
  };

  const handleFilterChange = (key, value) => {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);
    if (onFilter) {
      onFilter(newFilters);
    }
  };

  const handleCreateContact = async (contactData) => {
    if (!hasQuota) {
      throw new Error('Contact quota exceeded. Please upgrade your plan.');
    }
    
    setActionLoading(prev => ({ ...prev, create: true }));
    try {
      await onCreateContact(contactData);
    } finally {
      setActionLoading(prev => ({ ...prev, create: false }));
    }
  };

  const handleUpdateContact = async (contactData) => {
    setActionLoading(prev => ({ ...prev, update: true }));
    try {
      await onUpdateContact(selectedContact.id, contactData);
      setContactModalOpen(false);
      setSelectedContact(null);
    } finally {
      setActionLoading(prev => ({ ...prev, update: false }));
    }
  };

  const handleEditContact = (contact) => {
    setSelectedContact(contact);
    setContactModalOpen(true);
  };

  const handleDeleteContact = (contactId) => {
    setSelectedContactId(contactId);
    setDeleteModalOpen(true);
  };

  const confirmDeleteContact = async () => {
    if (!selectedContactId) return;
    
    setActionLoading(prev => ({ ...prev, delete: true }));
    try {
      await onDeleteContact(selectedContactId);
      setDeleteModalOpen(false);
      setSelectedContactId(null);
    } finally {
      setActionLoading(prev => ({ ...prev, delete: false }));
    }
  };

  const handleImportContacts = async (importData) => {
    setActionLoading(prev => ({ ...prev, import: true }));
    try {
      await onImportContacts(importData);
    } finally {
      setActionLoading(prev => ({ ...prev, import: false }));
    }
  };

  const handleExportContacts = async () => {
    setActionLoading(prev => ({ ...prev, export: true }));
    try {
      await onExportContacts(filters);
    } finally {
      setActionLoading(prev => ({ ...prev, export: false }));
    }
  };

  const getGroupCounts = () => {
    const counts = {};
    contacts.forEach(contact => {
      const groupId = contact.group_id || 'no_group';
      counts[groupId] = (counts[groupId] || 0) + 1;
    });
    return counts;
  };

  const groupCounts = getGroupCounts();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Contacts</h1>
          <p className="text-gray-600">
            Manage your WhatsApp contacts and groups
          </p>
        </div>
        
        <div className="flex items-center space-x-3">
          {canExportContacts && (
            <Button
              variant="outline"
              onClick={handleExportContacts}
              loading={actionLoading.export}
              icon={<ArrowDownTrayIcon className="w-4 h-4" />}
            >
              Export
            </Button>
          )}
          
          {canImportContacts && (
            <Button
              variant="outline"
              onClick={() => setImportModalOpen(true)}
              icon={<ArrowUpTrayIcon className="w-4 h-4" />}
            >
              Import
            </Button>
          )}
          
          {canCreateContact && (
            <Button
              onClick={() => {
                setSelectedContact(null);
                setContactModalOpen(true);
              }}
              disabled={!hasQuota}
              icon={<PlusIcon className="w-4 h-4" />}
            >
              Add Contact
            </Button>
          )}
        </div>
      </div>

      {/* Quota Warning */}
      {!hasQuota && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-yellow-800">
                Contact quota exceeded!
              </h3>
              <div className="mt-2 text-sm text-yellow-700">
                <p>You have used {quotaUsage.used} of {quotaUsage.limit} contacts. Please upgrade your plan to add more contacts.</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center">
            <UsersIcon className="w-8 h-8 text-blue-500" />
            <div className="ml-3">
              <p className="text-sm text-gray-600">Total Contacts</p>
              <p className="text-2xl font-bold text-gray-900">{pagination.totalItems || 0}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center">
            <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
            <span className="text-sm text-gray-600">With Groups</span>
          </div>
          <div className="text-2xl font-bold text-gray-900 mt-1">
            {contacts.filter(c => c.group_id).length}
          </div>
        </div>
        
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center">
            <div className="w-2 h-2 bg-yellow-500 rounded-full mr-2"></div>
            <span className="text-sm text-gray-600">Recent Activity</span>
          </div>
          <div className="text-2xl font-bold text-gray-900 mt-1">
            {contacts.filter(c => c.last_message_at && 
              new Date(c.last_message_at) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
            ).length}
          </div>
        </div>
        
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center">
            <div className="w-2 h-2 bg-purple-500 rounded-full mr-2"></div>
            <span className="text-sm text-gray-600">Tagged</span>
          </div>
          <div className="text-2xl font-bold text-gray-900 mt-1">
            {contacts.filter(c => c.tags && c.tags.length > 0).length}
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <Input
            placeholder="Search contacts by name, phone, or email..."
            value={searchTerm}
            onChange={(e) => handleSearch(e.target.value)}
            startIcon={<MagnifyingGlassIcon className="w-4 h-4" />}
          />
        </div>
        
        <div className="flex items-center space-x-3">
          {/* Group Filter */}
          <Dropdown
            align="right"
            trigger={
              <Button
                variant="outline"
                icon={<FunnelIcon className="w-4 h-4" />}
              >
                Group
              </Button>
            }
          >
            <DropdownItem onClick={() => handleFilterChange('group_id', '')}>
              All Groups ({pagination.totalItems || 0})
            </DropdownItem>
            <DropdownDivider />
            <DropdownItem onClick={() => handleFilterChange('group_id', 'no_group')}>
              No Group ({groupCounts.no_group || 0})
            </DropdownItem>
            {groups.map((group) => (
              <DropdownItem 
                key={group.id} 
                onClick={() => handleFilterChange('group_id', group.id)}
              >
                {group.name} ({groupCounts[group.id] || 0})
              </DropdownItem>
            ))}
          </Dropdown>

          {/* Source Filter */}
          <Dropdown
            align="right"
            trigger={
              <Button
                variant="outline"
                icon={<FunnelIcon className="w-4 h-4" />}
              >
                Source
              </Button>
            }
          >
            <DropdownItem onClick={() => handleFilterChange('source', '')}>
              All Sources
            </DropdownItem>
            <DropdownItem onClick={() => handleFilterChange('source', 'manual')}>
              Manual
            </DropdownItem>
            <DropdownItem onClick={() => handleFilterChange('source', 'import')}>
              Import
            </DropdownItem>
            <DropdownItem onClick={() => handleFilterChange('source', 'scrape')}>
              Scrape
            </DropdownItem>
          </Dropdown>

          <Button
            variant="outline"
            onClick={onRefresh}
            loading={loading}
          >
            Refresh
          </Button>
        </div>
      </div>

      {/* Contact Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, index) => (
            <div key={index} className="animate-pulse">
              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <div className="flex items-start space-x-3">
                  <div className="w-12 h-12 bg-gray-200 rounded-full"></div>
                  <div className="flex-1">
                    <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                    <div className="h-3 bg-gray-200 rounded w-1/2 mb-2"></div>
                    <div className="h-3 bg-gray-200 rounded w-2/3"></div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : contacts.length === 0 ? (
        <div className="text-center py-12">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <UsersIcon className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            {searchTerm ? 'No contacts found' : 'No contacts yet'}
          </h3>
          <p className="text-gray-500 mb-6">
            {searchTerm 
              ? 'Try adjusting your search terms or filters'
              : 'Add your first contact to start managing your WhatsApp communications'
            }
          </p>
          {canCreateContact && !searchTerm && hasQuota && (
            <div className="flex justify-center space-x-3">
              <Button
                onClick={() => {
                  setSelectedContact(null);
                  setContactModalOpen(true);
                }}
                icon={<PlusIcon className="w-4 h-4" />}
              >
                Add Contact
              </Button>
              {canImportContacts && (
                <Button
                  variant="outline"
                  onClick={() => setImportModalOpen(true)}
                  icon={<ArrowUpTrayIcon className="w-4 h-4" />}
                >
                  Import Contacts
                </Button>
              )}
            </div>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {contacts.map((contact) => (
            <ContactCard
              key={contact.id}
              contact={contact}
              onEdit={canEditContact ? handleEditContact : null}
              onDelete={canDeleteContact ? handleDeleteContact : null}
              onSendMessage={onSendMessage}
              loading={actionLoading[contact.id]}
            />
          ))}
        </div>
      )}

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <Pagination
          currentPage={pagination.currentPage}
          totalPages={pagination.totalPages}
          totalItems={pagination.totalItems}
          itemsPerPage={pagination.itemsPerPage}
          onPageChange={onPageChange}
          showInfo={true}
        />
      )}

      {/* Contact Modal */}
      <ContactModal
        isOpen={contactModalOpen}
        onClose={() => {
          setContactModalOpen(false);
          setSelectedContact(null);
        }}
        onSubmit={selectedContact ? handleUpdateContact : handleCreateContact}
        contact={selectedContact}
        groups={groups}
        loading={actionLoading.create || actionLoading.update}
      />

      {/* Import Modal */}
      <ImportContactsModal
        isOpen={importModalOpen}
        onClose={() => setImportModalOpen(false)}
        onImport={handleImportContacts}
        groups={groups}
        loading={actionLoading.import}
      />

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        onConfirm={confirmDeleteContact}
        title="Delete Contact"
        message="Are you sure you want to delete this contact? This action cannot be undone."
        confirmText="Delete"
        variant="danger"
        loading={actionLoading.delete}
      />
    </div>
  );
};

export default ContactList;