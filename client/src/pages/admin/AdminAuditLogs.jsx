import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import {
  ShieldAlert,
  Search,
  Clock,
  Terminal,
  User,
  Shield
} from 'lucide-react';

export default function AdminAuditLogs() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedLog, setSelectedLog] = useState(null);

  useEffect(() => {
    async function fetchLogs() {
      try {
        const res = await api.get('/admin/audit-logs');
        if (res.data.success) {
          setLogs(res.data.data.logs);
        }
      } catch (err) {
        console.error('Failed to load audit logs:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchLogs();
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">System Security Audit Logs</h1>
        <p className="text-xs text-slate-500 mt-1">
          Chronological immutable audit stream recording administrative events, logins, and permission changes
        </p>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-5 h-5 text-indigo-600" />
            <h3 className="text-sm font-bold text-slate-800">Recorded Security Events ({logs.length})</h3>
          </div>
          <span className="text-xs text-slate-400 font-mono">Retention Policy: 365 Days</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-wider font-semibold text-[10px]">
              <tr>
                <th className="py-3 px-4">Timestamp</th>
                <th className="py-3 px-4">Action</th>
                <th className="py-3 px-4">Entity</th>
                <th className="py-3 px-4">Initiating User</th>
                <th className="py-3 px-4">IP Address</th>
                <th className="py-3 px-4 text-right">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {logs.map(log => (
                <tr key={log._id} className="hover:bg-slate-50 transition">
                  <td className="py-3 px-4 text-slate-400 text-[11px] whitespace-nowrap">
                    {new Date(log.createdAt).toLocaleString()}
                  </td>
                  <td className="py-3 px-4 font-bold text-slate-900">
                    <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-800 text-[10px]">
                      {log.action}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-slate-600">{log.entity}</td>
                  <td className="py-3 px-4 text-slate-700">
                    {log.user?.email || 'System / Unauthenticated'}
                  </td>
                  <td className="py-3 px-4 text-slate-400 text-[11px]">
                    {log.ipAddress || '127.0.0.1'}
                  </td>
                  <td className="py-3 px-4 text-right">
                    <button
                      onClick={() => setSelectedLog(log)}
                      className="text-xs font-semibold text-indigo-600 hover:underline"
                    >
                      Inspect JSON
                    </button>
                  </td>
                </tr>
              ))}

              {logs.length === 0 && !loading && (
                <tr>
                  <td colSpan="6" className="py-8 text-center text-slate-400">
                    No security audit logs found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Inspect Log Modal */}
      {selectedLog && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-slate-950 text-slate-200 rounded-3xl max-w-lg w-full p-6 shadow-2xl font-mono text-xs max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-4 text-white">
              <span className="font-bold flex items-center gap-2">
                <Terminal className="w-4 h-4 text-indigo-400" /> Event Details: {selectedLog.action}
              </span>
              <button onClick={() => setSelectedLog(null)} className="text-slate-400 hover:text-white">✕</button>
            </div>

            <pre className="p-4 bg-slate-900 rounded-2xl overflow-x-auto text-[11px] text-emerald-400 leading-relaxed border border-slate-800">
              {JSON.stringify(selectedLog, null, 2)}
            </pre>

            <div className="pt-4 flex justify-end">
              <button
                onClick={() => setSelectedLog(null)}
                className="py-1.5 px-4 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-semibold"
              >
                Close Inspector
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
