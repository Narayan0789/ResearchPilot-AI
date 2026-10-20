import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import toast from 'react-hot-toast';
import {
  FileText,
  Clock,
  CheckCircle2,
  AlertCircle,
  Upload,
  Download,
  X,
  Award,
  Send
} from 'lucide-react';

export default function StudentAssignments() {
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedAssignment, setSelectedAssignment] = useState(null);
  const [submissionText, setSubmissionText] = useState('');
  const [file, setFile] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState('all'); // 'all', 'pending', 'submitted', 'graded'

  const fetchAssignments = async () => {
    try {
      const res = await api.get('/assignments/my-assignments');
      if (res.data.success) {
        setAssignments(res.data.data);
      }
    } catch (err) {
      console.error('Failed to load assignments:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAssignments();
  }, []);

  const handleSubmitAssignment = async (e) => {
    e.preventDefault();
    if (!submissionText && !file) {
      toast.error('Please enter your response or attach a solution file.');
      return;
    }

    setIsSubmitting(true);
    const formData = new FormData();
    formData.append('submissionText', submissionText);
    if (file) {
      formData.append('submissionFile', file);
    }

    try {
      const res = await api.post(`/assignments/${selectedAssignment._id}/submit`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      if (res.data.success) {
        toast.success(res.data.message);
        setSelectedAssignment(null);
        setSubmissionText('');
        setFile(null);
        fetchAssignments();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Submission failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredAssignments = assignments.filter(a => {
    if (activeTab === 'pending') return a.computedStatus === 'pending' || a.computedStatus === 'overdue';
    if (activeTab === 'submitted') return a.computedStatus === 'submitted';
    if (activeTab === 'graded') return a.computedStatus === 'graded';
    return true;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Assignments & Deliverables</h1>
          <p className="text-xs text-slate-500 mt-1">
            Submit coursework, track evaluation grades, and review faculty rubrics
          </p>
        </div>

        <div className="flex items-center gap-1.5 p-1 bg-slate-200/60 rounded-xl">
          {['all', 'pending', 'submitted', 'graded'].map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold capitalize transition ${
                activeTab === tab
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="py-20 text-center text-slate-400 text-sm">Loading assignments...</div>
      ) : filteredAssignments.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center text-slate-500">
          <FileText className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-800">No assignments found</h3>
          <p className="text-xs text-slate-400 mt-1">There are no assignments in this category.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredAssignments.map(a => {
            const isOverdue = a.computedStatus === 'overdue';
            const isGraded = a.computedStatus === 'graded';
            const isSubmitted = a.computedStatus === 'submitted';

            return (
              <div
                key={a._id}
                className="bg-white rounded-2xl border border-slate-200 shadow-xs hover:shadow-md transition flex flex-col justify-between p-6"
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 border border-indigo-100">
                      {a.course?.code}
                    </span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      isGraded ? 'bg-emerald-100 text-emerald-700' :
                      isSubmitted ? 'bg-blue-100 text-blue-700' :
                      isOverdue ? 'bg-rose-100 text-rose-700' :
                      'bg-amber-100 text-amber-700'
                    }`}>
                      {a.computedStatus.toUpperCase()}
                    </span>
                  </div>

                  <h3 className="text-base font-bold text-slate-900 mb-1 line-clamp-1">{a.title}</h3>
                  <p className="text-xs text-slate-500 line-clamp-2 mb-4 leading-relaxed">{a.description}</p>

                  <div className="space-y-1.5 text-xs text-slate-500 mb-4">
                    <div className="flex items-center gap-2">
                      <Clock className="w-3.5 h-3.5 text-slate-400" />
                      <span>Due: {new Date(a.dueDate).toLocaleString()}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Award className="w-3.5 h-3.5 text-slate-400" />
                      <span>Max Marks: {a.maxMarks}</span>
                    </div>
                  </div>

                  {/* If Graded: Show Marks & Feedback */}
                  {isGraded && (
                    <div className="p-3 bg-emerald-50/80 border border-emerald-200 rounded-xl mb-4 text-xs">
                      <div className="flex items-center justify-between font-bold text-emerald-800 mb-1">
                        <span>Score Awarded:</span>
                        <span>{a.submission?.marksObtained} / {a.maxMarks}</span>
                      </div>
                      {a.submission?.feedback && (
                        <p className="text-emerald-700 text-[11px] mt-1 italic">
                          "{a.submission.feedback}"
                        </p>
                      )}
                    </div>
                  )}
                </div>

                <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                  {isGraded || isSubmitted ? (
                    <button
                      onClick={() => setSelectedAssignment(a)}
                      className="text-xs font-semibold text-slate-600 hover:text-slate-900 underline"
                    >
                      View Your Submission
                    </button>
                  ) : (
                    <button
                      onClick={() => { setSelectedAssignment(a); setSubmissionText(''); setFile(null); }}
                      className="w-full py-2 px-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold transition flex items-center justify-center gap-1.5"
                    >
                      <Upload className="w-3.5 h-3.5" /> Submit Solution
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Submission Modal */}
      {selectedAssignment && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-4">
              <div>
                <span className="text-xs font-bold text-indigo-600">{selectedAssignment.course?.code}</span>
                <h3 className="text-lg font-bold text-slate-900">{selectedAssignment.title}</h3>
              </div>
              <button
                onClick={() => setSelectedAssignment(null)}
                className="p-1 rounded-full text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Read-only if already submitted/graded */}
            {selectedAssignment.submission ? (
              <div className="space-y-4">
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs">
                  <span className="font-semibold text-slate-700 block mb-1">Your Submitted Response:</span>
                  <p className="text-slate-600 whitespace-pre-wrap">{selectedAssignment.submission.submissionText || 'No text content.'}</p>
                </div>

                {selectedAssignment.submission.fileUrl && (
                  <div className="flex items-center justify-between p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs">
                    <span className="text-slate-700 font-medium truncate">{selectedAssignment.submission.fileName || 'Solution Attachment'}</span>
                    <a
                      href={selectedAssignment.submission.fileUrl}
                      target="_blank"
                      rel="noreferrer"
                      download
                      className="text-indigo-600 font-bold hover:underline inline-flex items-center gap-1"
                    >
                      <Download className="w-3.5 h-3.5" /> Download
                    </a>
                  </div>
                )}

                <div className="text-[11px] text-slate-400">
                  Submitted at: {new Date(selectedAssignment.submission.submittedAt).toLocaleString()}
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmitAssignment} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Written Solution / Notes
                  </label>
                  <textarea
                    rows={4}
                    value={submissionText}
                    onChange={(e) => setSubmissionText(e.target.value)}
                    placeholder="Enter written answer or explain your submission..."
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                  ></textarea>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Upload Solution Attachment (PDF, ZIP, DOCX, TXT)
                  </label>
                  <input
                    type="file"
                    onChange={(e) => setFile(e.target.files[0])}
                    className="w-full text-xs text-slate-500 file:mr-3 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100 cursor-pointer"
                  />
                </div>

                <div className="pt-2 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setSelectedAssignment(null)}
                    className="py-2 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl text-xs"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="py-2 px-5 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-xl text-xs transition disabled:opacity-60 flex items-center gap-1.5"
                  >
                    {isSubmitting ? 'Uploading...' : <><Send className="w-3.5 h-3.5" /> Submit Assignment</>}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
