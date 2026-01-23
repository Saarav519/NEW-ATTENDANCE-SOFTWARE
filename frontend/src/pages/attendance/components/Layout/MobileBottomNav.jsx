import React, { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { 
  Home, Calendar, FileText, Receipt, User, Users, 
  DollarSign, CreditCard, Briefcase, Clock, MoreHorizontal,
  ClipboardList, X, CalendarOff, Wallet, BarChart3, Gift
} from 'lucide-react';

const MobileBottomNav = () => {
  const { user } = useAuth();
  const location = useLocation();
  const [showMore, setShowMore] = useState(false);

  // Define nav items for each role
  const getNavItems = () => {
    const role = user?.role;
    
    if (role === 'admin') {
      return {
        main: [
          { path: '/attendance/dashboard', icon: Home, label: 'Home' },
          { path: '/attendance/attendance', icon: Calendar, label: 'Attendance' },
          { path: '/attendance/payroll', icon: DollarSign, label: 'Payroll' },
          { path: '/attendance/cashbook', icon: CreditCard, label: 'Cashbook' },
        ],
        more: [
          { path: '/attendance/employees', icon: Users, label: 'Employees' },
          { path: '/attendance/leaves', icon: CalendarOff, label: 'Leaves' },
          { path: '/attendance/bills', icon: Receipt, label: 'Bills' },
          { path: '/attendance/holidays', icon: Gift, label: 'Holidays' },
          { path: '/attendance/reports', icon: BarChart3, label: 'Reports' },
          { path: '/attendance/profile', icon: User, label: 'Profile' },
        ]
      };
    } else if (role === 'teamlead') {
      return {
        main: [
          { path: '/attendance/dashboard', icon: Home, label: 'Home' },
          { path: '/attendance/team-attendance', icon: Calendar, label: 'Attendance' },
          { path: '/attendance/leaves', icon: CalendarOff, label: 'Leaves' },
          { path: '/attendance/bills', icon: Receipt, label: 'Bills' },
        ],
        more: [
          { path: '/attendance/my-attendance', icon: Clock, label: 'My Attendance' },
          { path: '/attendance/payslip', icon: DollarSign, label: 'Payslip' },
          { path: '/attendance/team', icon: Users, label: 'Team' },
          { path: '/attendance/profile', icon: User, label: 'Profile' },
        ]
      };
    } else {
      // Employee
      return {
        main: [
          { path: '/attendance/dashboard', icon: Home, label: 'Home' },
          { path: '/attendance/attendance-details', icon: Calendar, label: 'Attendance' },
          { path: '/attendance/leaves', icon: CalendarOff, label: 'Leaves' },
          { path: '/attendance/bills', icon: Receipt, label: 'Bills' },
        ],
        more: [
          { path: '/attendance/payslip', icon: DollarSign, label: 'Payslip' },
          { path: '/attendance/profile', icon: User, label: 'Profile' },
        ]
      };
    }
  };

  const navItems = getNavItems();

  // Check if current path is in more menu
  const isMoreActive = navItems.more.some(item => location.pathname === item.path || location.pathname.startsWith(item.path + '/'));

  return (
    <>
      {/* More Menu Overlay */}
      {showMore && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setShowMore(false)}
        />
      )}
      
      {/* More Menu Panel */}
      {showMore && (
        <div className="fixed bottom-16 left-2 right-2 bg-white border border-gray-200 shadow-2xl z-50 lg:hidden rounded-2xl overflow-hidden">
          <div className="flex items-center justify-between p-3 border-b bg-gray-50">
            <span className="font-semibold text-gray-700">More Options</span>
            <button 
              onClick={() => setShowMore(false)}
              className="p-1 hover:bg-gray-200 rounded-full"
            >
              <X size={18} className="text-gray-500" />
            </button>
          </div>
          <div className="grid grid-cols-4 gap-2 p-3">
            {navItems.more.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                onClick={() => setShowMore(false)}
                className={({ isActive }) =>
                  `flex flex-col items-center p-3 rounded-xl transition-all ${
                    isActive 
                      ? 'bg-[#1E2A5E] text-white shadow-lg' 
                      : 'text-gray-600 hover:bg-gray-100'
                  }`
                }
              >
                <item.icon size={22} />
                <span className="text-[10px] mt-1.5 font-medium text-center leading-tight">{item.label}</span>
              </NavLink>
            ))}
          </div>
        </div>
      )}

      {/* Bottom Navigation Bar */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 lg:hidden z-50 safe-area-bottom">
        <div className="flex justify-around items-center h-16">
          {navItems.main.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              onClick={() => setShowMore(false)}
              className={({ isActive }) =>
                `flex flex-col items-center justify-center flex-1 h-full transition-colors ${
                  isActive ? 'text-[#1E2A5E]' : 'text-gray-400'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <div className={`p-1.5 rounded-xl transition-colors ${isActive ? 'bg-[#1E2A5E]/10' : ''}`}>
                    <item.icon size={20} strokeWidth={isActive ? 2.5 : 2} />
                  </div>
                  <span className={`text-[9px] mt-0.5 ${isActive ? 'font-semibold' : ''}`}>
                    {item.label}
                  </span>
                </>
              )}
            </NavLink>
          ))}
          
          {/* More Button */}
          <button
            onClick={() => setShowMore(!showMore)}
            className={`flex flex-col items-center justify-center flex-1 h-full transition-colors ${
              showMore || isMoreActive ? 'text-[#1E2A5E]' : 'text-gray-400'
            }`}
          >
            <div className={`p-1.5 rounded-xl transition-colors ${showMore || isMoreActive ? 'bg-[#1E2A5E]/10' : ''}`}>
              <MoreHorizontal size={20} strokeWidth={showMore || isMoreActive ? 2.5 : 2} />
            </div>
            <span className={`text-[9px] mt-0.5 ${showMore || isMoreActive ? 'font-semibold' : ''}`}>
              More
            </span>
          </button>
        </div>
      </nav>
    </>
  );
};

export default MobileBottomNav;
