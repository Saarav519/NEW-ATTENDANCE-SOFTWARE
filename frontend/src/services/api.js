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
  generate: (empId, month, year) => 
    apiCall('/payslips/generate', {
      method: 'POST',
      body: JSON.stringify({ emp_id: empId, month, year }),
    }),
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
};
