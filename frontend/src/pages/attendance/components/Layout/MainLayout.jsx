import React, { useState, useEffect } from 'react';
import { Outlet, Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import Sidebar from './Sidebar';
import MobileBottomNav from './MobileBottomNav';
import NotificationBell from '../NotificationBell';
import { LogOut, ChevronDown } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '../ui/dropdown-menu';
import { useNavigate } from 'react-router-dom';

const MainLayout = () => {
  const { user, loading, logout, role, isAdmin } = useAuth();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const navigate = useNavigate();

  // Hide Emergent badge on inner pages (when logged in)
  useEffect(() => {
    if (user) {
      document.body.classList.add('hide-emergent-badge');
      // Also directly hide the badge element for inline styles with !important
      const badge = document.getElementById('emergent-badge');
      if (badge) {
        badge.style.setProperty('display', 'none', 'important');
      }
    }
    return () => {
      document.body.classList.remove('hide-emergent-badge');
      // Restore badge when leaving inner pages
      const badge = document.getElementById('emergent-badge');
      if (badge) {
        badge.style.setProperty('display', 'flex', 'important');
      }
    };
  }, [user]);

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin w-8 h-8 border-4 border-[#1E2A5E] border-t-transparent rounded-full"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const getRoleBadgeColor = () => {
    switch (role) {
      case 'admin': return 'bg-red-100 text-red-700';
      case 'teamlead': return 'bg-blue-100 text-blue-700';
      default: return 'bg-green-100 text-green-700';
    }
  };

  const getRoleLabel = () => {
    switch (role) {
      case 'admin': return 'Admin';
      case 'teamlead': return 'Team Lead';
      default: return 'Employee';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Sidebar - Desktop only */}
      <Sidebar collapsed={sidebarCollapsed} setCollapsed={setSidebarCollapsed} />

      {/* Main Content */}
      <div
        className={`transition-all duration-300 ${
          isAdmin ? (sidebarCollapsed ? 'lg:ml-20' : 'lg:ml-64') : 'lg:ml-64'
        }`}
      >
        {/* Top Header */}
        <header className="h-14 lg:h-16 bg-white border-b border-gray-200 flex items-center justify-between px-4 lg:px-6 sticky top-0 z-30">
          {/* Mobile: Logo & Title */}
          <div className="flex items-center gap-3 lg:hidden">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#1E2A5E] to-blue-500 flex items-center justify-center text-white font-bold text-sm">
              A
            </div>
            <div>
              <h1 className="text-sm font-bold text-gray-800">Audix Solutions</h1>
              <p className="text-[10px] text-gray-500">Staff Management</p>
            </div>
          </div>

          {/* Desktop: Search or empty */}
          <div className="hidden lg:block">
            <span className={`text-xs px-2 py-1 rounded-full font-medium ${getRoleBadgeColor()}`}>
              {getRoleLabel()}
            </span>
          </div>

          {/* Right side */}
          <div className="flex items-center gap-2 lg:gap-3">
            {/* Role badge - Mobile */}
            <span className={`lg:hidden text-[10px] px-2 py-0.5 rounded-full font-medium ${getRoleBadgeColor()}`}>
              {getRoleLabel()}
            </span>

            {/* Notifications - Using NotificationBell component */}
            <NotificationBell />

            {/* User Menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center gap-2 p-1.5 hover:bg-gray-100 rounded-xl transition-colors">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#1E2A5E] to-blue-500 flex items-center justify-center text-white font-bold text-sm">
                    {user?.name?.charAt(0)}
                  </div>
                  <ChevronDown size={16} className="text-gray-400 hidden lg:block" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <div className="px-3 py-2 border-b">
                  <p className="font-medium text-sm">{user?.name}</p>
                  <p className="text-xs text-gray-500">{user?.designation}</p>
                </div>
                <DropdownMenuItem onClick={handleLogout} className="text-red-600">
                  <LogOut size={16} className="mr-2" />
                  Logout
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        {/* Page Content */}
        <main className="p-4 lg:p-6 pb-24 lg:pb-6">
          <Outlet />
        </main>
      </div>

      {/* Mobile Bottom Navigation */}
      <MobileBottomNav />
    </div>
  );
};

export default MainLayout;
