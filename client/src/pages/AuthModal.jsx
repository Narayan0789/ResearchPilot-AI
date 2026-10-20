import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { X, Lock, Mail, User, AlertCircle, Loader2, Sparkles, Compass } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext.jsx';

export default function AuthModal({ isOpen, onClose, initialMode = 'login' }) {
  const { login, register, googleLogin } = useAuth();
  const [mode, setMode] = useState(initialMode); // 'login' | 'register'

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMessage('');
    setIsLoading(true);

    try {
      if (mode === 'login') {
        await login(email, password);
        setIsLoading(false);
        onClose();
      } else {
        await register(name, email, password);
        setIsLoading(false);
        setSuccessMessage('Account created successfully! Please enter your password to sign in.');
        setMode('login');
        setPassword('');
      }
    } catch (err) {
      setIsLoading(false);
      setError(err.message || 'Authentication failed. Please check your credentials.');
    }
  };

  const handleGoogleSignIn = async () => {
    setError('');
    setIsLoading(true);
    try {
      // Calls Google sign in endpoint with demo token / Google OAuth profile
      await googleLogin({
        email: email || 'researcher.google@researchpilot.ai',
        name: name || 'Dr. Alex Vance (Google)',
        avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop&crop=faces',
      });
      setIsLoading(false);
      onClose();
    } catch (err) {
      setIsLoading(false);
      setError(err.message || 'Google Sign-In failed.');
    }
  };



  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-navy-950/80 backdrop-blur-md animate-fade-in">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="w-full max-w-md bg-navy-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden"
      >
        {/* Modal Header */}
        <div className="px-6 pt-6 pb-4 border-b border-slate-800/80 flex items-center justify-between bg-navy-950/40">
          <div className="flex items-center space-x-2.5">
            <div className="h-8 w-8 rounded-lg bg-gradient-to-tr from-teal-500 to-cyan-500 flex items-center justify-center text-navy-950 shadow-md">
              <Compass className="w-4 h-4 text-navy-950 font-bold" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-100">ResearchPilot AI</h2>
              <p className="text-[10px] text-teal-400">Personal Research Assistant</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab Toggle */}
        <div className="grid grid-cols-2 border-b border-slate-800 text-xs font-semibold bg-navy-950/20">
          <button
            onClick={() => { setMode('login'); setError(''); setSuccessMessage(''); }}
            className={`py-3 text-center border-b-2 transition-all ${
              mode === 'login'
                ? 'border-teal-400 text-teal-300 font-bold'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            Sign In
          </button>
          <button
            onClick={() => { setMode('register'); setError(''); setSuccessMessage(''); }}
            className={`py-3 text-center border-b-2 transition-all ${
              mode === 'register'
                ? 'border-teal-400 text-teal-300 font-bold'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            Create Account
          </button>
        </div>

        <div className="p-6 space-y-4">
          {error && (
            <div className="p-3 rounded-xl bg-red-950/40 border border-red-500/30 text-xs text-red-300 flex items-start space-x-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {successMessage && (
            <div className="p-3 rounded-xl bg-teal-950/50 border border-teal-500/40 text-xs text-teal-300 flex items-start space-x-2">
              <Sparkles className="w-4 h-4 shrink-0 mt-0.5 text-teal-400" />
              <span>{successMessage}</span>
            </div>
          )}

          {/* Google Sign-In Button */}
          <button
            type="button"
            onClick={handleGoogleSignIn}
            disabled={isLoading}
            className="w-full py-2.5 px-4 rounded-xl bg-navy-800 hover:bg-slate-800 border border-slate-700/80 text-xs font-semibold text-slate-200 flex items-center justify-center space-x-3 transition-all shadow-sm group"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
              />
            </svg>
            <span>Continue with Google</span>
          </button>

          <div className="relative flex py-1 items-center">
            <div className="flex-grow border-t border-slate-800"></div>
            <span className="flex-shrink mx-3 text-[11px] text-slate-500 font-medium uppercase tracking-wider">
              Or with email
            </span>
            <div className="flex-grow border-t border-slate-800"></div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-3.5">
            {mode === 'register' && (
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Full Name</label>
                <div className="relative">
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Enter your full name"
                    className="w-full pl-9 pr-3.5 py-2.5 rounded-xl glass-input text-xs"
                  />
                  <User className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
                </div>
              </div>
            )}

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Email Address</label>
              <div className="relative">
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email address"
                  className="w-full pl-9 pr-3.5 py-2.5 rounded-xl glass-input text-xs"
                />
                <Mail className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Password</label>
              <div className="relative">
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  className="w-full pl-9 pr-3.5 py-2.5 rounded-xl glass-input text-xs"
                />
                <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-2.5 rounded-xl bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-400 hover:to-cyan-400 text-navy-950 font-bold text-xs flex items-center justify-center space-x-2 transition-all disabled:opacity-50 shadow-md shadow-teal-500/20"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Authenticating...</span>
                </>
              ) : (
                <span>{mode === 'login' ? 'Sign In to Workspace' : 'Create Free Account'}</span>
              )}
            </button>
          </form>
        </div>
      </motion.div>
    </div>
  );
}
