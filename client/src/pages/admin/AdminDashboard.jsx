import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import {
  Users,
  GraduationCap,
  Building2,
  BookOpen,
  CalendarCheck,
  ShieldAlert,
  Clock,
  ArrowRight,
  TrendingUp,
  ShieldCheck,
  CheckCircle2,
  XCircle
} from 'lucide-react';

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchStats() {
      try {
        const res = await api.get('/admin/stats');
        if (res.data.success) {
          setStats(res.data.data);
        }
      } catch (err) {
        console.error('Failed to load admin stats:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchStats();
  }, []);

  if (loading) {
    return <div className="py-20 text-center text-slate-400 text-sm">Aggregating institutional metrics...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Institutional Governance & System Analytics</h1>
          <p className="text-xs text-slate-500 mt-1">
            Campus-wide academic metrics, user governance, and security audit telemetry
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            to="/admin/users"
            className="py-2 px-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold shadow-sm transition"
          >
            Manage Users
          </Link>
          <Link
            to="/admin/academics"
            className="py-2 px-4 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-semibold transition"
          >
            Curriculum Setup
          </Link>
        </div>
      </div>

      {/* Pending Faculty Notice Banner */}
      {stats?.pendingFaculty > 0 && (
        <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-between text-amber-900">
          <div className="flex items-center gap-3">
            <Clock className="w-5 h-5 text-amber-600 shrink-0" />
            <div className="text-xs">
              <strong className="font-semibold block text-sm">
                {stats.pendingFaculty} Faculty Registration(s) Awaiting Approval
              </strong>
              Faculty accounts cannot access teaching tools or mark attendance until approved by an administrator.
            </div>
          </div>

          <Link
            to="/admin/users?role=faculty&status=pending"
            className="py-1.5 px-3 bg-amber-600 hover:bg-amber-700 text-white font-semibold text-xs rounded-lg transition shrink-0"
          >
            Review & Approve
          </Link>
        </div>
      )}

      {/* Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-1">
              Registered Students
            </span>
            <div className="text-2xl font-extrabold text-slate-900">{stats?.totalStudents || 0}</div>
            <span className="text-xs text-indigo-600 font-medium">Active Enrollees</span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
            <GraduationCap className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-1">
              Active Faculty
            </span>
            <div className="text-2xl font-extrabold text-slate-900">{stats?.totalFaculty || 0}</div>
            <span className="text-xs text-emerald-600 font-medium font-semibold">
              {stats?.pendingFaculty || 0} Pending Approval
            </span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <Users className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-1">
              Offered Courses
            </span>
            <div className="text-2xl font-extrabold text-slate-900">{stats?.totalCourses || 0}</div>
            <span className="text-xs text-slate-500 font-medium">
              Across {stats?.totalDepartments || 0} Departments
            </span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center">
            <BookOpen className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-1">
              Campus Attendance
            </span>
            <div className="text-2xl font-extrabold text-slate-900">{stats?.avgAttendance || 85}%</div>
            <span className="text-xs text-slate-500 font-medium">Institution Average</span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center">
            <CalendarCheck className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Institutional Activity Audit Log */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-slate-900">Recent Institutional Security Audit Trail</h2>
            <p className="text-xs text-slate-500">Immutable audit records tracking administrative and user events</p>
          </div>
          <Link to="/admin/audit-logs" className="text-xs font-semibold text-indigo-600 hover:underline">
            View All Logs &rarr;
          </Link>
        </div>

        <div className="divide-y divide-slate-100">
          {(stats?.recentLogs || []).map(log => (
            <div key={log._id} className="p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 text-xs">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-slate-100 text-slate-600 flex items-center justify-center font-mono font-bold text-[10px]">
                  {log.action?.slice(0, 3)}
                </div>
                <div>
                  <span className="font-bold text-slate-900 block">{log.action}</span>
                  <span className="text-slate-500 text-[11px]">
                    User: {log.user?.email || 'System'} &bull; Entity: {log.entity}
                  </span>
                </div>
              </div>

              <div className="text-right text-slate-400 text-[11px] font-mono">
                {new Date(log.createdAt).toLocaleString()}
              </div>
            </div>
          ))}

          {(!stats?.recentLogs || stats.recentLogs.length === 0) && (
            <div className="p-8 text-center text-slate-400 text-xs">No audit logs recorded yet.</div>
          )}
        </div>
      </div>
    </div>
  );
}
