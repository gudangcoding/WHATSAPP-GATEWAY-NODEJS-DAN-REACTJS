import React, { useState, useEffect } from 'react';
import DeviceList from '../../components/devices/DeviceList';
import { devicesAPI } from '../../services/api';
import toast from 'react-hot-toast';

const DevicesPage = () => {
  const [devices, setDevices] = useState([]);
  const [loading, setLoading] = useState(true);

  // Load devices
  const loadDevices = async () => {
    try {
      setLoading(true);
      const response = await devicesAPI.getAll();
      setDevices(response.data.data || []);
    } catch (error) {
      console.error('Failed to load devices:', error);
      toast.error('Failed to load devices');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDevices();
  }, []);

  // Device actions
  const handleCreateDevice = async (deviceData) => {
    const response = await devicesAPI.create(deviceData);
    setDevices(prev => [...prev, response.data.data]);
    toast.success('Device created successfully');
  };

  const handleStartDevice = async (deviceId) => {
    await devicesAPI.connect(deviceId);
    toast.success('Device start command sent');
    // Device status will be updated via socket
  };

  const handleStopDevice = async (deviceId) => {
    await devicesAPI.disconnect(deviceId);
    toast.success('Device stop command sent');
    // Device status will be updated via socket
  };

  const handleRestartDevice = async (deviceId) => {
    await devicesAPI.disconnect(deviceId);
    setTimeout(async () => {
      await devicesAPI.connect(deviceId);
    }, 2000);
    toast.success('Device restart command sent');
    // Device status will be updated via socket
  };

  const handleDeleteDevice = async (deviceId) => {
    await devicesAPI.delete(deviceId);
    setDevices(prev => prev.filter(device => device.id !== deviceId));
    toast.success('Device deleted successfully');
  };

  const handleShowQR = async (deviceId) => {
    try {
      const response = await devicesAPI.getQR(deviceId);
      return response.data.qr_code;
    } catch (error) {
      toast.error('Failed to get QR code');
      return null;
    }
  };

  return (
    <DeviceList
      devices={devices}
      loading={loading}
      onCreateDevice={handleCreateDevice}
      onStartDevice={handleStartDevice}
      onStopDevice={handleStopDevice}
      onRestartDevice={handleRestartDevice}
      onDeleteDevice={handleDeleteDevice}
      onShowQR={handleShowQR}
      onRefresh={loadDevices}
    />
  );
};

export default DevicesPage;