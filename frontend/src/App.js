import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext';

// Public Pages
import LandingPage from './pages/public/LandingPage';
import LoginPage from './pages/auth/LoginPage';
import RegisterPage from './pages/auth/RegisterPage';
import ForgotPasswordPage from './pages/auth/ForgotPasswordPage';

// Protected Pages
import AdminDashboard from './pages/admin/AdminDashboard';
import UserDashboard from './pages/user/UserDashboard';
import DevicesPage from './pages/user/DevicesPage';
import MessagesPage from './pages/user/MessagesPage';
import ContactsPage from './pages/user/ContactsPage';
import CampaignsPage from './pages/user/CampaignsPage';
import AutoReplyPage from './pages/user/AutoReplyPage';
import AnalyticsPage from './pages/user/AnalyticsPage';
import WebhooksPage from './pages/user/WebhooksPage';

// Layout Components
import AuthLayout from './layouts/AuthLayout';
import DashboardLayout from './layouts/DashboardLayout';

// Loading Component
import LoadingSpinner from './components/common/LoadingSpinner';

function App() {
  const { user, loading, isAuthenticated } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/" element={!isAuthenticated ? <LandingPage /> : <Navigate to={(user?.role === 'admin' || user?.role === 'super_admin') ? '/admin' : '/dashboard'} />} />
      
      {/* Auth Routes */}
      <Route path="/auth" element={<AuthLayout />}>
        <Route path="login" element={!isAuthenticated ? <LoginPage /> : <Navigate to={(user?.role === 'admin' || user?.role === 'super_admin') ? '/admin' : '/dashboard'} />} />
        <Route path="register" element={!isAuthenticated ? <RegisterPage /> : <Navigate to={(user?.role === 'admin' || user?.role === 'super_admin') ? '/admin' : '/dashboard'} />} />
        <Route path="forgot-password" element={!isAuthenticated ? <ForgotPasswordPage /> : <Navigate to={(user?.role === 'admin' || user?.role === 'super_admin') ? '/admin' : '/dashboard'} />} />
      </Route>

      {/* Legacy auth routes (redirect to new structure) */}
      <Route path="/login" element={<Navigate to="/auth/login" />} />
      <Route path="/register" element={<Navigate to="/auth/register" />} />
      <Route path="/forgot-password" element={<Navigate to="/auth/forgot-password" />} />

      {/* Protected Dashboard Routes */}
      <Route path="/*" element={
        isAuthenticated ? (
          <DashboardLayout />
        ) : (
          <Navigate to="/auth/login" />
        )
      }>
        {/* Admin Routes */}
        <Route path="admin" element={(user?.role === 'admin' || user?.role === 'super_admin') ? <AdminDashboard /> : <Navigate to="/dashboard" />} />
        <Route path="admin/users" element={(user?.role === 'admin' || user?.role === 'super_admin') ? <div className="p-6 bg-white rounded-lg shadow"><h2 className="text-xl font-bold mb-4">Users Management</h2><p className="text-gray-600">Coming Soon - Manage all users and their permissions</p></div> : <Navigate to="/dashboard" />} />
        <Route path="admin/logs" element={(user?.role === 'admin' || user?.role === 'super_admin') ? <div className="p-6 bg-white rounded-lg shadow"><h2 className="text-xl font-bold mb-4">System Logs</h2><p className="text-gray-600">Coming Soon - View system logs and activities</p></div> : <Navigate to="/dashboard" />} />
        <Route path="admin/monitor" element={(user?.role === 'admin' || user?.role === 'super_admin') ? <div className="p-6 bg-white rounded-lg shadow"><h2 className="text-xl font-bold mb-4">System Monitor</h2><p className="text-gray-600">Coming Soon - Monitor system performance and health</p></div> : <Navigate to="/dashboard" />} />
        <Route path="admin/settings" element={(user?.role === 'admin' || user?.role === 'super_admin') ? <div className="p-6 bg-white rounded-lg shadow"><h2 className="text-xl font-bold mb-4">System Settings</h2><p className="text-gray-600">Coming Soon - Configure system settings</p></div> : <Navigate to="/dashboard" />} />

        {/* User Routes */}
        <Route path="dashboard" element={<UserDashboard />} />
        <Route path="devices" element={<DevicesPage />} />
        <Route path="messages" element={<MessagesPage />} />
        <Route path="contacts" element={<ContactsPage />} />
        <Route path="campaigns" element={<CampaignsPage />} />
        <Route path="auto-reply" element={<AutoReplyPage />} />
        <Route path="analytics" element={<AnalyticsPage />} />
        <Route path="webhooks" element={<WebhooksPage />} />
        <Route path="profile" element={<div className="p-6 bg-white rounded-lg shadow"><h2 className="text-xl font-bold mb-4">Profile</h2><p className="text-gray-600">Coming Soon - Manage your account settings and preferences</p></div>} />
        <Route path="settings" element={<div className="p-6 bg-white rounded-lg shadow"><h2 className="text-xl font-bold mb-4">Settings</h2><p className="text-gray-600">Coming Soon - Configure your preferences</p></div>} />
      </Route>
    </Routes>
  );
}

export default App;