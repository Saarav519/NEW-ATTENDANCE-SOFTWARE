import React, { useState } from 'react';
import { advances, employees } from '../data/mockData';
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
import { Wallet, Plus, Check, X, IndianRupee, Clock } from 'lucide-react';

const Advances = () => {
  const { user, isAdmin } = useAuth();
  const [advanceList, setAdvanceList] = useState(advances);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [filterStatus, setFilterStatus] = useState('all');
  const [newAdvance, setNewAdvance] = useState({
    amount: '', reason: '', deductFrom: ''
  });

  const filteredAdvances = advanceList.filter(adv => {
    const matchesStatus = filterStatus === 'all' || adv.status === filterStatus;
    const matchesUser = isAdmin || adv.empId === user?.id;
    return matchesStatus && matchesUser;
  });

  const pendingAmount = advanceList.filter(a => a.status === 'pending').reduce((sum, a) => sum + a.amount, 0);
  const approvedAmount = advanceList.filter(a => a.status === 'approved').reduce((sum, a) => sum + a.amount, 0);

  const handleAddAdvance = () => {
    const advance = {
      id: `ADV${Date.now()}`,
      empId: user.id,
      empName: user.name,
      amount: parseInt(newAdvance.amount),
      date: new Date().toISOString().split('T')[0],
      reason: newAdvance.reason,
      status: 'pending',
      deductFrom: newAdvance.deductFrom
    };
    setAdvanceList([advance, ...advanceList]);
    setNewAdvance({ amount: '', reason: '', deductFrom: '' });
    setIsAddDialogOpen(false);
  };

  const handleApprove = (id) => {
    setAdvanceList(advanceList.map(a => a.id === id ? { ...a, status: 'approved' } : a));
  };

  const handleReject = (id) => {
    setAdvanceList(advanceList.map(a => a.id === id ? { ...a, status: 'rejected' } : a));
  };

  const months = ['January 2025', 'February 2025', 'March 2025', 'April 2025', 'May 2025', 'June 2025', 'July 2025', 'August 2025', 'September 2025', 'October 2025', 'November 2025', 'December 2025'];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Advance Management</h1>
          <p className="text-gray-500">{isAdmin ? 'Manage salary advances' : 'Request advance'}</p>
        </div>
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
                <Label>Amount (₹)</Label>
                <Input
                  type="number"
                  placeholder="Enter amount"
                  value={newAdvance.amount}
                  onChange={(e) => setNewAdvance({...newAdvance, amount: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <Label>Deduct From Salary</Label>
                <Select value={newAdvance.deductFrom} onValueChange={(v) => setNewAdvance({...newAdvance, deductFrom: v})}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select month" />
                  </SelectTrigger>
                  <SelectContent>
                    {months.map(m => <SelectItem key={m} value={m}>{m}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Reason</Label>
                <Textarea
                  placeholder="Reason for advance"
                  value={newAdvance.reason}
                  onChange={(e) => setNewAdvance({...newAdvance, reason: e.target.value})}
                />
              </div>
            </div>
            <DialogFooter>
              <DialogClose asChild>
                <Button variant="outline">Cancel</Button>
              </DialogClose>
              <Button onClick={handleAddAdvance} className="bg-[#1E2A5E] hover:bg-[#2D3A8C]">
                Submit Request
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
              <p className="text-2xl font-bold text-gray-800">₹{approvedAmount.toLocaleString()}</p>
              <p className="text-sm text-gray-500">Approved</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
              <Wallet size={24} className="text-purple-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-800">{advanceList.length}</p>
              <p className="text-sm text-gray-500">Total Requests</p>
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
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="text-left p-4 font-semibold text-gray-600 text-sm">Employee</th>
                  <th className="text-left p-4 font-semibold text-gray-600 text-sm">Amount</th>
                  <th className="text-left p-4 font-semibold text-gray-600 text-sm">Date</th>
                  <th className="text-left p-4 font-semibold text-gray-600 text-sm">Deduct From</th>
                  <th className="text-left p-4 font-semibold text-gray-600 text-sm">Reason</th>
                  <th className="text-left p-4 font-semibold text-gray-600 text-sm">Status</th>
                  {isAdmin && <th className="text-left p-4 font-semibold text-gray-600 text-sm">Actions</th>}
                </tr>
              </thead>
              <tbody className="divide-y">
                {filteredAdvances.map((adv) => (
                  <tr key={adv.id} className="hover:bg-gray-50">
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-400 to-purple-600 flex items-center justify-center text-white font-bold text-xs">
                          {adv.empName.split(' ').map(n => n[0]).join('')}
                        </div>
                        <span className="font-medium">{adv.empName}</span>
                      </div>
                    </td>
                    <td className="p-4 font-semibold text-gray-800">₹{adv.amount.toLocaleString()}</td>
                    <td className="p-4 text-gray-700">{adv.date}</td>
                    <td className="p-4 text-gray-700">{adv.deductFrom}</td>
                    <td className="p-4 text-gray-600 text-sm max-w-xs truncate">{adv.reason}</td>
                    <td className="p-4">
                      <span className={`text-xs px-3 py-1 rounded-full font-medium ${
                        adv.status === 'approved' ? 'bg-green-100 text-green-700' :
                        adv.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                        'bg-red-100 text-red-700'
                      }`}>
                        {adv.status}
                      </span>
                    </td>
                    {isAdmin && (
                      <td className="p-4">
                        {adv.status === 'pending' && (
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleApprove(adv.id)}
                              className="p-1.5 bg-green-100 text-green-600 rounded hover:bg-green-200"
                            >
                              <Check size={14} />
                            </button>
                            <button
                              onClick={() => handleReject(adv.id)}
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

export default Advances;
