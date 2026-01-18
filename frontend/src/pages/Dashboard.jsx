import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { attendanceRecords, leaveRequests, overtimeRecords, holidays, users, employees } from '../data/mockData';
import { Card, CardContent } from '../components/ui/card';
import { Button } from '../components/ui/button';
import {
  Clock, Calendar, CalendarOff, Gift, LogIn, LogOut,
  CheckCircle, XCircle, TrendingUp, Users, UserCheck, UserX,
  ArrowRight, ChevronRight, Receipt
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

// Employee Dashboard - Mobile First
const EmployeeDashboard = ({ user }) => {
  const [isPunchedIn, setIsPunchedIn] = useState(false);
  const [punchInTime, setPunchInTime] = useState(null);
  const [currentTime, setCurrentTime] = useState(new Date());
  const navigate = useNavigate();

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const handlePunch = () => {
    if (!isPunchedIn) {
      setPunchInTime(new Date());
      setIsPunchedIn(true);
    } else {
      setIsPunchedIn(false);
    }
  };

  const upcomingHolidays = holidays
    .filter(h => new Date(h.date) >= new Date())
    .sort((a, b) => new Date(a.date) - new Date(b.date))
    .slice(0, 3);

  const myLeaves = leaveRequests.filter(l => l.empId === user.id);
  const pendingLeaves = myLeaves.filter(l => l.status === 'pending').length;

  return (
    <div className="space-y-4">
      {/* Greeting */}
      <div>
        <h1 className="text-xl lg:text-2xl font-bold text-gray-800">
          Hello, {user.name.split(' ')[0]}! 👋
        </h1>
        <p className="text-sm text-gray-500">
          {currentTime.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
        </p>
      </div>

      {/* Punch Card - Main Focus */}
      <Card className="bg-gradient-to-br from-[#1E2A5E] to-[#2D3A8C] text-white overflow-hidden">
        <CardContent className="p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-white/70 text-sm">Current Time</p>
              <p className="text-3xl font-bold">
                {currentTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
              </p>
            </div>
            <div className={`w-16 h-16 rounded-full flex items-center justify-center ${isPunchedIn ? 'bg-green-500' : 'bg-white/20'}`}>
              <Clock size={32} className={isPunchedIn ? 'text-white' : 'text-white/70'} />
            </div>
          </div>

          {isPunchedIn && punchInTime && (
            <div className="mb-4 p-3 bg-white/10 rounded-xl">
              <p className="text-white/70 text-xs">Punched in at</p>
              <p className="font-semibold">
                {punchInTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
              </p>
            </div>
          )}

          <Button
            onClick={handlePunch}
            className={`w-full h-14 text-lg font-bold rounded-xl transition-all ${
              isPunchedIn
                ? 'bg-red-500 hover:bg-red-600'
                : 'bg-green-500 hover:bg-green-600'
            }`}
          >
            {isPunchedIn ? (
              <><LogOut size={24} className="mr-2" /> Punch Out</>
            ) : (
              <><LogIn size={24} className="mr-2" /> Punch In</>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Quick Stats */}
      <div className="grid grid-cols-3 gap-3">
        <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => navigate('/my-attendance')}>
          <CardContent className="p-3 text-center">
            <div className="w-10 h-10 mx-auto mb-2 bg-blue-100 rounded-xl flex items-center justify-center">
              <Calendar size={20} className="text-blue-600" />
            </div>
            <p className="text-lg font-bold text-gray-800">22</p>
            <p className="text-[10px] text-gray-500">Present Days</p>
          </CardContent>
        </Card>
        <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => navigate('/leaves')}>
          <CardContent className="p-3 text-center">
            <div className="w-10 h-10 mx-auto mb-2 bg-orange-100 rounded-xl flex items-center justify-center">
              <CalendarOff size={20} className="text-orange-600" />
            </div>
            <p className="text-lg font-bold text-gray-800">{pendingLeaves}</p>
            <p className="text-[10px] text-gray-500">Pending Leaves</p>
          </CardContent>
        </Card>
        <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => navigate('/overtime')}>
          <CardContent className="p-3 text-center">
            <div className="w-10 h-10 mx-auto mb-2 bg-purple-100 rounded-xl flex items-center justify-center">
              <Clock size={20} className="text-purple-600" />
            </div>
            <p className="text-lg font-bold text-gray-800">8</p>
            <p className="text-[10px] text-gray-500">OT Hours</p>
          </CardContent>
        </Card>
      </div>

      {/* Upcoming Holidays */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-gray-800">Upcoming Holidays</h3>
            <button onClick={() => navigate('/holidays')} className="text-xs text-[#1E2A5E] flex items-center">
              View All <ChevronRight size={14} />
            </button>
          </div>
          <div className="space-y-2">
            {upcomingHolidays.map((holiday) => (
              <div key={holiday.id} className="flex items-center gap-3 p-2 bg-gray-50 rounded-lg">
                <div className="w-10 h-10 bg-white rounded-lg flex flex-col items-center justify-center shadow-sm">
                  <span className="text-[10px] text-gray-500">{new Date(holiday.date).toLocaleString('default', { month: 'short' })}</span>
                  <span className="text-sm font-bold text-gray-800">{new Date(holiday.date).getDate()}</span>
                </div>
                <div className="flex-1">
                  <p className="font-medium text-sm text-gray-800">{holiday.name}</p>
                  <p className="text-[10px] text-gray-500">{holiday.type}</p>
                </div>
                <Gift size={16} className="text-purple-500" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

// Team Lead Dashboard - Mobile First with Team Overview
const TeamLeadDashboard = ({ user }) => {
  const [isPunchedIn, setIsPunchedIn] = useState(false);
  const [punchInTime, setPunchInTime] = useState(null);
  const [currentTime, setCurrentTime] = useState(new Date());
  const navigate = useNavigate();

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const handlePunch = () => {
    if (!isPunchedIn) {
      setPunchInTime(new Date());
      setIsPunchedIn(true);
    } else {
      setIsPunchedIn(false);
    }
  };

  // Get team members
  const teamMembers = users.filter(u => user.teamMembers?.includes(u.id));
  const pendingLeaves = leaveRequests.filter(l => 
    teamMembers.some(m => m.id === l.empId) && l.status === 'pending'
  ).length;
  const pendingOT = overtimeRecords.filter(o => 
    teamMembers.some(m => m.id === o.empId) && o.status === 'pending'
  ).length;

  return (
    <div className="space-y-4">
      {/* Greeting */}
      <div>
        <h1 className="text-xl lg:text-2xl font-bold text-gray-800">
          Hello, {user.name.split(' ')[0]}! 👋
        </h1>
        <p className="text-sm text-gray-500">Team Lead - {user.department}</p>
      </div>

      {/* Punch Card */}
      <Card className="bg-gradient-to-br from-[#1E2A5E] to-[#2D3A8C] text-white">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-white/70 text-sm">
                {currentTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
              </p>
              <p className="text-lg font-bold">
                {isPunchedIn ? 'Working' : 'Not Started'}
              </p>
              {isPunchedIn && punchInTime && (
                <p className="text-white/70 text-xs">Since {punchInTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}</p>
              )}
            </div>
            <Button
              onClick={handlePunch}
              size="sm"
              className={`${isPunchedIn ? 'bg-red-500 hover:bg-red-600' : 'bg-green-500 hover:bg-green-600'}`}
            >
              {isPunchedIn ? <><LogOut size={16} className="mr-1" /> Out</> : <><LogIn size={16} className="mr-1" /> In</>}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Team Overview */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-gray-800">My Team</h3>
            <button onClick={() => navigate('/team')} className="text-xs text-[#1E2A5E] flex items-center">
              View All <ChevronRight size={14} />
            </button>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div className="text-center p-3 bg-blue-50 rounded-xl">
              <Users size={20} className="mx-auto text-blue-600 mb-1" />
              <p className="text-lg font-bold text-gray-800">{teamMembers.length}</p>
              <p className="text-[10px] text-gray-500">Members</p>
            </div>
            <div className="text-center p-3 bg-green-50 rounded-xl">
              <UserCheck size={20} className="mx-auto text-green-600 mb-1" />
              <p className="text-lg font-bold text-gray-800">{teamMembers.length - 1}</p>
              <p className="text-[10px] text-gray-500">Present</p>
            </div>
            <div className="text-center p-3 bg-orange-50 rounded-xl">
              <UserX size={20} className="mx-auto text-orange-600 mb-1" />
              <p className="text-lg font-bold text-gray-800">1</p>
              <p className="text-[10px] text-gray-500">Absent</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Pending Approvals */}
      <Card>
        <CardContent className="p-4">
          <h3 className="font-semibold text-gray-800 mb-3">Pending Approvals</h3>
          <div className="space-y-2">
            <div 
              onClick={() => navigate('/leaves')}
              className="flex items-center justify-between p-3 bg-yellow-50 rounded-xl cursor-pointer hover:bg-yellow-100 transition-colors"
            >
              <div className="flex items-center gap-3">
                <CalendarOff size={20} className="text-yellow-600" />
                <span className="font-medium">Leave Requests</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="bg-yellow-500 text-white text-xs px-2 py-0.5 rounded-full font-bold">{pendingLeaves}</span>
                <ChevronRight size={16} className="text-gray-400" />
              </div>
            </div>
            <div 
              onClick={() => navigate('/bills')}
              className="flex items-center justify-between p-3 bg-blue-50 rounded-xl cursor-pointer hover:bg-blue-100 transition-colors"
            >
              <div className="flex items-center gap-3">
                <Receipt size={20} className="text-blue-600" />
                <span className="font-medium">Bill Submissions</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="bg-blue-500 text-white text-xs px-2 py-0.5 rounded-full font-bold">{pendingOT}</span>
                <ChevronRight size={16} className="text-gray-400" />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Team Members Quick View */}
      <Card>
        <CardContent className="p-4">
          <h3 className="font-semibold text-gray-800 mb-3">Team Status Today</h3>
          <div className="space-y-2">
            {teamMembers.map((member) => (
              <div key={member.id} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white font-bold text-xs">
                    {member.name.split(' ').map(n => n[0]).join('')}
                  </div>
                  <div>
                    <p className="font-medium text-sm">{member.name}</p>
                    <p className="text-[10px] text-gray-500">{member.designation}</p>
                  </div>
                </div>
                <span className="text-xs px-2 py-1 rounded-full bg-green-100 text-green-700 font-medium">
                  Present
                </span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

// Admin Dashboard - Desktop Focused
const AdminDashboard = ({ user }) => {
  const navigate = useNavigate();
  const activeEmployees = users.filter(u => u.role !== 'admin' && u.status === 'active');
  const presentToday = 5;
  const onLeave = 1;
  const pendingLeaves = leaveRequests.filter(l => l.status === 'pending').length;
  const pendingOT = overtimeRecords.filter(o => o.status === 'pending').length;

  const today = new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Welcome back, {user.name.split(' ')[0]}!</h1>
          <p className="text-gray-500">{today}</p>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => navigate('/employees')}>
          <CardContent className="p-4 lg:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Total Staff</p>
                <p className="text-2xl lg:text-3xl font-bold text-gray-800">{activeEmployees.length}</p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                <Users size={24} className="text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => navigate('/attendance')}>
          <CardContent className="p-4 lg:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Present Today</p>
                <p className="text-2xl lg:text-3xl font-bold text-green-600">{presentToday}</p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                <UserCheck size={24} className="text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => navigate('/leaves')}>
          <CardContent className="p-4 lg:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">On Leave</p>
                <p className="text-2xl lg:text-3xl font-bold text-orange-600">{onLeave}</p>
              </div>
              <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center">
                <CalendarOff size={24} className="text-orange-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => navigate('/attendance')}>
          <CardContent className="p-4 lg:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Absent</p>
                <p className="text-2xl lg:text-3xl font-bold text-red-600">1</p>
              </div>
              <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center">
                <UserX size={24} className="text-red-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Today's Attendance */}
        <Card className="lg:col-span-2">
          <CardContent className="p-4 lg:p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Today's Attendance</h3>
              <button onClick={() => navigate('/attendance')} className="text-sm text-[#1E2A5E] flex items-center">
                View All <ArrowRight size={14} className="ml-1" />
              </button>
            </div>
            <div className="space-y-3">
              {activeEmployees.slice(0, 5).map((emp) => (
                <div key={emp.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
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
                    <span className="text-xs px-3 py-1 rounded-full bg-green-100 text-green-700 font-medium">
                      Present
                    </span>
                    <p className="text-xs text-gray-500 mt-1">09:00 - Working</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Pending Approvals */}
        <Card>
          <CardContent className="p-4 lg:p-6">
            <h3 className="text-lg font-semibold mb-4">Pending Approvals</h3>
            <div className="space-y-3">
              <div 
                onClick={() => navigate('/leaves')}
                className="flex items-center justify-between p-4 bg-yellow-50 rounded-xl cursor-pointer hover:bg-yellow-100 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-yellow-100 rounded-xl flex items-center justify-center">
                    <CalendarOff size={20} className="text-yellow-600" />
                  </div>
                  <span className="font-medium">Leave Requests</span>
                </div>
                <span className="bg-yellow-500 text-white text-sm px-3 py-1 rounded-full font-bold">{pendingLeaves}</span>
              </div>
              <div 
                onClick={() => navigate('/bills')}
                className="flex items-center justify-between p-4 bg-blue-50 rounded-xl cursor-pointer hover:bg-blue-100 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
                    <Receipt size={20} className="text-blue-600" />
                  </div>
                  <span className="font-medium">Bill Submissions</span>
                </div>
                <span className="bg-blue-500 text-white text-sm px-3 py-1 rounded-full font-bold">{pendingBills}</span>
              </div>
              <div 
                onClick={() => navigate('/advances')}
                className="flex items-center justify-between p-4 bg-purple-50 rounded-xl cursor-pointer hover:bg-purple-100 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center">
                    <TrendingUp size={20} className="text-purple-600" />
                  </div>
                  <span className="font-medium">Advances</span>
                </div>
                <span className="bg-purple-500 text-white text-sm px-3 py-1 rounded-full font-bold">1</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

// Main Dashboard Component
const Dashboard = () => {
  const { user, role } = useAuth();

  if (role === 'admin') {
    return <AdminDashboard user={user} />;
  } else if (role === 'teamlead') {
    return <TeamLeadDashboard user={user} />;
  } else {
    return <EmployeeDashboard user={user} />;
  }
};

export default Dashboard;
