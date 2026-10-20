import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import {
  GraduationCap,
  Sparkles,
  Bot,
  BrainCircuit,
  CalendarCheck,
  Award,
  Briefcase,
  ShieldCheck,
  ChevronRight,
  ArrowRight,
  BookOpen,
  LineChart
} from 'lucide-react';

export default function LandingPage() {
  const { user, isAuthenticated } = useAuth();

  const getDashboardLink = () => {
    if (!user) return '/login';
    if (user.role === 'admin') return '/admin/dashboard';
    if (user.role === 'faculty') return '/faculty/dashboard';
    return '/student/dashboard';
  };

  return (
    <div className="min-h-screen bg-slate-900 text-white selection:bg-indigo-500 selection:text-white">
      {/* Top Navbar */}
      <nav className="border-b border-slate-800 bg-slate-900/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-500 to-blue-500 flex items-center justify-center text-white shadow-md shadow-indigo-500/20">
              <GraduationCap className="w-5 h-5" />
            </div>
            <span className="font-extrabold text-xl tracking-tight text-white">
              SmartCampus <span className="text-indigo-400">AI</span>
            </span>
          </div>

          <div className="flex items-center gap-4">
            {isAuthenticated ? (
              <Link
                to={getDashboardLink()}
                className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-xl text-sm font-semibold transition shadow-sm"
              >
                Go to Dashboard <ArrowRight className="w-4 h-4" />
              </Link>
            ) : (
              <div className="flex items-center gap-3">
                <Link
                  to="/login"
                  className="text-sm font-medium text-slate-300 hover:text-white px-3 py-1.5 transition"
                >
                  Sign In
                </Link>
                <Link
                  to="/register/student"
                  className="bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-xl text-sm font-semibold transition shadow-sm shadow-indigo-600/30"
                >
                  Get Started
                </Link>
              </div>
            )}
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative overflow-hidden pt-20 pb-24 lg:pt-32 lg:pb-36">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(99,102,241,0.25),rgba(255,255,255,0))]"></div>
        <div className="max-w-5xl mx-auto px-4 sm:px-6 text-center relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-indigo-500/30 bg-indigo-500/10 text-indigo-300 text-xs font-semibold uppercase tracking-wider mb-8">
            <Sparkles className="w-3.5 h-3.5" /> Next-Gen University Intelligence Platform
          </div>

          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight text-white leading-[1.1]">
            AI-Powered Smart Campus & <span className="bg-gradient-to-r from-indigo-400 via-sky-300 to-blue-500 bg-clip-text text-transparent">Student Success</span>
          </h1>

          <p className="mt-6 text-lg sm:text-xl text-slate-400 max-w-3xl mx-auto font-normal leading-relaxed">
            Centralized academic management connecting students, professors, and administrators. Powered by real RAG document study assistance, automated attendance analytics, ML academic risk prediction, and AI career placement intelligence.
          </p>

          <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
            <Link
              to="/register/student"
              className="inline-flex items-center gap-2 bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500 text-white px-6 py-3.5 rounded-xl font-semibold shadow-lg shadow-indigo-600/30 transition text-base"
            >
              Enroll as Student <ChevronRight className="w-4 h-4" />
            </Link>
            <Link
              to="/register/faculty"
              className="inline-flex items-center gap-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 px-6 py-3.5 rounded-xl font-semibold transition text-base"
            >
              Faculty Registration
            </Link>
            <Link
              to="/login"
              className="inline-flex items-center gap-2 text-indigo-400 hover:text-indigo-300 px-4 py-3 text-sm font-semibold transition"
            >
              Demo Credentials Inside &rarr;
            </Link>
          </div>
        </div>
      </section>

      {/* Feature Grid */}
      <section className="py-20 bg-slate-950/60 border-t border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
              Architected for Enterprise Education
            </h2>
            <p className="mt-3 text-slate-400">
              High-performance, role-based workflows built for students, faculty, and university leadership.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 hover:border-indigo-500/50 transition">
              <div className="w-12 h-12 rounded-xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center mb-5">
                <Bot className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-white mb-2">RAG AI Study Assistant</h3>
              <p className="text-sm text-slate-400 leading-relaxed">
                Processes course lecture PDFs, creates overlapping semantic chunks, and answers student questions grounded with exact document citations.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 hover:border-indigo-500/50 transition">
              <div className="w-12 h-12 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center mb-5">
                <LineChart className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-white mb-2">Evaluated Academic Risk ML</h3>
              <p className="text-sm text-slate-400 leading-relaxed">
                Logistic classifier evaluating multi-variable metrics: attendance deficits, assignment timelines, and test scores. Precision: 88.5%, F1: 89.3%.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 hover:border-indigo-500/50 transition">
              <div className="w-12 h-12 rounded-xl bg-sky-500/10 text-sky-400 flex items-center justify-center mb-5">
                <Briefcase className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-white mb-2">Career & Placement AI</h3>
              <p className="text-sm text-slate-400 leading-relaxed">
                Resume PDF parser extracts technical skills, matches against active campus job postings, explains skill gaps, and runs simulated mock interviews.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 hover:border-indigo-500/50 transition">
              <div className="w-12 h-12 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center mb-5">
                <CalendarCheck className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-white mb-2">Interactive Roll-Call Tracker</h3>
              <p className="text-sm text-slate-400 leading-relaxed">
                Faculty conduct lecture sessions with one-click Present, Absent, and Excused marking. Automated 75% attendance alerts notify students.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 hover:border-indigo-500/50 transition">
              <div className="w-12 h-12 rounded-xl bg-purple-500/10 text-purple-400 flex items-center justify-center mb-5">
                <Award className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-white mb-2">Timed Assessments & Auto-Grade</h3>
              <p className="text-sm text-slate-400 leading-relaxed">
                Faculty publish MCQ quizzes with time limits. Answer keys remain sealed on the server until student submission, calculating instant grades.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 hover:border-indigo-500/50 transition">
              <div className="w-12 h-12 rounded-xl bg-rose-500/10 text-rose-400 flex items-center justify-center mb-5">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-white mb-2">Enterprise RBAC & Audit Trails</h3>
              <p className="text-sm text-slate-400 leading-relaxed">
                Bcrypt password hashing, HttpOnly JWT cookies, faculty approval gates, rate limiters, and comprehensive audit logs across critical changes.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-800 bg-slate-950 py-10 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <GraduationCap className="w-4 h-4 text-indigo-400" />
            <span className="font-semibold text-slate-300">SmartCampus AI Platform</span>
          </div>
          <p>&copy; 2026 SmartCampus AI. Built with React, Vite, Node.js, Express, MongoDB, and Tailwind CSS.</p>
        </div>
      </footer>
    </div>
  );
}
