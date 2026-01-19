import React, { useState, useEffect } from 'react';
import MessageList from '../../components/messages/MessageList';
import { messagesAPI, devicesAPI, contactsAPI } from '../../services/api';
import toast from 'react-hot-toast';

const MessagesPage = () => {
  const [messages, setMessages] = useState([]);
  const [devices, setDevices] = useState([]);
  const [contacts, setContacts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalItems: 0,
    itemsPerPage: 20
  });
  const [filters, setFilters] = useState({
    search: '',
    status: '',
    type: '',
    device_id: '',
    date_range: ''
  });

  // Load messages
  const loadMessages = async (page = 1, searchTerm = '', filterParams = {}) => {
    try {
      setLoading(true);
      const params = {
        page,
        limit: pagination.itemsPerPage,
        search: searchTerm,
        ...filterParams
      };
      
      const response = await messagesAPI.getAll(params);
      const data = response.data;
      
      setMessages(data.data || []);
      setPagination({
        currentPage: data.pagination?.page || 1,
        totalPages: data.pagination?.totalPages || 1,
        totalItems: data.pagination?.total || 0,
        itemsPerPage: data.pagination?.limit || 20
      });
    } catch (error) {
      console.error('Failed to load messages:', error);
      toast.error('Failed to load messages');
    } finally {
      setLoading(false);
    }
  };

  // Load devices and contacts
  const loadDevicesAndContacts = async () => {
    try {
      const [devicesResponse, contactsResponse] = await Promise.all([
        devicesAPI.getAll(),
        contactsAPI.getAll({ limit: 100 })
      ]);
      
      setDevices(devicesResponse.data.data || []);
      setContacts(contactsResponse.data.data || []);
    } catch (error) {
      console.error('Failed to load devices/contacts:', error);
    }
  };

  useEffect(() => {
    loadMessages();
    loadDevicesAndContacts();
  }, []);

  // Message actions
  const handleSendMessage = async (messageData) => {
    await messagesAPI.send(messageData);
    toast.success('Message sent successfully');
    loadMessages(pagination.currentPage, filters.search, filters);
  };

  const handleRetryMessage = async (messageId) => {
    await messagesAPI.retry(messageId);
    toast.success('Message retry initiated');
    loadMessages(pagination.currentPage, filters.search, filters);
  };

  const handlePageChange = (page) => {
    loadMessages(page, filters.search, filters);
  };

  const handleSearch = (searchTerm) => {
    const newFilters = { ...filters, search: searchTerm };
    setFilters(newFilters);
    loadMessages(1, searchTerm, newFilters);
  };

  const handleFilter = (filterParams) => {
    const newFilters = { ...filters, ...filterParams };
    setFilters(newFilters);
    loadMessages(1, filters.search, newFilters);
  };

  const handleExport = async () => {
    try {
      const params = {
        ...filters,
        format: 'csv'
      };
      
      const response = await messagesAPI.exportReport('messages', params);
      
      // Create download link
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `messages-${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      
      toast.success('Messages exported successfully');
    } catch (error) {
      toast.error('Failed to export messages');
    }
  };

  const handleRefresh = () => {
    loadMessages(pagination.currentPage, filters.search, filters);
  };

  return (
    <MessageList
      messages={messages}
      loading={loading}
      pagination={pagination}
      devices={devices}
      contacts={contacts}
      onSendMessage={handleSendMessage}
      onRetryMessage={handleRetryMessage}
      onRefresh={handleRefresh}
      onPageChange={handlePageChange}
      onSearch={handleSearch}
      onFilter={handleFilter}
      onExport={handleExport}
    />
  );
};

export default MessagesPage;