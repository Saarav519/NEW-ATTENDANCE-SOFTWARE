import React from 'react';
import { dashboardWidgets, mobileMenuItems } from '../data/mockData';
import { Users, Calendar, Clock, Wallet, MessageSquare, Banknote, Gift, Car, UserX, FileText, AlertCircle, Receipt, TrendingUp, ChevronRight } from 'lucide-react';

const iconMap = {
  users: Users,
  calendar: Calendar,
  clock: Clock,
  wallet: Wallet,
  message: MessageSquare,
  banknote: Banknote,
  gift: Gift,
  car: Car,
  'user-x': UserX,
  'file-text': FileText,
  'alert-circle': AlertCircle,
  receipt: Receipt,
};

const HeroSection = () => {
  return (
    <section className="relative pt-20 overflow-hidden">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-b from-white via-white to-[#1E2A5E]" style={{ height: '100%' }}></div>
      
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 pb-8">
        {/* Hero Text */}
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-[#1E2A5E] mb-4 leading-tight">
            Aapke Business ka Digital Saathi
          </h1>
          <p className="text-gray-600 text-lg md:text-xl max-w-2xl mx-auto">
            An easy to use solution for Your Business Management
          </p>
        </div>

        {/* Dashboard Preview */}
        <div className="relative flex justify-center items-end gap-4 mt-8">
          {/* Desktop Dashboard */}
          <div className="relative bg-white rounded-2xl shadow-2xl p-4 max-w-3xl w-full transform hover:scale-[1.02] transition-transform duration-500">
            {/* Browser Header */}
            <div className="flex items-center gap-2 mb-4 pb-3 border-b">
              <div className="flex gap-1.5">
                <div className="w-3 h-3 rounded-full bg-red-400"></div>
                <div className="w-3 h-3 rounded-full bg-yellow-400"></div>
                <div className="w-3 h-3 rounded-full bg-green-400"></div>
              </div>
              <div className="flex-1 flex items-center justify-center">
                <div className="flex items-center gap-2 bg-gray-100 rounded-lg px-4 py-1.5">
                  <div className="w-4 h-4 bg-[#2D3A8C] rounded-full flex items-center justify-center">
                    <div className="w-1.5 h-1.5 bg-white rounded-full"></div>
                  </div>
                  <span className="text-sm text-gray-600">Audix Solutions</span>
                </div>
              </div>
              <button className="bg-orange-500 text-white text-xs px-3 py-1 rounded-full hover:bg-orange-600 transition-colors">
                Explore our Premium Plans
              </button>
            </div>

            {/* Dashboard Content */}
            <div className="flex gap-4">
              {/* Sidebar */}
              <div className="hidden lg:block w-48 bg-gray-50 rounded-xl p-3">
                <div className="flex items-center gap-2 mb-4 p-2">
                  <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                    <Users size={16} className="text-blue-600" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-gray-800">Audix Solutions</p>
                    <p className="text-[10px] text-gray-500">Information Technology</p>
                  </div>
                </div>
                <nav className="space-y-1">
                  {['Home', 'Employee', 'Employee Documents', 'Attendance & Payroll', 'Overtime', 'Remark', 'Business Contact', 'Business Holidays', 'Payslip Management', 'Vehicle Management', 'User Management', 'Activity Tracker'].map((item, idx) => (
                    <div
                      key={idx}
                      className={`flex items-center gap-2 px-2 py-1.5 rounded-lg text-xs cursor-pointer transition-colors ${
                        idx === 0 ? 'bg-[#2D3A8C] text-white' : 'text-gray-600 hover:bg-gray-100'
                      }`}
                    >
                      <div className="w-4 h-4 rounded" />
                      {item}
                    </div>
                  ))}
                </nav>
              </div>

              {/* Main Content */}
              <div className="flex-1">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold text-gray-800">Home</h2>
                  <div className="flex items-center gap-2 text-xs text-gray-500 bg-gray-100 px-3 py-1.5 rounded-lg">
                    <Calendar size={12} />
                    <span>1 March - 1 September 2023</span>
                  </div>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-4 gap-3 mb-4">
                  {dashboardWidgets.map((widget) => {
                    const Icon = iconMap[widget.icon] || Users;
                    return (
                      <div
                        key={widget.id}
                        className="bg-white border rounded-xl p-3 hover:shadow-md transition-shadow cursor-pointer"
                      >
                        <div className="flex items-center gap-2">
                          <div
                            className="w-8 h-8 rounded-lg flex items-center justify-center"
                            style={{ backgroundColor: widget.color }}
                          >
                            <Icon size={14} className="text-gray-700" />
                          </div>
                          <div>
                            <p className="text-lg font-bold text-gray-800">{widget.value}</p>
                            <p className="text-[10px] text-gray-500">{widget.label}</p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Service Banners */}
                <div className="mb-4">
                  <h3 className="text-sm font-semibold text-gray-700 mb-2">Our Services</h3>
                  <div className="flex gap-3">
                    <div className="flex-1 bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl p-3 text-white">
                      <p className="text-[10px] bg-white/20 rounded px-2 py-0.5 inline-block mb-1">Coming Soon</p>
                      <p className="text-sm font-semibold">Our Expense Management Feature is Now Live!</p>
                    </div>
                    <div className="flex-1 bg-gradient-to-r from-orange-400 to-yellow-400 rounded-xl p-3 text-white">
                      <p className="text-xs font-semibold">SUMMER BIG SALE</p>
                      <p className="text-[10px]">Enhance your Productivity with SuperManage</p>
                      <p className="text-xs font-bold mt-1">Get Extra 10% OFF</p>
                    </div>
                  </div>
                </div>

                {/* Chart and Holidays */}
                <div className="flex gap-3">
                  <div className="flex-1 bg-white border rounded-xl p-3">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="text-sm font-semibold text-gray-700">Attendance</h3>
                      <div className="flex gap-2 text-[10px]">
                        <span className="flex items-center gap-1"><span className="w-2 h-2 bg-blue-500 rounded-full"></span>Present</span>
                        <span className="flex items-center gap-1"><span className="w-2 h-2 bg-red-400 rounded-full"></span>Absent</span>
                        <span className="flex items-center gap-1"><span className="w-2 h-2 bg-green-400 rounded-full"></span>Holiday</span>
                      </div>
                    </div>
                    {/* Mini Chart */}
                    <div className="h-24 flex items-end gap-1 pt-2">
                      {[30, 25, 35, 20, 40, 28, 32].map((h, i) => (
                        <div key={i} className="flex-1 flex flex-col gap-0.5">
                          <div className="bg-blue-400 rounded-t" style={{ height: `${h}%` }}></div>
                          <div className="bg-green-400" style={{ height: `${h * 0.3}%` }}></div>
                          <div className="bg-red-300 rounded-b" style={{ height: `${h * 0.2}%` }}></div>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="w-40 bg-white border rounded-xl p-3">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="text-sm font-semibold text-gray-700">Holidays</h3>
                      <span className="text-[10px] text-blue-600 cursor-pointer hover:underline">View All</span>
                    </div>
                    <div className="space-y-2">
                      {['New Year', 'Republic Day', 'Holi', 'Independence Day', 'Christmas Day'].map((holiday, idx) => (
                        <div key={idx} className="flex items-center gap-2">
                          <div className={`w-1.5 h-1.5 rounded-full ${idx % 2 === 0 ? 'bg-red-400' : 'bg-blue-400'}`}></div>
                          <div>
                            <p className="text-[10px] font-medium text-gray-700">{holiday}</p>
                            <p className="text-[8px] text-gray-400">Date 2023</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Mobile Preview */}
          <div className="hidden xl:block absolute right-0 top-20 transform translate-x-1/4">
            <div className="w-64 bg-white rounded-[2rem] shadow-2xl p-3 border-8 border-gray-800">
              {/* Phone Notch */}
              <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-24 h-6 bg-gray-800 rounded-b-xl"></div>
              
              <div className="mt-4">
                {/* Header */}
                <div className="flex items-center justify-between mb-4 px-2">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                      <Users size={14} className="text-blue-600" />
                    </div>
                    <div>
                      <p className="text-xs font-semibold">Audix Solutions</p>
                      <p className="text-[10px] text-gray-500">Business</p>
                    </div>
                  </div>
                  <div className="w-8 h-8 bg-orange-500 rounded-lg flex items-center justify-center text-white text-xs font-bold">
                    WS
                  </div>
                </div>

                {/* Banner */}
                <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl p-3 mb-4 text-white">
                  <p className="text-[10px] bg-white/20 rounded px-2 py-0.5 inline-block mb-1">Coming Soon</p>
                  <p className="text-sm font-semibold">Our Expense Management Feature is Now Live!</p>
                </div>

                {/* Menu Grid */}
                <div className="grid grid-cols-3 gap-3 px-2">
                  {mobileMenuItems.slice(0, 12).map((item) => {
                    const Icon = iconMap[item.icon] || Users;
                    const colors = ['bg-pink-100', 'bg-blue-100', 'bg-orange-100', 'bg-green-100', 'bg-purple-100', 'bg-yellow-100'];
                    return (
                      <div key={item.id} className="flex flex-col items-center gap-1 cursor-pointer hover:opacity-80 transition-opacity">
                        <div className={`w-10 h-10 ${colors[item.id % colors.length]} rounded-xl flex items-center justify-center`}>
                          <Icon size={16} className="text-gray-700" />
                        </div>
                        <p className="text-[9px] text-gray-600 text-center leading-tight">{item.label}</p>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom gradient overlay */}
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-[#1E2A5E] to-transparent"></div>
    </section>
  );
};

export default HeroSection;
