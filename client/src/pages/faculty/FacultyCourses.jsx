import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import toast from 'react-hot-toast';
import {
  BookOpen,
  Upload,
  FileText,
  Clock,
  Sparkles,
  CheckCircle2,
  X
} from 'lucide-react';

export default function FacultyCourses() {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);

  // Upload modal state
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [selectedCourseId, setSelectedCourseId] = useState('');
  const [materialTitle, setMaterialTitle] = useState('');
  const [materialDescription, setMaterialDescription] = useState('');
  const [tags, setTags] = useState('lecture, notes');
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);

  const fetchCourses = async () => {
    try {
      const res = await api.get('/courses/my/assigned');
      if (res.data.success) {
        setCourses(res.data.data);
        if (res.data.data.length > 0 && !selectedCourseId) {
          setSelectedCourseId(res.data.data[0]._id);
        }
      }
    } catch (err) {
      console.error('Failed to load assigned courses:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCourses();
  }, []);

  const handleUploadMaterial = async (e) => {
    e.preventDefault();
    if (!file) {
      toast.error('Please select a PDF or document file to upload.');
      return;
    }

    setUploading(true);
    const formData = new FormData();
    formData.append('courseId', selectedCourseId);
    formData.append('title', materialTitle || file.name);
    formData.append('description', materialDescription);
    formData.append('tags', tags);
    formData.append('document', file);

    try {
      const res = await api.post('/study-materials', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      if (res.data.success) {
        toast.success(res.data.message);
        setShowUploadModal(false);
        setMaterialTitle('');
        setMaterialDescription('');
        setFile(null);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to upload study notes');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Course Offerings & Study Materials</h1>
          <p className="text-xs text-slate-500 mt-1">
            Manage course curriculum and upload lecture materials indexed into AI RAG memory
          </p>
        </div>

        <button
          onClick={() => setShowUploadModal(true)}
          className="inline-flex items-center gap-2 py-2.5 px-4 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-xl text-xs transition shadow-sm cursor-pointer"
        >
          <Upload className="w-4 h-4" /> Upload Course Notes (PDF)
        </button>
      </div>

      {loading ? (
        <div className="py-20 text-center text-slate-400 text-sm">Loading assigned courses...</div>
      ) : courses.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center text-slate-500">
          <BookOpen className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-800">No courses assigned</h3>
          <p className="text-xs text-slate-400 mt-1">Contact your department head to allocate teaching courses.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {courses.map(course => (
            <div
              key={course._id}
              className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 border border-indigo-100">
                    {course.code}
                  </span>
                  <span className="text-xs text-slate-400 font-semibold">{course.credits} Credits</span>
                </div>

                <h3 className="text-base font-bold text-slate-900 mb-2">{course.name}</h3>
                <p className="text-xs text-slate-500 line-clamp-3 mb-4 leading-relaxed">
                  {course.description || 'Core instructional syllabus and laboratory modules.'}
                </p>

                <div className="p-3 bg-slate-50 border border-slate-100 rounded-xl space-y-1.5 text-xs text-slate-600 mb-4">
                  <div className="flex justify-between">
                    <span>Enrolled Roster:</span>
                    <strong className="text-slate-900">{course.studentCount || 0} Students</strong>
                  </div>
                  <div className="flex justify-between">
                    <span>Semester:</span>
                    <strong className="text-slate-900">Term {course.semester}</strong>
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 flex items-center gap-2">
                <button
                  onClick={() => { setSelectedCourseId(course._id); setShowUploadModal(true); }}
                  className="w-full py-2 px-3 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5"
                >
                  <Upload className="w-3.5 h-3.5" /> Upload Notes
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Upload Study Notes Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-indigo-600" />
                <h3 className="text-base font-bold text-slate-900">Upload Course Material</h3>
              </div>
              <button
                onClick={() => setShowUploadModal(false)}
                className="p-1 rounded-full text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-3 bg-indigo-50/80 border border-indigo-200 rounded-xl text-xs text-indigo-900 mb-4 flex items-start gap-2">
              <Sparkles className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
              <span>
                <strong>Automated RAG Ingestion:</strong> Uploaded PDF files are parsed, sanitized, chunked, and vectorized so students can query topics using the AI Study Assistant.
              </span>
            </div>

            <form onSubmit={handleUploadMaterial} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Select Course *</label>
                <select
                  value={selectedCourseId}
                  onChange={(e) => setSelectedCourseId(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none bg-white font-medium"
                >
                  {courses.map(c => (
                    <option key={c._id} value={c._id}>{c.code} - {c.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Title / Chapter Name *</label>
                <input
                  type="text"
                  required
                  value={materialTitle}
                  onChange={(e) => setMaterialTitle(e.target.value)}
                  placeholder="e.g. Module 3: Advanced Graph Theory & Network Flows"
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Description / Summary</label>
                <textarea
                  rows={2}
                  value={materialDescription}
                  onChange={(e) => setMaterialDescription(e.target.value)}
                  placeholder="Summary of algorithms and proofs discussed in this unit..."
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                ></textarea>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Select File (PDF or Document) *</label>
                <input
                  type="file"
                  required
                  accept=".pdf,.txt,.doc,.docx"
                  onChange={(e) => setFile(e.target.files[0])}
                  className="w-full text-xs text-slate-500 file:mr-3 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100 cursor-pointer"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowUploadModal(false)}
                  className="py-2 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={uploading}
                  className="py-2.5 px-5 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-xl text-xs transition disabled:opacity-50 flex items-center gap-1.5"
                >
                  {uploading ? 'Parsing & Indexing...' : 'Upload & Process Chunks'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
