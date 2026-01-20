import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { attendanceAPI, usersAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { Card, CardContent } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Checkbox } from '../components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../components/ui/dialog';
import { 
  Calendar, CheckCircle, XCircle, Clock, ArrowLeft, Download, Loader2, 
  MapPin, IndianRupee, Save, CheckSquare, Edit2, Plus
} from 'lucide-react';
import toast from 'react-hot-toast';

const API_URL = process.env.REACT_APP_BACKEND_URL;

const EmployeeAttendance = () => {
  const { empId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';
  
  const [employee, setEmployee] = useState(null);
  const [attendance, setAttendance] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedMonth, setSelectedMonth] = useState(12);
  const [selectedYear, setSelectedYear] = useState(2025);
  
  // Manual entry states
  const [calendarDays, setCalendarDays] = useState([]);
  const [selectedDates, setSelectedDates] = useState([]);
  const [entryData, setEntryData] = useState({});
  const [saving, setSaving] = useState(false);
  const [bulkDialog, setBulkDialog] = useState(false);
  const [bulkStatus, setBulkStatus] = useState('full_day');
  const [bulkConveyance, setBulkConveyance] = useState('');
  const [bulkLocation, setBulkLocation] = useState('Office');
  
  const months = [
    { value: 1, label: 'January' },
    { value: 2, label: 'February' },
    { value: 3, label: 'March' },
    { value: 4, label: 'April' },
    { value: 5, label: 'May' },
    { value: 6, label: 'June' },
    { value: 7, label: 'July' },
    { value: 8, label: 'August' },
    { value: 9, label: 'September' },
    { value: 10, label: 'October' },
    { value: 11, label: 'November' },
    { value: 12, label: 'December' }
  ];
  const years = [2024, 2025, 2026, 2027];

  useEffect(() => {
    loadData();
  }, [empId, selectedMonth, selectedYear]);

  useEffect(() => {
    generateCalendarDays();
  }, [selectedMonth, selectedYear, attendance]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [empData, attData] = await Promise.all([
        usersAPI.getById(empId),
        attendanceAPI.getAll(empId, null, selectedMonth, selectedYear)
      ]);
      setEmployee(empData);
      setAttendance(attData);
      
      // Initialize entry data from existing attendance
      const existingEntries = {};
      attData.forEach(record => {
        existingEntries[record.date] = {
          status: record.attendance_status || 'full_day',
          conveyance: record.conveyance_amount || 0,
          location: record.location || 'Office',
          exists: true
        };
      });
      setEntryData(existingEntries);
    } catch (error) {
      toast.error('Failed to load data');
      console.error('Load error:', error);
    } finally {
      setLoading(false);
    }
  };

  const generateCalendarDays = () => {
    const daysInMonth = new Date(selectedYear, selectedMonth, 0).getDate();
    const days = [];
    
    for (let day = 1; day <= daysInMonth; day++) {
      const dateStr = `${selectedYear}-${String(selectedMonth).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      const date = new Date(selectedYear, selectedMonth - 1, day);
      const dayName = date.toLocaleDateString('en-US', { weekday: 'short' });
      const isSunday = dayName === 'Sun';
      
      // Find existing attendance record
      const existingRecord = attendance.find(a => a.date === dateStr);
      
      days.push({
        day,
        dateStr,
        dayName,
        isSunday,
        hasRecord: !!existingRecord,
        record: existingRecord
      });
    }
    
    setCalendarDays(days);
  };

  const handleEntryChange = (dateStr, field, value) => {
    setEntryData(prev => ({
      ...prev,
      [dateStr]: {
        ...prev[dateStr],
        [field]: value
      }
    }));
  };

  const handleSelectDate = (dateStr) => {
    setSelectedDates(prev => {
      if (prev.includes(dateStr)) {
        return prev.filter(d => d !== dateStr);
      }
      return [...prev, dateStr];
    });
  };

  const handleSelectAll = () => {
    if (selectedDates.length === calendarDays.length) {
      setSelectedDates([]);
    } else {
      setSelectedDates(calendarDays.map(d => d.dateStr));
    }
  };

  const saveAttendance = async (dateStr) => {
    const entry = entryData[dateStr];
    if (!entry || !entry.status) {
      toast.error('Please select attendance status');
      return;
    }

    setSaving(true);
    try {
      const response = await fetch(
        `${API_URL}/api/attendance/mark?emp_id=${empId}&date=${dateStr}&status=${entry.status}&marked_by=${user.id}&conveyance=${entry.conveyance || 0}&location=${encodeURIComponent(entry.location || 'Office')}`,
        { method: 'POST' }
      );
      
      if (!response.ok) throw new Error('Failed to save');
      
      toast.success(`Attendance saved for ${dateStr}`);
      loadData();
    } catch (error) {
      toast.error('Failed to save attendance');
    } finally {
      setSaving(false);
    }
  };

  const saveBulkAttendance = async () => {
    if (selectedDates.length === 0) {
      toast.error('Please select at least one date');
      return;
    }

    setSaving(true);
    let successCount = 0;
    let failCount = 0;

    for (const dateStr of selectedDates) {
      try {
        const response = await fetch(
          `${API_URL}/api/attendance/mark?emp_id=${empId}&date=${dateStr}&status=${bulkStatus}&marked_by=${user.id}&conveyance=${bulkConveyance || 0}&location=${encodeURIComponent(bulkLocation || 'Office')}`,
          { method: 'POST' }
        );
        
        if (response.ok) {
          successCount++;
        } else {
          failCount++;
        }
      } catch (error) {
        failCount++;
      }
    }

    setSaving(false);
    setBulkDialog(false);
    setSelectedDates([]);
    
    if (successCount > 0) {
      toast.success(`Saved ${successCount} attendance records`);
      loadData();
    }
    if (failCount > 0) {
      toast.error(`Failed to save ${failCount} records`);
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      full_day: 'bg-green-100 text-green-800 border-green-200',
      half_day: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      absent: 'bg-red-100 text-red-800 border-red-200',
      leave: 'bg-orange-100 text-orange-800 border-orange-200'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const getStatusIcon = (status) => {
    if (status === 'full_day') return <CheckCircle size={14} className="text-green-600" />;
    if (status === 'half_day') return <Clock size={14} className="text-yellow-600" />;
    if (status === 'absent') return <XCircle size={14} className="text-red-600" />;
    if (status === 'leave') return <Calendar size={14} className="text-orange-600" />;
    return null;
  };

  // Calculate summary
  const fullDays = attendance.filter(a => a.attendance_status === 'full_day').length;
  const halfDays = attendance.filter(a => a.attendance_status === 'half_day').length;
  const leaveDays = attendance.filter(a => a.attendance_status === 'leave').length;
  const absentDays = attendance.filter(a => a.attendance_status === 'absent').length;
  const totalConveyance = attendance.reduce((sum, a) => sum + (a.conveyance_amount || 0), 0);
  const totalDuty = Math.round(attendance.reduce((sum, a) => sum + (a.daily_duty_amount || 0), 0));

  if (loading) {
    return <div className="flex items-center justify-center h-64"><Loader2 className="animate-spin" size={32} /></div>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-4">
          <Button variant="outline" onClick={() => navigate('/employees')}>
            <ArrowLeft size={18} className="mr-2" /> Back
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-gray-800">{employee?.name}'s Attendance</h1>
            <p className="text-gray-500">{employee?.id} - {employee?.designation || employee?.role}</p>
          </div>
        </div>
        <div className="flex gap-2">
          {isAdmin && selectedDates.length > 0 && (
            <Button onClick={() => setBulkDialog(true)} className="bg-blue-600 hover:bg-blue-700">
              <CheckSquare size={18} className="mr-2" /> Mark Selected ({selectedDates.length})
            </Button>
          )}
          <Button variant="outline" onClick={() => toast.success('Export feature coming soon')}>
            <Download size={18} className="mr-2" /> Export
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex gap-4 items-center">
            <div className="flex-1">
              <Label>Month</Label>
              <Select value={selectedMonth.toString()} onValueChange={(v) => setSelectedMonth(parseInt(v))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {months.map(m => <SelectItem key={m.value} value={m.value.toString()}>{m.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="flex-1">
              <Label>Year</Label>
              <Select value={selectedYear.toString()} onValueChange={(v) => setSelectedYear(parseInt(v))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {years.map(y => <SelectItem key={y} value={y.toString()}>{y}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-500">Full Days</p>
                <p className="text-xl font-bold text-green-600">{fullDays}</p>
              </div>
              <CheckCircle className="text-green-500" size={24} />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-500">Half Days</p>
                <p className="text-xl font-bold text-yellow-600">{halfDays}</p>
              </div>
              <Clock className="text-yellow-500" size={24} />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-500">Leave</p>
                <p className="text-xl font-bold text-orange-600">{leaveDays}</p>
              </div>
              <Calendar className="text-orange-500" size={24} />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-500">Absent</p>
                <p className="text-xl font-bold text-red-600">{absentDays}</p>
              </div>
              <XCircle className="text-red-500" size={24} />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-500">Conveyance</p>
                <p className="text-xl font-bold text-blue-600">₹{totalConveyance.toLocaleString()}</p>
              </div>
              <IndianRupee className="text-blue-500" size={24} />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-500">Duty Earned</p>
                <p className="text-xl font-bold text-purple-600">₹{totalDuty.toLocaleString()}</p>
              </div>
              <IndianRupee className="text-purple-500" size={24} />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Manual Entry Section - Admin Only */}
      {isAdmin && (
        <Card className="border-2 border-blue-200">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <Edit2 size={20} className="text-blue-600" />
                Manual Attendance Entry
              </h3>
              <div className="flex items-center gap-2">
                <Checkbox 
                  id="selectAll"
                  checked={selectedDates.length === calendarDays.length}
                  onCheckedChange={handleSelectAll}
                />
                <label htmlFor="selectAll" className="text-sm font-medium cursor-pointer">
                  Select All ({calendarDays.length} days)
                </label>
              </div>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="p-2 text-left w-10">
                      <Checkbox 
                        checked={selectedDates.length === calendarDays.length}
                        onCheckedChange={handleSelectAll}
                      />
                    </th>
                    <th className="p-2 text-left">Date</th>
                    <th className="p-2 text-left">Day</th>
                    <th className="p-2 text-left">Status</th>
                    <th className="p-2 text-left">Location</th>
                    <th className="p-2 text-left">Conveyance (₹)</th>
                    <th className="p-2 text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {calendarDays.map((dayInfo) => {
                    const entry = entryData[dayInfo.dateStr] || {};
                    const isSelected = selectedDates.includes(dayInfo.dateStr);
                    
                    return (
                      <tr 
                        key={dayInfo.dateStr} 
                        className={`
                          ${dayInfo.isSunday ? 'bg-blue-50' : 'hover:bg-gray-50'}
                          ${isSelected ? 'bg-blue-100' : ''}
                          ${dayInfo.hasRecord ? 'border-l-4 border-l-green-400' : ''}
                        `}
                      >
                        <td className="p-2">
                          <Checkbox 
                            checked={isSelected}
                            onCheckedChange={() => handleSelectDate(dayInfo.dateStr)}
                          />
                        </td>
                        <td className="p-2 font-medium">{dayInfo.day}</td>
                        <td className="p-2">
                          <span className={dayInfo.isSunday ? 'text-blue-600 font-semibold' : ''}>
                            {dayInfo.dayName}
                          </span>
                        </td>
                        <td className="p-2">
                          <Select 
                            value={entry.status || ''} 
                            onValueChange={(v) => handleEntryChange(dayInfo.dateStr, 'status', v)}
                          >
                            <SelectTrigger className="w-32 h-8">
                              <SelectValue placeholder="Select" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="full_day">
                                <span className="flex items-center gap-1">
                                  <CheckCircle size={12} className="text-green-600" /> Full Day
                                </span>
                              </SelectItem>
                              <SelectItem value="half_day">
                                <span className="flex items-center gap-1">
                                  <Clock size={12} className="text-yellow-600" /> Half Day
                                </span>
                              </SelectItem>
                              <SelectItem value="absent">
                                <span className="flex items-center gap-1">
                                  <XCircle size={12} className="text-red-600" /> Absent
                                </span>
                              </SelectItem>
                              <SelectItem value="leave">
                                <span className="flex items-center gap-1">
                                  <Calendar size={12} className="text-orange-600" /> Leave
                                </span>
                              </SelectItem>
                            </SelectContent>
                          </Select>
                        </td>
                        <td className="p-2">
                          <Input 
                            type="text"
                            placeholder="Location"
                            value={entry.location || ''}
                            onChange={(e) => handleEntryChange(dayInfo.dateStr, 'location', e.target.value)}
                            className="h-8 w-32"
                          />
                        </td>
                        <td className="p-2">
                          <Input 
                            type="number"
                            placeholder="0"
                            value={entry.conveyance || ''}
                            onChange={(e) => handleEntryChange(dayInfo.dateStr, 'conveyance', parseFloat(e.target.value) || 0)}
                            className="h-8 w-24"
                          />
                        </td>
                        <td className="p-2 text-center">
                          <Button 
                            size="sm" 
                            variant={dayInfo.hasRecord ? "outline" : "default"}
                            onClick={() => saveAttendance(dayInfo.dateStr)}
                            disabled={saving || !entry.status}
                            className={dayInfo.hasRecord ? "border-green-500 text-green-600" : "bg-blue-600"}
                          >
                            {dayInfo.hasRecord ? (
                              <><Edit2 size={14} className="mr-1" /> Update</>
                            ) : (
                              <><Plus size={14} className="mr-1" /> Save</>
                            )}
                          </Button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            
            <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg text-sm text-yellow-800">
              <p><strong>Tips:</strong></p>
              <ul className="list-disc list-inside mt-1 space-y-1">
                <li>Green left border indicates existing attendance record</li>
                <li>Use checkboxes to select multiple dates, then click "Mark Selected" for bulk entry</li>
                <li>Sundays are highlighted in blue</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Existing Attendance Records */}
      <Card>
        <CardContent className="pt-6">
          <h3 className="text-lg font-semibold mb-4">Attendance Records</h3>
          {attendance.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <Calendar className="mx-auto h-12 w-12 mb-4 text-gray-300" />
              <p>No attendance records found for {months.find(m => m.value === selectedMonth)?.label} {selectedYear}</p>
              {isAdmin && <p className="text-sm mt-2">Use the manual entry section above to add records</p>}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="text-left p-3 text-sm font-semibold text-gray-600">Date</th>
                    <th className="text-left p-3 text-sm font-semibold text-gray-600">Day</th>
                    <th className="text-center p-3 text-sm font-semibold text-gray-600">Status</th>
                    <th className="text-right p-3 text-sm font-semibold text-gray-600">Duty Earned</th>
                    <th className="text-right p-3 text-sm font-semibold text-gray-600">Conveyance</th>
                    <th className="text-left p-3 text-sm font-semibold text-gray-600">Location</th>
                    <th className="text-left p-3 text-sm font-semibold text-gray-600">Marked By</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {attendance.map((record) => {
                    const date = new Date(record.date);
                    const dayName = date.toLocaleDateString('en-US', { weekday: 'short' });
                    const isSunday = dayName === 'Sun';
                    
                    return (
                      <tr key={record.id} className={`hover:bg-gray-50 ${isSunday ? 'bg-blue-50' : ''}`}>
                        <td className="p-3 font-medium">{record.date}</td>
                        <td className="p-3">
                          <span className={`text-sm ${isSunday ? 'text-blue-600 font-semibold' : 'text-gray-600'}`}>
                            {dayName}
                          </span>
                        </td>
                        <td className="p-3 text-center">
                          <div className="flex items-center justify-center gap-2">
                            {getStatusIcon(record.attendance_status)}
                            <span className={`text-xs px-2 py-1 rounded border ${getStatusColor(record.attendance_status)}`}>
                              {record.attendance_status?.replace('_', ' ')}
                            </span>
                          </div>
                        </td>
                        <td className="p-3 text-right font-medium text-purple-600">
                          ₹{(record.daily_duty_amount || 0).toLocaleString()}
                        </td>
                        <td className="p-3 text-right font-medium text-green-600">
                          ₹{(record.conveyance_amount || 0).toLocaleString()}
                        </td>
                        <td className="p-3 text-sm text-gray-600">{record.location || '-'}</td>
                        <td className="p-3 text-sm text-gray-500">{record.marked_by || '-'}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Bulk Action Dialog */}
      <Dialog open={bulkDialog} onOpenChange={setBulkDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Mark Attendance for {selectedDates.length} Selected Dates</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg text-sm">
              <p className="font-medium text-blue-800">Selected dates will be marked with the same values:</p>
            </div>
            
            <div className="space-y-2">
              <Label>Attendance Status</Label>
              <Select value={bulkStatus} onValueChange={setBulkStatus}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="full_day">
                    <span className="flex items-center gap-2">
                      <CheckCircle size={14} className="text-green-600" /> Full Day
                    </span>
                  </SelectItem>
                  <SelectItem value="half_day">
                    <span className="flex items-center gap-2">
                      <Clock size={14} className="text-yellow-600" /> Half Day
                    </span>
                  </SelectItem>
                  <SelectItem value="absent">
                    <span className="flex items-center gap-2">
                      <XCircle size={14} className="text-red-600" /> Absent
                    </span>
                  </SelectItem>
                  <SelectItem value="leave">
                    <span className="flex items-center gap-2">
                      <Calendar size={14} className="text-orange-600" /> Leave
                    </span>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <MapPin size={14} /> Location
              </Label>
              <Input 
                type="text"
                placeholder="e.g., Office, Client Site"
                value={bulkLocation}
                onChange={(e) => setBulkLocation(e.target.value)}
              />
            </div>
            
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <IndianRupee size={14} /> Conveyance Amount
              </Label>
              <Input 
                type="number"
                placeholder="0"
                value={bulkConveyance}
                onChange={(e) => setBulkConveyance(e.target.value)}
              />
            </div>
            
            <div className="text-sm text-gray-500">
              <p><strong>Dates to be marked:</strong></p>
              <div className="mt-1 max-h-32 overflow-y-auto text-xs">
                {selectedDates.sort().join(', ')}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setBulkDialog(false)}>Cancel</Button>
            <Button 
              onClick={saveBulkAttendance} 
              disabled={saving}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {saving ? (
                <><Loader2 className="animate-spin mr-2" size={16} /> Saving...</>
              ) : (
                <><Save size={16} className="mr-2" /> Save {selectedDates.length} Entries</>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default EmployeeAttendance;
