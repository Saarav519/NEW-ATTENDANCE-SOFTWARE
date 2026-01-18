import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { sidebarNavItems, businessInfo } from '../../data/mockData';
import { useAuth } from '../../context/AuthContext';
import {
  LayoutDashboard, Users, CalendarCheck, CalendarOff, Clock,
  Wallet, Banknote, BookOpen, Car, Gift, BarChart3, Home,
  LogOut, ChevronLeft, ChevronRight, ClipboardCheck, Receipt
} from 'lucide-react';

const iconMap = {
  LayoutDashboard, Users, CalendarCheck, CalendarOff, Clock,
  Wallet, Banknote, BookOpen, Car, Gift, BarChart3, Home,
  ClipboardCheck, Receipt
};

const Sidebar = ({ collapsed, setCollapsed }) => {
  const { user, logout, role } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  // Get nav items based on role
  const navItems = sidebarNavItems[role] || sidebarNavItems.employee;

  return (
    <aside
      className={`fixed left-0 top-0 h-screen bg-[#1E2A5E] text-white transition-all duration-300 z-40 hidden lg:block ${
        collapsed ? 'w-20' : 'w-64'
      }`}
    >
      {/* Logo Section */}
      <div className="h-16 flex items-center justify-between px-4 border-b border-white/10">
        {!collapsed && (
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center font-bold text-lg">
              {businessInfo.name.charAt(0)}
            </div>
            <div className="overflow-hidden">
              <h1 className="font-bold text-sm truncate">{businessInfo.name}</h1>
              <p className="text-[10px] text-gray-400 truncate">{businessInfo.type}</p>
            </div>
          </div>
        )}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="p-2 hover:bg-white/10 rounded-lg transition-colors"
        >
          {collapsed ? <ChevronRight size={20} /> : <ChevronLeft size={20} />}
        </button>
      </div>

      {/* Role Badge */}
      {!collapsed && (
        <div className="px-4 py-3">
          <span className={`text-xs px-3 py-1 rounded-full font-medium ${
            role === 'admin' ? 'bg-red-500/20 text-red-300' :
            role === 'teamlead' ? 'bg-blue-500/20 text-blue-300' :
            'bg-green-500/20 text-green-300'
          }`}>
            {role === 'admin' ? 'Administrator' : role === 'teamlead' ? 'Team Leader' : 'Employee'}
          </span>
        </div>
      )}

      {/* Navigation */}
      <nav className="flex-1 py-2 px-3 overflow-y-auto" style={{ height: 'calc(100vh - 180px)' }}>
        <ul className="space-y-1">
          {navItems.map((item) => {
            const Icon = iconMap[item.icon];
            return (
              <li key={item.id}>
                <NavLink
                  to={item.path}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all ${
                      isActive
                        ? 'bg-white text-[#1E2A5E] font-semibold shadow-lg'
                        : 'text-gray-300 hover:bg-white/10'
                    } ${collapsed ? 'justify-center' : ''}`
                  }
                  title={collapsed ? item.label : ''}
                >
                  <Icon size={20} />
                  {!collapsed && <span className="text-sm">{item.label}</span>}
                </NavLink>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* User Section */}
      <div className="absolute bottom-0 left-0 right-0 p-3 border-t border-white/10 bg-[#1E2A5E]">
        <div className={`flex items-center ${collapsed ? 'justify-center' : 'justify-between'}`}>
          {!collapsed && (
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center font-bold text-sm">
                {user?.name?.charAt(0) || 'U'}
              </div>
              <div className="overflow-hidden">
                <p className="text-sm font-medium truncate">{user?.name}</p>
                <p className="text-[10px] text-gray-400 capitalize">{user?.designation}</p>
              </div>
            </div>
          )}
          <button
            onClick={handleLogout}
            className="p-2 hover:bg-white/10 rounded-lg transition-colors text-gray-400 hover:text-white"
            title="Logout"
          >
            <LogOut size={18} />
          </button>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
