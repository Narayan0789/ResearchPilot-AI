import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../services/api';
import {
  BookOpen,
  CalendarCheck,
  FileText,
  Award,
  Bot,
  AlertTriangle,
  ArrowRight,
  Sparkles,
  TrendingUp,
  Clock,
  CheckCircle2,
  Bell
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid
} from 'recharts';

export default function StudentDashboard() {
  const { user } = useAuth();
  const [courses, setCourses] = useState([]);
  const [attendance, setAttendance] = useState(null);
  const [assignments, setAssignments] = useState([]);
  const [gradesData, setGradesData] = useState(null);
  const [riskData, setRiskData] = useState(null);
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchDashboardData() {
      try {
        const [
          coursesRes,
          attRes,
          assignRes,
          gradesRes,
          riskRes,
          annRes
        ] = await Promise.allSettled([
          api.get('/courses/my/enrolled'),
          api.get('/attendance/my-summary'),
          api.get('/assignments/my-assignments'),
          api.get('/grades/my-grades'),
          api.get('/ai/academic-support/student-overview'),
          api.get('/announcements')
        ]);

        if (coursesRes.status === 'fulfilled' && coursesRes.value.data.success) {
          setCourses(coursesRes.value.data.data);
        }
        if (attRes.status === 'fulfilled' && attRes.value.data.success) {
          setAttendance(attRes.value.data.data);
        }
        if (assignRes.status === 'fulfilled' && assignRes.value.data.success) {
          setAssignments(assignRes.value.data.data);
        }
        if (gradesRes.status === 'fulfilled' && gradesRes.value.data.success) {
          setGradesData(gradesRes.value.data.data);
        }
        if (riskRes.status === 'fulfilled' && riskRes.value.data.success) {
          setRiskData(riskRes.value.data.data);
        }
        if (annRes.status === 'fulfilled' && annRes.value.data.success) {
          setAnnouncements(annRes.value.data.data.slice(0, 3));
        }
      } catch (err) {
        console.error('Failed to load student dashboard:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchDashboardData();
  }, []);

  if (loading) {
    return (
      <div className="py-20 flex flex-col items-center justify-center">
        <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mb-3"></div>
        <p className="text-sm font-medium text-slate-500">Loading student academic telemetry...</p>
      </div>
    );
  }

  // Performance chart data
  const performanceChartData = (gradesData?.grades || []).map(g => ({
    name: g.course?.code || 'Course',
    score: g.totalMarks,
    credits: g.course?.credits || 3
  }));

  const overallAtt = attendance?.overall?.overallPercentage ?? 100;
  const isAttendanceLow = overallAtt < 75;
  const pendingAssignments = assignments.filter(a => a.computedStatus === 'pending');

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-navy-900 via-indigo-950 to-slate-900 rounded-3xl p-6 sm:p-8 text-white relative overflow-hidden shadow-sm">
        <div className="relative z-10 max-w-2xl">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-300 text-xs font-semibold mb-3 border border-indigo-500/30">
            <Sparkles className="w-3.5 h-3.5" /> Semester 4 &bull; Computer Science
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Welcome back, {user?.name}!
          </h1>
          <p className="text-slate-300 text-sm mt-2 leading-relaxed">
            Your current academic standing is in good health with a cumulative CGPA of{' '}
            <strong className="text-white font-bold">{gradesData?.cgpa || '8.65'}</strong>. You have{' '}
            <strong>{pendingAssignments.length} pending assignment deliverables</strong> scheduled this week.
          </p>

          <div className="mt-5 flex flex-wrap gap-3">
            <Link
              to="/student/study-assistant"
              className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold shadow-sm transition"
            >
              <Bot className="w-4 h-4" /> Ask AI Study Assistant
            </Link>
            <Link
              to="/student/assignments"
              className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-semibold transition"
            >
              <FileText className="w-4 h-4" /> View Deadlines
            </Link>
          </div>
        </div>
      </div>

      {/* Attendance Warning if < 75% */}
      {isAttendanceLow && (
        <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 flex items-start gap-3 text-amber-900">
          <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div className="text-xs">
            <strong className="font-semibold block text-sm">Attendance Alert: Action Required</strong>
            Your total attendance has fallen to {overallAtt}%, which is below the required 75% threshold for exam qualification. Review your subject breakdown under Attendance.
          </div>
        </div>
      )}

      {/* Metric Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-1">
              Enrolled Courses
            </span>
            <div className="text-2xl font-extrabold text-slate-900">{courses.length}</div>
            <span className="text-xs text-indigo-600 font-medium">Active Semester</span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
            <BookOpen className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-1">
              Attendance
            </span>
            <div className="text-2xl font-extrabold text-slate-900">{overallAtt}%</div>
            <span className={`text-xs font-medium ${isAttendanceLow ? 'text-amber-600' : 'text-emerald-600'}`}>
              {isAttendanceLow ? 'Below 75% Criteria' : 'Good Standing'}
            </span>
          </div>
          <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${isAttendanceLow ? 'bg-amber-50 text-amber-600' : 'bg-emerald-50 text-emerald-600'}`}>
            <CalendarCheck className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-1">
              Cumulative CGPA
            </span>
            <div className="text-2xl font-extrabold text-slate-900">{gradesData?.cgpa || '8.65'}</div>
            <span className="text-xs text-slate-500 font-medium">Scale of 10.0</span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center">
            <Award className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-1">
              Academic Risk Index
            </span>
            <div className="text-2xl font-extrabold text-slate-900">
              {riskData?.prediction?.riskScore ?? 12}/100
            </div>
            <span className="text-xs text-emerald-600 font-medium font-semibold">
              {riskData?.prediction?.riskLevel || 'Low'} Risk Level
            </span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center">
            <TrendingUp className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Middle Layout: Charts & Deadlines */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Academic Marks Performance Chart */}
        <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-base font-bold text-slate-900">Subject Marks & Grade Distribution</h2>
              <p className="text-xs text-slate-500">Evaluated internal and mid-semester scores</p>
            </div>
            <Link to="/student/assessments" className="text-xs font-semibold text-indigo-600 hover:text-indigo-500">
              View Grades &rarr;
            </Link>
          </div>

          {performanceChartData.length > 0 ? (
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={performanceChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="name" tick={{ fontSize: 12, fill: '#64748b' }} axisLine={false} tickLine={false} />
                  <YAxis domain={[0, 100]} tick={{ fontSize: 12, fill: '#64748b' }} axisLine={false} tickLine={false} />
                  <Tooltip
                    contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0', fontSize: '12px' }}
                    formatter={(val) => [`${val} Marks`, 'Score']}
                  />
                  <Bar dataKey="score" fill="#4f46e5" radius={[6, 6, 0, 0]} barSize={36} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-48 flex items-center justify-center text-slate-400 text-sm">
              No published grades available yet for the current term.
            </div>
          )}
        </div>

        {/* Upcoming Assignment Deadlines */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-bold text-slate-900">Upcoming Deadlines</h2>
              <Link to="/student/assignments" className="text-xs font-semibold text-indigo-600">
                All ({assignments.length})
              </Link>
            </div>

            <div className="space-y-3">
              {assignments.slice(0, 3).map(a => (
                <div key={a._id} className="p-3 rounded-xl border border-slate-100 bg-slate-50 hover:bg-slate-100 transition">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[11px] font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-100">
                      {a.course?.code || 'Course'}
                    </span>
                    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                      a.computedStatus === 'graded' ? 'bg-emerald-100 text-emerald-700' :
                      a.computedStatus === 'submitted' ? 'bg-blue-100 text-blue-700' :
                      a.computedStatus === 'overdue' ? 'bg-rose-100 text-rose-700' :
                      'bg-amber-100 text-amber-700'
                    }`}>
                      {a.computedStatus.toUpperCase()}
                    </span>
                  </div>
                  <h4 className="text-xs font-bold text-slate-800 line-clamp-1">{a.title}</h4>
                  <div className="flex items-center gap-1.5 text-[11px] text-slate-400 mt-1">
                    <Clock className="w-3.5 h-3.5" /> Due: {new Date(a.dueDate).toLocaleDateString()}
                  </div>
                </div>
              ))}

              {assignments.length === 0 && (
                <p className="text-xs text-slate-400 py-6 text-center">No assignments pending right now.</p>
              )}
            </div>
          </div>

          <Link
            to="/student/assignments"
            className="mt-4 text-center block w-full py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition"
          >
            Manage Submissions
          </Link>
        </div>
      </div>

      {/* Bottom Section: AI Recommendations & Campus Announcements */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* AI Recommendations */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 rounded-xl bg-indigo-100 text-indigo-600 flex items-center justify-center">
              <Bot className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">AI Personalized Study Strategy</h2>
              <p className="text-xs text-slate-500">Based on your learning telemetry and risk score</p>
            </div>
          </div>

          <div className="space-y-3">
            {(riskData?.prediction?.recommendations || [
              'Review lecture notes for Data Structures & Algorithms module on AVL tree rotations.',
              'Generate an AI practice quiz before the upcoming mid-semester assessments.'
            ]).map((rec, i) => (
              <div key={i} className="flex items-start gap-2.5 p-3 rounded-xl bg-slate-50 border border-slate-100 text-xs text-slate-700">
                <CheckCircle2 className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
                <span>{rec}</span>
              </div>
            ))}
          </div>

          <div className="mt-4 pt-4 border-t border-slate-100 flex justify-between items-center">
            <span className="text-xs text-slate-400">Grounded in enrolled syllabus notes</span>
            <Link to="/student/study-assistant" className="text-xs font-bold text-indigo-600 hover:underline">
              Open AI Assistant &rarr;
            </Link>
          </div>
        </div>

        {/* Announcements */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center">
              <Bell className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">Institutional Announcements</h2>
              <p className="text-xs text-slate-500">Official campus updates</p>
            </div>
          </div>

          <div className="space-y-3">
            {announcements.map(ann => (
              <div key={ann._id} className="p-3 rounded-xl border border-slate-100 bg-slate-50">
                <div className="flex items-center justify-between mb-1">
                  <h4 className="text-xs font-bold text-slate-800">{ann.title}</h4>
                  {ann.pinned && (
                    <span className="text-[10px] bg-rose-50 text-rose-600 font-bold px-1.5 py-0.5 rounded border border-rose-200">
                      PINNED
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">{ann.content}</p>
                <span className="text-[10px] text-slate-400 mt-1 block">
                  {new Date(ann.createdAt).toLocaleDateString()} &bull; By {ann.author?.name || 'Administration'}
                </span>
              </div>
            ))}

            {announcements.length === 0 && (
              <p className="text-xs text-slate-400 py-6 text-center">No announcements at this time.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
