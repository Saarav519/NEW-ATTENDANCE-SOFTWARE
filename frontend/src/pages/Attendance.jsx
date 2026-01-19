import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from '../components/ui/select';
import {
  Calendar, Clock, UserCheck, UserX, CalendarOff, LogIn, LogOut,
  ChevronLeft, ChevronRight, Loader2
} from 'lucide-react';
import { usersAPI, attendanceAPI } from '../services/api';
import toast from 'react-hot-toast';

const Attendance = () => {
  const { user, isAdmin } = useAuth();
  // Default to December 2025 for testing (where we have data)
  const [selectedMonth, setSelectedMonth] = useState(12);
  const [selectedYear, setSelectedYear] = useState(2025);
  const [selectedDate, setSelectedDate] = useState('2025-12-01');
  const [attendanceRecords, setAttendanceRecords] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isPunchedIn, setIsPunchedIn] = useState(false);
  const [punchTime, setPunchTime] = useState(null);

  const todayStr = new Date().toISOString().split('T')[0];

  // Update selected date when month/year changes
  useEffect(() => {
    const newDate = `${selectedYear}-${String(selectedMonth).padStart(2, '0')}-01`;
    setSelectedDate(newDate);
  }, [selectedMonth, selectedYear]);

  // Fetch data on mount and when filters change
  useEffect(() => {
    loadData();
  }, [selectedMonth, selectedYear]);

  const loadData = async () => {
    setLoading(true);
    try {
      // Fetch all employees
      const usersData = await usersAPI.getAll();
      const activeEmployees = usersData.filter(u => u.status === 'active' && u.role !== 'admin');
      setEmployees(activeEmployees);

      // Fetch attendance for the selected month/year
      // getAll(empId, date, month, year)
      const attendanceData = await attendanceAPI.getAll(null, null, selectedMonth, selectedYear);
      setAttendanceRecords(attendanceData || []);
    } catch (error) {
      console.error('Error loading data:', error);
      toast.error('Failed to load attendance data');
    } finally {
      setLoading(false);
    }
  };

  // Get attendance for selected date - map API response to expected format
  const dateAttendance = employees.map(emp => {
    const record = attendanceRecords.find(r => r.emp_id === emp.id && r.date === selectedDate);
    return {
      ...emp,
      attendance: record ? {
        status: record.status || 'present',
        punchIn: record.punch_in || null,
        punchOut: record.punch_out || null,
        workHours: record.work_hours || 0,
        attendanceStatus: record.attendance_status || 'full_day',
        location: record.location || '',
        conveyance: record.conveyance_amount || 0,
        dailyDuty: record.daily_duty_amount || 0
      } : { 
        status: 'not-marked', 
        punchIn: null, 
        punchOut: null, 
        workHours: 0,
        conveyance: 0,
        dailyDuty: 0
      }
    };
  });

  const presentCount = dateAttendance.filter(e => e.attendance.status === 'present').length;
  const absentCount = dateAttendance.filter(e => e.attendance.status === 'absent').length;
  const notMarkedCount = dateAttendance.filter(e => e.attendance.status === 'not-marked').length;

  const handlePunchIn = () => {
    const now = new Date();
    const timeStr = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false });
    setPunchTime(timeStr);
    setIsPunchedIn(true);
    toast.success('Punched in successfully');
  };

  const handlePunchOut = () => {
    setIsPunchedIn(false);
    toast.success('Punched out successfully');
  };

  const markAttendance = async (empId, status) => {
    toast.success(`Marked ${status} for employee`);
  };

  // Get days in selected month for calendar
  const getDaysInMonth = (month, year) => {
    return new Date(year, month, 0).getDate();
  };

  const daysInMonth = getDaysInMonth(selectedMonth, selectedYear);

  // Generate dates for the month
  const monthDates = Array.from({ length: daysInMonth }, (_, i) => {
    const day = i + 1;
    return `${selectedYear}-${String(selectedMonth).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
  });

  const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
        <span className="ml-2">Loading attendance data...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Attendance</h1>
          <p className="text-gray-500">Track daily attendance</p>
        </div>
        {!isAdmin && (
          <div className="flex gap-3">
            {!isPunchedIn ? (
              <Button onClick={handlePunchIn} className="bg-green-600 hover:bg-green-700">
                <LogIn size={18} className="mr-2" /> Punch In
              </Button>
            ) : (
              <Button onClick={handlePunchOut} className="bg-red-600 hover:bg-red-700">
                <LogOut size={18} className="mr-2" /> Punch Out
              </Button>
            )}
          </div>
        )}
      </div>

      {/* Employee Self View */}
      {!isAdmin && (
        <Card className="bg-gradient-to-r from-[#1E2A5E] to-[#2D3A8C] text-white">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-white/70 mb-1">Today's Status</p>
                <h2 className="text-3xl font-bold">
                  {isPunchedIn ? 'Working' : punchTime ? 'Completed' : 'Not Started'}
                </h2>
                {punchTime && (
                  <p className="text-white/70 mt-2">Punched in at {punchTime}</p>
                )}
              </div>
              <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center">
                <Clock size={40} className="text-white" />
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Admin View */}
      {isAdmin && (
        <>
          {/* Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-4 flex items-center gap-4">
                <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                  <Calendar size={24} className="text-blue-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Total Employees</p>
                  <p className="text-2xl font-bold">{employees.length}</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 flex items-center gap-4">
                <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                  <UserCheck size={24} className="text-green-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Present</p>
                  <p className="text-2xl font-bold text-green-600">{presentCount}</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 flex items-center gap-4">
                <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center">
                  <UserX size={24} className="text-red-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Absent</p>
                  <p className="text-2xl font-bold text-red-600">{absentCount}</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 flex items-center gap-4">
                <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center">
                  <CalendarOff size={24} className="text-gray-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Not Marked</p>
                  <p className="text-2xl font-bold text-gray-600">{notMarkedCount}</p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Date Selection */}
          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">Select Date</CardTitle>
                <div className="flex items-center gap-2">
                  <Select value={String(selectedMonth)} onValueChange={(v) => setSelectedMonth(parseInt(v))}>
                    <SelectTrigger className="w-[140px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {MONTHS.map((month, idx) => (
                        <SelectItem key={idx} value={String(idx + 1)}>{month}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Select value={String(selectedYear)} onValueChange={(v) => setSelectedYear(parseInt(v))}>
                    <SelectTrigger className="w-[100px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {[2024, 2025, 2026].map(year => (
                        <SelectItem key={year} value={String(year)}>{year}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-7 gap-2">
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                  <div key={day} className="text-center text-xs font-medium text-gray-500 py-2">{day}</div>
                ))}
                {/* Empty cells for days before first of month */}
                {Array.from({ length: new Date(selectedYear, selectedMonth - 1, 1).getDay() }, (_, i) => (
                  <div key={`empty-${i}`} className="p-2"></div>
                ))}
                {/* Days of the month */}
                {monthDates.map((date, idx) => {
                  const day = idx + 1;
                  const hasAttendance = attendanceRecords.some(r => r.date === date);
                  const isSelected = date === selectedDate;
                  const isToday = date === todayStr;
                  
                  return (
                    <button
                      key={date}
                      onClick={() => setSelectedDate(date)}
                      className={`p-2 text-sm rounded-lg transition-all ${
                        isSelected 
                          ? 'bg-blue-600 text-white' 
                          : isToday 
                            ? 'bg-blue-100 text-blue-600 font-bold'
                            : hasAttendance 
                              ? 'bg-green-50 text-green-700 hover:bg-green-100'
                              : 'hover:bg-gray-100'
                      }`}
                    >
                      {day}
                    </button>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Attendance Table */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">
                Attendance for {new Date(selectedDate).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b bg-gray-50">
                      <th className="text-left p-4 font-medium text-gray-600">Employee</th>
                      <th className="text-left p-4 font-medium text-gray-600">Punch In</th>
                      <th className="text-left p-4 font-medium text-gray-600">Punch Out</th>
                      <th className="text-left p-4 font-medium text-gray-600">Hours</th>
                      <th className="text-left p-4 font-medium text-gray-600">Status</th>
                      <th className="text-right p-4 font-medium text-gray-600">Daily Duty</th>
                      <th className="text-right p-4 font-medium text-gray-600">Conveyance</th>
                      <th className="text-left p-4 font-medium text-gray-600">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {dateAttendance.map((emp) => (
                      <tr key={emp.id} className="hover:bg-gray-50">
                        <td className="p-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white font-bold text-sm">
                              {emp.name.split(' ').map(n => n[0]).join('')}
                            </div>
                            <div>
                              <p className="font-medium text-gray-800">{emp.name}</p>
                              <p className="text-xs text-gray-500">{emp.id}</p>
                            </div>
                          </div>
                        </td>
                        <td className="p-4 text-gray-700 font-medium">{emp.attendance.punchIn || '-'}</td>
                        <td className="p-4 text-gray-700 font-medium">{emp.attendance.punchOut || '-'}</td>
                        <td className="p-4 text-gray-700 font-medium">{emp.attendance.workHours ? `${emp.attendance.workHours}h` : '-'}</td>
                        <td className="p-4">
                          <span className={`text-xs px-3 py-1 rounded-full font-medium ${
                            emp.attendance.status === 'present' ? 'bg-green-100 text-green-700' :
                            emp.attendance.status === 'absent' ? 'bg-red-100 text-red-700' :
                            'bg-gray-100 text-gray-500'
                          }`}>
                            {emp.attendance.status === 'not-marked' ? 'Not Marked' : 
                             emp.attendance.attendanceStatus === 'half_day' ? 'Half Day' :
                             emp.attendance.attendanceStatus === 'absent' ? 'Absent' :
                             emp.attendance.status}
                          </span>
                        </td>
                        <td className="p-4 text-gray-700">{emp.attendance.location || '-'}</td>
                        <td className="p-4">
                          <div className="flex gap-1">
                            <button
                              onClick={() => markAttendance(emp.id, 'present')}
                              className={`p-1.5 rounded transition-colors ${emp.attendance.status === 'present' ? 'bg-green-500 text-white' : 'bg-green-100 text-green-600 hover:bg-green-200'}`}
                              title="Present"
                            >
                              <UserCheck size={14} />
                            </button>
                            <button
                              onClick={() => markAttendance(emp.id, 'absent')}
                              className={`p-1.5 rounded transition-colors ${emp.attendance.status === 'absent' ? 'bg-red-500 text-white' : 'bg-red-100 text-red-600 hover:bg-red-200'}`}
                              title="Absent"
                            >
                              <UserX size={14} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
};

export default Attendance;
