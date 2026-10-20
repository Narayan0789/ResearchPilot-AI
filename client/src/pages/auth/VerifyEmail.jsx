import React, { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { GraduationCap, CheckCircle2, AlertCircle, ArrowRight } from 'lucide-react';

export default function VerifyEmail() {
  const [searchParams] = useSearchParams();
  const [token, setToken] = useState(searchParams.get('token') || '');
  const [email, setEmail] = useState(searchParams.get('email') || '');
  const [loading, setLoading] = useState(false);
  const [verified, setVerified] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Auto-verify if params are present
  useEffect(() => {
    if (token) {
      handleVerification(token, email);
    }
  }, []);

  const handleVerification = async (verifyToken, verifyEmail) => {
    setLoading(true);
    setErrorMsg('');
    try {
      const res = await api.post('/auth/verify-email', { token: verifyToken, email: verifyEmail });
      if (res.data.success) {
        setVerified(true);
        toast.success('Email verified successfully!');
      }
    } catch (err) {
      const msg = err.response?.data?.message || 'Verification failed or link expired.';
      setErrorMsg(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
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
        <h2 className="text-2xl font-bold text-slate-900">Email Verification</h2>
        <p className="mt-1 text-sm text-slate-500">
          Confirm your college email to activate all platform privileges
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-6 shadow-sm border border-slate-200 rounded-2xl sm:px-10 text-center">
          {loading ? (
            <div className="py-8 space-y-3">
              <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
              <p className="text-sm font-medium text-slate-600">Verifying security token...</p>
            </div>
          ) : verified ? (
            <div className="space-y-4">
              <div className="w-14 h-14 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-bold text-slate-900">Account Verified!</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Your email address has been verified successfully. Your campus account is in good standing.
              </p>
              <Link
                to="/login"
                className="w-full inline-flex items-center justify-center gap-2 py-2.5 px-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-sm font-semibold transition"
              >
                Sign In to Dashboard <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {errorMsg ? (
                <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl flex items-start gap-2.5 text-xs text-rose-700 text-left">
                  <AlertCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                  <span>{errorMsg}</span>
                </div>
              ) : null}

              <div className="text-left space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Verification Token</label>
                  <input
                    type="text"
                    value={token}
                    onChange={(e) => setToken(e.target.value)}
                    placeholder="Enter 32-character token"
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none font-mono text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Email Address</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="student@smartcampus.edu"
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                  />
                </div>
              </div>

              <button
                type="button"
                onClick={() => handleVerification(token, email)}
                disabled={!token}
                className="w-full py-2.5 px-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-sm font-semibold transition disabled:opacity-50"
              >
                Verify Token
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
