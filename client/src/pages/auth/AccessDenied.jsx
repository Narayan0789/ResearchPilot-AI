import React from 'react';
import { Link } from 'react-router-dom';
import { ShieldAlert, ArrowLeft } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

export default function AccessDenied() {
  const { user } = useAuth();

  const getHomeRoute = () => {
    if (!user) return '/login';
    if (user.role === 'admin') return '/admin/dashboard';
    if (user.role === 'faculty') return '/faculty/dashboard';
    return '/student/dashboard';
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-2xl border border-slate-200 p-8 text-center shadow-xs">
        <div className="w-16 h-16 bg-rose-100 text-rose-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <ShieldAlert className="w-8 h-8" />
        </div>
        <h1 className="text-2xl font-bold text-slate-900 mb-1">Access Restricted (403)</h1>
        <p className="text-sm text-slate-500 mb-6 leading-relaxed">
          You do not have the required role permissions ({user?.role || 'Guest'}) to access this restricted campus endpoint.
        </p>

        <Link
          to={getHomeRoute()}
          className="inline-flex items-center gap-2 py-2.5 px-5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-sm font-semibold transition shadow-sm"
        >
          <ArrowLeft className="w-4 h-4" /> Return to Authorized Dashboard
        </Link>
      </div>
    </div>
  );
}
