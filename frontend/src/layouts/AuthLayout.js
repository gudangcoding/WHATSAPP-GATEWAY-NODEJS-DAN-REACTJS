import React from 'react';
import { Outlet } from 'react-router-dom';

const AuthLayout = () => {
  return (
    <div className="min-h-screen flex">
      {/* Left side - Branding */}
      <div className="hidden lg:flex lg:flex-1 lg:flex-col lg:justify-center lg:px-8 lg:py-12 bg-gradient-to-br from-blue-600 to-blue-800">
        <div className="mx-auto max-w-md text-center">
          <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center mx-auto mb-8">
            <span className="text-2xl font-bold text-blue-600">WG</span>
          </div>
          
          <h1 className="text-3xl font-bold text-white mb-4">
            WhatsApp Gateway SaaS
          </h1>
          
          <p className="text-blue-100 text-lg mb-8">
            Professional WhatsApp Business API Platform untuk kebutuhan bisnis Anda
          </p>
          
          <div className="space-y-4 text-left">
            <div className="flex items-center text-blue-100">
              <div className="w-2 h-2 bg-blue-300 rounded-full mr-3"></div>
              <span>Multi-device WhatsApp Gateway</span>
            </div>
            <div className="flex items-center text-blue-100">
              <div className="w-2 h-2 bg-blue-300 rounded-full mr-3"></div>
              <span>Campaign & Auto Reply Management</span>
            </div>
            <div className="flex items-center text-blue-100">
              <div className="w-2 h-2 bg-blue-300 rounded-full mr-3"></div>
              <span>Real-time Analytics & Monitoring</span>
            </div>
            <div className="flex items-center text-blue-100">
              <div className="w-2 h-2 bg-blue-300 rounded-full mr-3"></div>
              <span>AI-powered Message Templates</span>
            </div>
          </div>
        </div>
      </div>

      {/* Right side - Auth Form */}
      <div className="flex-1 flex flex-col justify-center px-4 py-12 sm:px-6 lg:flex-none lg:px-20 xl:px-24">
        <div className="mx-auto w-full max-w-sm lg:w-96">
          {/* Mobile logo */}
          <div className="lg:hidden text-center mb-8">
            <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center mx-auto mb-4">
              <span className="text-xl font-bold text-white">WG</span>
            </div>
            <h1 className="text-2xl font-bold text-gray-900">
              WhatsApp Gateway
            </h1>
            <p className="text-gray-600 mt-2">SaaS Platform</p>
          </div>

          {/* Auth form content */}
          <Outlet />
          
          {/* Footer */}
          <div className="mt-8 text-center">
            <p className="text-xs text-gray-500">
              © 2026 WhatsApp Gateway SaaS. All rights reserved.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthLayout;