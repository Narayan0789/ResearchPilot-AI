import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import toast from 'react-hot-toast';
import {
  Bell,
  CheckCheck,
  CheckCircle2,
  CalendarCheck,
  FileText,
  Award,
  AlertTriangle,
  Info
} from 'lucide-react';

export default function Notifications() {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);

  const fetchNotifications = async () => {
    try {
      const res = await api.get('/notifications');
      if (res.data.success) {
        setNotifications(res.data.data.notifications);
        setUnreadCount(res.data.data.unreadCount);
      }
    } catch (err) {
      console.error('Failed to load notifications:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  const handleMarkAsRead = async (id) => {
    try {
      const res = await api.patch(`/notifications/${id}/read`);
      if (res.data.success) {
        fetchNotifications();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      const res = await api.patch('/notifications/mark-all-read');
      if (res.data.success) {
        toast.success('All notifications marked as read');
        fetchNotifications();
      }
    } catch (err) {
      toast.error('Failed to mark all as read');
    }
  };

  const getIcon = (type) => {
    switch (type) {
      case 'assignment':
        return <FileText className="w-5 h-5 text-indigo-600" />;
      case 'grade':
        return <Award className="w-5 h-5 text-emerald-600" />;
      case 'attendance':
        return <CalendarCheck className="w-5 h-5 text-amber-600" />;
      case 'announcement':
        return <Bell className="w-5 h-5 text-purple-600" />;
      default:
        return <Info className="w-5 h-5 text-blue-600" />;
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Notification Center</h1>
          <p className="text-xs text-slate-500 mt-1">
            Real-time alerts regarding assignment releases, published grades, and faculty attendance notices
          </p>
        </div>

        {unreadCount > 0 && (
          <button
            onClick={handleMarkAllRead}
            className="inline-flex items-center gap-1.5 py-2 px-3.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition cursor-pointer"
          >
            <CheckCheck className="w-4 h-4 text-indigo-600" /> Mark All as Read
          </button>
        )}
      </div>

      {loading ? (
        <div className="py-20 text-center text-slate-400 text-sm">Loading notification feed...</div>
      ) : notifications.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center text-slate-500">
          <Bell className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-800">No notifications</h3>
          <p className="text-xs text-slate-400 mt-1">You are completely up to date with campus activities.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {notifications.map(n => (
            <div
              key={n._id}
              className={`p-4 rounded-2xl border transition flex items-start justify-between gap-4 ${
                !n.read
                  ? 'bg-white border-indigo-200 shadow-xs ring-1 ring-indigo-500/10'
                  : 'bg-white/60 border-slate-200 text-slate-600'
              }`}
            >
              <div className="flex items-start gap-3.5">
                <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 mt-0.5">
                  {getIcon(n.type)}
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-0.5">
                    <h3 className={`text-sm ${!n.read ? 'font-bold text-slate-900' : 'font-semibold text-slate-700'}`}>
                      {n.title}
                    </h3>
                    {!n.read && (
                      <span className="w-2 h-2 rounded-full bg-indigo-600 inline-block"></span>
                    )}
                  </div>
                  <p className="text-xs text-slate-500 leading-relaxed mb-1.5">{n.message}</p>
                  <span className="text-[10px] text-slate-400">{new Date(n.createdAt).toLocaleString()}</span>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                {n.link && (
                  <Link
                    to={n.link}
                    className="py-1 px-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold"
                  >
                    View
                  </Link>
                )}
                {!n.read && (
                  <button
                    onClick={() => handleMarkAsRead(n._id)}
                    className="p-1.5 text-slate-400 hover:text-indigo-600 rounded-lg hover:bg-slate-100"
                    title="Mark as read"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
