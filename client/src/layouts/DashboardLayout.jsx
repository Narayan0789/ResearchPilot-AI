import React, { useState, useEffect } from 'react';
import { Outlet, NavLink, Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';
import {
  GraduationCap,
  LayoutDashboard,
  BookOpen,
  CalendarCheck,
  FileText,
  Award,
  Bot,
  Briefcase,
  Users,
  ShieldAlert,
  Bell,
  User,
  LogOut,
  Menu,
  X,
  ChevronDown,
  Building2,
  TrendingUp,
  FileCheck2,
  Settings
} from 'lucide-react';

export default function DashboardLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    async function fetchUnreadNotifications() {
      try {
        const res = await api.get('/notifications');
        if (res.data.success) {
          setUnreadCount(res.data.data.unreadCount || 0);
        }
      } catch (err) {
        // Silently catch
      }
    }
    fetchUnreadNotifications();
    const interval = setInterval(fetchUnreadNotifications, 30000); // 30s poll
    return () => clearInterval(interval);
  }, [location.pathname]);

  // Close mobile sidebar on route change
  useEffect(() => {
    setSidebarOpen(false);
    setProfileDropdownOpen(false);
  }, [location.pathname]);

  const studentLinks = [
    { name: 'Dashboard', path: '/student/dashboard', icon: LayoutDashboard },
    { name: 'My Courses', path: '/student/courses', icon: BookOpen },
    { name: 'Attendance', path: '/student/attendance', icon: CalendarCheck },
    { name: 'Assignments', path: '/student/assignments', icon: FileText },
    { name: 'Quizzes & Grades', path: '/student/assessments', icon: Award },
    { name: 'AI Study Assistant', path: '/student/study-assistant', icon: Bot, badge: 'AI' },
    { name: 'Career & Placement', path: '/student/career', icon: Briefcase, badge: 'AI' },
    { name: 'Academic Goals', path: '/student/success', icon: TrendingUp }
  ];

  const facultyLinks = [
    { name: 'Dashboard', path: '/faculty/dashboard', icon: LayoutDashboard },
    { name: 'Assigned Courses', path: '/faculty/courses', icon: BookOpen },
    { name: 'Roll Call Attendance', path: '/faculty/attendance', icon: CalendarCheck },
    { name: 'Assignments & Grading', path: '/faculty/assignments', icon: FileText },
    { name: 'Assessment Builder', path: '/faculty/assessments', icon: Award },
    { name: 'Student Risk Analytics', path: '/faculty/insights', icon: TrendingUp, badge: 'ML' }
  ];

  const adminLinks = [
    { name: 'System Overview', path: '/admin/dashboard', icon: LayoutDashboard },
    { name: 'User Management', path: '/admin/users', icon: Users },
    { name: 'Departments & Courses', path: '/admin/academics', icon: Building2 },
    { name: 'Campus Announcements', path: '/admin/announcements', icon: Bell },
    { name: 'System Audit Logs', path: '/admin/audit-logs', icon: ShieldAlert }
  ];

  let currentNavLinks = studentLinks;
  if (user?.role === 'faculty') currentNavLinks = facultyLinks;
  if (user?.role === 'admin') currentNavLinks = adminLinks;

  const getRoleBadge = (role) => {
    switch (role) {
      case 'admin':
        return <span className="bg-purple-100 text-purple-700 text-xs px-2 py-0.5 rounded-full font-semibold uppercase">Admin</span>;
      case 'faculty':
        return <span className="bg-emerald-100 text-emerald-700 text-xs px-2 py-0.5 rounded-full font-semibold uppercase">Faculty</span>;
      default:
        return <span className="bg-blue-100 text-blue-700 text-xs px-2 py-0.5 rounded-full font-semibold uppercase">Student</span>;
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Top Navigation Bar */}
      <header className="sticky top-0 z-40 bg-white border-b border-slate-200 h-16 flex items-center justify-between px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="lg:hidden p-2 text-slate-500 hover:text-slate-700 rounded-lg focus:outline-none"
            aria-label="Toggle navigation menu"
          >
            {sidebarOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>

          <Link to="/" className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 to-blue-500 flex items-center justify-center text-white shadow-sm shadow-indigo-200">
              <GraduationCap className="w-5 h-5" />
            </div>
            <div>
              <span className="font-extrabold text-slate-900 tracking-tight text-lg">SmartCampus</span>
              <span className="text-xs bg-indigo-50 text-indigo-700 font-bold px-1.5 py-0.5 rounded ml-1 border border-indigo-200">AI</span>
            </div>
          </Link>
        </div>

        {/* Right Header: Notifications & Profile */}
        <div className="flex items-center gap-3 sm:gap-4">
          <Link
            to="/notifications"
            className="relative p-2 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-full transition"
            title="Notifications"
          >
            <Bell className="w-5 h-5" />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 w-4 h-4 bg-rose-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center animate-pulse">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </Link>

          <div className="relative">
            <button
              onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
              className="flex items-center gap-2.5 p-1 rounded-full hover:bg-slate-100 transition focus:outline-none"
            >
              <img
                src={user?.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.name || 'User')}&background=0284c7&color=fff`}
                alt={user?.name}
                className="w-8 h-8 rounded-full object-cover border border-slate-200"
              />
              <div className="hidden sm:block text-left text-xs leading-tight">
                <div className="font-semibold text-slate-800">{user?.name}</div>
                <div className="text-slate-500 capitalize">{user?.role}</div>
              </div>
              <ChevronDown className="w-4 h-4 text-slate-400 hidden sm:block" />
            </button>

            {/* Profile Dropdown */}
            {profileDropdownOpen && (
              <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-lg border border-slate-100 py-1.5 z-50">
                <div className="px-4 py-2 border-b border-slate-100">
                  <p className="text-sm font-semibold text-slate-900">{user?.name}</p>
                  <p className="text-xs text-slate-500 truncate">{user?.email}</p>
                  <div className="mt-1">{getRoleBadge(user?.role)}</div>
                </div>

                <Link
                  to="/profile"
                  className="flex items-center gap-2 px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 hover:text-indigo-600"
                >
                  <User className="w-4 h-4" /> Profile & Settings
                </Link>

                <button
                  onClick={logout}
                  className="w-full flex items-center gap-2 px-4 py-2 text-xs font-medium text-rose-600 hover:bg-rose-50 transition"
                >
                  <LogOut className="w-4 h-4" /> Sign Out
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Main Container */}
      <div className="flex-1 flex">
        {/* Sidebar for Desktop & Mobile Overlay */}
        <aside
          className={`fixed inset-y-0 left-0 z-30 w-64 bg-white border-r border-slate-200 pt-16 flex flex-col justify-between transition-transform duration-200 ease-in-out lg:static lg:translate-x-0 ${
            sidebarOpen ? 'translate-x-0' : '-translate-x-full'
          }`}
        >
          <div className="p-4 space-y-1 overflow-y-auto">
            <div className="px-3 py-2 text-[11px] font-bold uppercase tracking-wider text-slate-400">
              {user?.role === 'admin' ? 'Administration' : user?.role === 'faculty' ? 'Faculty Portal' : 'Student Space'}
            </div>

            {currentNavLinks.map(link => {
              const Icon = link.icon;
              return (
                <NavLink
                  key={link.path}
                  to={link.path}
                  className={({ isActive }) =>
                    `flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium transition ${
                      isActive
                        ? 'bg-indigo-50 text-indigo-700 font-semibold shadow-xs'
                        : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                    }`
                  }
                >
                  <div className="flex items-center gap-3">
                    <Icon className="w-4 h-4" />
                    <span>{link.name}</span>
                  </div>
                  {link.badge && (
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-indigo-100 text-indigo-700">
                      {link.badge}
                    </span>
                  )}
                </NavLink>
              );
            })}
          </div>

          {/* Sidebar Footer info */}
          <div className="p-4 border-t border-slate-100 bg-slate-50/50">
            <div className="flex items-center gap-2 text-xs text-slate-500">
              <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block animate-ping"></span>
              <span>System Status: <strong className="text-slate-700">Operational</strong></span>
            </div>
            <div className="text-[11px] text-slate-400 mt-1">SmartCampus AI v1.0 Production</div>
          </div>
        </aside>

        {/* Backdrop for mobile */}
        {sidebarOpen && (
          <div
            onClick={() => setSidebarOpen(false)}
            className="fixed inset-0 bg-slate-900/20 backdrop-blur-xs z-20 lg:hidden"
          />
        )}

        {/* Content Body */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
