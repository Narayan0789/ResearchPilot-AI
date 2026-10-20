import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import toast from 'react-hot-toast';
import {
  Bell,
  PlusCircle,
  Clock,
  Pin,
  AlertTriangle,
  X
} from 'lucide-react';

export default function AdminAnnouncements() {
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);

  // New announcement modal
  const [showModal, setShowModal] = useState(false);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [targetRole, setTargetRole] = useState('all');
  const [priority, setPriority] = useState('medium');
  const [pinned, setPinned] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const fetchAnnouncements = async () => {
    try {
      const res = await api.get('/announcements');
      if (res.data.success) {
        setAnnouncements(res.data.data);
      }
    } catch (err) {
      console.error('Failed to load announcements:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnnouncements();
  }, []);

  const handleCreateAnnouncement = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await api.post('/announcements', {
        title,
        content,
        targetRole,
        priority,
        pinned
      });
      if (res.data.success) {
        toast.success('Announcement broadcasted across campus!');
        setShowModal(false);
        setTitle('');
        setContent('');
        setPinned(false);
        fetchAnnouncements();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to post announcement');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Institutional Announcements</h1>
          <p className="text-xs text-slate-500 mt-1">
            Broadcast official notices, emergency alerts, and exam circulars to campus members
          </p>
        </div>

        <button
          onClick={() => setShowModal(true)}
          className="inline-flex items-center gap-2 py-2.5 px-4 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-xl text-xs transition shadow-sm cursor-pointer"
        >
          <PlusCircle className="w-4 h-4" /> Broadcast Announcement
        </button>
      </div>

      {loading ? (
        <div className="py-20 text-center text-slate-400 text-sm">Loading announcements...</div>
      ) : announcements.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center text-slate-500">
          <Bell className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-800">No active announcements</h3>
          <p className="text-xs text-slate-400 mt-1">Click Broadcast Announcement to create a campus alert.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {announcements.map(ann => (
            <div
              key={ann._id}
              className={`p-6 rounded-2xl border shadow-xs transition ${
                ann.pinned ? 'bg-amber-50/40 border-amber-200' : 'bg-white border-slate-200'
              }`}
            >
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-2">
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-bold text-slate-900">{ann.title}</h3>
                  {ann.pinned && (
                    <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded bg-rose-100 text-rose-700">
                      <Pin className="w-3 h-3" /> PINNED
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-2 text-xs">
                  <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                    Target: {ann.targetRole}
                  </span>
                  <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded ${
                    ann.priority === 'urgent' ? 'bg-rose-100 text-rose-700' :
                    ann.priority === 'high' ? 'bg-amber-100 text-amber-700' :
                    'bg-blue-100 text-blue-700'
                  }`}>
                    {ann.priority} Priority
                  </span>
                </div>
              </div>

              <p className="text-xs text-slate-600 leading-relaxed mb-4 whitespace-pre-line">
                {ann.content}
              </p>

              <div className="pt-3 border-t border-slate-100 text-[11px] text-slate-400 flex items-center justify-between">
                <span>By {ann.author?.name || 'Institutional Office'} ({ann.author?.email})</span>
                <span>{new Date(ann.createdAt).toLocaleString()}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Broadcast Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <h3 className="text-base font-bold text-slate-900">Broadcast Campus Announcement</h3>
              <button onClick={() => setShowModal(false)} className="p-1 rounded-full text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateAnnouncement} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Mid-Term Examination Guidelines & Timetable"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Target Audience</label>
                  <select
                    value={targetRole}
                    onChange={(e) => setTargetRole(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none bg-white"
                  >
                    <option value="all">Entire Campus (All)</option>
                    <option value="student">Students Only</option>
                    <option value="faculty">Faculty Only</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Priority Level</label>
                  <select
                    value={priority}
                    onChange={(e) => setPriority(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none bg-white"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="urgent">Urgent</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Notice Body / Message *</label>
                <textarea
                  rows={4}
                  required
                  placeholder="Type official notification body..."
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                ></textarea>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="pinNotice"
                  checked={pinned}
                  onChange={(e) => setPinned(e.target.checked)}
                  className="w-4 h-4 text-indigo-600 rounded"
                />
                <label htmlFor="pinNotice" className="text-xs text-slate-700 cursor-pointer">
                  Pin this announcement to top of student & faculty dashboards
                </label>
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="py-2 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="py-2.5 px-5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl text-xs transition disabled:opacity-50"
                >
                  {submitting ? 'Broadcasting...' : 'Broadcast Announcement'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
