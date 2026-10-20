import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import toast from 'react-hot-toast';
import {
  Building2,
  BookOpen,
  PlusCircle,
  X,
  Users,
  Clock,
  Sparkles
} from 'lucide-react';

export default function AdminAcademics() {
  const [activeTab, setActiveTab] = useState('courses'); // 'courses' or 'departments'
  const [departments, setDepartments] = useState([]);
  const [courses, setCourses] = useState([]);
  const [facultyList, setFacultyList] = useState([]);
  const [loading, setLoading] = useState(true);

  // New Department Modal
  const [showDeptModal, setShowDeptModal] = useState(false);
  const [deptCode, setDeptCode] = useState('');
  const [deptName, setDeptName] = useState('');
  const [deptDesc, setDeptDesc] = useState('');

  // New Course Modal
  const [showCourseModal, setShowCourseModal] = useState(false);
  const [courseCode, setCourseCode] = useState('');
  const [courseName, setCourseName] = useState('');
  const [courseDept, setCourseDept] = useState('');
  const [courseSemester, setCourseSemester] = useState(1);
  const [courseCredits, setCourseCredits] = useState(3);
  const [courseDesc, setCourseDesc] = useState('');
  const [assignedFacultyId, setAssignedFacultyId] = useState('');

  const fetchData = async () => {
    try {
      const [deptRes, courseRes, facultyRes] = await Promise.all([
        api.get('/departments'),
        api.get('/courses'),
        api.get('/admin/users?role=faculty&status=active')
      ]);

      if (deptRes.data.success) {
        setDepartments(deptRes.data.data);
        if (deptRes.data.data.length > 0 && !courseDept) {
          setCourseDept(deptRes.data.data[0]._id);
        }
      }
      if (courseRes.data.success) {
        setCourses(courseRes.data.data);
      }
      if (facultyRes.data.success) {
        setFacultyList(facultyRes.data.data.users);
      }
    } catch (err) {
      console.error('Failed to load academic data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCreateDept = async (e) => {
    e.preventDefault();
    try {
      const res = await api.post('/departments', {
        code: deptCode,
        name: deptName,
        description: deptDesc
      });
      if (res.data.success) {
        toast.success('Department created successfully!');
        setShowDeptModal(false);
        setDeptCode('');
        setDeptName('');
        setDeptDesc('');
        fetchData();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create department');
    }
  };

  const handleCreateCourse = async (e) => {
    e.preventDefault();
    try {
      const res = await api.post('/courses', {
        code: courseCode,
        name: courseName,
        department: courseDept,
        semester: Number(courseSemester),
        credits: Number(courseCredits),
        description: courseDesc,
        faculty: assignedFacultyId ? [assignedFacultyId] : []
      });
      if (res.data.success) {
        toast.success('Course created and assigned successfully!');
        setShowCourseModal(false);
        setCourseCode('');
        setCourseName('');
        setCourseDesc('');
        fetchData();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create course');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Academic Structure & Courses</h1>
          <p className="text-xs text-slate-500 mt-1">
            Configure institutional departments, curriculum courses, and faculty assignments
          </p>
        </div>

        <div className="flex items-center gap-2">
          {activeTab === 'departments' ? (
            <button
              onClick={() => setShowDeptModal(true)}
              className="py-2 px-4 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-xl text-xs flex items-center gap-1.5 transition cursor-pointer"
            >
              <PlusCircle className="w-4 h-4" /> Add Department
            </button>
          ) : (
            <button
              onClick={() => setShowCourseModal(true)}
              className="py-2 px-4 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-xl text-xs flex items-center gap-1.5 transition cursor-pointer"
            >
              <PlusCircle className="w-4 h-4" /> Create Course
            </button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200">
        <button
          onClick={() => setActiveTab('courses')}
          className={`py-2 px-4 text-xs font-bold transition border-b-2 ${
            activeTab === 'courses'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          Courses Catalog ({courses.length})
        </button>
        <button
          onClick={() => setActiveTab('departments')}
          className={`py-2 px-4 text-xs font-bold transition border-b-2 ${
            activeTab === 'departments'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          Departments ({departments.length})
        </button>
      </div>

      {loading ? (
        <div className="py-20 text-center text-slate-400 text-sm">Loading curriculum catalog...</div>
      ) : activeTab === 'courses' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {courses.map(course => (
            <div key={course._id} className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 border border-indigo-100">
                    {course.code}
                  </span>
                  <span className="text-xs text-slate-400 font-semibold">{course.credits} Credits</span>
                </div>

                <h3 className="text-base font-bold text-slate-900 mb-1">{course.name}</h3>
                <span className="text-xs text-indigo-600 font-medium block mb-2">{course.department?.name}</span>
                <p className="text-xs text-slate-500 line-clamp-3 mb-4 leading-relaxed">{course.description}</p>
              </div>

              <div className="pt-3 border-t border-slate-100 text-xs text-slate-600 space-y-1">
                <div className="flex justify-between">
                  <span>Semester:</span>
                  <strong className="text-slate-800">{course.semester}</strong>
                </div>
                <div className="flex justify-between">
                  <span>Instructor:</span>
                  <strong className="text-slate-800">{course.faculty?.map(f => f.name).join(', ') || 'Unassigned'}</strong>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {departments.map(dept => (
            <div key={dept._id} className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs">
              <span className="text-xs font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-purple-50 text-purple-700 border border-purple-100">
                Code: {dept.code}
              </span>
              <h3 className="text-base font-bold text-slate-900 mt-2 mb-1">{dept.name}</h3>
              <p className="text-xs text-slate-500 leading-relaxed mb-4">{dept.description}</p>
              <div className="pt-3 border-t border-slate-100 text-xs text-slate-400">
                Status: <strong className="text-emerald-600">Active Department</strong>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Department Modal */}
      {showDeptModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <h3 className="text-base font-bold text-slate-900">Add Department</h3>
              <button onClick={() => setShowDeptModal(false)} className="p-1 rounded-full text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateDept} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Department Code *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. MECH, BIOTECH, ECE"
                  value={deptCode}
                  onChange={(e) => setDeptCode(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none uppercase"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Department Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Department of Mechanical Engineering"
                  value={deptName}
                  onChange={(e) => setDeptName(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Description</label>
                <textarea
                  rows={2}
                  placeholder="Department scope and degree offerings..."
                  value={deptDesc}
                  onChange={(e) => setDeptDesc(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                ></textarea>
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowDeptModal(false)}
                  className="py-2 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="py-2 px-5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl text-xs"
                >
                  Save Department
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Course Modal */}
      {showCourseModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <h3 className="text-base font-bold text-slate-900">Create New Course Offering</h3>
              <button onClick={() => setShowCourseModal(false)} className="p-1 rounded-full text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateCourse} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Course Code *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. CS401"
                    value={courseCode}
                    onChange={(e) => setCourseCode(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none uppercase"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Department *</label>
                  <select
                    value={courseDept}
                    onChange={(e) => setCourseDept(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none bg-white"
                  >
                    {departments.map(d => (
                      <option key={d._id} value={d._id}>{d.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Course Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Distributed Cloud Computing"
                  value={courseName}
                  onChange={(e) => setCourseName(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Semester *</label>
                  <input
                    type="number"
                    min="1"
                    max="12"
                    value={courseSemester}
                    onChange={(e) => setCourseSemester(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Credits *</label>
                  <input
                    type="number"
                    min="1"
                    max="10"
                    value={courseCredits}
                    onChange={(e) => setCourseCredits(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Assign Lead Faculty</label>
                <select
                  value={assignedFacultyId}
                  onChange={(e) => setAssignedFacultyId(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none bg-white"
                >
                  <option value="">Unassigned</option>
                  {facultyList.map(f => (
                    <option key={f._id} value={f._id}>{f.name} ({f.email})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Description</label>
                <textarea
                  rows={2}
                  placeholder="Course topics and practical competencies..."
                  value={courseDesc}
                  onChange={(e) => setCourseDesc(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                ></textarea>
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowCourseModal(false)}
                  className="py-2 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="py-2 px-5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl text-xs"
                >
                  Save Course
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
