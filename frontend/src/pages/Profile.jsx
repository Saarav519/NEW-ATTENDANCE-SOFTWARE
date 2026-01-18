import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { profileAPI, leaveBalanceAPI, advanceAPI } from '../services/api';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose
} from '../components/ui/dialog';
import {
  User, Phone, Mail, MapPin, Building, Calendar, Camera, Edit2, Save, Loader2,
  CreditCard, AlertCircle, CheckCircle, Clock, IndianRupee, Briefcase
} from 'lucide-react';
import toast from 'react-hot-toast';

const Profile = () => {
  const { user, updateUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [leaveBalance, setLeaveBalance] = useState(null);
  const [advances, setAdvances] = useState([]);
  const [isEditing, setIsEditing] = useState(false);
  const [showAdvanceDialog, setShowAdvanceDialog] = useState(false);
  const [submittingAdvance, setSubmittingAdvance] = useState(false);
  const fileInputRef = useRef(null);
  
  const [profileData, setProfileData] = useState({
    phone: user?.phone || '',
    address: user?.address || '',
    emergency_contact: user?.emergency_contact || '',
    bank_account: user?.bank_account || '',
    bank_ifsc: user?.bank_ifsc || ''
  });
  
  const [advanceForm, setAdvanceForm] = useState({
    amount: '',
    reason: '',
    repayment_months: 3
  });

  useEffect(() => {
    loadData();
  }, [user?.id]);

  const loadData = async () => {
    if (!user?.id) return;
    
    try {
      const [balanceData, advancesData] = await Promise.all([
        leaveBalanceAPI.get(user.id),
        advanceAPI.getAll(user.id)
      ]);
      setLeaveBalance(balanceData);
      setAdvances(advancesData || []);
    } catch (error) {
      console.error('Error loading profile data:', error);
    }
  };

  const handlePhotoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    if (file.size > 2 * 1024 * 1024) {
      toast.error('Photo must be less than 2MB');
      return;
    }
    
    try {
      const result = await profileAPI.uploadPhoto(user.id, file);
      updateUser({ ...user, photo: result.photo });
      toast.success('Photo updated successfully!');
    } catch (error) {
      toast.error(error.message || 'Failed to upload photo');
    }
  };

  const handleSaveProfile = async () => {
    setLoading(true);
    try {
      const updatedUser = await profileAPI.update(user.id, profileData);
      updateUser({ ...user, ...updatedUser });
      setIsEditing(false);
      toast.success('Profile updated successfully!');
    } catch (error) {
      toast.error(error.message || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const handleAdvanceRequest = async () => {
    if (!advanceForm.amount || !advanceForm.reason) {
      toast.error('Please fill all fields');
      return;
    }
    
    setSubmittingAdvance(true);
    try {
      await advanceAPI.create({
        emp_id: user.id,
        emp_name: user.name,
        amount: parseFloat(advanceForm.amount),
        reason: advanceForm.reason,
        repayment_months: advanceForm.repayment_months
      });
      toast.success('Advance request submitted!');
      setShowAdvanceDialog(false);
      setAdvanceForm({ amount: '', reason: '', repayment_months: 3 });
      await loadData();
    } catch (error) {
      toast.error(error.message || 'Failed to submit advance request');
    } finally {
      setSubmittingAdvance(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-800">My Profile</h1>
        <Button
          onClick={() => isEditing ? handleSaveProfile() : setIsEditing(true)}
          className="bg-[#1E2A5E] hover:bg-[#2D3A8C]"
          disabled={loading}
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : 
           isEditing ? <Save size={16} className="mr-2" /> : <Edit2 size={16} className="mr-2" />}
          {isEditing ? 'Save Changes' : 'Edit Profile'}
        </Button>
      </div>

      {/* Profile Card */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row gap-6">
            {/* Photo */}
            <div className="flex flex-col items-center">
              <div className="relative">
                <div className="w-32 h-32 rounded-full overflow-hidden bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white text-4xl font-bold">
                  {user?.photo ? (
                    <img src={user.photo} alt={user.name} className="w-full h-full object-cover" />
                  ) : (
                    user?.name?.split(' ').map(n => n[0]).join('') || 'U'
                  )}
                </div>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="absolute bottom-0 right-0 w-10 h-10 bg-[#1E2A5E] rounded-full flex items-center justify-center text-white hover:bg-[#2D3A8C] transition-colors"
                >
                  <Camera size={18} />
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handlePhotoUpload}
                  className="hidden"
                />
              </div>
              <h2 className="text-xl font-bold mt-4">{user?.name}</h2>
              <p className="text-gray-500">{user?.designation}</p>
              <span className="mt-2 px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-medium">
                {user?.id}
              </span>
            </div>

            {/* Info Grid */}
            <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="flex items-center gap-2 text-gray-500">
                  <Mail size={14} /> Email
                </Label>
                <p className="font-medium">{user?.email}</p>
              </div>
              
              <div className="space-y-2">
                <Label className="flex items-center gap-2 text-gray-500">
                  <Phone size={14} /> Phone
                </Label>
                {isEditing ? (
                  <Input
                    value={profileData.phone}
                    onChange={(e) => setProfileData({...profileData, phone: e.target.value})}
                    placeholder="Enter phone number"
                  />
                ) : (
                  <p className="font-medium">{user?.phone || '-'}</p>
                )}
              </div>
              
              <div className="space-y-2">
                <Label className="flex items-center gap-2 text-gray-500">
                  <Building size={14} /> Department
                </Label>
                <p className="font-medium">{user?.department || '-'}</p>
              </div>
              
              <div className="space-y-2">
                <Label className="flex items-center gap-2 text-gray-500">
                  <Calendar size={14} /> Joining Date
                </Label>
                <p className="font-medium">{user?.joining_date || '-'}</p>
              </div>
              
              <div className="space-y-2 md:col-span-2">
                <Label className="flex items-center gap-2 text-gray-500">
                  <MapPin size={14} /> Address
                </Label>
                {isEditing ? (
                  <Textarea
                    value={profileData.address}
                    onChange={(e) => setProfileData({...profileData, address: e.target.value})}
                    placeholder="Enter your address"
                    rows={2}
                  />
                ) : (
                  <p className="font-medium">{user?.address || profileData.address || '-'}</p>
                )}
              </div>
              
              <div className="space-y-2">
                <Label className="flex items-center gap-2 text-gray-500">
                  <Phone size={14} /> Emergency Contact
                </Label>
                {isEditing ? (
                  <Input
                    value={profileData.emergency_contact}
                    onChange={(e) => setProfileData({...profileData, emergency_contact: e.target.value})}
                    placeholder="Emergency contact number"
                  />
                ) : (
                  <p className="font-medium">{user?.emergency_contact || profileData.emergency_contact || '-'}</p>
                )}
              </div>
              
              <div className="space-y-2">
                <Label className="flex items-center gap-2 text-gray-500">
                  <CreditCard size={14} /> Bank Account
                </Label>
                {isEditing ? (
                  <Input
                    value={profileData.bank_account}
                    onChange={(e) => setProfileData({...profileData, bank_account: e.target.value})}
                    placeholder="Bank account number"
                  />
                ) : (
                  <p className="font-medium">{user?.bank_account || profileData.bank_account || '-'}</p>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Leave Balance */}
      {leaveBalance && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar size={20} className="text-blue-600" />
              Leave Balance ({leaveBalance.year})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="p-4 bg-green-50 rounded-xl">
                <div className="flex items-center justify-between">
                  <span className="text-green-700 font-medium">Casual Leave</span>
                  <CheckCircle size={18} className="text-green-600" />
                </div>
                <p className="text-2xl font-bold text-green-700 mt-2">
                  {leaveBalance.casual_leave - leaveBalance.casual_used} / {leaveBalance.casual_leave}
                </p>
                <p className="text-xs text-green-600">Used: {leaveBalance.casual_used}</p>
              </div>
              <div className="p-4 bg-orange-50 rounded-xl">
                <div className="flex items-center justify-between">
                  <span className="text-orange-700 font-medium">Sick Leave</span>
                  <AlertCircle size={18} className="text-orange-600" />
                </div>
                <p className="text-2xl font-bold text-orange-700 mt-2">
                  {leaveBalance.sick_leave - leaveBalance.sick_used} / {leaveBalance.sick_leave}
                </p>
                <p className="text-xs text-orange-600">Used: {leaveBalance.sick_used}</p>
              </div>
              <div className="p-4 bg-blue-50 rounded-xl">
                <div className="flex items-center justify-between">
                  <span className="text-blue-700 font-medium">Vacation</span>
                  <Briefcase size={18} className="text-blue-600" />
                </div>
                <p className="text-2xl font-bold text-blue-700 mt-2">
                  {leaveBalance.vacation - leaveBalance.vacation_used} / {leaveBalance.vacation}
                </p>
                <p className="text-xs text-blue-600">Used: {leaveBalance.vacation_used}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Salary Advance Section */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <IndianRupee size={20} className="text-green-600" />
              Salary Advance
            </CardTitle>
            <Button onClick={() => setShowAdvanceDialog(true)} variant="outline" size="sm">
              Request Advance
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {advances.length === 0 ? (
            <p className="text-gray-500 text-center py-4">No advance requests</p>
          ) : (
            <div className="space-y-3">
              {advances.map((advance) => (
                <div key={advance.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                  <div>
                    <p className="font-semibold">₹{advance.amount?.toLocaleString()}</p>
                    <p className="text-sm text-gray-500">{advance.reason}</p>
                    <p className="text-xs text-gray-400">EMI: ₹{advance.monthly_deduction?.toLocaleString()}/month × {advance.repayment_months} months</p>
                  </div>
                  <span className={`text-xs px-3 py-1 rounded-full font-medium ${
                    advance.status === 'approved' ? 'bg-green-100 text-green-700' :
                    advance.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                    advance.status === 'disbursed' ? 'bg-blue-100 text-blue-700' :
                    'bg-red-100 text-red-700'
                  }`}>
                    {advance.status}
                  </span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Advance Request Dialog */}
      <Dialog open={showAdvanceDialog} onOpenChange={setShowAdvanceDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Request Salary Advance</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Amount (₹)</Label>
              <Input
                type="number"
                placeholder="Enter amount"
                value={advanceForm.amount}
                onChange={(e) => setAdvanceForm({...advanceForm, amount: e.target.value})}
              />
            </div>
            <div className="space-y-2">
              <Label>Repayment Period (months)</Label>
              <Input
                type="number"
                min="1"
                max="12"
                value={advanceForm.repayment_months}
                onChange={(e) => setAdvanceForm({...advanceForm, repayment_months: parseInt(e.target.value) || 3})}
              />
              {advanceForm.amount && (
                <p className="text-sm text-gray-500">
                  Monthly EMI: ₹{Math.round(parseFloat(advanceForm.amount) / advanceForm.repayment_months).toLocaleString()}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label>Reason</Label>
              <Textarea
                placeholder="Why do you need this advance?"
                value={advanceForm.reason}
                onChange={(e) => setAdvanceForm({...advanceForm, reason: e.target.value})}
              />
            </div>
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">Cancel</Button>
            </DialogClose>
            <Button
              onClick={handleAdvanceRequest}
              className="bg-[#1E2A5E] hover:bg-[#2D3A8C]"
              disabled={submittingAdvance}
            >
              {submittingAdvance ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              Submit Request
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Profile;
