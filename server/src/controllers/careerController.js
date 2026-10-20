import {
  CareerProfile,
  ResumeAnalysis,
  JobPosting,
  User,
  StudentProfile
} from '../models/index.js';
import { extractTextFromFile } from '../services/ragService.js';
import { callLLM } from '../services/ragService.js';
import { syncLiveTechJobs } from '../services/liveJobSyncService.js';
import { sendSuccess, sendError } from '../utils/apiResponse.js';
import { logAudit } from '../utils/auditLogger.js';

// Common technical skills catalog for parsing
const SKILL_CATALOG = [
  'javascript', 'typescript', 'python', 'java', 'c++', 'c#', 'golang', 'rust', 'ruby', 'php', 'swift', 'kotlin',
  'react', 'react.js', 'vue', 'vue.js', 'angular', 'node.js', 'express', 'express.js', 'next.js', 'django', 'flask',
  'spring boot', 'html5', 'css3', 'tailwind css', 'bootstrap', 'mongodb', 'postgresql', 'mysql', 'redis', 'sqlite',
  'docker', 'kubernetes', 'aws', 'azure', 'gcp', 'git', 'github', 'ci/cd', 'linux', 'rest api', 'graphql',
  'machine learning', 'deep learning', 'tensorflow', 'pytorch', 'pandas', 'numpy', 'data structures', 'algorithms',
  'microservices', 'agile', 'scrum', 'system design', 'object-oriented programming', 'sql', 'nosql'
];

// @desc    Upload student resume PDF and generate analysis
// @route   POST /api/ai/career/resume
// @access  Private (Student)
export async function uploadAndAnalyzeResume(req, res, next) {
  try {
    if (!req.file) {
      return sendError(res, 'A resume PDF file is required.', 400);
    }

    const resumeUrl = `/uploads/${req.file.filename}`;
    const filePath = req.file.path;

    // Extract text from resume PDF
    let resumeText = '';
    try {
      resumeText = await extractTextFromFile(filePath, req.file.mimetype);
    } catch (parseError) {
      return sendError(res, `Failed to parse PDF resume: ${parseError.message}`, 400);
    }

    const lowerText = resumeText.toLowerCase();

    // Match skills against catalog safely (handling special chars like c++, c#, .net)
    const extractedSkills = SKILL_CATALOG.filter(skill => {
      const escaped = skill.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const regex = new RegExp(`(^|[^a-zA-Z0-9+#])${escaped}(?![a-zA-Z0-9+#])`, 'i');
      return regex.test(lowerText);
    });

    // Formatting checks
    const formattingFeedback = [];
    if (!lowerText.includes('education')) formattingFeedback.push('Include a prominent Education section.');
    if (!lowerText.includes('project')) formattingFeedback.push('Include quantifiable technical projects with repository links.');
    if (!lowerText.includes('experience') && !lowerText.includes('internship')) formattingFeedback.push('Highlight relevant practical internships or open-source contributions.');
    if (resumeText.length < 500) formattingFeedback.push('Resume content appears concise; consider detailing project architecture.');
    if (formattingFeedback.length === 0) formattingFeedback.push('Strong structural formatting and clear section headers identified.');

    // Calculate score (0-100)
    let score = 50;
    score += Math.min(30, extractedSkills.length * 3);
    if (lowerText.includes('project')) score += 10;
    if (lowerText.includes('education')) score += 5;
    if (lowerText.includes('github') || lowerText.includes('linkedin')) score += 5;
    score = Math.min(95, score);

    // Match against active job postings
    const activeJobs = await JobPosting.find({ active: true });
    const matchedJobs = activeJobs.map(job => {
      const required = job.requiredSkills.map(s => s.toLowerCase());
      const matched = required.filter(r => extractedSkills.includes(r));
      const missing = required.filter(r => !extractedSkills.includes(r));
      const matchPct = required.length > 0 ? Math.round((matched.length / required.length) * 100) : 80;

      const recommendations = missing.map(m => `Upskill in ${m.toUpperCase()} through mini-projects or course labs.`);
      if (recommendations.length === 0) recommendations.push('Skillset meets all core prerequisites for this role.');

      return {
        job: job._id,
        matchPercentage: matchPct,
        matchedSkills: matched,
        missingSkills: missing,
        recommendations
      };
    }).sort((a, b) => b.matchPercentage - a.matchPercentage);

    // AI suggestions & interview questions
    const suggestedBulletPoints = [
      'Architected full-stack modules resulting in optimized REST response latency',
      'Engineered automated unit and integration tests achieving reliable coverage',
      'Containerized backend services with Docker for reproducible deployment'
    ];

    const recommendedInterviewQuestions = [
      `How have you applied ${extractedSkills[0] || 'software design patterns'} in your recent technical project?`,
      'Explain how you handle asynchronous state management and error boundary lifecycles.',
      'Walk me through a challenging bug you encountered and your systematic debugging process.'
    ];

    // Save ResumeAnalysis
    const analysis = await ResumeAnalysis.create({
      student: req.user._id,
      resumeFileName: req.file.originalname,
      parsedSkills: extractedSkills,
      overallScore: score,
      matchedJobs,
      formattingFeedback,
      suggestedBulletPoints,
      recommendedInterviewQuestions
    });

    // Update CareerProfile
    await CareerProfile.findOneAndUpdate(
      { student: req.user._id },
      {
        resumeUrl,
        resumeFileName: req.file.originalname,
        resumeRawText: resumeText.slice(0, 5000),
        extractedSkills,
        $setOnInsert: { student: req.user._id }
      },
      { upsert: true, new: true }
    );

    // Update StudentProfile skills
    await StudentProfile.findOneAndUpdate(
      { userId: req.user._id },
      { $addToSet: { skills: { $each: extractedSkills } } }
    );

    await logAudit({
      userId: req.user._id,
      action: 'ANALYZE_RESUME',
      entity: 'ResumeAnalysis',
      entityId: analysis._id,
      details: { skillsCount: extractedSkills.length, score },
      req
    });

    // Populate job details for response
    const populated = await ResumeAnalysis.findById(analysis._id).populate('matchedJobs.job');

    return sendSuccess(res, populated, 'Resume parsed and analyzed successfully');
  } catch (error) {
    next(error);
  }
}

// @desc    Get current student's career profile and latest resume analysis
// @route   GET /api/ai/career/profile
// @access  Private (Student)
export async function getCareerProfile(req, res, next) {
  try {
    const [profile, latestAnalysis, activeJobs] = await Promise.all([
      CareerProfile.findOne({ student: req.user._id }),
      ResumeAnalysis.findOne({ student: req.user._id }).sort({ createdAt: -1 }).populate('matchedJobs.job'),
      JobPosting.find({ active: true }).sort({ createdAt: -1 })
    ]);

    return sendSuccess(res, {
      profile: profile || {},
      latestAnalysis: latestAnalysis || null,
      activeJobs
    }, 'Career profile retrieved');
  } catch (error) {
    next(error);
  }
}

// @desc    Get active job postings
// @route   GET /api/ai/career/jobs
// @access  Private
export async function getJobs(req, res, next) {
  try {
    const jobs = await JobPosting.find({ active: true }).sort({ createdAt: -1 });
    return sendSuccess(res, jobs, 'Jobs retrieved');
  } catch (error) {
    next(error);
  }
}

// @desc    Create a job posting
// @route   POST /api/ai/career/jobs
// @access  Private (Faculty, Admin)
export async function createJob(req, res, next) {
  try {
    const { title, company, location, employmentType, description, requiredSkills, preferredSkills, minCgpa, salaryRange, deadline, applyUrl } = req.body;

    const job = await JobPosting.create({
      title,
      company,
      location: location || 'On-site / Hybrid',
      employmentType: employmentType || 'Full-time',
      description,
      requiredSkills: Array.isArray(requiredSkills) ? requiredSkills : (requiredSkills || '').split(',').map(s => s.trim().toLowerCase()),
      preferredSkills: Array.isArray(preferredSkills) ? preferredSkills : (preferredSkills || '').split(',').map(s => s.trim().toLowerCase()),
      minCgpa: Number(minCgpa) || 6.0,
      salaryRange: salaryRange || 'Competitive',
      deadline: deadline ? new Date(deadline) : null,
      applyUrl: applyUrl || '',
      postedBy: req.user._id
    });

    await logAudit({
      userId: req.user._id,
      action: 'CREATE_JOB_POSTING',
      entity: 'JobPosting',
      entityId: job._id,
      details: { title, company },
      req
    });

    return res.status(201).json({
      success: true,
      message: 'Job posting published successfully',
      data: job
    });
  } catch (error) {
    next(error);
  }
}

// @desc    Apply to a job posting with student profile
// @route   POST /api/ai/career/jobs/:id/apply
// @access  Private (Student)
export async function applyToJob(req, res, next) {
  try {
    const job = await JobPosting.findById(req.params.id);
    if (!job) {
      return sendError(res, 'Job posting not found.', 404);
    }
    if (!job.active) {
      return sendError(res, 'This job opening is no longer accepting applications.', 400);
    }

    // Check if already applied
    const alreadyApplied = job.applicants && job.applicants.some(a => String(a.student) === String(req.user._id));
    if (alreadyApplied) {
      return sendError(res, 'You have already applied for this position.', 400);
    }

    const careerProfile = await CareerProfile.findOne({ student: req.user._id });

    if (!job.applicants) job.applicants = [];
    job.applicants.push({
      student: req.user._id,
      appliedAt: new Date(),
      resumeUrl: careerProfile?.resumeUrl || ''
    });
    await job.save();

    await logAudit({
      userId: req.user._id,
      action: 'APPLY_JOB',
      entity: 'JobPosting',
      entityId: job._id,
      details: { title: job.title, company: job.company },
      req
    });

    return sendSuccess(res, { jobId: job._id, applied: true, applyUrl: job.applyUrl }, 'Application submitted successfully');
  } catch (error) {
    next(error);
  }
}

// @desc    Sync real-time tech job openings from live hiring feeds
// @route   POST /api/ai/career/jobs/sync-live
// @access  Private
export async function triggerLiveJobSync(req, res, next) {
  try {
    const result = await syncLiveTechJobs(15);
    const jobs = await JobPosting.find({ active: true }).sort({ createdAt: -1 });

    return sendSuccess(res, {
      syncedCount: result.syncedCount,
      totalActive: jobs.length,
      jobs
    }, result.message || 'Live tech job openings synchronized successfully');
  } catch (error) {
    next(error);
  }
}

// Helper: Provide tailored senior benchmark answer
function getIdealBenchmarkForQuestion(question = '') {
  const q = question.toLowerCase();
  if (q.includes('race condition') || q.includes('concurrent') || q.includes('database')) {
    return 'A senior engineer would explain: (1) ACID transactions with appropriate isolation levels (e.g., SERIALIZABLE or REPEATABLE READ), (2) Optimistic concurrency control using version timestamps for read-heavy systems, (3) Pessimistic locking (SELECT FOR UPDATE) for balance transfers, and (4) Distributed mutexes (Redis Redlock) across microservice replicas.';
  }
  if (q.includes('scale') || q.includes('system design') || q.includes('load')) {
    return 'A complete response covers horizontal scaling, stateless API design, load balancing algorithms, multi-tier caching (Redis/CDN), database read-replicas/sharding, and asynchronous queues (Kafka/RabbitMQ).';
  }
  if (q.includes('state') || q.includes('react') || q.includes('render')) {
    return 'A strong response details component re-render triggers, Virtual DOM reconciliation diffing, state lifting, memoization hooks (useMemo, useCallback), and immutable state management patterns.';
  }
  if (q.includes('bug') || q.includes('debugging')) {
    return 'A structured methodology: consistently reproduce in isolation, inspect structured logs and telemetry, write a failing regression test, perform root-cause analysis, and deploy a blameless post-mortem fix with monitoring.';
  }
  return 'A complete response defines the core terminology, explains the internal mechanism, outlines trade-offs between alternatives, and provides a concrete example from a production environment.';
}

// Helper: Offline rule & semantic evaluator for mock interview
function evaluateTechnicalResponse(question, answer) {
  const trimmed = answer.trim();
  const lower = trimmed.toLowerCase();

  // Detect non-answers or knowledge gaps (e.g. "i dont know", "no idea", "pass", or extremely short inputs)
  const nonAnswerRegex = /^(i\s*)?(do\s*not|don'?t)\s*know|no\s*idea|not\s*sure|no\s*clue|^skip$|^pass$|^n\/?a$|^idk$|^nothing$|^dunno$|can'?t\s*answer/i;
  const isRefusal = nonAnswerRegex.test(lower) || lower === 'i dont know' || lower === "i don't know";
  const isExtremelyShort = trimmed.split(/\s+/).length < 4 && trimmed.length < 20;

  if (isRefusal || isExtremelyShort) {
    return {
      score: 1,
      verdict: 'Needs Preparation / Non-Technical Response',
      strengths: [
        'Acknowledged knowledge gap directly without hallucinating inaccurate technical statements'
      ],
      areasForImprovement: [
        'Study foundational architectural concepts for this topic prior to technical screenings',
        'In an interview setting, avoid stopping at "I don\'t know" — attempt to reason step-by-step from first principles or ask the interviewer clarifying questions',
        'Practice explaining technical concepts using the STAR method (Situation, Task, Action, Result)'
      ],
      idealAnswerSummary: getIdealBenchmarkForQuestion(question)
    };
  }

  // Domain keyword analysis
  const keywordsMap = [
    { key: 'race', words: ['acid', 'transaction', 'lock', 'mutex', 'isolation', 'optimistic', 'pessimistic', 'atomic', 'serializable', 'concurrency', 'deadlock', 'thread', 'version'] },
    { key: 'database', words: ['index', 'b-tree', 'query', 'nosql', 'sharding', 'replica', 'schema', 'normalization', 'partition', 'cluster'] },
    { key: 'react', words: ['virtual dom', 'hook', 'state', 'props', 're-render', 'usememo', 'usecallback', 'reconciliation', 'lifecycle', 'memo'] },
    { key: 'async', words: ['promise', 'event loop', 'callback', 'async/await', 'microtask', 'queue', 'thread', 'non-blocking'] },
    { key: 'design', words: ['microservice', 'monolith', 'api', 'cache', 'queue', 'kafka', 'redis', 'load balancer', 'stateless', 'horizontal'] }
  ];

  let relevantWords = ['architecture', 'trade-off', 'performance', 'latency', 'production', 'implementation'];
  for (const item of keywordsMap) {
    if (question.toLowerCase().includes(item.key)) {
      relevantWords = relevantWords.concat(item.words);
    }
  }

  const matchedKeywords = relevantWords.filter(w => lower.includes(w));
  const wordCount = trimmed.split(/\s+/).length;

  let score = 4;
  if (matchedKeywords.length >= 3) score += 4;
  else if (matchedKeywords.length >= 1) score += 2;

  if (wordCount >= 25) score += 1;
  if (wordCount >= 50) score += 1;
  score = Math.min(9, Math.max(2, score));

  let verdict = 'Needs Improvement';
  if (score >= 8) verdict = 'Strong Answer';
  else if (score >= 6) verdict = 'Good Foundation';

  const strengths = [];
  if (matchedKeywords.length > 0) {
    strengths.push(`Identified key domain concepts: ${matchedKeywords.slice(0, 3).join(', ')}`);
  }
  if (wordCount >= 20) {
    strengths.push('Provided structured rationale with contextual reasoning');
  } else {
    strengths.push('Clear and direct communication style');
  }

  const areasForImprovement = [];
  if (matchedKeywords.length < 2) {
    areasForImprovement.push('Incorporate deeper domain terminology (e.g., isolation levels, locking mechanisms)');
  }
  if (wordCount < 35) {
    areasForImprovement.push('Elaborate with a real-world scenario or project experience to demonstrate practical mastery');
  }
  areasForImprovement.push('Explicitly articulate architectural trade-offs between alternative implementations');

  return {
    score,
    verdict,
    strengths,
    areasForImprovement,
    idealAnswerSummary: getIdealBenchmarkForQuestion(question)
  };
}

// @desc    Evaluate a student's mock interview response
// @route   POST /api/ai/career/mock-interview/evaluate
// @access  Private (Student)
export async function evaluateMockInterview(req, res, next) {
  try {
    const { role, question, answer } = req.body;
    if (!question || !answer) {
      return sendError(res, 'Both question and student answer are required.', 400);
    }

    const trimmed = answer.trim();
    const lower = trimmed.toLowerCase();

    // Fast-path: Check for explicit "I don't know" or refusal before calling LLM
    const nonAnswerRegex = /^(i\s*)?(do\s*not|don'?t)\s*know|no\s*idea|not\s*sure|no\s*clue|^skip$|^pass$|^n\/?a$|^idk$|^nothing$|^dunno$|can'?t\s*answer/i;
    const isRefusal = nonAnswerRegex.test(lower) || lower === 'i dont know' || lower === "i don't know";
    const isExtremelyShort = trimmed.split(/\s+/).length < 4 && trimmed.length < 20;

    if (isRefusal || isExtremelyShort) {
      const evaluation = {
        score: 1,
        verdict: 'Needs Preparation / Non-Technical Response',
        strengths: [
          'Honesty in acknowledging knowledge gap instead of fabricating misinformation'
        ],
        areasForImprovement: [
          'Study core system architecture and database concurrency concepts before live campus interviews',
          'Practice explaining concepts out loud: define the term, explain the mechanism, and give a production example',
          'In a real interview, never stop at "I don\'t know" — attempt to reason from first principles or ask the interviewer clarifying questions'
        ],
        idealAnswerSummary: getIdealBenchmarkForQuestion(question)
      };

      await CareerProfile.findOneAndUpdate(
        { student: req.user._id },
        {
          $push: {
            mockInterviewHistory: {
              date: new Date(),
              role: role || 'Software Engineer',
              overallScore: evaluation.score,
              feedback: evaluation.verdict,
              questionsAnswered: 1
            }
          }
        }
      );

      return sendSuccess(res, evaluation, 'Interview answer evaluated successfully');
    }

    const systemPrompt = `You are a strict, world-class technical interviewer at a top technology company.
Evaluate the student's answer to the mock interview question accurately and fairly.
CRITICAL GRADING INSTRUCTIONS:
- If the student admits they don't know, gives a one-line non-answer, or gives superficial non-technical filler, assign a score of 1 to 3 out of 10.
- If the answer has good concepts but lacks depth, assign 5 to 7 out of 10.
- Only assign 8 to 10 out of 10 for structured, technically accurate answers that mention trade-offs, mechanisms, or real-world examples.
Return JSON with this schema:
{
  "score": 7,
  "verdict": "Strong Answer / Good Foundation / Needs Preparation",
  "strengths": ["Clear communication", "Correct architectural principle"],
  "areasForImprovement": ["Include a specific metrics example"],
  "idealAnswerSummary": "Brief overview of what a senior engineer would mention"
}
Return valid raw JSON only.`;

    const userPrompt = `Target Role: ${role || 'Software Engineer'}\nInterview Question: "${question}"\nStudent Answer: "${answer}"`;

    const llmResult = await callLLM({ systemPrompt, userPrompt });

    let evaluation = null;
    if (llmResult) {
      try {
        const cleaned = llmResult.replace(/```json/g, '').replace(/```/g, '').trim();
        evaluation = JSON.parse(cleaned);
      } catch (jsonErr) {
        console.warn('[Mock Interview Parse Warning]:', jsonErr.message);
      }
    }

    if (!evaluation) {
      evaluation = evaluateTechnicalResponse(question, answer, role);
    }

    // Save to career profile mock interview history
    await CareerProfile.findOneAndUpdate(
      { student: req.user._id },
      {
        $push: {
          mockInterviewHistory: {
            date: new Date(),
            role: role || 'Software Engineer',
            overallScore: evaluation.score,
            feedback: evaluation.verdict,
            questionsAnswered: 1
          }
        }
      }
    );

    return sendSuccess(res, evaluation, 'Interview answer evaluated successfully');
  } catch (error) {
    next(error);
  }
}
