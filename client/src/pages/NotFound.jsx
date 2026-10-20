import React from 'react';
import { Link } from 'react-router-dom';
import { FileQuestion, ArrowLeft } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-2xl border border-slate-200 p-8 text-center shadow-xs">
        <div className="w-16 h-16 bg-slate-100 text-slate-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <FileQuestion className="w-8 h-8" />
        </div>
        <h1 className="text-3xl font-extrabold text-slate-900 mb-1">404</h1>
        <h2 className="text-lg font-bold text-slate-700 mb-2">Page Not Found</h2>
        <p className="text-sm text-slate-500 mb-6">
          The requested page or resource could not be found on SmartCampus AI.
        </p>

        <Link
          to="/"
          className="inline-flex items-center gap-2 py-2.5 px-5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-sm font-semibold transition shadow-sm"
        >
          <ArrowLeft className="w-4 h-4" /> Go to Home
        </Link>
      </div>
    </div>
  );
}
