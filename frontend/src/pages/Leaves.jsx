import React, { useState } from 'react';
import { leaveRequests, employees } from '../data/mockData';
import { useAuth } from '../context/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
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
import {
  CalendarOff, Plus, Check, X, Clock, Calendar
} from 'lucide-react';

const Leaves = () => {
  const { user, isAdmin } = useAuth();
  const [leaves, setLeaves] = useState(leaveRequests);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [filterStatus, setFilterStatus] = useState('all');
  const [newLeave, setNewLeave] = useState({
    type: 'Casual Leave', fromDate: '', toDate: '', reason: ''
  });

  const filteredLeaves = leaves.filter(leave => {
    const matchesStatus = filterStatus === 'all' || leave.status === filterStatus;
    const matchesUser = isAdmin || leave.empId === user?.id;
    return matchesStatus && matchesUser;
  });

  const pendingCount = leaves.filter(l => l.status === 'pending').length;
  const approvedCount = leaves.filter(l => l.status === 'approved').length;
  const rejectedCount = leaves.filter(l => l.status === 'rejected').length;

  const handleAddLeave = () => {
    const from = new Date(newLeave.fromDate);
    const to = new Date(newLeave.toDate);
    const days = Math.ceil((to - from) / (1000 * 60 * 60 * 24)) + 1;
    
    const leave = {
      id: `LV${Date.now()}`,
      empId: user.id,
      empName: user.name,
      type: newLeave.type,
      fromDate: newLeave.fromDate,
      toDate: newLeave.toDate,
      days,
      reason: newLeave.reason,
      status: 'pending',
      appliedOn: new Date().toISOString().split('T')[0]
    };
    setLeaves([leave, ...leaves]);
    setNewLeave({ type: 'Casual Leave', fromDate: '', toDate: '', reason: '' });
    setIsAddDialogOpen(false);
  };

  const handleApprove = (id) => {
    setLeaves(leaves.map(l => l.id === id ? { ...l, status: 'approved' } : l));
  };

  const handleReject = (id) => {
    setLeaves(leaves.map(l => l.id === id ? { ...l, status: 'rejected' } : l));
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Leave Management</h1>
          <p className="text-gray-500">{isAdmin ? 'Manage employee leaves' : 'Apply for leave'}</p>
        </div>
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
                  <SelectTrigger>
                    <SelectValue placeholder="Select leave type" />
                  </SelectTrigger>
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
                  <Input
                    type="date"
                    value={newLeave.fromDate}
                    onChange={(e) => setNewLeave({...newLeave, fromDate: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <Label>To Date</Label>
                  <Input
                    type="date"
                    value={newLeave.toDate}
                    onChange={(e) => setNewLeave({...newLeave, toDate: e.target.value})}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Reason</Label>
                <Textarea
                  placeholder="Enter reason for leave"
                  value={newLeave.reason}
                  onChange={(e) => setNewLeave({...newLeave, reason: e.target.value})}
                />
              </div>
            </div>
            <DialogFooter>
              <DialogClose asChild>
                <Button variant="outline">Cancel</Button>
              </DialogClose>
              <Button onClick={handleAddLeave} className="bg-[#1E2A5E] hover:bg-[#2D3A8C]">
                Submit Request
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats */}
      {isAdmin && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card>
            <CardContent className="p-4 flex items-center gap-4">
              <div className="w-12 h-12 bg-yellow-100 rounded-xl flex items-center justify-center">
                <Clock size={24} className="text-yellow-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-800">{pendingCount}</p>
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
                <p className="text-2xl font-bold text-gray-800">{approvedCount}</p>
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
                <p className="text-2xl font-bold text-gray-800">{rejectedCount}</p>
                <p className="text-sm text-gray-500">Rejected</p>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filter */}
      <Card>
        <CardContent className="p-4">
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Filter" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Requests</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="approved">Approved</SelectItem>
              <SelectItem value="rejected">Rejected</SelectItem>
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {/* Leave Requests */}
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
            <Card key={leave.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white font-bold">
                      {leave.empName.split(' ').map(n => n[0]).join('')}
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-800">{leave.empName}</h3>
                      <p className="text-sm text-gray-500">{leave.type}</p>
                      <div className="flex items-center gap-4 mt-2 text-sm text-gray-600">
                        <span className="flex items-center gap-1">
                          <Calendar size={14} />
                          {leave.fromDate} to {leave.toDate}
                        </span>
                        <span className="bg-gray-100 px-2 py-0.5 rounded">{leave.days} day(s)</span>
                      </div>
                      <p className="text-sm text-gray-600 mt-2">{leave.reason}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`text-xs px-3 py-1 rounded-full font-medium ${
                      leave.status === 'approved' ? 'bg-green-100 text-green-700' :
                      leave.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                      'bg-red-100 text-red-700'
                    }`}>
                      {leave.status}
                    </span>
                    {isAdmin && leave.status === 'pending' && (
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          onClick={() => handleApprove(leave.id)}
                          className="bg-green-600 hover:bg-green-700"
                        >
                          <Check size={16} />
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => handleReject(leave.id)}
                        >
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
