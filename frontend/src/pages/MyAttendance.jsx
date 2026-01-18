import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { attendanceAPI } from '../services/api';
import { Card, CardContent } from '../components/ui/card';
import { Button } from '../components/ui/button';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose
} from '../components/ui/dialog';
import { Html5QrcodeScanner } from 'html5-qrcode';
import {
  Calendar, Clock, LogIn, LogOut, QrCode, MapPin, IndianRupee,
  ChevronLeft, ChevronRight, Camera, X, CheckCircle
} from 'lucide-react';

const MyAttendance = () => {
  const { user } = useAuth();
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [isPunchedIn, setIsPunchedIn] = useState(false);
  const [punchInTime, setPunchInTime] = useState(null);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [showQRScanner, setShowQRScanner] = useState(false);
  const [todayAttendance, setTodayAttendance] = useState(null);
  const [monthlyAttendance, setMonthlyAttendance] = useState([]);
  const [loading, setLoading] = useState(true);
  const [scannerError, setScannerError] = useState(null);
  const scannerRef = useRef(null);

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    loadAttendanceData();
  }, [user?.id, currentMonth]);

  useEffect(() => {
    if (showQRScanner) {
      initScanner();
    }
    return () => {
      if (scannerRef.current) {
        scannerRef.current.clear().catch(() => {});
      }
    };
  }, [showQRScanner]);

  const loadAttendanceData = async () => {
    if (!user?.id) return;
    
    setLoading(true);
    try {
      const today = new Date().toISOString().split('T')[0];
      const month = currentMonth.getMonth() + 1;
      const year = currentMonth.getFullYear();

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
      const monthlyData = await attendanceAPI.getMonthly(user.id, month, year);
      setMonthlyAttendance(monthlyData);
    } catch (error) {
      console.error('Error loading attendance:', error);
    } finally {
      setLoading(false);
    }
  };

  const initScanner = () => {
    setScannerError(null);
    setTimeout(() => {
      const scanner = new Html5QrcodeScanner('qr-reader', {
        fps: 10,
        qrbox: { width: 250, height: 250 },
        aspectRatio: 1.0,
        rememberLastUsedCamera: true,
        supportedScanTypes: [0] // Camera only
      });

      scanner.render(
        async (decodedText) => {
          // Success callback
          scanner.clear();
          await handleQRScanned(decodedText);
        },
        (error) => {
          // Error callback - ignore scan errors
        }
      );

      scannerRef.current = scanner;
    }, 100);
  };

  const handleQRScanned = async (qrData) => {
    setShowQRScanner(false);
    
    try {
      const result = await attendanceAPI.punchIn(user.id, qrData);
      setTodayAttendance(result);
      setIsPunchedIn(true);
      
      const [h, m] = result.punch_in.split(':');
      const punchTime = new Date();
      punchTime.setHours(parseInt(h), parseInt(m), 0);
      setPunchInTime(punchTime);
      
      await loadAttendanceData();
    } catch (error) {
      alert(error.message || 'Failed to punch in');
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
      return record.status;
    }
    return 'absent';
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
        <p className="text-sm text-gray-500">Track your daily attendance</p>
      </div>

      {/* Punch Card */}
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
            <div className="mb-3 p-3 bg-white/10 rounded-xl">
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
            className={`w-full h-12 text-base font-bold rounded-xl ${
              isPunchedIn ? 'bg-red-500 hover:bg-red-600' : 'bg-green-500 hover:bg-green-600'
            }`}
          >
            {isPunchedIn ? (
              <><LogOut size={20} className="mr-2" /> Punch Out</>
            ) : (
              <><QrCode size={20} className="mr-2" /> Scan QR & Punch In</>
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
            {monthlyAttendance.length === 0 && (
              <p className="text-center text-gray-500 py-4">No attendance records for this month</p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* QR Scanner Dialog */}
      <Dialog open={showQRScanner} onOpenChange={setShowQRScanner}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Camera size={20} />
              Scan QR Code to Punch In
            </DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <div id="qr-reader" className="w-full"></div>
            {scannerError && (
              <p className="text-red-500 text-sm text-center mt-2">{scannerError}</p>
            )}
            <p className="text-gray-500 text-xs text-center mt-3">
              Point your camera at the QR code generated by your Team Leader
            </p>
          </div>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setShowQRScanner(false)}
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

export default MyAttendance;
