import React, { createContext, useContext, useState, useEffect } from 'react';
import { employees, adminUser } from '../data/mockData';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check for stored user session
    const storedUser = localStorage.getItem('supermanage_user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
    setLoading(false);
  }, []);

  const login = (employeeId, password) => {
    // Check admin login
    if (employeeId === 'admin' && password === adminUser.password) {
      const userData = { ...adminUser, isAdmin: true };
      setUser(userData);
      localStorage.setItem('supermanage_user', JSON.stringify(userData));
      return { success: true, user: userData };
    }

    // Check employee login (using empId as username, default password is empId)
    const employee = employees.find(emp => emp.id.toLowerCase() === employeeId.toLowerCase());
    if (employee && password === employee.id.toLowerCase()) {
      const userData = { ...employee, isAdmin: false };
      setUser(userData);
      localStorage.setItem('supermanage_user', JSON.stringify(userData));
      return { success: true, user: userData };
    }

    return { success: false, error: 'Invalid credentials' };
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('supermanage_user');
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, loading, isAdmin: user?.isAdmin }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
