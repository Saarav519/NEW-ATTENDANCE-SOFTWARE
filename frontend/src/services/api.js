const API_URL = process.env.REACT_APP_BACKEND_URL;

// Helper function for API calls
async function apiCall(endpoint, options = {}) {
  const url = `${API_URL}/api${endpoint}`;
  const defaultHeaders = {
    'Content-Type': 'application/json',
  };
  
  const config = {
    ...options,
    headers: {
      ...defaultHeaders,
      ...options.headers,
    },
  };
  
  const response = await fetch(url, config);
  
  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: 'Request failed' }));
    throw new Error(error.detail || 'Request failed');
  }
  
  return response.json();
}

// Auth API
export const authAPI = {
  login: (userId, password) => 
    apiCall('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ user_id: userId, password }),
    }),
};

// Users API
export const usersAPI = {
  getAll: (role, status) => {
    const params = new URLSearchParams();
    if (role) params.append('role', role);
    if (status) params.append('status', status);
    return apiCall(`/users?${params}`);
  },
  getById: (userId) => apiCall(`/users/${userId}`),
  create: (userData) => 
    apiCall('/users', {
      method: 'POST',
      body: JSON.stringify(userData),
    }),
  update: (userId, updates) => 
    apiCall(`/users/${userId}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    }),
  getTeamMembers: (teamLeadId) => apiCall(`/users/team/${teamLeadId}`),
};

// QR Code API
export const qrCodeAPI = {
  create: (data) => 
    apiCall('/qr-codes', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  getAll: (createdBy, date) => {
    const params = new URLSearchParams();
    if (createdBy) params.append('created_by', createdBy);
    if (date) params.append('date', date);
    return apiCall(`/qr-codes?${params}`);
  },
  getById: (qrId) => apiCall(`/qr-codes/${qrId}`),
  deactivate: (qrId) => 
    apiCall(`/qr-codes/${qrId}/deactivate`, { method: 'PUT' }),
};

// Attendance API
export const attendanceAPI = {
  punchIn: (empId, qrData) => 
    apiCall(`/attendance/punch-in?emp_id=${empId}`, {
      method: 'POST',
      body: JSON.stringify({ qr_data: qrData }),
    }),
  directPunchIn: (empId, location, shiftType, shiftStart, shiftEnd, conveyance) => {
    const params = new URLSearchParams({
      emp_id: empId,
      location: location || 'Office',
      shift_type: shiftType || 'day',
      shift_start: shiftStart || '10:00',
      shift_end: shiftEnd || '19:00',
      conveyance_amount: conveyance || 200
    });
    return apiCall(`/attendance/direct-punch-in?${params}`, { method: 'POST' });
  },
  punchOut: (empId, date) => 
    apiCall('/attendance/punch-out', {
      method: 'POST',
      body: JSON.stringify({ emp_id: empId, date }),
    }),
  getAll: (empId, date, month, year) => {
    const params = new URLSearchParams();
    if (empId) params.append('emp_id', empId);
    if (date) params.append('date', date);
    if (month) params.append('month', month);
    if (year) params.append('year', year);
    return apiCall(`/attendance?${params}`);
  },
  getMonthly: (empId, month, year) => 
    apiCall(`/attendance/${empId}/monthly?month=${month}&year=${year}`),
};

// Leave API
export const leaveAPI = {
  create: (leaveData) => 
    apiCall('/leaves', {
      method: 'POST',
      body: JSON.stringify(leaveData),
    }),
  getAll: (empId, status) => {
    const params = new URLSearchParams();
    if (empId) params.append('emp_id', empId);
    if (status) params.append('status', status);
    return apiCall(`/leaves?${params}`);
  },
  approve: (leaveId, approvedBy) => 
    apiCall(`/leaves/${leaveId}/approve?approved_by=${approvedBy}`, { method: 'PUT' }),
  reject: (leaveId, rejectedBy) => 
    apiCall(`/leaves/${leaveId}/reject?rejected_by=${rejectedBy}`, { method: 'PUT' }),
};

// Bill Submission API
export const billAPI = {
  create: (billData, empId, empName) => 
    apiCall(`/bills?emp_id=${empId}&emp_name=${encodeURIComponent(empName)}`, {
      method: 'POST',
      body: JSON.stringify(billData),
    }),
  getAll: (empId, status, month, year) => {
    const params = new URLSearchParams();
    if (empId) params.append('emp_id', empId);
    if (status) params.append('status', status);
    if (month) params.append('month', month);
    if (year) params.append('year', year);
    return apiCall(`/bills?${params}`);
  },
  approve: (billId, approvedBy, approvedAmount) => 
    apiCall(`/bills/${billId}/approve?approved_by=${approvedBy}&approved_amount=${approvedAmount}`, { method: 'PUT' }),
  reject: (billId, rejectedBy) => 
    apiCall(`/bills/${billId}/reject?rejected_by=${rejectedBy}`, { method: 'PUT' }),
  uploadAttachment: async (file) => {
    const formData = new FormData();
    formData.append('file', file);
    
    const response = await fetch(`${API_URL}/api/bills/upload-attachment`, {
      method: 'POST',
      body: formData,
    });
    
    if (!response.ok) {
      const error = await response.json().catch(() => ({ detail: 'Upload failed' }));
      throw new Error(error.detail || 'Upload failed');
    }
    
    return response.json();
  },
};

// Payslip API
export const payslipAPI = {
  getAll: (empId, status) => {
    const params = new URLSearchParams();
    if (empId) params.append('emp_id', empId);
    if (status) params.append('status', status);
    return apiCall(`/payslips?${params}`);
  },
  getSettled: (empId) => apiCall(`/payslips/${empId}/settled`),
  // Create payslip (preview status)
  create: (empId, month, year) => 
    apiCall('/payslips/generate', {
      method: 'POST',
      body: JSON.stringify({ emp_id: empId, month, year }),
    }),
  // Admin generate payslip (makes it downloadable, adds to cashbook)
  generate: (payslipId) => 
    apiCall(`/payslips/${payslipId}/generate`, { method: 'PUT' }),
  // Mark as settled/paid
  settle: (payslipId) => 
    apiCall(`/payslips/${payslipId}/settle`, { method: 'PUT' }),
  download: (payslipId) => `${API_URL}/api/payslips/${payslipId}/download`,
};

// Holiday API
export const holidayAPI = {
  getAll: () => apiCall('/holidays'),
  create: (holidayData) => 
    apiCall('/holidays', {
      method: 'POST',
      body: JSON.stringify(holidayData),
    }),
  delete: (holidayId) => 
    apiCall(`/holidays/${holidayId}`, { method: 'DELETE' }),
};

// Dashboard API
export const dashboardAPI = {
  getStats: () => apiCall('/dashboard/stats'),
};

// Seed API (for development)
export const seedAPI = {
  seed: () => apiCall('/seed', { method: 'POST' }),
};

// Profile API
export const profileAPI = {
  update: (userId, profileData) => 
    apiCall(`/users/${userId}/profile`, {
      method: 'PUT',
      body: JSON.stringify(profileData),
    }),
  uploadPhoto: async (userId, file) => {
    const formData = new FormData();
    formData.append('photo', file);
    
    const response = await fetch(`${API_URL}/api/users/${userId}/photo`, {
      method: 'POST',
      body: formData,
    });
    
    if (!response.ok) {
      const error = await response.json().catch(() => ({ detail: 'Upload failed' }));
      throw new Error(error.detail || 'Upload failed');
    }
    
    return response.json();
  },
};

// Leave Balance API
export const leaveBalanceAPI = {
  get: (empId, year) => {
    const params = year ? `?year=${year}` : '';
    return apiCall(`/leave-balance/${empId}${params}`);
  },
};

// Salary Advance API
export const advanceAPI = {
  create: (advanceData) => 
    apiCall('/advances', {
      method: 'POST',
      body: JSON.stringify(advanceData),
    }),
  getAll: (empId, status) => {
    const params = new URLSearchParams();
    if (empId) params.append('emp_id', empId);
    if (status) params.append('status', status);
    return apiCall(`/advances?${params}`);
  },
  approve: (advanceId, approvedBy) => 
    apiCall(`/advances/${advanceId}/approve?approved_by=${approvedBy}`, { method: 'PUT' }),
  reject: (advanceId, rejectedBy) => 
    apiCall(`/advances/${advanceId}/reject?rejected_by=${rejectedBy}`, { method: 'PUT' }),
};

// Shift Template API
export const shiftTemplateAPI = {
  getAll: (activeOnly = true) => apiCall(`/shift-templates?active_only=${activeOnly}`),
  create: (templateData, createdBy) => 
    apiCall(`/shift-templates?created_by=${createdBy}`, {
      method: 'POST',
      body: JSON.stringify(templateData),
    }),
  update: (templateId, templateData) => 
    apiCall(`/shift-templates/${templateId}`, {
      method: 'PUT',
      body: JSON.stringify(templateData),
    }),
  delete: (templateId) => 
    apiCall(`/shift-templates/${templateId}`, { method: 'DELETE' }),
};

// Bulk Actions API
export const bulkAPI = {
  approveLeaves: (ids, approvedBy) => 
    apiCall('/leaves/bulk-approve', {
      method: 'POST',
      body: JSON.stringify({ ids, approved_by: approvedBy }),
    }),
  rejectLeaves: (ids, rejectedBy, reason) => 
    apiCall('/leaves/bulk-reject', {
      method: 'POST',
      body: JSON.stringify({ ids, rejected_by: rejectedBy, reason }),
    }),
  approveBills: (ids, approvedBy) => 
    apiCall('/bills/bulk-approve', {
      method: 'POST',
      body: JSON.stringify({ ids, approved_by: approvedBy }),
    }),
  rejectBills: (ids, rejectedBy, reason) => 
    apiCall('/bills/bulk-reject', {
      method: 'POST',
      body: JSON.stringify({ ids, rejected_by: rejectedBy, reason }),
    }),
};

// Audit Expense API
export const auditExpenseAPI = {
  create: (expenseData, empId) => 
    apiCall(`/audit-expenses?emp_id=${empId}`, {
      method: 'POST',
      body: JSON.stringify(expenseData),
    }),
  getAll: (empId, status) => {
    const params = new URLSearchParams();
    if (empId) params.append('emp_id', empId);
    if (status) params.append('status', status);
    return apiCall(`/audit-expenses?${params}`);
  },
  getById: (expenseId) => apiCall(`/audit-expenses/${expenseId}`),
  update: (expenseId, expenseData, empId) => 
    apiCall(`/audit-expenses/${expenseId}?emp_id=${empId}`, {
      method: 'PUT',
      body: JSON.stringify(expenseData),
    }),
  approve: (expenseId, approvedBy, approvedAmount) => {
    const params = new URLSearchParams();
    params.append('approved_by', approvedBy);
    if (approvedAmount !== undefined) params.append('approved_amount', approvedAmount);
    return apiCall(`/audit-expenses/${expenseId}/approve?${params}`, { method: 'PUT' });
  },
  reject: (expenseId, rejectedBy, reason) => {
    const params = new URLSearchParams();
    params.append('rejected_by', rejectedBy);
    if (reason) params.append('reason', reason);
    return apiCall(`/audit-expenses/${expenseId}/reject?${params}`, { method: 'PUT' });
  },
  revalidate: (expenseId, requestedBy, reason) => {
    const params = new URLSearchParams();
    params.append('requested_by', requestedBy);
    params.append('reason', reason);
    return apiCall(`/audit-expenses/${expenseId}/revalidate?${params}`, { method: 'PUT' });
  },
  resubmit: (expenseId, expenseData, empId) => 
    apiCall(`/audit-expenses/${expenseId}/resubmit?emp_id=${empId}`, {
      method: 'PUT',
      body: JSON.stringify(expenseData),
    }),
  delete: (expenseId) => 
    apiCall(`/audit-expenses/${expenseId}`, { method: 'DELETE' }),
  getSummary: (empId) => apiCall(`/audit-expenses/summary/${empId}`),
};

// Notification API
export const notificationAPI = {
  getAll: (userId, unreadOnly = false, limit = 50) => {
    const params = new URLSearchParams();
    params.append('user_id', userId);
    if (unreadOnly) params.append('unread_only', 'true');
    params.append('limit', limit.toString());
    return apiCall(`/notifications?${params}`);
  },
  getUnreadCount: (userId) => apiCall(`/notifications/unread-count?user_id=${userId}`),
  markAsRead: (notificationId) => apiCall(`/notifications/${notificationId}/read`, { method: 'PUT' }),
  markAllAsRead: (userId) => apiCall(`/notifications/mark-all-read?user_id=${userId}`, { method: 'PUT' }),
};

// Analytics API
export const analyticsAPI = {
  getAttendanceTrends: (timeFilter = 'this_month') => 
    apiCall(`/analytics/attendance-trends?time_filter=${timeFilter}`),
  getLeaveDistribution: (timeFilter = 'this_month') => 
    apiCall(`/analytics/leave-distribution?time_filter=${timeFilter}`),
  getDepartmentAttendance: (timeFilter = 'this_month') => 
    apiCall(`/analytics/department-attendance?time_filter=${timeFilter}`),
  getSalaryOverview: (timeFilter = 'this_year') => 
    apiCall(`/analytics/salary-overview?time_filter=${timeFilter}`),
  getEmployeeCounts: () => apiCall('/analytics/employee-counts'),
  getSummary: (timeFilter = 'this_month') => 
    apiCall(`/analytics/summary?time_filter=${timeFilter}`),
};

// Export API
export const exportAPI = {
  attendance: (month, year, empId) => {
    const params = new URLSearchParams();
    if (month) params.append('month', month);
    if (year) params.append('year', year);
    if (empId) params.append('emp_id', empId);
    return `${API_URL}/api/export/attendance?${params}`;
  },
  employees: () => `${API_URL}/api/export/employees`,
  leaves: (month, year, status, empId) => {
    const params = new URLSearchParams();
    if (month) params.append('month', month);
    if (year) params.append('year', year);
    if (status) params.append('status', status);
    if (empId) params.append('emp_id', empId);
    return `${API_URL}/api/export/leaves?${params}`;
  },
  payslips: (monthName, year, status, empId) => {
    const params = new URLSearchParams();
    if (monthName) params.append('month', monthName);
    if (year) params.append('year', year);
    if (status) params.append('status', status);
    if (empId) params.append('emp_id', empId);
    return `${API_URL}/api/export/payslips?${params}`;
  },
  bills: (monthName, year, status, empId) => {
    const params = new URLSearchParams();
    if (monthName) params.append('month', monthName);
    if (year) params.append('year', year);
    if (status) params.append('status', status);
    if (empId) params.append('emp_id', empId);
    return `${API_URL}/api/export/bills?${params}`;
  },
  advances: (monthName, year, status, empId) => {
    const params = new URLSearchParams();
    if (monthName) params.append('month', monthName);
    if (year) params.append('year', year);
    if (status) params.append('status', status);
    if (empId) params.append('emp_id', empId);
    return `${API_URL}/api/export/advances?${params}`;
  },
  cashbook: (monthName, year) => {
    const params = new URLSearchParams();
    if (monthName) params.append('month', monthName);
    if (year) params.append('year', year);
    return `${API_URL}/api/export/cashbook?${params}`;
  },
  invoices: (monthName, year) => {
    const params = new URLSearchParams();
    if (monthName) params.append('month', monthName);
    if (year) params.append('year', year);
    return `${API_URL}/api/export/invoices?${params}`;
  },
  invoicesZip: (monthName, year) => {
    const params = new URLSearchParams();
    if (monthName) params.append('month', monthName);
    if (year) params.append('year', year);
    return `${API_URL}/api/export/invoices-zip?${params}`;
  },
  loans: () => `${API_URL}/api/export/loans`,
  emiPayments: (monthName, year) => {
    const params = new URLSearchParams();
    if (monthName) params.append('month', monthName);
    if (year) params.append('year', year);
    return `${API_URL}/api/export/emi-payments?${params}`;
  },
  payables: () => `${API_URL}/api/export/payables`,
};

// Cashbook API
export const cashbookAPI = {
  // Cash In
  getCashIn: (month, year) => {
    const params = new URLSearchParams();
    if (month) params.append('month', month);
    if (year) params.append('year', year);
    return apiCall(`/cashbook/cash-in?${params}`);
  },
  createCashIn: (data) => apiCall('/cashbook/cash-in', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  updateCashIn: (id, data) => apiCall(`/cashbook/cash-in/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  }),
  deleteCashIn: (id) => apiCall(`/cashbook/cash-in/${id}`, { method: 'DELETE' }),
  
  // Upload Invoice
  uploadInvoice: async (file) => {
    const formData = new FormData();
    formData.append('file', file);
    const response = await fetch(`${API_URL}/api/cashbook/upload-invoice`, {
      method: 'POST',
      body: formData,
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Upload failed');
    }
    return response.json();
  },
  
  // Cash Out
  getCashOut: (month, year) => {
    const params = new URLSearchParams();
    if (month) params.append('month', month);
    if (year) params.append('year', year);
    return apiCall(`/cashbook/cash-out?${params}`);
  },
  createCashOut: (data) => apiCall('/cashbook/cash-out', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  updateCashOut: (id, data) => apiCall(`/cashbook/cash-out/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  }),
  deleteCashOut: (id) => apiCall(`/cashbook/cash-out/${id}`, { method: 'DELETE' }),
  
  // Categories
  getCategories: () => apiCall('/cashbook/categories'),
  createCategory: (data) => apiCall('/cashbook/categories', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  deleteCategory: (id) => apiCall(`/cashbook/categories/${id}`, { method: 'DELETE' }),
  
  // Locks
  getLocks: (year) => {
    const params = year ? `?year=${year}` : '';
    return apiCall(`/cashbook/locks${params}`);
  },
  lockMonth: (month, year, lockedBy) => apiCall(`/cashbook/lock?locked_by=${lockedBy}`, {
    method: 'POST',
    body: JSON.stringify({ month, year }),
  }),
  unlockMonth: (month, year, unlockedBy) => apiCall(`/cashbook/unlock?unlocked_by=${unlockedBy}`, {
    method: 'POST',
    body: JSON.stringify({ month, year }),
  }),
  
  // Summary
  getSummary: (month, year) => {
    const params = new URLSearchParams();
    if (month) params.append('month', month);
    if (year) params.append('year', year);
    return apiCall(`/cashbook/summary?${params}`);
  },
};

// Loan / EMI API
export const loanAPI = {
  // Loans
  getAll: (status) => {
    const params = status ? `?status=${status}` : '';
    return apiCall(`/loans${params}`);
  },
  getById: (loanId) => apiCall(`/loans/${loanId}`),
  create: (data) => apiCall('/loans', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  update: (loanId, data) => apiCall(`/loans/${loanId}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  }),
  delete: (loanId) => apiCall(`/loans/${loanId}`, { method: 'DELETE' }),
  
  // EMI Payments
  payEmi: (loanId, data) => apiCall(`/loans/${loanId}/pay-emi`, {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  payLumpsum: (loanId, data) => apiCall(`/loans/${loanId}/pay-lumpsum`, {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  preclose: (loanId, paymentDate, finalAmount, notes) => {
    const params = new URLSearchParams();
    params.append('payment_date', paymentDate);
    params.append('final_amount', finalAmount);
    if (notes) params.append('notes', notes);
    return apiCall(`/loans/${loanId}/preclose?${params}`, { method: 'POST' });
  },
  getPayments: (loanId) => apiCall(`/loans/${loanId}/payments`),
  getAllPayments: (month, year) => {
    const params = new URLSearchParams();
    if (month) params.append('month', month);
    if (year) params.append('year', year);
    return apiCall(`/emi-payments?${params}`);
  },
  
  // Summary
  getSummary: () => apiCall('/loans/summary'),
};

// Payable / Credit API
export const payableAPI = {
  getAll: (status) => {
    const params = status ? `?status=${status}` : '';
    return apiCall(`/payables${params}`);
  },
  getById: (id) => apiCall(`/payables/${id}`),
  create: (data) => apiCall('/payables', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  update: (id, data) => apiCall(`/payables/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  }),
  delete: (id) => apiCall(`/payables/${id}`, { method: 'DELETE' }),
  pay: (id, data) => apiCall(`/payables/${id}/pay`, {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  getPayments: (id) => apiCall(`/payables/${id}/payments`),
  getSummary: () => apiCall('/payables/summary'),
};

// WebSocket URL for real-time updates
export const getWebSocketURL = (userId, role) => {
  const wsBase = API_URL.replace('http', 'ws');
  return `${wsBase}/api/ws/${userId}?role=${role}`;
};

export default {
  auth: authAPI,
  users: usersAPI,
  qrCode: qrCodeAPI,
  attendance: attendanceAPI,
  leave: leaveAPI,
  bill: billAPI,
  payslip: payslipAPI,
  holiday: holidayAPI,
  dashboard: dashboardAPI,
  seed: seedAPI,
  profile: profileAPI,
  leaveBalance: leaveBalanceAPI,
  advance: advanceAPI,
  shiftTemplate: shiftTemplateAPI,
  bulk: bulkAPI,
  auditExpense: auditExpenseAPI,
  notification: notificationAPI,
  analytics: analyticsAPI,
  export: exportAPI,
  cashbook: cashbookAPI,
  loan: loanAPI,
  payable: payableAPI,
  getWebSocketURL,
};
