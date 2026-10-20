import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { GraduationCap, Eye, EyeOff, Lock, Mail, ArrowRight, AlertCircle, Shield } from 'lucide-react';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [unverifiedEmail, setUnverifiedEmail] = useState('');
  const [resending, setResending] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    setUnverifiedEmail('');
    setIsLoading(true);

    const result = await login(email, password);
    setIsLoading(false);

    if (result?.success) {
      const role = result.user.role;
      const targetPath = location.state?.from?.pathname || (
        role === 'admin'
          ? '/admin/dashboard'
          : role === 'faculty'
          ? '/faculty/dashboard'
          : '/student/dashboard'
      );
      navigate(targetPath, { replace: true });
    } else {
      setErrorMessage(result?.error || 'Invalid credentials.');
      if (result?.requiresEmailVerification) {
        setUnverifiedEmail(result.unverifiedEmail || email);
      }
    }
  };

  const handleResendVerification = async () => {
    if (!unverifiedEmail) return;
    setResending(true);
    try {
      await api.post('/auth/resend-verification', { email: unverifiedEmail });
      toast.success('A new verification email has been dispatched! Please check your inbox.');
    } catch (err) {
      toast.error('Could not resend verification email.');
    } finally {
      setResending(false);
    }
  };

  const handleDemoFill = (demoEmail, demoPassword) => {
    setEmail(demoEmail);
    setPassword(demoPassword);
    setErrorMessage('');
    setUnverifiedEmail('');
  };

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <Link to="/" className="inline-flex items-center gap-2 mb-4">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-blue-600 flex items-center justify-center text-white shadow-md shadow-indigo-300">
            <GraduationCap className="w-6 h-6" />
          </div>
          <span className="font-extrabold text-2xl tracking-tight text-slate-900">
            SmartCampus <span className="text-indigo-600">AI</span>
          </span>
        </Link>
        <h2 className="text-2xl font-bold tracking-tight text-slate-900">
          Sign in to your campus account
        </h2>
        <p className="mt-1 text-sm text-slate-500">
          Select a role or enter your institutional credentials
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md px-4">
        <div className="bg-white py-8 px-6 shadow-sm border border-slate-200 rounded-2xl sm:px-10">
          {/* Quick Demo Fill Buttons */}
          <div className="mb-6 pb-6 border-b border-slate-100">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2.5">
              <Shield className="w-3.5 h-3.5 text-indigo-600" /> Demo Accounts Auto-Fill:
            </div>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => handleDemoFill('admin@smartcampus.edu', 'Admin@12345')}
                className="py-1.5 px-2 bg-purple-50 hover:bg-purple-100 text-purple-700 text-xs font-semibold rounded-lg border border-purple-200 transition text-center"
              >
                Admin
              </button>
              <button
                type="button"
                onClick={() => handleDemoFill('dr.sharma@smartcampus.edu', 'Faculty@12345')}
                className="py-1.5 px-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-xs font-semibold rounded-lg border border-emerald-200 transition text-center"
              >
                Faculty
              </button>
              <button
                type="button"
                onClick={() => handleDemoFill('alex.student@smartcampus.edu', 'Student@12345')}
                className="py-1.5 px-2 bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-semibold rounded-lg border border-blue-200 transition text-center"
              >
                Student
              </button>
            </div>
          </div>

          {errorMessage && (
            <div className="mb-4 p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700">
              <div className="flex items-start gap-2.5">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-500 mt-0.5" />
                <span>{errorMessage}</span>
              </div>
              {unverifiedEmail && (
                <div className="mt-2.5 pt-2.5 border-t border-rose-200 flex items-center justify-between">
                  <span className="text-[11px] text-rose-600">Didn't receive verification email?</span>
                  <button
                    type="button"
                    onClick={handleResendVerification}
                    disabled={resending}
                    className="text-[11px] font-bold text-indigo-600 hover:text-indigo-800 underline disabled:opacity-50 cursor-pointer"
                  >
                    {resending ? 'Sending...' : 'Resend Verification Link'}
                  </button>
                </div>
              )}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                College Email Address
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Mail className="w-4 h-4" />
                </div>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="student@smartcampus.edu"
                  className="w-full pl-9 pr-3 py-2 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-semibold text-slate-700">
                  Password
                </label>
                <Link
                  to="/forgot-password"
                  className="text-xs font-medium text-indigo-600 hover:text-indigo-500"
                >
                  Forgot password?
                </Link>
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-9 pr-10 py-2 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 focus:outline-none"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-4 h-4 text-indigo-600 border-slate-300 rounded focus:ring-indigo-500"
                />
                <span className="text-xs text-slate-600">Remember this device</span>
              </label>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-sm font-semibold shadow-sm transition disabled:opacity-60 cursor-pointer"
            >
              {isLoading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <>
                  Sign In <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          <div className="mt-6 pt-6 border-t border-slate-100 text-center space-y-2">
            <p className="text-xs text-slate-500">
              New student?{' '}
              <Link to="/register/student" className="font-semibold text-indigo-600 hover:text-indigo-500">
                Register as Student
              </Link>
            </p>
            <p className="text-xs text-slate-500">
              New faculty member?{' '}
              <Link to="/register/faculty" className="font-semibold text-indigo-600 hover:text-indigo-500">
                Register as Faculty
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
