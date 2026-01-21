import React from 'react';
import { Users, Calendar, Clock, Wallet, Banknote, Gift, Car, FileText, MessageSquare, BarChart3 } from 'lucide-react';

const DownloadSection = () => {
  return (
    <section className="relative bg-gradient-to-b from-gray-50 to-white py-20 overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col lg:flex-row items-center gap-12">
          {/* Text Content */}
          <div className="flex-1 text-center lg:text-left">
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900 mb-4">
              Download Audix Solutions Today!
            </h2>
            <p className="text-xl text-gray-600 mb-8">
              Smart management for your business.
            </p>

            {/* App Store Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
              <a
                href="https://play.google.com/store/apps/details?id=com.appigizer.Attendance"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-3 bg-black text-white px-6 py-3 rounded-xl hover:bg-gray-800 transition-all hover:scale-105 shadow-lg"
              >
                <svg viewBox="0 0 24 24" className="w-8 h-8" fill="currentColor">
                  <path d="M3,20.5V3.5C3,2.91 3.34,2.39 3.84,2.15L13.69,12L3.84,21.85C3.34,21.6 3,21.09 3,20.5M16.81,15.12L6.05,21.34L14.54,12.85L16.81,15.12M20.16,10.81C20.5,11.08 20.75,11.5 20.75,12C20.75,12.5 20.5,12.92 20.16,13.19L17.89,14.5L15.39,12L17.89,9.5L20.16,10.81M6.05,2.66L16.81,8.88L14.54,11.15L6.05,2.66Z" />
                </svg>
                <div className="text-left">
                  <p className="text-[10px] uppercase tracking-wider opacity-80">GET IT ON</p>
                  <p className="text-lg font-semibold -mt-1">Google Play</p>
                </div>
              </a>

              <a
                href="https://apps.apple.com/in/app/audix-solutions-attendance/id6475690882"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-3 bg-black text-white px-6 py-3 rounded-xl hover:bg-gray-800 transition-all hover:scale-105 shadow-lg"
              >
                <svg viewBox="0 0 24 24" className="w-8 h-8" fill="currentColor">
                  <path d="M18.71,19.5C17.88,20.74 17,21.95 15.66,21.97C14.32,22 13.89,21.18 12.37,21.18C10.84,21.18 10.37,21.95 9.1,22C7.79,22.05 6.8,20.68 5.96,19.47C4.25,17 2.94,12.45 4.7,9.39C5.57,7.87 7.13,6.91 8.82,6.88C10.1,6.86 11.32,7.75 12.11,7.75C12.89,7.75 14.37,6.68 15.92,6.84C16.57,6.87 18.39,7.1 19.56,8.82C19.47,8.88 17.39,10.1 17.41,12.63C17.44,15.65 20.06,16.66 20.09,16.67C20.06,16.74 19.67,18.11 18.71,19.5M13,3.5C13.73,2.67 14.94,2.04 15.94,2C16.07,3.17 15.6,4.35 14.9,5.19C14.21,6.04 13.07,6.7 11.95,6.61C11.8,5.46 12.36,4.26 13,3.5Z" />
                </svg>
                <div className="text-left">
                  <p className="text-[10px] uppercase tracking-wider opacity-80">Download on the</p>
                  <p className="text-lg font-semibold -mt-1">App Store</p>
                </div>
              </a>
            </div>
          </div>

          {/* Phone Mockup */}
          <div className="flex-1 relative">
            <div className="relative mx-auto w-80">
              {/* Floating Icons */}
              <div className="absolute -left-8 top-10 w-12 h-12 bg-pink-100 rounded-xl flex items-center justify-center shadow-lg animate-bounce" style={{ animationDelay: '0s', animationDuration: '3s' }}>
                <Users size={20} className="text-pink-600" />
              </div>
              <div className="absolute -right-4 top-20 w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center shadow-lg animate-bounce" style={{ animationDelay: '0.5s', animationDuration: '3s' }}>
                <Calendar size={16} className="text-blue-600" />
              </div>
              <div className="absolute -left-4 top-1/2 w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center shadow-lg animate-bounce" style={{ animationDelay: '1s', animationDuration: '3s' }}>
                <Banknote size={16} className="text-green-600" />
              </div>
              <div className="absolute -right-8 top-1/3 w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center shadow-lg animate-bounce" style={{ animationDelay: '1.5s', animationDuration: '3s' }}>
                <Clock size={20} className="text-orange-600" />
              </div>
              <div className="absolute left-4 bottom-20 w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center shadow-lg animate-bounce" style={{ animationDelay: '2s', animationDuration: '3s' }}>
                <Car size={16} className="text-purple-600" />
              </div>
              <div className="absolute right-4 bottom-32 w-10 h-10 bg-yellow-100 rounded-xl flex items-center justify-center shadow-lg animate-bounce" style={{ animationDelay: '2.5s', animationDuration: '3s' }}>
                <BarChart3 size={16} className="text-yellow-600" />
              </div>

              {/* Phone Frame */}
              <div className="relative bg-white rounded-[3rem] shadow-2xl p-4 border-8 border-gray-200">
                {/* Phone Notch */}
                <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-24 h-6 bg-gray-200 rounded-b-2xl"></div>
                
                <div className="bg-gray-50 rounded-[2rem] overflow-hidden pt-6">
                  {/* App Content */}
                  <div className="p-4">
                    {/* Header */}
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-2">
                        <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
                          <Users size={18} className="text-blue-600" />
                        </div>
                        <div>
                          <p className="text-sm font-semibold">Audix Solutions</p>
                          <p className="text-[10px] text-gray-500">Business</p>
                        </div>
                      </div>
                      <div className="w-10 h-10 bg-orange-500 rounded-xl flex items-center justify-center text-white font-bold text-sm">
                        AS
                      </div>
                    </div>

                    {/* Banner */}
                    <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl p-4 mb-4 text-white">
                      <p className="text-[10px] bg-white/20 rounded px-2 py-0.5 inline-block mb-2">Coming Soon</p>
                      <p className="text-sm font-semibold">Our Expense Management Feature is Now Live!</p>
                    </div>

                    {/* Menu Grid */}
                    <div className="grid grid-cols-3 gap-4">
                      {[
                        { icon: Users, label: 'Employee', color: 'bg-pink-100' },
                        { icon: Calendar, label: 'Attendance', color: 'bg-blue-100' },
                        { icon: Clock, label: 'Overtime', color: 'bg-orange-100' },
                        { icon: Wallet, label: 'Advance', color: 'bg-green-100' },
                        { icon: MessageSquare, label: 'Remark', color: 'bg-purple-100' },
                        { icon: Banknote, label: 'Payroll', color: 'bg-yellow-100' },
                        { icon: Gift, label: 'Holidays', color: 'bg-red-100' },
                        { icon: Car, label: 'Vehicle', color: 'bg-teal-100' },
                        { icon: FileText, label: 'Documents', color: 'bg-indigo-100' },
                      ].map((item, i) => (
                        <div key={i} className="flex flex-col items-center">
                          <div className={`w-12 h-12 ${item.color} rounded-xl flex items-center justify-center mb-1`}>
                            <item.icon size={18} className="text-gray-700" />
                          </div>
                          <p className="text-[10px] text-gray-600 text-center">{item.label}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default DownloadSection;
