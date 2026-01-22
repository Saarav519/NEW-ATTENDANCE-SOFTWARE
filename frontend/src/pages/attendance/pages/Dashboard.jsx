import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { attendanceAPI, leaveAPI, holidayAPI, usersAPI, billAPI } from '../services/api';
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
import toast from 'react-hot-toast';

// Employee Dashboard - Mobile First with QR Punch In & Attendance Details
const EmployeeDashboard = ({ user }) => {
  const [isPunchedIn, setIsPunchedIn] = useState(false);
  const [punchInTime, setPunchInTime] = useState(null);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [showQRScanner, setShowQRScanner] = useState(false);
  const [todayAttendance, setTodayAttendance] = useState(null);
  const [monthlyAttendance, setMonthlyAttendance] = useState([]);
  const [holidays, setHolidays] = useState([]);
  const [myLeaves, setMyLeaves] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isProcessingQR, setIsProcessingQR] = useState(false);
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
    loadHolidaysAndLeaves();
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

  const loadHolidaysAndLeaves = async () => {
    try {
      const [holidaysData, leavesData] = await Promise.all([
        holidayAPI.getAll(),
        leaveAPI.getAll(user?.id)
      ]);
      setHolidays(holidaysData || []);
      setMyLeaves(leavesData || []);
    } catch (error) {
      console.error('Error loading holidays/leaves:', error);
    }
  };

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
        
        // Configure camera with higher resolution for better QR scanning
        const cameraConfig = {
          facingMode: "environment",
          // Request higher resolution for clearer image
          advanced: [
            { width: { min: 1280, ideal: 1920, max: 2560 } },
            { height: { min: 720, ideal: 1080, max: 1440 } },
            { focusMode: "continuous" },
            { exposureMode: "continuous" }
          ]
        };
        
        await html5QrCode.start(
          cameraConfig,
          {
            fps: 15, // Increased FPS for better scanning
            qrbox: { width: 280, height: 280 }, // Slightly larger scan area
            aspectRatio: 1.0,
            disableFlip: false,
            // Higher resolution scanning
            experimentalFeatures: {
              useBarCodeDetectorIfSupported: true
            }
          },
          async (decodedText) => {
            // Prevent duplicate processing
            if (isProcessingQR) return;
            setIsProcessingQR(true);
            
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
            setIsProcessingQR(false);
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
        // Fallback to basic camera config if advanced fails
        try {
          const html5QrCode = new Html5Qrcode("qr-reader");
          scannerRef.current = html5QrCode;
          await html5QrCode.start(
            { facingMode: "environment" },
            { fps: 15, qrbox: { width: 280, height: 280 }, aspectRatio: 1.0 },
            async (decodedText) => {
              if (isProcessingQR) return;
              setIsProcessingQR(true);
              if (isScannerRunning.current) {
                isScannerRunning.current = false;
                try { await html5QrCode.stop(); } catch (e) {}
              }
              await handleQRScanned(decodedText);
              setIsProcessingQR(false);
            },
            () => {}
          );
          isScannerRunning.current = true;
        } catch (fallbackErr) {
          console.error('Fallback scanner error:', fallbackErr);
          toast.error('Unable to access camera. Please check permissions.');
        }
      }
    }, 100);
  };

  const handleQRScanned = async (qrData) => {
    try {
      console.log('QR Data scanned:', qrData);
      
      // Validate QR data is proper JSON
      let parsedQR;
      try {
        parsedQR = JSON.parse(qrData);
      } catch (e) {
        setShowQRScanner(false);
        setIsProcessingQR(false);
        toast.error('Invalid QR Code format. Please scan a valid attendance QR code.');
        return;
      }
      
      const result = await attendanceAPI.punchIn(user.id, qrData);
      console.log('Punch-in result:', result);
      
      // Close scanner first
      setShowQRScanner(false);
      setIsProcessingQR(false);
      
      if (result && result.punch_in) {
        setTodayAttendance(result);
        setIsPunchedIn(true);
        
        const [h, m] = result.punch_in.split(':');
        const punchTime = new Date();
        punchTime.setHours(parseInt(h), parseInt(m), 0);
        setPunchInTime(punchTime);
        
        // Show success toast with attendance status
        const statusMsg = result.attendance_status === 'full_day' ? '✅ Full Day' :
                         result.attendance_status === 'half_day' ? '⚠️ Half Day' : '❌ Marked Absent';
        toast.success(`Punched in at ${result.punch_in}! ${statusMsg}`, { duration: 4000 });
        
        await loadAttendanceData();
      } else {
        toast.error('Punch-in failed: No response from server');
      }
    } catch (error) {
      console.error('Punch-in error:', error);
      setShowQRScanner(false);
      setIsProcessingQR(false);
      toast.error(error.message || 'Failed to punch in. Please try again.');
    }
  };

  const handlePunchOut = async () => {
    try {
      const today = new Date().toISOString().split('T')[0];
      const result = await attendanceAPI.punchOut(user.id, today);
      setTodayAttendance(result);
      setIsPunchedIn(false);
      toast.success(`Punched out! Work hours: ${result.work_hours?.toFixed(1)}h`);
      await loadAttendanceData();
    } catch (error) {
      toast.error(error.message || 'Failed to punch out');
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

  const pendingLeaves = myLeaves.filter(l => l.status === 'pending').length;

  // Calculate stats
  const presentDays = monthlyAttendance.filter(a => a.status === 'present' || a.attendance_status === 'full_day').length;
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
        <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => navigate('/attendance/my-attendance')}>
          <CardContent className="p-3 text-center">
            <div className="w-10 h-10 mx-auto mb-2 bg-blue-100 rounded-xl flex items-center justify-center">
              <Calendar size={20} className="text-blue-600" />
            </div>
            <p className="text-lg font-bold text-gray-800">{presentDays}</p>
            <p className="text-[10px] text-gray-500">Present Days</p>
          </CardContent>
        </Card>
        <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => navigate('/attendance/leaves')}>
          <CardContent className="p-3 text-center">
            <div className="w-10 h-10 mx-auto mb-2 bg-orange-100 rounded-xl flex items-center justify-center">
              <CalendarOff size={20} className="text-orange-600" />
            </div>
            <p className="text-lg font-bold text-gray-800">{pendingLeaves}</p>
            <p className="text-[10px] text-gray-500">Pending Leaves</p>
          </CardContent>
        </Card>
        <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => navigate('/attendance/bills')}>
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
            <button onClick={() => navigate('/attendance/attendance-details')} className="text-xs text-[#1E2A5E] flex items-center">
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
            <button onClick={() => navigate('/attendance/holidays')} className="text-xs text-[#1E2A5E] flex items-center">
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
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Camera size={20} />
              {isProcessingQR ? 'Processing...' : 'Scan QR Code to Punch In'}
            </DialogTitle>
          </DialogHeader>
          <div className="py-4">
            {isProcessingQR ? (
              <div className="flex flex-col items-center justify-center py-8">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#1E2A5E]"></div>
                <p className="text-gray-600 mt-4">Recording your attendance...</p>
              </div>
            ) : (
              <>
                <div 
                  id="qr-reader" 
                  className="w-full rounded-lg overflow-hidden bg-black"
                  style={{ 
                    minHeight: '320px',
                    // Ensure video element fills the container properly
                  }}
                ></div>
                <style>{`
                  #qr-reader video {
                    width: 100% !important;
                    height: auto !important;
                    object-fit: cover !important;
                    border-radius: 8px;
                  }
                  #qr-reader__scan_region {
                    background: transparent !important;
                  }
                  #qr-reader__dashboard {
                    display: none !important;
                  }
                `}</style>
                <p className="text-gray-500 text-xs text-center mt-3">
                  Point your camera at the QR code generated by your Team Leader
                </p>
                <p className="text-blue-600 text-xs text-center mt-1">
                  📱 Hold steady for best results
                </p>
              </>
            )}
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
  const [teamMembers, setTeamMembers] = useState([]);
  const [pendingLeaves, setPendingLeaves] = useState(0);
  const [pendingBills, setPendingBills] = useState(0);
  const [holidays, setHolidays] = useState([]);
  const [todayAttendance, setTodayAttendance] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showPunchDialog, setShowPunchDialog] = useState(false);
  const [punchForm, setPunchForm] = useState({
    location: 'Office',
    shift_type: 'day',
    shift_start: '10:00',
    shift_end: '19:00',
    conveyance: 200
  });
  const navigate = useNavigate();

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    loadTeamData();
  }, [user?.id]);

  const loadTeamData = async () => {
    setLoading(true);
    try {
      const today = new Date().toISOString().split('T')[0];
      
      const [members, leaves, holidaysData, billsData, todayData] = await Promise.all([
        usersAPI.getTeamMembers(user.id),
        leaveAPI.getAll(),
        holidayAPI.getAll(),
        billAPI.getAll(),
        attendanceAPI.getAll(user.id, today)
      ]);
      
      setTeamMembers(members || []);
      setHolidays(holidaysData || []);
      
      // Check if already punched in today
      if (todayData && todayData.length > 0) {
        setTodayAttendance(todayData[0]);
        setIsPunchedIn(todayData[0].punch_in && !todayData[0].punch_out);
        if (todayData[0].punch_in) {
          const [h, m] = todayData[0].punch_in.split(':');
          const punchTime = new Date();
          punchTime.setHours(parseInt(h), parseInt(m), 0);
          setPunchInTime(punchTime);
        }
      }
      
      // Count pending items for team members
      const teamMemberIds = (members || []).map(m => m.id);
      const teamPendingLeaves = (leaves || []).filter(l => 
        teamMemberIds.includes(l.emp_id) && l.status === 'pending'
      ).length;
      const teamPendingBills = (billsData || []).filter(b => 
        teamMemberIds.includes(b.emp_id) && b.status === 'pending'
      ).length;
      
      setPendingLeaves(teamPendingLeaves);
      setPendingBills(teamPendingBills);
    } catch (error) {
      console.error('Error loading team data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDirectPunchIn = async () => {
    try {
      const result = await attendanceAPI.directPunchIn(
        user.id,
        punchForm.location,
        punchForm.shift_type,
        punchForm.shift_start,
        punchForm.shift_end,
        punchForm.conveyance
      );
      
      setTodayAttendance(result);
      setIsPunchedIn(true);
      
      const [h, m] = result.punch_in.split(':');
      const punchTime = new Date();
      punchTime.setHours(parseInt(h), parseInt(m), 0);
      setPunchInTime(punchTime);
      
      const statusMsg = result.attendance_status === 'full_day' ? '✅ Full Day' :
                       result.attendance_status === 'half_day' ? '⚠️ Half Day' : '❌ Marked Absent';
      toast.success(`Punched in at ${result.punch_in}! ${statusMsg}`, { duration: 4000 });
      setShowPunchDialog(false);
    } catch (error) {
      toast.error(error.message || 'Failed to punch in');
    }
  };

  const handlePunchOut = async () => {
    try {
      const today = new Date().toISOString().split('T')[0];
      const result = await attendanceAPI.punchOut(user.id, today);
      setTodayAttendance(result);
      setIsPunchedIn(false);
      toast.success(`Punched out! Work hours: ${result.work_hours?.toFixed(1)}h`);
    } catch (error) {
      toast.error(error.message || 'Failed to punch out');
    }
  };

  const upcomingHolidays = holidays
    .filter(h => new Date(h.date) >= new Date())
    .sort((a, b) => new Date(a.date) - new Date(b.date))
    .slice(0, 3);

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
              {todayAttendance && (
                <span className={`text-xs px-2 py-0.5 rounded-full mt-1 inline-block ${
                  todayAttendance.attendance_status === 'full_day' ? 'bg-green-500' :
                  todayAttendance.attendance_status === 'half_day' ? 'bg-yellow-500' : 'bg-red-500'
                }`}>
                  {todayAttendance.attendance_status?.replace('_', ' ').toUpperCase()}
                </span>
              )}
            </div>
            {!isPunchedIn ? (
              <Button
                onClick={() => setShowPunchDialog(true)}
                size="sm"
                className="bg-green-500 hover:bg-green-600"
              >
                <LogIn size={16} className="mr-1" /> Punch In
              </Button>
            ) : (
              <Button
                onClick={handlePunchOut}
                size="sm"
                className="bg-red-500 hover:bg-red-600"
              >
                <LogOut size={16} className="mr-1" /> Punch Out
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Punch In Dialog */}
      <Dialog open={showPunchDialog} onOpenChange={setShowPunchDialog}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <LogIn size={20} />
              Punch In - Select Shift
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Location</label>
              <input
                type="text"
                className="w-full px-3 py-2 border rounded-lg"
                value={punchForm.location}
                onChange={(e) => setPunchForm({...punchForm, location: e.target.value})}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Shift Type</label>
              <select
                className="w-full px-3 py-2 border rounded-lg"
                value={punchForm.shift_type}
                onChange={(e) => {
                  const type = e.target.value;
                  setPunchForm({
                    ...punchForm,
                    shift_type: type,
                    shift_start: type === 'day' ? '10:00' : '21:00',
                    shift_end: type === 'day' ? '19:00' : '06:00'
                  });
                }}
              >
                <option value="day">Day Shift (10 AM - 7 PM)</option>
                <option value="night">Night Shift (9 PM - 6 AM)</option>
              </select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <label className="text-sm font-medium">Shift Start</label>
                <input
                  type="time"
                  className="w-full px-3 py-2 border rounded-lg"
                  value={punchForm.shift_start}
                  onChange={(e) => setPunchForm({...punchForm, shift_start: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Shift End</label>
                <input
                  type="time"
                  className="w-full px-3 py-2 border rounded-lg"
                  value={punchForm.shift_end}
                  onChange={(e) => setPunchForm({...punchForm, shift_end: e.target.value})}
                />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Conveyance (₹)</label>
              <input
                type="number"
                className="w-full px-3 py-2 border rounded-lg"
                value={punchForm.conveyance}
                onChange={(e) => setPunchForm({...punchForm, conveyance: parseFloat(e.target.value) || 0})}
              />
            </div>
            <div className="bg-blue-50 rounded-lg p-3 text-xs text-blue-800">
              <p className="font-semibold mb-1">Attendance Rules:</p>
              <ul className="list-disc list-inside space-y-1">
                <li>On time (within 30 min) → <span className="text-green-600 font-medium">Full Day</span></li>
                <li>Late (30 min - 3 hours) → <span className="text-yellow-600 font-medium">Half Day</span></li>
                <li>Very Late (&gt;3 hours) → <span className="text-red-600 font-medium">Absent</span></li>
              </ul>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowPunchDialog(false)}>Cancel</Button>
            <Button onClick={handleDirectPunchIn} className="bg-green-600 hover:bg-green-700">
              <LogIn size={16} className="mr-2" /> Punch In Now
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Team Overview */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-gray-800">My Team</h3>
            <button onClick={() => navigate('/attendance/team')} className="text-xs text-[#1E2A5E] flex items-center">
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
              onClick={() => navigate('/attendance/leaves')}
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
              onClick={() => navigate('/attendance/bills')}
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
            <button onClick={() => navigate('/attendance/holidays')} className="text-xs text-[#1E2A5E] flex items-center">
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
  const [employees, setEmployees] = useState([]);
  const [stats, setStats] = useState({
    totalEmployees: 0,
    presentToday: 0,
    onLeave: 0,
    pendingLeaves: 0,
    pendingBills: 0
  });

  const loadDashboardStats = async () => {
    try {
      const [usersData, leavesData, billsData] = await Promise.all([
        usersAPI.getAll(),
        leaveAPI.getAll(),
        billAPI.getAll()
      ]);
      
      const activeEmployees = (usersData || []).filter(u => u.role !== 'admin' && u.status === 'active');
      setEmployees(activeEmployees);
      
      const pendingLeaves = (leavesData || []).filter(l => l.status === 'pending').length;
      const approvedLeavesToday = (leavesData || []).filter(l => {
        const today = new Date().toISOString().split('T')[0];
        return l.status === 'approved' && l.from_date <= today && l.to_date >= today;
      }).length;
      const pendingBills = (billsData || []).filter(b => b.status === 'pending').length;
      
      setStats({
        totalEmployees: activeEmployees.length,
        presentToday: Math.max(0, activeEmployees.length - approvedLeavesToday),
        onLeave: approvedLeavesToday,
        pendingLeaves,
        pendingBills
      });
    } catch (error) {
      console.error('Error loading dashboard stats:', error);
    }
  };

  useEffect(() => {
    loadDashboardStats();
  }, []);

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
        <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => navigate('/attendance/employees')}>
          <CardContent className="p-4 lg:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Total Staff</p>
                <p className="text-2xl lg:text-3xl font-bold text-gray-800">{stats.totalEmployees}</p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                <Users size={24} className="text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => navigate('/attendance/attendance')}>
          <CardContent className="p-4 lg:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Present Today</p>
                <p className="text-2xl lg:text-3xl font-bold text-green-600">{stats.presentToday}</p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                <UserCheck size={24} className="text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => navigate('/attendance/leaves')}>
          <CardContent className="p-4 lg:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">On Leave</p>
                <p className="text-2xl lg:text-3xl font-bold text-orange-600">{stats.onLeave}</p>
              </div>
              <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center">
                <CalendarOff size={24} className="text-orange-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => navigate('/attendance/leaves')}>
          <CardContent className="p-4 lg:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Pending Leaves</p>
                <p className="text-2xl lg:text-3xl font-bold text-red-600">{stats.pendingLeaves}</p>
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
              <h3 className="text-lg font-semibold">Today&apos;s Attendance</h3>
              <button onClick={() => navigate('/attendance/attendance')} className="text-sm text-[#1E2A5E] flex items-center">
                View All <ArrowRight size={14} className="ml-1" />
              </button>
            </div>
            <div className="space-y-3">
              {employees.slice(0, 5).map((emp) => (
                <div key={emp.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white font-bold text-sm">
                      {emp.name?.split(' ').map(n => n[0]).join('') || 'U'}
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
              {employees.length === 0 && (
                <p className="text-gray-500 text-center py-4">No employees found</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Pending Approvals */}
        <Card>
          <CardContent className="p-4 lg:p-6">
            <h3 className="text-lg font-semibold mb-4">Pending Approvals</h3>
            <div className="space-y-3">
              <div 
                onClick={() => navigate('/attendance/leaves')}
                className="flex items-center justify-between p-4 bg-yellow-50 rounded-xl cursor-pointer hover:bg-yellow-100 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-yellow-100 rounded-xl flex items-center justify-center">
                    <CalendarOff size={20} className="text-yellow-600" />
                  </div>
                  <span className="font-medium">Leave Requests</span>
                </div>
                <span className="bg-yellow-500 text-white text-sm px-3 py-1 rounded-full font-bold">{stats.pendingLeaves}</span>
              </div>
              <div 
                onClick={() => navigate('/attendance/bills')}
                className="flex items-center justify-between p-4 bg-blue-50 rounded-xl cursor-pointer hover:bg-blue-100 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
                    <Receipt size={20} className="text-blue-600" />
                  </div>
                  <span className="font-medium">Bill Submissions</span>
                </div>
                <span className="bg-blue-500 text-white text-sm px-3 py-1 rounded-full font-bold">{stats.pendingBills}</span>
              </div>
              <div 
                onClick={() => navigate('/attendance/advances')}
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
