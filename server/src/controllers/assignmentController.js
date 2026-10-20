import {
  Assignment,
  Submission,
  Course,
  Enrollment,
  Notification,
  User
} from '../models/index.js';
import { sendSuccess, sendError } from '../utils/apiResponse.js';
import { logAudit } from '../utils/auditLogger.js';

// @desc    Create a new assignment
// @route   POST /api/assignments
// @access  Private (Faculty, Admin)
export async function createAssignment(req, res, next) {
  try {
    const { courseId, title, description, dueDate, maxMarks, allowLateSubmissions } = req.body;

    const course = await Course.findById(courseId);
    if (!course) {
      return sendError(res, 'Course not found', 404);
    }

    if (req.user.role === 'faculty' && !course.faculty.some(f => String(f) === String(req.user._id))) {
      return sendError(res, 'You are not authorized to create assignments for this course.', 403);
    }

    const attachments = [];
    if (req.file) {
      attachments.push({
        fileName: req.file.originalname,
        fileUrl: `/uploads/${req.file.filename}`,
        fileSize: req.file.size
      });
    }

    const assignment = await Assignment.create({
      course: courseId,
      faculty: req.user._id,
      title,
      description: description || '',
      attachments,
      dueDate: new Date(dueDate),
      maxMarks: Number(maxMarks) || 100,
      allowLateSubmissions: allowLateSubmissions === 'true' || allowLateSubmissions === true
    });

    // Notify enrolled students
    const enrollments = await Enrollment.find({ course: courseId, status: 'enrolled' });
    for (const enrollment of enrollments) {
      await Notification.create({
        user: enrollment.student,
        title: `New Assignment: ${title}`,
        message: `A new assignment was posted in ${course.code}: ${title}. Due date: ${new Date(dueDate).toLocaleDateString()}`,
        type: 'assignment',
        link: '/student/assignments'
      });
    }

    await logAudit({
      userId: req.user._id,
      action: 'CREATE_ASSIGNMENT',
      entity: 'Assignment',
      entityId: assignment._id,
      details: { title, courseCode: course.code },
      req
    });

    return res.status(201).json({
      success: true,
      message: 'Assignment created successfully and students notified.',
      data: assignment
    });
  } catch (error) {
    next(error);
  }
}

// @desc    Get assignments for a course
// @route   GET /api/assignments/course/:courseId
// @access  Private
export async function getAssignmentsByCourse(req, res, next) {
  try {
    const { courseId } = req.params;
    const assignments = await Assignment.find({ course: courseId, isPublished: true })
      .sort({ dueDate: 1 })
      .populate('faculty', 'name email');

    return sendSuccess(res, assignments, 'Assignments retrieved');
  } catch (error) {
    next(error);
  }
}

// @desc    Get student's assignments across all enrolled courses
// @route   GET /api/assignments/my-assignments
// @access  Private (Student)
export async function getMyStudentAssignments(req, res, next) {
  try {
    const enrollments = await Enrollment.find({ student: req.user._id, status: 'enrolled' });
    const courseIds = enrollments.map(e => e.course);

    const assignments = await Assignment.find({ course: { $in: courseIds }, isPublished: true })
      .populate('course', 'name code')
      .populate('faculty', 'name')
      .sort({ dueDate: 1 });

    const assignmentIds = assignments.map(a => a._id);
    const submissions = await Submission.find({
      assignment: { $in: assignmentIds },
      student: req.user._id
    });

    const subMap = new Map(submissions.map(s => [String(s.assignment), s]));

    const result = assignments.map(a => {
      const submission = subMap.get(String(a._id));
      const isPastDue = new Date() > new Date(a.dueDate);
      let status = 'pending';

      if (submission) {
        status = submission.status; // 'submitted' or 'graded'
      } else if (isPastDue) {
        status = 'overdue';
      }

      return {
        ...a.toObject(),
        submission: submission || null,
        computedStatus: status
      };
    });

    return sendSuccess(res, result, 'Student assignments retrieved');
  } catch (error) {
    next(error);
  }
}

// @desc    Submit an assignment
// @route   POST /api/assignments/:id/submit
// @access  Private (Student)
export async function submitAssignment(req, res, next) {
  try {
    const assignmentId = req.params.id;
    const { submissionText } = req.body;

    const assignment = await Assignment.findById(assignmentId);
    if (!assignment) {
      return sendError(res, 'Assignment not found', 404);
    }

    const now = new Date();
    const isLate = now > new Date(assignment.dueDate);
    if (isLate && !assignment.allowLateSubmissions) {
      return sendError(res, 'The submission deadline has passed and late submissions are not permitted for this assignment.', 400);
    }

    let fileUrl = '';
    let fileName = '';
    let fileSize = 0;
    if (req.file) {
      fileUrl = `/uploads/${req.file.filename}`;
      fileName = req.file.originalname;
      fileSize = req.file.size;
    }

    if (!submissionText && !fileUrl) {
      return sendError(res, 'Please provide text answers or attach a submission file.', 400);
    }

    const submission = await Submission.findOneAndUpdate(
      { assignment: assignmentId, student: req.user._id },
      {
        assignment: assignmentId,
        student: req.user._id,
        course: assignment.course,
        submissionText: submissionText || '',
        ...(fileUrl && { fileUrl, fileName, fileSize }),
        submittedAt: now,
        isLate,
        status: 'submitted'
      },
      { upsert: true, new: true, runValidators: true }
    );

    await logAudit({
      userId: req.user._id,
      action: 'SUBMIT_ASSIGNMENT',
      entity: 'Submission',
      entityId: submission._id,
      details: { assignmentTitle: assignment.title, isLate },
      req
    });

    return sendSuccess(res, submission, isLate ? 'Assignment submitted late successfully.' : 'Assignment submitted successfully.');
  } catch (error) {
    next(error);
  }
}

// @desc    Grade student submission
// @route   POST /api/assignments/submissions/:submissionId/grade
// @access  Private (Faculty, Admin)
export async function gradeSubmission(req, res, next) {
  try {
    const { submissionId } = req.params;
    const { marksObtained, feedback } = req.body;

    const submission = await Submission.findById(submissionId)
      .populate('assignment')
      .populate('student', 'name email');

    if (!submission) {
      return sendError(res, 'Submission not found', 404);
    }

    if (marksObtained < 0 || marksObtained > submission.assignment.maxMarks) {
      return sendError(res, `Marks must be between 0 and ${submission.assignment.maxMarks}`, 400);
    }

    submission.marksObtained = Number(marksObtained);
    submission.feedback = feedback || '';
    submission.status = 'graded';
    submission.gradedBy = req.user._id;
    submission.gradedAt = new Date();
    await submission.save();

    await Notification.create({
      user: submission.student._id,
      title: `Assignment Graded: ${submission.assignment.title}`,
      message: `Your submission for ${submission.assignment.title} was graded: ${marksObtained}/${submission.assignment.maxMarks}. Feedback: ${feedback || 'Good effort.'}`,
      type: 'grade',
      link: '/student/assignments'
    });

    await logAudit({
      userId: req.user._id,
      action: 'GRADE_SUBMISSION',
      entity: 'Submission',
      entityId: submission._id,
      details: { marksObtained, studentEmail: submission.student.email },
      req
    });

    return sendSuccess(res, submission, 'Submission graded successfully');
  } catch (error) {
    next(error);
  }
}

// @desc    Get submissions for a specific assignment
// @route   GET /api/assignments/:id/submissions
// @access  Private (Faculty, Admin)
export async function getSubmissionsForAssignment(req, res, next) {
  try {
    const assignmentId = req.params.id;
    const assignment = await Assignment.findById(assignmentId).populate('course', 'name code');
    if (!assignment) {
      return sendError(res, 'Assignment not found', 404);
    }

    const submissions = await Submission.find({ assignment: assignmentId })
      .populate('student', 'name email')
      .sort({ submittedAt: -1 });

    return sendSuccess(res, { assignment, submissions }, 'Submissions retrieved');
  } catch (error) {
    next(error);
  }
}
