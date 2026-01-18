import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { payrollRecords } from '../data/mockData';
import { Card, CardContent } from '../components/ui/card';
import { Button } from '../components/ui/button';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from '../components/ui/select';
import { Download, IndianRupee, Calendar, FileText, ChevronRight } from 'lucide-react';

const Payslip = () => {
  const { user } = useAuth();
  const [selectedMonth, setSelectedMonth] = useState('July 2025');

  const months = ['January 2025', 'February 2025', 'March 2025', 'April 2025', 'May 2025', 'June 2025', 'July 2025'];

  // Mock payslip data
  const payslip = {
    month: selectedMonth,
    basicSalary: user.salary || 50000,
    overtime: 1500,
    bonus: 0,
    deductions: Math.round((user.salary || 50000) * 0.1),
    advance: 0,
    get netSalary() {
      return this.basicSalary + this.overtime + this.bonus - this.deductions - this.advance;
    },
    status: selectedMonth === 'July 2025' ? 'pending' : 'paid',
    paidOn: selectedMonth === 'July 2025' ? null : '2025-07-01'
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div>
        <h1 className="text-xl lg:text-2xl font-bold text-gray-800">My Payslip</h1>
        <p className="text-sm text-gray-500">View your salary details</p>
      </div>

      {/* Month Selector */}
      <Card>
        <CardContent className="p-3">
          <Select value={selectedMonth} onValueChange={setSelectedMonth}>
            <SelectTrigger>
              <SelectValue placeholder="Select month" />
            </SelectTrigger>
            <SelectContent>
              {months.map(m => <SelectItem key={m} value={m}>{m}</SelectItem>)}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {/* Net Salary Card */}
      <Card className="bg-gradient-to-br from-[#1E2A5E] to-[#2D3A8C] text-white">
        <CardContent className="p-5">
          <div className="flex items-center justify-between mb-2">
            <p className="text-white/70">Net Salary</p>
            <span className={`text-xs px-2 py-1 rounded-full font-medium ${payslip.status === 'paid' ? 'bg-green-500' : 'bg-yellow-500'}`}>
              {payslip.status === 'paid' ? 'Paid' : 'Pending'}
            </span>
          </div>
          <p className="text-4xl font-bold mb-1">₹{payslip.netSalary.toLocaleString()}</p>
          <p className="text-white/70 text-sm">{selectedMonth}</p>
          {payslip.paidOn && (
            <p className="text-white/50 text-xs mt-2">Paid on {payslip.paidOn}</p>
          )}
        </CardContent>
      </Card>

      {/* Salary Breakdown */}
      <Card>
        <CardContent className="p-4">
          <h3 className="font-semibold text-gray-800 mb-4">Salary Breakdown</h3>
          
          <div className="space-y-3">
            {/* Earnings */}
            <div>
              <p className="text-xs text-gray-500 mb-2">EARNINGS</p>
              <div className="space-y-2">
                <div className="flex justify-between items-center p-3 bg-green-50 rounded-xl">
                  <span className="text-gray-700">Basic Salary</span>
                  <span className="font-semibold text-green-600">₹{payslip.basicSalary.toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-green-50 rounded-xl">
                  <span className="text-gray-700">Overtime</span>
                  <span className="font-semibold text-green-600">+₹{payslip.overtime.toLocaleString()}</span>
                </div>
                {payslip.bonus > 0 && (
                  <div className="flex justify-between items-center p-3 bg-green-50 rounded-xl">
                    <span className="text-gray-700">Bonus</span>
                    <span className="font-semibold text-green-600">+₹{payslip.bonus.toLocaleString()}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Deductions */}
            <div>
              <p className="text-xs text-gray-500 mb-2">DEDUCTIONS</p>
              <div className="space-y-2">
                <div className="flex justify-between items-center p-3 bg-red-50 rounded-xl">
                  <span className="text-gray-700">PF & Tax</span>
                  <span className="font-semibold text-red-500">-₹{payslip.deductions.toLocaleString()}</span>
                </div>
                {payslip.advance > 0 && (
                  <div className="flex justify-between items-center p-3 bg-red-50 rounded-xl">
                    <span className="text-gray-700">Advance</span>
                    <span className="font-semibold text-red-500">-₹{payslip.advance.toLocaleString()}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Total */}
            <div className="pt-3 border-t">
              <div className="flex justify-between items-center">
                <span className="font-bold text-lg text-gray-800">Net Salary</span>
                <span className="font-bold text-xl text-[#1E2A5E]">₹{payslip.netSalary.toLocaleString()}</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Download Button */}
      <Button className="w-full h-12 bg-[#1E2A5E] hover:bg-[#2D3A8C]">
        <Download size={18} className="mr-2" /> Download Payslip
      </Button>

      {/* Past Payslips */}
      <Card>
        <CardContent className="p-4">
          <h3 className="font-semibold text-gray-800 mb-3">Past Payslips</h3>
          <div className="space-y-2">
            {months.slice(0, -1).reverse().slice(0, 3).map((month) => (
              <div key={month} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                    <FileText size={18} className="text-gray-600" />
                  </div>
                  <div>
                    <p className="font-medium text-sm">{month}</p>
                    <p className="text-xs text-gray-500">₹{payslip.netSalary.toLocaleString()}</p>
                  </div>
                </div>
                <button className="p-2 hover:bg-gray-200 rounded-lg transition-colors">
                  <Download size={16} className="text-gray-600" />
                </button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Payslip;
