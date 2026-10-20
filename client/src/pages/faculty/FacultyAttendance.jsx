import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import api from '../../services/api';
import toast from 'react-hot-toast';
import {
  CalendarCheck,
  CheckCircle2,
  XCircle,
  HelpCircle,
  Clock,
  Save,
  Users,
  PlusCircle,
  History,
  FileSpreadsheet
} from 'lucide-react';

export default function FacultyAttendance() {
  const [searchParams] = useSearchParams();
  const preselectedCourse = searchParams.get('courseId') || '';

  const [courses, setCourses] = useState([]);
  const [selectedCourseId, setSelectedCourseId] = useState(preselectedCourse);
  const [sessionTopic, setSessionTopic] = useState('');
  const [sessionType, setSessionType] = useState('lecture');
  const [activeSession, setActiveSession] = useState(null);
  const [studentRoster, setStudentRoster] = useState([]);
  const [recordsMap, setRecordsMap] = useState({}); // { studentId: 'present'|'absent'|'excused' }
  const [remarksMap, setRemarksMap] = useState({}); // { studentId: string }
  const [pastSessions, setPastSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    async function init() {
      try {
        const res = await api.get('/courses/my/assigned');
        if (res.data.success && res.data.data.length > 0) {
          setCourses(res.data.data);
          const initialCourse = selectedCourseId || res.data.data[0]._id;
          setSelectedCourseId(initialCourse);
          loadPastSessions(initialCourse);
        }
      } catch (err) {
        console.error('Failed to init attendance:', err);
      } finally {
        setLoading(false);
      }
    }
    init();
  }, []);

  const loadPastSessions = async (courseId) => {
    try {
      const res = await api.get(`/attendance/course/${courseId}/sessions`);
      if (res.data.success) {
        setPastSessions(res.data.data);
      }
    } catch (err) {
      console.error('Failed to load past sessions:', err);
    }
  };

  const handleCourseChange = (courseId) => {
    setSelectedCourseId(courseId);
    setActiveSession(null);
    setStudentRoster([]);
    setRecordsMap({});
    loadPastSessions(courseId);
  };

  const handleCreateSession = async (e) => {
    e.preventDefault();
    if (!selectedCourseId) {
      toast.error('Please select a course');
      return;
    }

    try {
      const res = await api.post('/attendance/sessions', {
        courseId: selectedCourseId,
        topic: sessionTopic || 'Class Lecture',
        sessionType
      });

      if (res.data.success) {
        const { session, enrolledStudents } = res.data.data;
        setActiveSession(session);
        setStudentRoster(enrolledStudents || []);

        // Default all students to 'present' for convenient quick roll call
        const defaults = {};
        enrolledStudents.forEach(s => {
          defaults[s._id] = 'present';
        });
        setRecordsMap(defaults);
        toast.success('Attendance session initiated. Review roster and submit.');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to start session');
    }
  };

  const setStudentStatus = (studentId, status) => {
    setRecordsMap(prev => ({
      ...prev,
      [studentId]: status
    }));
  };

  const handleMarkAll = (status) => {
    const updated = {};
    studentRoster.forEach(s => {
      updated[s._id] = status;
    });
    setRecordsMap(updated);
  };

  const handleSubmitAttendance = async () => {
    if (!activeSession) return;
    setSaving(true);

    const records = studentRoster.map(s => ({
      studentId: s._id,
      status: recordsMap[s._id] || 'present',
      remarks: remarksMap[s._id] || ''
    }));

    try {
      const res = await api.post(`/attendance/sessions/${activeSession._id}/mark`, { records });
      if (res.data.success) {
        toast.success('Attendance successfully recorded and saved to institutional records!');
        setActiveSession(null);
        setStudentRoster([]);
        loadPastSessions(selectedCourseId);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save attendance');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Roll Call & Attendance Management</h1>
          <p className="text-xs text-slate-500 mt-1">
            Conduct daily session roll calls, track student attendance, and generate institutional records
          </p>
        </div>

        {courses.length > 0 && (
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-slate-500">Course:</span>
            <select
              value={selectedCourseId}
              onChange={(e) => handleCourseChange(e.target.value)}
              className="px-3 py-1.5 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none bg-white font-medium"
            >
              {courses.map(c => (
                <option key={c._id} value={c._id}>{c.code} - {c.name}</option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Start New Session Form */}
      {!activeSession && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
          <h2 className="text-base font-bold text-slate-900 mb-1">Create Today's Attendance Session</h2>
          <p className="text-xs text-slate-500 mb-4">
            Select session type and lecture topic to pull the live class enrollment roster.
          </p>

          <form onSubmit={handleCreateSession} className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Session Type</label>
              <select
                value={sessionType}
                onChange={(e) => setSessionType(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none bg-white"
              >
                <option value="lecture">Lecture Session</option>
                <option value="lab">Laboratory Practical</option>
                <option value="tutorial">Tutorial / Seminar</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Topic Covered</label>
              <input
                type="text"
                required
                value={sessionTopic}
                onChange={(e) => setSessionTopic(e.target.value)}
                placeholder="e.g. Graph Traversal: BFS & DFS Implementations"
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
              />
            </div>

            <div className="flex items-end">
              <button
                type="submit"
                className="w-full py-2.5 px-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold shadow-xs transition flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <PlusCircle className="w-4 h-4" /> Start Roll Call Session
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Interactive Roll Call Table */}
      {activeSession && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden animate-fadeIn">
          <div className="p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-slate-50/50">
            <div>
              <span className="text-xs font-bold text-indigo-700 uppercase tracking-wider">
                Active Session &bull; {activeSession.sessionType}
              </span>
              <h3 className="text-base font-bold text-slate-900">{activeSession.topic}</h3>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => handleMarkAll('present')}
                className="py-1 px-3 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-lg text-xs font-semibold border border-emerald-200"
              >
                All Present
              </button>
              <button
                type="button"
                onClick={() => handleMarkAll('absent')}
                className="py-1 px-3 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-lg text-xs font-semibold border border-rose-200"
              >
                All Absent
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-wider font-semibold text-[11px]">
                <tr>
                  <th className="py-3 px-4">Student Name</th>
                  <th className="py-3 px-4">Institutional Email</th>
                  <th className="py-3 px-4 text-center">Status Selection</th>
                  <th className="py-3 px-4">Remarks (Optional)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {studentRoster.map(student => {
                  const currentStatus = recordsMap[student._id] || 'present';
                  return (
                    <tr key={student._id} className="hover:bg-slate-50/60 transition">
                      <td className="py-3 px-4 font-bold text-slate-800">{student.name}</td>
                      <td className="py-3 px-4 text-slate-500">{student.email}</td>
                      <td className="py-3 px-4 text-center">
                        <div className="inline-flex rounded-xl bg-slate-100 p-1 gap-1">
                          <button
                            type="button"
                            onClick={() => setStudentStatus(student._id, 'present')}
                            className={`px-3 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                              currentStatus === 'present'
                                ? 'bg-emerald-600 text-white shadow-xs'
                                : 'text-slate-600 hover:text-slate-900'
                            }`}
                          >
                            Present
                          </button>
                          <button
                            type="button"
                            onClick={() => setStudentStatus(student._id, 'absent')}
                            className={`px-3 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                              currentStatus === 'absent'
                                ? 'bg-rose-600 text-white shadow-xs'
                                : 'text-slate-600 hover:text-slate-900'
                            }`}
                          >
                            Absent
                          </button>
                          <button
                            type="button"
                            onClick={() => setStudentStatus(student._id, 'excused')}
                            className={`px-3 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                              currentStatus === 'excused'
                                ? 'bg-blue-600 text-white shadow-xs'
                                : 'text-slate-600 hover:text-slate-900'
                            }`}
                          >
                            Excused
                          </button>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <input
                          type="text"
                          placeholder="e.g. Sports duty or medical leave"
                          value={remarksMap[student._id] || ''}
                          onChange={(e) => setRemarksMap({ ...remarksMap, [student._id]: e.target.value })}
                          className="w-full px-2.5 py-1 text-xs border border-slate-200 rounded-lg outline-none"
                        />
                      </td>
                    </tr>
                  );
                })}

                {studentRoster.length === 0 && (
                  <tr>
                    <td colSpan="4" className="py-8 text-center text-slate-400">
                      No students are currently enrolled in this course section.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
            <button
              type="button"
              onClick={() => setActiveSession(null)}
              className="py-2 px-4 bg-white border border-slate-300 text-slate-700 font-semibold rounded-xl text-xs hover:bg-slate-100"
            >
              Cancel Roll Call
            </button>

            <button
              type="button"
              disabled={saving || studentRoster.length === 0}
              onClick={handleSubmitAttendance}
              className="py-2.5 px-6 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl text-xs shadow-sm transition disabled:opacity-50 flex items-center gap-2 cursor-pointer"
            >
              {saving ? 'Recording to MongoDB...' : <><Save className="w-4 h-4" /> Save & Finalize Attendance</>}
            </button>
          </div>
        </div>
      )}

      {/* Past Class Sessions Log */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <History className="w-5 h-5 text-indigo-600" />
            <h3 className="text-base font-bold text-slate-900">Historical Session Log</h3>
          </div>
          <span className="text-xs text-slate-400">{pastSessions.length} Completed Sessions</span>
        </div>

        <div className="divide-y divide-slate-100">
          {pastSessions.map(session => (
            <div key={session._id} className="p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 text-xs">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-[10px] font-bold uppercase bg-slate-100 text-slate-700 px-2 py-0.5 rounded">
                    {session.sessionType}
                  </span>
                  <span className="text-slate-400">&bull; {new Date(session.date).toLocaleDateString()}</span>
                </div>
                <h4 className="font-bold text-slate-900 text-sm">{session.topic}</h4>
              </div>

              <div className="flex items-center gap-4">
                <div className="flex items-center gap-3 font-semibold text-slate-700">
                  <span className="text-emerald-600">Present: {session.presentCount}</span>
                  <span className="text-rose-600">Absent: {session.absentCount}</span>
                  <span className="text-blue-600">Excused: {session.excusedCount}</span>
                </div>
              </div>
            </div>
          ))}

          {pastSessions.length === 0 && (
            <div className="p-8 text-center text-slate-400 text-xs">
              No historical sessions logged for this course yet.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
