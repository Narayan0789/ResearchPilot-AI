import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';
import toast from 'react-hot-toast';
import {
  User,
  Lock,
  Bell,
  Camera,
  CheckCircle2,
  Shield,
  Save,
  KeyRound,
  GraduationCap
} from 'lucide-react';

export default function ProfileSettings() {
  const { user, refreshUser } = useAuth();

  // Basic Info Form
  const [name, setName] = useState(user?.name || '');
  const [phone, setPhone] = useState(user?.profile?.phone || '');
  const [skills, setSkills] = useState(user?.profile?.skills?.join(', ') || '');
  const [careerInterests, setCareerInterests] = useState(user?.profile?.careerInterests?.join(', ') || '');
  const [officeHours, setOfficeHours] = useState(user?.profile?.officeHours || '');
  const [qualifications, setQualifications] = useState(user?.profile?.qualifications?.join(', ') || '');
  const [savingProfile, setSavingProfile] = useState(false);

  // Change Password Form
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [changingPass, setChangingPass] = useState(false);

  // Notification Preferences
  const [notifPrefs, setNotifPrefs] = useState(user?.notificationPreferences || {
    email: true,
    assignments: true,
    grades: true,
    attendance: true
  });

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setSavingProfile(true);

    try {
      const payload = {
        name,
        notificationPreferences: notifPrefs
      };

      if (user.role === 'student') {
        payload.phone = phone;
        payload.skills = skills;
        payload.careerInterests = careerInterests;
      } else if (user.role === 'faculty') {
        payload.officeHours = officeHours;
        payload.qualifications = qualifications;
      }

      const res = await api.patch('/users/profile', payload);
      if (res.data.success) {
        toast.success('Profile details saved successfully!');
        refreshUser();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update profile');
    } finally {
      setSavingProfile(false);
    }
  };

  const handleAvatarUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('avatar', file);

    try {
      const res = await api.patch('/users/profile', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      if (res.data.success) {
        toast.success('Avatar photo updated!');
        refreshUser();
      }
    } catch (err) {
      toast.error('Failed to upload avatar image');
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (newPassword !== confirmNewPassword) {
      toast.error('New passwords do not match');
      return;
    }

    setChangingPass(true);
    try {
      const res = await api.patch('/auth/change-password', {
        currentPassword,
        newPassword,
        confirmNewPassword
      });
      if (res.data.success) {
        toast.success('Password updated successfully!');
        setCurrentPassword('');
        setNewPassword('');
        setConfirmNewPassword('');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Password change failed');
    } finally {
      setChangingPass(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">User Profile & Account Settings</h1>
        <p className="text-xs text-slate-500 mt-1">
          Manage your personal details, profile picture, notification rules, and authentication credentials
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left Column: Avatar & Role Summary Card */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs flex flex-col items-center text-center">
          <div className="relative mb-4">
            <img
              src={user?.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.name || 'User')}&background=0284c7&color=fff&size=128`}
              alt={user?.name}
              className="w-24 h-24 rounded-full object-cover border-2 border-indigo-100 shadow-sm"
            />
            <label className="absolute bottom-0 right-0 p-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-full cursor-pointer shadow-md transition">
              <Camera className="w-4 h-4" />
              <input type="file" accept="image/*" onChange={handleAvatarUpload} className="hidden" />
            </label>
          </div>

          <h3 className="text-base font-bold text-slate-900">{user?.name}</h3>
          <p className="text-xs text-slate-400 mb-3">{user?.email}</p>

          <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-indigo-50 text-indigo-700 border border-indigo-200 mb-6">
            {user?.role} Portal
          </span>

          <div className="w-full pt-4 border-t border-slate-100 space-y-2 text-xs text-left text-slate-600">
            {user?.role === 'student' && user.profile && (
              <>
                <div className="flex justify-between">
                  <span>Student ID:</span>
                  <strong className="text-slate-900">{user.profile.studentId}</strong>
                </div>
                <div className="flex justify-between">
                  <span>Department:</span>
                  <strong className="text-slate-900">{user.profile.department}</strong>
                </div>
                <div className="flex justify-between">
                  <span>Current Semester:</span>
                  <strong className="text-slate-900">Term {user.profile.semester}</strong>
                </div>
              </>
            )}

            {user?.role === 'faculty' && user.profile && (
              <>
                <div className="flex justify-between">
                  <span>Faculty ID:</span>
                  <strong className="text-slate-900">{user.profile.facultyId}</strong>
                </div>
                <div className="flex justify-between">
                  <span>Department:</span>
                  <strong className="text-slate-900">{user.profile.department}</strong>
                </div>
                <div className="flex justify-between">
                  <span>Designation:</span>
                  <strong className="text-slate-900">{user.profile.designation}</strong>
                </div>
              </>
            )}

            <div className="flex justify-between items-center pt-2 border-t border-slate-100">
              <span>Email Verified:</span>
              <span className={`font-semibold flex items-center gap-1 ${user?.isVerified ? 'text-emerald-600' : 'text-amber-600'}`}>
                <CheckCircle2 className="w-3.5 h-3.5" /> {user?.isVerified ? 'Verified' : 'Pending'}
              </span>
            </div>
          </div>
        </div>

        {/* Right Columns: Profile Form & Password Form */}
        <div className="md:col-span-2 space-y-6">
          {/* Edit Profile Form */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
            <h3 className="text-base font-bold text-slate-900 mb-1">Personal Information</h3>
            <p className="text-xs text-slate-500 mb-4">Edit permitted contact and professional details</p>

            <form onSubmit={handleUpdateProfile} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Full Legal Name</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                />
              </div>

              {user?.role === 'student' && (
                <>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Contact Phone</label>
                    <input
                      type="text"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="+1 (555) 000-0000"
                      className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Technical Skills (Comma Separated)
                    </label>
                    <input
                      type="text"
                      value={skills}
                      onChange={(e) => setSkills(e.target.value)}
                      placeholder="e.g. javascript, react, python, docker"
                      className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Career Interests & Target Roles
                    </label>
                    <input
                      type="text"
                      value={careerInterests}
                      onChange={(e) => setCareerInterests(e.target.value)}
                      placeholder="e.g. Full Stack Developer, AI Researcher"
                      className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                    />
                  </div>
                </>
              )}

              {user?.role === 'faculty' && (
                <>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Office Hours</label>
                    <input
                      type="text"
                      value={officeHours}
                      onChange={(e) => setOfficeHours(e.target.value)}
                      placeholder="e.g. Mon, Wed 2:00 PM - 4:00 PM"
                      className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Qualifications (Comma Separated)
                    </label>
                    <input
                      type="text"
                      value={qualifications}
                      onChange={(e) => setQualifications(e.target.value)}
                      placeholder="e.g. Ph.D. in Computer Science, M.Tech"
                      className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                    />
                  </div>
                </>
              )}

              <div className="pt-2 flex justify-end">
                <button
                  type="submit"
                  disabled={savingProfile}
                  className="py-2.5 px-5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition disabled:opacity-50 flex items-center gap-1.5 cursor-pointer"
                >
                  <Save className="w-3.5 h-3.5" /> Save Profile Details
                </button>
              </div>
            </form>
          </div>

          {/* Change Password Card */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
            <h3 className="text-base font-bold text-slate-900 mb-1">Security & Password</h3>
            <p className="text-xs text-slate-500 mb-4">Update your password regularly to protect your account</p>

            <form onSubmit={handleChangePassword} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Current Password *</label>
                <input
                  type="password"
                  required
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">New Password *</label>
                  <input
                    type="password"
                    required
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Min 8 chars, 1 uppercase, 1 number"
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Confirm New Password *</label>
                  <input
                    type="password"
                    required
                    value={confirmNewPassword}
                    onChange={(e) => setConfirmNewPassword(e.target.value)}
                    placeholder="Repeat new password"
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                  />
                </div>
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  type="submit"
                  disabled={changingPass}
                  className="py-2 px-5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition disabled:opacity-50 flex items-center gap-1.5 cursor-pointer"
                >
                  <KeyRound className="w-3.5 h-3.5" /> Update Password
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
