import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import {
  CalendarCheck,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  HelpCircle,
  TrendingDown,
  Clock,
  Sparkles
} from 'lucide-react';

export default function StudentAttendance() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchAttendance() {
      try {
        const res = await api.get('/attendance/my-summary');
        if (res.data.success) {
          setData(res.data.data);
        }
      } catch (err) {
        console.error('Failed to load attendance:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchAttendance();
  }, []);

  if (loading) {
    return <div className="py-20 text-center text-slate-400 text-sm">Calculating attendance records...</div>;
  }

  const overall = data?.overall || { overallPercentage: 100, totalClasses: 0, overallAttended: 0 };
  const subjects = data?.summary || [];
  const isOverallLow = overall.overallPercentage < 75;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Attendance Telemetry</h1>
        <p className="text-xs text-slate-500 mt-1">
          Monitor your class attendance percentages against university qualification thresholds
        </p>
      </div>

      {/* Top Banner Alert */}
      {isOverallLow ? (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 flex items-start gap-3 text-rose-900">
          <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
          <div className="text-xs">
            <strong className="font-semibold block text-sm">Critical Attendance Shortage (&lt; 75%)</strong>
            Your cumulative attendance is {overall.overallPercentage}%. You are at risk of examination debarment. Please consult your respective faculty immediately.
          </div>
        </div>
      ) : (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-between text-xs text-emerald-900">
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <span>
              Your attendance is in <strong>Good Standing</strong> at {overall.overallPercentage}%, satisfying the mandatory 75% requirement.
            </span>
          </div>
          <span className="font-bold text-emerald-700 bg-emerald-100 px-2.5 py-1 rounded-full text-[11px]">
            Qualified
          </span>
        </div>
      )}

      {/* Overall Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-1">
            Overall Attendance
          </span>
          <div className="text-3xl font-extrabold text-slate-900">{overall.overallPercentage}%</div>
          <div className="w-full bg-slate-100 rounded-full h-2 mt-3 overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${isOverallLow ? 'bg-rose-500' : 'bg-emerald-500'}`}
              style={{ width: `${Math.min(100, overall.overallPercentage)}%` }}
            ></div>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-1">
            Sessions Attended
          </span>
          <div className="text-3xl font-extrabold text-slate-900">
            {overall.overallAttended}{' '}
            <span className="text-base font-normal text-slate-400">/ {overall.totalClasses}</span>
          </div>
          <p className="text-xs text-slate-500 mt-2">Combined lectures, labs, and tutorials</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-1">
            Institutional Rule
          </span>
          <div className="text-3xl font-extrabold text-slate-900">75%</div>
          <p className="text-xs text-slate-500 mt-2">Minimum threshold to appear for end-term exams</p>
        </div>
      </div>

      {/* Subject-wise Breakdown Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-5 border-b border-slate-100">
          <h2 className="text-base font-bold text-slate-900">Subject-wise Attendance Breakdown</h2>
          <p className="text-xs text-slate-500">Real-time attendance record maintained by assigned faculty</p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-wider font-semibold text-[11px]">
              <tr>
                <th className="py-3 px-4">Course</th>
                <th className="py-3 px-4 text-center">Conducted</th>
                <th className="py-3 px-4 text-center">Present</th>
                <th className="py-3 px-4 text-center">Excused</th>
                <th className="py-3 px-4 text-center">Absent</th>
                <th className="py-3 px-4 text-center">Percentage</th>
                <th className="py-3 px-4 text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {subjects.map(item => (
                <tr key={item.course?._id} className="hover:bg-slate-50/50 transition">
                  <td className="py-3.5 px-4">
                    <span className="font-bold text-slate-900 block">{item.course?.code}</span>
                    <span className="text-slate-500 text-[11px]">{item.course?.name}</span>
                  </td>
                  <td className="py-3.5 px-4 text-center font-semibold text-slate-700">{item.totalClasses}</td>
                  <td className="py-3.5 px-4 text-center text-emerald-600 font-semibold">{item.presentCount}</td>
                  <td className="py-3.5 px-4 text-center text-blue-600 font-semibold">{item.excusedCount}</td>
                  <td className="py-3.5 px-4 text-center text-rose-600 font-semibold">{item.absentCount}</td>
                  <td className="py-3.5 px-4 text-center font-bold">
                    <span className={item.isLowAttendance ? 'text-rose-600' : 'text-slate-800'}>
                      {item.percentage}%
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-right">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      item.isLowAttendance ? 'bg-rose-100 text-rose-700' : 'bg-emerald-100 text-emerald-700'
                    }`}>
                      {item.isLowAttendance ? 'SHORTAGE' : 'REGULAR'}
                    </span>
                  </td>
                </tr>
              ))}

              {subjects.length === 0 && (
                <tr>
                  <td colSpan="7" className="py-8 text-center text-slate-400">
                    No attendance sessions logged yet for this semester.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
