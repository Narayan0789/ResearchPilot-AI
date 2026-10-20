import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import toast from 'react-hot-toast';
import {
  Award,
  Clock,
  CheckCircle2,
  XCircle,
  HelpCircle,
  Play,
  RotateCcw,
  AlertCircle,
  X,
  ChevronRight,
  ChevronLeft
} from 'lucide-react';

export default function StudentAssessments() {
  const [courses, setCourses] = useState([]);
  const [selectedCourseId, setSelectedCourseId] = useState('');
  const [assessments, setAssessments] = useState([]);
  const [loading, setLoading] = useState(true);

  // Active quiz taking state
  const [activeTest, setActiveTest] = useState(null); // Loaded test data
  const [currentQIndex, setCurrentQIndex] = useState(0);
  const [answers, setAnswers] = useState({}); // { questionIndex: selectedOptionIndex }
  const [timeLeft, setTimeLeft] = useState(0);
  const [testResult, setTestResult] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    async function fetchCourses() {
      try {
        const res = await api.get('/courses/my/enrolled');
        if (res.data.success && res.data.data.length > 0) {
          setCourses(res.data.data);
          setSelectedCourseId(res.data.data[0]._id);
        }
      } catch (err) {
        console.error('Failed to load courses:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchCourses();
  }, []);

  const fetchAssessments = async (courseId) => {
    if (!courseId) return;
    try {
      const res = await api.get(`/assessments/course/${courseId}`);
      if (res.data.success) {
        setAssessments(res.data.data);
      }
    } catch (err) {
      console.error('Failed to load assessments:', err);
    }
  };

  useEffect(() => {
    if (selectedCourseId) {
      fetchAssessments(selectedCourseId);
    }
  }, [selectedCourseId]);

  // Timer countdown hook
  useEffect(() => {
    if (!activeTest || testResult) return;
    if (timeLeft <= 0) {
      handleAutoSubmit();
      return;
    }
    const timer = setInterval(() => {
      setTimeLeft(prev => prev - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [activeTest, timeLeft, testResult]);

  const handleStartTest = async (assessmentId) => {
    try {
      const res = await api.get(`/assessments/${assessmentId}/take`);
      if (res.data.success) {
        setActiveTest(res.data.data);
        setCurrentQIndex(0);
        setAnswers({});
        setTestResult(null);
        setTimeLeft(res.data.data.durationMinutes * 60);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Cannot start assessment');
    }
  };

  const handleOptionSelect = (optionIndex) => {
    setAnswers(prev => ({
      ...prev,
      [currentQIndex]: optionIndex
    }));
  };

  const handleSubmitTest = async () => {
    if (!activeTest) return;
    setIsSubmitting(true);

    const answersPayload = Object.entries(answers).map(([qIdx, optIdx]) => ({
      questionIndex: Number(qIdx),
      selectedOptionIndex: Number(optIdx)
    }));

    try {
      const res = await api.post(`/assessments/${activeTest._id}/submit`, {
        answers: answersPayload,
        timeTakenSeconds: (activeTest.durationMinutes * 60) - timeLeft
      });
      if (res.data.success) {
        setTestResult(res.data.data);
        toast.success('Assessment submitted and evaluated!');
        fetchAssessments(selectedCourseId);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Submission failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAutoSubmit = () => {
    toast.error('Time limit reached! Submitting answers automatically.');
    handleSubmitTest();
  };

  const formatTimer = (secs) => {
    const mins = Math.floor(secs / 60);
    const remainder = secs % 60;
    return `${mins}:${remainder < 10 ? '0' : ''}${remainder}`;
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Quizzes & Assessments</h1>
          <p className="text-xs text-slate-500 mt-1">
            Attempt timed online assessments, check answer explanations, and track your grades
          </p>
        </div>

        {courses.length > 0 && (
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-slate-500">Course:</span>
            <select
              value={selectedCourseId}
              onChange={(e) => setSelectedCourseId(e.target.value)}
              className="px-3 py-1.5 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none bg-white font-medium"
            >
              {courses.map(c => (
                <option key={c._id} value={c._id}>
                  {c.code} - {c.name}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {loading ? (
        <div className="py-20 text-center text-slate-400 text-sm">Loading course assessments...</div>
      ) : assessments.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center text-slate-500">
          <Award className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-800">No assessments found for this course</h3>
          <p className="text-xs text-slate-400 mt-1">Your faculty has not published any quizzes yet.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {assessments.map(assessment => {
            const hasAttempted = assessment.hasAttempted;
            const attempt = assessment.attempt;

            return (
              <div
                key={assessment._id}
                className="bg-white rounded-2xl border border-slate-200 shadow-xs hover:shadow-md transition p-6 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 border border-indigo-100">
                      {assessment.totalMarks} Marks
                    </span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      hasAttempted ? (attempt?.passed ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700') : 'bg-blue-100 text-blue-700'
                    }`}>
                      {hasAttempted ? (attempt?.passed ? 'PASSED' : 'NEEDS RETAKE') : 'AVAILABLE'}
                    </span>
                  </div>

                  <h3 className="text-base font-bold text-slate-900 mb-1">{assessment.title}</h3>
                  <p className="text-xs text-slate-500 line-clamp-2 mb-4 leading-relaxed">{assessment.description}</p>

                  <div className="space-y-1.5 text-xs text-slate-500 mb-4">
                    <div className="flex items-center gap-2">
                      <Clock className="w-3.5 h-3.5 text-slate-400" />
                      <span>Duration: {assessment.durationMinutes} Minutes</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <HelpCircle className="w-3.5 h-3.5 text-slate-400" />
                      <span>{assessment.questions?.length || 0} Multiple-Choice Questions</span>
                    </div>
                  </div>

                  {hasAttempted && (
                    <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs space-y-1 mb-4">
                      <div className="flex justify-between font-bold text-slate-800">
                        <span>Your Score:</span>
                        <span>{attempt?.score} / {attempt?.totalMarks} ({attempt?.percentage}%)</span>
                      </div>
                      <div className="text-[11px] text-slate-400">
                        Completed on: {new Date(attempt?.submittedAt).toLocaleDateString()}
                      </div>
                    </div>
                  )}
                </div>

                <div className="pt-4 border-t border-slate-100">
                  {hasAttempted ? (
                    <div className="text-center py-2 text-xs font-semibold text-emerald-700 bg-emerald-50 rounded-xl border border-emerald-100">
                      Assessment Completed
                    </div>
                  ) : (
                    <button
                      onClick={() => handleStartTest(assessment._id)}
                      className="w-full py-2.5 px-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold transition flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <Play className="w-3.5 h-3.5" /> Start Assessment
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Interactive Assessment Modal (Taking Test or Viewing Review) */}
      {activeTest && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[95vh] overflow-y-auto p-6 sm:p-8 shadow-2xl flex flex-col justify-between">
            {testResult ? (
              /* Review Screen */
              <div className="space-y-6">
                <div className="text-center pb-4 border-b border-slate-100">
                  <div className={`w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-3 ${
                    testResult.attempt.passed ? 'bg-emerald-100 text-emerald-600' : 'bg-rose-100 text-rose-600'
                  }`}>
                    {testResult.attempt.passed ? <CheckCircle2 className="w-8 h-8" /> : <XCircle className="w-8 h-8" />}
                  </div>
                  <h2 className="text-2xl font-bold text-slate-900">
                    {testResult.attempt.passed ? 'Assessment Passed!' : 'Assessment Complete'}
                  </h2>
                  <p className="text-xs text-slate-500 mt-1">
                    You scored <strong>{testResult.attempt.score} out of {testResult.attempt.totalMarks}</strong> ({testResult.attempt.percentage}%)
                  </p>
                </div>

                {/* Question Review with Explanations */}
                <div className="space-y-4 max-h-96 overflow-y-auto pr-1">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">Detailed Answer Review</h4>
                  {testResult.questionsWithReview.map((q, idx) => (
                    <div
                      key={idx}
                      className={`p-4 rounded-2xl border text-xs ${
                        q.isCorrect ? 'bg-emerald-50/50 border-emerald-200' : 'bg-rose-50/50 border-rose-200'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2 mb-2 font-bold text-slate-900">
                        <span>Q{idx + 1}: {q.questionText}</span>
                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                          q.isCorrect ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                        }`}>
                          {q.isCorrect ? '+1 Mark' : '0 Marks'}
                        </span>
                      </div>

                      <div className="space-y-1 mb-2">
                        {q.options.map((opt, oIdx) => (
                          <div
                            key={oIdx}
                            className={`p-2 rounded-lg text-xs font-medium ${
                              oIdx === q.correctOptionIndex
                                ? 'bg-emerald-200/60 text-emerald-900 font-bold'
                                : oIdx === q.yourAnswer
                                ? 'bg-rose-200/60 text-rose-900'
                                : 'text-slate-600'
                            }`}
                          >
                            {String.fromCharCode(65 + oIdx)}. {opt}{' '}
                            {oIdx === q.correctOptionIndex && '✓ (Correct)'}
                            {oIdx === q.yourAnswer && oIdx !== q.correctOptionIndex && '✗ (Your answer)'}
                          </div>
                        ))}
                      </div>

                      {q.explanation && (
                        <div className="pt-2 border-t border-slate-200/60 text-[11px] text-slate-600">
                          <strong>Explanation:</strong> {q.explanation}
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                <div className="pt-4 border-t border-slate-100 flex justify-end">
                  <button
                    onClick={() => { setActiveTest(null); setTestResult(null); }}
                    className="py-2 px-5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold cursor-pointer"
                  >
                    Close Review
                  </button>
                </div>
              </div>
            ) : (
              /* Active Test Taking View */
              <div>
                {/* Header with Title and Timer */}
                <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-6">
                  <div>
                    <span className="text-xs font-bold text-indigo-600 uppercase tracking-wider">
                      Question {currentQIndex + 1} of {activeTest.questions.length}
                    </span>
                    <h3 className="text-lg font-bold text-slate-900">{activeTest.title}</h3>
                  </div>

                  <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-mono font-bold ${
                    timeLeft < 180 ? 'bg-rose-50 text-rose-600 border-rose-200 animate-pulse' : 'bg-slate-100 text-slate-700 border-slate-200'
                  }`}>
                    <Clock className="w-3.5 h-3.5" />
                    <span>{formatTimer(timeLeft)}</span>
                  </div>
                </div>

                {/* Current Question */}
                {activeTest.questions[currentQIndex] && (
                  <div className="space-y-4 mb-8">
                    <h4 className="text-sm font-semibold text-slate-900 leading-relaxed">
                      {activeTest.questions[currentQIndex].questionText}
                    </h4>

                    <div className="space-y-2.5">
                      {activeTest.questions[currentQIndex].options.map((option, idx) => {
                        const isSelected = answers[currentQIndex] === idx;
                        return (
                          <button
                            key={idx}
                            type="button"
                            onClick={() => handleOptionSelect(idx)}
                            className={`w-full p-3.5 rounded-2xl text-left text-xs font-medium border transition flex items-center gap-3 cursor-pointer ${
                              isSelected
                                ? 'bg-indigo-50 border-indigo-500 text-indigo-900 shadow-xs'
                                : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                            }`}
                          >
                            <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                              isSelected ? 'bg-indigo-600 text-white' : 'bg-slate-200 text-slate-600'
                            }`}>
                              {String.fromCharCode(65 + idx)}
                            </span>
                            <span>{option}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Navigation and Submit Buttons */}
                <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                  <button
                    type="button"
                    disabled={currentQIndex === 0}
                    onClick={() => setCurrentQIndex(prev => prev - 1)}
                    className="inline-flex items-center gap-1.5 py-2 px-3 text-xs font-semibold text-slate-600 hover:text-slate-900 disabled:opacity-30"
                  >
                    <ChevronLeft className="w-4 h-4" /> Previous
                  </button>

                  <div className="flex items-center gap-2">
                    {currentQIndex < activeTest.questions.length - 1 ? (
                      <button
                        type="button"
                        onClick={() => setCurrentQIndex(prev => prev + 1)}
                        className="inline-flex items-center gap-1.5 py-2 px-4 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-xs font-semibold"
                      >
                        Next Question <ChevronRight className="w-4 h-4" />
                      </button>
                    ) : (
                      <button
                        type="button"
                        disabled={isSubmitting}
                        onClick={handleSubmitTest}
                        className="py-2 px-5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold shadow-sm transition disabled:opacity-50"
                      >
                        {isSubmitting ? 'Evaluating...' : 'Submit & Grade Test'}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
