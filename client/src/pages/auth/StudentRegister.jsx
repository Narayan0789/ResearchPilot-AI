import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { GraduationCap, ArrowRight, CheckCircle2, AlertCircle, Mail } from 'lucide-react';

const studentSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(100),
  email: z.string().email('Please enter a valid college email'),
  studentId: z.string().min(3, 'Student ID / Enrollment Number is required'),
  department: z.string().min(1, 'Please select a department'),
  degree: z.string().min(1, 'Please specify your degree program'),
  semester: z.coerce.number().min(1, 'Semester must be at least 1').max(12, 'Semester cannot exceed 12'),
  phone: z.string().optional(),
  password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Must include an uppercase letter')
    .regex(/[a-z]/, 'Must include a lowercase letter')
    .regex(/[0-9]/, 'Must include a number'),
  confirmPassword: z.string(),
  termsAccepted: z.boolean().refine(val => val === true, 'You must accept the terms and conditions')
}).refine(data => data.password === data.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword']
});

export default function StudentRegister() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successData, setSuccessData] = useState(null);
  const [resending, setResending] = useState(false);
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    getValues,
    formState: { errors }
  } = useForm({
    resolver: zodResolver(studentSchema),
    defaultValues: {
      department: 'Computer Science & Engineering',
      degree: 'B.Tech Computer Science',
      semester: 1,
      termsAccepted: false
    }
  });

  const onSubmit = async (data) => {
    setIsSubmitting(true);
    try {
      const res = await api.post('/auth/register/student', data);
      if (res.data.success) {
        setSuccessData(res.data);
        toast.success('Registration successful! Please verify your email.');
      }
    } catch (err) {
      const msg = err.response?.data?.message || err.response?.data?.errors?.[0] || 'Registration failed.';
      toast.error(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResend = async (userEmail) => {
    if (!userEmail) return;
    setResending(true);
    try {
      await api.post('/auth/resend-verification', { email: userEmail });
      toast.success('A new verification email has been dispatched! Please check your inbox.');
    } catch (err) {
      toast.error('Could not resend verification email. Please try again.');
    } finally {
      setResending(false);
    }
  };

  if (successData) {
    const userEmail = successData.user?.email || getValues('email');
    return (
      <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-sm border border-slate-200 p-8 text-center">
          <div className="w-14 h-14 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <Mail className="w-8 h-8" />
          </div>
          <h2 className="text-2xl font-bold text-slate-900 mb-2">Verify Your Email</h2>
          <p className="text-sm text-slate-600 mb-4 leading-relaxed">
            We have sent a verification link to <strong className="text-slate-900">{userEmail}</strong>.
          </p>

          <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl text-left text-xs text-amber-900 mb-6 space-y-1.5">
            <div className="flex items-center gap-1.5 font-bold text-amber-800">
              <AlertCircle className="w-4 h-4 shrink-0 text-amber-600" />
              <span>Email Verification Required</span>
            </div>
            <p className="text-amber-700 leading-normal">
              Your account cannot be opened until your email address is verified. Please open the email you received and click the verification link to activate your account.
            </p>
            <p className="text-[11px] text-amber-600 mt-1">
              (Remember to check your Spam or Junk folder if not visible in your Inbox)
            </p>
          </div>

          <div className="space-y-3">
            <button
              type="button"
              onClick={() => handleResend(userEmail)}
              disabled={resending}
              className="w-full py-2.5 px-4 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 font-semibold rounded-xl text-sm transition disabled:opacity-50 cursor-pointer"
            >
              {resending ? 'Dispatching Email...' : 'Resend Verification Email'}
            </button>
            <Link
              to="/login"
              className="w-full inline-block py-2.5 px-4 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-xl text-sm transition text-center"
            >
              Go to Login
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-xl mx-auto">
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2 mb-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 to-blue-600 flex items-center justify-center text-white shadow-sm shadow-indigo-300">
              <GraduationCap className="w-5 h-5" />
            </div>
            <span className="font-extrabold text-xl tracking-tight text-slate-900">
              SmartCampus <span className="text-indigo-600">AI</span>
            </span>
          </Link>
          <h1 className="text-2xl font-bold text-slate-900">Student Account Registration</h1>
          <p className="text-sm text-slate-500 mt-1">
            Join your smart campus learning community with full academic access
          </p>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 sm:p-8">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Full Legal Name *</label>
                <input
                  {...register('name')}
                  placeholder="e.g. Alex Johnson"
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                />
                {errors.name && <p className="text-xs text-rose-500 mt-1">{errors.name.message}</p>}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">College Email Address *</label>
                <input
                  {...register('email')}
                  type="email"
                  placeholder="alex.student@smartcampus.edu"
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                />
                {errors.email && <p className="text-xs text-rose-500 mt-1">{errors.email.message}</p>}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Student Enrollment / Roll No *</label>
                <input
                  {...register('studentId')}
                  placeholder="e.g. STU2024001"
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none uppercase"
                />
                {errors.studentId && <p className="text-xs text-rose-500 mt-1">{errors.studentId.message}</p>}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Phone Number (Optional)</label>
                <input
                  {...register('phone')}
                  placeholder="+1 (555) 000-0000"
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="sm:col-span-1">
                <label className="block text-xs font-semibold text-slate-700 mb-1">Department *</label>
                <select
                  {...register('department')}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none bg-white"
                >
                  <option value="Computer Science & Engineering">Computer Science</option>
                  <option value="Information Technology">Information Tech</option>
                  <option value="Electronics & Communication">Electronics</option>
                  <option value="Mechanical Engineering">Mechanical</option>
                </select>
                {errors.department && <p className="text-xs text-rose-500 mt-1">{errors.department.message}</p>}
              </div>

              <div className="sm:col-span-1">
                <label className="block text-xs font-semibold text-slate-700 mb-1">Degree Program *</label>
                <input
                  {...register('degree')}
                  placeholder="e.g. B.Tech CSE"
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                />
                {errors.degree && <p className="text-xs text-rose-500 mt-1">{errors.degree.message}</p>}
              </div>

              <div className="sm:col-span-1">
                <label className="block text-xs font-semibold text-slate-700 mb-1">Current Semester *</label>
                <input
                  type="number"
                  {...register('semester')}
                  min="1"
                  max="12"
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                />
                {errors.semester && <p className="text-xs text-rose-500 mt-1">{errors.semester.message}</p>}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Password *</label>
                <input
                  type="password"
                  {...register('password')}
                  placeholder="Min 8 chars, 1 uppercase, 1 number"
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                />
                {errors.password && <p className="text-xs text-rose-500 mt-1">{errors.password.message}</p>}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Confirm Password *</label>
                <input
                  type="password"
                  {...register('confirmPassword')}
                  placeholder="Re-type password"
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                />
                {errors.confirmPassword && <p className="text-xs text-rose-500 mt-1">{errors.confirmPassword.message}</p>}
              </div>
            </div>

            <div className="pt-2">
              <label className="flex items-start gap-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  {...register('termsAccepted')}
                  className="w-4 h-4 mt-0.5 text-indigo-600 border-slate-300 rounded focus:ring-indigo-500"
                />
                <span className="text-xs text-slate-600 leading-tight">
                  I agree to the institutional terms of academic integrity, platform honor code, and student privacy policy.
                </span>
              </label>
              {errors.termsAccepted && <p className="text-xs text-rose-500 mt-1">{errors.termsAccepted.message}</p>}
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-2.5 px-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-sm font-semibold shadow-sm transition disabled:opacity-60 flex items-center justify-center gap-2 cursor-pointer mt-4"
            >
              {isSubmitting ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <>
                  Register Student Account <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          <p className="text-xs text-slate-500 text-center mt-6">
            Already have an account?{' '}
            <Link to="/login" className="font-semibold text-indigo-600 hover:text-indigo-500">
              Sign In
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
