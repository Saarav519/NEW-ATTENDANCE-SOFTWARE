import React, { useState } from 'react';
import { employees, attendanceRecords } from '../data/mockData';
import { useAuth } from '../context/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from '../components/ui/select';
import {
  Calendar, Clock, UserCheck, UserX, CalendarOff, LogIn, LogOut,
  ChevronLeft, ChevronRight
} from 'lucide-react';

const Attendance = () => {
  const { user, isAdmin } = useAuth();
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [records, setRecords] = useState(attendanceRecords);
  const [isPunchedIn, setIsPunchedIn] = useState(false);
  const [punchTime, setPunchTime] = useState(null);

  const todayStr = new Date().toISOString().split('T')[0];

  // Get attendance for selected date
  const dateAttendance = employees.filter(e => e.status === 'active').map(emp => {
    const record = records.find(r => r.empId === emp.id && r.date === selectedDate);
    return {
      ...emp,
      attendance: record || { status: 'not-marked', punchIn: null, punchOut: null, workHours: 0 }
    };
  });

  const presentCount = dateAttendance.filter(e => e.attendance.status === 'present').length;
  const absentCount = dateAttendance.filter(e => e.attendance.status === 'absent').length;
  const leaveCount = dateAttendance.filter(e => e.attendance.status === 'leave').length;

  const handlePunchIn = () => {
    const now = new Date();
    const timeStr = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false });
    setPunchTime(timeStr);
    setIsPunchedIn(true);
    
    // Add attendance record
    const newRecord = {
      id: `ATT${Date.now()}`,
      empId: user.id,
      date: todayStr,
      punchIn: timeStr,
      punchOut: null,
      status: 'present',
      workHours: 0
    };
    setRecords([...records, newRecord]);
  };

  const handlePunchOut = () => {
    const now = new Date();
    const timeStr = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false });
    setIsPunchedIn(false);
    
    // Update attendance record
    setRecords(records.map(r => {
      if (r.empId === user.id && r.date === todayStr) {
        const punchInTime = new Date(`2025-01-01 ${r.punchIn}`);
        const punchOutTime = new Date(`2025-01-01 ${timeStr}`);
        const hours = (punchOutTime - punchInTime) / (1000 * 60 * 60);
        return { ...r, punchOut: timeStr, workHours: hours.toFixed(2) };
      }
      return r;
    }));
  };

  const markAttendance = (empId, status) => {
    const existingRecord = records.find(r => r.empId === empId && r.date === selectedDate);
    if (existingRecord) {
      setRecords(records.map(r =>
        r.empId === empId && r.date === selectedDate
          ? { ...r, status }
          : r
      ));
    } else {
      setRecords([...records, {
        id: `ATT${Date.now()}`,
        empId,
        date: selectedDate,
        punchIn: status === 'present' ? '09:00' : null,
        punchOut: status === 'present' ? '18:00' : null,
        status,
        workHours: status === 'present' ? 9 : 0
      }]);
    }
  };

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
                  <p className="text-2xl font-bold text-gray-800">{employees.filter(e => e.status === 'active').length}</p>
                  <p className="text-sm text-gray-500">Total</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 flex items-center gap-4">
                <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                  <UserCheck size={24} className="text-green-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-800">{presentCount}</p>
                  <p className="text-sm text-gray-500">Present</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 flex items-center gap-4">
                <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center">
                  <UserX size={24} className="text-red-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-800">{absentCount}</p>
                  <p className="text-sm text-gray-500">Absent</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 flex items-center gap-4">
                <div className="w-12 h-12 bg-yellow-100 rounded-xl flex items-center justify-center">
                  <CalendarOff size={24} className="text-yellow-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-800">{leaveCount}</p>
                  <p className="text-sm text-gray-500">On Leave</p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Date Selector */}
          <Card>
            <CardContent className="p-4">
              <div className="flex flex-col sm:flex-row items-center gap-4">
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="icon" onClick={() => {
                    const d = new Date(selectedDate);
                    d.setDate(d.getDate() - 1);
                    setSelectedDate(d.toISOString().split('T')[0]);
                  }}>
                    <ChevronLeft size={18} />
                  </Button>
                  <input
                    type="date"
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    className="border rounded-lg px-4 py-2"
                  />
                  <Button variant="outline" size="icon" onClick={() => {
                    const d = new Date(selectedDate);
                    d.setDate(d.getDate() + 1);
                    setSelectedDate(d.toISOString().split('T')[0]);
                  }}>
                    <ChevronRight size={18} />
                  </Button>
                </div>
                <Button variant="outline" onClick={() => setSelectedDate(todayStr)}>
                  Today
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Attendance Table */}
          <Card>
            <CardHeader>
              <CardTitle>Attendance for {new Date(selectedDate).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b">
                    <tr>
                      <th className="text-left p-4 font-semibold text-gray-600 text-sm">Employee</th>
                      <th className="text-left p-4 font-semibold text-gray-600 text-sm">Punch In</th>
                      <th className="text-left p-4 font-semibold text-gray-600 text-sm">Punch Out</th>
                      <th className="text-left p-4 font-semibold text-gray-600 text-sm">Work Hours</th>
                      <th className="text-left p-4 font-semibold text-gray-600 text-sm">Status</th>
                      <th className="text-left p-4 font-semibold text-gray-600 text-sm">Mark</th>
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
                        <td className="p-4 text-gray-700">{emp.attendance.punchIn || '-'}</td>
                        <td className="p-4 text-gray-700">{emp.attendance.punchOut || '-'}</td>
                        <td className="p-4 text-gray-700">{emp.attendance.workHours || 0} hrs</td>
                        <td className="p-4">
                          <span className={`text-xs px-3 py-1 rounded-full font-medium ${
                            emp.attendance.status === 'present' ? 'bg-green-100 text-green-700' :
                            emp.attendance.status === 'leave' ? 'bg-yellow-100 text-yellow-700' :
                            emp.attendance.status === 'absent' ? 'bg-red-100 text-red-700' :
                            'bg-gray-100 text-gray-500'
                          }`}>
                            {emp.attendance.status === 'not-marked' ? 'Not Marked' : emp.attendance.status}
                          </span>
                        </td>
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
                            <button
                              onClick={() => markAttendance(emp.id, 'leave')}
                              className={`p-1.5 rounded transition-colors ${emp.attendance.status === 'leave' ? 'bg-yellow-500 text-white' : 'bg-yellow-100 text-yellow-600 hover:bg-yellow-200'}`}
                              title="Leave"
                            >
                              <CalendarOff size={14} />
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
