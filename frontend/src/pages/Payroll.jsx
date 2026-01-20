import React, { useState, useEffect } from 'react';
import { payslipAPI, usersAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { Card, CardContent } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../components/ui/dialog';
import { Label } from '../components/ui/label';
import { Banknote, Download, Eye, IndianRupee, Users, Check, Clock, Loader2, Plus, Calendar, RefreshCw } from 'lucide-react';
import toast from 'react-hot-toast';

const API_URL = process.env.REACT_APP_BACKEND_URL;

const Payroll = () => {
  const { user } = useAuth();
  const [payslips, setPayslips] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedMonth, setSelectedMonth] = useState('January');
  const [selectedYear, setSelectedYear] = useState(2026);
  const [selectedPayslip, setSelectedPayslip] = useState(null);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [generateDialog, setGenerateDialog] = useState(false);
  const [monthlyDialog, setMonthlyDialog] = useState(false);
  const [selectedEmp, setSelectedEmp] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [creatingMonthly, setCreatingMonthly] = useState(false);
  const [recalculating, setRecalculating] = useState(null);

  const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  const years = [2024, 2025, 2026, 2027];

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [payslipsData, employeesData] = await Promise.all([
        payslipAPI.getAll(),
        usersAPI.getAll()
      ]);
      setPayslips(payslipsData);
      // Include both employees and team leads (exclude admin only)
      setEmployees(employeesData.filter(e => e.status === 'active' && e.role !== 'admin'));
    } catch (error) {
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  // Create new payslip (preview status)
  const handleCreatePayslip = async () => {
    if (!selectedEmp) {
      toast.error('Please select an employee');
      return;
    }

    setSubmitting(true);
    try {
      await payslipAPI.create(selectedEmp, selectedMonth, selectedYear);
      toast.success('Payslip created (Preview)');
      setGenerateDialog(false);
      setSelectedEmp('');
      loadData();
    } catch (error) {
      toast.error(error.message || 'Failed to create payslip');
    } finally {
      setSubmitting(false);
    }
  };

  // Admin generate payslip (makes it downloadable, adds to cashbook/reports)
  const handleGeneratePayslip = async (payslip) => {
    if (!window.confirm(`Generate payslip for ${payslip.emp_name}? This will:\n• Make it downloadable for employee\n• Add to Cashbook\n• Include in Reports`)) return;

    try {
      await payslipAPI.generate(payslip.id);
      toast.success('Payslip generated successfully');
      loadData();
    } catch (error) {
      toast.error(error.message || 'Failed to generate payslip');
    }
  };

  const handleSettle = async (payslip) => {
    if (!window.confirm(`Mark payslip for ${payslip.emp_name} as paid/settled?`)) return;

    try {
      await payslipAPI.settle(payslip.id);
      toast.success('Payslip marked as paid');
      loadData();
    } catch (error) {
      toast.error(error.message || 'Failed to settle payslip');
    }
  };

  // Create monthly payslips for all employees
  const handleCreateMonthlyPayslips = async () => {
    setCreatingMonthly(true);
    try {
      const response = await fetch(`${API_URL}/api/payslips/create-monthly?month=${selectedMonth}&year=${selectedYear}`, {
        method: 'POST'
      });
      const data = await response.json();
      
      if (response.ok) {
        toast.success(`Created ${data.created} payslips for ${selectedMonth} ${selectedYear}. Skipped ${data.skipped} (already exist).`);
        setMonthlyDialog(false);
        loadData();
      } else {
        toast.error(data.detail || 'Failed to create monthly payslips');
      }
    } catch (error) {
      toast.error('Failed to create monthly payslips');
    } finally {
      setCreatingMonthly(false);
    }
  };

  // Recalculate payslip from attendance
  const handleRecalculate = async (payslip) => {
    setRecalculating(payslip.id);
    try {
      const result = await payslipAPI.recalculate(payslip.id);
      toast.success(`Payslip recalculated! ${result.attendance_days} attendance days found. Net Pay: ₹${result.breakdown?.net_pay?.toLocaleString()}`);
      loadData();
    } catch (error) {
      toast.error(error.message || 'Failed to recalculate payslip');
    } finally {
      setRecalculating(null);
    }
  };

  // Recalculate all preview payslips for the selected month
  const handleRecalculateAll = async () => {
    const previewPayslips = filteredPayslips.filter(p => p.status === 'preview' || p.status === 'pending');
    if (previewPayslips.length === 0) {
      toast.error('No preview payslips to recalculate');
      return;
    }
    
    setCreatingMonthly(true);
    let successCount = 0;
    
    for (const payslip of previewPayslips) {
      try {
        await payslipAPI.recalculate(payslip.id);
        successCount++;
      } catch (error) {
        console.error(`Failed to recalculate ${payslip.emp_name}:`, error);
      }
    }
    
    toast.success(`Recalculated ${successCount}/${previewPayslips.length} payslips`);
    loadData();
    setCreatingMonthly(false);
  };

  const filteredPayslips = payslips.filter(p => {
    if (selectedMonth && selectedYear) {
      return p.month === selectedMonth && p.year === selectedYear;
    }
    return true;
  });

  const totalNetSalary = filteredPayslips.reduce((sum, p) => sum + (p.breakdown?.net_pay || 0), 0);
  const generatedCount = filteredPayslips.filter(p => p.status === 'generated' || p.status === 'settled').length;
  const previewCount = filteredPayslips.filter(p => p.status === 'preview' || p.status === 'pending').length;
  const settledCount = filteredPayslips.filter(p => p.status === 'settled').length;
  const totalPaidAmount = filteredPayslips.filter(p => p.status === 'settled').reduce((sum, p) => sum + (p.breakdown?.net_pay || 0), 0);

  const getStatusBadge = (status) => {
    const styles = {
      preview: 'bg-gray-100 text-gray-800',
      pending: 'bg-gray-100 text-gray-800',
      generated: 'bg-blue-100 text-blue-800',
      settled: 'bg-green-100 text-green-800'
    };
    const labels = {
      preview: 'Preview',
      pending: 'Preview',
      generated: 'Generated',
      settled: 'Paid'
    };
    return <span className={`px-2 py-1 rounded-full text-xs font-medium ${styles[status] || styles.preview}`}>{labels[status] || status}</span>;
  };

  if (loading) {
    return <div className="flex items-center justify-center h-64"><Loader2 className="animate-spin" size={32} /></div>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Payroll Management</h1>
          <p className="text-gray-500">Generate and manage employee payslips</p>
        </div>
        {user?.role === 'admin' && (
          <div className="flex flex-wrap gap-2">
            <Button onClick={handleRecalculateAll} variant="outline" className="border-orange-500 text-orange-600 hover:bg-orange-50" disabled={creatingMonthly}>
              {creatingMonthly ? <Loader2 className="animate-spin mr-2" size={16} /> : <RefreshCw size={16} className="mr-2" />}
              Refresh All
            </Button>
            <Button onClick={() => setMonthlyDialog(true)} variant="outline" className="border-[#1E2A5E] text-[#1E2A5E]">
              <Calendar size={18} className="mr-2" /> Create Monthly
            </Button>
            <Button onClick={() => setGenerateDialog(true)} className="bg-[#1E2A5E] hover:bg-[#2D3A8C]">
              <Plus size={18} className="mr-2" /> Generate Payslip
            </Button>
          </div>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Total Net Salary</p>
                <p className="text-2xl font-bold">₹{totalNetSalary.toLocaleString()}</p>
              </div>
              <Banknote className="text-blue-500" size={32} />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Preview</p>
                <p className="text-2xl font-bold text-gray-600">{previewCount}</p>
              </div>
              <Clock className="text-gray-500" size={32} />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Generated</p>
                <p className="text-2xl font-bold text-blue-600">{generatedCount}</p>
              </div>
              <Check className="text-blue-500" size={32} />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Paid</p>
                <p className="text-2xl font-bold text-green-600">₹{totalPaidAmount.toLocaleString()}</p>
                <p className="text-xs text-gray-400">{settledCount} payslips</p>
              </div>
              <IndianRupee className="text-green-500" size={32} />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex gap-4 items-center">
            <div className="flex-1">
              <Label>Month</Label>
              <Select value={selectedMonth} onValueChange={setSelectedMonth}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {months.map(m => <SelectItem key={m} value={m}>{m}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="flex-1">
              <Label>Year</Label>
              <Select value={selectedYear.toString()} onValueChange={(v) => setSelectedYear(parseInt(v))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {years.map(y => <SelectItem key={y} value={y.toString()}>{y}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Payslips Table */}
      <Card>
        <CardContent className="pt-6">
          {filteredPayslips.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <Banknote className="mx-auto h-12 w-12 mb-4 text-gray-300" />
              <p>No payslips found for {selectedMonth} {selectedYear}</p>
              <p className="text-sm mt-2">Generate payslips using the button above</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="text-left p-3 text-sm font-semibold text-gray-600">Employee</th>
                    <th className="text-left p-3 text-sm font-semibold text-gray-600">Month</th>
                    <th className="text-right p-3 text-sm font-semibold text-gray-600">Days</th>
                    <th className="text-right p-3 text-sm font-semibold text-gray-600">Duty Earned</th>
                    <th className="text-right p-3 text-sm font-semibold text-gray-600">Conveyance</th>
                    <th className="text-right p-3 text-sm font-semibold text-gray-600">Advance</th>
                    <th className="text-right p-3 text-sm font-semibold text-gray-600">Net Salary</th>
                    <th className="text-center p-3 text-sm font-semibold text-gray-600">Status</th>
                    <th className="text-center p-3 text-sm font-semibold text-gray-600">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {filteredPayslips.map((payslip) => (
                    <tr key={payslip.id} className="hover:bg-gray-50">
                      <td className="p-3 font-medium">{payslip.emp_name}</td>
                      <td className="p-3 text-sm text-gray-600">{payslip.month} {payslip.year}</td>
                      <td className="p-3 text-right text-sm">
                        <span className="text-green-600">{payslip.breakdown?.full_days || 0}F</span>
                        {payslip.breakdown?.half_days > 0 && <span className="text-yellow-600 ml-1">{payslip.breakdown.half_days}H</span>}
                        {payslip.breakdown?.leave_days > 0 && <span className="text-blue-600 ml-1">{payslip.breakdown.leave_days}L</span>}
                        {payslip.breakdown?.absent_days > 0 && <span className="text-red-600 ml-1">{payslip.breakdown.absent_days}A</span>}
                      </td>
                      <td className="p-3 text-right">₹{Math.round(payslip.breakdown?.total_duty_earned || 0).toLocaleString()}</td>
                      <td className="p-3 text-right">₹{(payslip.breakdown?.conveyance || 0).toLocaleString()}</td>
                      <td className="p-3 text-right text-orange-600">
                        {payslip.breakdown?.advance_deduction > 0 ? `-₹${payslip.breakdown.advance_deduction.toLocaleString()}` : '-'}
                      </td>
                      <td className="p-3 text-right font-semibold text-green-600">₹{(payslip.breakdown?.net_pay || 0).toLocaleString()}</td>
                      <td className="p-3 text-center">{getStatusBadge(payslip.status)}</td>
                      <td className="p-3 text-center">
                        <div className="flex justify-center gap-1">
                          <Button size="sm" variant="outline" onClick={() => { setSelectedPayslip(payslip); setIsViewDialogOpen(true); }} title="View Details">
                            <Eye size={14} />
                          </Button>
                          {(payslip.status === 'preview' || payslip.status === 'pending') && user?.role === 'admin' && (
                            <>
                              <Button 
                                size="sm" 
                                variant="outline" 
                                onClick={() => handleRecalculate(payslip)} 
                                disabled={recalculating === payslip.id}
                                className="text-orange-600 border-orange-300"
                                title="Recalculate from attendance"
                              >
                                {recalculating === payslip.id ? <Loader2 className="animate-spin" size={14} /> : <RefreshCw size={14} />}
                              </Button>
                              <Button size="sm" onClick={() => handleGeneratePayslip(payslip)} className="bg-blue-600 hover:bg-blue-700">
                                Generate
                              </Button>
                            </>
                          )}
                          {payslip.status === 'generated' && user?.role === 'admin' && (
                            <Button size="sm" onClick={() => handleSettle(payslip)} className="bg-green-600 hover:bg-green-700">
                              Mark Paid
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Generate Payslip Dialog */}
      <Dialog open={generateDialog} onOpenChange={setGenerateDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Create Payslip (Preview)</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <p className="text-sm text-gray-500">Create a payslip preview. You can review and then click "Generate" to finalize it.</p>
            <div className="space-y-2">
              <Label>Select Employee</Label>
              <Select value={selectedEmp} onValueChange={setSelectedEmp}>
                <SelectTrigger><SelectValue placeholder="Choose employee" /></SelectTrigger>
                <SelectContent>
                  {employees.map(emp => (
                    <SelectItem key={emp.id} value={emp.id}>{emp.name} ({emp.id})</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Month</Label>
                <Select value={selectedMonth} onValueChange={setSelectedMonth}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {months.map(m => <SelectItem key={m} value={m}>{m}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Year</Label>
                <Select value={selectedYear.toString()} onValueChange={(v) => setSelectedYear(parseInt(v))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {years.map(y => <SelectItem key={y} value={y.toString()}>{y}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setGenerateDialog(false)}>Cancel</Button>
            <Button onClick={handleCreatePayslip} disabled={submitting} className="bg-[#1E2A5E]">
              {submitting ? <Loader2 className="animate-spin mr-2" size={16} /> : null}
              Create Preview
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Details Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Payslip Details</DialogTitle>
          </DialogHeader>
          {selectedPayslip && (
            <div className="space-y-3 text-sm">
              <div className="flex justify-between"><strong>Employee:</strong> {selectedPayslip.emp_name}</div>
              <div className="flex justify-between"><strong>Month:</strong> {selectedPayslip.month} {selectedPayslip.year}</div>
              <div className="border-t pt-2">
                <p className="font-semibold mb-2">Earnings:</p>
                <div className="flex justify-between"><span>Basic:</span> ₹{selectedPayslip.breakdown?.basic?.toLocaleString()}</div>
                <div className="flex justify-between"><span>HRA:</span> ₹{selectedPayslip.breakdown?.hra?.toLocaleString()}</div>
                <div className="flex justify-between"><span>Special Allowance:</span> ₹{selectedPayslip.breakdown?.special_allowance?.toLocaleString()}</div>
                <div className="flex justify-between"><span>Conveyance:</span> ₹{selectedPayslip.breakdown?.conveyance?.toLocaleString()}</div>
              </div>
              <div className="border-t pt-2">
                <p className="font-semibold mb-2">Deductions:</p>
                <div className="flex justify-between text-red-600"><span>PF & Tax:</span> -₹{selectedPayslip.breakdown?.deductions?.toLocaleString()}</div>
                {selectedPayslip.breakdown?.advance_deduction > 0 && (
                  <div className="flex justify-between text-orange-600"><span>Advance:</span> -₹{selectedPayslip.breakdown?.advance_deduction?.toLocaleString()}</div>
                )}
              </div>
              <div className="border-t pt-2 flex justify-between text-lg font-bold">
                <span>Net Pay:</span> <span className="text-green-600">₹{selectedPayslip.breakdown?.net_pay?.toLocaleString()}</span>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Create Monthly Payslips Dialog */}
      <Dialog open={monthlyDialog} onOpenChange={setMonthlyDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Create Monthly Payslips</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <p className="text-sm text-blue-800">
                This will create <strong>preview payslips</strong> for all active employees and team leads for the selected month.
                Employees who already have a payslip for this period will be skipped.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Month</Label>
                <Select value={selectedMonth} onValueChange={setSelectedMonth}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {months.map(m => <SelectItem key={m} value={m}>{m}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Year</Label>
                <Select value={selectedYear.toString()} onValueChange={(v) => setSelectedYear(parseInt(v))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {years.map(y => <SelectItem key={y} value={y.toString()}>{y}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="text-sm text-gray-600">
              <p><strong>Active Employees/Team Leads:</strong> {employees.length}</p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setMonthlyDialog(false)}>Cancel</Button>
            <Button onClick={handleCreateMonthlyPayslips} disabled={creatingMonthly} className="bg-[#1E2A5E]">
              {creatingMonthly ? <Loader2 className="animate-spin mr-2" size={16} /> : <Calendar className="mr-2" size={16} />}
              Create for {selectedMonth} {selectedYear}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Payroll;