import React from 'react';
import { NavLink } from 'react-router-dom';
import { sidebarNavItems } from '../../data/mockData';
import { useAuth } from '../../context/AuthContext';
import {
  LayoutDashboard, Users, CalendarCheck, CalendarOff, Clock,
  Wallet, Banknote, BookOpen, Car, Gift, BarChart3, Home,
  ClipboardCheck, Receipt, MoreHorizontal, FileText
} from 'lucide-react';

const iconMap = {
  LayoutDashboard, Users, CalendarCheck, CalendarOff, Clock,
  Wallet, Banknote, BookOpen, Car, Gift, BarChart3, Home,
  ClipboardCheck, Receipt, FileText
};

const MobileBottomNav = () => {
  const { role } = useAuth();
  
  // Get nav items based on role
  const navItems = sidebarNavItems[role] || sidebarNavItems.employee;

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 lg:hidden z-50 safe-area-bottom">
      <div className="flex items-center justify-around h-16 px-1">
        {navItems.map((item) => {
          const Icon = iconMap[item.icon];
          return (
            <NavLink
              key={item.id}
              to={item.path}
              className={({ isActive }) =>
                `flex flex-col items-center justify-center flex-1 py-2 transition-colors ${
                  isActive ? 'text-[#1E2A5E]' : 'text-gray-400'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <div className={`p-1 rounded-xl transition-colors ${isActive ? 'bg-[#1E2A5E]/10' : ''}`}>
                    <Icon size={20} strokeWidth={isActive ? 2.5 : 2} />
                  </div>
                  <span className={`text-[9px] mt-0.5 ${isActive ? 'font-semibold' : ''}`}>
                    {item.label.split(' ')[0]}
                  </span>
                </>
              )}
            </NavLink>
          );
        })}
      </div>
    </nav>
  );
};

export default MobileBottomNav;
