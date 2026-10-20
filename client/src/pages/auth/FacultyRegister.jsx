import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { GraduationCap, ArrowRight, Clock, AlertCircle } from 'lucide-react';

const facultySchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Please enter a valid official college email'),
  facultyId: z.string().min(3, 'Employee or Faculty ID is required'),
  department: z.string().min(1, 'Please select department'),
  designation: z.string().min(1, 'Designation is required'),
  qualifications: z.string().optional(),
  password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Must include an uppercase letter')
    .regex(/[0-9]/, 'Must include a number'),
  confirmPassword: z.string()
}).refine(data => data.password === data.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword']
});

export default function FacultyRegister() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedData, setSubmittedData] = useState(null);

  const {
    register,
    handleSubmit,
    formState: { errors }
  } = useForm({
    resolver: zodResolver(facultySchema),
    defaultValues: {
      department: 'Computer Science & Engineering',
      designation: 'Assistant Professor'
    }
  });

  const onSubmit = async (data) => {
    setIsSubmitting(true);
    try {
      const res = await api.post('/auth/register/faculty', data);
      if (res.data.success) {
        setSubmittedData(res.data);
        toast.success(res.data.message);
      }
    } catch (err) {
      const msg = err.response?.data?.message || err.response?.data?.errors?.[0] || 'Registration failed.';
      toast.error(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (submittedData) {
    return (
      <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-sm border border-slate-200 p-8 text-center">
          <div className="w-14 h-14 bg-amber-100 text-amber-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <Clock className="w-8 h-8" />
          </div>
          <h2 className="text-2xl font-bold text-slate-900 mb-2">Registration Pending Approval</h2>
          <p className="text-sm text-slate-600 mb-6 leading-relaxed">
            Your faculty registration for <strong>{submittedData.faculty?.email}</strong> has been logged. In accordance with university protocol, administrative verification is required before your login is enabled.
          </p>

          <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-500 mb-6 text-left">
            <strong>Administrator Action:</strong> The campus administrator will review your credentials under the Admin User Management panel.
          </div>

          <Link
            to="/login"
            className="w-full inline-block py-2.5 px-4 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-xl text-sm transition"
          >
            Back to Sign In
          </Link>
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
          <h1 className="text-2xl font-bold text-slate-900">Faculty Registration</h1>
          <p className="text-sm text-slate-500 mt-1">
            Official instructor registration for course management, attendance, and grading
          </p>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 sm:p-8">
          <div className="mb-6 p-3.5 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-2.5 text-xs text-amber-800">
            <AlertCircle className="w-4 h-4 shrink-0 text-amber-600 mt-0.5" />
            <span>
              <strong>Administrative Security Notice:</strong> Faculty accounts remain in <em>pending</em> status until verified and approved by the college administrator.
            </span>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Full Name & Title *</label>
                <input
                  {...register('name')}
                  placeholder="e.g. Dr. Rajesh Sharma"
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                />
                {errors.name && <p className="text-xs text-rose-500 mt-1">{errors.name.message}</p>}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Official College Email *</label>
                <input
                  {...register('email')}
                  type="email"
                  placeholder="faculty@smartcampus.edu"
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                />
                {errors.email && <p className="text-xs text-rose-500 mt-1">{errors.email.message}</p>}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Faculty / Employee ID *</label>
                <input
                  {...register('facultyId')}
                  placeholder="e.g. FAC2024003"
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none uppercase"
                />
                {errors.facultyId && <p className="text-xs text-rose-500 mt-1">{errors.facultyId.message}</p>}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Designation *</label>
                <input
                  {...register('designation')}
                  placeholder="e.g. Associate Professor"
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                />
                {errors.designation && <p className="text-xs text-rose-500 mt-1">{errors.designation.message}</p>}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
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

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Qualifications</label>
                <input
                  {...register('qualifications')}
                  placeholder="e.g. Ph.D. in Computer Science"
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                />
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

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-2.5 px-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-sm font-semibold shadow-sm transition disabled:opacity-60 flex items-center justify-center gap-2 cursor-pointer mt-4"
            >
              {isSubmitting ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <>
                  Submit Faculty Registration <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          <p className="text-xs text-slate-500 text-center mt-6">
            Already verified?{' '}
            <Link to="/login" className="font-semibold text-indigo-600 hover:text-indigo-500">
              Sign In
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
