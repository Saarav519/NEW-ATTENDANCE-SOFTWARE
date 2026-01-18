import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { auditExpenseAPI } from '../services/api';
import { Card, CardContent } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from '../components/ui/select';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter
} from '../components/ui/dialog';
import {
  Plane, Car, Utensils, Hotel, MoreHorizontal, Plus, Trash2,
  CheckCircle, XCircle, Clock, Calendar, MapPin, FileText, IndianRupee, AlertCircle
} from 'lucide-react';
import toast from 'react-hot-toast';

const EXPENSE_CATEGORIES = [
  { value: 'tickets', label: 'Tickets (Flight/Train/Bus)', icon: Plane },
  { value: 'travel', label: 'Travel (Local/Cab)', icon: Car },
  { value: 'food', label: 'Food', icon: Utensils },
  { value: 'hotel', label: 'Hotel/Accommodation', icon: Hotel },
  { value: 'other', label: 'Other', icon: MoreHorizontal },
];

const getCategoryIcon = (category) => {
  const cat = EXPENSE_CATEGORIES.find(c => c.value === category);
  return cat ? cat.icon : MoreHorizontal;
};

const getCategoryLabel = (category) => {
  const cat = EXPENSE_CATEGORIES.find(c => c.value === category);
  return cat ? cat.label : category;
};

const getStatusBadge = (status) => {
  switch (status) {
    case 'approved':
      return <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700 flex items-center gap-1"><CheckCircle size={12} /> Approved</span>;
    case 'partially_approved':
      return <span className="px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-700 flex items-center gap-1"><AlertCircle size={12} /> Partial</span>;
    case 'rejected':
      return <span className="px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-700 flex items-center gap-1"><XCircle size={12} /> Rejected</span>;
    default:
      return <span className="px-2 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-700 flex items-center gap-1"><Clock size={12} /> Pending</span>;
  }
};

const AuditExpenses = () => {
  const { user, isAdmin } = useAuth();
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showDetailDialog, setShowDetailDialog] = useState(false);
  const [selectedExpense, setSelectedExpense] = useState(null);
  const [filter, setFilter] = useState('all');
  
  // New expense form state
  const [tripPurpose, setTripPurpose] = useState('');
  const [tripLocation, setTripLocation] = useState('');
  const [tripStartDate, setTripStartDate] = useState('');
  const [tripEndDate, setTripEndDate] = useState('');
  const [remarks, setRemarks] = useState('');
  const [expenseItems, setExpenseItems] = useState([
    { date: '', category: 'tickets', location: '', amount: '', description: '' }
  ]);

  // Admin approval state
  const [approvalAmount, setApprovalAmount] = useState('');
  const [rejectReason, setRejectReason] = useState('');

  useEffect(() => {
    loadExpenses();
  }, [user?.id, filter, isAdmin]);

  const loadExpenses = async () => {
    if (!user?.id) return;
    setLoading(true);
    try {
      const status = filter !== 'all' ? filter : undefined;
      // Admin sees all, Team Lead sees only their own
      const empId = isAdmin ? undefined : user.id;
      const data = await auditExpenseAPI.getAll(empId, status);
      setExpenses(data);
    } catch (error) {
      console.error('Error loading expenses:', error);
      toast.error('Failed to load expenses');
    } finally {
      setLoading(false);
    }
  };

  const addExpenseItem = () => {
    setExpenseItems([...expenseItems, { date: '', category: 'tickets', location: '', amount: '', description: '' }]);
  };

  const removeExpenseItem = (index) => {
    if (expenseItems.length > 1) {
      setExpenseItems(expenseItems.filter((_, i) => i !== index));
    }
  };

  const updateExpenseItem = (index, field, value) => {
    const updated = [...expenseItems];
    updated[index][field] = value;
    setExpenseItems(updated);
  };

  const getTotalAmount = () => {
    return expenseItems.reduce((sum, item) => sum + (parseFloat(item.amount) || 0), 0);
  };

  const resetForm = () => {
    setTripPurpose('');
    setTripLocation('');
    setTripStartDate('');
    setTripEndDate('');
    setRemarks('');
    setExpenseItems([{ date: '', category: 'tickets', location: '', amount: '', description: '' }]);
  };

  const handleSubmit = async () => {
    if (!tripPurpose || !tripLocation || !tripStartDate || !tripEndDate) {
      toast.error('Please fill in trip details');
      return;
    }

    const validItems = expenseItems.filter(item => item.date && item.amount && item.description);
    if (validItems.length === 0) {
      toast.error('Please add at least one expense item');
      return;
    }

    try {
      const expenseData = {
        trip_purpose: tripPurpose,
        trip_location: tripLocation,
        trip_start_date: tripStartDate,
        trip_end_date: tripEndDate,
        remarks: remarks || null,
        items: validItems.map(item => ({
          date: item.date,
          category: item.category,
          location: item.location || tripLocation,
          amount: parseFloat(item.amount),
          description: item.description,
          receipt_url: null
        }))
      };

      await auditExpenseAPI.create(expenseData, user.id);
      toast.success('Expense submitted successfully');
      setShowAddDialog(false);
      resetForm();
      loadExpenses();
    } catch (error) {
      console.error('Error submitting expense:', error);
      toast.error('Failed to submit expense');
    }
  };

  const handleApprove = async (expenseId, amount) => {
    try {
      await auditExpenseAPI.approve(expenseId, user.id, amount);
      toast.success('Expense approved');
      setShowDetailDialog(false);
      setSelectedExpense(null);
      setApprovalAmount('');
      loadExpenses();
    } catch (error) {
      console.error('Error approving expense:', error);
      toast.error('Failed to approve expense');
    }
  };

  const handleReject = async (expenseId) => {
    try {
      await auditExpenseAPI.reject(expenseId, user.id, rejectReason);
      toast.success('Expense rejected');
      setShowDetailDialog(false);
      setSelectedExpense(null);
      setRejectReason('');
      loadExpenses();
    } catch (error) {
      console.error('Error rejecting expense:', error);
      toast.error('Failed to reject expense');
    }
  };

  const handleDelete = async (expenseId) => {
    if (!window.confirm('Are you sure you want to delete this expense?')) return;
    try {
      await auditExpenseAPI.delete(expenseId);
      toast.success('Expense deleted');
      loadExpenses();
    } catch (error) {
      console.error('Error deleting expense:', error);
      toast.error('Failed to delete expense');
    }
  };

  const openDetail = (expense) => {
    setSelectedExpense(expense);
    setApprovalAmount(expense.total_amount?.toString() || '');
    setShowDetailDialog(true);
  };

  // Stats
  const pendingCount = expenses.filter(e => e.status === 'pending').length;
  const approvedTotal = expenses.filter(e => e.status === 'approved' || e.status === 'partially_approved')
    .reduce((sum, e) => sum + (e.approved_amount || 0), 0);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin w-8 h-8 border-4 border-[#1E2A5E] border-t-transparent rounded-full"></div>
      </div>
    );
  }

  return (
    <div className="space-y-4" data-testid="audit-expenses-page">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl lg:text-2xl font-bold text-gray-800">
            {isAdmin ? 'Audit Expense Approvals' : 'Audit Expenses'}
          </h1>
          <p className="text-sm text-gray-500">
            {isAdmin ? 'Review and approve team audit expenses' : 'Submit and track your audit/travel expenses'}
          </p>
        </div>
        {!isAdmin && (
          <Button 
            onClick={() => setShowAddDialog(true)}
            className="bg-[#1E2A5E] hover:bg-[#2D3A8C]"
            data-testid="submit-expense-btn"
          >
            <Plus size={18} className="mr-2" /> Submit Expense
          </Button>
        )}
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center">
                <FileText size={20} className="text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-800">{expenses.length}</p>
                <p className="text-xs text-gray-500">Total Submissions</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-orange-100 flex items-center justify-center">
                <Clock size={20} className="text-orange-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-800">{pendingCount}</p>
                <p className="text-xs text-gray-500">Pending</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="col-span-2">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-green-100 flex items-center justify-center">
                <IndianRupee size={20} className="text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-green-600">₹{approvedTotal.toLocaleString()}</p>
                <p className="text-xs text-gray-500">Total Approved</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filter */}
      <div className="flex gap-2">
        {['all', 'pending', 'approved', 'rejected'].map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
              filter === f
                ? 'bg-[#1E2A5E] text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {f.charAt(0).toUpperCase() + f.slice(1)}
          </button>
        ))}
      </div>

      {/* Expense List */}
      <div className="space-y-3">
        {expenses.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <Plane size={48} className="mx-auto text-gray-300 mb-4" />
              <p className="text-gray-500">No audit expenses found</p>
              {!isAdmin && (
                <p className="text-sm text-gray-400 mt-2">
                  Submit your first audit expense to get started
                </p>
              )}
            </CardContent>
          </Card>
        ) : (
          expenses.map((expense) => (
            <Card 
              key={expense.id} 
              className="cursor-pointer hover:shadow-md transition-shadow"
              onClick={() => openDetail(expense)}
              data-testid={`expense-card-${expense.id}`}
            >
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#1E2A5E] to-blue-500 flex items-center justify-center text-white">
                      <Plane size={24} />
                    </div>
                    <div>
                      <p className="font-semibold text-gray-800">{expense.trip_purpose}</p>
                      <div className="flex items-center gap-2 text-xs text-gray-500 mt-1">
                        <MapPin size={12} />
                        <span>{expense.trip_location}</span>
                        <span>•</span>
                        <Calendar size={12} />
                        <span>{expense.trip_start_date} - {expense.trip_end_date}</span>
                      </div>
                      {isAdmin && (
                        <p className="text-xs text-gray-500 mt-1">
                          Submitted by: <span className="font-medium">{expense.emp_name}</span>
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    {getStatusBadge(expense.status)}
                    <p className="text-lg font-bold text-gray-800 mt-2">₹{expense.total_amount?.toLocaleString()}</p>
                    {(expense.status === 'approved' || expense.status === 'partially_approved') && (
                      <p className="text-xs text-green-600">
                        Approved: ₹{expense.approved_amount?.toLocaleString()}
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex gap-2 mt-3 flex-wrap">
                  {expense.items?.slice(0, 4).map((item, idx) => {
                    const IconComp = getCategoryIcon(item.category);
                    return (
                      <span key={idx} className="px-2 py-1 rounded-full text-xs bg-gray-100 text-gray-600 flex items-center gap-1">
                        <IconComp size={12} />
                        {getCategoryLabel(item.category)}
                      </span>
                    );
                  })}
                  {expense.items?.length > 4 && (
                    <span className="px-2 py-1 rounded-full text-xs bg-gray-100 text-gray-600">
                      +{expense.items.length - 4} more
                    </span>
                  )}
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Add Expense Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Submit Audit Expense</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            {/* Trip Details */}
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2">
                <Label>Trip Purpose *</Label>
                <Input
                  value={tripPurpose}
                  onChange={(e) => setTripPurpose(e.target.value)}
                  placeholder="e.g., Client Audit - ABC Corp"
                  data-testid="trip-purpose-input"
                />
              </div>
              <div className="col-span-2">
                <Label>Trip Location *</Label>
                <Input
                  value={tripLocation}
                  onChange={(e) => setTripLocation(e.target.value)}
                  placeholder="e.g., Mumbai"
                  data-testid="trip-location-input"
                />
              </div>
              <div>
                <Label>Start Date *</Label>
                <Input
                  type="date"
                  value={tripStartDate}
                  onChange={(e) => setTripStartDate(e.target.value)}
                  data-testid="trip-start-date-input"
                />
              </div>
              <div>
                <Label>End Date *</Label>
                <Input
                  type="date"
                  value={tripEndDate}
                  onChange={(e) => setTripEndDate(e.target.value)}
                  data-testid="trip-end-date-input"
                />
              </div>
            </div>

            {/* Expense Items */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <Label>Expense Items</Label>
                <Button variant="outline" size="sm" onClick={addExpenseItem}>
                  <Plus size={14} className="mr-1" /> Add Item
                </Button>
              </div>
              
              <div className="space-y-3">
                {expenseItems.map((item, index) => (
                  <div key={index} className="p-3 bg-gray-50 rounded-xl space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-medium text-gray-500">Item {index + 1}</span>
                      {expenseItems.length > 1 && (
                        <button
                          onClick={() => removeExpenseItem(index)}
                          className="p-1 text-red-500 hover:bg-red-50 rounded"
                        >
                          <Trash2 size={14} />
                        </button>
                      )}
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <Input
                        type="date"
                        value={item.date}
                        onChange={(e) => updateExpenseItem(index, 'date', e.target.value)}
                        placeholder="Date"
                      />
                      <Select
                        value={item.category}
                        onValueChange={(val) => updateExpenseItem(index, 'category', val)}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {EXPENSE_CATEGORIES.map(cat => (
                            <SelectItem key={cat.value} value={cat.value}>
                              {cat.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Input
                        type="number"
                        value={item.amount}
                        onChange={(e) => updateExpenseItem(index, 'amount', e.target.value)}
                        placeholder="Amount (₹)"
                      />
                      <Input
                        value={item.location}
                        onChange={(e) => updateExpenseItem(index, 'location', e.target.value)}
                        placeholder="Location (optional)"
                      />
                      <Input
                        className="col-span-2"
                        value={item.description}
                        onChange={(e) => updateExpenseItem(index, 'description', e.target.value)}
                        placeholder="Description *"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Total */}
            <div className="flex items-center justify-between p-3 bg-[#1E2A5E] text-white rounded-xl">
              <span className="font-medium">Total Amount</span>
              <span className="text-xl font-bold">₹{getTotalAmount().toLocaleString()}</span>
            </div>

            {/* Remarks */}
            <div>
              <Label>Remarks (Optional)</Label>
              <Textarea
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
                placeholder="Any additional notes..."
                rows={2}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => { setShowAddDialog(false); resetForm(); }}>
              Cancel
            </Button>
            <Button 
              onClick={handleSubmit}
              className="bg-[#1E2A5E] hover:bg-[#2D3A8C]"
              data-testid="submit-expense-confirm-btn"
            >
              Submit Expense
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Detail/Approval Dialog */}
      <Dialog open={showDetailDialog} onOpenChange={setShowDetailDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Expense Details</DialogTitle>
          </DialogHeader>
          
          {selectedExpense && (
            <div className="space-y-4">
              {/* Trip Info */}
              <div className="p-4 bg-gradient-to-br from-[#1E2A5E] to-blue-500 rounded-xl text-white">
                <p className="text-lg font-semibold">{selectedExpense.trip_purpose}</p>
                <div className="flex items-center gap-4 mt-2 text-sm text-white/80">
                  <span className="flex items-center gap-1"><MapPin size={14} /> {selectedExpense.trip_location}</span>
                  <span className="flex items-center gap-1">
                    <Calendar size={14} /> {selectedExpense.trip_start_date} to {selectedExpense.trip_end_date}
                  </span>
                </div>
                {isAdmin && (
                  <p className="mt-2 text-sm text-white/80">
                    Submitted by: <span className="font-medium">{selectedExpense.emp_name}</span> ({selectedExpense.emp_id})
                  </p>
                )}
              </div>

              {/* Status */}
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Status:</span>
                {getStatusBadge(selectedExpense.status)}
              </div>

              {/* Items */}
              <div>
                <p className="text-sm font-medium text-gray-700 mb-2">Expense Items</p>
                <div className="space-y-2">
                  {selectedExpense.items?.map((item, idx) => {
                    const IconComp = getCategoryIcon(item.category);
                    return (
                      <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-gray-200 flex items-center justify-center">
                            <IconComp size={16} className="text-gray-600" />
                          </div>
                          <div>
                            <p className="text-sm font-medium">{item.description}</p>
                            <p className="text-xs text-gray-500">
                              {item.date} • {item.location || selectedExpense.trip_location}
                            </p>
                          </div>
                        </div>
                        <span className="font-semibold">₹{item.amount?.toLocaleString()}</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Total */}
              <div className="flex items-center justify-between p-3 bg-gray-100 rounded-xl">
                <span className="font-medium">Total Claimed</span>
                <span className="text-xl font-bold">₹{selectedExpense.total_amount?.toLocaleString()}</span>
              </div>

              {/* Approved Amount (if approved) */}
              {(selectedExpense.status === 'approved' || selectedExpense.status === 'partially_approved') && (
                <div className="flex items-center justify-between p-3 bg-green-50 rounded-xl">
                  <span className="font-medium text-green-700">Approved Amount</span>
                  <span className="text-xl font-bold text-green-600">₹{selectedExpense.approved_amount?.toLocaleString()}</span>
                </div>
              )}

              {/* Rejection Reason */}
              {selectedExpense.status === 'rejected' && selectedExpense.rejection_reason && (
                <div className="p-3 bg-red-50 rounded-xl">
                  <p className="text-sm font-medium text-red-700">Rejection Reason:</p>
                  <p className="text-sm text-red-600">{selectedExpense.rejection_reason}</p>
                </div>
              )}

              {/* Remarks */}
              {selectedExpense.remarks && (
                <div className="p-3 bg-gray-50 rounded-xl">
                  <p className="text-sm font-medium text-gray-700">Remarks:</p>
                  <p className="text-sm text-gray-600">{selectedExpense.remarks}</p>
                </div>
              )}

              {/* Admin Actions */}
              {isAdmin && selectedExpense.status === 'pending' && (
                <div className="space-y-3 pt-4 border-t">
                  <div>
                    <Label>Approved Amount (₹)</Label>
                    <Input
                      type="number"
                      value={approvalAmount}
                      onChange={(e) => setApprovalAmount(e.target.value)}
                      placeholder="Enter amount to approve"
                      data-testid="approval-amount-input"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Leave as is to approve full amount, or enter a different amount for partial approval
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      className="flex-1 bg-green-600 hover:bg-green-700"
                      onClick={() => handleApprove(selectedExpense.id, parseFloat(approvalAmount))}
                      data-testid="approve-expense-btn"
                    >
                      <CheckCircle size={16} className="mr-2" /> Approve
                    </Button>
                    <Button
                      variant="outline"
                      className="flex-1 text-red-600 border-red-200 hover:bg-red-50"
                      onClick={() => handleReject(selectedExpense.id)}
                      data-testid="reject-expense-btn"
                    >
                      <XCircle size={16} className="mr-2" /> Reject
                    </Button>
                  </div>
                  <div>
                    <Label>Rejection Reason (if rejecting)</Label>
                    <Input
                      value={rejectReason}
                      onChange={(e) => setRejectReason(e.target.value)}
                      placeholder="Reason for rejection"
                    />
                  </div>
                </div>
              )}

              {/* Delete for pending (non-admin) */}
              {!isAdmin && selectedExpense.status === 'pending' && (
                <Button
                  variant="outline"
                  className="w-full text-red-600 border-red-200 hover:bg-red-50"
                  onClick={() => { handleDelete(selectedExpense.id); setShowDetailDialog(false); }}
                >
                  <Trash2 size={16} className="mr-2" /> Delete Expense
                </Button>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AuditExpenses;
