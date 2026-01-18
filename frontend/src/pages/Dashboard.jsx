import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { attendanceAPI } from '../services/api';
import { leaveRequests, holidays, users } from '../data/mockData';
import { Card, CardContent } from '../components/ui/card';
import { Button } from '../components/ui/button';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter
} from '../components/ui/dialog';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from '../components/ui/select';
import { Html5Qrcode } from 'html5-qrcode';
import {
  Clock, Calendar, CalendarOff, Gift, LogIn, LogOut,
  CheckCircle, XCircle, TrendingUp, Users, UserCheck, UserX,
  ArrowRight, ChevronRight, Receipt, QrCode, MapPin, IndianRupee, Camera, X
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

// Employee Dashboard - Mobile First with QR Punch In & Attendance Details
const EmployeeDashboard = ({ user }) => {
  const [isPunchedIn, setIsPunchedIn] = useState(false);
  const [punchInTime, setPunchInTime] = useState(null);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [showQRScanner, setShowQRScanner] = useState(false);
  const [todayAttendance, setTodayAttendance] = useState(null);
  const [monthlyAttendance, setMonthlyAttendance] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const scannerRef = useRef(null);
  const isScannerRunning = useRef(false);

  const currentDate = new Date();
  const months = ['January', 'February', 'March', 'April', 'May', 'June', 
                  'July', 'August', 'September', 'October', 'November', 'December'];
  
  const [selectedMonth, setSelectedMonth] = useState(currentDate.getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(currentDate.getFullYear());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    loadAttendanceData();
  }, [user?.id, selectedMonth, selectedYear]);

  useEffect(() => {
    if (showQRScanner) {
      initScanner();
    }
    return () => {
      // Only stop if scanner is actually running
      if (scannerRef.current && isScannerRunning.current) {
        isScannerRunning.current = false;
        scannerRef.current.stop().catch(() => {});
      }
    };
  }, [showQRScanner]);

  const loadAttendanceData = async () => {
    if (!user?.id) return;
    
    setLoading(true);
    try {
      const today = new Date().toISOString().split('T')[0];

      // Get today's attendance
      const todayData = await attendanceAPI.getAll(user.id, today);
      if (todayData.length > 0) {
        setTodayAttendance(todayData[0]);
        setIsPunchedIn(todayData[0].punch_in && !todayData[0].punch_out);
        if (todayData[0].punch_in) {
          const [h, m] = todayData[0].punch_in.split(':');
          const punchTime = new Date();
          punchTime.setHours(parseInt(h), parseInt(m), 0);
          setPunchInTime(punchTime);
        }
      }

      // Get monthly attendance
      const monthlyData = await attendanceAPI.getMonthly(user.id, selectedMonth, selectedYear);
      const sorted = monthlyData.sort((a, b) => new Date(b.date) - new Date(a.date));
      setMonthlyAttendance(sorted);
    } catch (error) {
      console.error('Error loading attendance:', error);
    } finally {
      setLoading(false);
    }
  };

  const initScanner = () => {
    setTimeout(async () => {
      try {
        const html5QrCode = new Html5Qrcode("qr-reader");
        scannerRef.current = html5QrCode;
        
        await html5QrCode.start(
          { facingMode: "environment" }, // Use back camera only
          {
            fps: 10,
            qrbox: { width: 250, height: 250 },
            aspectRatio: 1.0
          },
          async (decodedText) => {
            // Success callback - stop scanner and mark as not running
            if (isScannerRunning.current) {
              isScannerRunning.current = false;
              try {
                await html5QrCode.stop();
              } catch (e) {
                // Ignore stop errors
              }
            }
            await handleQRScanned(decodedText);
          },
          (errorMessage) => {
            // Error callback - ignore scan errors
          }
        );
        // Mark scanner as running after successful start
        isScannerRunning.current = true;
      } catch (err) {
        console.error('Scanner error:', err);
        isScannerRunning.current = false;
      }
    }, 100);
  };

  const handleQRScanned = async (qrData) => {
    setShowQRScanner(false);
    
    try {
      console.log('QR Data scanned:', qrData);
      
      // Validate QR data is proper JSON
      try {
        JSON.parse(qrData);
      } catch (e) {
        alert('Invalid QR Code format. Please scan a valid attendance QR code.');
        return;
      }
      
      const result = await attendanceAPI.punchIn(user.id, qrData);
      console.log('Punch-in result:', result);
      
      if (result && result.punch_in) {
        setTodayAttendance(result);
        setIsPunchedIn(true);
        
        const [h, m] = result.punch_in.split(':');
        const punchTime = new Date();
        punchTime.setHours(parseInt(h), parseInt(m), 0);
        setPunchInTime(punchTime);
        
        await loadAttendanceData();
      } else {
        alert('Punch-in failed: No response from server');
      }
    } catch (error) {
      console.error('Punch-in error:', error);
      alert(error.message || 'Failed to punch in. Please try again.');
    }
  };

  const handlePunchOut = async () => {
    try {
      const today = new Date().toISOString().split('T')[0];
      const result = await attendanceAPI.punchOut(user.id, today);
      setTodayAttendance(result);
      setIsPunchedIn(false);
      await loadAttendanceData();
    } catch (error) {
      alert(error.message || 'Failed to punch out');
    }
  };

  const handlePunch = () => {
    if (!isPunchedIn) {
      setShowQRScanner(true);
    } else {
      handlePunchOut();
    }
  };

  const closeScanner = async () => {
    // Only stop if scanner is actually running
    if (scannerRef.current && isScannerRunning.current) {
      isScannerRunning.current = false;
      try {
        await scannerRef.current.stop();
      } catch (e) {
        // Ignore stop errors
      }
    }
    setShowQRScanner(false);
  };

  const upcomingHolidays = holidays
    .filter(h => new Date(h.date) >= new Date())
    .sort((a, b) => new Date(a.date) - new Date(b.date))
    .slice(0, 3);

  const myLeaves = leaveRequests.filter(l => l.empId === user.id);
  const pendingLeaves = myLeaves.filter(l => l.status === 'pending').length;

  // Calculate stats
  const presentDays = monthlyAttendance.filter(a => a.status === 'present').length;
  const totalHours = monthlyAttendance.reduce((sum, a) => sum + (a.work_hours || 0), 0);
  const totalConveyance = monthlyAttendance.reduce((sum, a) => sum + (a.conveyance_amount || 0), 0);

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
              <div className="flex items-center justify-between mb-2">
                <div>
                  <p className="text-white/70 text-xs">Punched In</p>
                  <p className="font-semibold">{punchInTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}</p>
                </div>
                <div className="text-right">
                  <p className="text-white/70 text-xs">Working</p>
                  <p className="font-semibold">
                    {Math.floor((currentTime - punchInTime) / 1000 / 60 / 60)}h {Math.floor(((currentTime - punchInTime) / 1000 / 60) % 60)}m
                  </p>
                </div>
              </div>
              
              {todayAttendance && (
                <div className="pt-2 border-t border-white/20 flex items-center justify-between text-sm">
                  <div className="flex items-center gap-1">
                    <MapPin size={14} />
                    <span>{todayAttendance.location || 'N/A'}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <IndianRupee size={14} />
                    <span>₹{todayAttendance.conveyance_amount || 0}</span>
                  </div>
                </div>
              )}
            </div>
          )}

          <Button
            onClick={handlePunch}
            data-testid="punch-btn"
            className={`w-full h-14 text-lg font-bold rounded-xl transition-all ${
              isPunchedIn
                ? 'bg-red-500 hover:bg-red-600'
                : 'bg-green-500 hover:bg-green-600'
            }`}
          >
            {isPunchedIn ? (
              <><LogOut size={24} className="mr-2" /> Punch Out</>
            ) : (
              <><QrCode size={24} className="mr-2" /> Scan QR & Punch In</>
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
            <p className="text-lg font-bold text-gray-800">{presentDays}</p>
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
        <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => navigate('/bills')}>
          <CardContent className="p-3 text-center">
            <div className="w-10 h-10 mx-auto mb-2 bg-purple-100 rounded-xl flex items-center justify-center">
              <Receipt size={20} className="text-purple-600" />
            </div>
            <p className="text-lg font-bold text-gray-800">{Math.round(totalHours)}h</p>
            <p className="text-[10px] text-gray-500">Work Hours</p>
          </CardContent>
        </Card>
      </div>

      {/* Attendance Details Section - Inline */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-800">Attendance Details</h3>
            <button onClick={() => navigate('/attendance-details')} className="text-xs text-[#1E2A5E] flex items-center">
              View All <ChevronRight size={14} />
            </button>
          </div>
          
          {/* Month/Year Selector */}
          <div className="grid grid-cols-2 gap-3 mb-4">
            <Select value={String(selectedYear)} onValueChange={(v) => setSelectedYear(parseInt(v))}>
              <SelectTrigger className="h-9 text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {[2024, 2025, 2026].map(y => <SelectItem key={y} value={String(y)}>{y}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={String(selectedMonth)} onValueChange={(v) => setSelectedMonth(parseInt(v))}>
              <SelectTrigger className="h-9 text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {months.map((m, i) => <SelectItem key={m} value={String(i + 1)}>{m}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          {/* Monthly Summary */}
          <div className="grid grid-cols-3 gap-2 mb-4">
            <div className="text-center p-2 bg-green-50 rounded-lg">
              <p className="text-lg font-bold text-green-600">{presentDays}</p>
              <p className="text-[10px] text-gray-500">Present</p>
            </div>
            <div className="text-center p-2 bg-blue-50 rounded-lg">
              <p className="text-lg font-bold text-blue-600">{Math.round(totalHours)}h</p>
              <p className="text-[10px] text-gray-500">Hours</p>
            </div>
            <div className="text-center p-2 bg-green-100 rounded-lg">
              <p className="text-lg font-bold text-green-700">₹{totalConveyance}</p>
              <p className="text-[10px] text-gray-500">Conveyance</p>
            </div>
          </div>

          {/* Recent Records */}
          <div className="space-y-2">
            {loading ? (
              <div className="text-center py-4 text-gray-500 text-sm">Loading...</div>
            ) : monthlyAttendance.length === 0 ? (
              <div className="text-center py-4 text-gray-500 text-sm">No records</div>
            ) : (
              monthlyAttendance.slice(0, 5).map((record) => {
                const date = new Date(record.date);
                return (
                  <div 
                    key={record.id} 
                    className={`flex items-center justify-between p-3 rounded-xl ${
                      record.status === 'present' ? 'bg-green-50' :
                      record.status === 'leave' ? 'bg-orange-50' : 'bg-red-50'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="text-center min-w-[40px]">
                        <p className="text-[10px] text-gray-500">{date.toLocaleDateString('en-US', { weekday: 'short' })}</p>
                        <p className="text-lg font-bold text-gray-800">{date.getDate()}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-800">
                          {record.punch_in || '-'} - {record.punch_out || '-'}
                        </p>
                        {record.location && (
                          <p className="text-[10px] text-gray-500 flex items-center gap-1">
                            <MapPin size={10} /> {record.location}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      {record.conveyance_amount > 0 && (
                        <p className="text-sm font-semibold text-green-600">₹{record.conveyance_amount}</p>
                      )}
                      <p className="text-[10px] text-gray-500">{record.work_hours?.toFixed(1) || 0}h</p>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </CardContent>
      </Card>

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

      {/* QR Scanner Dialog */}
      <Dialog open={showQRScanner} onOpenChange={closeScanner}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Camera size={20} />
              Scan QR Code to Punch In
            </DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <div id="qr-reader" className="w-full rounded-lg overflow-hidden"></div>
            <p className="text-gray-500 text-xs text-center mt-3">
              Point your camera at the QR code generated by your Team Leader
            </p>
          </div>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={closeScanner}
              className="w-full"
            >
              <X size={16} className="mr-2" /> Cancel
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
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
  const pendingBills = 1; // Pending bill submissions count

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
              <p className="text-lg font-bold text-gray-800">{Math.max(0, teamMembers.length - 1)}</p>
              <p className="text-[10px] text-gray-500">Present</p>
            </div>
            <div className="text-center p-3 bg-orange-50 rounded-xl">
              <UserX size={20} className="mx-auto text-orange-600 mb-1" />
              <p className="text-lg font-bold text-gray-800">{Math.min(1, teamMembers.length)}</p>
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
                <span className="bg-blue-500 text-white text-xs px-2 py-0.5 rounded-full font-bold">{pendingBills}</span>
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
            {holidays
              .filter(h => new Date(h.date) >= new Date())
              .sort((a, b) => new Date(a.date) - new Date(b.date))
              .slice(0, 3)
              .map((holiday) => (
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

// Admin Dashboard - Desktop Focused
const AdminDashboard = ({ user }) => {
  const navigate = useNavigate();
  const activeEmployees = users.filter(u => u.role !== 'admin' && u.status === 'active');
  const presentToday = 5;
  const onLeave = 1;
  const pendingLeaves = leaveRequests.filter(l => l.status === 'pending').length;
  const pendingBills = 1; // Pending bill submissions count

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
