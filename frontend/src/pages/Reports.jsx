import React, { useState, useEffect } from 'react';
import { usersAPI, attendanceAPI, leaveAPI, payslipAPI, billAPI, advanceAPI } from '../services/api';
import { exportAPI } from '../services/api';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from '../components/ui/select';
import { Download, Users, Calendar, IndianRupee, TrendingUp, TrendingDown, Receipt, Loader2, Wallet, BookOpen, FileText as FileTextIcon, Landmark } from 'lucide-react';
import toast from 'react-hot-toast';

const MONTHS = [
  { value: '1', label: 'January', name: 'January' },
  { value: '2', label: 'February', name: 'February' },
  { value: '3', label: 'March', name: 'March' },
  { value: '4', label: 'April', name: 'April' },
  { value: '5', label: 'May', name: 'May' },
  { value: '6', label: 'June', name: 'June' },
  { value: '7', label: 'July', name: 'July' },
  { value: '8', label: 'August', name: 'August' },
  { value: '9', label: 'September', name: 'September' },
  { value: '10', label: 'October', name: 'October' },
  { value: '11', label: 'November', name: 'November' },
  { value: '12', label: 'December', name: 'December' },
];

const currentYear = new Date().getFullYear();
const YEARS = Array.from({ length: 5 }, (_, i) => ({
  value: String(currentYear - i),
  label: String(currentYear - i)
}));

const Reports = () => {
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(null);
  const [selectedMonth, setSelectedMonth] = useState(String(new Date().getMonth() + 1));
  const [selectedYear, setSelectedYear] = useState(String(currentYear));
  const [stats, setStats] = useState({
    totalEmployees: 0,
    activeEmployees: 0,
    totalSalaryPaid: 0,
    totalBillsApproved: 0,
    totalAdvances: 0,
    attendanceSummary: { present: 0, absent: 0, halfDay: 0 },
    pendingLeaves: 0,
    approvedLeaves: 0
  });

  const reportTypes = [
    { id: 'attendance', name: 'Attendance Report', icon: Calendar, description: 'Daily/monthly attendance summary' },
    { id: 'payroll', name: 'Payroll Report', icon: IndianRupee, description: 'Salary disbursement details' },
    { id: 'leave', name: 'Leave Report', icon: Calendar, description: 'Leave balance and history' },
    { id: 'bills', name: 'Bills Report', icon: Receipt, description: 'Bill submissions and approvals' },
    { id: 'advances', name: 'Advance Report', icon: Wallet, description: 'Salary advance requests' },
    { id: 'cashbook', name: 'Cashbook Report', icon: BookOpen, description: 'Cash in/out and profit/loss summary' },
    { id: 'invoices', name: 'Invoice Report', icon: FileTextIcon, description: 'Client invoice details and payments' },
    { id: 'employee', name: 'Employee Report', icon: Users, description: 'Employee details and status' },
  ];

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    setLoading(true);
    try {
      const [users, attendance, leaves, payslips, bills, advances] = await Promise.all([
        usersAPI.getAll(),
        attendanceAPI.getAll(),
        leaveAPI.getAll(),
        payslipAPI.getAll(null, 'settled'),
        billAPI.getAll(),
        advanceAPI.getAll()
      ]);

      const activeUsers = users.filter(u => u.status === 'active' && u.role !== 'admin');
      const totalSalary = payslips.reduce((sum, p) => sum + (p.breakdown?.net_pay || 0), 0);
      const approvedBills = bills.filter(b => b.status === 'approved').reduce((sum, b) => sum + (b.approved_amount || 0), 0);
      const totalAdvances = advances.filter(a => a.status === 'approved').reduce((sum, a) => sum + (a.amount || 0), 0);

      // Attendance summary
      const present = attendance.filter(a => a.attendance_status === 'full_day' || a.status === 'present').length;
      const halfDay = attendance.filter(a => a.attendance_status === 'half_day').length;
      const absent = attendance.filter(a => a.attendance_status === 'absent' || a.status === 'absent').length;

      setStats({
        totalEmployees: users.filter(u => u.role !== 'admin').length,
        activeEmployees: activeUsers.length,
        totalSalaryPaid: totalSalary,
        totalBillsApproved: approvedBills,
        totalAdvances: totalAdvances,
        attendanceSummary: { present, absent, halfDay },
        pendingLeaves: leaves.filter(l => l.status === 'pending').length,
        approvedLeaves: leaves.filter(l => l.status === 'approved').length
      });
    } catch (error) {
      console.error('Error loading stats:', error);
      toast.error('Failed to load report data');
    } finally {
      setLoading(false);
    }
  };

  const getMonthName = (monthNum) => {
    const month = MONTHS.find(m => m.value === monthNum);
    return month ? month.name : '';
  };

  const handleExport = async (reportId) => {
    setExporting(reportId);
    try {
      let url;
      const monthNum = parseInt(selectedMonth);
      const yearNum = parseInt(selectedYear);
      const monthName = getMonthName(selectedMonth);

      switch (reportId) {
        case 'employee':
          // Employee report doesn't need month/year filter
          url = exportAPI.employees();
          break;
        case 'attendance':
          url = exportAPI.attendance(monthNum, yearNum);
          break;
        case 'leave':
          url = exportAPI.leaves(monthNum, yearNum);
          break;
        case 'payroll':
          url = exportAPI.payslips(monthName, yearNum, 'settled');
          break;
        case 'bills':
          url = exportAPI.bills(monthName, yearNum);
          break;
        case 'advances':
          url = exportAPI.advances(monthName, yearNum);
          break;
        case 'cashbook':
          url = exportAPI.cashbook(monthName, yearNum);
          break;
        case 'invoices':
          url = exportAPI.invoices(monthName, yearNum);
          break;
        default:
          toast.error('Unknown report type');
          return;
      }
      
      // Download the file
      window.open(url, '_blank');
      
      if (reportId === 'employee') {
        toast.success('Employee report downloaded!');
      } else {
        toast.success(`${reportId.charAt(0).toUpperCase() + reportId.slice(1)} report for ${monthName} ${yearNum} downloaded!`);
      }
    } catch (error) {
      console.error('Export error:', error);
      toast.error('Failed to export report');
    } finally {
      setExporting(null);
    }
  };

  const total = stats.attendanceSummary.present + stats.attendanceSummary.absent + stats.attendanceSummary.halfDay || 1;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="animate-spin h-12 w-12 border-4 border-blue-500 border-t-transparent rounded-full mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading reports...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Reports</h1>
          <p className="text-gray-500">Generate and download reports</p>
        </div>
        
        {/* Month and Year Selectors */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600 font-medium">Period:</span>
            <Select value={selectedMonth} onValueChange={setSelectedMonth}>
              <SelectTrigger className="w-[130px]">
                <SelectValue placeholder="Month" />
              </SelectTrigger>
              <SelectContent>
                {MONTHS.map((month) => (
                  <SelectItem key={month.value} value={month.value}>
                    {month.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={selectedYear} onValueChange={setSelectedYear}>
              <SelectTrigger className="w-[100px]">
                <SelectValue placeholder="Year" />
              </SelectTrigger>
              <SelectContent>
                {YEARS.map((year) => (
                  <SelectItem key={year.value} value={year.value}>
                    {year.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Selected Period Indicator */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg px-4 py-2 flex items-center gap-2">
        <Calendar className="h-4 w-4 text-blue-600" />
        <span className="text-sm text-blue-700">
          Exporting data for: <strong>{getMonthName(selectedMonth)} {selectedYear}</strong>
        </span>
        <span className="text-xs text-blue-500 ml-2">(Employee report exports all data)</span>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <Users size={24} className="mx-auto text-blue-600 mb-2" />
            <p className="text-2xl font-bold text-gray-800">{stats.totalEmployees}</p>
            <p className="text-xs text-gray-500">Total Employees</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <Users size={24} className="mx-auto text-green-600 mb-2" />
            <p className="text-2xl font-bold text-gray-800">{stats.activeEmployees}</p>
            <p className="text-xs text-gray-500">Active</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <IndianRupee size={24} className="mx-auto text-purple-600 mb-2" />
            <p className="text-2xl font-bold text-gray-800">₹{(stats.totalSalaryPaid/1000).toFixed(0)}K</p>
            <p className="text-xs text-gray-500">Salary Paid</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <Receipt size={24} className="mx-auto text-orange-600 mb-2" />
            <p className="text-2xl font-bold text-gray-800">₹{stats.totalBillsApproved.toLocaleString()}</p>
            <p className="text-xs text-gray-500">Bills Approved</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <TrendingUp size={24} className="mx-auto text-green-600 mb-2" />
            <p className="text-2xl font-bold text-gray-800">{stats.approvedLeaves}</p>
            <p className="text-xs text-gray-500">Approved Leaves</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <TrendingDown size={24} className="mx-auto text-yellow-600 mb-2" />
            <p className="text-2xl font-bold text-gray-800">{stats.pendingLeaves}</p>
            <p className="text-xs text-gray-500">Pending Leaves</p>
          </CardContent>
        </Card>
      </div>

      {/* Attendance Summary Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Attendance Overview</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-8">
            <div className="flex-1">
              <div className="flex items-end gap-2 h-40">
                <div className="flex-1 flex flex-col items-center">
                  <div className="w-full bg-green-500 rounded-t" style={{ height: `${(stats.attendanceSummary.present / total) * 100}%`, minHeight: '20px' }}></div>
                  <p className="text-xs mt-2 text-gray-600">Present</p>
                  <p className="text-lg font-bold text-green-600">{stats.attendanceSummary.present}</p>
                </div>
                <div className="flex-1 flex flex-col items-center">
                  <div className="w-full bg-yellow-500 rounded-t" style={{ height: `${(stats.attendanceSummary.halfDay / total) * 100}%`, minHeight: '20px' }}></div>
                  <p className="text-xs mt-2 text-gray-600">Half Day</p>
                  <p className="text-lg font-bold text-yellow-600">{stats.attendanceSummary.halfDay}</p>
                </div>
                <div className="flex-1 flex flex-col items-center">
                  <div className="w-full bg-red-500 rounded-t" style={{ height: `${(stats.attendanceSummary.absent / total) * 100}%`, minHeight: '20px' }}></div>
                  <p className="text-xs mt-2 text-gray-600">Absent</p>
                  <p className="text-lg font-bold text-red-600">{stats.attendanceSummary.absent}</p>
                </div>
              </div>
            </div>
            <div className="w-48">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-2 text-sm"><span className="w-3 h-3 bg-green-500 rounded"></span>Present</span>
                  <span className="font-semibold">{((stats.attendanceSummary.present / total) * 100).toFixed(1)}%</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-2 text-sm"><span className="w-3 h-3 bg-yellow-500 rounded"></span>Half Day</span>
                  <span className="font-semibold">{((stats.attendanceSummary.halfDay / total) * 100).toFixed(1)}%</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-2 text-sm"><span className="w-3 h-3 bg-red-500 rounded"></span>Absent</span>
                  <span className="font-semibold">{((stats.attendanceSummary.absent / total) * 100).toFixed(1)}%</span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Report Types */}
      <Card>
        <CardHeader>
          <CardTitle>Generate Reports</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {reportTypes.map((report) => (
              <div key={report.id} className="p-4 border rounded-xl hover:border-[#1E2A5E] hover:bg-gray-50 transition-all cursor-pointer group">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center group-hover:bg-[#1E2A5E] transition-colors">
                    <report.icon size={24} className="text-gray-600 group-hover:text-white transition-colors" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-800">{report.name}</h3>
                    <p className="text-sm text-gray-500 mb-1">{report.description}</p>
                    {report.id !== 'employee' && (
                      <p className="text-xs text-blue-600 mb-2">
                        {getMonthName(selectedMonth)} {selectedYear}
                      </p>
                    )}
                    <Button 
                      size="sm" 
                      variant="outline" 
                      className="w-full"
                      onClick={() => handleExport(report.id)}
                      disabled={exporting === report.id}
                    >
                      {exporting === report.id ? (
                        <>
                          <Loader2 size={14} className="mr-2 animate-spin" /> Exporting...
                        </>
                      ) : (
                        <>
                          <Download size={14} className="mr-2" /> Download CSV
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Summary Table */}
      <Card>
        <CardHeader>
          <CardTitle>Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="text-left p-3 font-semibold text-gray-600 text-sm">Category</th>
                  <th className="text-right p-3 font-semibold text-gray-600 text-sm">Count/Amount</th>
                  <th className="text-right p-3 font-semibold text-gray-600 text-sm">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                <tr>
                  <td className="p-3">Total Employees</td>
                  <td className="p-3 text-right font-semibold">{stats.totalEmployees}</td>
                  <td className="p-3 text-right text-green-600">{stats.activeEmployees} active</td>
                </tr>
                <tr>
                  <td className="p-3">Total Attendance Records</td>
                  <td className="p-3 text-right font-semibold">{stats.attendanceSummary.present + stats.attendanceSummary.halfDay + stats.attendanceSummary.absent}</td>
                  <td className="p-3 text-right text-green-600">{stats.attendanceSummary.present} present</td>
                </tr>
                <tr>
                  <td className="p-3">Leave Requests</td>
                  <td className="p-3 text-right font-semibold">{stats.pendingLeaves + stats.approvedLeaves}</td>
                  <td className="p-3 text-right text-yellow-600">{stats.pendingLeaves} pending</td>
                </tr>
                <tr>
                  <td className="p-3">Payroll Processed</td>
                  <td className="p-3 text-right font-semibold">₹{stats.totalSalaryPaid.toLocaleString()}</td>
                  <td className="p-3 text-right text-green-600">Settled</td>
                </tr>
                <tr>
                  <td className="p-3">Bills Approved</td>
                  <td className="p-3 text-right font-semibold">₹{stats.totalBillsApproved.toLocaleString()}</td>
                  <td className="p-3 text-right text-green-600">Approved</td>
                </tr>
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Reports;
