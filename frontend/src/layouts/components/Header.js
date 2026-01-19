import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Bars3Icon,
  BellIcon,
  UserCircleIcon,
  Cog6ToothIcon,
  ArrowRightOnRectangleIcon
} from '@heroicons/react/24/outline';
import { useAuth } from '../../contexts/AuthContext';
import Dropdown, { DropdownItem, DropdownDivider } from '../../components/common/Dropdown';
import { DotBadge } from '../../components/common/Badge';
import Button from '../../components/common/Button';

const Header = ({ onMenuClick }) => {
  const { user, logout, isAdmin } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const handleProfile = () => {
    navigate('/profile');
  };

  const handleSettings = () => {
    navigate(isAdmin ? '/admin/settings' : '/settings');
  };

  // Mock notification count - in real app, this would come from context/API
  const notificationCount = 3;

  return (
    <div className="sticky top-0 z-40 flex h-16 shrink-0 items-center gap-x-4 border-b border-gray-200 bg-white px-4 shadow-sm sm:gap-x-6 sm:px-6 lg:px-8">
      {/* Mobile menu button */}
      <button
        type="button"
        className="-m-2.5 p-2.5 text-gray-700 lg:hidden"
        onClick={onMenuClick}
      >
        <span className="sr-only">Open sidebar</span>
        <Bars3Icon className="h-6 w-6" aria-hidden="true" />
      </button>

      {/* Separator */}
      <div className="h-6 w-px bg-gray-200 lg:hidden" aria-hidden="true" />

      <div className="flex flex-1 gap-x-4 self-stretch lg:gap-x-6">
        {/* Search - placeholder for future implementation */}
        <div className="flex flex-1">
          {/* Search will be implemented later */}
        </div>

        <div className="flex items-center gap-x-4 lg:gap-x-6">
          {/* Notifications */}
          <DotBadge count={notificationCount} variant="danger" size="sm">
            <button
              type="button"
              className="-m-2.5 p-2.5 text-gray-400 hover:text-gray-500"
            >
              <span className="sr-only">View notifications</span>
              <BellIcon className="h-6 w-6" aria-hidden="true" />
            </button>
          </DotBadge>

          {/* Separator */}
          <div className="hidden lg:block lg:h-6 lg:w-px lg:bg-gray-200" aria-hidden="true" />

          {/* Profile dropdown */}
          <Dropdown
            align="right"
            width="w-48"
            trigger={
              <button className="-m-1.5 flex items-center p-1.5 hover:bg-gray-50 rounded-lg transition-colors">
                <span className="sr-only">Open user menu</span>
                <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center">
                  <span className="text-sm font-medium text-gray-700">
                    {user?.name?.charAt(0)?.toUpperCase() || 'U'}
                  </span>
                </div>
                <span className="hidden lg:flex lg:items-center">
                  <span className="ml-4 text-sm font-semibold leading-6 text-gray-900" aria-hidden="true">
                    {user?.name}
                  </span>
                </span>
              </button>
            }
          >
            <div className="px-4 py-3 border-b border-gray-100">
              <p className="text-sm font-medium text-gray-900">{user?.name}</p>
              <p className="text-sm text-gray-500">{user?.email}</p>
              <p className="text-xs text-gray-400 capitalize mt-1">{user?.role}</p>
            </div>

            <DropdownItem onClick={handleProfile}>
              <UserCircleIcon className="w-4 h-4 mr-3" />
              Profile
            </DropdownItem>

            <DropdownItem onClick={handleSettings}>
              <Cog6ToothIcon className="w-4 h-4 mr-3" />
              Settings
            </DropdownItem>

            <DropdownDivider />

            <DropdownItem onClick={handleLogout} danger>
              <ArrowRightOnRectangleIcon className="w-4 h-4 mr-3" />
              Sign out
            </DropdownItem>
          </Dropdown>
        </div>
      </div>
    </div>
  );
};

export default Header;