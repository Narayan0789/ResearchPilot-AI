import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import toast from 'react-hot-toast';
import {
  FileText,
  PlusCircle,
  Clock,
  Award,
  CheckCircle2,
  Download,
  X,
  Send,
  Eye,
  Users
} from 'lucide-react';

export default function FacultyAssignments() {
  const [courses, setCourses] = useState([]);
  const [selectedCourseId, setSelectedCourseId] = useState('');
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);

  // New assignment modal
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [maxMarks, setMaxMarks] = useState(50);
  const [allowLate, setAllowLate] = useState(false);
  const [attachment, setAttachment] = useState(null);
  const [creating, setCreating] = useState(false);

  // Submissions review modal
  const [viewingAssignment, setViewingAssignment] = useState(null);
  const [submissions, setSubmissions] = useState([]);
  const [selectedSubmission, setSelectedSubmission] = useState(null);
  const [gradingMarks, setGradingMarks] = useState('');
  const [gradingFeedback, setGradingFeedback] = useState('');
  const [submittingGrade, setSubmittingGrade] = useState(false);

  useEffect(() => {
    async function init() {
      try {
        const res = await api.get('/courses/my/assigned');
        if (res.data.success && res.data.data.length > 0) {
          setCourses(res.data.data);
          const firstId = res.data.data[0]._id;
          setSelectedCourseId(firstId);
          loadCourseAssignments(firstId);
        }
      } catch (err) {
        console.error('Failed to load courses:', err);
      } finally {
        setLoading(false);
      }
    }
    init();
  }, []);

  const loadCourseAssignments = async (courseId) => {
    try {
      const res = await api.get(`/assignments/course/${courseId}`);
      if (res.data.success) {
        setAssignments(res.data.data);
      }
    } catch (err) {
      console.error('Failed to load assignments:', err);
    }
  };

  const handleCourseChange = (id) => {
    setSelectedCourseId(id);
    loadCourseAssignments(id);
  };

  const handleCreateAssignment = async (e) => {
    e.preventDefault();
    setCreating(true);

    const formData = new FormData();
    formData.append('courseId', selectedCourseId);
    formData.append('title', title);
    formData.append('description', description);
    formData.append('dueDate', dueDate);
    formData.append('maxMarks', maxMarks);
    formData.append('allowLateSubmissions', allowLate);
    if (attachment) {
      formData.append('attachment', attachment);
    }

    try {
      const res = await api.post('/assignments', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      if (res.data.success) {
        toast.success('Assignment created and students notified!');
        setShowCreateModal(false);
        setTitle('');
        setDescription('');
        setDueDate('');
        setAttachment(null);
        loadCourseAssignments(selectedCourseId);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create assignment');
    } finally {
      setCreating(false);
    }
  };

  const handleViewSubmissions = async (assignment) => {
    setViewingAssignment(assignment);
    try {
      const res = await api.get(`/assignments/${assignment._id}/submissions`);
      if (res.data.success) {
        setSubmissions(res.data.data.submissions);
      }
    } catch (err) {
      toast.error('Failed to load submissions.');
    }
  };

  const handleGradeSubmission = async (e) => {
    e.preventDefault();
    if (!selectedSubmission) return;
    setSubmittingGrade(true);

    try {
      const res = await api.post(`/assignments/submissions/${selectedSubmission._id}/grade`, {
        marksObtained: Number(gradingMarks),
        feedback: gradingFeedback
      });

      if (res.data.success) {
        toast.success('Grade recorded and student notified!');
        setSelectedSubmission(null);
        // Refresh submissions
        handleViewSubmissions(viewingAssignment);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Grading failed');
    } finally {
      setSubmittingGrade(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Assignment Management & Grading</h1>
          <p className="text-xs text-slate-500 mt-1">
            Publish coursework deliverables, collect student file submissions, and record grades
          </p>
        </div>

        <div className="flex items-center gap-3">
          {courses.length > 0 && (
            <select
              value={selectedCourseId}
              onChange={(e) => handleCourseChange(e.target.value)}
              className="px-3 py-1.5 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none bg-white font-medium"
            >
              {courses.map(c => (
                <option key={c._id} value={c._id}>{c.code} - {c.name}</option>
              ))}
            </select>
          )}

          <button
            onClick={() => setShowCreateModal(true)}
            className="inline-flex items-center gap-2 py-2 px-4 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-xl text-xs transition shadow-sm cursor-pointer"
          >
            <PlusCircle className="w-4 h-4" /> Create Assignment
          </button>
        </div>
      </div>

      {loading ? (
        <div className="py-20 text-center text-slate-400 text-sm">Loading assignments...</div>
      ) : assignments.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center text-slate-500">
          <FileText className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-800">No assignments created</h3>
          <p className="text-xs text-slate-400 mt-1">Click Create Assignment to post deliverables for this class.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {assignments.map(a => (
            <div key={a._id} className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 border border-indigo-100">
                    Max Marks: {a.maxMarks}
                  </span>
                  <span className="text-xs text-slate-400 font-semibold">
                    {a.allowLateSubmissions ? 'Late Allowed' : 'Strict Deadline'}
                  </span>
                </div>

                <h3 className="text-base font-bold text-slate-900 mb-1">{a.title}</h3>
                <p className="text-xs text-slate-500 line-clamp-3 mb-4 leading-relaxed">{a.description}</p>

                <div className="flex items-center gap-2 text-xs text-slate-500 mb-4">
                  <Clock className="w-3.5 h-3.5 text-slate-400" />
                  <span>Deadline: {new Date(a.dueDate).toLocaleDateString()}</span>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                <button
                  onClick={() => handleViewSubmissions(a)}
                  className="w-full py-2 px-3 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 transition cursor-pointer"
                >
                  <Users className="w-3.5 h-3.5" /> View Submissions & Grade
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Assignment Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <h3 className="text-base font-bold text-slate-900">Create New Assignment</h3>
              <button onClick={() => setShowCreateModal(false)} className="p-1 rounded-full text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateAssignment} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Title *</label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Implement Dijkstra's Algorithm in C++"
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Instructions / Description</label>
                <textarea
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Specify problem constraints, test benchmarks, and report deliverables..."
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                ></textarea>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Due Date & Time *</label>
                  <input
                    type="datetime-local"
                    required
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Max Marks *</label>
                  <input
                    type="number"
                    min="1"
                    max="1000"
                    value={maxMarks}
                    onChange={(e) => setMaxMarks(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="allowLate"
                  checked={allowLate}
                  onChange={(e) => setAllowLate(e.target.checked)}
                  className="w-4 h-4 text-indigo-600 rounded"
                />
                <label htmlFor="allowLate" className="text-xs text-slate-700 cursor-pointer">
                  Allow late submissions after deadline
                </label>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Attachment (Optional Prompt PDF/ZIP)</label>
                <input
                  type="file"
                  onChange={(e) => setAttachment(e.target.files[0])}
                  className="w-full text-xs text-slate-500 file:mr-3 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100 cursor-pointer"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="py-2 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creating}
                  className="py-2.5 px-5 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-xl text-xs transition disabled:opacity-50"
                >
                  {creating ? 'Publishing...' : 'Publish Assignment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Submissions Review Modal */}
      {viewingAssignment && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <div>
                <span className="text-xs font-bold text-indigo-600">Submissions Queue</span>
                <h3 className="text-base font-bold text-slate-900">{viewingAssignment.title}</h3>
              </div>
              <button onClick={() => setViewingAssignment(null)} className="p-1 rounded-full text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 mb-6">
              {submissions.map(sub => (
                <div key={sub._id} className="p-4 rounded-xl border border-slate-200 bg-slate-50/60 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 text-xs">
                  <div>
                    <span className="font-bold text-slate-900 block">{sub.student?.name}</span>
                    <span className="text-slate-400">{sub.student?.email} &bull; Submitted {new Date(sub.submittedAt).toLocaleDateString()}</span>
                    {sub.isLate && <span className="text-rose-500 font-bold ml-1">(Late)</span>}
                  </div>

                  <div className="flex items-center gap-2">
                    {sub.fileUrl && (
                      <a
                        href={sub.fileUrl}
                        target="_blank"
                        rel="noreferrer"
                        download
                        className="py-1 px-2.5 bg-white border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 hover:bg-slate-100 flex items-center gap-1"
                      >
                        <Download className="w-3 h-3" /> File
                      </a>
                    )}

                    {sub.status === 'graded' ? (
                      <span className="px-2.5 py-1 bg-emerald-100 text-emerald-800 font-bold rounded-lg text-xs">
                        Graded: {sub.marksObtained}/{viewingAssignment.maxMarks}
                      </span>
                    ) : (
                      <button
                        onClick={() => {
                          setSelectedSubmission(sub);
                          setGradingMarks(sub.marksObtained ?? '');
                          setGradingFeedback(sub.feedback || '');
                        }}
                        className="py-1 px-3 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-lg text-xs"
                      >
                        Grade
                      </button>
                    )}
                  </div>
                </div>
              ))}

              {submissions.length === 0 && (
                <p className="text-xs text-slate-400 py-6 text-center">No student submissions recorded yet.</p>
              )}
            </div>

            {/* In-modal grading box */}
            {selectedSubmission && (
              <form onSubmit={handleGradeSubmission} className="p-4 rounded-2xl bg-indigo-50 border border-indigo-200 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-indigo-900">
                    Grading: {selectedSubmission.student?.name}
                  </h4>
                  <button type="button" onClick={() => setSelectedSubmission(null)} className="text-slate-400 text-xs hover:underline">
                    Cancel
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                      Marks (Max {viewingAssignment.maxMarks}) *
                    </label>
                    <input
                      type="number"
                      required
                      min="0"
                      max={viewingAssignment.maxMarks}
                      value={gradingMarks}
                      onChange={(e) => setGradingMarks(e.target.value)}
                      className="w-full px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-1">Feedback Rubric</label>
                    <input
                      type="text"
                      value={gradingFeedback}
                      onChange={(e) => setGradingFeedback(e.target.value)}
                      placeholder="e.g. Excellent complexity analysis."
                      className="w-full px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg outline-none"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={submittingGrade}
                  className="w-full py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl text-xs transition disabled:opacity-50"
                >
                  {submittingGrade ? 'Recording...' : 'Save & Publish Grade to Student'}
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
