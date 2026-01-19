import React, { useState, useEffect } from 'react';
import { billAPI, advanceAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Receipt, Plus, Check, X, IndianRupee, MapPin, Calendar, FileText, Trash2, Wallet, Clock, Loader2, RefreshCw, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 
                'July', 'August', 'September', 'October', 'November', 'December'];
const currentYear = new Date().getFullYear();
const YEARS = [currentYear, currentYear + 1];

const BillSubmission = () => {
  const { user, isAdmin, isTeamLead } = useAuth();
  const [activeTab, setActiveTab] = useState('bills');
  
  // Bills state
  const [bills, setBills] = useState([]);
  const [isAddBillDialogOpen, setIsAddBillDialogOpen] = useState(false);
  const [billFilterStatus, setBillFilterStatus] = useState('all');
  const [billsLoading, setBillsLoading] = useState(true);
  const [approveDialog, setApproveDialog] = useState({ open: false, bill: null });
  const [approvedAmount, setApprovedAmount] = useState(0);
  const [sendToRevalidation, setSendToRevalidation] = useState(false);
  
  // Revalidate dialog state
  const [revalidateDialog, setRevalidateDialog] = useState({ open: false, bill: null });
  const [additionalAmount, setAdditionalAmount] = useState(0);
  
  // Advances state
  const [advances, setAdvances] = useState([]);
  const [isAddAdvanceDialogOpen, setIsAddAdvanceDialogOpen] = useState(false);
  const [advanceFilterStatus, setAdvanceFilterStatus] = useState('all');
  const [advancesLoading, setAdvancesLoading] = useState(true);
  const [submittingAdvance, setSubmittingAdvance] = useState(false);
  
  const currentDate = new Date();
  
  const [newBill, setNewBill] = useState({
    month: MONTHS[currentDate.getMonth()],
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

  const [newAdvance, setNewAdvance] = useState({
    amount: '',
    reason: '',
    deductFromMonth: MONTHS[currentDate.getMonth()],
    deductFromYear: currentYear.toString()
  });

  useEffect(() => {
    loadBills();
    loadAdvances();
  }, [user?.id]);

  // =============== BILLS FUNCTIONS ===============
  const loadBills = async () => {
    try {
      setBillsLoading(true);
      let data;
      if (isAdmin || isTeamLead) {
        data = await billAPI.getAll(null, billFilterStatus === 'all' ? null : billFilterStatus);
      } else {
        data = await billAPI.getAll(user?.id, billFilterStatus === 'all' ? null : billFilterStatus);
      }
      setBills(data || []);
    } catch (error) {
      console.error('Error loading bills:', error);
    } finally {
      setBillsLoading(false);
    }
  };

  useEffect(() => {
    if (user?.id) loadBills();
  }, [billFilterStatus]);

  const addItem = () => {
    if (!newItem.date || !newItem.location || !newItem.amount) {
      toast.error('Please fill date, location and amount');
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
      toast.error('File size must be less than 5MB');
      return;
    }
    
    if (file.type !== 'application/pdf') {
      toast.error('Only PDF files are allowed');
      return;
    }
    
    try {
      const result = await billAPI.uploadAttachment(file);
      setNewItem({
        ...newItem,
        has_attachment: true,
        attachment_url: result.url
      });
      toast.success('File uploaded');
    } catch (error) {
      toast.error(error.message || 'Failed to upload file');
    }
  };

  const handleSubmitBill = async () => {
    if (newBill.items.length === 0) {
      toast.error('Please add at least one expense item');
      return;
    }
    
    try {
      await billAPI.create(newBill, user.id, user.name);
      setNewBill({
        month: MONTHS[currentDate.getMonth()],
        year: currentDate.getFullYear(),
        remarks: '',
        items: []
      });
      setIsAddBillDialogOpen(false);
      toast.success('Bill submitted successfully');
      loadBills();
    } catch (error) {
      toast.error(error.message || 'Failed to submit bill');
    }
  };

  const handleApproveBill = async () => {
    try {
      const totalAmount = approveDialog.bill?.total_amount || 0;
      const isPartial = approvedAmount < totalAmount;
      
      // If partial and sendToRevalidation is checked, send for revalidation
      await billAPI.approve(approveDialog.bill.id, user.id, approvedAmount, isPartial && sendToRevalidation);
      setApproveDialog({ open: false, bill: null });
      setSendToRevalidation(false);
      
      if (isPartial && sendToRevalidation) {
        toast.success(`Bill partially approved (₹${approvedAmount.toLocaleString()}). Remaining sent for revalidation.`);
      } else {
        toast.success(`Bill approved for ₹${approvedAmount.toLocaleString()}`);
      }
      loadBills();
    } catch (error) {
      toast.error(error.message || 'Failed to approve bill');
    }
  };

  const handleRevalidateBill = async () => {
    try {
      await billAPI.revalidate(revalidateDialog.bill.id, user.id, additionalAmount);
      setRevalidateDialog({ open: false, bill: null });
      setAdditionalAmount(0);
      toast.success('Bill revalidated successfully');
      loadBills();
    } catch (error) {
      toast.error(error.message || 'Failed to revalidate bill');
    }
  };

  const handleRejectBill = async (billId) => {
    try {
      await billAPI.reject(billId, user.id);
      toast.success('Bill rejected');
      loadBills();
    } catch (error) {
      toast.error(error.message || 'Failed to reject bill');
    }
  };

  // =============== ADVANCES FUNCTIONS ===============
  const loadAdvances = async () => {
    if (!user?.id) return;
    setAdvancesLoading(true);
    try {
      // Admin sees all advances, employees/teamleads see their own
      const data = await advanceAPI.getAll(isAdmin ? null : user.id);
      setAdvances(data || []);
    } catch (error) {
      console.error('Error loading advances:', error);
    } finally {
      setAdvancesLoading(false);
    }
  };

  const handleApproveAdvance = async (advanceId) => {
    try {
      await advanceAPI.approve(advanceId, user.id);
      toast.success('Advance approved');
      loadAdvances();
    } catch (error) {
      console.error('Error approving advance:', error);
      toast.error('Failed to approve advance');
    }
  };

  const handleRejectAdvance = async (advanceId) => {
    try {
      await advanceAPI.reject(advanceId, user.id);
      toast.success('Advance rejected');
      loadAdvances();
    } catch (error) {
      console.error('Error rejecting advance:', error);
      toast.error('Failed to reject advance');
    }
  };

  const handleSubmitAdvance = async () => {
    if (!newAdvance.amount || !newAdvance.reason || !newAdvance.deductFromMonth || !newAdvance.deductFromYear) {
      toast.error('Please fill all required fields');
      return;
    }

    setSubmittingAdvance(true);
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
      setNewAdvance({ amount: '', reason: '', deductFromMonth: MONTHS[currentDate.getMonth()], deductFromYear: currentYear.toString() });
      setIsAddAdvanceDialogOpen(false);
      loadAdvances();
    } catch (error) {
      console.error('Error creating advance:', error);
      toast.error('Failed to submit advance request');
    } finally {
      setSubmittingAdvance(false);
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
      case 'revalidation':
        return <span className="px-2 py-1 text-xs rounded-full bg-orange-100 text-orange-700 flex items-center gap-1">
          <RefreshCw size={10} /> Revalidation
        </span>;
      default:
        return <span className="px-2 py-1 text-xs rounded-full bg-yellow-100 text-yellow-700">Pending</span>;
    }
  };

  const getBillStatusBadge = (bill) => {
    const status = bill.status;
    switch (status) {
      case 'approved':
        return <span className="px-3 py-1 text-xs rounded-full font-medium bg-green-100 text-green-700">Approved</span>;
      case 'rejected':
        return <span className="px-3 py-1 text-xs rounded-full font-medium bg-red-100 text-red-700">Rejected</span>;
      case 'revalidation':
        return (
          <span className="px-3 py-1 text-xs rounded-full font-medium bg-orange-100 text-orange-700 flex items-center gap-1">
            <RefreshCw size={12} /> Needs Revalidation
          </span>
        );
      default:
        return <span className="px-3 py-1 text-xs rounded-full font-medium bg-yellow-100 text-yellow-700">Pending</span>;
    }
  };

  // Stats calculations
  const pendingBillsCount = bills.filter(b => b.status === 'pending').length;
  const revalidationBillsCount = bills.filter(b => b.status === 'revalidation').length;
  const totalApprovedBills = bills.filter(b => b.status === 'approved').reduce((sum, b) => sum + (b.approved_amount || 0), 0);
  const totalPendingBills = bills.filter(b => b.status === 'pending').reduce((sum, b) => sum + b.total_amount, 0);
  const totalRevalidationBills = bills.filter(b => b.status === 'revalidation').reduce((sum, b) => sum + (b.remaining_balance || 0), 0);
  
  const pendingAdvances = advances.filter(a => a.status === 'pending').reduce((sum, a) => sum + (a.amount || 0), 0);
  const approvedAdvances = advances.filter(a => a.status === 'approved' && !a.is_deducted).reduce((sum, a) => sum + (a.amount || 0), 0);

  const filteredAdvances = advances.filter(adv => {
    return advanceFilterStatus === 'all' || adv.status === advanceFilterStatus;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Bills & Advances</h1>
          <p className="text-gray-500">
            {isAdmin ? 'Manage expense submissions' : 'Submit your expenses and request advances'}
          </p>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2 mb-4">
          <TabsTrigger value="bills" className="flex items-center gap-2">
            <Receipt size={16} /> Bills
          </TabsTrigger>
          <TabsTrigger value="advances" className="flex items-center gap-2">
            <Wallet size={16} /> Advances
          </TabsTrigger>
        </TabsList>

        {/* =============== BILLS TAB =============== */}
        <TabsContent value="bills" className="space-y-4">
          {/* Submit Bill Button */}
          {!isAdmin && (
            <div className="flex justify-end">
              <Dialog open={isAddBillDialogOpen} onOpenChange={setIsAddBillDialogOpen}>
                <DialogTrigger asChild>
                  <Button className="bg-[#1E2A5E] hover:bg-[#2D3A8C]" data-testid="submit-expenses-btn">
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
                            {MONTHS.map(m => <SelectItem key={m} value={m}>{m}</SelectItem>)}
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
                      <Button onClick={addItem} variant="outline" size="sm" className="mt-3 w-full">
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
                    <Button onClick={handleSubmitBill} className="bg-[#1E2A5E] hover:bg-[#2D3A8C]">
                      Submit for Approval
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          )}

          {/* Bills Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-4 flex items-center gap-4">
                <div className="w-12 h-12 bg-yellow-100 rounded-xl flex items-center justify-center">
                  <Receipt size={24} className="text-yellow-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-800">{pendingBillsCount}</p>
                  <p className="text-sm text-gray-500">Pending</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 flex items-center gap-4">
                <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center">
                  <RefreshCw size={24} className="text-orange-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-800">{revalidationBillsCount}</p>
                  <p className="text-sm text-gray-500">Revalidation</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 flex items-center gap-4">
                <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                  <IndianRupee size={24} className="text-blue-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-800">₹{totalPendingBills.toLocaleString()}</p>
                  <p className="text-sm text-gray-500">Pending Amt</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 flex items-center gap-4">
                <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                  <Check size={24} className="text-green-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-800">₹{totalApprovedBills.toLocaleString()}</p>
                  <p className="text-sm text-gray-500">Approved</p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Filter */}
          <Card>
            <CardContent className="p-4">
              <Select value={billFilterStatus} onValueChange={setBillFilterStatus}>
                <SelectTrigger className="w-48" data-testid="bill-filter-select">
                  <SelectValue placeholder="Filter" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Bills</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="revalidation">Revalidation</SelectItem>
                  <SelectItem value="approved">Approved</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                </SelectContent>
              </Select>
            </CardContent>
          </Card>

          {/* Bills List */}
          <Card>
            <CardContent className="p-0">
              {billsLoading ? (
                <div className="p-8 text-center text-gray-500">Loading...</div>
              ) : bills.length === 0 ? (
                <div className="p-8 text-center text-gray-500">
                  <Receipt className="h-12 w-12 mx-auto text-gray-300 mb-3" />
                  <p>No bill submissions found</p>
                </div>
              ) : (
                <div className="divide-y">
                  {bills.map((bill) => (
                    <div 
                      key={bill.id} 
                      className={`p-4 hover:bg-gray-50 ${bill.status === 'revalidation' ? 'bg-orange-50 border-l-4 border-orange-400' : ''}`}
                      data-testid={`bill-card-${bill.id}`}
                    >
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
                          {getBillStatusBadge(bill)}
                          <p className="text-lg font-bold mt-1">₹{bill.total_amount?.toLocaleString()}</p>
                        </div>
                      </div>
                      
                      {/* Amount breakdown for partial approvals */}
                      {(bill.approved_amount > 0 || bill.remaining_balance > 0) && (
                        <div className="mt-2 p-2 bg-gray-100 rounded-lg text-sm grid grid-cols-2 gap-2">
                          <div>
                            <span className="text-gray-500">Approved:</span>
                            <span className="font-medium text-green-600 ml-1">₹{(bill.approved_amount || 0).toLocaleString()}</span>
                          </div>
                          {bill.remaining_balance > 0 && (
                            <div>
                              <span className="text-gray-500">Remaining:</span>
                              <span className="font-medium text-orange-600 ml-1">₹{bill.remaining_balance.toLocaleString()}</span>
                            </div>
                          )}
                        </div>
                      )}
                      
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

                      {/* Actions for Admin - Pending Bills: 3 Clear Options */}
                      {isAdmin && bill.status === 'pending' && (
                        <div className="flex flex-wrap gap-2 mt-3 pt-3 border-t">
                          <Button
                            size="sm"
                            className="bg-green-500 hover:bg-green-600"
                            data-testid={`approve-btn-${bill.id}`}
                            onClick={() => {
                              setApproveDialog({ open: true, bill });
                              setApprovedAmount(bill.total_amount);
                            }}
                          >
                            <Check size={14} className="mr-1" /> Approve
                          </Button>
                          <Button
                            size="sm"
                            className="bg-orange-500 hover:bg-orange-600"
                            data-testid={`revalidate-btn-${bill.id}`}
                            onClick={() => {
                              setApproveDialog({ open: true, bill, isRevalidation: true });
                              setApprovedAmount(0);
                            }}
                          >
                            <RefreshCw size={14} className="mr-1" /> Revalidate
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-red-500 border-red-200 hover:bg-red-50"
                            onClick={() => handleRejectBill(bill.id)}
                          >
                            <X size={14} className="mr-1" /> Reject
                          </Button>
                        </div>
                      )}

                      {/* Actions for Admin - Revalidation Bills */}
                      {isAdmin && bill.status === 'revalidation' && (
                        <div className="mt-3 pt-3 border-t">
                          <div className="flex items-center gap-2 text-orange-600 text-sm mb-2">
                            <AlertCircle size={16} />
                            <span>This bill needs revalidation. Remaining: ₹{bill.remaining_balance?.toLocaleString()}</span>
                          </div>
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              className="bg-orange-500 hover:bg-orange-600"
                              data-testid={`revalidate-btn-${bill.id}`}
                              onClick={() => {
                                setRevalidateDialog({ open: true, bill });
                                setAdditionalAmount(bill.remaining_balance || 0);
                              }}
                            >
                              <RefreshCw size={14} className="mr-1" /> Revalidate
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="text-red-500 border-red-200 hover:bg-red-50"
                              onClick={() => handleRejectBill(bill.id)}
                            >
                              <X size={14} className="mr-1" /> Reject Remaining
                            </Button>
                          </div>
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
        </TabsContent>

        {/* =============== ADVANCES TAB =============== */}
        <TabsContent value="advances" className="space-y-4">
          {/* Request Advance Button */}
          {!isAdmin && (
            <div className="flex justify-end">
              <Dialog open={isAddAdvanceDialogOpen} onOpenChange={setIsAddAdvanceDialogOpen}>
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
                      onClick={handleSubmitAdvance} 
                      className="bg-[#1E2A5E] hover:bg-[#2D3A8C]"
                      disabled={submittingAdvance}
                    >
                      {submittingAdvance ? (
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
          )}

          {/* Advances Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Card>
              <CardContent className="p-4 flex items-center gap-4">
                <div className="w-12 h-12 bg-yellow-100 rounded-xl flex items-center justify-center">
                  <Clock size={24} className="text-yellow-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-800">₹{pendingAdvances.toLocaleString()}</p>
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
                  <p className="text-2xl font-bold text-gray-800">₹{approvedAdvances.toLocaleString()}</p>
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
                  <p className="text-2xl font-bold text-gray-800">{advances.length}</p>
                  <p className="text-sm text-gray-500">Total Requests</p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Filter */}
          <Card>
            <CardContent className="p-4">
              <Select value={advanceFilterStatus} onValueChange={setAdvanceFilterStatus}>
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

          {/* Advances List */}
          <Card>
            <CardContent className="p-0">
              {advancesLoading ? (
                <div className="p-8 text-center text-gray-500">Loading...</div>
              ) : filteredAdvances.length === 0 ? (
                <div className="p-8 text-center text-gray-500">
                  <Wallet className="h-12 w-12 mx-auto text-gray-300 mb-3" />
                  <p className="font-medium">No advance requests found</p>
                  {!isAdmin && <p className="text-sm mt-1">Click "Request Advance" to create one</p>}
                </div>
              ) : (
                <div className="divide-y">
                  {filteredAdvances.map((adv) => (
                    <div key={adv.id} className="p-4 hover:bg-gray-50">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          {/* Show employee info for Admin */}
                          {isAdmin && (
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-400 to-purple-600 flex items-center justify-center text-white font-bold text-sm">
                                {adv.emp_name?.split(' ').map(n => n[0]).join('') || '?'}
                              </div>
                              <div>
                                <p className="font-medium">{adv.emp_name}</p>
                                <p className="text-xs text-gray-500">{adv.emp_id}</p>
                              </div>
                            </div>
                          )}
                          <div>
                            <p className="font-bold text-xl text-purple-600">₹{adv.amount?.toLocaleString()}</p>
                            <p className="text-sm text-gray-600 mt-1">{adv.reason}</p>
                            <p className="text-xs text-gray-500 mt-1">
                              Requested on {adv.requested_on ? new Date(adv.requested_on).toLocaleDateString() : '-'}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          {getStatusBadge(adv.status, adv.is_deducted)}
                          <p className="text-sm font-medium text-blue-600 mt-2">
                            Deduct from: {adv.deduct_from_month} {adv.deduct_from_year}
                          </p>
                          {adv.is_deducted && (
                            <p className="text-xs text-green-600 mt-1">Deducted on {adv.deducted_on}</p>
                          )}
                        </div>
                      </div>
                      
                      {/* Admin Approve/Reject Actions */}
                      {isAdmin && adv.status === 'pending' && (
                        <div className="flex gap-2 mt-3 pt-3 border-t">
                          <Button
                            size="sm"
                            className="bg-green-500 hover:bg-green-600"
                            onClick={() => handleApproveAdvance(adv.id)}
                          >
                            <Check size={14} className="mr-1" /> Approve
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-red-500 border-red-200 hover:bg-red-50"
                            onClick={() => handleRejectAdvance(adv.id)}
                          >
                            <X size={14} className="mr-1" /> Reject
                          </Button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Approve Bill Dialog */}
      <Dialog open={approveDialog.open} onOpenChange={(open) => { setApproveDialog({ open, bill: null }); setSendToRevalidation(false); }}>
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
                data-testid="approved-amount-input"
              />
              {approvedAmount < (approveDialog.bill?.total_amount || 0) && approvedAmount > 0 && (
                <p className="text-sm text-orange-600 flex items-center gap-1">
                  <AlertCircle size={14} />
                  Partial approval: ₹{((approveDialog.bill?.total_amount || 0) - approvedAmount).toLocaleString()} remaining
                </p>
              )}
            </div>
            
            {/* Revalidation checkbox - only show for partial approvals */}
            {approvedAmount < (approveDialog.bill?.total_amount || 0) && approvedAmount > 0 && (
              <div className="flex items-center space-x-2 p-3 bg-orange-50 border border-orange-200 rounded-lg">
                <Checkbox
                  id="revalidation"
                  checked={sendToRevalidation}
                  onCheckedChange={setSendToRevalidation}
                  data-testid="revalidation-checkbox"
                />
                <label htmlFor="revalidation" className="text-sm font-medium cursor-pointer">
                  Send remaining balance for revalidation
                </label>
              </div>
            )}
            
            <p className="text-xs text-gray-500">
              {sendToRevalidation 
                ? "The approved amount will be added to salary. The remaining will require revalidation before settlement."
                : "This amount will be added to the employee's salary"}
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setApproveDialog({ open: false, bill: null }); setSendToRevalidation(false); }}>
              Cancel
            </Button>
            <Button 
              className="bg-green-500 hover:bg-green-600" 
              onClick={handleApproveBill}
              data-testid="confirm-approve-btn"
            >
              {sendToRevalidation ? 'Approve & Send for Revalidation' : 'Confirm Approval'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Revalidate Bill Dialog */}
      <Dialog open={revalidateDialog.open} onOpenChange={(open) => setRevalidateDialog({ open, bill: null })}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Revalidate Bill</DialogTitle>
          </DialogHeader>
          <div className="py-4 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-500">Total Bill Amount</p>
                <p className="text-lg font-bold">₹{revalidateDialog.bill?.total_amount?.toLocaleString()}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Already Approved</p>
                <p className="text-lg font-bold text-green-600">₹{revalidateDialog.bill?.approved_amount?.toLocaleString()}</p>
              </div>
            </div>
            
            <div className="p-3 bg-orange-50 border border-orange-200 rounded-lg">
              <p className="text-sm text-orange-700">
                <strong>Remaining Balance:</strong> ₹{revalidateDialog.bill?.remaining_balance?.toLocaleString()}
              </p>
            </div>
            
            <div className="space-y-2">
              <Label>Additional Amount to Approve</Label>
              <Input
                type="number"
                value={additionalAmount}
                onChange={(e) => setAdditionalAmount(parseFloat(e.target.value) || 0)}
                max={revalidateDialog.bill?.remaining_balance || 0}
                data-testid="additional-amount-input"
              />
              <p className="text-xs text-gray-500">
                Enter ₹0 to close without additional payment, or enter amount up to ₹{revalidateDialog.bill?.remaining_balance?.toLocaleString()}
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRevalidateDialog({ open: false, bill: null })}>
              Cancel
            </Button>
            <Button 
              className="bg-orange-500 hover:bg-orange-600" 
              onClick={handleRevalidateBill}
              data-testid="confirm-revalidate-btn"
            >
              Complete Revalidation
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default BillSubmission;
