import React, { useState } from 'react';
import { payrollRecords, employees, advances, overtimeRecords } from '../data/mockData';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from '../components/ui/select';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose
} from '../components/ui/dialog';
import { Banknote, Download, Eye, IndianRupee, Users, Check, Clock } from 'lucide-react';

const Payroll = () => {
  const [records, setRecords] = useState(payrollRecords);
  const [selectedMonth, setSelectedMonth] = useState('July 2025');
  const [selectedPayroll, setSelectedPayroll] = useState(null);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);

  const months = ['January 2025', 'February 2025', 'March 2025', 'April 2025', 'May 2025', 'June 2025', 'July 2025'];

  // Calculate payroll for current month
  const activeEmployees = employees.filter(e => e.status === 'active');
  
  const calculatePayroll = (emp) => {
    const existingRecord = records.find(r => r.empId === emp.id && r.month === selectedMonth);
    if (existingRecord) return existingRecord;

    // Calculate from mock data
    const empOvertime = overtimeRecords.filter(o => o.empId === emp.id && o.status === 'approved').reduce((sum, o) => sum + o.amount, 0);
    const empAdvance = advances.filter(a => a.empId === emp.id && a.status === 'approved' && a.deductFrom === selectedMonth).reduce((sum, a) => sum + a.amount, 0);
    const deductions = Math.round(emp.salary * 0.1); // 10% deductions (PF, tax, etc.)
    
    return {
      id: `PAY-${emp.id}-${selectedMonth}`,
      empId: emp.id,
      empName: emp.name,
      month: selectedMonth,
      basicSalary: emp.salary,
      overtime: empOvertime,
      bonus: 0,
      deductions,
      advance: empAdvance,
      netSalary: emp.salary + empOvertime - deductions - empAdvance,
      status: 'pending',
      paidOn: null
    };
  };

  const currentPayrolls = activeEmployees.map(emp => calculatePayroll(emp));
  
  const totalSalary = currentPayrolls.reduce((sum, p) => sum + p.netSalary, 0);
  const paidCount = currentPayrolls.filter(p => p.status === 'paid').length;
  const pendingCount = currentPayrolls.filter(p => p.status === 'pending').length;

  const handleMarkPaid = (payroll) => {
    const updatedPayroll = { ...payroll, status: 'paid', paidOn: new Date().toISOString().split('T')[0] };
    const existingIndex = records.findIndex(r => r.id === payroll.id);
    if (existingIndex >= 0) {
      setRecords(records.map(r => r.id === payroll.id ? updatedPayroll : r));
    } else {
      setRecords([...records, updatedPayroll]);
    }
  };

  const handleProcessAll = () => {
    const today = new Date().toISOString().split('T')[0];
    const newRecords = currentPayrolls.map(p => ({
      ...p,
      status: 'paid',
      paidOn: today
    }));
    
    // Update or add records
    const updatedRecords = [...records];
    newRecords.forEach(nr => {
      const existingIndex = updatedRecords.findIndex(r => r.id === nr.id);
      if (existingIndex >= 0) {
        updatedRecords[existingIndex] = nr;
      } else {
        updatedRecords.push(nr);
      }
    });
    setRecords(updatedRecords);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Payroll Management</h1>
          <p className="text-gray-500">Process and manage salaries</p>
        </div>
        <div className="flex gap-3">
          <Select value={selectedMonth} onValueChange={setSelectedMonth}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Select month" />
            </SelectTrigger>
            <SelectContent>
              {months.map(m => <SelectItem key={m} value={m}>{m}</SelectItem>)}
            </SelectContent>
          </Select>
          <Button onClick={handleProcessAll} className="bg-green-600 hover:bg-green-700">
            <Check size={18} className="mr-2" /> Process All
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
              <Users size={24} className="text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-800">{activeEmployees.length}</p>
              <p className="text-sm text-gray-500">Employees</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
              <IndianRupee size={24} className="text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-800">₹{totalSalary.toLocaleString()}</p>
              <p className="text-sm text-gray-500">Total Payroll</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
              <Check size={24} className="text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-800">{paidCount}</p>
              <p className="text-sm text-gray-500">Paid</p>
            </div>
          </CardContent>
        </Card>
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
      </div>

      {/* Payroll Table */}
      <Card>
        <CardHeader>
          <CardTitle>Payroll for {selectedMonth}</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="text-left p-4 font-semibold text-gray-600 text-sm">Employee</th>
                  <th className="text-right p-4 font-semibold text-gray-600 text-sm">Basic</th>
                  <th className="text-right p-4 font-semibold text-gray-600 text-sm">Overtime</th>
                  <th className="text-right p-4 font-semibold text-gray-600 text-sm">Deductions</th>
                  <th className="text-right p-4 font-semibold text-gray-600 text-sm">Advance</th>
                  <th className="text-right p-4 font-semibold text-gray-600 text-sm">Net Salary</th>
                  <th className="text-left p-4 font-semibold text-gray-600 text-sm">Status</th>
                  <th className="text-left p-4 font-semibold text-gray-600 text-sm">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {currentPayrolls.map((payroll) => (
                  <tr key={payroll.id} className="hover:bg-gray-50">
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-green-400 to-green-600 flex items-center justify-center text-white font-bold text-xs">
                          {payroll.empName.split(' ').map(n => n[0]).join('')}
                        </div>
                        <span className="font-medium">{payroll.empName}</span>
                      </div>
                    </td>
                    <td className="p-4 text-right text-gray-700">₹{payroll.basicSalary.toLocaleString()}</td>
                    <td className="p-4 text-right text-green-600">+₹{payroll.overtime.toLocaleString()}</td>
                    <td className="p-4 text-right text-red-500">-₹{payroll.deductions.toLocaleString()}</td>
                    <td className="p-4 text-right text-orange-500">-₹{payroll.advance.toLocaleString()}</td>
                    <td className="p-4 text-right font-bold text-gray-800">₹{payroll.netSalary.toLocaleString()}</td>
                    <td className="p-4">
                      <span className={`text-xs px-3 py-1 rounded-full font-medium ${
                        payroll.status === 'paid' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                      }`}>
                        {payroll.status}
                      </span>
                    </td>
                    <td className="p-4">
                      <div className="flex gap-2">
                        <button
                          onClick={() => { setSelectedPayroll(payroll); setIsViewDialogOpen(true); }}
                          className="p-1.5 bg-gray-100 text-gray-600 rounded hover:bg-gray-200"
                        >
                          <Eye size={14} />
                        </button>
                        {payroll.status === 'pending' && (
                          <button
                            onClick={() => handleMarkPaid(payroll)}
                            className="p-1.5 bg-green-100 text-green-600 rounded hover:bg-green-200"
                          >
                            <Check size={14} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="bg-gray-50 border-t">
                <tr>
                  <td className="p-4 font-bold" colSpan={5}>Total</td>
                  <td className="p-4 text-right font-bold text-lg text-gray-800">₹{totalSalary.toLocaleString()}</td>
                  <td colSpan={2}></td>
                </tr>
              </tfoot>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* View Payslip Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Payslip - {selectedPayroll?.month}</DialogTitle>
          </DialogHeader>
          {selectedPayroll && (
            <div className="space-y-4 py-4">
              <div className="flex items-center gap-4 pb-4 border-b">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-green-400 to-green-600 flex items-center justify-center text-white font-bold">
                  {selectedPayroll.empName.split(' ').map(n => n[0]).join('')}
                </div>
                <div>
                  <h3 className="font-bold text-lg">{selectedPayroll.empName}</h3>
                  <p className="text-gray-500 text-sm">{selectedPayroll.empId}</p>
                </div>
              </div>
              
              <div className="space-y-2">
                <div className="flex justify-between"><span className="text-gray-600">Basic Salary</span><span className="font-medium">₹{selectedPayroll.basicSalary.toLocaleString()}</span></div>
                <div className="flex justify-between"><span className="text-gray-600">Overtime</span><span className="font-medium text-green-600">+₹{selectedPayroll.overtime.toLocaleString()}</span></div>
                <div className="flex justify-between"><span className="text-gray-600">Bonus</span><span className="font-medium text-green-600">+₹{selectedPayroll.bonus.toLocaleString()}</span></div>
                <div className="flex justify-between"><span className="text-gray-600">Deductions (PF, Tax)</span><span className="font-medium text-red-500">-₹{selectedPayroll.deductions.toLocaleString()}</span></div>
                <div className="flex justify-between"><span className="text-gray-600">Advance</span><span className="font-medium text-orange-500">-₹{selectedPayroll.advance.toLocaleString()}</span></div>
                <div className="flex justify-between pt-3 border-t mt-3">
                  <span className="font-bold text-lg">Net Salary</span>
                  <span className="font-bold text-lg text-green-600">₹{selectedPayroll.netSalary.toLocaleString()}</span>
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline">
              <Download size={16} className="mr-2" /> Download
            </Button>
            <DialogClose asChild>
              <Button>Close</Button>
            </DialogClose>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Payroll;
