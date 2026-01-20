import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from '../components/ui/select';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter
} from '../components/ui/dialog';
import {
  Calendar, Clock, UserCheck, UserX, LogIn, LogOut,
  ChevronLeft, ChevronRight, Loader2, MapPin, IndianRupee, Edit
} from 'lucide-react';
import { usersAPI, attendanceAPI } from '../services/api';
import toast from 'react-hot-toast';

const API_URL = process.env.REACT_APP_BACKEND_URL;

const Attendance = () => {
  const { user, isAdmin } = useAuth();
  const isTeamLead = user?.role === 'teamlead';
  const canMarkAttendance = isAdmin || isTeamLead;
  
  const currentDate = new Date();
  const [selectedMonth, setSelectedMonth] = useState(currentDate.getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(currentDate.getFullYear());
  const [selectedDate, setSelectedDate] = useState(currentDate.toISOString().split('T')[0]);
  const [attendanceRecords, setAttendanceRecords] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isPunchedIn, setIsPunchedIn] = useState(false);
  const [punchTime, setPunchTime] = useState(null);
  
  // Mark Attendance Dialog
  const [markDialog, setMarkDialog] = useState({ open: false, employee: null });
  const [markData, setMarkData] = useState({
    status: 'present',
    conveyance: 0,
    location: 'Office'
  });
  const [submitting, setSubmitting] = useState(false);

  const todayStr = currentDate.toISOString().split('T')[0];
  const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

  useEffect(() => {
    const newDate = `${selectedYear}-${String(selectedMonth).padStart(2, '0')}-01`;
    setSelectedDate(newDate);
  }, [selectedMonth, selectedYear]);

  useEffect(() => {
    loadData();
  }, [selectedMonth, selectedYear]);

  const loadData = async () => {
    setLoading(true);
    try {
      let usersData;
      if (isTeamLead) {
        usersData = await fetch(`${API_URL}/api/users/team/${user.id}`).then(r => r.json());
      } else {
        usersData = await usersAPI.getAll();
      }
      const activeEmployees = usersData.filter(u => u.status === 'active' && u.role !== 'admin');
      setEmployees(activeEmployees);

      const attendanceData = await attendanceAPI.getAll(null, null, selectedMonth, selectedYear);
      setAttendanceRecords(attendanceData || []);
    } catch (error) {
      console.error('Error loading data:', error);
      toast.error('Failed to load attendance data');
    } finally {
      setLoading(false);
    }
  };

  // Get attendance for selected date
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
        dailyDuty: Math.round(record.daily_duty_amount || 0)
      } : { 
        status: 'not-marked', 
        punchIn: null, 
        punchOut: null, 
        workHours: 0,
        attendanceStatus: null,
        location: '',
        conveyance: 0,
        dailyDuty: 0
      }
    };
  });

  const presentCount = dateAttendance.filter(e => e.attendance.attendanceStatus === 'full_day').length;
  const halfDayCount = dateAttendance.filter(e => e.attendance.attendanceStatus === 'half_day').length;
  const absentCount = dateAttendance.filter(e => e.attendance.attendanceStatus === 'absent').length;
  const notMarkedCount = dateAttendance.filter(e => e.attendance.status === 'not-marked').length;

  // Open mark attendance dialog
  const openMarkDialog = (emp) => {
    const existing = attendanceRecords.find(r => r.emp_id === emp.id && r.date === selectedDate);
    setMarkData({
      status: existing?.attendance_status || 'full_day',
      conveyance: existing?.conveyance_amount ?? 200,
      location: existing?.location || 'Office'
    });
    setMarkDialog({ open: true, employee: emp });
  };

  // Submit attendance with conveyance and location
  const submitAttendance = async () => {
    if (!markDialog.employee) return;
    setSubmitting(true);
    try {
      const params = new URLSearchParams({
        emp_id: markDialog.employee.id,
        date: selectedDate,
        status: markData.status,
        marked_by: user?.id || 'ADMIN001',
        conveyance: markData.conveyance.toString(),
        location: markData.location
      });
      
      const response = await fetch(`${API_URL}/api/attendance/mark?${params}`, { method: 'POST' });
      const result = await response.json();
      
      if (response.ok) {
        toast.success(`Attendance marked: ${markData.status} | ₹${Math.round(result.daily_duty_amount || 0)} duty + ₹${markData.conveyance} conv`);
        setMarkDialog({ open: false, employee: null });
        loadData();
      } else {
        toast.error(result.detail || 'Failed to mark attendance');
      }
    } catch (error) {
      toast.error('Failed to mark attendance');
    } finally {
      setSubmitting(false);
    }
  };

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

  const getDaysInMonth = (month, year) => new Date(year, month, 0).getDate();
  const daysInMonth = getDaysInMonth(selectedMonth, selectedYear);
  const monthDates = Array.from({ length: daysInMonth }, (_, i) => {
    const day = i + 1;
    return `${selectedYear}-${String(selectedMonth).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
        <span className="ml-2">Loading attendance data...</span>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-800">Attendance</h1>
          <p className="text-sm text-gray-500">Track daily attendance</p>
        </div>
        {!canMarkAttendance && (
          <div className="flex gap-2">
            {!isPunchedIn ? (
              <Button onClick={handlePunchIn} className="bg-green-600 hover:bg-green-700 flex-1 sm:flex-none">
                <LogIn size={16} className="mr-2" /> Punch In
              </Button>
            ) : (
              <Button onClick={handlePunchOut} className="bg-red-600 hover:bg-red-700 flex-1 sm:flex-none">
                <LogOut size={16} className="mr-2" /> Punch Out
              </Button>
            )}
          </div>
        )}
      </div>

      {/* Employee Self View */}
      {!canMarkAttendance && (
        <Card className="bg-gradient-to-r from-[#1E2A5E] to-[#2D3A8C] text-white">
          <CardContent className="p-4 sm:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-white/70 text-sm mb-1">Today's Status</p>
                <h2 className="text-2xl sm:text-3xl font-bold">
                  {isPunchedIn ? 'Working' : punchTime ? 'Completed' : 'Not Started'}
                </h2>
                {punchTime && <p className="text-white/70 text-sm mt-2">Punched in at {punchTime}</p>}
              </div>
              <div className="w-16 h-16 sm:w-20 sm:h-20 bg-white/20 rounded-full flex items-center justify-center">
                <Clock size={32} className="text-white" />
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Admin/Team Lead View */}
      {canMarkAttendance && (
        <>
          {/* Stats - Mobile Responsive */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-4">
            <Card>
              <CardContent className="p-3 sm:p-4 flex items-center gap-2 sm:gap-4">
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-blue-100 rounded-xl flex items-center justify-center flex-shrink-0">
                  <Calendar size={20} className="text-blue-600" />
                </div>
                <div>
                  <p className="text-xs sm:text-sm text-gray-500">Total</p>
                  <p className="text-lg sm:text-2xl font-bold">{employees.length}</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-3 sm:p-4 flex items-center gap-2 sm:gap-4">
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-green-100 rounded-xl flex items-center justify-center flex-shrink-0">
                  <UserCheck size={20} className="text-green-600" />
                </div>
                <div>
                  <p className="text-xs sm:text-sm text-gray-500">Present</p>
                  <p className="text-lg sm:text-2xl font-bold text-green-600">{presentCount}</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-3 sm:p-4 flex items-center gap-2 sm:gap-4">
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-yellow-100 rounded-xl flex items-center justify-center flex-shrink-0">
                  <Clock size={20} className="text-yellow-600" />
                </div>
                <div>
                  <p className="text-xs sm:text-sm text-gray-500">Half Day</p>
                  <p className="text-lg sm:text-2xl font-bold text-yellow-600">{halfDayCount}</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-3 sm:p-4 flex items-center gap-2 sm:gap-4">
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-red-100 rounded-xl flex items-center justify-center flex-shrink-0">
                  <UserX size={20} className="text-red-600" />
                </div>
                <div>
                  <p className="text-xs sm:text-sm text-gray-500">Absent</p>
                  <p className="text-lg sm:text-2xl font-bold text-red-600">{absentCount}</p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Month/Year Selector + Calendar */}
          <Card>
            <CardContent className="p-3 sm:p-4">
              <div className="flex flex-wrap items-center gap-2 mb-4">
                <Select value={selectedMonth.toString()} onValueChange={(v) => setSelectedMonth(parseInt(v))}>
                  <SelectTrigger className="w-28 sm:w-36"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {MONTHS.map((m, i) => <SelectItem key={i} value={(i+1).toString()}>{m}</SelectItem>)}
                  </SelectContent>
                </Select>
                <Select value={selectedYear.toString()} onValueChange={(v) => setSelectedYear(parseInt(v))}>
                  <SelectTrigger className="w-20 sm:w-24"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {[2024, 2025, 2026, 2027].map(y => <SelectItem key={y} value={y.toString()}>{y}</SelectItem>)}
                  </SelectContent>
                </Select>
                <span className="text-xs text-gray-500 ml-auto">Not Marked: {notMarkedCount}</span>
              </div>
              
              {/* Mini Calendar */}
              <div className="grid grid-cols-7 gap-1 text-center text-xs">
                {['S','M','T','W','T','F','S'].map((d, i) => (
                  <div key={i} className="p-1 font-medium text-gray-500">{d}</div>
                ))}
                {/* Empty cells for first day offset */}
                {Array.from({ length: new Date(selectedYear, selectedMonth - 1, 1).getDay() }).map((_, i) => (
                  <div key={`empty-${i}`} />
                ))}
                {monthDates.map((date, idx) => {
                  const day = idx + 1;
                  const hasAttendance = attendanceRecords.some(r => r.date === date);
                  const isSelected = date === selectedDate;
                  const isToday = date === todayStr;
                  
                  return (
                    <button
                      key={date}
                      onClick={() => setSelectedDate(date)}
                      className={`p-1 sm:p-2 text-xs sm:text-sm rounded-lg transition-all ${
                        isSelected ? 'bg-blue-600 text-white' 
                        : isToday ? 'bg-blue-100 text-blue-600 font-bold'
                        : hasAttendance ? 'bg-green-50 text-green-700 hover:bg-green-100'
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

          {/* Attendance List - Mobile Cards / Desktop Table */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base sm:text-lg">
                {new Date(selectedDate).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-2 sm:p-4">
              {/* Mobile View - Cards */}
              <div className="sm:hidden space-y-3">
                {dateAttendance.map((emp) => (
                  <div key={emp.id} className="p-3 bg-gray-50 rounded-lg" data-testid={`attendance-card-${emp.id}`}>
                    {/* Employee Info Row */}
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2 min-w-0 flex-1">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                          {emp.name?.split(' ').map(n => n[0]).join('')}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="font-medium text-sm truncate">{emp.name}</p>
                          <p className="text-xs text-gray-500">{emp.id}</p>
                        </div>
                      </div>
                      <span className={`text-xs px-2 py-1 rounded-full font-medium whitespace-nowrap ml-2 ${
                        emp.attendance.attendanceStatus === 'full_day' ? 'bg-green-100 text-green-700' :
                        emp.attendance.attendanceStatus === 'half_day' ? 'bg-yellow-100 text-yellow-700' :
                        emp.attendance.attendanceStatus === 'absent' ? 'bg-red-100 text-red-700' :
                        'bg-gray-100 text-gray-500'
                      }`}>
                        {emp.attendance.status === 'not-marked' ? 'Not Marked' : 
                         emp.attendance.attendanceStatus === 'half_day' ? 'Half' :
                         emp.attendance.attendanceStatus === 'absent' ? 'Absent' : 'Full'}
                      </span>
                    </div>
                    
                    {/* Stats Row - Stacked for mobile */}
                    <div className="grid grid-cols-3 gap-2 text-xs text-gray-600 mb-3 bg-white p-2 rounded-md">
                      <div className="text-center">
                        <p className="text-gray-400 text-[10px]">Duty</p>
                        <p className="font-semibold text-green-600">₹{emp.attendance.dailyDuty.toLocaleString()}</p>
                      </div>
                      <div className="text-center border-x border-gray-100">
                        <p className="text-gray-400 text-[10px]">Conv</p>
                        <p className="font-semibold text-blue-600">₹{emp.attendance.conveyance}</p>
                      </div>
                      <div className="text-center">
                        <p className="text-gray-400 text-[10px]">Location</p>
                        <p className="font-semibold truncate">{emp.attendance.location || '-'}</p>
                      </div>
                    </div>
                    
                    {/* Action Buttons - Grid layout for mobile */}
                    <div className="grid grid-cols-4 gap-1">
                      <Button size="sm" variant="outline" onClick={() => openMarkDialog(emp)} className="text-blue-600 h-8 px-2">
                        <Edit size={12} className="mr-1" /> Edit
                      </Button>
                      <Button size="sm" variant={emp.attendance.attendanceStatus === 'full_day' ? 'default' : 'outline'} 
                        onClick={() => { setMarkData({status:'present',conveyance:200,location:'Office'}); setMarkDialog({open:true,employee:emp}); }}
                        className={`h-8 px-2 ${emp.attendance.attendanceStatus === 'full_day' ? 'bg-green-600' : 'text-green-600'}`}>
                        Full
                      </Button>
                      <Button size="sm" variant={emp.attendance.attendanceStatus === 'half_day' ? 'default' : 'outline'}
                        onClick={() => { setMarkData({status:'half_day',conveyance:100,location:'Office'}); setMarkDialog({open:true,employee:emp}); }}
                        className={`h-8 px-2 ${emp.attendance.attendanceStatus === 'half_day' ? 'bg-yellow-600' : 'text-yellow-600'}`}>
                        Half
                      </Button>
                      <Button size="sm" variant={emp.attendance.attendanceStatus === 'absent' ? 'default' : 'outline'}
                        onClick={() => { setMarkData({status:'absent',conveyance:0,location:''}); setMarkDialog({open:true,employee:emp}); }}
                        className={`h-8 px-2 ${emp.attendance.attendanceStatus === 'absent' ? 'bg-red-600' : 'text-red-600'}`}>
                        Absent
                      </Button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Desktop View - Table */}
              <div className="hidden sm:block overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b bg-gray-50">
                      <th className="text-left p-3 font-medium text-gray-600">Employee</th>
                      <th className="text-left p-3 font-medium text-gray-600">In/Out</th>
                      <th className="text-left p-3 font-medium text-gray-600">Status</th>
                      <th className="text-right p-3 font-medium text-gray-600">Duty</th>
                      <th className="text-right p-3 font-medium text-gray-600">Conv</th>
                      <th className="text-left p-3 font-medium text-gray-600">Location</th>
                      <th className="text-center p-3 font-medium text-gray-600">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {dateAttendance.map((emp) => (
                      <tr key={emp.id} className="hover:bg-gray-50">
                        <td className="p-3">
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white font-bold text-xs">
                              {emp.name?.split(' ').map(n => n[0]).join('')}
                            </div>
                            <div>
                              <p className="font-medium text-sm">{emp.name}</p>
                              <p className="text-xs text-gray-500">{emp.id}</p>
                            </div>
                          </div>
                        </td>
                        <td className="p-3 text-sm">{emp.attendance.punchIn || '-'} / {emp.attendance.punchOut || '-'}</td>
                        <td className="p-3">
                          <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                            emp.attendance.attendanceStatus === 'full_day' ? 'bg-green-100 text-green-700' :
                            emp.attendance.attendanceStatus === 'half_day' ? 'bg-yellow-100 text-yellow-700' :
                            emp.attendance.attendanceStatus === 'absent' ? 'bg-red-100 text-red-700' :
                            'bg-gray-100 text-gray-500'
                          }`}>
                            {emp.attendance.status === 'not-marked' ? 'Not Marked' : 
                             emp.attendance.attendanceStatus === 'half_day' ? 'Half Day' :
                             emp.attendance.attendanceStatus === 'absent' ? 'Absent' : 'Full Day'}
                          </span>
                        </td>
                        <td className="p-3 text-right font-medium text-green-600">₹{emp.attendance.dailyDuty.toLocaleString()}</td>
                        <td className="p-3 text-right font-medium text-blue-600">₹{emp.attendance.conveyance}</td>
                        <td className="p-3 text-sm text-gray-600">{emp.attendance.location || '-'}</td>
                        <td className="p-3">
                          <div className="flex justify-center gap-1">
                            <Button size="sm" variant="outline" onClick={() => openMarkDialog(emp)} title="Edit with options">
                              <Edit size={14} />
                            </Button>
                            <Button size="sm" variant={emp.attendance.attendanceStatus === 'full_day' ? 'default' : 'outline'}
                              onClick={() => { setMarkData({status:'present',conveyance:200,location:'Office'}); setMarkDialog({open:true,employee:emp}); }}
                              className={emp.attendance.attendanceStatus === 'full_day' ? 'bg-green-600' : 'text-green-600'}>
                              <UserCheck size={14} />
                            </Button>
                            <Button size="sm" variant={emp.attendance.attendanceStatus === 'half_day' ? 'default' : 'outline'}
                              onClick={() => { setMarkData({status:'half_day',conveyance:100,location:'Office'}); setMarkDialog({open:true,employee:emp}); }}
                              className={emp.attendance.attendanceStatus === 'half_day' ? 'bg-yellow-600' : 'text-yellow-600'}>
                              ½
                            </Button>
                            <Button size="sm" variant={emp.attendance.attendanceStatus === 'absent' ? 'default' : 'outline'}
                              onClick={() => { setMarkData({status:'absent',conveyance:0,location:''}); setMarkDialog({open:true,employee:emp}); }}
                              className={emp.attendance.attendanceStatus === 'absent' ? 'bg-red-600' : 'text-red-600'}>
                              <UserX size={14} />
                            </Button>
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

      {/* Mark Attendance Dialog */}
      <Dialog open={markDialog.open} onOpenChange={(open) => setMarkDialog({ open, employee: null })}>
        <DialogContent className="max-w-[95vw] sm:max-w-sm mx-2 sm:mx-auto">
          <DialogHeader>
            <DialogTitle className="text-base sm:text-lg">Mark Attendance</DialogTitle>
            <p className="text-sm text-gray-500 truncate">{markDialog.employee?.name}</p>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label className="text-sm">Attendance Status</Label>
              <Select value={markData.status} onValueChange={(v) => setMarkData({...markData, status: v, conveyance: v === 'absent' || v === 'leave' ? 0 : v === 'half_day' ? 100 : 200})}>
                <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="present">Full Day (Present)</SelectItem>
                  <SelectItem value="half_day">Half Day</SelectItem>
                  <SelectItem value="leave">Leave (Approved)</SelectItem>
                  <SelectItem value="absent">Absent</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label className="text-sm flex items-center gap-1"><IndianRupee size={12} /> Conveyance</Label>
                <Input 
                  type="number" 
                  value={markData.conveyance} 
                  onChange={(e) => setMarkData({...markData, conveyance: parseFloat(e.target.value) || 0})}
                  placeholder="₹ Amount"
                  className="h-9"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-sm flex items-center gap-1"><MapPin size={12} /> Location</Label>
                <Input 
                  type="text" 
                  value={markData.location} 
                  onChange={(e) => setMarkData({...markData, location: e.target.value})}
                  placeholder="Location"
                  className="h-9"
                />
              </div>
            </div>
            <div className="text-xs text-gray-600 bg-gray-50 p-2 rounded-lg flex justify-between">
              <span><strong>Date:</strong> {selectedDate}</span>
              <span><strong>ID:</strong> {markDialog.employee?.id}</span>
            </div>
          </div>
          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button variant="outline" onClick={() => setMarkDialog({ open: false, employee: null })} className="w-full sm:w-auto order-2 sm:order-1">
              Cancel
            </Button>
            <Button onClick={submitAttendance} disabled={submitting} className="bg-[#1E2A5E] w-full sm:w-auto order-1 sm:order-2">
              {submitting ? <Loader2 className="animate-spin mr-2" size={16} /> : null}
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Attendance;
