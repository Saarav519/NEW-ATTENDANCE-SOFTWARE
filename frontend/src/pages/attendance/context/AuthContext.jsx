import React, { createContext, useContext, useState, useEffect } from 'react';
import { authAPI } from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState(null);

  useEffect(() => {
    // Check for stored user session
    const storedUser = localStorage.getItem('supermanage_user');
    const storedToken = localStorage.getItem('supermanage_token');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
      setToken(storedToken);
    }
    setLoading(false);
  }, []);

  const login = async (userId, password) => {
    try {
      const result = await authAPI.login(userId, password);
      
      if (result.success) {
        const userData = { 
          ...result.user, 
          isAdmin: result.user.role === 'admin',
          isTeamLead: result.user.role === 'teamlead',
          isEmployee: result.user.role === 'employee'
        };
        setUser(userData);
        setToken(result.token);
        localStorage.setItem('supermanage_user', JSON.stringify(userData));
        localStorage.setItem('supermanage_token', result.token);
        return { success: true, user: userData };
      }
      
      return { success: false, error: result.error || 'Login failed' };
    } catch (error) {
      return { success: false, error: error.message || 'Login failed' };
    }
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('supermanage_user');
    localStorage.removeItem('supermanage_token');
  };

  const updateUser = (updatedUser) => {
    setUser(updatedUser);
    localStorage.setItem('supermanage_user', JSON.stringify(updatedUser));
  };

  const value = {
    user,
    token,
    login,
    logout,
    updateUser,
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
