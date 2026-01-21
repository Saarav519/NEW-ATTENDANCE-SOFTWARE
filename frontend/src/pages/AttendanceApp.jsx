import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./attendance/context/AuthContext";
import { NotificationProvider } from "./attendance/context/NotificationContext";
import { Toaster } from "./attendance/components/ui/toaster";
import Login from "./attendance/pages/Login";
import MainLayout from "./attendance/components/Layout/MainLayout";
import Dashboard from "./attendance/pages/Dashboard";
import Employees from "./attendance/pages/Employees";
import Attendance from "./attendance/pages/Attendance";
import MyAttendance from "./attendance/pages/MyAttendance";
import AttendanceDetails from "./attendance/pages/AttendanceDetails";
import Team from "./attendance/pages/Team";
import TeamAttendance from "./attendance/pages/TeamAttendance";
import Leaves from "./attendance/pages/Leaves";
import BillSubmission from "./attendance/pages/BillSubmission";
import Advances from "./attendance/pages/Advances";
import Payroll from "./attendance/pages/Payroll";
import Payslip from "./attendance/pages/Payslip";
import Cashbook from "./attendance/pages/Cashbook";
import Vehicles from "./attendance/pages/Vehicles";
import Holidays from "./attendance/pages/Holidays";
import Reports from "./attendance/pages/Reports";
import Profile from "./attendance/pages/Profile";
import ShiftTemplates from "./attendance/pages/ShiftTemplates";
import AuditExpenses from "./attendance/pages/AuditExpenses";
import EmployeeAttendance from "./attendance/pages/EmployeeAttendance";

function AttendanceApp() {
  return (
    <AuthProvider>
      <NotificationProvider>
        <Toaster />
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/" element={<MainLayout />}>
            <Route index element={<Navigate to="/attendance/dashboard" replace />} />
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="employees" element={<Employees />} />
            <Route path="attendance/:empId" element={<EmployeeAttendance />} />
            <Route path="attendance-tracking" element={<Attendance />} />
            <Route path="my-attendance" element={<MyAttendance />} />
            <Route path="attendance-details" element={<AttendanceDetails />} />
            <Route path="team" element={<Team />} />
            <Route path="team-attendance" element={<TeamAttendance />} />
            <Route path="leaves" element={<Leaves />} />
            <Route path="bills" element={<BillSubmission />} />
            <Route path="advances" element={<Advances />} />
            <Route path="payroll" element={<Payroll />} />
            <Route path="payslip/:id" element={<Payslip />} />
            <Route path="cashbook" element={<Cashbook />} />
            <Route path="vehicles" element={<Vehicles />} />
            <Route path="holidays" element={<Holidays />} />
            <Route path="reports" element={<Reports />} />
            <Route path="profile" element={<Profile />} />
            <Route path="shift-templates" element={<ShiftTemplates />} />
            <Route path="audit-expenses" element={<AuditExpenses />} />
          </Route>
        </Routes>
      </NotificationProvider>
    </AuthProvider>
  );
}

export default AttendanceApp;
