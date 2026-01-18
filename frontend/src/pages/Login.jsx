import React, { useState } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Eye, EyeOff, Lock, User, Shield, Users, UserCircle } from 'lucide-react';

const Login = () => {
  const [userId, setUserId] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login, user } = useAuth();
  const navigate = useNavigate();

  if (user) {
    return <Navigate to="/dashboard" replace />;
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const result = await login(userId, password);
    
    if (result.success) {
      navigate('/dashboard');
    } else {
      setError(result.error);
    }
    setLoading(false);
  };

  const demoCredentials = [
    { role: 'Admin', id: 'ADMIN001', pass: 'admin123', icon: Shield, color: 'bg-red-500' },
    { role: 'Team Lead', id: 'TL001', pass: 'tl001', icon: Users, color: 'bg-blue-500' },
    { role: 'Employee', id: 'EMP001', pass: 'emp001', icon: UserCircle, color: 'bg-green-500' },
  ];

  const quickLogin = (id, pass) => {
    setUserId(id);
    setPassword(pass);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#1E2A5E] to-[#2D3A8C] flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-6">
          <div className="w-16 h-16 mx-auto mb-3 relative">
            <div className="absolute inset-0 rounded-full bg-gradient-to-r from-red-500 via-yellow-500 to-blue-500 animate-spin" style={{ animationDuration: '8s' }}></div>
            <div className="absolute inset-1.5 bg-[#1E2A5E] rounded-full flex items-center justify-center">
              <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center">
                <div className="w-3 h-3 bg-[#1E2A5E] rounded-full"></div>
              </div>
            </div>
          </div>
          <h1 className="text-2xl font-bold text-white mb-1">SuperManage</h1>
          <p className="text-gray-300 text-sm">Audix Solutions & Co.</p>
        </div>

        {/* Login Card */}
        <div className="bg-white rounded-2xl shadow-2xl p-6">
          <h2 className="text-xl font-bold text-gray-800 mb-5 text-center">Welcome Back</h2>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="userId" className="text-gray-700 text-sm">User ID</Label>
              <div className="relative">
                <User size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <Input
                  id="userId"
                  data-testid="login-user-id"
                  type="text"
                  placeholder="Enter your ID"
                  value={userId}
                  onChange={(e) => setUserId(e.target.value)}
                  className="pl-10 h-11"
                  required
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="password" className="text-gray-700 text-sm">Password</Label>
              <div className="relative">
                <Lock size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <Input
                  id="password"
                  data-testid="login-password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10 pr-10 h-11"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {error && (
              <div className="bg-red-50 text-red-600 text-sm p-3 rounded-lg" data-testid="login-error">
                {error}
              </div>
            )}

            <Button
              type="submit"
              data-testid="login-submit-btn"
              disabled={loading}
              className="w-full h-11 bg-[#1E2A5E] hover:bg-[#2D3A8C] text-white font-semibold rounded-xl"
            >
              {loading ? (
                <div className="animate-spin w-5 h-5 border-2 border-white border-t-transparent rounded-full"></div>
              ) : (
                'Sign In'
              )}
            </Button>
          </form>

          {/* Quick Login Options */}
          <div className="mt-5 pt-5 border-t">
            <p className="text-xs text-gray-500 text-center mb-3">Quick Login (Demo)</p>
            <div className="grid grid-cols-3 gap-2">
              {demoCredentials.map((cred) => (
                <button
                  key={cred.role}
                  data-testid={`quick-login-${cred.role.toLowerCase().replace(' ', '-')}`}
                  onClick={() => quickLogin(cred.id, cred.pass)}
                  className="flex flex-col items-center p-2 rounded-xl border hover:border-[#1E2A5E] hover:bg-gray-50 transition-all"
                >
                  <div className={`w-8 h-8 ${cred.color} rounded-lg flex items-center justify-center mb-1`}>
                    <cred.icon size={16} className="text-white" />
                  </div>
                  <span className="text-xs font-medium text-gray-700">{cred.role}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        <p className="text-center text-gray-400 text-xs mt-4">
          © 2025 SuperManage. All rights reserved.
        </p>
      </div>
    </div>
  );
};

export default Login;
