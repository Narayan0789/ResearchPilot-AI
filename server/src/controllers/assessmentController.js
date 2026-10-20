import {
  Assessment,
  AssessmentAttempt,
  Grade,
  Course,
  Enrollment,
  Notification,
  User,
  StudentProfile
} from '../models/index.js';
import { sendSuccess, sendError } from '../utils/apiResponse.js';
import { logAudit } from '../utils/auditLogger.js';

// @desc    Create a new assessment/quiz
// @route   POST /api/assessments
// @access  Private (Faculty, Admin)
export async function createAssessment(req, res, next) {
  try {
    const {
      courseId,
      title,
      description,
      durationMinutes,
      totalMarks,
      passingMarks,
      questions,
      publishStatus,
      dueDate
    } = req.body;

    const course = await Course.findById(courseId);
    if (!course) {
      return sendError(res, 'Course not found', 404);
    }

    if (req.user.role === 'faculty' && !course.faculty.some(f => String(f) === String(req.user._id))) {
      return sendError(res, 'You are not authorized to create assessments for this course.', 403);
    }

    // Calculate total marks from questions if not provided
    const computedTotal = Array.isArray(questions)
      ? questions.reduce((sum, q) => sum + (Number(q.marks) || 1), 0)
      : totalMarks || 100;

    const assessment = await Assessment.create({
      course: courseId,
      faculty: req.user._id,
      title,
      description: description || '',
      durationMinutes: Number(durationMinutes) || 30,
      totalMarks: computedTotal,
      passingMarks: Number(passingMarks) || Math.round(computedTotal * 0.4),
      questions,
      publishStatus: publishStatus || 'published',
      dueDate: dueDate ? new Date(dueDate) : null
    });

    if (assessment.publishStatus === 'published') {
      const enrollments = await Enrollment.find({ course: courseId, status: 'enrolled' });
      for (const e of enrollments) {
        await Notification.create({
          user: e.student,
          title: `New Quiz Available: ${title}`,
          message: `A new assessment was posted in ${course.code}: ${title} (${computedTotal} Marks, ${durationMinutes} Mins).`,
          type: 'assignment',
          link: '/student/assessments'
        });
      }
    }

    await logAudit({
      userId: req.user._id,
      action: 'CREATE_ASSESSMENT',
      entity: 'Assessment',
      entityId: assessment._id,
      details: { title, courseCode: course.code },
      req
    });

    return res.status(201).json({
      success: true,
      message: 'Assessment created successfully',
      data: assessment
    });
  } catch (error) {
    next(error);
  }
}

// @desc    Get assessments for a course
// @route   GET /api/assessments/course/:courseId
// @access  Private
export async function getAssessmentsByCourse(req, res, next) {
  try {
    const { courseId } = req.params;
    const query = { course: courseId };

    if (req.user.role === 'student') {
      query.publishStatus = 'published';
    }

    const assessments = await Assessment.find(query)
      .populate('faculty', 'name')
      .sort({ createdAt: -1 });

    // If student, check whether they have already attempted each assessment
    if (req.user.role === 'student') {
      const assessmentIds = assessments.map(a => a._id);
      const attempts = await AssessmentAttempt.find({
        assessment: { $in: assessmentIds },
        student: req.user._id
      });
      const attemptMap = new Map(attempts.map(att => [String(att.assessment), att]));

      const safeAssessments = assessments.map(a => {
        const attempt = attemptMap.get(String(a._id));
        const obj = a.toObject();
        // Hide correct answers and explanations until student has attempted
        if (!attempt) {
          obj.questions = obj.questions.map(q => {
            const { correctOptionIndex, explanation, ...safeQ } = q;
            return safeQ;
          });
        }
        return {
          ...obj,
          attempt: attempt || null,
          hasAttempted: !!attempt
        };
      });

      return sendSuccess(res, safeAssessments, 'Assessments retrieved');
    }

    return sendSuccess(res, assessments, 'Assessments retrieved');
  } catch (error) {
    next(error);
  }
}

// @desc    Get assessment for taking (strips correct answer indices)
// @route   GET /api/assessments/:id/take
// @access  Private (Student)
export async function getAssessmentForTaking(req, res, next) {
  try {
    const { id } = req.params;
    const assessment = await Assessment.findById(id).populate('course', 'name code');
    if (!assessment || assessment.publishStatus !== 'published') {
      return sendError(res, 'Assessment is not available or published.', 404);
    }

    // Check if already attempted
    const existingAttempt = await AssessmentAttempt.findOne({
      assessment: id,
      student: req.user._id
    });

    if (existingAttempt) {
      return sendError(res, 'You have already completed this assessment.', 400);
    }

    // Strip answers from questions
    const safeQuestions = assessment.questions.map((q, idx) => ({
      questionIndex: idx,
      questionText: q.questionText,
      options: q.options,
      marks: q.marks
    }));

    return sendSuccess(res, {
      _id: assessment._id,
      title: assessment.title,
      description: assessment.description,
      course: assessment.course,
      durationMinutes: assessment.durationMinutes,
      totalMarks: assessment.totalMarks,
      passingMarks: assessment.passingMarks,
      questions: safeQuestions
    }, 'Assessment ready');
  } catch (error) {
    next(error);
  }
}

// @desc    Submit assessment attempt
// @route   POST /api/assessments/:id/submit
// @access  Private (Student)
export async function submitAssessmentAttempt(req, res, next) {
  try {
    const { id } = req.params;
    const { answers, timeTakenSeconds } = req.body; // Array of { questionIndex, selectedOptionIndex }

    const assessment = await Assessment.findById(id).populate('course', 'name code');
    if (!assessment) {
      return sendError(res, 'Assessment not found', 404);
    }

    const existing = await AssessmentAttempt.findOne({ assessment: id, student: req.user._id });
    if (existing) {
      return sendError(res, 'You have already submitted an attempt for this assessment.', 400);
    }

    let score = 0;
    const gradedAnswers = [];

    const answerMap = new Map();
    if (Array.isArray(answers)) {
      answers.forEach(a => answerMap.set(Number(a.questionIndex), Number(a.selectedOptionIndex)));
    }

    assessment.questions.forEach((q, index) => {
      const selected = answerMap.has(index) ? answerMap.get(index) : -1;
      const isCorrect = selected === q.correctOptionIndex;
      const marksAwarded = isCorrect ? (q.marks || 1) : 0;
      score += marksAwarded;

      gradedAnswers.push({
        questionIndex: index,
        selectedOptionIndex: selected,
        isCorrect,
        marksAwarded
      });
    });

    const percentage = Math.round((score / assessment.totalMarks) * 100);
    const passed = score >= assessment.passingMarks;

    const attempt = await AssessmentAttempt.create({
      assessment: id,
      student: req.user._id,
      course: assessment.course._id,
      answers: gradedAnswers,
      score,
      totalMarks: assessment.totalMarks,
      percentage,
      passed,
      submittedAt: new Date(),
      timeTakenSeconds: Number(timeTakenSeconds) || 0
    });

    // Create Notification
    await Notification.create({
      user: req.user._id,
      title: `Quiz Result: ${assessment.title}`,
      message: `You scored ${score}/${assessment.totalMarks} (${percentage}%) in ${assessment.course.code}. Status: ${passed ? 'PASSED' : 'NEEDS IMPROVEMENT'}.`,
      type: 'grade',
      link: '/student/assessments'
    });

    await logAudit({
      userId: req.user._id,
      action: 'SUBMIT_ASSESSMENT',
      entity: 'AssessmentAttempt',
      entityId: attempt._id,
      details: { score, totalMarks: assessment.totalMarks, passed },
      req
    });

    return res.status(201).json({
      success: true,
      message: 'Assessment submitted and graded automatically.',
      data: {
        attempt,
        questionsWithReview: assessment.questions.map((q, idx) => ({
          questionIndex: idx,
          questionText: q.questionText,
          options: q.options,
          correctOptionIndex: q.correctOptionIndex,
          explanation: q.explanation,
          marks: q.marks,
          yourAnswer: answerMap.get(idx) ?? -1,
          isCorrect: answerMap.get(idx) === q.correctOptionIndex
        }))
      }
    });
  } catch (error) {
    next(error);
  }
}

// @desc    Get all grades and academic results for authenticated student
// @route   GET /api/grades/my-grades
// @access  Private (Student)
export async function getMyGrades(req, res, next) {
  try {
    const grades = await Grade.find({ student: req.user._id })
      .populate('course', 'code name credits semester')
      .sort({ semester: 1 });

    const attempts = await AssessmentAttempt.find({ student: req.user._id })
      .populate('assessment', 'title totalMarks')
      .populate('course', 'code name');

    // Calculate cumulative CGPA
    let totalPoints = 0;
    let totalCredits = 0;
    grades.forEach(g => {
      const cr = g.course?.credits || 3;
      totalPoints += (g.gpaPoints || 0) * cr;
      totalCredits += cr;
    });

    const calculatedCgpa = totalCredits > 0 ? (totalPoints / totalCredits).toFixed(2) : '0.00';

    return sendSuccess(res, {
      grades,
      attempts,
      cgpa: Number(calculatedCgpa),
      totalCredits
    }, 'Grades retrieved');
  } catch (error) {
    next(error);
  }
}

// @desc    Record or update course grade for a student
// @route   POST /api/grades
// @access  Private (Faculty, Admin)
export async function updateGradeRecord(req, res, next) {
  try {
    const { studentId, courseId, semester, internalMarks, assignmentMarks, assessmentMarks, endSemMarks, remarks } = req.body;

    const total = Number(internalMarks || 0) + Number(assignmentMarks || 0) + Number(assessmentMarks || 0) + Number(endSemMarks || 0);

    let letterGrade = 'F';
    let gpaPoints = 0;
    if (total >= 90) { letterGrade = 'O'; gpaPoints = 10; }
    else if (total >= 80) { letterGrade = 'A+'; gpaPoints = 9; }
    else if (total >= 70) { letterGrade = 'A'; gpaPoints = 8; }
    else if (total >= 60) { letterGrade = 'B+'; gpaPoints = 7; }
    else if (total >= 50) { letterGrade = 'B'; gpaPoints = 6; }
    else if (total >= 40) { letterGrade = 'C'; gpaPoints = 5; }

    const grade = await Grade.findOneAndUpdate(
      { student: studentId, course: courseId, academicYear: '2025-2026' },
      {
        student: studentId,
        course: courseId,
        semester: Number(semester) || 1,
        academicYear: '2025-2026',
        internalMarks: Number(internalMarks) || 0,
        assignmentMarks: Number(assignmentMarks) || 0,
        assessmentMarks: Number(assessmentMarks) || 0,
        endSemMarks: Number(endSemMarks) || 0,
        totalMarks: total,
        letterGrade,
        gpaPoints,
        remarks: remarks || ''
      },
      { upsert: true, new: true, runValidators: true }
    );

    // Update studentProfile CGPA
    const allStudentGrades = await Grade.find({ student: studentId });
    if (allStudentGrades.length > 0) {
      const avgGpa = (allStudentGrades.reduce((sum, g) => sum + g.gpaPoints, 0) / allStudentGrades.length).toFixed(2);
      await StudentProfile.findOneAndUpdate({ userId: studentId }, { cgpa: Number(avgGpa) });
    }

    await logAudit({
      userId: req.user._id,
      action: 'UPDATE_GRADE',
      entity: 'Grade',
      entityId: grade._id,
      details: { totalMarks: total, letterGrade },
      req
    });

    return sendSuccess(res, grade, 'Grade recorded successfully');
  } catch (error) {
    next(error);
  }
}
