import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { leaveAPI, bulkAPI } from '../services/api';
import { Card, CardContent } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import { Checkbox } from '../components/ui/checkbox';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose
} from '../components/ui/dialog';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from '../components/ui/select';
import {
  CalendarOff, Plus, Check, X, Clock, Calendar, Loader2, RefreshCw, CheckSquare, CalendarDays, CalendarCheck, Briefcase
} from 'lucide-react';
import toast from 'react-hot-toast';

const Leaves = () => {
  const { user, isAdmin, isTeamLead } = useAuth();
  const [leaves, setLeaves] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [filterStatus, setFilterStatus] = useState('all');
  const [selectedIds, setSelectedIds] = useState([]);
  const [bulkProcessing, setBulkProcessing] = useState(false);
  const [leaveBalance, setLeaveBalance] = useState(null);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [newLeave, setNewLeave] = useState({
    type: 'Casual Leave', from_date: '', to_date: '', reason: ''
  });

  const years = [2024, 2025, 2026];

  useEffect(() => {
    loadLeaves();
    loadLeaveBalance();
  }, [user?.id]);

  useEffect(() => {
    loadLeaveBalance();
  }, [selectedYear]);

  const loadLeaveBalance = useCallback(async () => {
    if (!user?.id || isAdmin) return;
    try {
      const balance = await leaveAPI.getBalance(user.id, selectedYear);
      setLeaveBalance(balance);
    } catch (error) {
      console.error('Error loading leave balance:', error);
    }
  }, [user?.id, selectedYear, isAdmin]);

  const loadLeaves = useCallback(async (isRefresh = false) => {
    if (!user?.id) return;
    
    if (isRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }
    
    try {
      const empId = (isAdmin || isTeamLead) ? null : user.id;
      const data = await leaveAPI.getAll(empId);
      setLeaves(data || []);
      setSelectedIds([]);
      if (isRefresh) {
        toast.success('Refreshed!');
        loadLeaveBalance();
      }
    } catch (error) {
      console.error('Error loading leaves:', error);
      toast.error('Failed to load leave requests');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user?.id, isAdmin, isTeamLead, loadLeaveBalance]);

  const filteredLeaves = leaves.filter(leave => {
    const matchesStatus = filterStatus === 'all' || leave.status === filterStatus;
    const matchesUser = isAdmin || isTeamLead || leave.emp_id === user?.id;
    return matchesStatus && matchesUser;
  });

  const pendingCount = filteredLeaves.filter(l => l.status === 'pending').length;
  const approvedCount = leaves.filter(l => l.status === 'approved').length;
  const rejectedCount = leaves.filter(l => l.status === 'rejected').length;
  const totalPendingCount = leaves.filter(l => l.status === 'pending').length;

  const handleAddLeave = async () => {
    if (!newLeave.from_date || !newLeave.to_date || !newLeave.reason) {
      toast.error('Please fill all required fields');
      return;
    }

    const from = new Date(newLeave.from_date);
    const to = new Date(newLeave.to_date);
    
    if (to < from) {
      toast.error('End date cannot be before start date');
      return;
    }

    const days = Math.ceil((to - from) / (1000 * 60 * 60 * 24)) + 1;
    
    setSubmitting(true);
    try {
      await leaveAPI.create({
        emp_id: user.id,
        emp_name: user.name,
        type: newLeave.type,
        from_date: newLeave.from_date,
        to_date: newLeave.to_date,
        days,
        reason: newLeave.reason
      });
      toast.success('Leave request submitted successfully!');
      setNewLeave({ type: 'Casual Leave', from_date: '', to_date: '', reason: '' });
      setIsAddDialogOpen(false);
      await loadLeaves();
    } catch (error) {
      toast.error(error.message || 'Failed to submit leave request');
    } finally {
      setSubmitting(false);
    }
  };

  const handleApprove = async (id) => {
    try {
      await leaveAPI.approve(id, user.id);
      toast.success('Leave approved!');
      await loadLeaves();
    } catch (error) {
      toast.error(error.message || 'Failed to approve');
    }
  };

  const handleReject = async (id) => {
    try {
      await leaveAPI.reject(id, user.id);
      toast.success('Leave rejected');
      await loadLeaves();
    } catch (error) {
      toast.error(error.message || 'Failed to reject');
    }
  };

  const handleSelectAll = () => {
    const pendingIds = filteredLeaves.filter(l => l.status === 'pending').map(l => l.id);
    setSelectedIds(selectedIds.length === pendingIds.length ? [] : pendingIds);
  };

  const handleSelect = (id) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  };

  const handleBulkApprove = async () => {
    if (selectedIds.length === 0) return;
    setBulkProcessing(true);
    try {
      const result = await bulkAPI.approveLeaves(selectedIds, user.id);
      toast.success(`${result.count} leaves approved!`);
      setSelectedIds([]);
      await loadLeaves();
    } catch (error) {
      toast.error(error.message || 'Failed to approve');
    } finally {
      setBulkProcessing(false);
    }
  };

  const handleBulkReject = async () => {
    if (selectedIds.length === 0) return;
    setBulkProcessing(true);
    try {
      const result = await bulkAPI.rejectLeaves(selectedIds, user.id);
      toast.success(`${result.count} leaves rejected!`);
      setSelectedIds([]);
      await loadLeaves();
    } catch (error) {
      toast.error(error.message || 'Failed to reject');
    } finally {
      setBulkProcessing(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-[#1E2A5E]" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Leave Management</h1>
          <p className="text-gray-500">{(isAdmin || isTeamLead) ? 'Manage employee leaves' : 'Apply for leave'}</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={() => loadLeaves(true)} disabled={refreshing}>
            <RefreshCw size={18} className={refreshing ? 'animate-spin' : ''} />
          </Button>
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-[#1E2A5E] hover:bg-[#2D3A8C]">
                <Plus size={18} className="mr-2" /> Apply Leave
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Apply for Leave</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label>Leave Type</Label>
                  <Select value={newLeave.type} onValueChange={(v) => setNewLeave({...newLeave, type: v})}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Casual Leave">Casual Leave</SelectItem>
                      <SelectItem value="Sick Leave">Sick Leave</SelectItem>
                      <SelectItem value="Vacation">Vacation</SelectItem>
                      <SelectItem value="Personal">Personal</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>From Date</Label>
                    <Input type="date" value={newLeave.from_date} onChange={(e) => setNewLeave({...newLeave, from_date: e.target.value})} />
                  </div>
                  <div className="space-y-2">
                    <Label>To Date</Label>
                    <Input type="date" value={newLeave.to_date} onChange={(e) => setNewLeave({...newLeave, to_date: e.target.value})} />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Reason</Label>
                  <Textarea placeholder="Enter reason" value={newLeave.reason} onChange={(e) => setNewLeave({...newLeave, reason: e.target.value})} />
                </div>
              </div>
              <DialogFooter>
                <DialogClose asChild><Button variant="outline">Cancel</Button></DialogClose>
                <Button onClick={handleAddLeave} className="bg-[#1E2A5E] hover:bg-[#2D3A8C]" disabled={submitting}>
                  {submitting && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
                  Submit
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Stats - Admin/TL only */}
      {(isAdmin || isTeamLead) && (
        <div className="grid grid-cols-3 gap-4">
          <Card>
            <CardContent className="p-4 flex items-center gap-4">
              <div className="w-12 h-12 bg-yellow-100 rounded-xl flex items-center justify-center">
                <Clock size={24} className="text-yellow-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{totalPendingCount}</p>
                <p className="text-sm text-gray-500">Pending</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center gap-4">
              <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                <Check size={24} className="text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{approvedCount}</p>
                <p className="text-sm text-gray-500">Approved</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center gap-4">
              <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center">
                <X size={24} className="text-red-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{rejectedCount}</p>
                <p className="text-sm text-gray-500">Rejected</p>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filter & Bulk Actions */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Requests</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="approved">Approved</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
              </SelectContent>
            </Select>
            
            {(isAdmin || isTeamLead) && pendingCount > 0 && (
              <div className="flex items-center gap-2 flex-wrap">
                <Button variant="outline" size="sm" onClick={handleSelectAll}>
                  <CheckSquare size={16} className="mr-1" />
                  {selectedIds.length === pendingCount ? 'Deselect' : 'Select All'}
                </Button>
                {selectedIds.length > 0 && (
                  <>
                    <span className="text-sm text-gray-500">{selectedIds.length} selected</span>
                    <Button size="sm" onClick={handleBulkApprove} className="bg-green-600 hover:bg-green-700" disabled={bulkProcessing}>
                      <Check size={16} className="mr-1" /> Approve
                    </Button>
                    <Button size="sm" variant="destructive" onClick={handleBulkReject} disabled={bulkProcessing}>
                      <X size={16} className="mr-1" /> Reject
                    </Button>
                  </>
                )}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Leave List */}
      <div className="space-y-4">
        {filteredLeaves.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center text-gray-500">
              <CalendarOff size={48} className="mx-auto mb-4 opacity-50" />
              <p>No leave requests found</p>
            </CardContent>
          </Card>
        ) : (
          filteredLeaves.map((leave) => (
            <Card key={leave.id} className={`hover:shadow-md transition-shadow ${selectedIds.includes(leave.id) ? 'ring-2 ring-blue-500' : ''}`}>
              <CardContent className="p-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-start gap-4">
                    {(isAdmin || isTeamLead) && leave.status === 'pending' && (
                      <Checkbox checked={selectedIds.includes(leave.id)} onCheckedChange={() => handleSelect(leave.id)} className="mt-3" />
                    )}
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white font-bold">
                      {leave.emp_name?.split(' ').map(n => n[0]).join('') || 'U'}
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-800">{leave.emp_name}</h3>
                      <p className="text-sm text-gray-500">{leave.type}</p>
                      <div className="flex items-center gap-4 mt-2 text-sm text-gray-600">
                        <span className="flex items-center gap-1"><Calendar size={14} /> {leave.from_date} to {leave.to_date}</span>
                        <span className="bg-gray-100 px-2 py-0.5 rounded">{leave.days} day(s)</span>
                      </div>
                      <p className="text-sm text-gray-600 mt-2">{leave.reason}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`text-xs px-3 py-1 rounded-full font-medium ${
                      leave.status === 'approved' ? 'bg-green-100 text-green-700' :
                      leave.status === 'pending' ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'
                    }`}>
                      {leave.status}
                    </span>
                    {(isAdmin || isTeamLead) && leave.status === 'pending' && (
                      <div className="flex gap-2">
                        <Button size="sm" onClick={() => handleApprove(leave.id)} className="bg-green-600 hover:bg-green-700">
                          <Check size={16} />
                        </Button>
                        <Button size="sm" variant="destructive" onClick={() => handleReject(leave.id)}>
                          <X size={16} />
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
};

export default Leaves;
