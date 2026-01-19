import React, { useState, useEffect } from 'react';
import { cashbookAPI, exportAPI } from '../services/api';
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import {
  TrendingUp, TrendingDown, Plus, Edit2, Trash2, Download, Lock, Unlock,
  FileText, Upload, Eye, IndianRupee, Calendar, Building, Loader2, X, FileDown
} from 'lucide-react';
import toast from 'react-hot-toast';

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June',
                'July', 'August', 'September', 'October', 'November', 'December'];
const currentYear = new Date().getFullYear();
const YEARS = Array.from({ length: 5 }, (_, i) => currentYear - 2 + i);

const API_URL = process.env.REACT_APP_BACKEND_URL || '';

const Cashbook = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('cash-in');
  const [selectedMonth, setSelectedMonth] = useState(MONTHS[new Date().getMonth()]);
  const [selectedYear, setSelectedYear] = useState(currentYear);
  const [viewMode, setViewMode] = useState('monthly'); // monthly or yearly
  
  // Data states
  const [cashInEntries, setCashInEntries] = useState([]);
  const [cashOutEntries, setCashOutEntries] = useState([]);
  const [categories, setCategories] = useState([]);
  const [summary, setSummary] = useState({ total_cash_in: 0, total_cash_out: 0, net_profit_loss: 0, is_locked: false });
  const [locks, setLocks] = useState([]);
  
  // Loading states
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  
  // Dialog states
  const [cashInDialog, setCashInDialog] = useState({ open: false, mode: 'add', data: null });
  const [cashOutDialog, setCashOutDialog] = useState({ open: false, mode: 'add', data: null });
  const [categoryDialog, setCategoryDialog] = useState({ open: false });
  
  // Form states
  const [newCashIn, setNewCashIn] = useState({
    client_name: '', invoice_number: '', invoice_date: '', invoice_amount: '',
    payment_status: 'pending', amount_received: '0', invoice_pdf_url: '', notes: ''
  });
  const [newCashOut, setNewCashOut] = useState({
    category: '', description: '', amount: '', date: '', notes: ''
  });
  const [newCategory, setNewCategory] = useState({ name: '', description: '' });
  const [uploadingInvoice, setUploadingInvoice] = useState(false);

  useEffect(() => {
    loadData();
  }, [selectedMonth, selectedYear, viewMode]);

  const loadData = async () => {
    setLoading(true);
    try {
      const month = viewMode === 'monthly' ? selectedMonth : null;
      const [cashIn, cashOut, cats, sum, lockData] = await Promise.all([
        cashbookAPI.getCashIn(month, selectedYear),
        cashbookAPI.getCashOut(month, selectedYear),
        cashbookAPI.getCategories(),
        cashbookAPI.getSummary(month, selectedYear),
        cashbookAPI.getLocks(selectedYear)
      ]);
      
      setCashInEntries(cashIn || []);
      setCashOutEntries(cashOut || []);
      setCategories(cats || []);
      setSummary(sum || { total_cash_in: 0, total_cash_out: 0, net_profit_loss: 0, is_locked: false });
      setLocks(lockData || []);
    } catch (error) {
      console.error('Error loading data:', error);
      toast.error('Failed to load cashbook data');
    } finally {
      setLoading(false);
    }
  };

  const isMonthLocked = () => {
    return locks.some(l => l.month === selectedMonth && l.year === selectedYear && l.is_locked);
  };

  // ===== Cash In Functions =====
  const handleInvoiceUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    if (file.size > 10 * 1024 * 1024) {
      toast.error('File size must be less than 10MB');
      return;
    }
    
    setUploadingInvoice(true);
    try {
      const result = await cashbookAPI.uploadInvoice(file);
      setNewCashIn({ ...newCashIn, invoice_pdf_url: result.url });
      toast.success('Invoice uploaded');
    } catch (error) {
      toast.error(error.message || 'Upload failed');
    } finally {
      setUploadingInvoice(false);
    }
  };

  const handleSaveCashIn = async () => {
    if (!newCashIn.client_name || !newCashIn.invoice_number || !newCashIn.invoice_date || !newCashIn.invoice_amount) {
      toast.error('Please fill all required fields');
      return;
    }
    
    setSubmitting(true);
    try {
      const data = {
        ...newCashIn,
        invoice_amount: parseFloat(newCashIn.invoice_amount),
        amount_received: parseFloat(newCashIn.amount_received || 0)
      };
      
      if (cashInDialog.mode === 'add') {
        await cashbookAPI.createCashIn(data);
        toast.success('Invoice added');
      } else {
        await cashbookAPI.updateCashIn(cashInDialog.data.id, data);
        toast.success('Invoice updated');
      }
      
      setCashInDialog({ open: false, mode: 'add', data: null });
      resetCashInForm();
      loadData();
    } catch (error) {
      toast.error(error.message || 'Failed to save');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteCashIn = async (id) => {
    if (!window.confirm('Delete this entry?')) return;
    try {
      await cashbookAPI.deleteCashIn(id);
      toast.success('Deleted');
      loadData();
    } catch (error) {
      toast.error(error.message || 'Failed to delete');
    }
  };

  const resetCashInForm = () => {
    setNewCashIn({
      client_name: '', invoice_number: '', invoice_date: '', invoice_amount: '',
      payment_status: 'pending', amount_received: '0', invoice_pdf_url: '', notes: ''
    });
  };

  const editCashIn = (entry) => {
    setNewCashIn({
      client_name: entry.client_name,
      invoice_number: entry.invoice_number,
      invoice_date: entry.invoice_date,
      invoice_amount: entry.invoice_amount.toString(),
      payment_status: entry.payment_status,
      amount_received: entry.amount_received.toString(),
      invoice_pdf_url: entry.invoice_pdf_url || '',
      notes: entry.notes || ''
    });
    setCashInDialog({ open: true, mode: 'edit', data: entry });
  };

  // ===== Cash Out Functions =====
  const handleSaveCashOut = async () => {
    if (!newCashOut.category || !newCashOut.description || !newCashOut.amount || !newCashOut.date) {
      toast.error('Please fill all required fields');
      return;
    }
    
    setSubmitting(true);
    try {
      const data = {
        ...newCashOut,
        amount: parseFloat(newCashOut.amount)
      };
      
      if (cashOutDialog.mode === 'add') {
        await cashbookAPI.createCashOut(data);
        toast.success('Expense added');
      } else {
        await cashbookAPI.updateCashOut(cashOutDialog.data.id, data);
        toast.success('Expense updated');
      }
      
      setCashOutDialog({ open: false, mode: 'add', data: null });
      resetCashOutForm();
      loadData();
    } catch (error) {
      toast.error(error.message || 'Failed to save');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteCashOut = async (id) => {
    if (!window.confirm('Delete this entry?')) return;
    try {
      await cashbookAPI.deleteCashOut(id);
      toast.success('Deleted');
      loadData();
    } catch (error) {
      toast.error(error.message || 'Cannot delete auto-generated entries');
    }
  };

  const resetCashOutForm = () => {
    setNewCashOut({ category: '', description: '', amount: '', date: '', notes: '' });
  };

  const editCashOut = (entry) => {
    if (entry.is_auto) {
      toast.error('Cannot edit auto-generated entries');
      return;
    }
    setNewCashOut({
      category: entry.category,
      description: entry.description,
      amount: entry.amount.toString(),
      date: entry.date,
      notes: entry.notes || ''
    });
    setCashOutDialog({ open: true, mode: 'edit', data: entry });
  };

  // ===== Category Functions =====
  const handleAddCategory = async () => {
    if (!newCategory.name) {
      toast.error('Category name required');
      return;
    }
    try {
      await cashbookAPI.createCategory(newCategory);
      toast.success('Category added');
      setCategoryDialog({ open: false });
      setNewCategory({ name: '', description: '' });
      loadData();
    } catch (error) {
      toast.error('Failed to add category');
    }
  };

  // ===== Lock Functions =====
  const handleLockMonth = async () => {
    try {
      await cashbookAPI.lockMonth(selectedMonth, selectedYear, user.id);
      toast.success(`${selectedMonth} ${selectedYear} locked`);
      loadData();
    } catch (error) {
      toast.error('Failed to lock');
    }
  };

  const handleUnlockMonth = async () => {
    try {
      await cashbookAPI.unlockMonth(selectedMonth, selectedYear, user.id);
      toast.success(`${selectedMonth} ${selectedYear} unlocked`);
      loadData();
    } catch (error) {
      toast.error('Failed to unlock');
    }
  };

  // ===== Export Functions =====
  const handleExport = (type) => {
    const month = viewMode === 'monthly' ? selectedMonth : null;
    let url;
    
    switch (type) {
      case 'cashbook':
        url = exportAPI.cashbook(month, selectedYear);
        break;
      case 'invoices':
        url = exportAPI.invoices(month, selectedYear);
        break;
      case 'invoices-zip':
        url = exportAPI.invoicesZip(month, selectedYear);
        break;
      default:
        return;
    }
    
    window.open(url, '_blank');
    toast.success(`Exporting ${type}...`);
  };

  const getPaymentStatusBadge = (status) => {
    switch (status) {
      case 'paid':
        return <span className="px-2 py-1 text-xs rounded-full bg-green-100 text-green-700">Paid</span>;
      case 'partial':
        return <span className="px-2 py-1 text-xs rounded-full bg-yellow-100 text-yellow-700">Partial</span>;
      default:
        return <span className="px-2 py-1 text-xs rounded-full bg-red-100 text-red-700">Pending</span>;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="animate-spin h-12 w-12 border-4 border-blue-500 border-t-transparent rounded-full mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading cashbook...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6" data-testid="cashbook-page">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800" data-testid="cashbook-title">Cashbook / Company Finance</h1>
          <p className="text-gray-500">Track income, expenses, and profit/loss</p>
        </div>
        
        {/* Filters */}
        <div className="flex flex-wrap items-center gap-3" data-testid="cashbook-filters">
          <Select value={viewMode} onValueChange={setViewMode}>
            <SelectTrigger className="w-[120px]" data-testid="view-mode-select">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="monthly">Monthly</SelectItem>
              <SelectItem value="yearly">Yearly</SelectItem>
            </SelectContent>
          </Select>
          
          {viewMode === 'monthly' && (
            <Select value={selectedMonth} onValueChange={setSelectedMonth}>
              <SelectTrigger className="w-[130px]" data-testid="month-select">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {MONTHS.map(m => <SelectItem key={m} value={m}>{m}</SelectItem>)}
              </SelectContent>
            </Select>
          )}
          
          <Select value={selectedYear.toString()} onValueChange={(v) => setSelectedYear(parseInt(v))}>
            <SelectTrigger className="w-[100px]" data-testid="year-select">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {YEARS.map(y => <SelectItem key={y} value={y.toString()}>{y}</SelectItem>)}
            </SelectContent>
          </Select>
          
          {/* Lock/Unlock Button */}
          {viewMode === 'monthly' && (
            isMonthLocked() ? (
              <Button variant="outline" onClick={handleUnlockMonth} className="text-orange-600 border-orange-200" data-testid="unlock-month-btn">
                <Unlock size={16} className="mr-2" /> Unlock Month
              </Button>
            ) : (
              <Button variant="outline" onClick={handleLockMonth} className="text-green-600 border-green-200" data-testid="lock-month-btn">
                <Lock size={16} className="mr-2" /> Lock Month
              </Button>
            )
          )}
        </div>
      </div>

      {/* Lock Warning */}
      {viewMode === 'monthly' && isMonthLocked() && (
        <div className="bg-orange-50 border border-orange-200 rounded-lg px-4 py-3 flex items-center gap-3">
          <Lock className="text-orange-600" size={20} />
          <p className="text-orange-700 text-sm">
            <strong>{selectedMonth} {selectedYear}</strong> is locked. Entries cannot be added, edited, or deleted.
          </p>
        </div>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4" data-testid="summary-cards">
        <Card className="border-l-4 border-l-green-500" data-testid="cash-in-card">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Total Cash In</p>
                <p className="text-2xl font-bold text-green-600" data-testid="total-cash-in">₹{summary.total_cash_in?.toLocaleString()}</p>
              </div>
              <TrendingUp className="h-10 w-10 text-green-200" />
            </div>
          </CardContent>
        </Card>
        
        <Card className="border-l-4 border-l-red-500" data-testid="cash-out-card">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Total Cash Out</p>
                <p className="text-2xl font-bold text-red-600" data-testid="total-cash-out">₹{summary.total_cash_out?.toLocaleString()}</p>
              </div>
              <TrendingDown className="h-10 w-10 text-red-200" />
            </div>
          </CardContent>
        </Card>
        
        <Card className={`border-l-4 ${summary.net_profit_loss >= 0 ? 'border-l-blue-500' : 'border-l-orange-500'}`} data-testid="net-profit-card">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Net {summary.net_profit_loss >= 0 ? 'Profit' : 'Loss'}</p>
                <p className={`text-2xl font-bold ${summary.net_profit_loss >= 0 ? 'text-blue-600' : 'text-orange-600'}`} data-testid="net-profit-loss">
                  ₹{Math.abs(summary.net_profit_loss || 0).toLocaleString()}
                </p>
              </div>
              <IndianRupee className={`h-10 w-10 ${summary.net_profit_loss >= 0 ? 'text-blue-200' : 'text-orange-200'}`} />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Export Buttons */}
      <Card>
        <CardContent className="p-4 flex flex-wrap gap-3">
          <Button variant="outline" onClick={() => handleExport('cashbook')}>
            <Download size={16} className="mr-2" /> Export Cashbook (CSV)
          </Button>
          <Button variant="outline" onClick={() => handleExport('invoices')}>
            <FileText size={16} className="mr-2" /> Export Invoices (CSV)
          </Button>
          <Button variant="outline" onClick={() => handleExport('invoices-zip')}>
            <FileDown size={16} className="mr-2" /> Download Invoice PDFs (ZIP)
          </Button>
        </CardContent>
      </Card>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="cash-in" className="flex items-center gap-2">
            <TrendingUp size={16} /> Cash In ({cashInEntries.length})
          </TabsTrigger>
          <TabsTrigger value="cash-out" className="flex items-center gap-2">
            <TrendingDown size={16} /> Cash Out ({cashOutEntries.length})
          </TabsTrigger>
        </TabsList>

        {/* Cash In Tab */}
        <TabsContent value="cash-in" className="space-y-4">
          {!isMonthLocked() && viewMode === 'monthly' && (
            <div className="flex justify-end">
              <Button 
                className="bg-green-600 hover:bg-green-700"
                onClick={() => { resetCashInForm(); setCashInDialog({ open: true, mode: 'add', data: null }); }}
              >
                <Plus size={16} className="mr-2" /> Add Invoice
              </Button>
            </div>
          )}

          <Card>
            <CardContent className="p-0">
              {cashInEntries.length === 0 ? (
                <div className="p-8 text-center text-gray-500">
                  <TrendingUp className="h-12 w-12 mx-auto text-gray-300 mb-3" />
                  <p>No income entries for this period</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="text-left p-3 text-sm font-semibold text-gray-600">Date</th>
                        <th className="text-left p-3 text-sm font-semibold text-gray-600">Client</th>
                        <th className="text-left p-3 text-sm font-semibold text-gray-600">Invoice #</th>
                        <th className="text-right p-3 text-sm font-semibold text-gray-600">Amount</th>
                        <th className="text-right p-3 text-sm font-semibold text-gray-600">Received</th>
                        <th className="text-right p-3 text-sm font-semibold text-gray-600">Pending</th>
                        <th className="text-center p-3 text-sm font-semibold text-gray-600">Status</th>
                        <th className="text-center p-3 text-sm font-semibold text-gray-600">PDF</th>
                        <th className="text-center p-3 text-sm font-semibold text-gray-600">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {cashInEntries.map((entry) => (
                        <tr key={entry.id} className="hover:bg-gray-50">
                          <td className="p-3 text-sm">{entry.invoice_date}</td>
                          <td className="p-3 font-medium">{entry.client_name}</td>
                          <td className="p-3 text-sm text-gray-600">{entry.invoice_number}</td>
                          <td className="p-3 text-right font-semibold">₹{entry.invoice_amount?.toLocaleString()}</td>
                          <td className="p-3 text-right text-green-600 font-semibold">₹{entry.amount_received?.toLocaleString()}</td>
                          <td className="p-3 text-right text-red-600">₹{entry.pending_balance?.toLocaleString()}</td>
                          <td className="p-3 text-center">{getPaymentStatusBadge(entry.payment_status)}</td>
                          <td className="p-3 text-center">
                            {entry.invoice_pdf_url ? (
                              <a 
                                href={`${API_URL}${entry.invoice_pdf_url}`}
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="text-blue-600 hover:text-blue-800"
                              >
                                <Eye size={18} />
                              </a>
                            ) : '-'}
                          </td>
                          <td className="p-3 text-center">
                            {!isMonthLocked() && viewMode === 'monthly' && (
                              <div className="flex justify-center gap-2">
                                <button onClick={() => editCashIn(entry)} className="text-blue-600 hover:text-blue-800">
                                  <Edit2 size={16} />
                                </button>
                                <button onClick={() => handleDeleteCashIn(entry.id)} className="text-red-600 hover:text-red-800">
                                  <Trash2 size={16} />
                                </button>
                              </div>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Cash Out Tab */}
        <TabsContent value="cash-out" className="space-y-4">
          {!isMonthLocked() && viewMode === 'monthly' && (
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setCategoryDialog({ open: true })}>
                <Plus size={16} className="mr-2" /> Add Category
              </Button>
              <Button 
                className="bg-red-600 hover:bg-red-700"
                onClick={() => { resetCashOutForm(); setCashOutDialog({ open: true, mode: 'add', data: null }); }}
              >
                <Plus size={16} className="mr-2" /> Add Expense
              </Button>
            </div>
          )}

          <Card>
            <CardContent className="p-0">
              {cashOutEntries.length === 0 ? (
                <div className="p-8 text-center text-gray-500">
                  <TrendingDown className="h-12 w-12 mx-auto text-gray-300 mb-3" />
                  <p>No expense entries for this period</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="text-left p-3 text-sm font-semibold text-gray-600">Date</th>
                        <th className="text-left p-3 text-sm font-semibold text-gray-600">Category</th>
                        <th className="text-left p-3 text-sm font-semibold text-gray-600">Description</th>
                        <th className="text-right p-3 text-sm font-semibold text-gray-600">Amount</th>
                        <th className="text-center p-3 text-sm font-semibold text-gray-600">Type</th>
                        <th className="text-center p-3 text-sm font-semibold text-gray-600">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {cashOutEntries.map((entry) => (
                        <tr key={entry.id} className="hover:bg-gray-50">
                          <td className="p-3 text-sm">{entry.date}</td>
                          <td className="p-3 capitalize">{entry.category?.replace('_', ' ')}</td>
                          <td className="p-3 text-sm text-gray-600">{entry.description}</td>
                          <td className="p-3 text-right font-semibold text-red-600">₹{entry.amount?.toLocaleString()}</td>
                          <td className="p-3 text-center">
                            {entry.is_auto ? (
                              <span className="px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded-full">Auto</span>
                            ) : (
                              <span className="px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded-full">Manual</span>
                            )}
                          </td>
                          <td className="p-3 text-center">
                            {!entry.is_auto && !isMonthLocked() && viewMode === 'monthly' && (
                              <div className="flex justify-center gap-2">
                                <button onClick={() => editCashOut(entry)} className="text-blue-600 hover:text-blue-800">
                                  <Edit2 size={16} />
                                </button>
                                <button onClick={() => handleDeleteCashOut(entry.id)} className="text-red-600 hover:text-red-800">
                                  <Trash2 size={16} />
                                </button>
                              </div>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Cash In Dialog */}
      <Dialog open={cashInDialog.open} onOpenChange={(open) => setCashInDialog({ ...cashInDialog, open })}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{cashInDialog.mode === 'add' ? 'Add Invoice' : 'Edit Invoice'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Client Name *</Label>
                <Input value={newCashIn.client_name} onChange={(e) => setNewCashIn({...newCashIn, client_name: e.target.value})} />
              </div>
              <div className="space-y-2">
                <Label>Invoice Number *</Label>
                <Input value={newCashIn.invoice_number} onChange={(e) => setNewCashIn({...newCashIn, invoice_number: e.target.value})} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Invoice Date *</Label>
                <Input type="date" value={newCashIn.invoice_date} onChange={(e) => setNewCashIn({...newCashIn, invoice_date: e.target.value})} />
              </div>
              <div className="space-y-2">
                <Label>Invoice Amount (₹) *</Label>
                <Input type="number" value={newCashIn.invoice_amount} onChange={(e) => setNewCashIn({...newCashIn, invoice_amount: e.target.value})} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Payment Status</Label>
                <Select value={newCashIn.payment_status} onValueChange={(v) => setNewCashIn({...newCashIn, payment_status: v})}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="partial">Partial</SelectItem>
                    <SelectItem value="paid">Paid</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Amount Received (₹)</Label>
                <Input type="number" value={newCashIn.amount_received} onChange={(e) => setNewCashIn({...newCashIn, amount_received: e.target.value})} />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Invoice PDF (Max 10MB)</Label>
              <div className="flex gap-2">
                <Input type="file" accept=".pdf" onChange={handleInvoiceUpload} disabled={uploadingInvoice} />
                {uploadingInvoice && <Loader2 className="animate-spin" />}
              </div>
              {newCashIn.invoice_pdf_url && (
                <p className="text-xs text-green-600">✓ Invoice uploaded</p>
              )}
            </div>
            <div className="space-y-2">
              <Label>Notes</Label>
              <Textarea value={newCashIn.notes} onChange={(e) => setNewCashIn({...newCashIn, notes: e.target.value})} rows={2} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCashInDialog({ open: false, mode: 'add', data: null })}>Cancel</Button>
            <Button onClick={handleSaveCashIn} disabled={submitting} className="bg-green-600 hover:bg-green-700">
              {submitting ? <Loader2 className="animate-spin mr-2" size={16} /> : null}
              {cashInDialog.mode === 'add' ? 'Add Invoice' : 'Update Invoice'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Cash Out Dialog */}
      <Dialog open={cashOutDialog.open} onOpenChange={(open) => setCashOutDialog({ ...cashOutDialog, open })}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{cashOutDialog.mode === 'add' ? 'Add Expense' : 'Edit Expense'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Category *</Label>
                <Select value={newCashOut.category} onValueChange={(v) => setNewCashOut({...newCashOut, category: v})}>
                  <SelectTrigger><SelectValue placeholder="Select category" /></SelectTrigger>
                  <SelectContent>
                    {categories.map(cat => (
                      <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Date *</Label>
                <Input type="date" value={newCashOut.date} onChange={(e) => setNewCashOut({...newCashOut, date: e.target.value})} />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Description *</Label>
              <Input value={newCashOut.description} onChange={(e) => setNewCashOut({...newCashOut, description: e.target.value})} />
            </div>
            <div className="space-y-2">
              <Label>Amount (₹) *</Label>
              <Input type="number" value={newCashOut.amount} onChange={(e) => setNewCashOut({...newCashOut, amount: e.target.value})} />
            </div>
            <div className="space-y-2">
              <Label>Notes</Label>
              <Textarea value={newCashOut.notes} onChange={(e) => setNewCashOut({...newCashOut, notes: e.target.value})} rows={2} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCashOutDialog({ open: false, mode: 'add', data: null })}>Cancel</Button>
            <Button onClick={handleSaveCashOut} disabled={submitting} className="bg-red-600 hover:bg-red-700">
              {submitting ? <Loader2 className="animate-spin mr-2" size={16} /> : null}
              {cashOutDialog.mode === 'add' ? 'Add Expense' : 'Update Expense'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Category Dialog */}
      <Dialog open={categoryDialog.open} onOpenChange={(open) => setCategoryDialog({ open })}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Add Custom Category</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Category Name *</Label>
              <Input value={newCategory.name} onChange={(e) => setNewCategory({...newCategory, name: e.target.value})} />
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Input value={newCategory.description} onChange={(e) => setNewCategory({...newCategory, description: e.target.value})} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCategoryDialog({ open: false })}>Cancel</Button>
            <Button onClick={handleAddCategory} className="bg-[#1E2A5E]">Add Category</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Cashbook;
