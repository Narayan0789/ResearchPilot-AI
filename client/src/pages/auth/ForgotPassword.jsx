import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../../services/api';
import toast from 'react-hot-toast';
import {
  GraduationCap,
  Mail,
  Lock,
  KeyRound,
  ArrowRight,
  CheckCircle2,
  RotateCcw,
  Eye,
  EyeOff,
  ShieldCheck
} from 'lucide-react';

export default function ForgotPassword() {
  const navigate = useNavigate();

  // Step state: 1 = Enter Email, 2 = Enter OTP & New Password, 3 = Success
  const [step, setStep] = useState(1);
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Resend cooldown timer
  const [cooldown, setCooldown] = useState(0);

  useEffect(() => {
    let timer;
    if (cooldown > 0) {
      timer = setTimeout(() => setCooldown(cooldown - 1), 1000);
    }
    return () => clearTimeout(timer);
  }, [cooldown]);

  // Step 1: Request OTP
  const handleRequestOtp = async (e) => {
    e.preventDefault();
    if (!email.trim()) {
      toast.error('Please enter your registered email address.');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await api.post('/auth/forgot-password', { email: email.trim() });
      if (res.data.success) {
        setStep(2);
        setCooldown(60);
        toast.success(`6-digit OTP code sent to ${email.trim()}! Please check your email inbox.`);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to request OTP. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Step 2: Resend OTP
  const handleResendOtp = async () => {
    if (cooldown > 0 || isSubmitting) return;
    setIsSubmitting(true);
    try {
      const res = await api.post('/auth/forgot-password', { email: email.trim() });
      if (res.data.success) {
        setCooldown(60);
        toast.success(`A fresh 6-digit OTP code has been sent to ${email.trim()}!`);
      }
    } catch (err) {
      toast.error('Could not resend OTP. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Step 2: Submit OTP & Reset Password
  const handleResetPassword = async (e) => {
    e.preventDefault();

    if (!otp.trim() || otp.trim().length !== 6) {
      toast.error('Please enter the full 6-digit OTP code.');
      return;
    }

    if (password.length < 8) {
      toast.error('Password must be at least 8 characters long.');
      return;
    }

    if (password !== confirmPassword) {
      toast.error('Passwords do not match.');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await api.post('/auth/reset-password', {
        email: email.trim(),
        otp: otp.trim(),
        password,
        confirmPassword
      });

      if (res.data.success) {
        setStep(3);
        toast.success('Password updated successfully!');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Invalid or expired OTP code.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <Link to="/" className="inline-flex items-center gap-2 mb-4">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-blue-600 flex items-center justify-center text-white shadow-md shadow-indigo-300">
            <GraduationCap className="w-6 h-6" />
          </div>
          <span className="font-extrabold text-2xl tracking-tight text-slate-900">
            SmartCampus <span className="text-indigo-600">AI</span>
          </span>
        </Link>
        <h2 className="text-2xl font-bold text-slate-900">
          {step === 1 ? 'Password Recovery' : step === 2 ? 'Verify OTP Code' : 'Password Reset Complete'}
        </h2>
        <p className="mt-1 text-sm text-slate-500">
          {step === 1
            ? 'Enter your registered email to receive a 6-digit OTP verification code'
            : step === 2
            ? `Enter the 6-digit code sent to ${email}`
            : 'Your credentials have been securely updated'}
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-6 shadow-sm border border-slate-200 rounded-2xl sm:px-10">
          {/* STEP 1: Enter Email */}
          {step === 1 && (
            <form onSubmit={handleRequestOtp} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Registered Email Address
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
                    className="w-full pl-9 pr-3 py-2 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-2.5 px-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-sm font-semibold shadow-sm transition disabled:opacity-60 flex items-center justify-center gap-2 cursor-pointer"
              >
                {isSubmitting ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <>
                    Send 6-Digit OTP <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>

              <div className="text-center pt-3">
                <Link to="/login" className="text-xs font-semibold text-slate-600 hover:text-slate-900">
                  &larr; Cancel and return to sign in
                </Link>
              </div>
            </form>
          )}

          {/* STEP 2: Enter OTP & New Password */}
          {step === 2 && (
            <form onSubmit={handleResetPassword} className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-semibold text-slate-700">
                    6-Digit OTP Verification Code *
                  </label>
                  <button
                    type="button"
                    onClick={() => setStep(1)}
                    className="text-[11px] text-indigo-600 hover:underline"
                  >
                    Change email
                  </button>
                </div>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <KeyRound className="w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    required
                    maxLength={6}
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    placeholder="••••••"
                    className="w-full pl-9 pr-3 py-2 text-base font-mono font-bold tracking-[0.3em] text-center border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none placeholder:text-slate-300"
                  />
                </div>
                <span className="text-[11px] text-slate-500 block mt-1">
                  Please check your email inbox (and Spam folder) for the 6-digit code.
                </span>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  New Password *
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    minLength={8}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Min 8 characters"
                    className="w-full pl-9 pr-10 py-2 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Confirm New Password *
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    minLength={8}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Repeat new password"
                    className="w-full pl-9 pr-3 py-2 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-2.5 px-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-sm font-semibold shadow-sm transition disabled:opacity-60 flex items-center justify-center gap-2 cursor-pointer"
              >
                {isSubmitting ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <>
                    <ShieldCheck className="w-4 h-4" /> Reset Password with OTP
                  </>
                )}
              </button>

              <div className="flex items-center justify-between pt-2">
                <button
                  type="button"
                  onClick={handleResendOtp}
                  disabled={cooldown > 0 || isSubmitting}
                  className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 disabled:opacity-50 flex items-center gap-1 cursor-pointer"
                >
                  <RotateCcw className="w-3 h-3" />
                  {cooldown > 0 ? `Resend OTP in ${cooldown}s` : 'Resend OTP Code'}
                </button>

                <Link to="/login" className="text-xs text-slate-500 hover:text-slate-800">
                  Back to login
                </Link>
              </div>
            </form>
          )}

          {/* STEP 3: Success Screen */}
          {step === 3 && (
            <div className="text-center space-y-4">
              <div className="w-14 h-14 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-sm">
                <CheckCircle2 className="w-7 h-7" />
              </div>
              <h3 className="text-lg font-bold text-slate-900">Password Reset Successful!</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Your password has been securely updated with your verified 6-digit OTP. You can now log in using your new credentials.
              </p>

              <div className="pt-2">
                <Link
                  to="/login"
                  className="w-full inline-block py-2.5 px-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-sm font-semibold shadow-sm transition"
                >
                  Sign In with New Password
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
