import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { attendanceRecords } from '../data/mockData';
import { Card, CardContent } from '../components/ui/card';
import { Button } from '../components/ui/button';
import {
  Calendar, Clock, LogIn, LogOut, CheckCircle, XCircle,
  ChevronLeft, ChevronRight
} from 'lucide-react';

const MyAttendance = () => {
  const { user } = useAuth();
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [isPunchedIn, setIsPunchedIn] = useState(false);
  const [punchInTime, setPunchInTime] = useState(null);
  const [currentTime, setCurrentTime] = useState(new Date());

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

  // Get days in current month
  const getDaysInMonth = (date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDay = firstDay.getDay();
    
    return { daysInMonth, startingDay, year, month };
  };

  const { daysInMonth, startingDay, year, month } = getDaysInMonth(currentMonth);

  // Mock attendance data for display
  const getAttendanceStatus = (day) => {
    const date = new Date(year, month, day);
    if (date > new Date()) return null; // Future date
    if (date.getDay() === 0) return 'holiday'; // Sunday
    
    const randomStatus = Math.random();
    if (randomStatus > 0.9) return 'absent';
    if (randomStatus > 0.85) return 'leave';
    return 'present';
  };

  const prevMonth = () => {
    setCurrentMonth(new Date(year, month - 1, 1));
  };

  const nextMonth = () => {
    setCurrentMonth(new Date(year, month + 1, 1));
  };

  const monthName = currentMonth.toLocaleString('default', { month: 'long', year: 'numeric' });

  // Calculate stats
  const presentDays = 18;
  const absentDays = 2;
  const leaveDays = 1;
  const totalWorkHours = 162;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div>
        <h1 className="text-xl lg:text-2xl font-bold text-gray-800">My Attendance</h1>
        <p className="text-sm text-gray-500">Track your daily attendance</p>
      </div>

      {/* Punch Card - Mobile Focus */}
      <Card className="bg-gradient-to-br from-[#1E2A5E] to-[#2D3A8C] text-white">
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-white/70 text-sm">
                {currentTime.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
              </p>
              <p className="text-3xl font-bold">
                {currentTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
              </p>
            </div>
            <div className={`w-14 h-14 rounded-full flex items-center justify-center ${isPunchedIn ? 'bg-green-500' : 'bg-white/20'}`}>
              <Clock size={28} />
            </div>
          </div>

          {isPunchedIn && punchInTime && (
            <div className="mb-3 p-3 bg-white/10 rounded-xl flex items-center justify-between">
              <div>
                <p className="text-white/70 text-xs">Punched In</p>
                <p className="font-semibold">{punchInTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}</p>
              </div>
              <div className="text-right">
                <p className="text-white/70 text-xs">Working</p>
                <p className="font-semibold">{Math.floor((currentTime - punchInTime) / 1000 / 60 / 60)}h {Math.floor(((currentTime - punchInTime) / 1000 / 60) % 60)}m</p>
              </div>
            </div>
          )}

          <Button
            onClick={handlePunch}
            className={`w-full h-12 text-base font-bold rounded-xl ${
              isPunchedIn ? 'bg-red-500 hover:bg-red-600' : 'bg-green-500 hover:bg-green-600'
            }`}
          >
            {isPunchedIn ? (
              <><LogOut size={20} className="mr-2" /> Punch Out</>
            ) : (
              <><LogIn size={20} className="mr-2" /> Punch In</>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Monthly Stats */}
      <div className="grid grid-cols-4 gap-2">
        <Card>
          <CardContent className="p-3 text-center">
            <p className="text-lg font-bold text-green-600">{presentDays}</p>
            <p className="text-[10px] text-gray-500">Present</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 text-center">
            <p className="text-lg font-bold text-red-500">{absentDays}</p>
            <p className="text-[10px] text-gray-500">Absent</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 text-center">
            <p className="text-lg font-bold text-orange-500">{leaveDays}</p>
            <p className="text-[10px] text-gray-500">Leave</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 text-center">
            <p className="text-lg font-bold text-blue-600">{totalWorkHours}h</p>
            <p className="text-[10px] text-gray-500">Hours</p>
          </CardContent>
        </Card>
      </div>

      {/* Calendar */}
      <Card>
        <CardContent className="p-4">
          {/* Month Navigation */}
          <div className="flex items-center justify-between mb-4">
            <button onClick={prevMonth} className="p-2 hover:bg-gray-100 rounded-lg">
              <ChevronLeft size={20} />
            </button>
            <h3 className="font-semibold text-gray-800">{monthName}</h3>
            <button onClick={nextMonth} className="p-2 hover:bg-gray-100 rounded-lg">
              <ChevronRight size={20} />
            </button>
          </div>

          {/* Day Headers */}
          <div className="grid grid-cols-7 gap-1 mb-2">
            {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, i) => (
              <div key={i} className="text-center text-xs font-medium text-gray-500 py-1">
                {day}
              </div>
            ))}
          </div>

          {/* Calendar Grid */}
          <div className="grid grid-cols-7 gap-1">
            {/* Empty cells for days before month starts */}
            {Array.from({ length: startingDay }).map((_, i) => (
              <div key={`empty-${i}`} className="aspect-square"></div>
            ))}
            
            {/* Days of the month */}
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const day = i + 1;
              const status = getAttendanceStatus(day);
              const isToday = day === new Date().getDate() && month === new Date().getMonth() && year === new Date().getFullYear();
              
              return (
                <div
                  key={day}
                  className={`aspect-square flex items-center justify-center rounded-lg text-sm font-medium transition-colors ${
                    isToday ? 'ring-2 ring-[#1E2A5E]' : ''
                  } ${
                    status === 'present' ? 'bg-green-100 text-green-700' :
                    status === 'absent' ? 'bg-red-100 text-red-700' :
                    status === 'leave' ? 'bg-orange-100 text-orange-700' :
                    status === 'holiday' ? 'bg-gray-100 text-gray-400' :
                    'text-gray-400'
                  }`}
                >
                  {day}
                </div>
              );
            })}
          </div>

          {/* Legend */}
          <div className="flex items-center justify-center gap-4 mt-4 pt-4 border-t">
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 bg-green-100 rounded"></div>
              <span className="text-xs text-gray-600">Present</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 bg-red-100 rounded"></div>
              <span className="text-xs text-gray-600">Absent</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 bg-orange-100 rounded"></div>
              <span className="text-xs text-gray-600">Leave</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Recent Activity */}
      <Card>
        <CardContent className="p-4">
          <h3 className="font-semibold text-gray-800 mb-3">Recent Activity</h3>
          <div className="space-y-2">
            {[
              { date: 'Today', in: '09:05 AM', out: '-', status: 'Working', hours: '4h 30m' },
              { date: 'Yesterday', in: '09:00 AM', out: '06:30 PM', status: 'Present', hours: '9h 30m' },
              { date: '2 days ago', in: '09:15 AM', out: '06:00 PM', status: 'Present', hours: '8h 45m' },
            ].map((entry, i) => (
              <div key={i} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                <div>
                  <p className="font-medium text-sm text-gray-800">{entry.date}</p>
                  <p className="text-xs text-gray-500">{entry.in} - {entry.out}</p>
                </div>
                <div className="text-right">
                  <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                    entry.status === 'Working' ? 'bg-blue-100 text-blue-700' :
                    entry.status === 'Present' ? 'bg-green-100 text-green-700' :
                    'bg-red-100 text-red-700'
                  }`}>
                    {entry.status}
                  </span>
                  <p className="text-xs text-gray-500 mt-1">{entry.hours}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default MyAttendance;
