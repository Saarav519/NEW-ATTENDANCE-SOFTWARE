import React from 'react';
import { dashboardStats, employees, attendanceRecords, leaveRequests, overtimeRecords } from '../data/mockData';
import { useAuth } from '../context/AuthContext';
import {
  Users, UserCheck, UserX, CalendarOff, Clock, Wallet,
  TrendingUp, TrendingDown, ArrowRight, Calendar
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';

const StatCard = ({ title, value, icon: Icon, color, trend, trendValue }) => (
  <Card className="hover:shadow-lg transition-shadow cursor-pointer">
    <CardContent className="p-6">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-gray-500 mb-1">{title}</p>
          <p className="text-3xl font-bold text-gray-800">{value}</p>
          {trend && (
            <div className={`flex items-center gap-1 mt-2 text-xs ${trend === 'up' ? 'text-green-600' : 'text-red-500'}`}>
              {trend === 'up' ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
              <span>{trendValue}</span>
            </div>
          )}
        </div>
        <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${color}`}>
          <Icon size={24} className="text-white" />
        </div>
      </div>
    </CardContent>
  </Card>
);

const Dashboard = () => {
  const { user, isAdmin } = useAuth();
  const today = new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

  const stats = [
    { title: 'Total Employees', value: dashboardStats.totalEmployees, icon: Users, color: 'bg-blue-500' },
    { title: 'Present Today', value: dashboardStats.presentToday, icon: UserCheck, color: 'bg-green-500', trend: 'up', trendValue: '+2 from yesterday' },
    { title: 'On Leave', value: dashboardStats.onLeaveToday, icon: CalendarOff, color: 'bg-orange-500' },
    { title: 'Absent Today', value: dashboardStats.absentToday, icon: UserX, color: 'bg-red-500' },
  ];

  const pendingItems = [
    { title: 'Pending Leaves', value: dashboardStats.pendingLeaves, icon: CalendarOff, color: 'bg-yellow-100 text-yellow-700' },
    { title: 'Pending Overtime', value: dashboardStats.pendingOvertime, icon: Clock, color: 'bg-blue-100 text-blue-700' },
    { title: 'Pending Advances', value: `₹${dashboardStats.totalAdvancesPending.toLocaleString()}`, icon: Wallet, color: 'bg-purple-100 text-purple-700' },
  ];

  // Recent attendance for today
  const todayAttendance = employees.filter(e => e.status === 'active').map(emp => {
    const record = attendanceRecords.find(a => a.empId === emp.id && a.date === '2025-07-14');
    return {
      ...emp,
      attendance: record || { status: 'not-marked', punchIn: null, punchOut: null }
    };
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Welcome back, {user?.name?.split(' ')[0]}!</h1>
          <p className="text-gray-500">{today}</p>
        </div>
        {!isAdmin && (
          <button className="bg-[#1E2A5E] text-white px-6 py-3 rounded-xl font-semibold hover:bg-[#2D3A8C] transition-colors flex items-center gap-2">
            <Clock size={20} />
            Punch In
          </button>
        )}
      </div>

      {/* Stats Grid */}
      {isAdmin && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {stats.map((stat, idx) => (
            <StatCard key={idx} {...stat} />
          ))}
        </div>
      )}

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Today's Attendance */}
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-lg font-semibold">Today's Attendance</CardTitle>
            <button className="text-sm text-[#1E2A5E] hover:underline flex items-center gap-1">
              View All <ArrowRight size={14} />
            </button>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {todayAttendance.slice(0, 5).map((emp) => (
                <div key={emp.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white font-bold text-sm">
                      {emp.name.split(' ').map(n => n[0]).join('')}
                    </div>
                    <div>
                      <p className="font-medium text-gray-800">{emp.name}</p>
                      <p className="text-xs text-gray-500">{emp.designation}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className={`text-xs px-3 py-1 rounded-full font-medium ${
                      emp.attendance.status === 'present' ? 'bg-green-100 text-green-700' :
                      emp.attendance.status === 'leave' ? 'bg-yellow-100 text-yellow-700' :
                      emp.attendance.status === 'absent' ? 'bg-red-100 text-red-700' :
                      'bg-gray-100 text-gray-500'
                    }`}>
                      {emp.attendance.status === 'present' ? 'Present' :
                       emp.attendance.status === 'leave' ? 'On Leave' :
                       emp.attendance.status === 'absent' ? 'Absent' : 'Not Marked'}
                    </span>
                    {emp.attendance.punchIn && (
                      <p className="text-xs text-gray-500 mt-1">
                        {emp.attendance.punchIn} - {emp.attendance.punchOut || 'Working'}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Pending Approvals */}
        {isAdmin && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg font-semibold">Pending Approvals</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {pendingItems.map((item, idx) => (
                <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${item.color}`}>
                      <item.icon size={18} />
                    </div>
                    <span className="text-sm font-medium text-gray-700">{item.title}</span>
                  </div>
                  <span className="text-lg font-bold text-gray-800">{item.value}</span>
                </div>
              ))}
            </CardContent>
          </Card>
        )}
      </div>

      {/* Recent Activity */}
      {isAdmin && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent Leave Requests */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-lg font-semibold">Recent Leave Requests</CardTitle>
              <button className="text-sm text-[#1E2A5E] hover:underline flex items-center gap-1">
                View All <ArrowRight size={14} />
              </button>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {leaveRequests.slice(0, 3).map((leave) => (
                  <div key={leave.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                    <div>
                      <p className="font-medium text-gray-800">{leave.empName}</p>
                      <p className="text-xs text-gray-500">{leave.type} • {leave.days} day(s)</p>
                    </div>
                    <span className={`text-xs px-3 py-1 rounded-full font-medium ${
                      leave.status === 'approved' ? 'bg-green-100 text-green-700' :
                      leave.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                      'bg-red-100 text-red-700'
                    }`}>
                      {leave.status}
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Recent Overtime */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-lg font-semibold">Recent Overtime</CardTitle>
              <button className="text-sm text-[#1E2A5E] hover:underline flex items-center gap-1">
                View All <ArrowRight size={14} />
              </button>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {overtimeRecords.slice(0, 3).map((ot) => (
                  <div key={ot.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                    <div>
                      <p className="font-medium text-gray-800">{ot.empName}</p>
                      <p className="text-xs text-gray-500">{ot.hours} hrs • ₹{ot.amount}</p>
                    </div>
                    <span className={`text-xs px-3 py-1 rounded-full font-medium ${
                      ot.status === 'approved' ? 'bg-green-100 text-green-700' :
                      'bg-yellow-100 text-yellow-700'
                    }`}>
                      {ot.status}
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
