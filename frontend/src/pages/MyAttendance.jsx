import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { attendanceAPI } from '../services/api';
import { Card, CardContent } from '../components/ui/card';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from '../components/ui/select';
import { Calendar, Clock, MapPin, IndianRupee, ChevronLeft, ChevronRight } from 'lucide-react';

const MyAttendance = () => {
  const { user } = useAuth();
  const currentDate = new Date();
  
  const months = ['January', 'February', 'March', 'April', 'May', 'June', 
                  'July', 'August', 'September', 'October', 'November', 'December'];
  const years = [2024, 2025, 2026];
  
  const [selectedMonth, setSelectedMonth] = useState(currentDate.getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(currentDate.getFullYear());
  const [attendance, setAttendance] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAttendance();
  }, [user?.id, selectedMonth, selectedYear]);

  const loadAttendance = async () => {
    if (!user?.id) return;
    
    setLoading(true);
    try {
      const data = await attendanceAPI.getMonthly(user.id, selectedMonth, selectedYear);
      // Sort by date descending
      const sorted = data.sort((a, b) => new Date(b.date) - new Date(a.date));
      setAttendance(sorted);
    } catch (error) {
      console.error('Error loading attendance:', error);
    } finally {
      setLoading(false);
    }
  };

  // Calculate summary
  const presentDays = attendance.filter(a => a.status === 'present').length;
  const absentDays = attendance.filter(a => a.status === 'absent').length;
  const leaveDays = attendance.filter(a => a.status === 'leave').length;
  const totalHours = attendance.reduce((sum, a) => sum + (a.work_hours || 0), 0);
  const totalConveyance = attendance.reduce((sum, a) => sum + (a.conveyance_amount || 0), 0);

  return (
    <div className="space-y-4">
      {/* Header */}
      <div>
        <h1 className="text-xl lg:text-2xl font-bold text-gray-800">Attendance Records</h1>
        <p className="text-sm text-gray-500">View your attendance history</p>
      </div>

      {/* Month/Year Selection */}
      <Card>
        <CardContent className="p-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-gray-500 mb-1 block">Year</label>
              <Select value={String(selectedYear)} onValueChange={(v) => setSelectedYear(parseInt(v))}>
                <SelectTrigger data-testid="year-select">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {years.map(y => <SelectItem key={y} value={String(y)}>{y}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-xs text-gray-500 mb-1 block">Month</label>
              <Select value={String(selectedMonth)} onValueChange={(v) => setSelectedMonth(parseInt(v))}>
                <SelectTrigger data-testid="month-select">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {months.map((m, i) => <SelectItem key={m} value={String(i + 1)}>{m}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 gap-3">
        <Card>
          <CardContent className="p-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-500">Present</p>
                <p className="text-xl font-bold text-green-600">{presentDays} days</p>
              </div>
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                <Calendar size={18} className="text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-500">Total Hours</p>
                <p className="text-xl font-bold text-blue-600">{Math.round(totalHours)}h</p>
              </div>
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <Clock size={18} className="text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-500">Absent/Leave</p>
                <p className="text-xl font-bold text-orange-600">{absentDays + leaveDays} days</p>
              </div>
              <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                <Calendar size={18} className="text-orange-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-green-50">
          <CardContent className="p-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-green-700">Conveyance</p>
                <p className="text-xl font-bold text-green-700">₹{totalConveyance.toLocaleString()}</p>
              </div>
              <div className="w-10 h-10 bg-green-200 rounded-lg flex items-center justify-center">
                <IndianRupee size={18} className="text-green-700" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Date-wise Attendance List */}
      <Card>
        <CardContent className="p-4">
          <h3 className="font-semibold text-gray-800 mb-4">
            {months[selectedMonth - 1]} {selectedYear} - Date-wise Records
          </h3>
          
          {loading ? (
            <div className="text-center py-8 text-gray-500">Loading...</div>
          ) : attendance.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No attendance records for this month
            </div>
          ) : (
            <div className="space-y-3">
              {attendance.map((record) => {
                const date = new Date(record.date);
                const dayName = date.toLocaleDateString('en-US', { weekday: 'short' });
                const dayNum = date.getDate();
                
                return (
                  <div 
                    key={record.id} 
                    className={`p-4 rounded-xl border ${
                      record.status === 'present' ? 'border-green-200 bg-green-50/50' :
                      record.status === 'leave' ? 'border-orange-200 bg-orange-50/50' :
                      'border-red-200 bg-red-50/50'
                    }`}
                    data-testid={`attendance-record-${record.date}`}
                  >
                    <div className="flex items-start justify-between">
                      {/* Date & Status */}
                      <div className="flex items-center gap-3">
                        <div className="text-center min-w-[50px]">
                          <p className="text-xs text-gray-500">{dayName}</p>
                          <p className="text-2xl font-bold text-gray-800">{dayNum}</p>
                        </div>
                        <div>
                          <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                            record.status === 'present' ? 'bg-green-100 text-green-700' :
                            record.status === 'leave' ? 'bg-orange-100 text-orange-700' :
                            'bg-red-100 text-red-700'
                          }`}>
                            {record.status.charAt(0).toUpperCase() + record.status.slice(1)}
                          </span>
                          {record.punch_in && (
                            <div className="flex items-center gap-2 mt-2 text-sm text-gray-600">
                              <Clock size={14} />
                              <span>{record.punch_in} - {record.punch_out || 'Working'}</span>
                              {record.work_hours > 0 && (
                                <span className="text-blue-600 font-medium">
                                  ({record.work_hours.toFixed(1)}h)
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Location & Conveyance */}
                      {record.location && (
                        <div className="text-right">
                          <div className="flex items-center gap-1 text-sm text-gray-600 justify-end">
                            <MapPin size={14} className="text-gray-400" />
                            <span>{record.location}</span>
                          </div>
                          {record.conveyance_amount > 0 && (
                            <div className="flex items-center gap-1 mt-1 text-green-600 font-semibold justify-end">
                              <IndianRupee size={14} />
                              <span>₹{record.conveyance_amount}</span>
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    {/* QR Code Info */}
                    {record.qr_code_id && (
                      <div className="mt-3 pt-3 border-t border-dashed flex items-center gap-2 text-xs text-gray-500">
                        <span className="bg-gray-100 px-2 py-1 rounded">
                          QR: {record.qr_code_id}
                        </span>
                        <span>Scanned attendance</span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Info Note */}
      <Card className="bg-blue-50 border-blue-200">
        <CardContent className="p-4">
          <p className="text-sm text-blue-800">
            <strong>Note:</strong> Conveyance amounts shown are from QR codes generated by your Team Leader. 
            These will be automatically added to your monthly salary breakdown.
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default MyAttendance;
