import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import toast from 'react-hot-toast';
import {
  Award,
  PlusCircle,
  Clock,
  HelpCircle,
  CheckCircle2,
  Trash2,
  X,
  Plus,
  Send
} from 'lucide-react';

export default function FacultyAssessments() {
  const [courses, setCourses] = useState([]);
  const [selectedCourseId, setSelectedCourseId] = useState('');
  const [assessments, setAssessments] = useState([]);
  const [loading, setLoading] = useState(true);

  // New assessment builder modal
  const [showBuilderModal, setShowBuilderModal] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [durationMinutes, setDurationMinutes] = useState(25);
  const [passingMarks, setPassingMarks] = useState(2);
  const [questions, setQuestions] = useState([
    {
      questionText: 'What is the balance factor constraint in an AVL tree node?',
      options: ['[-1, 0, +1]', '[-2, 0, +2]', '[0, 1, 2]', 'Any arbitrary integer'],
      correctOptionIndex: 0,
      marks: 1,
      explanation: 'AVL trees strictly maintain node height balance factors strictly between -1, 0, and +1.'
    }
  ]);
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    async function init() {
      try {
        const res = await api.get('/courses/my/assigned');
        if (res.data.success && res.data.data.length > 0) {
          setCourses(res.data.data);
          const firstId = res.data.data[0]._id;
          setSelectedCourseId(firstId);
          loadAssessments(firstId);
        }
      } catch (err) {
        console.error('Failed to load courses:', err);
      } finally {
        setLoading(false);
      }
    }
    init();
  }, []);

  const loadAssessments = async (courseId) => {
    try {
      const res = await api.get(`/assessments/course/${courseId}`);
      if (res.data.success) {
        setAssessments(res.data.data);
      }
    } catch (err) {
      console.error('Failed to load assessments:', err);
    }
  };

  const handleCourseChange = (id) => {
    setSelectedCourseId(id);
    loadAssessments(id);
  };

  const addQuestion = () => {
    setQuestions([
      ...questions,
      {
        questionText: '',
        options: ['', '', '', ''],
        correctOptionIndex: 0,
        marks: 1,
        explanation: ''
      }
    ]);
  };

  const updateQuestionField = (idx, field, value) => {
    const updated = [...questions];
    updated[idx][field] = value;
    setQuestions(updated);
  };

  const updateOptionText = (qIdx, optIdx, text) => {
    const updated = [...questions];
    updated[qIdx].options[optIdx] = text;
    setQuestions(updated);
  };

  const removeQuestion = (idx) => {
    if (questions.length <= 1) {
      toast.error('At least one question is required.');
      return;
    }
    setQuestions(questions.filter((_, i) => i !== idx));
  };

  const handleCreateAssessment = async (e) => {
    e.preventDefault();
    if (questions.some(q => !q.questionText.trim() || q.options.some(o => !o.trim()))) {
      toast.error('Please fill in all question prompts and option choices.');
      return;
    }

    setCreating(true);
    try {
      const res = await api.post('/assessments', {
        courseId: selectedCourseId,
        title,
        description,
        durationMinutes: Number(durationMinutes),
        passingMarks: Number(passingMarks),
        questions,
        publishStatus: 'published'
      });

      if (res.data.success) {
        toast.success('Assessment published! Enrolled students notified.');
        setShowBuilderModal(false);
        setTitle('');
        setDescription('');
        loadAssessments(selectedCourseId);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create assessment');
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Quiz & Assessment Builder</h1>
          <p className="text-xs text-slate-500 mt-1">
            Build timed multiple-choice assessments with automated server-side grading and explanations
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
            onClick={() => setShowBuilderModal(true)}
            className="inline-flex items-center gap-2 py-2 px-4 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-xl text-xs transition shadow-sm cursor-pointer"
          >
            <PlusCircle className="w-4 h-4" /> Create New Quiz
          </button>
        </div>
      </div>

      {loading ? (
        <div className="py-20 text-center text-slate-400 text-sm">Loading course quizzes...</div>
      ) : assessments.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center text-slate-500">
          <Award className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-800">No assessments created for this course</h3>
          <p className="text-xs text-slate-400 mt-1">Click Create New Quiz to build an online MCQ test.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {assessments.map(a => (
            <div key={a._id} className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 border border-indigo-100">
                    {a.totalMarks} Marks
                  </span>
                  <span className="text-xs text-slate-400 font-semibold">{a.durationMinutes} Mins</span>
                </div>

                <h3 className="text-base font-bold text-slate-900 mb-1">{a.title}</h3>
                <p className="text-xs text-slate-500 line-clamp-3 mb-4 leading-relaxed">{a.description}</p>

                <div className="space-y-1.5 text-xs text-slate-500 mb-4">
                  <div className="flex items-center gap-2">
                    <HelpCircle className="w-3.5 h-3.5 text-slate-400" />
                    <span>{a.questions?.length || 0} Questions configured</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                    <span>Passing Cutoff: {a.passingMarks} Marks</span>
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100">
                <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-1 rounded-md block text-center">
                  Active & Sealed for Student Attempts
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Quiz Builder Modal */}
      {showBuilderModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-3xl w-full p-6 sm:p-8 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <h3 className="text-base font-bold text-slate-900">MCQ Quiz Builder</h3>
              <button onClick={() => setShowBuilderModal(false)} className="p-1 rounded-full text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateAssessment} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Assessment Title *</label>
                  <input
                    type="text"
                    required
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g. Graph Algorithms Mastery Test"
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Time Limit (Mins) *</label>
                  <input
                    type="number"
                    min="5"
                    max="180"
                    value={durationMinutes}
                    onChange={(e) => setDurationMinutes(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Instructions</label>
                <input
                  type="text"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="e.g. Tests understanding of Dijkstra, Kruskal, and Prim algorithms."
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                />
              </div>

              {/* Questions Builder List */}
              <div className="space-y-4 pt-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                    Questions ({questions.length})
                  </span>
                  <button
                    type="button"
                    onClick={addQuestion}
                    className="text-xs text-indigo-600 font-bold hover:underline flex items-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" /> Add Question
                  </button>
                </div>

                {questions.map((q, qIdx) => (
                  <div key={qIdx} className="p-4 rounded-2xl border border-slate-200 bg-slate-50 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-800">Question {qIdx + 1}</span>
                      <button
                        type="button"
                        onClick={() => removeQuestion(qIdx)}
                        className="text-slate-400 hover:text-rose-500 p-1"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <input
                      type="text"
                      required
                      placeholder="Type question prompt..."
                      value={q.questionText}
                      onChange={(e) => updateQuestionField(qIdx, 'questionText', e.target.value)}
                      className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-xl outline-none"
                    />

                    {/* Options A, B, C, D */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {q.options.map((opt, oIdx) => (
                        <div key={oIdx} className="flex items-center gap-1.5">
                          <input
                            type="radio"
                            name={`correct-${qIdx}`}
                            checked={q.correctOptionIndex === oIdx}
                            onChange={() => updateQuestionField(qIdx, 'correctOptionIndex', oIdx)}
                            className="w-4 h-4 text-indigo-600 cursor-pointer"
                            title="Mark as correct answer"
                          />
                          <input
                            type="text"
                            required
                            placeholder={`Option ${String.fromCharCode(65 + oIdx)}`}
                            value={opt}
                            onChange={(e) => updateOptionText(qIdx, oIdx, e.target.value)}
                            className="flex-1 px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg outline-none"
                          />
                        </div>
                      ))}
                    </div>

                    <div>
                      <input
                        type="text"
                        placeholder="Explanation for why the correct option is right (shown post-submission)..."
                        value={q.explanation}
                        onChange={(e) => updateQuestionField(qIdx, 'explanation', e.target.value)}
                        className="w-full px-3 py-1.5 text-[11px] bg-white border border-slate-200 rounded-lg outline-none italic"
                      />
                    </div>
                  </div>
                ))}
              </div>

              <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowBuilderModal(false)}
                  className="py-2 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creating}
                  className="py-2.5 px-6 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl text-xs transition disabled:opacity-50"
                >
                  {creating ? 'Publishing...' : 'Publish Assessment to Students'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
