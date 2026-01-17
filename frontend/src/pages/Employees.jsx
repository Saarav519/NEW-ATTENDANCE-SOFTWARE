import React, { useState } from 'react';
import { employees } from '../data/mockData';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose
} from '../components/ui/dialog';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from '../components/ui/select';
import {
  Users, Plus, Search, MoreVertical, Edit, Trash2, Eye,
  Mail, Phone, Building, Calendar, IndianRupee, UserCheck, UserX
} from 'lucide-react';

const Employees = () => {
  const [employeeList, setEmployeeList] = useState(employees);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [newEmployee, setNewEmployee] = useState({
    name: '', email: '', phone: '', department: '', designation: '', salary: '', salaryType: 'monthly'
  });

  const filteredEmployees = employeeList.filter(emp => {
    const matchesSearch = emp.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         emp.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         emp.department.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'all' || emp.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const activeCount = employeeList.filter(e => e.status === 'active').length;
  const inactiveCount = employeeList.filter(e => e.status === 'inactive').length;

  const handleAddEmployee = () => {
    const emp = {
      id: `EMP${String(employeeList.length + 1).padStart(3, '0')}`,
      ...newEmployee,
      salary: parseInt(newEmployee.salary),
      role: 'employee',
      joiningDate: new Date().toISOString().split('T')[0],
      status: 'active',
      avatar: null
    };
    setEmployeeList([...employeeList, emp]);
    setNewEmployee({ name: '', email: '', phone: '', department: '', designation: '', salary: '', salaryType: 'monthly' });
    setIsAddDialogOpen(false);
  };

  const toggleStatus = (empId) => {
    setEmployeeList(employeeList.map(emp =>
      emp.id === empId ? { ...emp, status: emp.status === 'active' ? 'inactive' : 'active' } : emp
    ));
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Employees</h1>
          <p className="text-gray-500">Manage your workforce</p>
        </div>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-[#1E2A5E] hover:bg-[#2D3A8C]">
              <Plus size={18} className="mr-2" /> Add Employee
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Add New Employee</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Full Name</Label>
                <Input
                  placeholder="Enter full name"
                  value={newEmployee.name}
                  onChange={(e) => setNewEmployee({...newEmployee, name: e.target.value})}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Email</Label>
                  <Input
                    type="email"
                    placeholder="Email address"
                    value={newEmployee.email}
                    onChange={(e) => setNewEmployee({...newEmployee, email: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Phone</Label>
                  <Input
                    placeholder="Phone number"
                    value={newEmployee.phone}
                    onChange={(e) => setNewEmployee({...newEmployee, phone: e.target.value})}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Department</Label>
                  <Input
                    placeholder="Department"
                    value={newEmployee.department}
                    onChange={(e) => setNewEmployee({...newEmployee, department: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Designation</Label>
                  <Input
                    placeholder="Designation"
                    value={newEmployee.designation}
                    onChange={(e) => setNewEmployee({...newEmployee, designation: e.target.value})}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Salary (₹)</Label>
                  <Input
                    type="number"
                    placeholder="Monthly salary"
                    value={newEmployee.salary}
                    onChange={(e) => setNewEmployee({...newEmployee, salary: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Salary Type</Label>
                  <Select value={newEmployee.salaryType} onValueChange={(v) => setNewEmployee({...newEmployee, salaryType: v})}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="monthly">Monthly</SelectItem>
                      <SelectItem value="daily">Daily</SelectItem>
                      <SelectItem value="hourly">Hourly</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
            <DialogFooter>
              <DialogClose asChild>
                <Button variant="outline">Cancel</Button>
              </DialogClose>
              <Button onClick={handleAddEmployee} className="bg-[#1E2A5E] hover:bg-[#2D3A8C]">
                Add Employee
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
              <Users size={24} className="text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-800">{employeeList.length}</p>
              <p className="text-sm text-gray-500">Total Employees</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
              <UserCheck size={24} className="text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-800">{activeCount}</p>
              <p className="text-sm text-gray-500">Active</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center">
              <UserX size={24} className="text-red-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-800">{inactiveCount}</p>
              <p className="text-sm text-gray-500">Inactive</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <Input
                placeholder="Search by name, ID, or department..."
                className="pl-10"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-full sm:w-40">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Employee List */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="text-left p-4 font-semibold text-gray-600 text-sm">Employee</th>
                  <th className="text-left p-4 font-semibold text-gray-600 text-sm">Department</th>
                  <th className="text-left p-4 font-semibold text-gray-600 text-sm">Contact</th>
                  <th className="text-left p-4 font-semibold text-gray-600 text-sm">Salary</th>
                  <th className="text-left p-4 font-semibold text-gray-600 text-sm">Status</th>
                  <th className="text-left p-4 font-semibold text-gray-600 text-sm">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {filteredEmployees.map((emp) => (
                  <tr key={emp.id} className="hover:bg-gray-50 transition-colors">
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white font-bold text-sm">
                          {emp.name.split(' ').map(n => n[0]).join('')}
                        </div>
                        <div>
                          <p className="font-medium text-gray-800">{emp.name}</p>
                          <p className="text-xs text-gray-500">{emp.id}</p>
                        </div>
                      </div>
                    </td>
                    <td className="p-4">
                      <p className="text-gray-800">{emp.department}</p>
                      <p className="text-xs text-gray-500">{emp.designation}</p>
                    </td>
                    <td className="p-4">
                      <p className="text-gray-800 text-sm">{emp.email}</p>
                      <p className="text-xs text-gray-500">{emp.phone}</p>
                    </td>
                    <td className="p-4">
                      <p className="font-semibold text-gray-800">₹{emp.salary.toLocaleString()}</p>
                      <p className="text-xs text-gray-500 capitalize">{emp.salaryType}</p>
                    </td>
                    <td className="p-4">
                      <span className={`text-xs px-3 py-1 rounded-full font-medium ${
                        emp.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                      }`}>
                        {emp.status}
                      </span>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => { setSelectedEmployee(emp); setIsViewDialogOpen(true); }}
                          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                        >
                          <Eye size={16} className="text-gray-600" />
                        </button>
                        <button
                          onClick={() => toggleStatus(emp.id)}
                          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                        >
                          {emp.status === 'active' ? <UserX size={16} className="text-red-500" /> : <UserCheck size={16} className="text-green-500" />}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* View Employee Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Employee Details</DialogTitle>
          </DialogHeader>
          {selectedEmployee && (
            <div className="space-y-4 py-4">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white font-bold text-xl">
                  {selectedEmployee.name.split(' ').map(n => n[0]).join('')}
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-800">{selectedEmployee.name}</h3>
                  <p className="text-gray-500">{selectedEmployee.id}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                <div className="flex items-center gap-2 text-sm">
                  <Mail size={16} className="text-gray-400" />
                  <span>{selectedEmployee.email}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Phone size={16} className="text-gray-400" />
                  <span>{selectedEmployee.phone}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Building size={16} className="text-gray-400" />
                  <span>{selectedEmployee.department}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Calendar size={16} className="text-gray-400" />
                  <span>{selectedEmployee.joiningDate}</span>
                </div>
                <div className="flex items-center gap-2 text-sm col-span-2">
                  <IndianRupee size={16} className="text-gray-400" />
                  <span>₹{selectedEmployee.salary.toLocaleString()} / {selectedEmployee.salaryType}</span>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Employees;
