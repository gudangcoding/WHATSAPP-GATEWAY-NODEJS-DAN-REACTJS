import React, { useState, useEffect } from 'react';
import CampaignList from '../../components/campaigns/CampaignList';
import { campaignsAPI, devicesAPI, contactsAPI } from '../../services/api';
import toast from 'react-hot-toast';

const CampaignsPage = () => {
  const [campaigns, setCampaigns] = useState([]);
  const [devices, setDevices] = useState([]);
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
    status: '',
    device_id: '',
    date_range: ''
  });

  // Load campaigns
  const loadCampaigns = async (page = 1, searchTerm = '', filterParams = {}) => {
    try {
      setLoading(true);
      const params = {
        page,
        limit: pagination.itemsPerPage,
        search: searchTerm,
        ...filterParams
      };
      
      const response = await campaignsAPI.getAll(params);
      const data = response.data;
      
      setCampaigns(data.data || []);
      setPagination({
        currentPage: data.pagination?.page || 1,
        totalPages: data.pagination?.totalPages || 1,
        totalItems: data.pagination?.total || 0,
        itemsPerPage: data.pagination?.limit || 20
      });
    } catch (error) {
      console.error('Failed to load campaigns:', error);
      toast.error('Failed to load campaigns');
    } finally {
      setLoading(false);
    }
  };

  // Load devices, contacts, and groups
  const loadDependencies = async () => {
    try {
      const [devicesResponse, contactsResponse, groupsResponse] = await Promise.all([
        devicesAPI.getAll(),
        contactsAPI.getAll({ limit: 1000 }),
        contactsAPI.getGroups()
      ]);
      
      setDevices(devicesResponse.data.data || []);
      setContacts(contactsResponse.data.data || []);
      setGroups(groupsResponse.data.data || []);
    } catch (error) {
      console.error('Failed to load dependencies:', error);
    }
  };

  useEffect(() => {
    loadCampaigns();
    loadDependencies();
  }, []);

  // Campaign actions
  const handleCreateCampaign = async (campaignData) => {
    const response = await campaignsAPI.create(campaignData);
    setCampaigns(prev => [response.data.data, ...prev]);
    toast.success('Campaign created successfully');
  };

  const handleUpdateCampaign = async (campaignId, campaignData) => {
    const response = await campaignsAPI.update(campaignId, campaignData);
    setCampaigns(prev => prev.map(campaign => 
      campaign.id === campaignId ? response.data.data : campaign
    ));
    toast.success('Campaign updated successfully');
  };

  const handleStartCampaign = async (campaignId) => {
    await campaignsAPI.start(campaignId);
    toast.success('Campaign started successfully');
    // Campaign status will be updated via socket
  };

  const handlePauseCampaign = async (campaignId) => {
    await campaignsAPI.pause(campaignId);
    toast.success('Campaign paused successfully');
    // Campaign status will be updated via socket
  };

  const handleResumeCampaign = async (campaignId) => {
    await campaignsAPI.resume(campaignId);
    toast.success('Campaign resumed successfully');
    // Campaign status will be updated via socket
  };

  const handleStopCampaign = async (campaignId) => {
    await campaignsAPI.stop(campaignId);
    toast.success('Campaign stopped successfully');
    // Campaign status will be updated via socket
  };

  const handleDeleteCampaign = async (campaignId) => {
    await campaignsAPI.delete(campaignId);
    setCampaigns(prev => prev.filter(campaign => campaign.id !== campaignId));
    toast.success('Campaign deleted successfully');
  };

  const handleExportReport = async (exportFilters) => {
    try {
      const params = {
        ...exportFilters,
        format: 'csv'
      };
      
      const response = await campaignsAPI.exportReport(params);
      
      // Create download link
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `campaigns-report-${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      
      toast.success('Campaign report exported successfully');
    } catch (error) {
      toast.error('Failed to export campaign report');
    }
  };

  const handlePageChange = (page) => {
    loadCampaigns(page, filters.search, filters);
  };

  const handleSearch = (searchTerm) => {
    const newFilters = { ...filters, search: searchTerm };
    setFilters(newFilters);
    loadCampaigns(1, searchTerm, newFilters);
  };

  const handleFilter = (filterParams) => {
    const newFilters = { ...filters, ...filterParams };
    setFilters(newFilters);
    loadCampaigns(1, filters.search, newFilters);
  };

  const handleRefresh = () => {
    loadCampaigns(pagination.currentPage, filters.search, filters);
    loadDependencies();
  };

  return (
    <CampaignList
      campaigns={campaigns}
      devices={devices}
      contacts={contacts}
      groups={groups}
      loading={loading}
      pagination={pagination}
      onCreateCampaign={handleCreateCampaign}
      onUpdateCampaign={handleUpdateCampaign}
      onStartCampaign={handleStartCampaign}
      onPauseCampaign={handlePauseCampaign}
      onResumeCampaign={handleResumeCampaign}
      onStopCampaign={handleStopCampaign}
      onDeleteCampaign={handleDeleteCampaign}
      onExportReport={handleExportReport}
      onRefresh={handleRefresh}
      onPageChange={handlePageChange}
      onSearch={handleSearch}
      onFilter={handleFilter}
    />
  );
};

export default CampaignsPage;