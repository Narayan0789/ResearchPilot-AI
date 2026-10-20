import {
  AttendanceSession,
  AttendanceRecord,
  Course,
  Enrollment,
  Notification,
  User,
  StudentProfile
} from '../models/index.js';
import { sendSuccess, sendError } from '../utils/apiResponse.js';
import { logAudit } from '../utils/auditLogger.js';

// @desc    Create a new attendance session
// @route   POST /api/attendance/sessions
// @access  Private (Faculty, Admin)
export async function createAttendanceSession(req, res, next) {
  try {
    const { courseId, date, topic, sessionType = 'lecture' } = req.body;

    const course = await Course.findById(courseId);
    if (!course) {
      return sendError(res, 'Course not found', 404);
    }

    // Role check: Faculty must be assigned to this course
    if (req.user.role === 'faculty' && !course.faculty.some(f => String(f) === String(req.user._id))) {
      return sendError(res, 'You are not assigned to instruct this course.', 403);
    }

    const enrolledStudents = await Enrollment.find({ course: courseId, status: 'enrolled' }).populate('student', 'name email');

    const session = await AttendanceSession.create({
      course: courseId,
      faculty: req.user._id,
      date: date ? new Date(date) : new Date(),
      topic: topic || '',
      semester: course.semester,
      sessionType,
      totalStudents: enrolledStudents.length,
      presentCount: 0,
      absentCount: 0,
      excusedCount: 0
    });

    await logAudit({
      userId: req.user._id,
      action: 'CREATE_ATTENDANCE_SESSION',
      entity: 'AttendanceSession',
      entityId: session._id,
      details: { courseCode: course.code, topic: session.topic },
      req
    });

    return res.status(201).json({
      success: true,
      message: 'Attendance session created. Ready for roll-call submission.',
      data: {
        session,
        enrolledStudents: enrolledStudents.map(e => e.student)
      }
    });
  } catch (error) {
    next(error);
  }
}

// @desc    Mark attendance for a session
// @route   POST /api/attendance/sessions/:id/mark
// @access  Private (Faculty, Admin)
export async function markAttendance(req, res, next) {
  try {
    const sessionId = req.params.id;
    const { records } = req.body; // Array of { studentId, status: 'present'|'absent'|'excused', remarks }

    if (!Array.isArray(records) || records.length === 0) {
      return sendError(res, 'Attendance records array is required.', 400);
    }

    const session = await AttendanceSession.findById(sessionId).populate('course', 'name code');
    if (!session) {
      return sendError(res, 'Attendance session not found', 404);
    }

    let present = 0;
    let absent = 0;
    let excused = 0;

    // Process each student's attendance record (upsert)
    for (const record of records) {
      const studentStatus = record.status || 'present';
      if (studentStatus === 'present') present++;
      else if (studentStatus === 'absent') absent++;
      else if (studentStatus === 'excused') excused++;

      await AttendanceRecord.findOneAndUpdate(
        { session: sessionId, student: record.studentId },
        {
          session: sessionId,
          course: session.course._id,
          student: record.studentId,
          status: studentStatus,
          remarks: record.remarks || '',
          markedBy: req.user._id
        },
        { upsert: true, new: true, runValidators: true }
      );

      // Check if student's attendance in this course is now low (< 75%)
      const totalCourseRecords = await AttendanceRecord.countDocuments({
        student: record.studentId,
        course: session.course._id
      });
      const attendedCount = await AttendanceRecord.countDocuments({
        student: record.studentId,
        course: session.course._id,
        status: { $in: ['present', 'excused'] }
      });

      if (totalCourseRecords >= 4) {
        const percentage = Math.round((attendedCount / totalCourseRecords) * 100);
        if (percentage < 75) {
          await Notification.create({
            user: record.studentId,
            title: `Attendance Alert: ${session.course.code}`,
            message: `Your attendance in ${session.course.code} is currently ${percentage}%, which is below the mandatory 75% threshold.`,
            type: 'attendance',
            link: '/student/attendance'
          });
        }
      }
    }

    // Update session summary numbers
    session.totalStudents = records.length;
    session.presentCount = present;
    session.absentCount = absent;
    session.excusedCount = excused;
    await session.save();

    await logAudit({
      userId: req.user._id,
      action: 'SUBMIT_ATTENDANCE',
      entity: 'AttendanceSession',
      entityId: sessionId,
      details: { totalMarked: records.length, present, absent, excused },
      req
    });

    return sendSuccess(res, session, 'Attendance marked successfully');
  } catch (error) {
    next(error);
  }
}

// @desc    Get attendance sessions for a course
// @route   GET /api/attendance/course/:courseId/sessions
// @access  Private (Faculty, Admin)
export async function getCourseSessions(req, res, next) {
  try {
    const { courseId } = req.params;
    const sessions = await AttendanceSession.find({ course: courseId })
      .sort({ date: -1 })
      .populate('faculty', 'name email');

    return sendSuccess(res, sessions, 'Course attendance sessions retrieved');
  } catch (error) {
    next(error);
  }
}

// @desc    Get details and records for a specific session
// @route   GET /api/attendance/sessions/:id
// @access  Private (Faculty, Admin)
export async function getSessionDetails(req, res, next) {
  try {
    const { id } = req.params;
    const session = await AttendanceSession.findById(id)
      .populate('course', 'name code')
      .populate('faculty', 'name email');

    if (!session) {
      return sendError(res, 'Session not found', 404);
    }

    const records = await AttendanceRecord.find({ session: id })
      .populate('student', 'name email');

    // Also get all enrolled students for easy matching
    const enrollments = await Enrollment.find({ course: session.course._id, status: 'enrolled' })
      .populate('student', 'name email');

    return sendSuccess(res, { session, records, enrolledStudents: enrollments.map(e => e.student) }, 'Session details retrieved');
  } catch (error) {
    next(error);
  }
}

// @desc    Get student's attendance summary (subject-wise)
// @route   GET /api/attendance/my-summary
// @access  Private (Student)
export async function getStudentAttendanceSummary(req, res, next) {
  try {
    const studentId = req.user._id;

    // Get all enrolled courses
    const enrollments = await Enrollment.find({ student: studentId, status: 'enrolled' })
      .populate('course', 'name code semester credits');

    const summary = [];
    let overallClasses = 0;
    let overallAttended = 0;

    for (const enrollment of enrollments) {
      if (!enrollment.course) continue;
      const courseId = enrollment.course._id;

      const records = await AttendanceRecord.find({ student: studentId, course: courseId })
        .populate('session', 'date topic sessionType')
        .sort({ createdAt: -1 });

      const totalClasses = records.length;
      const presentCount = records.filter(r => r.status === 'present').length;
      const excusedCount = records.filter(r => r.status === 'excused').length;
      const absentCount = records.filter(r => r.status === 'absent').length;

      const attended = presentCount + excusedCount;
      const percentage = totalClasses > 0 ? Math.round((attended / totalClasses) * 100) : 100;

      overallClasses += totalClasses;
      overallAttended += attended;

      summary.push({
        course: enrollment.course,
        totalClasses,
        presentCount,
        excusedCount,
        absentCount,
        percentage,
        isLowAttendance: percentage < 75,
        recentRecords: records.slice(0, 5)
      });
    }

    const overallPercentage = overallClasses > 0 ? Math.round((overallAttended / overallClasses) * 100) : 100;

    return sendSuccess(res, {
      summary,
      overall: {
        totalClasses: overallClasses,
        overallAttended,
        overallPercentage,
        isOverallLow: overallPercentage < 75
      }
    }, 'Student attendance summary retrieved');
  } catch (error) {
    next(error);
  }
}
