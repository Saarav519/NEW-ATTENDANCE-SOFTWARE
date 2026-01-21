import React from "react";
import "./App.css";
import { Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import { NotificationProvider } from "./context/NotificationContext";
import { Toaster } from "./components/ui/toaster";
import Login from "./pages/Login";
import MainLayout from "./components/Layout/MainLayout";
import Dashboard from "./pages/Dashboard";
import Employees from "./pages/Employees";
import Attendance from "./pages/Attendance";
import MyAttendance from "./pages/MyAttendance";
import AttendanceDetails from "./pages/AttendanceDetails";
import Team from "./pages/Team";
import TeamAttendance from "./pages/TeamAttendance";
import Leaves from "./pages/Leaves";
import BillSubmission from "./pages/BillSubmission";
import Advances from "./pages/Advances";
import Payroll from "./pages/Payroll";
import Payslip from "./pages/Payslip";
import Cashbook from "./pages/Cashbook";
import Vehicles from "./pages/Vehicles";
import Holidays from "./pages/Holidays";
import Reports from "./pages/Reports";
import Profile from "./pages/Profile";
import ShiftTemplates from "./pages/ShiftTemplates";
import AuditExpenses from "./pages/AuditExpenses";

import EmployeeAttendance from "./pages/EmployeeAttendance";

function App() {
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
            <Route path="attendance" element={<Attendance />} />
            <Route path="my-attendance" element={<MyAttendance />} />
            <Route path="attendance-details" element={<AttendanceDetails />} />
            <Route path="team" element={<Team />} />
            <Route path="team-attendance" element={<TeamAttendance />} />
            <Route path="leaves" element={<Leaves />} />
            <Route path="bills" element={<BillSubmission />} />
            <Route path="audit-expenses" element={<AuditExpenses />} />
            <Route path="advances" element={<Advances />} />
            <Route path="payroll" element={<Payroll />} />
            <Route path="payslip" element={<Payslip />} />
            <Route path="cashbook" element={<Cashbook />} />
            <Route path="vehicles" element={<Vehicles />} />
            <Route path="holidays" element={<Holidays />} />
            <Route path="reports" element={<Reports />} />
            <Route path="profile" element={<Profile />} />
            <Route path="shift-templates" element={<ShiftTemplates />} />
          </Route>
          <Route path="*" element={<Navigate to="/attendance/dashboard" replace />} />
        </Routes>
      </NotificationProvider>
    </AuthProvider>
  );
}

export default App;
