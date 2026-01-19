import React, { useState } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import { PERMISSIONS } from '../utils/constants/permissions';

const DashboardLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user, isAdmin, checkPermission } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  // Navigation items based on user role and permissions
  const getNavigationItems = () => {
    const items = [];

    // Dashboard
    items.push({
      name: 'Dashboard',
      href: isAdmin ? '/admin' : '/dashboard',
      icon: 'HomeIcon',
      current: location.pathname === (isAdmin ? '/admin' : '/dashboard')
    });

    // Device Management
    if (checkPermission(PERMISSIONS.DEVICES_VIEW_OWN)) {
      items.push({
        name: 'Devices',
        href: '/devices',
        icon: 'DevicePhoneMobileIcon',
        current: location.pathname.startsWith('/devices'),
        badge: user?.stats?.devices?.offline > 0 ? user.stats.devices.offline : null
      });
    }

    // Messages
    if (checkPermission(PERMISSIONS.MESSAGES_VIEW_OWN)) {
      items.push({
        name: 'Messages',
        href: '/messages',
        icon: 'ChatBubbleLeftRightIcon',
        current: location.pathname.startsWith('/messages')
      });
    }

    // Contacts
    if (checkPermission(PERMISSIONS.CONTACTS_VIEW_OWN)) {
      items.push({
        name: 'Contacts',
        href: '/contacts',
        icon: 'UsersIcon',
        current: location.pathname.startsWith('/contacts')
      });
    }

    // Auto Reply
    if (checkPermission(PERMISSIONS.AUTO_REPLY_VIEW_OWN)) {
      items.push({
        name: 'Auto Reply',
        href: '/auto-reply',
        icon: 'ArrowPathIcon',
        current: location.pathname.startsWith('/auto-reply')
      });
    }

    // Campaigns
    if (checkPermission(PERMISSIONS.CAMPAIGNS_VIEW_OWN)) {
      items.push({
        name: 'Campaigns',
        href: '/campaigns',
        icon: 'MegaphoneIcon',
        current: location.pathname.startsWith('/campaigns'),
        badge: user?.stats?.campaigns?.running > 0 ? user.stats.campaigns.running : null
      });
    }

    // Analytics
    if (checkPermission(PERMISSIONS.ANALYTICS_VIEW_OWN)) {
      items.push({
        name: 'Analytics',
        href: '/analytics',
        icon: 'ChartBarIcon',
        current: location.pathname.startsWith('/analytics')
      });
    }

    // Webhooks
    if (checkPermission(PERMISSIONS.WEBHOOKS_VIEW_OWN)) {
      items.push({
        name: 'Webhooks',
        href: '/webhooks',
        icon: 'LinkIcon',
        current: location.pathname.startsWith('/webhooks')
      });
    }

    // Admin sections
    if (isAdmin) {
      items.push({
        type: 'divider'
      });

      items.push({
        name: 'Admin',
        icon: 'CogIcon',
        children: [
          {
            name: 'Users',
            href: '/admin/users',
            current: location.pathname.startsWith('/admin/users'),
            permission: PERMISSIONS.USERS_VIEW_ALL
          },
          {
            name: 'System Logs',
            href: '/admin/logs',
            current: location.pathname.startsWith('/admin/logs'),
            permission: PERMISSIONS.SYSTEM_LOGS
          },
          {
            name: 'System Monitor',
            href: '/admin/monitor',
            current: location.pathname.startsWith('/admin/monitor'),
            permission: PERMISSIONS.SYSTEM_MONITORING
          },
          {
            name: 'Settings',
            href: '/admin/settings',
            current: location.pathname.startsWith('/admin/settings'),
            permission: PERMISSIONS.SYSTEM_SETTINGS
          }
        ]
      });
    }

    return items.filter(item => {
      if (item.permission) {
        return checkPermission(item.permission);
      }
      if (item.children) {
        item.children = item.children.filter(child => 
          !child.permission || checkPermission(child.permission)
        );
        return item.children.length > 0;
      }
      return true;
    });
  };

  const navigationItems = getNavigationItems();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Sidebar */}
      <Sidebar
        navigation={navigationItems}
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
      />

      {/* Main content */}
      <div className="lg:pl-64 flex flex-col flex-1">
        {/* Header */}
        <Header
          onMenuClick={() => setSidebarOpen(true)}
        />

        {/* Page content */}
        <main className="flex-1">
          <div className="py-6">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <Outlet />
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;