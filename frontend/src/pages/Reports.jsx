import React from 'react';
import { employees, attendanceRecords, payrollRecords, leaveRequests, overtimeRecords, cashbookEntries } from '../data/mockData';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from '../components/ui/select';
import { BarChart3, Download, Users, Calendar, IndianRupee, Clock, TrendingUp, TrendingDown } from 'lucide-react';

const Reports = () => {
  const reportTypes = [
    { id: 'attendance', name: 'Attendance Report', icon: Calendar, description: 'Daily/monthly attendance summary' },
    { id: 'payroll', name: 'Payroll Report', icon: IndianRupee, description: 'Salary disbursement details' },
    { id: 'leave', name: 'Leave Report', icon: Calendar, description: 'Leave balance and history' },
    { id: 'overtime', name: 'Overtime Report', icon: Clock, description: 'Overtime hours and payments' },
    { id: 'cashbook', name: 'Cashbook Report', icon: TrendingUp, description: 'Cash flow summary' },
    { id: 'employee', name: 'Employee Report', icon: Users, description: 'Employee details and status' },
  ];

  // Calculate summary stats
  const totalEmployees = employees.length;
  const activeEmployees = employees.filter(e => e.status === 'active').length;
  const totalSalaryPaid = payrollRecords.filter(p => p.status === 'paid').reduce((sum, p) => sum + p.netSalary, 0);
  const totalOvertimePaid = overtimeRecords.filter(o => o.status === 'approved').reduce((sum, o) => sum + o.amount, 0);
  const totalCashIn = cashbookEntries.filter(e => e.type === 'in').reduce((sum, e) => sum + e.amount, 0);
  const totalCashOut = cashbookEntries.filter(e => e.type === 'out').reduce((sum, e) => sum + e.amount, 0);

  // Attendance summary
  const attendanceSummary = {
    present: attendanceRecords.filter(a => a.status === 'present').length,
    absent: attendanceRecords.filter(a => a.status === 'absent').length,
    leave: attendanceRecords.filter(a => a.status === 'leave').length,
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Reports</h1>
          <p className="text-gray-500">Generate and download reports</p>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <Users size={24} className="mx-auto text-blue-600 mb-2" />
            <p className="text-2xl font-bold text-gray-800">{totalEmployees}</p>
            <p className="text-xs text-gray-500">Total Employees</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <Users size={24} className="mx-auto text-green-600 mb-2" />
            <p className="text-2xl font-bold text-gray-800">{activeEmployees}</p>
            <p className="text-xs text-gray-500">Active</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <IndianRupee size={24} className="mx-auto text-purple-600 mb-2" />
            <p className="text-2xl font-bold text-gray-800">₹{(totalSalaryPaid/1000).toFixed(0)}K</p>
            <p className="text-xs text-gray-500">Salary Paid</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <Clock size={24} className="mx-auto text-orange-600 mb-2" />
            <p className="text-2xl font-bold text-gray-800">₹{totalOvertimePaid.toLocaleString()}</p>
            <p className="text-xs text-gray-500">Overtime</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <TrendingUp size={24} className="mx-auto text-green-600 mb-2" />
            <p className="text-2xl font-bold text-gray-800">₹{(totalCashIn/1000).toFixed(0)}K</p>
            <p className="text-xs text-gray-500">Cash In</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <TrendingDown size={24} className="mx-auto text-red-600 mb-2" />
            <p className="text-2xl font-bold text-gray-800">₹{(totalCashOut/1000).toFixed(0)}K</p>
            <p className="text-xs text-gray-500">Cash Out</p>
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
                  <div className="w-full bg-green-500 rounded-t" style={{ height: `${(attendanceSummary.present / (attendanceSummary.present + attendanceSummary.absent + attendanceSummary.leave)) * 100}%`, minHeight: '20px' }}></div>
                  <p className="text-xs mt-2 text-gray-600">Present</p>
                  <p className="text-lg font-bold text-green-600">{attendanceSummary.present}</p>
                </div>
                <div className="flex-1 flex flex-col items-center">
                  <div className="w-full bg-red-500 rounded-t" style={{ height: `${(attendanceSummary.absent / (attendanceSummary.present + attendanceSummary.absent + attendanceSummary.leave)) * 100}%`, minHeight: '20px' }}></div>
                  <p className="text-xs mt-2 text-gray-600">Absent</p>
                  <p className="text-lg font-bold text-red-600">{attendanceSummary.absent}</p>
                </div>
                <div className="flex-1 flex flex-col items-center">
                  <div className="w-full bg-yellow-500 rounded-t" style={{ height: `${(attendanceSummary.leave / (attendanceSummary.present + attendanceSummary.absent + attendanceSummary.leave)) * 100}%`, minHeight: '20px' }}></div>
                  <p className="text-xs mt-2 text-gray-600">Leave</p>
                  <p className="text-lg font-bold text-yellow-600">{attendanceSummary.leave}</p>
                </div>
              </div>
            </div>
            <div className="w-48">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-2 text-sm"><span className="w-3 h-3 bg-green-500 rounded"></span>Present</span>
                  <span className="font-semibold">{((attendanceSummary.present / (attendanceSummary.present + attendanceSummary.absent + attendanceSummary.leave)) * 100).toFixed(1)}%</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-2 text-sm"><span className="w-3 h-3 bg-red-500 rounded"></span>Absent</span>
                  <span className="font-semibold">{((attendanceSummary.absent / (attendanceSummary.present + attendanceSummary.absent + attendanceSummary.leave)) * 100).toFixed(1)}%</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-2 text-sm"><span className="w-3 h-3 bg-yellow-500 rounded"></span>Leave</span>
                  <span className="font-semibold">{((attendanceSummary.leave / (attendanceSummary.present + attendanceSummary.absent + attendanceSummary.leave)) * 100).toFixed(1)}%</span>
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
                    <p className="text-sm text-gray-500 mb-3">{report.description}</p>
                    <Button size="sm" variant="outline" className="w-full">
                      <Download size={14} className="mr-2" /> Download
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle>Monthly Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="text-left p-3 font-semibold text-gray-600 text-sm">Category</th>
                  <th className="text-right p-3 font-semibold text-gray-600 text-sm">Count/Amount</th>
                  <th className="text-right p-3 font-semibold text-gray-600 text-sm">Change</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                <tr>
                  <td className="p-3">Total Attendance Records</td>
                  <td className="p-3 text-right font-semibold">{attendanceRecords.length}</td>
                  <td className="p-3 text-right text-green-600">+12%</td>
                </tr>
                <tr>
                  <td className="p-3">Leave Requests</td>
                  <td className="p-3 text-right font-semibold">{leaveRequests.length}</td>
                  <td className="p-3 text-right text-red-500">-5%</td>
                </tr>
                <tr>
                  <td className="p-3">Overtime Hours</td>
                  <td className="p-3 text-right font-semibold">{overtimeRecords.reduce((sum, o) => sum + o.hours, 0)} hrs</td>
                  <td className="p-3 text-right text-green-600">+8%</td>
                </tr>
                <tr>
                  <td className="p-3">Payroll Processed</td>
                  <td className="p-3 text-right font-semibold">₹{totalSalaryPaid.toLocaleString()}</td>
                  <td className="p-3 text-right text-green-600">+3%</td>
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
