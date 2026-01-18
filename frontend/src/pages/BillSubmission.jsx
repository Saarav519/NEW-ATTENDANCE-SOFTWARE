import React, { useState, useEffect } from 'react';
import { billAPI } from '../services/api';
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
import { Receipt, Plus, Check, X, IndianRupee, MapPin, Calendar, FileText, Upload, Trash2 } from 'lucide-react';

const BillSubmission = () => {
  const { user, isAdmin, isTeamLead } = useAuth();
  const [bills, setBills] = useState([]);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [filterStatus, setFilterStatus] = useState('all');
  const [loading, setLoading] = useState(true);
  const [approveDialog, setApproveDialog] = useState({ open: false, bill: null });
  const [approvedAmount, setApprovedAmount] = useState(0);
  
  const currentDate = new Date();
  const months = ['January', 'February', 'March', 'April', 'May', 'June', 
                  'July', 'August', 'September', 'October', 'November', 'December'];
  
  const [newBill, setNewBill] = useState({
    month: months[currentDate.getMonth()],
    year: currentDate.getFullYear(),
    remarks: '',
    items: []
  });
  
  const [newItem, setNewItem] = useState({
    date: currentDate.toISOString().split('T')[0],
    location: '',
    description: '',
    amount: '',
    has_attachment: false,
    attachment_url: null
  });

  useEffect(() => {
    loadBills();
  }, [user?.id, filterStatus]);

  const loadBills = async () => {
    try {
      setLoading(true);
      let data;
      if (isAdmin || isTeamLead) {
        data = await billAPI.getAll(null, filterStatus === 'all' ? null : filterStatus);
      } else {
        data = await billAPI.getAll(user?.id, filterStatus === 'all' ? null : filterStatus);
      }
      setBills(data);
    } catch (error) {
      console.error('Error loading bills:', error);
    } finally {
      setLoading(false);
    }
  };

  const addItem = () => {
    if (!newItem.date || !newItem.location || !newItem.amount) {
      alert('Please fill date, location and amount');
      return;
    }
    
    setNewBill({
      ...newBill,
      items: [...newBill.items, { ...newItem, amount: parseFloat(newItem.amount) }]
    });
    
    setNewItem({
      date: currentDate.toISOString().split('T')[0],
      location: '',
      description: '',
      amount: '',
      has_attachment: false,
      attachment_url: null
    });
  };

  const removeItem = (index) => {
    setNewBill({
      ...newBill,
      items: newBill.items.filter((_, i) => i !== index)
    });
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    if (file.size > 5 * 1024 * 1024) {
      alert('File size must be less than 5MB');
      return;
    }
    
    if (file.type !== 'application/pdf') {
      alert('Only PDF files are allowed');
      return;
    }
    
    try {
      const result = await billAPI.uploadAttachment(file);
      setNewItem({
        ...newItem,
        has_attachment: true,
        attachment_url: result.url
      });
    } catch (error) {
      alert(error.message || 'Failed to upload file');
    }
  };

  const handleSubmit = async () => {
    if (newBill.items.length === 0) {
      alert('Please add at least one expense item');
      return;
    }
    
    try {
      await billAPI.create(newBill, user.id, user.name);
      setNewBill({
        month: months[currentDate.getMonth()],
        year: currentDate.getFullYear(),
        remarks: '',
        items: []
      });
      setIsAddDialogOpen(false);
      loadBills();
    } catch (error) {
      alert(error.message || 'Failed to submit bill');
    }
  };

  const handleApprove = async () => {
    try {
      await billAPI.approve(approveDialog.bill.id, user.id, approvedAmount);
      setApproveDialog({ open: false, bill: null });
      loadBills();
    } catch (error) {
      alert(error.message || 'Failed to approve bill');
    }
  };

  const handleReject = async (billId) => {
    try {
      await billAPI.reject(billId, user.id);
      loadBills();
    } catch (error) {
      alert(error.message || 'Failed to reject bill');
    }
  };

  const pendingCount = bills.filter(b => b.status === 'pending').length;
  const totalApproved = bills.filter(b => b.status === 'approved').reduce((sum, b) => sum + b.approved_amount, 0);
  const totalPending = bills.filter(b => b.status === 'pending').reduce((sum, b) => sum + b.total_amount, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Bill Submission</h1>
          <p className="text-gray-500">
            {isAdmin || isTeamLead ? 'Manage expense submissions' : 'Submit your expenses'}
          </p>
        </div>
        {!isAdmin && (
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-[#1E2A5E] hover:bg-[#2D3A8C]" data-testid="add-bill-btn">
                <Plus size={18} className="mr-2" /> Submit Expenses
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Submit Monthly Expenses</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                {/* Month/Year Selection */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Month</Label>
                    <Select value={newBill.month} onValueChange={(v) => setNewBill({...newBill, month: v})}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {months.map(m => <SelectItem key={m} value={m}>{m}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Year</Label>
                    <Select value={String(newBill.year)} onValueChange={(v) => setNewBill({...newBill, year: parseInt(v)})}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {[2024, 2025, 2026].map(y => <SelectItem key={y} value={String(y)}>{y}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Add Item Form */}
                <div className="border rounded-lg p-4 bg-gray-50">
                  <h4 className="font-medium mb-3">Add Expense Item</h4>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <Label className="text-xs">Date</Label>
                      <Input
                        type="date"
                        value={newItem.date}
                        onChange={(e) => setNewItem({...newItem, date: e.target.value})}
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Location</Label>
                      <Input
                        placeholder="e.g., Client Site A"
                        value={newItem.location}
                        onChange={(e) => setNewItem({...newItem, location: e.target.value})}
                      />
                    </div>
                    <div className="space-y-1 col-span-2">
                      <Label className="text-xs">Description</Label>
                      <Input
                        placeholder="Brief description"
                        value={newItem.description}
                        onChange={(e) => setNewItem({...newItem, description: e.target.value})}
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Amount (₹)</Label>
                      <Input
                        type="number"
                        placeholder="0"
                        value={newItem.amount}
                        onChange={(e) => setNewItem({...newItem, amount: e.target.value})}
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Attachment (PDF)</Label>
                      <Input
                        type="file"
                        accept=".pdf"
                        onChange={handleFileUpload}
                        className="text-xs"
                      />
                    </div>
                  </div>
                  <Button 
                    onClick={addItem} 
                    variant="outline" 
                    size="sm" 
                    className="mt-3 w-full"
                  >
                    <Plus size={14} className="mr-1" /> Add Item
                  </Button>
                </div>

                {/* Items List */}
                {newBill.items.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="font-medium">Expense Items ({newBill.items.length})</h4>
                    {newBill.items.map((item, i) => (
                      <div key={i} className="flex items-center justify-between p-3 bg-white border rounded-lg">
                        <div>
                          <p className="font-medium text-sm">{item.location}</p>
                          <p className="text-xs text-gray-500">{item.date} • {item.description || 'No description'}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-green-600">₹{item.amount}</span>
                          {item.has_attachment && <FileText size={14} className="text-blue-500" />}
                          <button onClick={() => removeItem(i)} className="p-1 text-red-500 hover:bg-red-50 rounded">
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>
                    ))}
                    <div className="flex justify-between pt-2 border-t font-bold">
                      <span>Total</span>
                      <span className="text-green-600">
                        ₹{newBill.items.reduce((sum, i) => sum + i.amount, 0).toLocaleString()}
                      </span>
                    </div>
                  </div>
                )}

                {/* Remarks */}
                <div className="space-y-2">
                  <Label>Remarks (Optional)</Label>
                  <Textarea
                    placeholder="Any additional notes"
                    value={newBill.remarks}
                    onChange={(e) => setNewBill({...newBill, remarks: e.target.value})}
                  />
                </div>
              </div>
              <DialogFooter>
                <DialogClose asChild>
                  <Button variant="outline">Cancel</Button>
                </DialogClose>
                <Button onClick={handleSubmit} className="bg-[#1E2A5E] hover:bg-[#2D3A8C]">
                  Submit for Approval
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="w-12 h-12 bg-yellow-100 rounded-xl flex items-center justify-center">
              <Receipt size={24} className="text-yellow-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-800">{pendingCount}</p>
              <p className="text-sm text-gray-500">Pending Approvals</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
              <IndianRupee size={24} className="text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-800">₹{totalPending.toLocaleString()}</p>
              <p className="text-sm text-gray-500">Pending Amount</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
              <Check size={24} className="text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-800">₹{totalApproved.toLocaleString()}</p>
              <p className="text-sm text-gray-500">Approved Total</p>
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

      {/* Bills List */}
      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-8 text-center text-gray-500">Loading...</div>
          ) : bills.length === 0 ? (
            <div className="p-8 text-center text-gray-500">No bill submissions found</div>
          ) : (
            <div className="divide-y">
              {bills.map((bill) => (
                <div key={bill.id} className="p-4 hover:bg-gray-50">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white font-bold text-sm">
                        {bill.emp_name?.split(' ').map(n => n[0]).join('')}
                      </div>
                      <div>
                        <p className="font-semibold">{bill.emp_name}</p>
                        <p className="text-xs text-gray-500">{bill.month} {bill.year}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className={`text-xs px-3 py-1 rounded-full font-medium ${
                        bill.status === 'approved' ? 'bg-green-100 text-green-700' :
                        bill.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                        'bg-red-100 text-red-700'
                      }`}>
                        {bill.status}
                      </span>
                      <p className="text-lg font-bold mt-1">₹{bill.total_amount.toLocaleString()}</p>
                    </div>
                  </div>
                  
                  {/* Items Preview */}
                  <div className="mt-3 space-y-1">
                    {bill.items?.slice(0, 3).map((item, i) => (
                      <div key={i} className="flex items-center justify-between text-sm px-2 py-1 bg-gray-50 rounded">
                        <div className="flex items-center gap-2">
                          <Calendar size={12} className="text-gray-400" />
                          <span>{item.date}</span>
                          <MapPin size={12} className="text-gray-400" />
                          <span>{item.location}</span>
                        </div>
                        <span className="font-medium">₹{item.amount}</span>
                      </div>
                    ))}
                    {bill.items?.length > 3 && (
                      <p className="text-xs text-gray-500 text-center">+{bill.items.length - 3} more items</p>
                    )}
                  </div>

                  {/* Actions for Team Lead/Admin */}
                  {(isAdmin || isTeamLead) && bill.status === 'pending' && (
                    <div className="flex gap-2 mt-3 pt-3 border-t">
                      <Button
                        size="sm"
                        className="bg-green-500 hover:bg-green-600"
                        onClick={() => {
                          setApproveDialog({ open: true, bill });
                          setApprovedAmount(bill.total_amount);
                        }}
                      >
                        <Check size={14} className="mr-1" /> Approve
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-red-500 border-red-200 hover:bg-red-50"
                        onClick={() => handleReject(bill.id)}
                      >
                        <X size={14} className="mr-1" /> Reject
                      </Button>
                    </div>
                  )}

                  {/* Approved Info */}
                  {bill.status === 'approved' && (
                    <div className="mt-2 pt-2 border-t text-sm text-green-600">
                      Approved: ₹{bill.approved_amount?.toLocaleString()} on {bill.approved_on}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Approve Dialog */}
      <Dialog open={approveDialog.open} onOpenChange={(open) => setApproveDialog({ open, bill: null })}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Approve Bill Submission</DialogTitle>
          </DialogHeader>
          <div className="py-4 space-y-4">
            <div>
              <p className="text-sm text-gray-500">Submitted Amount</p>
              <p className="text-2xl font-bold">₹{approveDialog.bill?.total_amount?.toLocaleString()}</p>
            </div>
            <div className="space-y-2">
              <Label>Approved Amount</Label>
              <Input
                type="number"
                value={approvedAmount}
                onChange={(e) => setApprovedAmount(parseFloat(e.target.value) || 0)}
              />
              <p className="text-xs text-gray-500">
                This amount will be added to the employee's salary
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setApproveDialog({ open: false, bill: null })}>
              Cancel
            </Button>
            <Button className="bg-green-500 hover:bg-green-600" onClick={handleApprove}>
              Confirm Approval
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default BillSubmission;
