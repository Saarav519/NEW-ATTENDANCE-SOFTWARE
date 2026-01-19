import React, { useState, useEffect } from 'react';
import { advanceAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { Card, CardContent } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose
} from '../components/ui/dialog';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from '../components/ui/select';
import { Wallet, Plus, Check, X, Clock, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

const currentYear = new Date().getFullYear();
const YEARS = [currentYear, currentYear + 1];

const Advances = () => {
  const { user, isAdmin } = useAuth();
  const [advances, setAdvances] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [filterStatus, setFilterStatus] = useState('all');
  const [newAdvance, setNewAdvance] = useState({
    amount: '',
    reason: '',
    deductFromMonth: MONTHS[new Date().getMonth()],
    deductFromYear: currentYear.toString()
  });

  useEffect(() => {
    loadAdvances();
  }, [user]);

  const loadAdvances = async () => {
    if (!user) return;
    setLoading(true);
    try {
      // Admin sees all advances, employees/teamleads see their own
      const data = await advanceAPI.getAll(isAdmin ? null : user.id);
      setAdvances(data || []);
    } catch (error) {
      console.error('Error loading advances:', error);
      toast.error('Failed to load advances');
    } finally {
      setLoading(false);
    }
  };

  const filteredAdvances = advances.filter(adv => {
    return filterStatus === 'all' || adv.status === filterStatus;
  });

  const pendingAmount = advances.filter(a => a.status === 'pending').reduce((sum, a) => sum + (a.amount || 0), 0);
  const approvedAmount = advances.filter(a => a.status === 'approved' && !a.is_deducted).reduce((sum, a) => sum + (a.amount || 0), 0);
  const deductedAmount = advances.filter(a => a.is_deducted).reduce((sum, a) => sum + (a.amount || 0), 0);

  const handleAddAdvance = async () => {
    if (!newAdvance.amount || !newAdvance.reason || !newAdvance.deductFromMonth || !newAdvance.deductFromYear) {
      toast.error('Please fill all required fields');
      return;
    }

    setSubmitting(true);
    try {
      await advanceAPI.create({
        emp_id: user.id,
        emp_name: user.name,
        amount: parseFloat(newAdvance.amount),
        reason: newAdvance.reason,
        deduct_from_month: newAdvance.deductFromMonth,
        deduct_from_year: parseInt(newAdvance.deductFromYear),
        repayment_months: 1
      });
      
      toast.success('Advance request submitted successfully');
      setNewAdvance({ amount: '', reason: '', deductFromMonth: MONTHS[new Date().getMonth()], deductFromYear: currentYear.toString() });
      setIsAddDialogOpen(false);
      loadAdvances();
    } catch (error) {
      console.error('Error creating advance:', error);
      toast.error('Failed to submit advance request');
    } finally {
      setSubmitting(false);
    }
  };

  const handleApprove = async (advanceId) => {
    try {
      await advanceAPI.approve(advanceId, user.id);
      toast.success('Advance approved');
      loadAdvances();
    } catch (error) {
      console.error('Error approving advance:', error);
      toast.error('Failed to approve advance');
    }
  };

  const handleReject = async (advanceId) => {
    try {
      await advanceAPI.reject(advanceId, user.id);
      toast.success('Advance rejected');
      loadAdvances();
    } catch (error) {
      console.error('Error rejecting advance:', error);
      toast.error('Failed to reject advance');
    }
  };

  const getStatusBadge = (status, isDeducted) => {
    if (isDeducted) {
      return <span className="px-2 py-1 text-xs rounded-full bg-gray-100 text-gray-700">Deducted</span>;
    }
    switch (status) {
      case 'approved':
        return <span className="px-2 py-1 text-xs rounded-full bg-green-100 text-green-700">Approved</span>;
      case 'rejected':
        return <span className="px-2 py-1 text-xs rounded-full bg-red-100 text-red-700">Rejected</span>;
      default:
        return <span className="px-2 py-1 text-xs rounded-full bg-yellow-100 text-yellow-700">Pending</span>;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="animate-spin h-12 w-12 border-4 border-blue-500 border-t-transparent rounded-full mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading advances...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">
            {isAdmin ? 'Advance Management' : 'Salary Advance'}
          </h1>
          <p className="text-gray-500">
            {isAdmin ? 'Manage salary advance requests' : 'Request salary advance'}
          </p>
        </div>
        
        {/* Request Advance Button - visible to all */}
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-[#1E2A5E] hover:bg-[#2D3A8C]">
              <Plus size={18} className="mr-2" /> Request Advance
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Request Salary Advance</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Amount (₹) *</Label>
                <Input
                  type="number"
                  placeholder="Enter amount"
                  value={newAdvance.amount}
                  onChange={(e) => setNewAdvance({...newAdvance, amount: e.target.value})}
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label>Deduct From Month *</Label>
                  <Select 
                    value={newAdvance.deductFromMonth} 
                    onValueChange={(v) => setNewAdvance({...newAdvance, deductFromMonth: v})}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select month" />
                    </SelectTrigger>
                    <SelectContent>
                      {MONTHS.map(m => <SelectItem key={m} value={m}>{m}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Year *</Label>
                  <Select 
                    value={newAdvance.deductFromYear} 
                    onValueChange={(v) => setNewAdvance({...newAdvance, deductFromYear: v})}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select year" />
                    </SelectTrigger>
                    <SelectContent>
                      {YEARS.map(y => <SelectItem key={y} value={y.toString()}>{y}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Reason *</Label>
                <Textarea
                  placeholder="Reason for advance request"
                  value={newAdvance.reason}
                  onChange={(e) => setNewAdvance({...newAdvance, reason: e.target.value})}
                  rows={3}
                />
              </div>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm text-blue-700">
                <strong>Note:</strong> The advance amount will be deducted from your {newAdvance.deductFromMonth} {newAdvance.deductFromYear} salary after approval.
              </div>
            </div>
            <DialogFooter>
              <DialogClose asChild>
                <Button variant="outline">Cancel</Button>
              </DialogClose>
              <Button 
                onClick={handleAddAdvance} 
                className="bg-[#1E2A5E] hover:bg-[#2D3A8C]"
                disabled={submitting}
              >
                {submitting ? (
                  <>
                    <Loader2 size={16} className="mr-2 animate-spin" /> Submitting...
                  </>
                ) : (
                  'Submit Request'
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="w-12 h-12 bg-yellow-100 rounded-xl flex items-center justify-center">
              <Clock size={24} className="text-yellow-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-800">₹{pendingAmount.toLocaleString()}</p>
              <p className="text-sm text-gray-500">Pending Approval</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
              <Check size={24} className="text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-800">₹{approvedAmount.toLocaleString()}</p>
              <p className="text-sm text-gray-500">Approved (Pending Deduction)</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
              <Wallet size={24} className="text-purple-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-800">₹{deductedAmount.toLocaleString()}</p>
              <p className="text-sm text-gray-500">Cleared (Deducted)</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filter */}
      <Card>
        <CardContent className="p-4">
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Filter" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="approved">Approved</SelectItem>
              <SelectItem value="rejected">Rejected</SelectItem>
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {/* Advance Records */}
      <Card>
        <CardContent className="p-0">
          {filteredAdvances.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              <Wallet className="h-12 w-12 mx-auto text-gray-300 mb-3" />
              <p className="font-medium">No advance requests found</p>
              <p className="text-sm mt-1">Click "Request Advance" to create one</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    {isAdmin && <th className="text-left p-4 font-semibold text-gray-600 text-sm">Employee</th>}
                    <th className="text-left p-4 font-semibold text-gray-600 text-sm">Amount</th>
                    <th className="text-left p-4 font-semibold text-gray-600 text-sm">Requested On</th>
                    <th className="text-left p-4 font-semibold text-gray-600 text-sm">Deduct From</th>
                    <th className="text-left p-4 font-semibold text-gray-600 text-sm">Reason</th>
                    <th className="text-left p-4 font-semibold text-gray-600 text-sm">Status</th>
                    {isAdmin && <th className="text-left p-4 font-semibold text-gray-600 text-sm">Actions</th>}
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {filteredAdvances.map((adv) => (
                    <tr key={adv.id} className="hover:bg-gray-50">
                      {isAdmin && (
                        <td className="p-4">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-400 to-purple-600 flex items-center justify-center text-white font-bold text-xs">
                              {adv.emp_name?.split(' ').map(n => n[0]).join('') || '?'}
                            </div>
                            <div>
                              <span className="font-medium">{adv.emp_name}</span>
                              <p className="text-xs text-gray-500">{adv.emp_id}</p>
                            </div>
                          </div>
                        </td>
                      )}
                      <td className="p-4">
                        <span className="font-bold text-lg text-purple-600">₹{adv.amount?.toLocaleString()}</span>
                      </td>
                      <td className="p-4 text-gray-600">
                        {adv.requested_on ? new Date(adv.requested_on).toLocaleDateString() : '-'}
                      </td>
                      <td className="p-4">
                        <span className="font-medium text-blue-600">
                          {adv.deduct_from_month} {adv.deduct_from_year}
                        </span>
                      </td>
                      <td className="p-4 text-gray-600 max-w-xs truncate">{adv.reason}</td>
                      <td className="p-4">
                        {getStatusBadge(adv.status, adv.is_deducted)}
                      </td>
                      {isAdmin && (
                        <td className="p-4">
                          {adv.status === 'pending' && (
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                variant="outline"
                                className="text-green-600 border-green-200 hover:bg-green-50"
                                onClick={() => handleApprove(adv.id)}
                              >
                                <Check size={14} className="mr-1" /> Approve
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                className="text-red-600 border-red-200 hover:bg-red-50"
                                onClick={() => handleReject(adv.id)}
                              >
                                <X size={14} className="mr-1" /> Reject
                              </Button>
                            </div>
                          )}
                          {adv.status === 'approved' && !adv.is_deducted && (
                            <span className="text-sm text-gray-500">Pending salary deduction</span>
                          )}
                          {adv.is_deducted && (
                            <span className="text-sm text-green-600">Deducted on {adv.deducted_on}</span>
                          )}
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Advances;
