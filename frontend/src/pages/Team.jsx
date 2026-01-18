import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { usersAPI, qrCodeAPI } from '../services/api';
import { Card, CardContent } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose
} from '../components/ui/dialog';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from '../components/ui/select';
import { QRCodeSVG } from 'qrcode.react';
import { Users, UserCheck, UserX, Phone, Mail, ChevronRight, QrCode, MapPin, IndianRupee, Download, Copy, Check, Sun, Moon, Clock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

const Team = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [teamMembers, setTeamMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showQRDialog, setShowQRDialog] = useState(false);
  const [qrGenerated, setQrGenerated] = useState(null);
  const [qrCopied, setQrCopied] = useState(false);
  const [generatingQR, setGeneratingQR] = useState(false);
  
  const today = new Date().toISOString().split('T')[0];
  const [qrForm, setQrForm] = useState({
    location: '',
    conveyance_amount: '',
    date: today,
    shift_type: 'day',
    shift_start: '10:00',
    shift_end: '19:00'
  });

  // Preset shifts
  const shiftPresets = {
    day: { start: '10:00', end: '19:00', label: 'Day Shift (10:00 AM - 7:00 PM)' },
    night: { start: '21:00', end: '06:00', label: 'Night Shift (9:00 PM - 6:00 AM)' }
  };

  useEffect(() => {
    loadTeamMembers();
  }, [user?.id]);

  const handleShiftChange = (shiftType) => {
    const preset = shiftPresets[shiftType];
    setQrForm({
      ...qrForm,
      shift_type: shiftType,
      shift_start: preset.start,
      shift_end: preset.end
    });
  };

  useEffect(() => {
    loadTeamMembers();
  }, [user?.id]);

  const loadTeamMembers = async () => {
    if (!user?.id) return;
    
    setLoading(true);
    try {
      const members = await usersAPI.getTeamMembers(user.id);
      setTeamMembers(members);
    } catch (error) {
      console.error('Error loading team members:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateQR = async () => {
    if (!qrForm.location || !qrForm.conveyance_amount) {
      toast.error('Please fill location and conveyance amount');
      return;
    }
    
    setGeneratingQR(true);
    try {
      const result = await qrCodeAPI.create({
        location: qrForm.location,
        conveyance_amount: parseFloat(qrForm.conveyance_amount),
        date: qrForm.date,
        created_by: user.id,
        shift_type: qrForm.shift_type,
        shift_start: qrForm.shift_start,
        shift_end: qrForm.shift_end
      });
      
      setQrGenerated(result);
      toast.success('QR Code generated successfully!');
    } catch (error) {
      alert(error.message || 'Failed to generate QR code');
    } finally {
      setGeneratingQR(false);
    }
  };

  const copyQRData = () => {
    if (qrGenerated?.qr_data) {
      navigator.clipboard.writeText(qrGenerated.qr_data);
      setQrCopied(true);
      setTimeout(() => setQrCopied(false), 2000);
    }
  };

  const downloadQR = () => {
    const svg = document.getElementById('qr-code-svg');
    if (!svg) return;
    
    const svgData = new XMLSerializer().serializeToString(svg);
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();
    
    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;
      ctx.fillStyle = 'white';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0);
      
      const link = document.createElement('a');
      link.download = `QR_${qrForm.location}_${qrForm.date}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
    };
    
    img.src = 'data:image/svg+xml;base64,' + btoa(svgData);
  };

  const resetQRDialog = () => {
    setShowQRDialog(false);
    setQrGenerated(null);
    setQrForm({
      location: '',
      conveyance_amount: '',
      date: today,
      shift_type: 'day',
      shift_start: '10:00',
      shift_end: '19:00'
    });
  };

  const presentCount = teamMembers.length - 1; // Mock for now
  const absentCount = 1;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl lg:text-2xl font-bold text-gray-800">My Team</h1>
          <p className="text-sm text-gray-500">{user.department} Department</p>
        </div>
        <Button 
          onClick={() => setShowQRDialog(true)}
          className="bg-[#1E2A5E] hover:bg-[#2D3A8C]"
          data-testid="generate-qr-btn"
        >
          <QrCode size={18} className="mr-2" /> Generate QR
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        <Card>
          <CardContent className="p-3 text-center">
            <div className="w-10 h-10 mx-auto mb-2 bg-blue-100 rounded-xl flex items-center justify-center">
              <Users size={20} className="text-blue-600" />
            </div>
            <p className="text-xl font-bold text-gray-800">{teamMembers.length}</p>
            <p className="text-[10px] text-gray-500">Total Members</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 text-center">
            <div className="w-10 h-10 mx-auto mb-2 bg-green-100 rounded-xl flex items-center justify-center">
              <UserCheck size={20} className="text-green-600" />
            </div>
            <p className="text-xl font-bold text-green-600">{presentCount}</p>
            <p className="text-[10px] text-gray-500">Present</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 text-center">
            <div className="w-10 h-10 mx-auto mb-2 bg-red-100 rounded-xl flex items-center justify-center">
              <UserX size={20} className="text-red-600" />
            </div>
            <p className="text-xl font-bold text-red-600">{absentCount}</p>
            <p className="text-[10px] text-gray-500">Absent</p>
          </CardContent>
        </Card>
      </div>

      {/* Team Members List */}
      <Card>
        <CardContent className="p-4">
          <h3 className="font-semibold text-gray-800 mb-3">Team Members</h3>
          {loading ? (
            <div className="text-center py-8 text-gray-500">Loading...</div>
          ) : teamMembers.length === 0 ? (
            <div className="text-center py-8 text-gray-500">No team members assigned</div>
          ) : (
            <div className="space-y-3">
              {teamMembers.map((member) => (
                <div key={member.id} className="p-3 bg-gray-50 rounded-xl">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white font-bold">
                        {member.name?.split(' ').map(n => n[0]).join('')}
                      </div>
                      <div>
                        <p className="font-semibold text-gray-800">{member.name}</p>
                        <p className="text-xs text-gray-500">{member.designation}</p>
                      </div>
                    </div>
                    <span className="text-xs px-2 py-1 rounded-full bg-green-100 text-green-700 font-medium">
                      Active
                    </span>
                  </div>
                  <div className="flex items-center gap-4 text-xs text-gray-500 pl-15">
                    <a href={`tel:${member.phone}`} className="flex items-center gap-1 hover:text-[#1E2A5E]">
                      <Phone size={12} /> {member.phone}
                    </a>
                    <a href={`mailto:${member.email}`} className="flex items-center gap-1 hover:text-[#1E2A5E]">
                      <Mail size={12} /> Email
                    </a>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <Card>
        <CardContent className="p-4">
          <h3 className="font-semibold text-gray-800 mb-3">Quick Actions</h3>
          <div className="space-y-2">
            <button
              onClick={() => navigate('/team-attendance')}
              className="w-full flex items-center justify-between p-3 bg-blue-50 rounded-xl hover:bg-blue-100 transition-colors"
            >
              <span className="font-medium text-blue-700">View Team Attendance</span>
              <ChevronRight size={18} className="text-blue-500" />
            </button>
            <button
              onClick={() => navigate('/leaves')}
              className="w-full flex items-center justify-between p-3 bg-orange-50 rounded-xl hover:bg-orange-100 transition-colors"
            >
              <span className="font-medium text-orange-700">Manage Leave Requests</span>
              <ChevronRight size={18} className="text-orange-500" />
            </button>
            <button
              onClick={() => navigate('/bills')}
              className="w-full flex items-center justify-between p-3 bg-purple-50 rounded-xl hover:bg-purple-100 transition-colors"
            >
              <span className="font-medium text-purple-700">Review Bill Submissions</span>
              <ChevronRight size={18} className="text-purple-500" />
            </button>
          </div>
        </CardContent>
      </Card>

      {/* QR Code Generation Dialog */}
      <Dialog open={showQRDialog} onOpenChange={resetQRDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <QrCode size={20} />
              Generate Attendance QR Code
            </DialogTitle>
          </DialogHeader>
          
          {!qrGenerated ? (
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Date</Label>
                <Input
                  type="date"
                  value={qrForm.date}
                  onChange={(e) => setQrForm({...qrForm, date: e.target.value})}
                />
              </div>
              
              {/* Shift Selection */}
              <div className="space-y-2">
                <Label>Shift Type</Label>
                <Select value={qrForm.shift_type} onValueChange={handleShiftChange}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select shift" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="day">
                      <div className="flex items-center gap-2">
                        <Sun size={16} className="text-yellow-500" />
                        Day Shift (10:00 AM - 7:00 PM)
                      </div>
                    </SelectItem>
                    <SelectItem value="night">
                      <div className="flex items-center gap-2">
                        <Moon size={16} className="text-blue-500" />
                        Night Shift (9:00 PM - 6:00 AM)
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              {/* Custom Shift Timing */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label className="flex items-center gap-1">
                    <Clock size={14} /> Shift Start
                  </Label>
                  <Input
                    type="time"
                    value={qrForm.shift_start}
                    onChange={(e) => setQrForm({...qrForm, shift_start: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <Label className="flex items-center gap-1">
                    <Clock size={14} /> Shift End
                  </Label>
                  <Input
                    type="time"
                    value={qrForm.shift_end}
                    onChange={(e) => setQrForm({...qrForm, shift_end: e.target.value})}
                  />
                </div>
              </div>
              
              {/* Attendance Rules Info */}
              <div className="bg-blue-50 rounded-lg p-3 text-xs text-blue-800">
                <p className="font-semibold mb-1">Attendance Rules:</p>
                <ul className="list-disc list-inside space-y-1">
                  <li>On time (within 30 min) → <span className="text-green-600 font-medium">Full Day</span></li>
                  <li>Late (30 min - 3 hours) → <span className="text-yellow-600 font-medium">Half Day</span></li>
                  <li>Very Late (after 3 hours) → <span className="text-red-600 font-medium">Absent</span></li>
                </ul>
              </div>
              
              <div className="space-y-2">
                <Label>Location</Label>
                <Input
                  placeholder="e.g., Client Site A, Office Building B"
                  value={qrForm.location}
                  onChange={(e) => setQrForm({...qrForm, location: e.target.value})}
                />
                <p className="text-xs text-gray-500">
                  Enter the work location for today's attendance
                </p>
              </div>
              <div className="space-y-2">
                <Label>Conveyance Amount (₹)</Label>
                <Input
                  type="number"
                  placeholder="0"
                  value={qrForm.conveyance_amount}
                  onChange={(e) => setQrForm({...qrForm, conveyance_amount: e.target.value})}
                />
                <p className="text-xs text-gray-500">
                  Full amount for Full Day, half for Half Day
                </p>
              </div>
              
              <DialogFooter>
                <DialogClose asChild>
                  <Button variant="outline">Cancel</Button>
                </DialogClose>
                <Button 
                  onClick={handleGenerateQR} 
                  className="bg-[#1E2A5E] hover:bg-[#2D3A8C]"
                  disabled={generatingQR}
                >
                  {generatingQR ? 'Generating...' : 'Generate QR'}
                </Button>
              </DialogFooter>
            </div>
          ) : (
            <div className="space-y-4 py-4">
              {/* QR Code Display */}
              <div className="flex flex-col items-center">
                <div className="p-4 bg-white border-2 border-gray-200 rounded-xl">
                  <QRCodeSVG 
                    id="qr-code-svg"
                    value={qrGenerated.qr_data}
                    size={200}
                    level="H"
                    includeMargin={true}
                  />
                </div>
              </div>
              
              {/* QR Details */}
              <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-500">Date</span>
                  <span className="font-medium">{qrGenerated.date}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-500 flex items-center gap-1">
                    {qrGenerated.shift_type === 'day' ? <Sun size={14} className="text-yellow-500" /> : <Moon size={14} className="text-blue-500" />}
                    Shift
                  </span>
                  <span className="font-medium capitalize">
                    {qrGenerated.shift_type} ({qrGenerated.shift_start} - {qrGenerated.shift_end})
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-500 flex items-center gap-1">
                    <MapPin size={14} /> Location
                  </span>
                  <span className="font-medium">{qrGenerated.location}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-500 flex items-center gap-1">
                    <IndianRupee size={14} /> Conveyance
                  </span>
                  <span className="font-medium text-green-600">₹{qrGenerated.conveyance_amount}</span>
                </div>
              </div>
              
              {/* Action Buttons */}
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  className="flex-1"
                  onClick={copyQRData}
                >
                  {qrCopied ? (
                    <><Check size={16} className="mr-2" /> Copied!</>
                  ) : (
                    <><Copy size={16} className="mr-2" /> Copy Data</>
                  )}
                </Button>
                <Button 
                  className="flex-1 bg-[#1E2A5E] hover:bg-[#2D3A8C]"
                  onClick={downloadQR}
                >
                  <Download size={16} className="mr-2" /> Download
                </Button>
              </div>
              
              <p className="text-xs text-gray-500 text-center">
                Share this QR code with your team members for attendance marking
              </p>
              
              <DialogFooter>
                <Button variant="outline" onClick={resetQRDialog}>
                  Close
                </Button>
                <Button 
                  onClick={() => {
                    setQrGenerated(null);
                    setQrForm({ ...qrForm, location: '', conveyance_amount: '' });
                  }}
                  className="bg-[#1E2A5E] hover:bg-[#2D3A8C]"
                >
                  Generate Another
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Team;
