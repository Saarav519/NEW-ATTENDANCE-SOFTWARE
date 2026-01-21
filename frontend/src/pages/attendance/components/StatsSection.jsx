import React from 'react';
import { stats } from '../data/mockData';
import { Users, Star, Globe } from 'lucide-react';

const iconMap = {
  users: Users,
  star: Star,
  globe: Globe,
};

const colorMap = {
  users: { bg: 'bg-gradient-to-br from-red-400 via-yellow-400 to-blue-500', ring: 'ring-red-200' },
  star: { bg: 'bg-gradient-to-br from-blue-400 to-purple-500', ring: 'ring-blue-200' },
  globe: { bg: 'bg-gradient-to-br from-green-400 to-teal-500', ring: 'ring-green-200' },
};

const StatsSection = () => {
  return (
    <section className="relative bg-white py-8 -mt-16 z-10">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 py-8 px-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 divide-y md:divide-y-0 md:divide-x divide-gray-200">
            {stats.map((stat, index) => {
              const Icon = iconMap[stat.icon];
              const colors = colorMap[stat.icon];
              return (
                <div
                  key={stat.id}
                  className={`flex items-center justify-center gap-4 ${index !== 0 ? 'pt-6 md:pt-0' : ''}`}
                >
                  <div className={`w-14 h-14 ${colors.bg} rounded-full flex items-center justify-center ring-4 ${colors.ring} shadow-lg`}>
                    <Icon size={24} className="text-white" />
                  </div>
                  <div>
                    <h3 className="text-2xl md:text-3xl font-bold text-gray-900">{stat.value}</h3>
                    <p className="text-sm text-gray-500">{stat.label}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
};

export default StatsSection;
