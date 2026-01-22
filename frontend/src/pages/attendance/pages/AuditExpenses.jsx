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
  Plane, Car, Utensils, Hotel, MoreHorizontal, Plus, Trash2, Edit2,
  CheckCircle, XCircle, Clock, Calendar, MapPin, FileText, IndianRupee, 
  AlertCircle, RefreshCw, CreditCard, History
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
      return <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700 flex items-center gap-1"><CheckCircle size={12} /> Fully Paid</span>;
    case 'partially_approved':
      return <span className="px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-700 flex items-center gap-1"><CreditCard size={12} /> Partial</span>;
    case 'rejected':
      return <span className="px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-700 flex items-center gap-1"><XCircle size={12} /> Rejected</span>;
    case 'revalidation':
      return <span className="px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-700 flex items-center gap-1"><RefreshCw size={12} /> Revalidation</span>;
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
  const [isEditMode, setIsEditMode] = useState(false);
  const [isResubmitMode, setIsResubmitMode] = useState(false);
  const [editingExpenseId, setEditingExpenseId] = useState(null);
  
  // Form state
  const [tripPurpose, setTripPurpose] = useState('');
  const [tripLocation, setTripLocation] = useState('');
  const [tripStartDate, setTripStartDate] = useState('');
  const [tripEndDate, setTripEndDate] = useState('');
  const [remarks, setRemarks] = useState('');
  const [expenseItems, setExpenseItems] = useState([
    { date: '', category: 'tickets', location: '', amount: '', description: '' }
  ]);

  // Admin actions state
  const [approvalAmount, setApprovalAmount] = useState('');
  const [rejectReason, setRejectReason] = useState('');
  const [revalidationReason, setRevalidationReason] = useState('');

  // Validation errors
  const [errors, setErrors] = useState({});

  useEffect(() => {
    loadExpenses();
  }, [user?.id, filter, isAdmin]);

  const loadExpenses = async () => {
    if (!user?.id) return;
    setLoading(true);
    try {
      const status = filter !== 'all' ? filter : undefined;
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
    if (errors[`item_${index}_${field}`]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[`item_${index}_${field}`];
        return newErrors;
      });
    }
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
    setErrors({});
    setIsEditMode(false);
    setIsResubmitMode(false);
    setEditingExpenseId(null);
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!tripPurpose.trim()) newErrors.tripPurpose = 'Trip purpose is required';
    if (!tripLocation.trim()) newErrors.tripLocation = 'Trip location is required';
    if (!tripStartDate) newErrors.tripStartDate = 'Start date is required';
    if (!tripEndDate) newErrors.tripEndDate = 'End date is required';
    if (tripStartDate && tripEndDate && tripStartDate > tripEndDate) {
      newErrors.tripEndDate = 'End date must be after start date';
    }

    let hasValidItem = false;
    expenseItems.forEach((item, index) => {
      const itemHasData = item.date || item.amount || item.description;
      
      if (itemHasData) {
        if (!item.date) newErrors[`item_${index}_date`] = 'Date is required';
        if (!item.amount || parseFloat(item.amount) <= 0) newErrors[`item_${index}_amount`] = 'Valid amount is required';
        if (!item.description.trim()) newErrors[`item_${index}_description`] = 'Description is required';
        
        if (item.date && item.amount && parseFloat(item.amount) > 0 && item.description.trim()) {
          hasValidItem = true;
        }
      }
    });

    if (!hasValidItem) newErrors.items = 'At least one complete expense item is required';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const populateFormForEdit = (expense, isResubmit = false) => {
    setTripPurpose(expense.trip_purpose || '');
    setTripLocation(expense.trip_location || '');
    setTripStartDate(expense.trip_start_date || '');
    setTripEndDate(expense.trip_end_date || '');
    setRemarks(expense.remarks || '');
    setExpenseItems(
      expense.items?.map(item => ({
        date: item.date || '',
        category: item.category || 'tickets',
        location: item.location || '',
        amount: item.amount?.toString() || '',
        description: item.description || ''
      })) || [{ date: '', category: 'tickets', location: '', amount: '', description: '' }]
    );
    setIsEditMode(!isResubmit);
    setIsResubmitMode(isResubmit);
    setEditingExpenseId(expense.id);
    setShowAddDialog(true);
    setShowDetailDialog(false);
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      toast.error('Please fill in all required fields');
      return;
    }

    const validItems = expenseItems.filter(item => 
      item.date && item.amount && parseFloat(item.amount) > 0 && item.description.trim()
    );

    try {
      const expenseData = {
        trip_purpose: tripPurpose.trim(),
        trip_location: tripLocation.trim(),
        trip_start_date: tripStartDate,
        trip_end_date: tripEndDate,
        remarks: remarks.trim() || null,
        items: validItems.map(item => ({
          date: item.date,
          category: item.category,
          location: item.location.trim() || tripLocation.trim(),
          amount: parseFloat(item.amount),
          description: item.description.trim(),
          receipt_url: null
        }))
      };

      if (isResubmitMode && editingExpenseId) {
        await auditExpenseAPI.resubmit(editingExpenseId, expenseData, user.id);
        toast.success('Expense resubmitted for approval');
      } else if (isEditMode && editingExpenseId) {
        await auditExpenseAPI.update(editingExpenseId, expenseData, user.id);
        toast.success('Expense updated successfully');
      } else {
        await auditExpenseAPI.create(expenseData, user.id);
        toast.success('Expense submitted successfully');
      }
      
      setShowAddDialog(false);
      resetForm();
      loadExpenses();
    } catch (error) {
      console.error('Error saving expense:', error);
      toast.error(error.message || 'Failed to save expense');
    }
  };

  const handleApprove = async (expenseId, amount) => {
    try {
      const result = await auditExpenseAPI.approve(expenseId, user.id, amount);
      toast.success(`Payment of ₹${amount.toLocaleString()} processed. ${result.remaining_balance > 0 ? `Remaining: ₹${result.remaining_balance.toLocaleString()}` : 'Fully paid!'}`);
      setShowDetailDialog(false);
      setSelectedExpense(null);
      setApprovalAmount('');
      loadExpenses();
    } catch (error) {
      console.error('Error approving expense:', error);
      toast.error('Failed to process payment');
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

  const handleRevalidate = async (expenseId) => {
    if (!revalidationReason.trim()) {
      toast.error('Please provide a reason for revalidation');
      return;
    }
    try {
      await auditExpenseAPI.revalidate(expenseId, user.id, revalidationReason);
      toast.success('Expense sent for revalidation');
      setShowDetailDialog(false);
      setSelectedExpense(null);
      setRevalidationReason('');
      loadExpenses();
    } catch (error) {
      console.error('Error sending for revalidation:', error);
      toast.error('Failed to send for revalidation');
    }
  };

  const handleDelete = async (expenseId) => {
    if (!window.confirm('Are you sure you want to delete this expense?')) return;
    try {
      await auditExpenseAPI.delete(expenseId, user.id);
      toast.success('Expense deleted');
      setShowDetailDialog(false);
      loadExpenses();
    } catch (error) {
      console.error('Error deleting expense:', error);
      toast.error(error.message || 'Failed to delete expense');
    }
  };

  const openDetail = (expense) => {
    setSelectedExpense(expense);
    const remaining = expense.remaining_balance || (expense.total_amount - (expense.approved_amount || 0));
    setApprovalAmount(remaining > 0 ? remaining.toString() : '');
    setShowDetailDialog(true);
  };

  // Stats
  const pendingCount = expenses.filter(e => e.status === 'pending' || e.status === 'revalidation').length;
  const partialCount = expenses.filter(e => e.status === 'partially_approved').length;
  const approvedTotal = expenses.filter(e => e.status === 'approved' || e.status === 'partially_approved')
    .reduce((sum, e) => sum + (e.approved_amount || 0), 0);
  const remainingTotal = expenses.filter(e => e.status === 'partially_approved')
    .reduce((sum, e) => sum + (e.remaining_balance || (e.total_amount - (e.approved_amount || 0))), 0);

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
            {isAdmin ? 'Review, approve, and manage team audit expenses' : 'Submit and track your audit/travel expenses'}
          </p>
        </div>
        {!isAdmin && (
          <Button 
            onClick={() => { resetForm(); setShowAddDialog(true); }}
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
                <p className="text-xs text-gray-500">Total</p>
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
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-green-100 flex items-center justify-center">
                <IndianRupee size={20} className="text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-green-600">₹{approvedTotal.toLocaleString()}</p>
                <p className="text-xs text-gray-500">Paid</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-yellow-100 flex items-center justify-center">
                <CreditCard size={20} className="text-yellow-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-yellow-600">₹{remainingTotal.toLocaleString()}</p>
                <p className="text-xs text-gray-500">Balance</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filter */}
      <div className="flex gap-2 flex-wrap">
        {['all', 'pending', 'partially_approved', 'approved', 'revalidation', 'rejected'].map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
              filter === f
                ? 'bg-[#1E2A5E] text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {f === 'partially_approved' ? 'Partial' : f === 'revalidation' ? 'Revalidation' : f.charAt(0).toUpperCase() + f.slice(1)}
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
            </CardContent>
          </Card>
        ) : (
          expenses.map((expense) => {
            const remaining = expense.remaining_balance ?? (expense.total_amount - (expense.approved_amount || 0));
            const canEdit = !isAdmin && (expense.status === 'pending' || expense.status === 'revalidation');
            
            return (
              <Card 
                key={expense.id} 
                className="cursor-pointer hover:shadow-md transition-shadow"
                onClick={() => openDetail(expense)}
                data-testid={`expense-card-${expense.id}`}
              >
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3">
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-white ${
                        expense.status === 'revalidation' ? 'bg-gradient-to-br from-purple-500 to-purple-700' :
                        expense.status === 'partially_approved' ? 'bg-gradient-to-br from-yellow-500 to-orange-500' :
                        'bg-gradient-to-br from-[#1E2A5E] to-blue-500'
                      }`}>
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
                            By: <span className="font-medium">{expense.emp_name}</span>
                          </p>
                        )}
                        {expense.status === 'revalidation' && expense.revalidation_reason && (
                          <p className="text-xs text-purple-600 mt-1 flex items-center gap-1">
                            <RefreshCw size={10} /> {expense.revalidation_reason}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="flex items-center gap-2 justify-end">
                        {getStatusBadge(expense.status)}
                        {canEdit && (
                          <button
                            onClick={(e) => { e.stopPropagation(); populateFormForEdit(expense, expense.status === 'revalidation'); }}
                            className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            title={expense.status === 'revalidation' ? 'Resubmit expense' : 'Edit expense'}
                          >
                            <Edit2 size={16} />
                          </button>
                        )}
                      </div>
                      <p className="text-lg font-bold text-gray-800 mt-2">₹{expense.total_amount?.toLocaleString()}</p>
                      {expense.approved_amount > 0 && (
                        <p className="text-xs text-green-600">Paid: ₹{expense.approved_amount?.toLocaleString()}</p>
                      )}
                      {expense.status === 'partially_approved' && remaining > 0 && (
                        <p className="text-xs text-yellow-600 font-medium">Balance: ₹{remaining.toLocaleString()}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-2 mt-3 flex-wrap">
                    {expense.items?.slice(0, 4).map((item, idx) => {
                      const IconComp = getCategoryIcon(item.category);
                      return (
                        <span key={idx} className="px-2 py-1 rounded-full text-xs bg-gray-100 text-gray-600 flex items-center gap-1">
                          <IconComp size={12} />
                          ₹{item.amount?.toLocaleString()}
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
            );
          })
        )}
      </div>

      {/* Add/Edit Expense Dialog */}
      <Dialog open={showAddDialog} onOpenChange={(open) => { if (!open) resetForm(); setShowAddDialog(open); }}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {isResubmitMode ? 'Resubmit Expense for Approval' : isEditMode ? 'Edit Audit Expense' : 'Submit Audit Expense'}
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            {isResubmitMode && (
              <div className="p-3 bg-purple-50 border border-purple-200 rounded-xl">
                <p className="text-sm text-purple-700 flex items-center gap-2">
                  <RefreshCw size={16} />
                  Please review and correct the expense details before resubmitting.
                </p>
              </div>
            )}

            {/* Trip Details */}
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2">
                <Label>Trip Purpose *</Label>
                <Input
                  value={tripPurpose}
                  onChange={(e) => { setTripPurpose(e.target.value); setErrors(prev => ({ ...prev, tripPurpose: undefined })); }}
                  placeholder="e.g., Client Audit - ABC Corp"
                  className={errors.tripPurpose ? 'border-red-500' : ''}
                />
                {errors.tripPurpose && <p className="text-xs text-red-500 mt-1">{errors.tripPurpose}</p>}
              </div>
              <div className="col-span-2">
                <Label>Trip Location *</Label>
                <Input
                  value={tripLocation}
                  onChange={(e) => { setTripLocation(e.target.value); setErrors(prev => ({ ...prev, tripLocation: undefined })); }}
                  placeholder="e.g., Mumbai"
                  className={errors.tripLocation ? 'border-red-500' : ''}
                />
                {errors.tripLocation && <p className="text-xs text-red-500 mt-1">{errors.tripLocation}</p>}
              </div>
              <div>
                <Label>Start Date *</Label>
                <Input
                  type="date"
                  value={tripStartDate}
                  onChange={(e) => { setTripStartDate(e.target.value); setErrors(prev => ({ ...prev, tripStartDate: undefined })); }}
                  className={errors.tripStartDate ? 'border-red-500' : ''}
                />
                {errors.tripStartDate && <p className="text-xs text-red-500 mt-1">{errors.tripStartDate}</p>}
              </div>
              <div>
                <Label>End Date *</Label>
                <Input
                  type="date"
                  value={tripEndDate}
                  onChange={(e) => { setTripEndDate(e.target.value); setErrors(prev => ({ ...prev, tripEndDate: undefined })); }}
                  className={errors.tripEndDate ? 'border-red-500' : ''}
                />
                {errors.tripEndDate && <p className="text-xs text-red-500 mt-1">{errors.tripEndDate}</p>}
              </div>
            </div>

            {/* Expense Items */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <Label>Expense Items *</Label>
                <Button variant="outline" size="sm" onClick={addExpenseItem}>
                  <Plus size={14} className="mr-1" /> Add Item
                </Button>
              </div>
              {errors.items && <p className="text-xs text-red-500 mb-2">{errors.items}</p>}
              
              <div className="space-y-3">
                {expenseItems.map((item, index) => (
                  <div key={index} className="p-3 bg-gray-50 rounded-xl space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-medium text-gray-500">Item {index + 1}</span>
                      {expenseItems.length > 1 && (
                        <button onClick={() => removeExpenseItem(index)} className="p-1 text-red-500 hover:bg-red-50 rounded">
                          <Trash2 size={14} />
                        </button>
                      )}
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <Input type="date" value={item.date} onChange={(e) => updateExpenseItem(index, 'date', e.target.value)} className={errors[`item_${index}_date`] ? 'border-red-500' : ''} />
                        {errors[`item_${index}_date`] && <p className="text-xs text-red-500 mt-1">{errors[`item_${index}_date`]}</p>}
                      </div>
                      <Select value={item.category} onValueChange={(val) => updateExpenseItem(index, 'category', val)}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {EXPENSE_CATEGORIES.map(cat => (<SelectItem key={cat.value} value={cat.value}>{cat.label}</SelectItem>))}
                        </SelectContent>
                      </Select>
                      <div>
                        <Input type="number" value={item.amount} onChange={(e) => updateExpenseItem(index, 'amount', e.target.value)} placeholder="Amount (₹) *" className={errors[`item_${index}_amount`] ? 'border-red-500' : ''} />
                        {errors[`item_${index}_amount`] && <p className="text-xs text-red-500 mt-1">{errors[`item_${index}_amount`]}</p>}
                      </div>
                      <Input value={item.location} onChange={(e) => updateExpenseItem(index, 'location', e.target.value)} placeholder="Location (optional)" />
                      <div className="col-span-2">
                        <Input value={item.description} onChange={(e) => updateExpenseItem(index, 'description', e.target.value)} placeholder="Description *" className={errors[`item_${index}_description`] ? 'border-red-500' : ''} />
                        {errors[`item_${index}_description`] && <p className="text-xs text-red-500 mt-1">{errors[`item_${index}_description`]}</p>}
                      </div>
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
              <Textarea value={remarks} onChange={(e) => setRemarks(e.target.value)} placeholder="Any additional notes..." rows={2} />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => { setShowAddDialog(false); resetForm(); }}>Cancel</Button>
            <Button onClick={handleSubmit} className="bg-[#1E2A5E] hover:bg-[#2D3A8C]">
              {isResubmitMode ? 'Resubmit for Approval' : isEditMode ? 'Update Expense' : 'Submit Expense'}
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
              <div className={`p-4 rounded-xl text-white ${
                selectedExpense.status === 'revalidation' ? 'bg-gradient-to-br from-purple-500 to-purple-700' :
                selectedExpense.status === 'partially_approved' ? 'bg-gradient-to-br from-yellow-500 to-orange-500' :
                'bg-gradient-to-br from-[#1E2A5E] to-blue-500'
              }`}>
                <p className="text-lg font-semibold">{selectedExpense.trip_purpose}</p>
                <div className="flex items-center gap-4 mt-2 text-sm text-white/80">
                  <span className="flex items-center gap-1"><MapPin size={14} /> {selectedExpense.trip_location}</span>
                  <span className="flex items-center gap-1"><Calendar size={14} /> {selectedExpense.trip_start_date} to {selectedExpense.trip_end_date}</span>
                </div>
                {isAdmin && <p className="mt-2 text-sm text-white/80">By: <span className="font-medium">{selectedExpense.emp_name}</span> ({selectedExpense.emp_id})</p>}
              </div>

              {/* Status & Balance */}
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Status:</span>
                <div className="flex items-center gap-2">
                  {getStatusBadge(selectedExpense.status)}
                  {!isAdmin && (selectedExpense.status === 'pending' || selectedExpense.status === 'revalidation') && (
                    <Button variant="outline" size="sm" onClick={() => populateFormForEdit(selectedExpense, selectedExpense.status === 'revalidation')} className="text-blue-600">
                      <Edit2 size={14} className="mr-1" /> {selectedExpense.status === 'revalidation' ? 'Resubmit' : 'Edit'}
                    </Button>
                  )}
                </div>
              </div>

              {/* Revalidation Reason */}
              {selectedExpense.status === 'revalidation' && selectedExpense.revalidation_reason && (
                <div className="p-3 bg-purple-50 border border-purple-200 rounded-xl">
                  <p className="text-sm font-medium text-purple-700 flex items-center gap-2"><RefreshCw size={14} /> Revalidation Requested</p>
                  <p className="text-sm text-purple-600 mt-1">{selectedExpense.revalidation_reason}</p>
                </div>
              )}

              {/* Financial Summary */}
              <div className="grid grid-cols-3 gap-3">
                <div className="p-3 bg-gray-100 rounded-xl text-center">
                  <p className="text-xs text-gray-500">Total Claimed</p>
                  <p className="text-lg font-bold">₹{selectedExpense.total_amount?.toLocaleString()}</p>
                </div>
                <div className="p-3 bg-green-50 rounded-xl text-center">
                  <p className="text-xs text-green-600">Paid</p>
                  <p className="text-lg font-bold text-green-600">₹{(selectedExpense.approved_amount || 0).toLocaleString()}</p>
                </div>
                <div className="p-3 bg-yellow-50 rounded-xl text-center">
                  <p className="text-xs text-yellow-600">Balance</p>
                  <p className="text-lg font-bold text-yellow-600">
                    ₹{(selectedExpense.remaining_balance ?? (selectedExpense.total_amount - (selectedExpense.approved_amount || 0))).toLocaleString()}
                  </p>
                </div>
              </div>

              {/* Payment History */}
              {selectedExpense.payment_history && selectedExpense.payment_history.length > 0 && (
                <div>
                  <p className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-2"><History size={14} /> Payment History</p>
                  <div className="space-y-2">
                    {selectedExpense.payment_history.map((payment, idx) => (
                      <div key={idx} className="flex items-center justify-between p-2 bg-green-50 rounded-lg text-sm">
                        <span className="text-green-700">{payment.note}</span>
                        <span className="text-xs text-gray-500">{new Date(payment.paid_on).toLocaleDateString()}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Items */}
              <div>
                <p className="text-sm font-medium text-gray-700 mb-2">Expense Items</p>
                <div className="space-y-2">
                  {selectedExpense.items?.map((item, idx) => {
                    const IconComp = getCategoryIcon(item.category);
                    return (
                      <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-gray-200 flex items-center justify-center"><IconComp size={16} className="text-gray-600" /></div>
                          <div>
                            <p className="text-sm font-medium">{item.description}</p>
                            <p className="text-xs text-gray-500">{item.date} • {getCategoryLabel(item.category)}</p>
                          </div>
                        </div>
                        <span className="font-semibold">₹{item.amount?.toLocaleString()}</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Remarks */}
              {selectedExpense.remarks && (
                <div className="p-3 bg-gray-50 rounded-xl">
                  <p className="text-sm font-medium text-gray-700">Remarks:</p>
                  <p className="text-sm text-gray-600">{selectedExpense.remarks}</p>
                </div>
              )}

              {/* Rejection Reason */}
              {selectedExpense.status === 'rejected' && selectedExpense.rejection_reason && (
                <div className="p-3 bg-red-50 rounded-xl">
                  <p className="text-sm font-medium text-red-700">Rejection Reason:</p>
                  <p className="text-sm text-red-600">{selectedExpense.rejection_reason}</p>
                </div>
              )}

              {/* Admin Actions */}
              {isAdmin && (selectedExpense.status === 'pending' || selectedExpense.status === 'partially_approved') && (
                <div className="space-y-4 pt-4 border-t">
                  <p className="text-sm font-semibold text-gray-700">Admin Actions</p>
                  
                  {/* Payment Section */}
                  <div className="p-3 bg-green-50 rounded-xl space-y-3">
                    <Label className="text-green-700">Process Payment (₹)</Label>
                    <div className="flex gap-2">
                      <Input
                        type="number"
                        value={approvalAmount}
                        onChange={(e) => setApprovalAmount(e.target.value)}
                        placeholder="Amount to pay"
                        className="flex-1"
                      />
                      <Button className="bg-green-600 hover:bg-green-700" onClick={() => handleApprove(selectedExpense.id, parseFloat(approvalAmount))}>
                        <CreditCard size={16} className="mr-2" /> Pay
                      </Button>
                    </div>
                    <p className="text-xs text-gray-500">
                      Remaining: ₹{(selectedExpense.remaining_balance ?? (selectedExpense.total_amount - (selectedExpense.approved_amount || 0))).toLocaleString()}
                    </p>
                  </div>

                  {/* Revalidation Section */}
                  <div className="p-3 bg-purple-50 rounded-xl space-y-3">
                    <Label className="text-purple-700">Request Revalidation</Label>
                    <Input
                      value={revalidationReason}
                      onChange={(e) => setRevalidationReason(e.target.value)}
                      placeholder="Reason for revalidation (e.g., Missing receipt for hotel)"
                    />
                    <Button variant="outline" className="w-full text-purple-600 border-purple-200 hover:bg-purple-100" onClick={() => handleRevalidate(selectedExpense.id)}>
                      <RefreshCw size={16} className="mr-2" /> Send for Revalidation
                    </Button>
                  </div>

                  {/* Reject Section */}
                  <div className="p-3 bg-red-50 rounded-xl space-y-3">
                    <Label className="text-red-700">Reject Expense</Label>
                    <Input
                      value={rejectReason}
                      onChange={(e) => setRejectReason(e.target.value)}
                      placeholder="Reason for rejection"
                    />
                    <Button variant="outline" className="w-full text-red-600 border-red-200 hover:bg-red-100" onClick={() => handleReject(selectedExpense.id)}>
                      <XCircle size={16} className="mr-2" /> Reject
                    </Button>
                  </div>
                </div>
              )}

              {/* Team Lead Delete (only for pending) */}
              {!isAdmin && selectedExpense.status === 'pending' && (
                <Button variant="outline" className="w-full text-red-600 border-red-200 hover:bg-red-50" onClick={() => { handleDelete(selectedExpense.id); setShowDetailDialog(false); }}>
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
