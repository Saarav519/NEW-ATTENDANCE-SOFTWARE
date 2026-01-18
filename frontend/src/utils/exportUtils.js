import * as XLSX from 'xlsx';

/**
 * Export data to Excel file
 * @param {Array} data - Array of objects to export
 * @param {string} filename - Name of the file (without extension)
 * @param {string} sheetName - Name of the sheet
 */
export const exportToExcel = (data, filename = 'export', sheetName = 'Sheet1') => {
  if (!data || data.length === 0) {
    throw new Error('No data to export');
  }

  // Create workbook and worksheet
  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.json_to_sheet(data);

  // Auto-size columns
  const maxWidth = 50;
  const colWidths = Object.keys(data[0]).map(key => {
    const maxLength = Math.max(
      key.length,
      ...data.map(row => String(row[key] || '').length)
    );
    return { wch: Math.min(maxLength + 2, maxWidth) };
  });
  ws['!cols'] = colWidths;

  // Add worksheet to workbook
  XLSX.utils.book_append_sheet(wb, ws, sheetName);

  // Generate file and trigger download
  XLSX.writeFile(wb, `${filename}.xlsx`);
};

/**
 * Export attendance data to Excel
 * @param {Array} attendance - Attendance records
 * @param {string} employeeName - Employee name for filename
 * @param {string} month - Month name
 * @param {number} year - Year
 */
export const exportAttendanceToExcel = (attendance, employeeName, month, year) => {
  const data = attendance.map(record => ({
    'Date': record.date,
    'Day': new Date(record.date).toLocaleDateString('en-US', { weekday: 'long' }),
    'Punch In': record.punch_in || '-',
    'Punch Out': record.punch_out || '-',
    'Status': record.attendance_status || record.status || '-',
    'Shift': record.shift_type || 'day',
    'Location': record.location || '-',
    'Work Hours': record.work_hours?.toFixed(2) || '0.00',
    'Conveyance (₹)': record.conveyance_amount || 0
  }));

  exportToExcel(data, `Attendance_${employeeName}_${month}_${year}`, 'Attendance');
};

/**
 * Export payroll report to Excel
 * @param {Array} payslips - Payslip records
 * @param {string} month - Month name
 * @param {number} year - Year
 */
export const exportPayrollToExcel = (payslips, month, year) => {
  const data = payslips.map(payslip => ({
    'Employee ID': payslip.emp_id,
    'Employee Name': payslip.emp_name,
    'Month': payslip.month,
    'Year': payslip.year,
    'Basic': payslip.breakdown?.basic || 0,
    'HRA': payslip.breakdown?.hra || 0,
    'Special Allowance': payslip.breakdown?.special_allowance || 0,
    'Conveyance': payslip.breakdown?.conveyance || 0,
    'Extra Conveyance': payslip.breakdown?.extra_conveyance || 0,
    'Full Days': payslip.breakdown?.full_days || 0,
    'Half Days': payslip.breakdown?.half_days || 0,
    'Absent Days': payslip.breakdown?.absent_days || 0,
    'Attendance Adjustment': payslip.breakdown?.attendance_adjustment || 0,
    'Leave Adjustment': payslip.breakdown?.leave_adjustment || 0,
    'Gross Pay': payslip.breakdown?.gross_pay || 0,
    'Deductions': payslip.breakdown?.deductions || 0,
    'Net Pay': payslip.breakdown?.net_pay || 0,
    'Status': payslip.status
  }));

  exportToExcel(data, `Payroll_Report_${month}_${year}`, 'Payroll');
};

/**
 * Export leave report to Excel
 * @param {Array} leaves - Leave records
 */
export const exportLeavesToExcel = (leaves, filename = 'Leave_Report') => {
  const data = leaves.map(leave => ({
    'Employee ID': leave.emp_id,
    'Employee Name': leave.emp_name,
    'Leave Type': leave.type,
    'From Date': leave.from_date,
    'To Date': leave.to_date,
    'Days': leave.days,
    'Reason': leave.reason,
    'Status': leave.status,
    'Applied On': leave.applied_on || '-'
  }));

  exportToExcel(data, filename, 'Leaves');
};

/**
 * Export bills report to Excel
 * @param {Array} bills - Bill records
 */
export const exportBillsToExcel = (bills, filename = 'Bills_Report') => {
  const data = bills.map(bill => ({
    'Employee ID': bill.emp_id,
    'Employee Name': bill.emp_name,
    'Month': bill.month,
    'Year': bill.year,
    'Total Amount': bill.total_amount,
    'Approved Amount': bill.approved_amount || 0,
    'Status': bill.status,
    'Items Count': bill.items?.length || 0,
    'Submitted On': bill.submitted_on || '-'
  }));

  exportToExcel(data, filename, 'Bills');
};

export default {
  exportToExcel,
  exportAttendanceToExcel,
  exportPayrollToExcel,
  exportLeavesToExcel,
  exportBillsToExcel
};
