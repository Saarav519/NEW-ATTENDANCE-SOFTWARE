import React, { useState } from 'react';
import { overtimeRecords, employees } from '../data/mockData';
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
import { Clock, Plus, Check, X, IndianRupee } from 'lucide-react';

const Overtime = () => {
  const { user, isAdmin } = useAuth();
  const [records, setRecords] = useState(overtimeRecords);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [filterStatus, setFilterStatus] = useState('all');
  const [newOT, setNewOT] = useState({
    date: '', hours: '', reason: ''
  });

  const filteredRecords = records.filter(ot => {
    const matchesStatus = filterStatus === 'all' || ot.status === filterStatus;
    const matchesUser = isAdmin || ot.empId === user?.id;
    return matchesStatus && matchesUser;
  });

  const pendingCount = records.filter(r => r.status === 'pending').length;
  const totalHours = records.filter(r => r.status === 'approved').reduce((sum, r) => sum + r.hours, 0);
  const totalAmount = records.filter(r => r.status === 'approved').reduce((sum, r) => sum + r.amount, 0);

  const handleAddOT = () => {
    const emp = employees.find(e => e.id === user.id);
    const rate = Math.round(emp?.salary / 30 / 8) || 250; // Daily rate / 8 hours
    const hours = parseFloat(newOT.hours);
    
    const ot = {
      id: `OT${Date.now()}`,
      empId: user.id,
      empName: user.name,
      date: newOT.date,
      hours,
      rate,
      amount: hours * rate,
      reason: newOT.reason,
      status: 'pending'
    };
    setRecords([ot, ...records]);
    setNewOT({ date: '', hours: '', reason: '' });
    setIsAddDialogOpen(false);
  };

  const handleApprove = (id) => {
    setRecords(records.map(r => r.id === id ? { ...r, status: 'approved' } : r));
  };

  const handleReject = (id) => {
    setRecords(records.map(r => r.id === id ? { ...r, status: 'rejected' } : r));
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Overtime Management</h1>
          <p className="text-gray-500">{isAdmin ? 'Manage overtime requests' : 'Log overtime hours'}</p>
        </div>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-[#1E2A5E] hover:bg-[#2D3A8C]">
              <Plus size={18} className="mr-2" /> Log Overtime
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Log Overtime Hours</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Date</Label>
                <Input
                  type="date"
                  value={newOT.date}
                  onChange={(e) => setNewOT({...newOT, date: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <Label>Hours</Label>
                <Input
                  type="number"
                  step="0.5"
                  placeholder="Enter overtime hours"
                  value={newOT.hours}
                  onChange={(e) => setNewOT({...newOT, hours: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <Label>Reason</Label>
                <Textarea
                  placeholder="Reason for overtime"
                  value={newOT.reason}
                  onChange={(e) => setNewOT({...newOT, reason: e.target.value})}
                />
              </div>
            </div>
            <DialogFooter>
              <DialogClose asChild>
                <Button variant="outline">Cancel</Button>
              </DialogClose>
              <Button onClick={handleAddOT} className="bg-[#1E2A5E] hover:bg-[#2D3A8C]">
                Submit
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
              <p className="text-2xl font-bold text-gray-800">{pendingCount}</p>
              <p className="text-sm text-gray-500">Pending Requests</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
              <Clock size={24} className="text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-800">{totalHours} hrs</p>
              <p className="text-sm text-gray-500">Total Approved</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
              <IndianRupee size={24} className="text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-800">₹{totalAmount.toLocaleString()}</p>
              <p className="text-sm text-gray-500">Total Amount</p>
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

      {/* Overtime Records */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="text-left p-4 font-semibold text-gray-600 text-sm">Employee</th>
                  <th className="text-left p-4 font-semibold text-gray-600 text-sm">Date</th>
                  <th className="text-left p-4 font-semibold text-gray-600 text-sm">Hours</th>
                  <th className="text-left p-4 font-semibold text-gray-600 text-sm">Rate</th>
                  <th className="text-left p-4 font-semibold text-gray-600 text-sm">Amount</th>
                  <th className="text-left p-4 font-semibold text-gray-600 text-sm">Reason</th>
                  <th className="text-left p-4 font-semibold text-gray-600 text-sm">Status</th>
                  {isAdmin && <th className="text-left p-4 font-semibold text-gray-600 text-sm">Actions</th>}
                </tr>
              </thead>
              <tbody className="divide-y">
                {filteredRecords.map((ot) => (
                  <tr key={ot.id} className="hover:bg-gray-50">
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white font-bold text-xs">
                          {ot.empName.split(' ').map(n => n[0]).join('')}
                        </div>
                        <span className="font-medium">{ot.empName}</span>
                      </div>
                    </td>
                    <td className="p-4 text-gray-700">{ot.date}</td>
                    <td className="p-4 text-gray-700">{ot.hours} hrs</td>
                    <td className="p-4 text-gray-700">₹{ot.rate}/hr</td>
                    <td className="p-4 font-semibold text-gray-800">₹{ot.amount}</td>
                    <td className="p-4 text-gray-600 text-sm max-w-xs truncate">{ot.reason}</td>
                    <td className="p-4">
                      <span className={`text-xs px-3 py-1 rounded-full font-medium ${
                        ot.status === 'approved' ? 'bg-green-100 text-green-700' :
                        ot.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                        'bg-red-100 text-red-700'
                      }`}>
                        {ot.status}
                      </span>
                    </td>
                    {isAdmin && (
                      <td className="p-4">
                        {ot.status === 'pending' && (
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleApprove(ot.id)}
                              className="p-1.5 bg-green-100 text-green-600 rounded hover:bg-green-200"
                            >
                              <Check size={14} />
                            </button>
                            <button
                              onClick={() => handleReject(ot.id)}
                              className="p-1.5 bg-red-100 text-red-600 rounded hover:bg-red-200"
                            >
                              <X size={14} />
                            </button>
                          </div>
                        )}
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Overtime;
