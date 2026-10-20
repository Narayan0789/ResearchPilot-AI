import {
  StudentProfile,
  Enrollment,
  AttendanceRecord,
  Assignment,
  Submission,
  AssessmentAttempt,
  Grade,
  AcademicGoal,
  Course,
  User
} from '../models/index.js';
import { predictAcademicRisk, MODEL_EVALUATION_METRICS } from '../services/mlRiskService.js';
import { sendSuccess, sendError } from '../utils/apiResponse.js';

// @desc    Get student's complete academic success overview and ML risk evaluation
// @route   GET /api/ai/academic-support/student-overview
// @access  Private (Student)
export async function getStudentSuccessOverview(req, res, next) {
  try {
    const studentId = req.user._id;

    const [profile, enrollments, attendanceRecords, submissions, attempts, grades, goals] = await Promise.all([
      StudentProfile.findOne({ userId: studentId }),
      Enrollment.find({ student: studentId, status: 'enrolled' }).populate('course', 'name code credits semester'),
      AttendanceRecord.find({ student: studentId }),
      Submission.find({ student: studentId }),
      AssessmentAttempt.find({ student: studentId }),
      Grade.find({ student: studentId }).populate('course', 'name code credits'),
      AcademicGoal.find({ student: studentId })
    ]);

    // 1. Calculate Attendance Rate
    const totalAttendanceSessions = attendanceRecords.length;
    const attendedSessions = attendanceRecords.filter(r => ['present', 'excused'].includes(r.status)).length;
    const attendanceRate = totalAttendanceSessions > 0 ? Math.round((attendedSessions / totalAttendanceSessions) * 100) : 100;

    // 2. Calculate Assessment Average
    let assessmentScore = 80;
    if (attempts.length > 0) {
      const totalScore = attempts.reduce((sum, a) => sum + (a.percentage || 0), 0);
      assessmentScore = Math.round(totalScore / attempts.length);
    }

    // 3. Calculate Assignment Completion
    const courseIds = enrollments.map(e => e.course?._id).filter(Boolean);
    const totalAssignments = await Assignment.countDocuments({ course: { $in: courseIds } });
    const assignmentCompletion = totalAssignments > 0 ? Math.round((submissions.length / totalAssignments) * 100) : 100;

    // 4. CGPA
    const currentCgpa = profile?.cgpa || 7.5;

    // 5. Run ML predictive risk model
    const prediction = predictAcademicRisk({
      attendanceRate,
      assessmentScore,
      assignmentCompletion,
      cgpa: currentCgpa
    });

    // Update profile risk score
    if (profile) {
      profile.academicRiskScore = prediction.riskScore;
      profile.academicRiskLevel = prediction.riskLevel;
      profile.riskFactors = prediction.riskFactors;
      await profile.save();
    }

    return sendSuccess(res, {
      profile,
      metrics: {
        attendanceRate,
        assessmentScore,
        assignmentCompletion,
        currentCgpa
      },
      prediction,
      enrolledCourses: enrollments.map(e => e.course),
      grades,
      goals
    }, 'Academic success overview retrieved');
  } catch (error) {
    next(error);
  }
}

// @desc    Faculty view of at-risk students and class analytics
// @route   GET /api/ai/academic-support/faculty-insights
// @access  Private (Faculty, Admin)
export async function getFacultyClassInsights(req, res, next) {
  try {
    // Find courses taught by faculty
    const courses = await Course.find({
      ...(req.user.role === 'faculty' ? { faculty: req.user._id } : {}),
      isActive: true
    });
    const courseIds = courses.map(c => c._id);

    // Get all enrolled students
    const enrollments = await Enrollment.find({ course: { $in: courseIds }, status: 'enrolled' })
      .populate('student', 'name email avatar')
      .populate('course', 'name code');

    const studentIds = [...new Set(enrollments.map(e => String(e.student?._id)).filter(Boolean))];
    const profiles = await StudentProfile.find({ userId: { $in: studentIds } });
    const profileMap = new Map(profiles.map(p => [String(p.userId), p]));

    const studentsInsight = [];

    for (const enrollment of enrollments) {
      if (!enrollment.student || !enrollment.course) continue;
      const sId = enrollment.student._id;
      const cId = enrollment.course._id;

      // Attendance in this course
      const courseRecords = await AttendanceRecord.find({ student: sId, course: cId });
      const totalAtt = courseRecords.length;
      const attended = courseRecords.filter(r => ['present', 'excused'].includes(r.status)).length;
      const attendancePct = totalAtt > 0 ? Math.round((attended / totalAtt) * 100) : 100;

      // Quiz attempts in this course
      const attempts = await AssessmentAttempt.find({ student: sId, course: cId });
      const avgQuiz = attempts.length > 0 ? Math.round(attempts.reduce((s, a) => s + (a.percentage || 0), 0) / attempts.length) : 80;

      // Assignments in this course
      const totalAssigns = await Assignment.countDocuments({ course: cId });
      const submittedCount = await Submission.countDocuments({ student: sId, course: cId });
      const assignPct = totalAssigns > 0 ? Math.round((submittedCount / totalAssigns) * 100) : 100;

      const prof = profileMap.get(String(sId));
      const studentCgpa = prof?.cgpa || 7.0;

      // Run prediction
      const riskEvaluation = predictAcademicRisk({
        attendanceRate: attendancePct,
        assessmentScore: avgQuiz,
        assignmentCompletion: assignPct,
        cgpa: studentCgpa
      });

      studentsInsight.push({
        student: enrollment.student,
        course: enrollment.course,
        studentIdCode: prof?.studentId || 'N/A',
        attendancePercentage: attendancePct,
        assessmentAverage: avgQuiz,
        assignmentCompletionRate: assignPct,
        riskScore: riskEvaluation.riskScore,
        riskLevel: riskEvaluation.riskLevel,
        riskFactors: riskEvaluation.riskFactors,
        recommendations: riskEvaluation.recommendations
      });
    }

    // Sort: High risk first for proactive faculty intervention
    studentsInsight.sort((a, b) => b.riskScore - a.riskScore);

    return sendSuccess(res, {
      totalMonitoredStudents: studentsInsight.length,
      highRiskCount: studentsInsight.filter(s => s.riskLevel === 'High').length,
      moderateRiskCount: studentsInsight.filter(s => s.riskLevel === 'Moderate').length,
      lowRiskCount: studentsInsight.filter(s => s.riskLevel === 'Low').length,
      modelMetrics: MODEL_EVALUATION_METRICS,
      students: studentsInsight
    }, 'Faculty class insights retrieved');
  } catch (error) {
    next(error);
  }
}

// @desc    Create or update an academic goal
// @route   POST /api/ai/academic-support/goals
// @access  Private (Student)
export async function setAcademicGoal(req, res, next) {
  try {
    const { semester, targetGpa, studyHoursPerWeek, notes, milestones } = req.body;

    const goal = await AcademicGoal.findOneAndUpdate(
      { student: req.user._id, semester: Number(semester) || 1 },
      {
        student: req.user._id,
        semester: Number(semester) || 1,
        targetGpa: Number(targetGpa) || 8.0,
        studyHoursPerWeek: Number(studyHoursPerWeek) || 15,
        notes: notes || '',
        milestones: Array.isArray(milestones) ? milestones : []
      },
      { upsert: true, new: true, runValidators: true }
    );

    return sendSuccess(res, goal, 'Academic goal saved successfully');
  } catch (error) {
    next(error);
  }
}
