import React, { useState, useEffect } from 'react';
import { usersAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter
} from '../components/ui/dialog';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from '../components/ui/select';
import {
  Users, Plus, Search, Edit, Trash2, Eye, Mail, Phone, Building,
  Calendar, IndianRupee, UserCheck, UserX, Key, Loader2, Landmark, History
} from 'lucide-react';
import toast from 'react-hot-toast';

const Employees = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [employees, setEmployees] = useState([]);
  const [teamLeaders, setTeamLeaders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('active');
  const [addDialog, setAddDialog] = useState(false);
  const [editDialog, setEditDialog] = useState({ open: false, employee: null });
  const [viewDialog, setViewDialog] = useState({ open: false, employee: null });
  const [passwordDialog, setPasswordDialog] = useState({ open: false, employee: null });
  const [historyDialog, setHistoryDialog] = useState({ open: false, employee: null, history: [] });
  const [submitting, setSubmitting] = useState(false);
  
  const [newEmployee, setNewEmployee] = useState({
    id: '', name: '', email: '', phone: '', department: '', designation: '',
    salary: '', salary_type: 'monthly', role: 'employee', password: '', team_lead_id: '',
    bank_name: '', bank_account_number: '', bank_ifsc: ''
  });

  const [editEmployee, setEditEmployee] = useState({
    team_lead_id: '', change_reason: ''
  });
  
  const [newPassword, setNewPassword] = useState('');

  useEffect(() => {
    loadEmployees();
    loadTeamLeaders();
  }, []);

  const loadEmployees = async () => {
    try {
      const data = await usersAPI.getAll();
      setEmployees(data);
    } catch (error) {
      toast.error('Failed to load employees');
    } finally {
      setLoading(false);
    }
  };

  const loadTeamLeaders = async () => {
    try {
      const data = await usersAPI.getAll();
      const tls = data.filter(u => u.role === 'teamlead' && u.status === 'active');
      setTeamLeaders(tls);
    } catch (error) {
      console.error('Failed to load team leaders');
    }
  };

  const loadTLHistory = async (empId) => {
    try {
      const response = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/users/${empId}/team-leader-history`);
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Failed to load TL history');
      return [];
    }
  };

  const handleAddEmployee = async () => {
    if (!newEmployee.id || !newEmployee.name || !newEmployee.email || !newEmployee.password) {
      toast.error('Please fill Employee ID, Name, Email, and Password');
      return;
    }
    
    // Check bank details for employees and team leads
    if (newEmployee.role !== 'admin') {
      if (!newEmployee.bank_name || !newEmployee.bank_account_number || !newEmployee.bank_ifsc) {
        toast.error('Bank details (Bank Name, Account Number, IFSC) are mandatory');
        return;
      }
    }
    
    setSubmitting(true);
    try {
      await usersAPI.create({
        ...newEmployee,
        salary: parseFloat(newEmployee.salary) || 0,
        joining_date: new Date().toISOString().split('T')[0],
        status: 'active'
      });
      toast.success('Employee added successfully');
      setAddDialog(false);
      resetForm();
      loadEmployees();
    } catch (error) {
      toast.error(error.message || 'Failed to add employee');
    } finally {
      setSubmitting(false);
    }
  };

  const handleEditEmployee = async () => {
    if (!editDialog.employee) return;
    
    setSubmitting(true);
    try {
      const updates = {
        team_lead_id: editEmployee.team_lead_id || null,
        changed_by: user.id,
        change_reason: editEmployee.change_reason || 'Team Leader reassignment'
      };
      
      await usersAPI.update(editDialog.employee.id, updates);
      toast.success('Employee updated successfully');
      setEditDialog({ open: false, employee: null });
      setEditEmployee({ team_lead_id: '', change_reason: '' });
      loadEmployees();
    } catch (error) {
      toast.error(error.message || 'Failed to update employee');
    } finally {
      setSubmitting(false);
    }
  };

  const openEditDialog = (emp) => {
    setEditEmployee({
      team_lead_id: emp.team_lead_id || '',
      change_reason: ''
    });
    setEditDialog({ open: true, employee: emp });
  };

  const openHistoryDialog = async (emp) => {
    const history = await loadTLHistory(emp.id);
    setHistoryDialog({ open: true, employee: emp, history });
  };

  const handleResetPassword = async () => {
    if (!newPassword) {
      toast.error('Please enter new password');
      return;
    }
    
    setSubmitting(true);
    try {
      await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/users/${passwordDialog.employee.id}/reset-password?new_password=${newPassword}&reset_by=${user.id}`, {
        method: 'PUT'
      });
      toast.success('Password reset successfully');
      setPasswordDialog({ open: false, employee: null });
      setNewPassword('');
    } catch (error) {
      toast.error('Failed to reset password');
    } finally {
      setSubmitting(false);
    }
  };

  const toggleStatus = async (emp) => {
    try {
      const newStatus = emp.status === 'active' ? 'inactive' : 'active';
      await usersAPI.update(emp.id, { status: newStatus });
      toast.success(`Employee marked as ${newStatus}`);
      loadEmployees();
    } catch (error) {
      toast.error('Failed to update status');
    }
  };

  const resetForm = () => {
    setNewEmployee({
      id: '', name: '', email: '', phone: '', department: '', designation: '',
      salary: '', salary_type: 'monthly', role: 'employee', password: '', team_lead_id: '',
      bank_name: '', bank_account_number: '', bank_ifsc: ''
    });
  };

  const getTeamLeaderName = (tlId) => {
    const tl = teamLeaders.find(t => t.id === tlId);
    return tl ? tl.name : 'Not Assigned';
  };

  const filteredEmployees = employees.filter(emp => {
    const matchesSearch = emp.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         emp.id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         emp.email?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = emp.status === activeTab;
    return matchesSearch && matchesStatus;
  });

  const activeCount = employees.filter(e => e.status === 'active').length;
  const inactiveCount = employees.filter(e => e.status === 'inactive').length;

  const canManageEmployees = user?.role === 'admin';
  const canResetPassword = user?.role === 'admin' || user?.role === 'teamlead';

  if (loading) {
    return <div className="flex items-center justify-center h-64"><Loader2 className="animate-spin" size={32} /></div>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Employees</h1>
          <p className="text-gray-500">Manage your workforce</p>
        </div>
        {canManageEmployees && (
          <Button onClick={() => setAddDialog(true)} className="bg-[#1E2A5E] hover:bg-[#2D3A8C]">
            <Plus size={18} className="mr-2" /> Add Employee
          </Button>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Total Employees</p>
                <p className="text-2xl font-bold">{employees.length}</p>
              </div>
              <Users className="text-blue-500" size={32} />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Active</p>
                <p className="text-2xl font-bold text-green-600">{activeCount}</p>
              </div>
              <UserCheck className="text-green-500" size={32} />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Inactive</p>
                <p className="text-2xl font-bold text-red-600">{inactiveCount}</p>
              </div>
              <UserX className="text-red-500" size={32} />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
        <Input
          placeholder="Search by name, ID, or email..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Active/Inactive Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="active">Active ({activeCount})</TabsTrigger>
          <TabsTrigger value="inactive">Inactive ({inactiveCount})</TabsTrigger>
        </TabsList>

        <TabsContent value="active" className="mt-4">
          <EmployeeList employees={filteredEmployees} onView={(e) => setViewDialog({ open: true, employee: e })}
            onToggle={toggleStatus} canResetPassword={canResetPassword} canManageEmployees={canManageEmployees}
            onResetPassword={(e) => setPasswordDialog({ open: true, employee: e })} 
            onEdit={openEditDialog} onViewHistory={openHistoryDialog}
            getTeamLeaderName={getTeamLeaderName} navigate={navigate} />
        </TabsContent>

        <TabsContent value="inactive" className="mt-4">
          <EmployeeList employees={filteredEmployees} onView={(e) => setViewDialog({ open: true, employee: e })}
            onToggle={toggleStatus} canResetPassword={canResetPassword} canManageEmployees={canManageEmployees}
            onResetPassword={(e) => setPasswordDialog({ open: true, employee: e })} 
            onEdit={openEditDialog} onViewHistory={openHistoryDialog}
            getTeamLeaderName={getTeamLeaderName} navigate={navigate} />
        </TabsContent>
      </Tabs>

      {/* Add Employee Dialog */}
      <Dialog open={addDialog} onOpenChange={setAddDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Add New Employee</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Employee ID * (Manual)</Label>
                <Input placeholder="e.g., EMP001, AUD-05" value={newEmployee.id}
                  onChange={(e) => setNewEmployee({...newEmployee, id: e.target.value})} 
                  data-testid="add-employee-id" />
                <p className="text-xs text-gray-500">Use any format. Must be unique.</p>
              </div>
              <div className="space-y-2">
                <Label>Full Name *</Label>
                <Input value={newEmployee.name}
                  onChange={(e) => setNewEmployee({...newEmployee, name: e.target.value})}
                  data-testid="add-employee-name" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Email *</Label>
                <Input type="email" value={newEmployee.email}
                  onChange={(e) => setNewEmployee({...newEmployee, email: e.target.value})}
                  data-testid="add-employee-email" />
              </div>
              <div className="space-y-2">
                <Label>Phone</Label>
                <Input value={newEmployee.phone}
                  onChange={(e) => setNewEmployee({...newEmployee, phone: e.target.value})}
                  data-testid="add-employee-phone" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Department</Label>
                <Input value={newEmployee.department}
                  onChange={(e) => setNewEmployee({...newEmployee, department: e.target.value})}
                  data-testid="add-employee-department" />
              </div>
              <div className="space-y-2">
                <Label>Designation</Label>
                <Input value={newEmployee.designation}
                  onChange={(e) => setNewEmployee({...newEmployee, designation: e.target.value})}
                  data-testid="add-employee-designation" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Role</Label>
                <Select value={newEmployee.role} onValueChange={(v) => setNewEmployee({...newEmployee, role: v})}>
                  <SelectTrigger data-testid="add-employee-role"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="employee">Employee</SelectItem>
                    <SelectItem value="teamlead">Team Lead</SelectItem>
                    <SelectItem value="admin">Admin</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Password *</Label>
                <Input type="password" value={newEmployee.password}
                  onChange={(e) => setNewEmployee({...newEmployee, password: e.target.value})}
                  data-testid="add-employee-password" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Salary</Label>
                <Input type="number" value={newEmployee.salary}
                  onChange={(e) => setNewEmployee({...newEmployee, salary: e.target.value})}
                  data-testid="add-employee-salary" />
              </div>
              <div className="space-y-2">
                <Label>Salary Type</Label>
                <Select value={newEmployee.salary_type} onValueChange={(v) => setNewEmployee({...newEmployee, salary_type: v})}>
                  <SelectTrigger data-testid="add-employee-salary-type"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="monthly">Monthly</SelectItem>
                    <SelectItem value="daily">Daily</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            {/* Team Leader Assignment */}
            {newEmployee.role === 'employee' && (
              <div className="space-y-2">
                <Label>Assign Team Leader</Label>
                <Select value={newEmployee.team_lead_id} onValueChange={(v) => setNewEmployee({...newEmployee, team_lead_id: v})}>
                  <SelectTrigger data-testid="add-employee-team-leader"><SelectValue placeholder="Select Team Leader" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">No Team Leader</SelectItem>
                    {teamLeaders.map(tl => (
                      <SelectItem key={tl.id} value={tl.id}>{tl.name} ({tl.id})</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            
            {/* Bank Details Section */}
            {newEmployee.role !== 'admin' && (
              <div className="border-t pt-4 mt-4">
                <h4 className="font-semibold text-sm mb-3 flex items-center gap-2">
                  <Landmark size={16} /> Bank Details (Mandatory)
                </h4>
                <div className="grid grid-cols-1 gap-4">
                  <div className="space-y-2">
                    <Label>Bank Name *</Label>
                    <Input placeholder="e.g., HDFC Bank, SBI" value={newEmployee.bank_name}
                      onChange={(e) => setNewEmployee({...newEmployee, bank_name: e.target.value})}
                      data-testid="add-employee-bank-name" />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Account Number *</Label>
                      <Input placeholder="Enter account number" value={newEmployee.bank_account_number}
                        onChange={(e) => setNewEmployee({...newEmployee, bank_account_number: e.target.value})}
                        data-testid="add-employee-bank-account" />
                    </div>
                    <div className="space-y-2">
                      <Label>IFSC Code *</Label>
                      <Input placeholder="e.g., HDFC0001234" value={newEmployee.bank_ifsc}
                        onChange={(e) => setNewEmployee({...newEmployee, bank_ifsc: e.target.value.toUpperCase()})}
                        data-testid="add-employee-bank-ifsc" />
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddDialog(false)}>Cancel</Button>
            <Button onClick={handleAddEmployee} disabled={submitting} className="bg-[#1E2A5E]" data-testid="add-employee-submit">
              {submitting ? <Loader2 className="animate-spin mr-2" size={16} /> : null}
              Add Employee
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Employee Dialog */}
      <Dialog open={viewDialog.open} onOpenChange={(open) => setViewDialog({ open, employee: null })}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Employee Details</DialogTitle>
          </DialogHeader>
          {viewDialog.employee && (
            <div className="space-y-3">
              <div className="flex items-center gap-2"><strong>ID:</strong> {viewDialog.employee.id}</div>
              <div className="flex items-center gap-2"><strong>Name:</strong> {viewDialog.employee.name}</div>
              <div className="flex items-center gap-2"><Mail size={16} /> {viewDialog.employee.email}</div>
              <div className="flex items-center gap-2"><Phone size={16} /> {viewDialog.employee.phone || 'N/A'}</div>
              <div className="flex items-center gap-2"><Building size={16} /> {viewDialog.employee.department || 'N/A'}</div>
              <div className="flex items-center gap-2"><strong>Role:</strong> {viewDialog.employee.role}</div>
              <div className="flex items-center gap-2"><IndianRupee size={16} /> ₹{viewDialog.employee.salary?.toLocaleString()} / {viewDialog.employee.salary_type}</div>
              <div className="flex items-center gap-2"><Calendar size={16} /> Joined: {viewDialog.employee.joining_date || 'N/A'}</div>
              <div className="flex items-center gap-2">
                <strong>Status:</strong>
                <span className={`px-2 py-1 rounded text-xs ${viewDialog.employee.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                  {viewDialog.employee.status}
                </span>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Password Reset Dialog */}
      <Dialog open={passwordDialog.open} onOpenChange={(open) => setPasswordDialog({ open, employee: null })}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Reset Password</DialogTitle>
          </DialogHeader>
          {passwordDialog.employee && (
            <div className="space-y-4 py-4">
              <p className="text-sm text-gray-600">Reset password for <strong>{passwordDialog.employee.name}</strong> ({passwordDialog.employee.id})</p>
              <div className="space-y-2">
                <Label>New Password *</Label>
                <Input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Enter new password" />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setPasswordDialog({ open: false, employee: null })}>Cancel</Button>
            <Button onClick={handleResetPassword} disabled={submitting} className="bg-orange-600 hover:bg-orange-700">
              {submitting ? <Loader2 className="animate-spin mr-2" size={16} /> : null}
              Reset Password
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

const EmployeeList = ({ employees, onView, onToggle, canResetPassword, onResetPassword, navigate }) => {
  if (employees.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center text-gray-500">
          <Users className="mx-auto h-12 w-12 mb-4 text-gray-300" />
          <p>No employees found</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {employees.map((emp) => (
        <Card key={emp.id} className="hover:shadow-lg transition-shadow">
          <CardContent className="p-4">
            <div className="space-y-3">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-semibold text-lg">{emp.name}</h3>
                  <p className="text-sm text-gray-500">{emp.id}</p>
                </div>
                <span className={`px-2 py-1 rounded text-xs ${emp.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                  {emp.status}
                </span>
              </div>
              <div className="space-y-1 text-sm">
                <div className="flex items-center gap-2 text-gray-600">
                  <Mail size={14} /> {emp.email}
                </div>
                <div className="flex items-center gap-2 text-gray-600">
                  <Building size={14} /> {emp.department || 'N/A'}
                </div>
                <div className="flex items-center gap-2 text-gray-600">
                  <IndianRupee size={14} /> ₹{emp.salary?.toLocaleString()}
                </div>
              </div>
              <div className="flex gap-2 pt-2">
                <Button size="sm" variant="outline" onClick={() => onView(emp)} className="flex-1">
                  <Eye size={14} className="mr-1" /> View
                </Button>
                <Button size="sm" variant="outline" onClick={() => navigate(`/attendance/${emp.id}`)} className="flex-1 text-blue-600 border-blue-200">
                  <Calendar size={14} className="mr-1" /> Attendance
                </Button>
                {canResetPassword && (
                  <Button size="sm" variant="outline" onClick={() => onResetPassword(emp)} className="text-orange-600 border-orange-200">
                    <Key size={14} />
                  </Button>
                )}
                <Button size="sm" variant="outline" onClick={() => onToggle(emp)}
                  className={emp.status === 'active' ? 'text-red-600 border-red-200' : 'text-green-600 border-green-200'}>
                  {emp.status === 'active' ? <UserX size={14} /> : <UserCheck size={14} />}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default Employees;