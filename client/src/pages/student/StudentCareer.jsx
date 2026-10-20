import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import toast from 'react-hot-toast';
import {
  Briefcase,
  FileText,
  Upload,
  CheckCircle2,
  XCircle,
  HelpCircle,
  Sparkles,
  Award,
  Bot,
  Send,
  Building,
  MapPin,
  TrendingUp,
  AlertCircle,
  ExternalLink,
  RotateCcw,
  Check,
  RefreshCw
} from 'lucide-react';

const PRACTICE_QUESTIONS = [
  {
    role: 'Full Stack Software Engineer',
    question: 'How do you ensure data integrity and prevent race conditions in concurrent database operations?'
  },
  {
    role: 'Full Stack Software Engineer',
    question: 'Explain how the React Virtual DOM works and what strategies you use to eliminate unnecessary re-renders in large lists.'
  },
  {
    role: 'Backend / Systems Engineer',
    question: 'How would you design a rate limiter for an API handling 100,000 requests per minute across distributed server nodes?'
  },
  {
    role: 'Associate Machine Learning Engineer',
    question: 'What is the mathematical difference between Precision and Recall, and how do you mitigate severe class imbalance during training?'
  },
  {
    role: 'Full Stack Software Engineer',
    question: 'Describe how JWT authentication works, where tokens should be stored securely, and how to defend against XSS and CSRF attacks.'
  }
];

export default function StudentCareer() {
  const { user } = useAuth();
  const [profileData, setProfileData] = useState(null);
  const [activeJobs, setActiveJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploadingResume, setUploadingResume] = useState(false);
  const [syncingJobs, setSyncingJobs] = useState(false);

  // Mock interview state
  const [questionIndex, setQuestionIndex] = useState(0);
  const [interviewRole, setInterviewRole] = useState(PRACTICE_QUESTIONS[0].role);
  const [mockQuestion, setMockQuestion] = useState(PRACTICE_QUESTIONS[0].question);
  const [studentAnswer, setStudentAnswer] = useState('');
  const [evaluating, setEvaluating] = useState(false);
  const [interviewEvaluation, setInterviewEvaluation] = useState(null);

  const fetchCareerData = async () => {
    try {
      const res = await api.get('/ai/career/profile');
      if (res.data.success) {
        setProfileData(res.data.data);
        setActiveJobs(res.data.data.activeJobs || []);
      }
    } catch (err) {
      console.error('Failed to load career data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCareerData();
  }, [user]);

  const handleSyncLiveJobs = async () => {
    setSyncingJobs(true);
    try {
      const res = await api.post('/ai/career/jobs/sync-live');
      if (res.data.success) {
        toast.success(res.data.message || 'Live tech job openings synchronized!');
        fetchCareerData();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to sync live openings.');
    } finally {
      setSyncingJobs(false);
    }
  };

  const handleResumeUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('resume', file);

    setUploadingResume(true);
    try {
      const res = await api.post('/ai/career/resume', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      if (res.data.success) {
        toast.success('Resume analyzed and matched against campus placements!');
        fetchCareerData();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Resume parsing failed.');
    } finally {
      setUploadingResume(false);
    }
  };

  const handleNextQuestion = () => {
    const nextIdx = (questionIndex + 1) % PRACTICE_QUESTIONS.length;
    setQuestionIndex(nextIdx);
    setInterviewRole(PRACTICE_QUESTIONS[nextIdx].role);
    setMockQuestion(PRACTICE_QUESTIONS[nextIdx].question);
    setStudentAnswer('');
    setInterviewEvaluation(null);
  };

  const handleEvaluateAnswer = async (e) => {
    e.preventDefault();
    if (!studentAnswer.trim()) {
      toast.error('Please enter an answer to evaluate.');
      return;
    }

    setEvaluating(true);
    try {
      const res = await api.post('/ai/career/mock-interview/evaluate', {
        role: interviewRole,
        question: mockQuestion,
        answer: studentAnswer
      });
      if (res.data.success) {
        setInterviewEvaluation(res.data.data);
        if (res.data.data.score <= 3) {
          toast('Evaluation complete. Review the senior engineer benchmark to build foundational concepts.', { icon: '💡' });
        } else {
          toast.success('Interview answer evaluated by AI coach!');
        }
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Evaluation failed.');
    } finally {
      setEvaluating(false);
    }
  };

  const latestAnalysis = profileData?.latestAnalysis;
  const parsedSkills = latestAnalysis?.parsedSkills || profileData?.profile?.extractedSkills || [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Career & Placement Intelligence</h1>
        <p className="text-xs text-slate-500 mt-1">
          Resume ATS skill extraction, job vacancy matching, direct application links, and AI mock interview coaching
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Resume Analyzer & Skills */}
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-5">
            <div>
              <h3 className="text-base font-bold text-slate-900">Resume Intelligence</h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Upload your PDF resume to extract technical competencies and identify missing skills.
              </p>
            </div>

            {/* Upload Area */}
            <div className="border-2 border-dashed border-slate-200 hover:border-indigo-300 rounded-2xl p-6 text-center transition bg-slate-50/50">
              <input
                type="file"
                id="resume-file"
                accept=".pdf"
                className="hidden"
                onChange={handleResumeUpload}
                disabled={uploadingResume}
              />
              <label
                htmlFor="resume-file"
                className="cursor-pointer flex flex-col items-center justify-center space-y-2"
              >
                <div className="w-11 h-11 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shadow-xs">
                  {uploadingResume ? (
                    <div className="w-5 h-5 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
                  ) : (
                    <Upload className="w-5 h-5" />
                  )}
                </div>
                <span className="text-xs font-bold text-slate-800">
                  {uploadingResume ? 'Analyzing Resume...' : 'Upload PDF Resume'}
                </span>
                <span className="text-[10px] text-slate-400">PDF format up to 10MB</span>
              </label>
            </div>

            {/* Analysis Results */}
            {latestAnalysis && (
              <div className="space-y-4 pt-2 border-t border-slate-100">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-600">Resume Health Score:</span>
                  <span className="text-base font-extrabold text-indigo-700">
                    {latestAnalysis.overallScore}/100
                  </span>
                </div>

                <div>
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-2">
                    Identified Technical Skills ({parsedSkills.length}):
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {parsedSkills.length > 0 ? (
                      parsedSkills.map((sk, idx) => (
                        <span
                          key={idx}
                          className="px-2.5 py-0.5 rounded-lg text-[11px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-100 uppercase"
                        >
                          {sk}
                        </span>
                      ))
                    ) : (
                      <span className="text-xs text-slate-400 italic">No skills extracted yet</span>
                    )}
                  </div>
                </div>

                {latestAnalysis.formattingFeedback?.length > 0 && (
                  <div className="pt-2">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-1.5">
                      Optimization Tips:
                    </span>
                    <ul className="space-y-1 text-xs text-slate-600">
                      {latestAnalysis.formattingFeedback.map((tip, idx) => (
                        <li key={idx} className="flex items-start gap-1.5">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />
                          <span>{tip}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Center & Right Column: Job Matching & Mock Interview */}
        <div className="lg:col-span-2 space-y-6">
          {/* Active Job Postings with Match Scores and Apply Links */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-base font-bold text-slate-900">Campus Placements & Skill Match</h3>
                <p className="text-xs text-slate-500">Live comparison against your parsed profile with direct application links</p>
              </div>

              <div className="flex items-center gap-2.5">
                <button
                  type="button"
                  onClick={handleSyncLiveJobs}
                  disabled={syncingJobs}
                  title="Pull real-time hiring updates from live tech job feeds"
                  className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-200 transition cursor-pointer disabled:opacity-50"
                >
                  <RefreshCw className={`w-3 h-3 ${syncingJobs ? 'animate-spin text-indigo-600' : ''}`} />
                  <span>{syncingJobs ? 'Syncing...' : 'Sync Live Openings'}</span>
                </button>

                <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 shadow-2xs">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                  </span>
                  <span className="text-xs font-bold text-emerald-700">
                    {activeJobs.length} Active Openings
                  </span>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              {activeJobs.map(job => {
                const matchObj = latestAnalysis?.matchedJobs?.find(m => String(m.job?._id || m.job) === String(job._id));
                const matchPercentage = matchObj?.matchPercentage ?? (job.requiredSkills.length > 0 ? Math.round((job.requiredSkills.filter(r => parsedSkills.includes(r.toLowerCase())).length / job.requiredSkills.length) * 100) : 85);

                return (
                  <div key={job._id} className="p-4 rounded-2xl border border-slate-200 bg-slate-50/50 hover:bg-slate-50 transition space-y-3">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <h4 className="text-sm font-bold text-slate-900">{job.title}</h4>
                          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-200 text-slate-700">
                            {job.employmentType || 'Full-time'}
                          </span>
                          {job.source === 'live_feed' ? (
                            <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-purple-100 text-purple-800 border border-purple-200 uppercase tracking-wider">
                              Live Feed
                            </span>
                          ) : (
                            <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200 uppercase tracking-wider">
                              Campus Drive
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-3 text-xs text-slate-500 mt-1">
                          <span className="flex items-center gap-1 font-medium text-slate-700">
                            <Building className="w-3.5 h-3.5" /> {job.company}
                          </span>
                          <span className="flex items-center gap-1">
                            <MapPin className="w-3.5 h-3.5" /> {job.location}
                          </span>
                          <span>&bull; {job.salaryRange}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <div className="text-right">
                          <span className="text-xs font-bold text-indigo-700 block">
                            {matchPercentage}% Match
                          </span>
                          <span className="text-[10px] text-slate-400">Skill Alignment</span>
                        </div>
                        <div className={`w-11 h-11 rounded-xl flex items-center justify-center font-extrabold text-xs shadow-xs ${
                          matchPercentage >= 75
                            ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                            : matchPercentage >= 50
                            ? 'bg-indigo-100 text-indigo-700 border border-indigo-200'
                            : 'bg-slate-100 text-slate-700 border border-slate-200'
                        }`}>
                          {matchPercentage}%
                        </div>
                      </div>
                    </div>

                    <p className="text-xs text-slate-600 leading-relaxed line-clamp-2">
                      {job.description}
                    </p>

                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                        Prerequisites:
                      </span>
                      <div className="flex flex-wrap gap-1">
                        {job.requiredSkills.map((reqSkill, sIdx) => {
                          const hasSkill = parsedSkills.includes(reqSkill.toLowerCase());
                          return (
                            <span
                              key={sIdx}
                              className={`text-[11px] px-2 py-0.5 rounded-md font-medium flex items-center gap-1 ${
                                hasSkill
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : 'bg-slate-200 text-slate-700'
                              }`}
                            >
                              {hasSkill ? '✓' : '•'} {reqSkill}
                            </span>
                          );
                        })}
                      </div>
                    </div>

                    {/* Action Bar with Apply Links */}
                    <div className="pt-2 border-t border-slate-200/60 flex items-center justify-between gap-2">
                      <span className="text-[11px] text-slate-400">
                        {job.deadline ? `Deadline: ${new Date(job.deadline).toLocaleDateString()}` : 'Actively Hiring'}
                      </span>

                      <div>
                        {/* Direct Apply External Link */}
                        <a
                          href={job.applyUrl || `https://www.google.com/search?q=${encodeURIComponent(job.company + ' careers ' + job.title)}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs shadow-xs transition"
                        >
                          <span>Apply Link</span>
                          <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* AI Mock Interview Coach Simulator */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-indigo-600 text-white flex items-center justify-center">
                  <Bot className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">AI Mock Technical Interview Simulator</h3>
                  <p className="text-xs text-slate-500">Practice your technical articulation and receive rubric scoring</p>
                </div>
              </div>

              <button
                type="button"
                onClick={handleNextQuestion}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 rounded-xl transition cursor-pointer"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Next Question</span>
              </button>
            </div>

            <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl mb-4 text-xs">
              <span className="font-bold text-indigo-700 uppercase tracking-wider text-[10px] block mb-1">
                Interviewer Question ({interviewRole}):
              </span>
              <p className="text-slate-800 font-semibold text-sm leading-relaxed">
                "{mockQuestion}"
              </p>
            </div>

            <form onSubmit={handleEvaluateAnswer} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Your Technical Response:
                </label>
                <textarea
                  rows={4}
                  value={studentAnswer}
                  onChange={(e) => setStudentAnswer(e.target.value)}
                  placeholder="Explain your approach, concurrency locks, transaction isolation levels (ACID), and optimistic vs pessimistic locking..."
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                ></textarea>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-[11px] text-slate-400 italic">
                  Be as technical and structured as possible. Mention core concepts, trade-offs, and examples.
                </span>
                <button
                  type="submit"
                  disabled={evaluating}
                  className="py-2.5 px-5 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-xl text-xs transition disabled:opacity-50 flex items-center gap-1.5 cursor-pointer shadow-xs"
                >
                  {evaluating ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  ) : (
                    <>
                      <Send className="w-3.5 h-3.5" /> Evaluate My Answer
                    </>
                  )}
                </button>
              </div>
            </form>

            {/* Evaluation Results */}
            {interviewEvaluation && (
              <div className={`mt-5 p-4 rounded-2xl border space-y-3 text-xs ${
                interviewEvaluation.score >= 8
                  ? 'bg-emerald-50/80 border-emerald-200'
                  : interviewEvaluation.score >= 5
                  ? 'bg-indigo-50/80 border-indigo-200'
                  : 'bg-amber-50/80 border-amber-200'
              }`}>
                <div className="flex items-center justify-between">
                  <div>
                    <span className="font-bold text-slate-900 text-sm block">
                      Evaluation: {interviewEvaluation.verdict}
                    </span>
                    <span className="text-[11px] text-slate-500">
                      {interviewEvaluation.score <= 3
                        ? 'Requires foundational study before technical interview'
                        : interviewEvaluation.score <= 7
                        ? 'Solid baseline understanding with room for architectural depth'
                        : 'Outstanding response meeting senior engineering standards'}
                    </span>
                  </div>
                  <span className={`font-extrabold text-sm px-3 py-1 rounded-xl border ${
                    interviewEvaluation.score >= 8
                      ? 'bg-emerald-600 text-white border-emerald-600'
                      : interviewEvaluation.score >= 5
                      ? 'bg-indigo-600 text-white border-indigo-600'
                      : 'bg-amber-600 text-white border-amber-600'
                  }`}>
                    Score: {interviewEvaluation.score} / 10
                  </span>
                </div>

                <div>
                  <strong className="text-slate-700 block mb-1">Key Strengths:</strong>
                  <ul className="list-disc pl-4 text-slate-600 space-y-0.5">
                    {interviewEvaluation.strengths?.map((s, idx) => (
                      <li key={idx}>{s}</li>
                    ))}
                  </ul>
                </div>

                <div>
                  <strong className="text-slate-700 block mb-1">Areas for Technical Improvement:</strong>
                  <ul className="list-disc pl-4 text-slate-600 space-y-0.5">
                    {interviewEvaluation.areasForImprovement?.map((a, idx) => (
                      <li key={idx}>{a}</li>
                    ))}
                  </ul>
                </div>

                {interviewEvaluation.idealAnswerSummary && (
                  <div className="pt-2 border-t border-slate-200 text-[11px] text-slate-700">
                    <strong className="text-indigo-900 block mb-0.5">Senior Engineer Benchmark:</strong>
                    <p className="leading-relaxed italic">{interviewEvaluation.idealAnswerSummary}</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
