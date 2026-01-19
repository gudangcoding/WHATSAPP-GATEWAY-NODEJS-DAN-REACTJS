import React, { useState, useEffect } from 'react';
import ContactList from '../../components/contacts/ContactList';
import { contactsAPI, messagesAPI } from '../../services/api';
import toast from 'react-hot-toast';

const ContactsPage = () => {
  const [contacts, setContacts] = useState([]);
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalItems: 0,
    itemsPerPage: 20
  });
  const [filters, setFilters] = useState({
    search: '',
    group_id: '',
    tags: '',
    source: ''
  });

  // Load contacts
  const loadContacts = async (page = 1, searchTerm = '', filterParams = {}) => {
    try {
      setLoading(true);
      const params = {
        page,
        limit: pagination.itemsPerPage,
        search: searchTerm,
        ...filterParams
      };
      
      const response = await contactsAPI.getAll(params);
      const data = response.data;
      
      setContacts(data.data || []);
      setPagination({
        currentPage: data.pagination?.page || 1,
        totalPages: data.pagination?.totalPages || 1,
        totalItems: data.pagination?.total || 0,
        itemsPerPage: data.pagination?.limit || 20
      });
    } catch (error) {
      console.error('Failed to load contacts:', error);
      toast.error('Failed to load contacts');
    } finally {
      setLoading(false);
    }
  };

  // Load groups
  const loadGroups = async () => {
    try {
      const response = await contactsAPI.getGroups();
      setGroups(response.data.data || []);
    } catch (error) {
      console.error('Failed to load groups:', error);
    }
  };

  useEffect(() => {
    loadContacts();
    loadGroups();
  }, []);

  // Contact actions
  const handleCreateContact = async (contactData) => {
    const response = await contactsAPI.create(contactData);
    setContacts(prev => [response.data.data, ...prev]);
    toast.success('Contact created successfully');
  };

  const handleUpdateContact = async (contactId, contactData) => {
    const response = await contactsAPI.update(contactId, contactData);
    setContacts(prev => prev.map(contact => 
      contact.id === contactId ? response.data.data : contact
    ));
    toast.success('Contact updated successfully');
  };

  const handleDeleteContact = async (contactId) => {
    await contactsAPI.delete(contactId);
    setContacts(prev => prev.filter(contact => contact.id !== contactId));
    toast.success('Contact deleted successfully');
  };

  const handleImportContacts = async (importData) => {
    const response = await contactsAPI.import(importData);
    const result = response.data;
    
    toast.success(
      `Import completed: ${result.imported} imported, ${result.skipped} skipped, ${result.errors} errors`
    );
    
    // Reload contacts to show imported ones
    loadContacts(pagination.currentPage, filters.search, filters);
  };

  const handleExportContacts = async (exportFilters) => {
    try {
      const params = {
        ...exportFilters,
        format: 'csv'
      };
      
      const response = await contactsAPI.export(params);
      
      // Create download link
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `contacts-${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      
      toast.success('Contacts exported successfully');
    } catch (error) {
      toast.error('Failed to export contacts');
    }
  };

  const handleSendMessage = async (contact) => {
    try {
      // Navigate to messages page with pre-filled recipient
      // This could be implemented as a modal or navigation
      const messageData = {
        recipient: contact.phone_number,
        recipient_name: contact.name
      };
      
      // For now, we'll show a success message
      // In a real implementation, this would open a send message modal
      toast.success(`Ready to send message to ${contact.name}`);
      
      // You could also navigate to messages page:
      // navigate('/messages', { state: { prefilledRecipient: contact } });
      
    } catch (error) {
      toast.error('Failed to prepare message');
    }
  };

  const handlePageChange = (page) => {
    loadContacts(page, filters.search, filters);
  };

  const handleSearch = (searchTerm) => {
    const newFilters = { ...filters, search: searchTerm };
    setFilters(newFilters);
    loadContacts(1, searchTerm, newFilters);
  };

  const handleFilter = (filterParams) => {
    const newFilters = { ...filters, ...filterParams };
    setFilters(newFilters);
    loadContacts(1, filters.search, newFilters);
  };

  const handleRefresh = () => {
    loadContacts(pagination.currentPage, filters.search, filters);
    loadGroups();
  };

  return (
    <ContactList
      contacts={contacts}
      groups={groups}
      loading={loading}
      pagination={pagination}
      onCreateContact={handleCreateContact}
      onUpdateContact={handleUpdateContact}
      onDeleteContact={handleDeleteContact}
      onImportContacts={handleImportContacts}
      onExportContacts={handleExportContacts}
      onSendMessage={handleSendMessage}
      onRefresh={handleRefresh}
      onPageChange={handlePageChange}
      onSearch={handleSearch}
      onFilter={handleFilter}
    />
  );
};

export default ContactsPage;