import React from 'react';
import { features } from '../data/mockData';
import { Users, Calendar, Clock, Wallet, Banknote, Car, FileText, CheckCircle, TrendingUp, PieChart, BarChart3 } from 'lucide-react';

const FeatureCard = ({ feature, index }) => {
  const isLeft = feature.imagePosition === 'left';
  
  return (
    <div className={`flex flex-col ${isLeft ? 'lg:flex-row' : 'lg:flex-row-reverse'} items-center gap-8 lg:gap-16 py-16`}>
      {/* Image/Illustration */}
      <div className="flex-1 w-full max-w-lg">
        <div className="relative">
          {/* Phone Mockup */}
          <div className="relative mx-auto w-72">
            {/* Shadow */}
            <div className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 w-48 h-8 bg-gray-200 rounded-full blur-xl opacity-50"></div>
            
            {/* Phone Frame */}
            <div className="relative bg-white rounded-[2.5rem] shadow-2xl p-3 border-[6px] border-gray-200">
              {/* Phone Notch */}
              <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-20 h-5 bg-gray-200 rounded-b-2xl"></div>
              
              <div className="bg-gray-50 rounded-[2rem] overflow-hidden pt-6">
                {/* Content based on feature */}
                {feature.id === 1 && <MobilePlatformMockup />}
                {feature.id === 2 && <WorkforceMockup />}
                {feature.id === 3 && <PayrollMockup />}
                {feature.id === 4 && <CashbookMockup />}
                {feature.id === 5 && <VehicleMockup />}
                {feature.id === 6 && <ReportsMockup />}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Text Content */}
      <div className="flex-1">
        <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6">
          {feature.title}
        </h2>
        <ul className="space-y-4">
          {feature.description.map((item, idx) => (
            <li key={idx} className="flex items-start gap-3">
              <div className="w-2 h-2 bg-[#2D3A8C] rounded-full mt-2 flex-shrink-0"></div>
              <p className="text-gray-600 text-lg">{item}</p>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

// Mockup Components
const MobilePlatformMockup = () => (
  <div className="p-4">
    <div className="flex items-center justify-between mb-4">
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 bg-blue-100 rounded-lg"></div>
        <div>
          <p className="text-xs font-semibold">Audix Solutions</p>
          <p className="text-[10px] text-gray-500">Business</p>
        </div>
      </div>
      <div className="w-8 h-8 bg-orange-500 rounded-lg"></div>
    </div>
    <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl p-3 mb-4 text-white">
      <p className="text-[10px] bg-white/20 rounded px-2 py-0.5 inline-block mb-1">Coming Soon</p>
      <p className="text-xs font-semibold">Our Expense Management Feature is Now Live!</p>
    </div>
    <div className="grid grid-cols-3 gap-3">
      {['Employee', 'Attendance', 'Overtime', 'Advance', 'Remark', 'Payroll', 'Holidays', 'Vehicle', 'Inactive'].map((item, i) => (
        <div key={i} className="flex flex-col items-center">
          <div className={`w-10 h-10 rounded-xl mb-1 ${['bg-pink-100', 'bg-blue-100', 'bg-orange-100', 'bg-green-100', 'bg-purple-100', 'bg-yellow-100'][i % 6]}`}></div>
          <p className="text-[8px] text-gray-600">{item}</p>
        </div>
      ))}
    </div>
  </div>
);

const WorkforceMockup = () => (
  <div className="p-4">
    <div className="text-center mb-4">
      <div className="w-16 h-16 bg-blue-100 rounded-full mx-auto mb-2 flex items-center justify-center">
        <Users size={24} className="text-blue-600" />
      </div>
      <p className="text-sm font-semibold">Staff Management</p>
    </div>
    <div className="space-y-2">
      {[{ name: 'Rahul Kumar', status: 'Present', color: 'bg-green-100 text-green-700' }, { name: 'Priya Singh', status: 'On Leave', color: 'bg-yellow-100 text-yellow-700' }, { name: 'Amit Sharma', status: 'Present', color: 'bg-green-100 text-green-700' }].map((emp, i) => (
        <div key={i} className="flex items-center justify-between bg-white rounded-lg p-2 shadow-sm">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gray-200 rounded-full"></div>
            <p className="text-xs font-medium">{emp.name}</p>
          </div>
          <span className={`text-[10px] px-2 py-0.5 rounded-full ${emp.color}`}>{emp.status}</span>
        </div>
      ))}
    </div>
  </div>
);

const PayrollMockup = () => (
  <div className="p-4">
    <h3 className="text-sm font-semibold mb-3">Payroll Summary</h3>
    <div className="bg-white rounded-xl p-3 shadow-sm mb-3">
      <div className="flex justify-between items-center mb-2">
        <span className="text-xs text-gray-500">Total Salary</span>
        <span className="text-lg font-bold text-green-600">₹2,45,000</span>
      </div>
      <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
        <div className="h-full w-3/4 bg-gradient-to-r from-green-400 to-green-600 rounded-full"></div>
      </div>
    </div>
    <div className="grid grid-cols-2 gap-2">
      {[{ label: 'Paid', value: '₹1,85,000', color: 'text-green-600' }, { label: 'Pending', value: '₹60,000', color: 'text-orange-500' }].map((item, i) => (
        <div key={i} className="bg-white rounded-lg p-2 shadow-sm text-center">
          <p className="text-[10px] text-gray-500">{item.label}</p>
          <p className={`text-sm font-bold ${item.color}`}>{item.value}</p>
        </div>
      ))}
    </div>
  </div>
);

const CashbookMockup = () => (
  <div className="p-4">
    <h3 className="text-sm font-semibold mb-3">Cashbook</h3>
    <div className="grid grid-cols-2 gap-2 mb-3">
      <div className="bg-green-50 rounded-xl p-3 text-center">
        <TrendingUp size={20} className="text-green-600 mx-auto mb-1" />
        <p className="text-[10px] text-gray-500">Cash In</p>
        <p className="text-sm font-bold text-green-600">₹15,000</p>
      </div>
      <div className="bg-red-50 rounded-xl p-3 text-center">
        <TrendingUp size={20} className="text-red-500 mx-auto mb-1 rotate-180" />
        <p className="text-[10px] text-gray-500">Cash Out</p>
        <p className="text-sm font-bold text-red-500">₹7,500</p>
      </div>
    </div>
    <div className="space-y-2">
      {[{ name: 'Charan Chauhan', amount: '₹15,000', type: 'Customer' }, { name: 'Mohit Singh', amount: '₹6,500', type: 'Supplier' }].map((t, i) => (
        <div key={i} className="flex items-center justify-between bg-white rounded-lg p-2 shadow-sm">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center text-[10px] font-bold text-blue-600">
              {t.name.split(' ').map(n => n[0]).join('')}
            </div>
            <div>
              <p className="text-xs font-medium">{t.name}</p>
              <p className="text-[10px] text-gray-400">{t.type}</p>
            </div>
          </div>
          <span className={`text-xs font-semibold ${i === 0 ? 'text-green-600' : 'text-red-500'}`}>{i === 0 ? '+' : '-'}{t.amount}</span>
        </div>
      ))}
    </div>
  </div>
);

const VehicleMockup = () => (
  <div className="p-4">
    <h3 className="text-sm font-semibold mb-3">Vehicle Details</h3>
    <div className="grid grid-cols-2 gap-2 mb-3">
      {[{ label: 'July Fuel Expense', value: '₹16,869', icon: '⛽' }, { label: 'July Service Expense', value: '₹65,214', icon: '🔧' }, { label: 'Total Service Expense', value: '₹5,653', icon: '📊' }, { label: 'Total Other Expense', value: '₹2,342', icon: '📋' }].map((item, i) => (
        <div key={i} className="bg-white rounded-xl p-2 shadow-sm">
          <span className="text-lg">{item.icon}</span>
          <p className="text-[10px] text-gray-500">{item.label}</p>
          <p className="text-xs font-bold text-gray-800">{item.value}</p>
        </div>
      ))}
    </div>
    <div className="bg-white rounded-xl p-3 shadow-sm">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-semibold">Mahindra XUV 500</p>
          <p className="text-[10px] text-gray-400">DL5CH05248 • Diesel • Personal</p>
        </div>
        <Car size={20} className="text-gray-400" />
      </div>
      <div className="flex gap-3 mt-2">
        <span className="text-[10px] text-gray-500">⛽ ₹1,680</span>
        <span className="text-[10px] text-gray-500">🔧 ₹2,560</span>
      </div>
    </div>
  </div>
);

const ReportsMockup = () => (
  <div className="p-4">
    <h3 className="text-sm font-semibold mb-3">Reports</h3>
    <div className="grid grid-cols-2 gap-2 mb-3">
      {['Attendance', 'Payroll', 'Overtime', 'Advance'].map((report, i) => (
        <div key={i} className="bg-white rounded-xl p-3 shadow-sm flex items-center gap-2">
          <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${['bg-blue-100', 'bg-green-100', 'bg-orange-100', 'bg-purple-100'][i]}`}>
            {[<BarChart3 size={14} />, <PieChart size={14} />, <Clock size={14} />, <Wallet size={14} />][i]}
          </div>
          <p className="text-xs font-medium">{report}</p>
        </div>
      ))}
    </div>
    <div className="bg-white rounded-xl p-3 shadow-sm">
      <div className="flex items-center justify-between mb-2">
        <p className="text-xs font-semibold">Monthly Overview</p>
        <span className="text-[10px] text-blue-600">Download</span>
      </div>
      <div className="h-16 flex items-end gap-1">
        {[40, 65, 45, 80, 55, 70, 50].map((h, i) => (
          <div key={i} className="flex-1 bg-gradient-to-t from-blue-500 to-blue-300 rounded-t" style={{ height: `${h}%` }}></div>
        ))}
      </div>
    </div>
  </div>
);

const FeaturesSection = () => {
  return (
    <section className="bg-white py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-center text-gray-900 mb-4">
          One-Stop Solution for Your Business
        </h2>
        
        <div className="divide-y divide-gray-100">
          {features.map((feature, index) => (
            <FeatureCard key={feature.id} feature={feature} index={index} />
          ))}
        </div>
      </div>
    </section>
  );
};

export default FeaturesSection;
