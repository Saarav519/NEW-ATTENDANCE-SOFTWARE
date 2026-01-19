import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { attendanceAPI, usersAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { Card, CardContent } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Calendar, CheckCircle, XCircle, Clock, ArrowLeft, Download, Edit, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';

const EmployeeAttendance = () => {
  const { empId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [employee, setEmployee] = useState(null);
  const [attendance, setAttendance] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedMonth, setSelectedMonth] = useState('January');
  const [selectedYear, setSelectedYear] = useState(2026);
  
  const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  const years = [2024, 2025, 2026, 2027];

  useEffect(() => {
    loadData();
  }, [empId, selectedMonth, selectedYear]);

  const loadData = async () => {
    try {
      // Convert month name to number (1-12)
      const monthNumber = months.indexOf(selectedMonth) + 1;
      
      const [empData, attData] = await Promise.all([
        usersAPI.getById(empId),
        attendanceAPI.getAll(empId, null, monthNumber, selectedYear)
      ]);
      setEmployee(empData);
      setAttendance(attData);
    } catch (error) {
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      full_day: 'bg-green-100 text-green-800 border-green-200',
      half_day: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      absent: 'bg-red-100 text-red-800 border-red-200'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const getStatusIcon = (status) => {
    if (status === 'full_day') return <CheckCircle size={16} className="text-green-600" />;
    if (status === 'half_day') return <Clock size={16} className="text-yellow-600" />;
    if (status === 'absent') return <XCircle size={16} className="text-red-600" />;
    return null;
  };

  // Calculate summary
  const fullDays = attendance.filter(a => a.attendance_status === 'full_day').length;
  const halfDays = attendance.filter(a => a.attendance_status === 'half_day').length;
  const absentDays = attendance.filter(a => a.attendance_status === 'absent').length;
  const totalConveyance = attendance.reduce((sum, a) => sum + (a.conveyance_amount || 0), 0);

  if (loading) {
    return <div className="flex items-center justify-center h-64"><Loader2 className="animate-spin" size={32} /></div>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="outline" onClick={() => navigate('/employees')}>
            <ArrowLeft size={18} className="mr-2" /> Back
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-gray-800">{employee?.name}'s Attendance</h1>
            <p className="text-gray-500">{employee?.id} - {employee?.designation || 'Employee'}</p>
          </div>
        </div>
        <Button variant="outline" onClick={() => toast.success('Export feature coming soon')}>
          <Download size={18} className="mr-2" /> Export CSV
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex gap-4 items-center">
            <div className="flex-1">
              <label className="text-sm font-medium mb-2 block">Month</label>
              <Select value={selectedMonth} onValueChange={setSelectedMonth}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {months.map(m => <SelectItem key={m} value={m}>{m}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="flex-1">
              <label className="text-sm font-medium mb-2 block">Year</label>
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
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Full Days</p>
                <p className="text-2xl font-bold text-green-600">{fullDays}</p>
              </div>
              <CheckCircle className="text-green-500" size={32} />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Half Days</p>
                <p className="text-2xl font-bold text-yellow-600">{halfDays}</p>
              </div>
              <Clock className="text-yellow-500" size={32} />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Absent</p>
                <p className="text-2xl font-bold text-red-600">{absentDays}</p>
              </div>
              <XCircle className="text-red-500" size={32} />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Total Conveyance</p>
                <p className="text-2xl font-bold text-blue-600">₹{totalConveyance.toLocaleString()}</p>
              </div>
              <Calendar className="text-blue-500" size={32} />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Attendance Records */}
      <Card>
        <CardContent className="pt-6">
          {attendance.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <Calendar className="mx-auto h-12 w-12 mb-4 text-gray-300" />
              <p>No attendance records found for {selectedMonth} {selectedYear}</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="text-left p-3 text-sm font-semibold text-gray-600">Date</th>
                    <th className="text-left p-3 text-sm font-semibold text-gray-600">Day</th>
                    <th className="text-center p-3 text-sm font-semibold text-gray-600">Punch In</th>
                    <th className="text-center p-3 text-sm font-semibold text-gray-600">Punch Out</th>
                    <th className="text-center p-3 text-sm font-semibold text-gray-600">Shift</th>
                    <th className="text-center p-3 text-sm font-semibold text-gray-600">Status</th>
                    <th className="text-right p-3 text-sm font-semibold text-gray-600">Conveyance</th>
                    <th className="text-left p-3 text-sm font-semibold text-gray-600">Location</th>
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
                        <td className="p-3 text-center text-sm">
                          {record.punch_in ? new Date(record.punch_in).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) : '-'}
                        </td>
                        <td className="p-3 text-center text-sm">
                          {record.punch_out ? new Date(record.punch_out).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) : '-'}
                        </td>
                        <td className="p-3 text-center">
                          <span className="text-xs px-2 py-1 bg-purple-100 text-purple-800 rounded">
                            {record.shift_type || 'day'}
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
                        <td className="p-3 text-right font-medium text-green-600">
                          ₹{record.conveyance_amount?.toLocaleString() || 0}
                        </td>
                        <td className="p-3 text-sm text-gray-600">{record.location || '-'}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Info Note */}
      <Card className="bg-blue-50 border-blue-200">
        <CardContent className="pt-6">
          <div className="flex items-start gap-3">
            <Calendar className="text-blue-600 mt-1" size={20} />
            <div className="text-sm text-blue-800">
              <p className="font-semibold mb-1">Attendance Overview for {selectedMonth} {selectedYear}</p>
              <ul className="space-y-1 text-xs">
                <li>• <strong>Full Day:</strong> Employee worked complete shift hours</li>
                <li>• <strong>Half Day:</strong> Employee worked partial shift</li>
                <li>• <strong>Absent:</strong> No attendance recorded</li>
                <li>• <strong>Sundays</strong> are highlighted in blue background</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default EmployeeAttendance;