import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { payslipAPI } from '../services/api';
import { Card, CardContent } from '../components/ui/card';
import { Button } from '../components/ui/button';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from '../components/ui/select';
import { Download, IndianRupee, Calendar, FileText, Check, CheckCircle, AlertCircle, XCircle } from 'lucide-react';
import jsPDF from 'jspdf';

const Payslip = () => {
  const { user } = useAuth();
  const [payslips, setPayslips] = useState([]);
  const [selectedPayslip, setSelectedPayslip] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPayslips();
  }, [user?.id]);

  const loadPayslips = async () => {
    if (!user?.id) return;
    
    setLoading(true);
    try {
      // Get only settled payslips for employees
      const data = await payslipAPI.getSettled(user.id);
      setPayslips(data);
      if (data.length > 0) {
        setSelectedPayslip(data[0]);
      }
    } catch (error) {
      console.error('Error loading payslips:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectPayslip = (payslipId) => {
    const payslip = payslips.find(p => p.id === payslipId);
    setSelectedPayslip(payslip);
  };

  const downloadPayslipPDF = () => {
    if (!selectedPayslip) return;
    
    const breakdown = selectedPayslip.breakdown || {};
    const doc = new jsPDF();
    
    // Header
    doc.setFontSize(20);
    doc.setFont('helvetica', 'bold');
    doc.text('PAYSLIP', 105, 20, { align: 'center' });
    
    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    doc.text('Audix Solutions & Co.', 105, 28, { align: 'center' });
    
    // Employee Info
    doc.setFontSize(10);
    doc.text(`Employee: ${selectedPayslip.emp_name}`, 20, 45);
    doc.text(`Employee ID: ${selectedPayslip.emp_id}`, 20, 52);
    doc.text(`Month: ${selectedPayslip.month} ${selectedPayslip.year}`, 20, 59);
    doc.text(`Status: ${selectedPayslip.status.toUpperCase()}`, 140, 45);
    doc.text(`Paid On: ${selectedPayslip.paid_on || 'N/A'}`, 140, 52);
    
    // Bank Details
    if (user?.bank_name || user?.bank_account_number || user?.bank_ifsc) {
      doc.setFont('helvetica', 'bold');
      doc.text('Bank Details:', 20, 68);
      doc.setFont('helvetica', 'normal');
      doc.text(`Bank: ${user?.bank_name || 'N/A'}`, 60, 68);
      doc.text(`A/C No: ${user?.bank_account_number || 'N/A'}`, 20, 75);
      doc.text(`IFSC: ${user?.bank_ifsc || 'N/A'}`, 110, 75);
    }
    
    // Separator
    doc.setLineWidth(0.5);
    doc.line(20, 80, 190, 80);
    
    // Attendance Summary
    let y = 90;
    if (breakdown.full_days || breakdown.half_days || breakdown.absent_days) {
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text('ATTENDANCE SUMMARY', 20, y);
      y += 10;
      
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.text(`Full Days: ${breakdown.full_days || 0}  |  Half Days: ${breakdown.half_days || 0}  |  Absent: ${breakdown.absent_days || 0}`, 20, y);
      y += 7;
      
      // Total Duty Earned
      if (breakdown.total_duty_earned && breakdown.total_duty_earned > 0) {
        doc.text(`Total Duty Earned: Rs. ${breakdown.total_duty_earned.toLocaleString()}`, 20, y);
        y += 10;
      }
    }
    
    // Earnings Section
    y += 5;
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('EARNINGS', 20, y);
    
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    
    y += 10;
    const lineHeight = 8;
    
    const earnings = [
      ['Basic Salary', breakdown.basic || 0],
      ['HRA', breakdown.hra || 0],
      ['Special Allowance', breakdown.special_allowance || 0],
      ['Conveyance', breakdown.conveyance || 0],
      ['Bills / Previous Pending Approved', breakdown.extra_conveyance || 0],
      ['Previous Pending Allowances', breakdown.previous_pending_allowances || 0],
    ];
    
    earnings.forEach(([label, amount]) => {
      doc.text(label, 25, y);
      doc.text(`Rs. ${amount.toLocaleString()}`, 170, y, { align: 'right' });
      y += lineHeight;
    });
    
    // Adjustments
    y += 5;
    doc.setFont('helvetica', 'bold');
    doc.text('ADJUSTMENTS', 20, y);
    y += 10;
    
    doc.setFont('helvetica', 'normal');
    
    const attendanceAdj = breakdown.attendance_adjustment || 0;
    if (attendanceAdj !== 0) {
      doc.text(`Attendance Adjustment (Half/Absent Days)`, 25, y);
      doc.text(`Rs. ${attendanceAdj.toLocaleString()}`, 170, y, { align: 'right' });
      y += lineHeight;
    }
    
    const leaveAdj = breakdown.leave_adjustment || 0;
    doc.text('Leave Adjustment', 25, y);
    doc.text(`Rs. ${leaveAdj.toLocaleString()}`, 170, y, { align: 'right' });
    y += lineHeight;
    
    // Deductions
    y += 5;
    doc.setFont('helvetica', 'bold');
    doc.text('DEDUCTIONS', 20, y);
    y += 10;
    
    doc.setFont('helvetica', 'normal');
    doc.text('PF & Tax', 25, y);
    doc.text(`Rs. ${(breakdown.deductions || 0).toLocaleString()}`, 170, y, { align: 'right' });
    y += lineHeight;
    
    // Salary Advance Deduction
    doc.text('Salary Advance', 25, y);
    doc.text(`Rs. ${(breakdown.advance_deduction || 0).toLocaleString()}`, 170, y, { align: 'right' });
    y += lineHeight;
    
    // Separator
    y += 5;
    doc.setLineWidth(0.5);
    doc.line(20, y, 190, y);
    y += 10;
    
    // Total Deductions
    const totalDeductions = (breakdown.deductions || 0) + (breakdown.advance_deduction || 0) + Math.abs(breakdown.attendance_adjustment || 0);
    doc.setFont('helvetica', 'bold');
    doc.text('TOTAL DEDUCTIONS', 25, y);
    doc.text(`Rs. ${totalDeductions.toLocaleString()}`, 170, y, { align: 'right' });
    y += lineHeight + 5;
    
    // Separator
    doc.setLineWidth(0.5);
    doc.line(20, y, 190, y);
    y += 10;
    
    // Net Pay
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('NET PAY', 25, y);
    doc.text(`Rs. ${(breakdown.net_pay || 0).toLocaleString()}`, 170, y, { align: 'right' });
    
    // Footer
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.text('This is a computer-generated payslip.', 105, 280, { align: 'center' });
    doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 105, 285, { align: 'center' });
    
    // Save PDF
    doc.save(`Payslip_${selectedPayslip.emp_id}_${selectedPayslip.month}_${selectedPayslip.year}.pdf`);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin w-8 h-8 border-4 border-[#1E2A5E] border-t-transparent rounded-full"></div>
      </div>
    );
  }

  if (payslips.length === 0) {
    return (
      <div className="space-y-4">
        <div>
          <h1 className="text-xl lg:text-2xl font-bold text-gray-800">My Payslip</h1>
          <p className="text-sm text-gray-500">View your salary details</p>
        </div>
        <Card>
          <CardContent className="p-8 text-center">
            <FileText size={48} className="mx-auto text-gray-300 mb-4" />
            <p className="text-gray-500">No settled payslips available yet.</p>
            <p className="text-sm text-gray-400 mt-2">
              Payslips will appear here once they are processed and settled by Admin.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const breakdown = selectedPayslip?.breakdown || {};

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
          <Select 
            value={selectedPayslip?.id} 
            onValueChange={handleSelectPayslip}
            data-testid="payslip-select"
          >
            <SelectTrigger>
              <SelectValue placeholder="Select payslip" />
            </SelectTrigger>
            <SelectContent>
              {payslips.map(p => (
                <SelectItem key={p.id} value={p.id}>
                  {p.month} {p.year}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {selectedPayslip && (
        <>
          {/* Net Salary Card */}
          <Card className="bg-gradient-to-br from-[#1E2A5E] to-[#2D3A8C] text-white">
            <CardContent className="p-5">
              <div className="flex items-center justify-between mb-2">
                <p className="text-white/70">Net Salary</p>
                <span className={`text-xs px-2 py-1 rounded-full font-medium flex items-center gap-1 ${
                  selectedPayslip.status === 'settled' ? 'bg-green-500' : 
                  selectedPayslip.status === 'generated' ? 'bg-blue-500' : 'bg-gray-500'
                }`}>
                  {selectedPayslip.status === 'settled' ? <><Check size={12} /> Paid</> : 
                   selectedPayslip.status === 'generated' ? 'Generated' : 'Preview'}
                </span>
              </div>
              <p className="text-4xl font-bold mb-1">₹{(breakdown.net_pay || 0).toLocaleString()}</p>
              <p className="text-white/70 text-sm">{selectedPayslip.month} {selectedPayslip.year}</p>
              {selectedPayslip.paid_on && (
                <p className="text-white/50 text-xs mt-2">Paid on {selectedPayslip.paid_on}</p>
              )}
            </CardContent>
          </Card>

          {/* Bank Details Card */}
          {(user?.bank_name || user?.bank_account_number) && (
            <Card className="border-l-4 border-l-blue-500">
              <CardContent className="p-4">
                <p className="text-xs text-gray-500 mb-2">BANK DETAILS</p>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Bank Name</span>
                    <span className="font-medium">{user?.bank_name || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Account No.</span>
                    <span className="font-medium font-mono">{user?.bank_account_number || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">IFSC Code</span>
                    <span className="font-medium font-mono">{user?.bank_ifsc || 'N/A'}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

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
                      <span className="text-gray-700">Basic</span>
                      <span className="font-semibold text-green-600">₹{(breakdown.basic || 0).toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-green-50 rounded-xl">
                      <span className="text-gray-700">HRA</span>
                      <span className="font-semibold text-green-600">₹{(breakdown.hra || 0).toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-green-50 rounded-xl">
                      <span className="text-gray-700">Special Allowance</span>
                      <span className="font-semibold text-green-600">₹{(breakdown.special_allowance || 0).toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-green-50 rounded-xl">
                      <span className="text-gray-700">Conveyance</span>
                      <span className="font-semibold text-green-600">₹{(breakdown.conveyance || 0).toLocaleString()}</span>
                    </div>
                    {(breakdown.extra_conveyance || 0) > 0 && (
                      <div className="flex justify-between items-center p-3 bg-blue-50 rounded-xl">
                        <span className="text-gray-700">Bills / Previous Pending Approved</span>
                        <span className="font-semibold text-blue-600">+₹{breakdown.extra_conveyance.toLocaleString()}</span>
                      </div>
                    )}
                    {(breakdown.audit_expenses || 0) > 0 && (
                      <div className="flex justify-between items-center p-3 bg-purple-50 rounded-xl">
                        <span className="text-gray-700">Audit Expenses (Reimbursement)</span>
                        <span className="font-semibold text-purple-600">+₹{breakdown.audit_expenses.toLocaleString()}</span>
                      </div>
                    )}
                    {(breakdown.previous_pending_allowances || 0) > 0 && (
                      <div className="flex justify-between items-center p-3 bg-green-50 rounded-xl">
                        <span className="text-gray-700">Previous Pending Allowances</span>
                        <span className="font-semibold text-green-600">+₹{breakdown.previous_pending_allowances.toLocaleString()}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Adjustments */}
                {((breakdown.leave_adjustment || 0) !== 0 || (breakdown.attendance_adjustment || 0) !== 0) && (
                  <div>
                    <p className="text-xs text-gray-500 mb-2">ADJUSTMENTS</p>
                    <div className="space-y-2">
                      {(breakdown.attendance_adjustment || 0) !== 0 && (
                        <div className={`flex justify-between items-center p-3 rounded-xl ${
                          breakdown.attendance_adjustment < 0 ? 'bg-yellow-50' : 'bg-green-50'
                        }`}>
                          <div>
                            <span className="text-gray-700">Attendance Adjustment</span>
                            <p className="text-xs text-gray-500">
                              (Half days: {breakdown.half_days || 0}, Absent: {breakdown.absent_days || 0})
                            </p>
                          </div>
                          <span className={`font-semibold ${
                            breakdown.attendance_adjustment < 0 ? 'text-yellow-600' : 'text-green-600'
                          }`}>
                            {breakdown.attendance_adjustment < 0 ? '' : '+'}₹{Math.abs(breakdown.attendance_adjustment || 0).toLocaleString()}
                          </span>
                        </div>
                      )}
                      {(breakdown.leave_adjustment || 0) !== 0 && (
                        <div className={`flex justify-between items-center p-3 rounded-xl ${
                          breakdown.leave_adjustment < 0 ? 'bg-orange-50' : 'bg-green-50'
                        }`}>
                          <span className="text-gray-700">Leave Applied (adjustment)</span>
                          <span className={`font-semibold ${
                            breakdown.leave_adjustment < 0 ? 'text-orange-600' : 'text-green-600'
                          }`}>
                            {breakdown.leave_adjustment < 0 ? '' : '+'}₹{Math.abs(breakdown.leave_adjustment || 0).toLocaleString()}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Attendance Summary */}
                {(breakdown.full_days || breakdown.half_days || breakdown.absent_days) && (
                  <div>
                    <p className="text-xs text-gray-500 mb-2">ATTENDANCE SUMMARY</p>
                    <div className="grid grid-cols-4 gap-2">
                      <div className="flex flex-col items-center p-2 bg-green-50 rounded-lg">
                        <CheckCircle size={16} className="text-green-600 mb-1" />
                        <span className="text-lg font-bold text-green-600">{breakdown.full_days || 0}</span>
                        <span className="text-[10px] text-gray-500">Full Days</span>
                      </div>
                      <div className="flex flex-col items-center p-2 bg-yellow-50 rounded-lg">
                        <AlertCircle size={16} className="text-yellow-600 mb-1" />
                        <span className="text-lg font-bold text-yellow-600">{breakdown.half_days || 0}</span>
                        <span className="text-[10px] text-gray-500">Half Days</span>
                      </div>
                      <div className="flex flex-col items-center p-2 bg-orange-50 rounded-lg">
                        <Calendar size={16} className="text-orange-600 mb-1" />
                        <span className="text-lg font-bold text-orange-600">{breakdown.leave_days || 0}</span>
                        <span className="text-[10px] text-gray-500">Leave</span>
                      </div>
                      <div className="flex flex-col items-center p-2 bg-red-50 rounded-lg">
                        <XCircle size={16} className="text-red-600 mb-1" />
                        <span className="text-lg font-bold text-red-600">{breakdown.absent_days || 0}</span>
                        <span className="text-[10px] text-gray-500">Absent</span>
                      </div>
                    </div>
                    {/* Total Duty Earned */}
                    {(breakdown.total_duty_earned || 0) > 0 && (
                      <div className="mt-3 p-3 bg-blue-50 rounded-xl flex justify-between items-center">
                        <span className="text-gray-700 font-medium">Total Duty Earned</span>
                        <span className="font-bold text-blue-600">₹{Math.round(breakdown.total_duty_earned || 0).toLocaleString()}</span>
                      </div>
                    )}
                  </div>
                )}

                {/* Deductions */}
                <div>
                  <p className="text-xs text-gray-500 mb-2">DEDUCTIONS</p>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center p-3 bg-red-50 rounded-xl">
                      <span className="text-gray-700">PF & Tax</span>
                      <span className="font-semibold text-red-500">-₹{(breakdown.deductions || 0).toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-orange-50 rounded-xl">
                      <span className="text-gray-700">Salary Advance</span>
                      <span className="font-semibold text-orange-600">-₹{(breakdown.advance_deduction || 0).toLocaleString()}</span>
                    </div>
                  </div>
                </div>

                {/* Total */}
                <div className="pt-3 border-t">
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-lg text-gray-800">Net Pay</span>
                    <span className="font-bold text-xl text-[#1E2A5E]">₹{(breakdown.net_pay || 0).toLocaleString()}</span>
                  </div>
                </div>

                {/* Status Badge */}
                {(selectedPayslip?.status === 'preview' || selectedPayslip?.status === 'pending') && (
                  <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded-xl text-center">
                    <p className="text-yellow-700 text-sm font-medium">⏳ Pending Admin Approval</p>
                    <p className="text-yellow-600 text-xs mt-1">Download will be available after approval</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Download Button - Only show for generated/settled payslips */}
          {(selectedPayslip?.status === 'generated' || selectedPayslip?.status === 'settled') ? (
            <Button 
              className="w-full h-12 bg-[#1E2A5E] hover:bg-[#2D3A8C]"
              onClick={downloadPayslipPDF}
              data-testid="download-payslip-btn"
            >
              <Download size={18} className="mr-2" /> Download Payslip (PDF)
            </Button>
          ) : (
            <Button 
              className="w-full h-12 bg-gray-300 cursor-not-allowed"
              disabled
              data-testid="download-payslip-btn-disabled"
            >
              <Download size={18} className="mr-2" /> Download Not Available
            </Button>
          )}

          {/* Past Payslips */}
          {payslips.length > 1 && (
            <Card>
              <CardContent className="p-4">
                <h3 className="font-semibold text-gray-800 mb-3">Past Payslips</h3>
                <div className="space-y-2">
                  {payslips.filter(p => p.id !== selectedPayslip?.id).slice(0, 5).map((payslip) => (
                    <div 
                      key={payslip.id} 
                      className="flex items-center justify-between p-3 bg-gray-50 rounded-xl cursor-pointer hover:bg-gray-100"
                      onClick={() => setSelectedPayslip(payslip)}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                          <FileText size={18} className="text-gray-600" />
                        </div>
                        <div>
                          <p className="font-medium text-sm">{payslip.month} {payslip.year}</p>
                          <p className="text-xs text-gray-500">₹{(payslip.breakdown?.net_pay || 0).toLocaleString()}</p>
                        </div>
                      </div>
                      <button 
                        className="p-2 hover:bg-gray-200 rounded-lg transition-colors"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedPayslip(payslip);
                          setTimeout(downloadPayslipPDF, 100);
                        }}
                      >
                        <Download size={16} className="text-gray-600" />
                      </button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
};

export default Payslip;
