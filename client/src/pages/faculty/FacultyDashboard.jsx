import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../services/api';
import {
  BookOpen,
  CalendarCheck,
  FileText,
  Award,
  Users,
  AlertTriangle,
  ArrowRight,
  PlusCircle,
  TrendingUp,
  Clock
} from 'lucide-react';

export default function FacultyDashboard() {
  const { user } = useAuth();
  const [courses, setCourses] = useState([]);
  const [insights, setInsights] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadFacultyData() {
      try {
        const [courseRes, insightRes] = await Promise.allSettled([
          api.get('/courses/my/assigned'),
          api.get('/ai/academic-support/faculty-insights')
        ]);

        if (courseRes.status === 'fulfilled' && courseRes.value.data.success) {
          setCourses(courseRes.value.data.data);
        }
        if (insightRes.status === 'fulfilled' && insightRes.value.data.success) {
          setInsights(insightRes.value.data.data);
        }
      } catch (err) {
        console.error('Failed to load faculty dashboard:', err);
      } finally {
        setLoading(false);
      }
    }
    loadFacultyData();
  }, []);

  if (loading) {
    return <div className="py-20 text-center text-slate-400 text-sm">Loading faculty command center...</div>;
  }

  const totalStudents = courses.reduce((sum, c) => sum + (c.studentCount || 0), 0);
  const highRiskStudents = insights?.highRiskCount || 0;

  return (
    <div className="space-y-6">
      {/* Faculty Hero Banner */}
      <div className="bg-gradient-to-r from-navy-900 via-indigo-950 to-slate-900 rounded-3xl p-6 sm:p-8 text-white relative overflow-hidden shadow-sm">
        <div className="relative z-10 max-w-2xl">
          <span className="inline-block px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-semibold mb-3 border border-emerald-500/30">
            Instructor Portal &bull; Department Faculty
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Welcome, {user?.name}
          </h1>
          <p className="text-slate-300 text-sm mt-2 leading-relaxed">
            You are actively instructing <strong>{courses.length} courses</strong> with{' '}
            <strong>{totalStudents} enrolled students</strong>. Monitor attendance roll-calls, grade assignments, and analyze students requiring proactive support.
          </p>

          <div className="mt-5 flex flex-wrap gap-3">
            <Link
              to="/faculty/attendance"
              className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold shadow-sm transition"
            >
              <CalendarCheck className="w-4 h-4" /> Conduct Roll Call
            </Link>
            <Link
              to="/faculty/courses"
              className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-semibold transition"
            >
              <BookOpen className="w-4 h-4" /> Upload Study Material
            </Link>
          </div>
        </div>
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-1">
              Assigned Classes
            </span>
            <div className="text-2xl font-extrabold text-slate-900">{courses.length}</div>
            <span className="text-xs text-indigo-600 font-medium">Active Semesters</span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
            <BookOpen className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-1">
              Enrolled Students
            </span>
            <div className="text-2xl font-extrabold text-slate-900">{totalStudents}</div>
            <span className="text-xs text-slate-500 font-medium">Under Guidance</span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center">
            <Users className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-1">
              Support Alerts (ML)
            </span>
            <div className="text-2xl font-extrabold text-slate-900">{highRiskStudents}</div>
            <span className="text-xs text-rose-600 font-medium font-semibold">Flagged for Guidance</span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center">
            <AlertTriangle className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-1">
              Teaching Status
            </span>
            <div className="text-xl font-extrabold text-slate-900">Approved</div>
            <span className="text-xs text-emerald-600 font-medium font-semibold">Active Faculty</span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <Award className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Courses Overview List */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-slate-900">Your Assigned Course Offerings</h2>
            <p className="text-xs text-slate-500">Manage curriculum, upload syllabus files, and review students</p>
          </div>
          <Link to="/faculty/courses" className="text-xs font-semibold text-indigo-600 hover:underline">
            Manage All &rarr;
          </Link>
        </div>

        <div className="divide-y divide-slate-100">
          {courses.map(course => (
            <div key={course._id} className="p-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 hover:bg-slate-50/50 transition">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="px-2 py-0.5 rounded text-[11px] font-bold uppercase bg-indigo-50 text-indigo-700 border border-indigo-100">
                    {course.code}
                  </span>
                  <span className="text-xs text-slate-400 font-medium">Semester {course.semester} &bull; {course.credits} Credits</span>
                </div>
                <h3 className="text-sm font-bold text-slate-900">{course.name}</h3>
                <span className="text-xs text-slate-500">{course.studentCount || 0} Students currently enrolled</span>
              </div>

              <div className="flex items-center gap-2">
                <Link
                  to={`/faculty/attendance?courseId=${course._id}`}
                  className="py-1.5 px-3 rounded-lg text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 transition"
                >
                  Take Attendance
                </Link>
                <Link
                  to="/faculty/assignments"
                  className="py-1.5 px-3 rounded-lg text-xs font-semibold bg-indigo-50 hover:bg-indigo-100 text-indigo-700 transition"
                >
                  Assignments
                </Link>
              </div>
            </div>
          ))}

          {courses.length === 0 && (
            <div className="p-8 text-center text-slate-400 text-xs">
              No courses assigned yet. Contact administrator for course allocations.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
