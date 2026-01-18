import React, { createContext, useContext, useState, useEffect } from 'react';
import { users } from '../data/mockData';

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

  const login = (userId, password) => {
    // Find user by ID (case insensitive)
    const foundUser = users.find(
      u => u.id.toLowerCase() === userId.toLowerCase() && u.password === password
    );

    if (foundUser) {
      const userData = { 
        ...foundUser, 
        isAdmin: foundUser.role === 'admin',
        isTeamLead: foundUser.role === 'teamlead',
        isEmployee: foundUser.role === 'employee'
      };
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

  const value = {
    user,
    login,
    logout,
    loading,
    isAdmin: user?.role === 'admin',
    isTeamLead: user?.role === 'teamlead',
    isEmployee: user?.role === 'employee',
    role: user?.role
  };

  return (
    <AuthContext.Provider value={value}>
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
