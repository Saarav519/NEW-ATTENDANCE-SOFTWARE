import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { attendanceAPI } from '../services/api';
import { Card, CardContent } from '../components/ui/card';
import { Calendar, Clock, MapPin, IndianRupee, ChevronLeft, ChevronRight } from 'lucide-react';

const MyAttendance = () => {
  const { user } = useAuth();
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [monthlyAttendance, setMonthlyAttendance] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAttendanceData();
  }, [user?.id, currentMonth]);

  const loadAttendanceData = async () => {
    if (!user?.id) return;
    
    setLoading(true);
    try {
      const month = currentMonth.getMonth() + 1;
      const year = currentMonth.getFullYear();

      // Get monthly attendance
      const monthlyData = await attendanceAPI.getMonthly(user.id, month, year);
      setMonthlyAttendance(monthlyData);
    } catch (error) {
      console.error('Error loading attendance:', error);
    } finally {
      setLoading(false);
    }
  };

  // Calendar helpers
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

  const getAttendanceStatus = (day) => {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    const date = new Date(year, month, day);
    
    if (date > new Date()) return null; // Future date
    if (date.getDay() === 0) return 'holiday'; // Sunday
    
    const record = monthlyAttendance.find(a => a.date === dateStr);
    if (record) {
      // Handle both status and attendance_status fields
      const status = record.attendance_status || record.status;
      // Normalize status names
      if (status === 'full_day' || status === 'present') return 'present';
      if (status === 'half_day') return 'half_day';
      if (status === 'leave') return 'leave';
      if (status === 'absent') return 'absent';
      return status;
    }
    return null; // No record for this day
  };

  const prevMonth = () => setCurrentMonth(new Date(year, month - 1, 1));
  const nextMonth = () => setCurrentMonth(new Date(year, month + 1, 1));
  const monthName = currentMonth.toLocaleString('default', { month: 'long', year: 'numeric' });

  // Calculate stats
  const presentDays = monthlyAttendance.filter(a => a.status === 'present').length;
  const absentDays = monthlyAttendance.filter(a => a.status === 'absent').length;
  const leaveDays = monthlyAttendance.filter(a => a.status === 'leave').length;
  const totalWorkHours = monthlyAttendance.reduce((sum, a) => sum + (a.work_hours || 0), 0);
  const totalConveyance = monthlyAttendance.reduce((sum, a) => sum + (a.conveyance_amount || 0), 0);

  return (
    <div className="space-y-4">
      {/* Header */}
      <div>
        <h1 className="text-xl lg:text-2xl font-bold text-gray-800">My Attendance</h1>
        <p className="text-sm text-gray-500">View your attendance calendar</p>
      </div>

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
            <p className="text-lg font-bold text-blue-600">{Math.round(totalWorkHours)}h</p>
            <p className="text-[10px] text-gray-500">Hours</p>
          </CardContent>
        </Card>
      </div>

      {/* Conveyance Total */}
      {totalConveyance > 0 && (
        <Card className="bg-green-50">
          <CardContent className="p-3 flex items-center justify-between">
            <span className="text-green-700 font-medium">Monthly Conveyance</span>
            <span className="text-green-700 font-bold">₹{totalConveyance.toLocaleString()}</span>
          </CardContent>
        </Card>
      )}

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
            {monthlyAttendance.slice(0, 5).map((entry, i) => (
              <div key={i} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                <div>
                  <p className="font-medium text-sm text-gray-800">
                    {new Date(entry.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                  </p>
                  <div className="flex items-center gap-3 text-xs text-gray-500">
                    <span>{entry.punch_in || '-'} - {entry.punch_out || '-'}</span>
                    {entry.location && (
                      <span className="flex items-center gap-1">
                        <MapPin size={10} /> {entry.location}
                      </span>
                    )}
                  </div>
                </div>
                <div className="text-right">
                  <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                    entry.status === 'present' ? 'bg-green-100 text-green-700' :
                    entry.status === 'leave' ? 'bg-orange-100 text-orange-700' :
                    'bg-red-100 text-red-700'
                  }`}>
                    {entry.status}
                  </span>
                  {entry.conveyance_amount > 0 && (
                    <p className="text-xs text-green-600 mt-1">₹{entry.conveyance_amount}</p>
                  )}
                </div>
              </div>
            ))}
            {monthlyAttendance.length === 0 && !loading && (
              <p className="text-center text-gray-500 py-4">No attendance records for this month</p>
            )}
            {loading && (
              <p className="text-center text-gray-500 py-4">Loading...</p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default MyAttendance;
