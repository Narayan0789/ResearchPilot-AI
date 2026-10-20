import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import api from '../../services/api';
import toast from 'react-hot-toast';
import {
  Users,
  Search,
  CheckCircle2,
  XCircle,
  Clock,
  Shield,
  PlusCircle,
  X,
  AlertCircle
} from 'lucide-react';

export default function AdminUsers() {
  const [searchParams] = useSearchParams();
  const initialRole = searchParams.get('role') || 'all';
  const initialStatus = searchParams.get('status') || 'all';

  const [users, setUsers] = useState([]);
  const [roleFilter, setRoleFilter] = useState(initialRole);
  const [statusFilter, setStatusFilter] = useState(initialStatus);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  // New Admin Provisioning Modal
  const [showAdminModal, setShowAdminModal] = useState(false);
  const [adminName, setAdminName] = useState('');
  const [adminEmail, setAdminEmail] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const [creatingAdmin, setCreatingAdmin] = useState(false);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await api.get('/admin/users', {
        params: {
          role: roleFilter,
          status: statusFilter,
          search: search || undefined
        }
      });
      if (res.data.success) {
        setUsers(res.data.data.users);
      }
    } catch (err) {
      console.error('Failed to load users:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [roleFilter, statusFilter]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchUsers();
  };

  const handleFacultyApproval = async (userId, decision) => {
    let rejectionReason = '';
    if (decision === 'reject') {
      rejectionReason = window.prompt('Please enter the reason for rejecting this faculty registration:');
      if (rejectionReason === null) return;
    }

    try {
      const res = await api.patch(`/admin/faculty/${userId}/approval`, {
        decision,
        rejectionReason
      });
      if (res.data.success) {
        toast.success(res.data.message);
        fetchUsers();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Action failed');
    }
  };

  const handleToggleStatus = async (userId, newStatus) => {
    if (!window.confirm(`Are you sure you want to mark this account as ${newStatus}?`)) return;

    try {
      const res = await api.patch(`/admin/users/${userId}/status`, { status: newStatus });
      if (res.data.success) {
        toast.success(res.data.message);
        fetchUsers();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Status update failed');
    }
  };

  const handleCreateAdmin = async (e) => {
    e.preventDefault();
    setCreatingAdmin(true);
    try {
      const res = await api.post('/admin/create-admin', {
        name: adminName,
        email: adminEmail,
        password: adminPassword
      });
      if (res.data.success) {
        toast.success('New administrator account provisioned!');
        setShowAdminModal(false);
        setAdminName('');
        setAdminEmail('');
        setAdminPassword('');
        fetchUsers();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create administrator');
    } finally {
      setCreatingAdmin(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">User Account Management</h1>
          <p className="text-xs text-slate-500 mt-1">
            Governance over students, faculty approvals, and administrative credentials
          </p>
        </div>

        <button
          onClick={() => setShowAdminModal(true)}
          className="inline-flex items-center gap-2 py-2 px-4 bg-purple-600 hover:bg-purple-500 text-white font-semibold rounded-xl text-xs transition shadow-sm cursor-pointer"
        >
          <Shield className="w-4 h-4" /> Provision Admin Account
        </button>
      </div>

      {/* Filters Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row items-center justify-between gap-3">
        <form onSubmit={handleSearchSubmit} className="relative w-full md:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search by name or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs border border-slate-300 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </form>

        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          <div className="flex items-center gap-1.5 text-xs text-slate-500">
            <span>Role:</span>
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="px-2.5 py-1.5 text-xs border border-slate-300 rounded-xl bg-white font-medium outline-none"
            >
              <option value="all">All Roles</option>
              <option value="student">Students</option>
              <option value="faculty">Faculty</option>
              <option value="admin">Administrators</option>
            </select>
          </div>

          <div className="flex items-center gap-1.5 text-xs text-slate-500">
            <span>Status:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-2.5 py-1.5 text-xs border border-slate-300 rounded-xl bg-white font-medium outline-none"
            >
              <option value="all">All Statuses</option>
              <option value="active">Active</option>
              <option value="pending">Pending Approval</option>
              <option value="deactivated">Deactivated</option>
            </select>
          </div>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-wider font-semibold text-[11px]">
              <tr>
                <th className="py-3 px-4">User</th>
                <th className="py-3 px-4">Role</th>
                <th className="py-3 px-4">Department & Details</th>
                <th className="py-3 px-4 text-center">Account Status</th>
                <th className="py-3 px-4 text-right">Administrative Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {users.map(u => {
                const isPendingFaculty = u.role === 'faculty' && u.status === 'pending';
                const isActive = u.status === 'active';

                return (
                  <tr key={u._id} className="hover:bg-slate-50/50 transition">
                    <td className="py-3.5 px-4">
                      <span className="font-bold text-slate-900 block">{u.name}</span>
                      <span className="text-slate-400 text-[11px]">{u.email}</span>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
                        u.role === 'admin' ? 'bg-purple-100 text-purple-700' :
                        u.role === 'faculty' ? 'bg-emerald-100 text-emerald-700' :
                        'bg-blue-100 text-blue-700'
                      }`}>
                        {u.role}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-slate-600">
                      {u.role === 'student' && u.profile ? (
                        <span>{u.profile.department} &bull; ID: {u.profile.studentId} (Sem {u.profile.semester})</span>
                      ) : u.role === 'faculty' && u.profile ? (
                        <span>{u.profile.department} &bull; {u.profile.designation} (ID: {u.profile.facultyId})</span>
                      ) : (
                        <span className="text-slate-400">Institutional Administrator</span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
                        u.status === 'active' ? 'bg-emerald-100 text-emerald-800' :
                        u.status === 'pending' ? 'bg-amber-100 text-amber-800 animate-pulse' :
                        'bg-rose-100 text-rose-800'
                      }`}>
                        {u.status}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      {isPendingFaculty ? (
                        <div className="inline-flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleFacultyApproval(u._id, 'approve')}
                            className="py-1 px-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold"
                          >
                            Approve
                          </button>
                          <button
                            type="button"
                            onClick={() => handleFacultyApproval(u._id, 'reject')}
                            className="py-1 px-2 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-lg text-xs font-bold border border-rose-200"
                          >
                            Reject
                          </button>
                        </div>
                      ) : u.role !== 'admin' ? (
                        <button
                          type="button"
                          onClick={() => handleToggleStatus(u._id, isActive ? 'deactivated' : 'active')}
                          className={`py-1 px-2.5 rounded-lg text-xs font-semibold ${
                            isActive
                              ? 'bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200'
                              : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200'
                          }`}
                        >
                          {isActive ? 'Deactivate' : 'Reactivate'}
                        </button>
                      ) : (
                        <span className="text-slate-400 text-xs italic">Protected Admin</span>
                      )}
                    </td>
                  </tr>
                );
              })}

              {users.length === 0 && !loading && (
                <tr>
                  <td colSpan="5" className="py-10 text-center text-slate-400">
                    No users matching criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Provision Admin Modal */}
      {showAdminModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <div className="flex items-center gap-2">
                <Shield className="w-5 h-5 text-purple-600" />
                <h3 className="text-base font-bold text-slate-900">Provision Administrator</h3>
              </div>
              <button onClick={() => setShowAdminModal(false)} className="p-1 rounded-full text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-3 bg-purple-50 border border-purple-200 rounded-xl text-xs text-purple-800 mb-4">
              Authorized Action: Only authenticated administrators can provision additional governance accounts.
            </div>

            <form onSubmit={handleCreateAdmin} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Full Legal Name *</label>
                <input
                  type="text"
                  required
                  value={adminName}
                  onChange={(e) => setAdminName(e.target.value)}
                  placeholder="e.g. Dr. Robert Vance"
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-purple-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Official Administrator Email *</label>
                <input
                  type="email"
                  required
                  value={adminEmail}
                  onChange={(e) => setAdminEmail(e.target.value)}
                  placeholder="vance.admin@smartcampus.edu"
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-purple-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Secure Password *</label>
                <input
                  type="password"
                  required
                  value={adminPassword}
                  onChange={(e) => setAdminPassword(e.target.value)}
                  placeholder="Min 8 chars, 1 uppercase, 1 number"
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-purple-500 outline-none"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAdminModal(false)}
                  className="py-2 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creatingAdmin}
                  className="py-2.5 px-5 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded-xl text-xs transition disabled:opacity-50"
                >
                  {creatingAdmin ? 'Provisioning...' : 'Create Admin Account'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
