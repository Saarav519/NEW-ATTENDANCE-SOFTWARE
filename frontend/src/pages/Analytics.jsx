import React, { useState, useEffect } from 'react';
import { analyticsAPI, exportAPI } from '../services/api';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from '../components/ui/select';
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import {
  TrendingUp, Users, Calendar, IndianRupee, Download,
  Building, Clock, PieChartIcon, BarChart3, FileDown
} from 'lucide-react';
import toast from 'react-hot-toast';

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

const TIME_FILTERS = [
  { value: 'this_week', label: 'This Week' },
  { value: 'this_month', label: 'This Month' },
  { value: 'this_quarter', label: 'This Quarter' },
  { value: 'this_year', label: 'This Year' },
];

const Analytics = () => {
  const [timeFilter, setTimeFilter] = useState('this_month');
  const [loading, setLoading] = useState(true);
  const [analyticsData, setAnalyticsData] = useState({
    attendance_trends: [],
    leave_distribution: [],
    department_attendance: [],
    salary_overview: [],
    employee_counts: [],
  });

  useEffect(() => {
    loadAnalytics();
  }, [timeFilter]);

  const loadAnalytics = async () => {
    setLoading(true);
    try {
      const data = await analyticsAPI.getSummary(timeFilter);
      setAnalyticsData(data);
    } catch (error) {
      console.error('Error loading analytics:', error);
      toast.error('Failed to load analytics data');
    } finally {
      setLoading(false);
    }
  };

  const handleExport = (type) => {
    let url;
    switch (type) {
      case 'employees':
        url = exportAPI.employees();
        break;
      case 'attendance':
        url = exportAPI.attendance();
        break;
      case 'leaves':
        url = exportAPI.leaves();
        break;
      case 'payslips':
        url = exportAPI.payslips('settled');
        break;
      case 'bills':
        url = exportAPI.bills();
        break;
      default:
        return;
    }
    
    // Open download in new tab
    window.open(url, '_blank');
    toast.success(`Downloading ${type} data...`);
  };

  // Calculate summary stats
  const totalEmployees = analyticsData.employee_counts.reduce((sum, item) => sum + item.count, 0);
  const activeEmployees = analyticsData.employee_counts.reduce((sum, item) => sum + item.active, 0);
  const totalAttendance = analyticsData.attendance_trends.reduce((sum, item) => sum + item.present, 0);
  const totalSalary = analyticsData.salary_overview.reduce((sum, item) => sum + item.net_paid, 0);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="animate-spin h-12 w-12 border-4 border-blue-500 border-t-transparent rounded-full mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading analytics...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Analytics Dashboard</h1>
          <p className="text-gray-500 mt-1">Insights and reports for your organization</p>
        </div>
        
        <div className="flex flex-wrap gap-3">
          {/* Time Filter */}
          <Select value={timeFilter} onValueChange={setTimeFilter}>
            <SelectTrigger className="w-[160px]">
              <SelectValue placeholder="Select period" />
            </SelectTrigger>
            <SelectContent>
              {TIME_FILTERS.map((filter) => (
                <SelectItem key={filter.value} value={filter.value}>
                  {filter.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          {/* Export Dropdown */}
          <div className="relative group">
            <Button variant="outline" className="gap-2">
              <Download className="h-4 w-4" />
              Export CSV
            </Button>
            <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50">
              <div className="py-1">
                {['employees', 'attendance', 'leaves', 'payslips', 'bills'].map((type) => (
                  <button
                    key={type}
                    onClick={() => handleExport(type)}
                    className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 capitalize"
                  >
                    <FileDown className="h-4 w-4 inline mr-2" />
                    {type}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Users className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Total Employees</p>
                <p className="text-2xl font-bold">{totalEmployees}</p>
                <p className="text-xs text-green-600">{activeEmployees} active</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <Clock className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Attendance</p>
                <p className="text-2xl font-bold">{totalAttendance}</p>
                <p className="text-xs text-gray-500">{timeFilter.replace('_', ' ')}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-orange-100 rounded-lg">
                <Calendar className="h-5 w-5 text-orange-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Leave Types</p>
                <p className="text-2xl font-bold">{analyticsData.leave_distribution.length}</p>
                <p className="text-xs text-gray-500">categories</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <IndianRupee className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Total Paid</p>
                <p className="text-2xl font-bold">₹{(totalSalary / 1000).toFixed(0)}K</p>
                <p className="text-xs text-gray-500">net salary</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Attendance Trends */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-blue-500" />
              Attendance Trends
            </CardTitle>
          </CardHeader>
          <CardContent>
            {analyticsData.attendance_trends.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={analyticsData.attendance_trends}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="date" 
                    tick={{ fontSize: 12 }}
                    tickFormatter={(value) => value.slice(5)}
                  />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip />
                  <Legend />
                  <Line 
                    type="monotone" 
                    dataKey="present" 
                    stroke="#10b981" 
                    strokeWidth={2}
                    name="Present"
                  />
                  <Line 
                    type="monotone" 
                    dataKey="half_day" 
                    stroke="#f59e0b" 
                    strokeWidth={2}
                    name="Half Day"
                  />
                  <Line 
                    type="monotone" 
                    dataKey="absent" 
                    stroke="#ef4444" 
                    strokeWidth={2}
                    name="Absent"
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[300px] flex items-center justify-center text-gray-500">
                <div className="text-center">
                  <TrendingUp className="h-12 w-12 mx-auto text-gray-300 mb-2" />
                  <p>No attendance data for this period</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Leave Distribution */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <PieChartIcon className="h-5 w-5 text-orange-500" />
              Leave Distribution
            </CardTitle>
          </CardHeader>
          <CardContent>
            {analyticsData.leave_distribution.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={analyticsData.leave_distribution}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ type, percentage }) => `${type}: ${percentage}%`}
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="count"
                  >
                    {analyticsData.leave_distribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[300px] flex items-center justify-center text-gray-500">
                <div className="text-center">
                  <PieChartIcon className="h-12 w-12 mx-auto text-gray-300 mb-2" />
                  <p>No leave data for this period</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Department Attendance */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <Building className="h-5 w-5 text-green-500" />
              Department-wise Attendance
            </CardTitle>
          </CardHeader>
          <CardContent>
            {analyticsData.department_attendance.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={analyticsData.department_attendance}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="department" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="present" fill="#10b981" name="Present" />
                  <Bar dataKey="absent" fill="#ef4444" name="Absent" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[300px] flex items-center justify-center text-gray-500">
                <div className="text-center">
                  <Building className="h-12 w-12 mx-auto text-gray-300 mb-2" />
                  <p>No department data available</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Salary Overview */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <IndianRupee className="h-5 w-5 text-purple-500" />
              Salary Overview
            </CardTitle>
          </CardHeader>
          <CardContent>
            {analyticsData.salary_overview.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={analyticsData.salary_overview}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="month" 
                    tick={{ fontSize: 11 }}
                    tickFormatter={(value) => value.split(' ')[0].slice(0, 3)}
                  />
                  <YAxis 
                    tick={{ fontSize: 12 }}
                    tickFormatter={(value) => `₹${(value / 1000).toFixed(0)}K`}
                  />
                  <Tooltip 
                    formatter={(value) => [`₹${value.toLocaleString()}`, '']}
                  />
                  <Legend />
                  <Bar dataKey="total_salary" fill="#8b5cf6" name="Gross Salary" />
                  <Bar dataKey="total_deductions" fill="#ef4444" name="Deductions" />
                  <Bar dataKey="net_paid" fill="#10b981" name="Net Paid" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[300px] flex items-center justify-center text-gray-500">
                <div className="text-center">
                  <IndianRupee className="h-12 w-12 mx-auto text-gray-300 mb-2" />
                  <p>No salary data available</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Employee Distribution */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-blue-500" />
            Employee Distribution by Role
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {analyticsData.employee_counts.map((item, index) => (
              <div 
                key={item.role}
                className="p-4 bg-gray-50 rounded-lg border"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500 capitalize">{item.role}</p>
                    <p className="text-3xl font-bold" style={{ color: COLORS[index % COLORS.length] }}>
                      {item.count}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-green-600">{item.active} active</p>
                    <p className="text-sm text-gray-400">{item.inactive} inactive</p>
                  </div>
                </div>
                <div className="mt-2 h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div 
                    className="h-full rounded-full"
                    style={{ 
                      width: `${(item.active / item.count) * 100}%`,
                      backgroundColor: COLORS[index % COLORS.length]
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Quick Export Buttons */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg flex items-center gap-2">
            <Download className="h-5 w-5 text-gray-500" />
            Export Data
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            <Button 
              variant="outline" 
              onClick={() => handleExport('employees')}
              className="gap-2"
            >
              <Users className="h-4 w-4" />
              Employees
            </Button>
            <Button 
              variant="outline" 
              onClick={() => handleExport('attendance')}
              className="gap-2"
            >
              <Clock className="h-4 w-4" />
              Attendance
            </Button>
            <Button 
              variant="outline" 
              onClick={() => handleExport('leaves')}
              className="gap-2"
            >
              <Calendar className="h-4 w-4" />
              Leaves
            </Button>
            <Button 
              variant="outline" 
              onClick={() => handleExport('payslips')}
              className="gap-2"
            >
              <IndianRupee className="h-4 w-4" />
              Payslips
            </Button>
            <Button 
              variant="outline" 
              onClick={() => handleExport('bills')}
              className="gap-2"
            >
              <Receipt className="h-4 w-4" />
              Bills
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Analytics;
