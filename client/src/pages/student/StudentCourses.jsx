import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import {
  BookOpen,
  FileText,
  Clock,
  User,
  Download,
  Bot,
  Search,
  Calendar,
  X
} from 'lucide-react';

export default function StudentCourses() {
  const [courses, setCourses] = useState([]);
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [courseDetails, setCourseDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [search, setSearch] = useState('');

  useEffect(() => {
    async function fetchEnrolledCourses() {
      try {
        const res = await api.get('/courses/my/enrolled');
        if (res.data.success) {
          setCourses(res.data.data);
        }
      } catch (err) {
        console.error('Failed to load enrolled courses:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchEnrolledCourses();
  }, []);

  const openCourseModal = async (course) => {
    setSelectedCourse(course);
    setDetailsLoading(true);
    try {
      const res = await api.get(`/courses/${course._id}`);
      if (res.data.success) {
        setCourseDetails(res.data.data);
      }
    } catch (err) {
      console.error('Failed to load course details:', err);
    } finally {
      setDetailsLoading(false);
    }
  };

  const filteredCourses = courses.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.code.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Enrolled Courses</h1>
          <p className="text-xs text-slate-500 mt-1">
            Access your course lectures, syllabus outlines, and downloaded notes
          </p>
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search by code or title..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
          />
        </div>
      </div>

      {loading ? (
        <div className="py-20 text-center text-slate-400 text-sm">Loading enrolled courses...</div>
      ) : filteredCourses.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center text-slate-500">
          <BookOpen className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-800">No matching enrolled courses</h3>
          <p className="text-xs text-slate-400 mt-1">You are not enrolled in courses matching your search query.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCourses.map(course => (
            <div
              key={course._id}
              className="bg-white rounded-2xl border border-slate-200 shadow-xs hover:shadow-md transition flex flex-col justify-between overflow-hidden"
            >
              <div className="p-6">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 border border-indigo-100">
                    {course.code}
                  </span>
                  <span className="text-xs font-semibold text-slate-400">
                    {course.credits} Credits
                  </span>
                </div>

                <h3 className="text-base font-bold text-slate-900 mb-2 line-clamp-1">{course.name}</h3>
                <p className="text-xs text-slate-500 line-clamp-2 mb-4 leading-relaxed">
                  {course.description || 'Core departmental coursework and laboratory curriculum.'}
                </p>

                <div className="space-y-1.5 pt-3 border-t border-slate-100 text-xs text-slate-600">
                  <div className="flex items-center gap-2">
                    <User className="w-3.5 h-3.5 text-slate-400" />
                    <span>Faculty: {course.faculty?.map(f => f.name).join(', ') || 'Department Faculty'}</span>
                  </div>
                  {course.schedule?.[0] && (
                    <div className="flex items-center gap-2">
                      <Clock className="w-3.5 h-3.5 text-slate-400" />
                      <span>{course.schedule[0].day} &bull; {course.schedule[0].startTime} ({course.schedule[0].room})</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
                <button
                  onClick={() => openCourseModal(course)}
                  className="text-xs font-bold text-indigo-600 hover:text-indigo-800 cursor-pointer"
                >
                  View Syllabus & Files &rarr;
                </button>
                <Link
                  to={`/student/study-assistant?courseId=${course._id}`}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-white hover:bg-slate-100 border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 transition"
                  title="Ask questions using course notes"
                >
                  <Bot className="w-3.5 h-3.5 text-indigo-600" /> AI Tutor
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Course Detail Modal */}
      {selectedCourse && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6 sm:p-8 shadow-xl">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-indigo-600">
                  {selectedCourse.code} &bull; {selectedCourse.credits} Credits
                </span>
                <h2 className="text-xl font-bold text-slate-900">{selectedCourse.name}</h2>
              </div>
              <button
                onClick={() => { setSelectedCourse(null); setCourseDetails(null); }}
                className="p-1 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {detailsLoading ? (
              <div className="py-12 text-center text-slate-400 text-xs">Loading materials and syllabus...</div>
            ) : (
              <div className="py-5 space-y-6">
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">Description</h4>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    {courseDetails?.course?.description || selectedCourse.description}
                  </p>
                </div>

                {courseDetails?.course?.syllabus && (
                  <div>
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">Syllabus Outline</h4>
                    <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 whitespace-pre-line font-mono">
                      {courseDetails.course.syllabus}
                    </div>
                  </div>
                )}

                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                    Course Lecture Notes & Files ({courseDetails?.studyMaterials?.length || 0})
                  </h4>
                  <div className="space-y-2">
                    {(courseDetails?.studyMaterials || []).map(mat => (
                      <div
                        key={mat._id}
                        className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between text-xs"
                      >
                        <div className="flex items-center gap-2.5">
                          <FileText className="w-4 h-4 text-indigo-600" />
                          <div>
                            <span className="font-semibold text-slate-800 block">{mat.title}</span>
                            <span className="text-[11px] text-slate-400">Uploaded by {mat.uploadedBy?.name || 'Faculty'}</span>
                          </div>
                        </div>

                        <a
                          href={mat.fileUrl}
                          target="_blank"
                          rel="noreferrer"
                          download
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 font-semibold rounded-lg text-xs"
                        >
                          <Download className="w-3.5 h-3.5" /> Download
                        </a>
                      </div>
                    ))}

                    {(!courseDetails?.studyMaterials || courseDetails.studyMaterials.length === 0) && (
                      <p className="text-xs text-slate-400">No documents uploaded for this course yet.</p>
                    )}
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-100 flex justify-end">
                  <Link
                    to={`/student/study-assistant?courseId=${selectedCourse._id}`}
                    className="inline-flex items-center gap-2 py-2 px-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold transition"
                  >
                    <Bot className="w-4 h-4" /> Open in AI Study Assistant
                  </Link>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
