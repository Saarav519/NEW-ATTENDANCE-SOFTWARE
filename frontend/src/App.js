import React from "react";
import "./App.css";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import Login from "./pages/Login";
import MainLayout from "./components/Layout/MainLayout";
import Dashboard from "./pages/Dashboard";
import Employees from "./pages/Employees";
import Attendance from "./pages/Attendance";
import Leaves from "./pages/Leaves";
import Overtime from "./pages/Overtime";
import Advances from "./pages/Advances";
import Payroll from "./pages/Payroll";
import Cashbook from "./pages/Cashbook";
import Vehicles from "./pages/Vehicles";
import Holidays from "./pages/Holidays";
import Reports from "./pages/Reports";

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/" element={<MainLayout />}>
            <Route index element={<Navigate to="/dashboard" replace />} />
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="employees" element={<Employees />} />
            <Route path="attendance" element={<Attendance />} />
            <Route path="leaves" element={<Leaves />} />
            <Route path="overtime" element={<Overtime />} />
            <Route path="advances" element={<Advances />} />
            <Route path="payroll" element={<Payroll />} />
            <Route path="cashbook" element={<Cashbook />} />
            <Route path="vehicles" element={<Vehicles />} />
            <Route path="holidays" element={<Holidays />} />
            <Route path="reports" element={<Reports />} />
          </Route>
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
