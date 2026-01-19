import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import socketService from '../services/socket';
import {
  ChatBubbleLeftRightIcon,
  HomeIcon,
  DevicePhoneMobileIcon,
  ChatBubbleOvalLeftEllipsisIcon,
  UsersIcon,
  BoltIcon,
  MegaphoneIcon,
  CpuChipIcon,
  LinkIcon,
  ChartBarIcon,
  UserCircleIcon,
  Bars3Icon,
  XMarkIcon,
  BellIcon,
  ArrowRightOnRectangleIcon,
  SignalIcon
} from '@heroicons/react/24/outline';

const UserLayout = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [deviceStatus, setDeviceStatus] = useState({ connected: 0, total: 0 });
  const { user, logout, token } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    if (token && user) {
      socketService.connect(token);
      socketService.joinUserRoom(user.id);

      // Listen for device status updates
      socketService.on('device:connected', (data) => {
        setDeviceStatus(prev => ({ ...prev, connected: prev.connected + 1 }));
        setNotifications(prev => [{
          id: Date.now(),
          type: 'success',
          message: `Device ${data.name} connected`,
          timestamp: new Date()
        }, ...prev.slice(0, 9)]);
      });

      socketService.on('device:disconnected', (data) => {
        setDeviceStatus(prev => ({ ...prev, connected: Math.max(0, prev.connected - 1) }));
        setNotifications(prev => [{
          id: Date.now(),
          type: 'warning',
          message: `Device ${data.name} disconnected`,
          timestamp: new Date()
        }, ...prev.slice(0, 9)]);
      });

      socketService.on('message:received', (data) => {
        setNotifications(prev => [{
          id: Date.now(),
          type: 'info',
          message: `New message received from ${data.from}`,
          timestamp: new Date()
        }, ...prev.slice(0, 9)]);
      });

      return () => {
        socketService.leaveUserRoom(user.id);
        socketService.disconnect();
      };
    }
  }, [token, user]);

  const navigation = [
    { name: 'Dashboard', href: '/dashboard', icon: HomeIcon },
    { name: 'Devices', href: '/dashboard/devices', icon: DevicePhoneMobileIcon },
    { name: 'Messages', href: '/dashboard/messages', icon: ChatBubbleOvalLeftEllipsisIcon },
    { name: 'Contacts', href: '/dashboard/contacts', icon: UsersIcon },
    { name: 'Auto Reply', href: '/dashboard/auto-reply', icon: BoltIcon },
    { name: 'Campaigns', href: '/dashboard/campaigns', icon: MegaphoneIcon },
    { name: 'AI Tools', href: '/dashboard/ai-tools', icon: CpuChipIcon },
    { name: 'Webhooks', href: '/dashboard/webhooks', icon: LinkIcon },
    { name: 'Analytics', href: '/dashboard/analytics', icon: ChartBarIcon },
    { name: 'Profile', href: '/dashboard/profile', icon: UserCircleIcon },
  ];

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <div className="h-screen flex overflow-hidden bg-gray-100">
      {/* Mobile sidebar */}
      <div className={`fixed inset-0 flex z-40 md:hidden ${sidebarOpen ? '' : 'hidden'}`}>
        <div className="fixed inset-0 bg-gray-600 bg-opacity-75" onClick={() => setSidebarOpen(false)} />
        <div className="relative flex-1 flex flex-col max-w-xs w-full bg-white">
          <div className="absolute top-0 right-0 -mr-12 pt-2">
            <button
              className="ml-1 flex items-center justify-center h-10 w-10 rounded-full focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white"
              onClick={() => setSidebarOpen(false)}
            >
              <XMarkIcon className="h-6 w-6 text-white" />
            </button>
          </div>
          <SidebarContent navigation={navigation} location={location} deviceStatus={deviceStatus} />
        </div>
      </div>

      {/* Desktop sidebar */}
      <div className="hidden md:flex md:flex-shrink-0">
        <div className="flex flex-col w-64">
          <SidebarContent navigation={navigation} location={location} deviceStatus={deviceStatus} />
        </div>
      </div>

      {/* Main content */}
      <div className="flex flex-col w-0 flex-1 overflow-hidden">
        {/* Top navigation */}
        <div className="relative z-10 flex-shrink-0 flex h-16 bg-white shadow">
          <button
            className="px-4 border-r border-gray-200 text-gray-500 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-whatsapp-500 md:hidden"
            onClick={() => setSidebarOpen(true)}
          >
            <Bars3Icon className="h-6 w-6" />
          </button>
          
          <div className="flex-1 px-4 flex justify-between">
            <div className="flex-1 flex">
              <div className="w-full flex md:ml-0">
                <div className="relative w-full text-gray-400 focus-within:text-gray-600">
                  <div className="flex items-center h-16">
                    <h1 className="text-2xl font-semibold text-gray-900">
                      Dashboard
                    </h1>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="ml-4 flex items-center md:ml-6">
              {/* Device Status */}
              <div className="flex items-center mr-4">
                <SignalIcon className={`h-5 w-5 mr-1 ${deviceStatus.connected > 0 ? 'text-whatsapp-500' : 'text-gray-400'}`} />
                <span className="text-sm text-gray-600">
                  {deviceStatus.connected}/{deviceStatus.total} devices
                </span>
              </div>

              {/* Notifications */}
              <div className="relative mr-4">
                <button className="bg-white p-1 rounded-full text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-whatsapp-500">
                  <BellIcon className="h-6 w-6" />
                  {notifications.length > 0 && (
                    <span className="absolute -top-1 -right-1 h-4 w-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                      {notifications.length}
                    </span>
                  )}
                </button>
              </div>

              {/* Profile dropdown */}
              <div className="relative">
                <div className="flex items-center space-x-3">
                  <div className="text-right">
                    <p className="text-sm font-medium text-gray-900">{user?.name}</p>
                    <p className="text-xs text-gray-500">{user?.email}</p>
                  </div>
                  <UserCircleIcon className="h-8 w-8 text-gray-400" />
                  <button
                    onClick={handleLogout}
                    className="text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-whatsapp-500"
                    title="Logout"
                  >
                    <ArrowRightOnRectangleIcon className="h-6 w-6" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Page content */}
        <main className="flex-1 relative overflow-y-auto focus:outline-none">
          <div className="py-6">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
              {children}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

const SidebarContent = ({ navigation, location, deviceStatus }) => {
  return (
    <div className="flex flex-col h-0 flex-1 border-r border-gray-200 bg-white">
      <div className="flex-1 flex flex-col pt-5 pb-4 overflow-y-auto">
        <div className="flex items-center flex-shrink-0 px-4">
          <ChatBubbleLeftRightIcon className="h-8 w-8 text-whatsapp-600" />
          <span className="ml-2 text-xl font-bold text-gray-900">
            WhatsApp Gateway
          </span>
        </div>
        <nav className="mt-5 flex-1 px-2 space-y-1">
          {navigation.map((item) => {
            const isActive = location.pathname === item.href || 
              (item.href !== '/dashboard' && location.pathname.startsWith(item.href));
            
            return (
              <Link
                key={item.name}
                to={item.href}
                className={`group flex items-center px-2 py-2 text-sm font-medium rounded-md ${
                  isActive
                    ? 'bg-whatsapp-100 text-whatsapp-900'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                }`}
              >
                <item.icon
                  className={`mr-3 flex-shrink-0 h-6 w-6 ${
                    isActive ? 'text-whatsapp-500' : 'text-gray-400 group-hover:text-gray-500'
                  }`}
                />
                {item.name}
              </Link>
            );
          })}
        </nav>
      </div>
      
      <div className="flex-shrink-0 flex border-t border-gray-200 p-4">
        <div className="flex items-center w-full">
          <div className="flex-1">
            <div className="text-xs text-gray-500 mb-1">Device Status</div>
            <div className="flex items-center">
              <div className={`w-2 h-2 rounded-full mr-2 ${deviceStatus.connected > 0 ? 'bg-whatsapp-400' : 'bg-gray-400'}`}></div>
              <span className="text-xs text-gray-600">
                {deviceStatus.connected} of {deviceStatus.total} connected
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserLayout;