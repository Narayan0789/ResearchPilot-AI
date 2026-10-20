import bcrypt from 'bcryptjs';
import {
  User,
  StudentProfile,
  FacultyProfile,
  Course,
  Department,
  Enrollment,
  AttendanceSession,
  AttendanceRecord,
  AuditLog,
  Notification
} from '../models/index.js';
import { sendSuccess, sendError } from '../utils/apiResponse.js';
import { logAudit } from '../utils/auditLogger.js';
import { env } from '../config/env.js';

// @desc    Get dashboard statistics for administrator
// @route   GET /api/admin/stats
// @access  Private (Admin)
export async function getAdminStats(req, res, next) {
  try {
    const [
      totalStudents,
      totalFaculty,
      pendingFaculty,
      totalDepartments,
      totalCourses,
      totalEnrollments,
      recentLogs
    ] = await Promise.all([
      User.countDocuments({ role: 'student' }),
      User.countDocuments({ role: 'faculty', status: 'active' }),
      User.countDocuments({ role: 'faculty', status: 'pending' }),
      Department.countDocuments({ isActive: true }),
      Course.countDocuments({ isActive: true }),
      Enrollment.countDocuments({ status: 'enrolled' }),
      AuditLog.find().sort({ createdAt: -1 }).limit(10).populate('user', 'name email role')
    ]);

    // Average attendance rate across campus
    const [attendanceAgg] = await AttendanceRecord.aggregate([
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          present: {
            $sum: {
              $cond: [{ $in: ['$status', ['present', 'excused']] }, 1, 0]
            }
          }
        }
      }
    ]);

    const avgAttendance = attendanceAgg && attendanceAgg.total > 0
      ? Math.round((attendanceAgg.present / attendanceAgg.total) * 100)
      : 85;

    return sendSuccess(res, {
      totalStudents,
      totalFaculty,
      pendingFaculty,
      totalDepartments,
      totalCourses,
      totalEnrollments,
      avgAttendance,
      recentLogs
    }, 'Admin statistics retrieved');
  } catch (error) {
    next(error);
  }
}

// @desc    Get all users with filters and pagination
// @route   GET /api/admin/users
// @access  Private (Admin)
export async function getUsers(req, res, next) {
  try {
    const { role, status, search, page = 1, limit = 20 } = req.query;
    const query = {};

    if (role && role !== 'all') {
      query.role = role;
    }
    if (status && status !== 'all') {
      query.status = status;
    }
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }

    const skip = (parseInt(page, 10) - 1) * parseInt(limit, 10);
    const [users, total] = await Promise.all([
      User.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit, 10)),
      User.countDocuments(query)
    ]);

    // Attach student or faculty profile details
    const userIds = users.map(u => u._id);
    const [studentProfiles, facultyProfiles] = await Promise.all([
      StudentProfile.find({ userId: { $in: userIds } }),
      FacultyProfile.find({ userId: { $in: userIds } })
    ]);

    const studentMap = new Map(studentProfiles.map(p => [String(p.userId), p]));
    const facultyMap = new Map(facultyProfiles.map(p => [String(p.userId), p]));

    const usersWithProfiles = users.map(u => ({
      ...u.toObject(),
      profile: u.role === 'student' ? studentMap.get(String(u._id)) : facultyMap.get(String(u._id))
    }));

    return sendSuccess(res, {
      users: usersWithProfiles,
      pagination: {
        page: parseInt(page, 10),
        limit: parseInt(limit, 10),
        total,
        pages: Math.ceil(total / parseInt(limit, 10))
      }
    }, 'Users retrieved successfully');
  } catch (error) {
    next(error);
  }
}

// @desc    Approve or reject pending faculty registration
// @route   PATCH /api/admin/faculty/:id/approval
// @access  Private (Admin)
export async function updateFacultyApproval(req, res, next) {
  try {
    const { id } = req.params; // Faculty user ID
    const { decision, rejectionReason } = req.body; // 'approve' or 'reject'

    const user = await User.findById(id);
    if (!user || user.role !== 'faculty') {
      return sendError(res, 'Faculty user record not found.', 404);
    }

    const facultyProfile = await FacultyProfile.findOne({ userId: id });
    if (!facultyProfile) {
      return sendError(res, 'Faculty profile not found.', 404);
    }

    if (decision === 'approve') {
      user.status = 'active';
      await user.save();

      facultyProfile.approvalStatus = 'approved';
      facultyProfile.approvedBy = req.user._id;
      facultyProfile.approvedAt = new Date();
      facultyProfile.rejectionReason = undefined;
      await facultyProfile.save();

      await Notification.create({
        user: user._id,
        title: 'Faculty Account Approved',
        message: 'Your faculty account has been approved by the administrator. You may now access all faculty teaching tools.',
        type: 'system',
        link: '/faculty/dashboard'
      });

      await logAudit({
        userId: req.user._id,
        action: 'APPROVE_FACULTY',
        entity: 'FacultyProfile',
        entityId: facultyProfile._id,
        details: { facultyEmail: user.email, facultyName: user.name },
        req
      });

      return sendSuccess(res, { user, facultyProfile }, 'Faculty member approved successfully');
    } else if (decision === 'reject') {
      user.status = 'deactivated';
      await user.save();

      facultyProfile.approvalStatus = 'rejected';
      facultyProfile.rejectionReason = rejectionReason || 'Qualifications or credentials could not be verified.';
      await facultyProfile.save();

      await logAudit({
        userId: req.user._id,
        action: 'REJECT_FACULTY',
        entity: 'FacultyProfile',
        entityId: facultyProfile._id,
        details: { facultyEmail: user.email, reason: rejectionReason },
        req
      });

      return sendSuccess(res, { user, facultyProfile }, 'Faculty registration rejected.');
    } else {
      return sendError(res, "Decision must be either 'approve' or 'reject'.", 400);
    }
  } catch (error) {
    next(error);
  }
}

// @desc    Activate or deactivate user account
// @route   PATCH /api/admin/users/:id/status
// @access  Private (Admin)
export async function toggleUserStatus(req, res, next) {
  try {
    const { id } = req.params;
    const { status } = req.body; // 'active' or 'deactivated'

    if (!['active', 'deactivated'].includes(status)) {
      return sendError(res, 'Status must be active or deactivated', 400);
    }

    if (String(req.user._id) === String(id) && status === 'deactivated') {
      return sendError(res, 'You cannot deactivate your own administrative account.', 400);
    }

    const user = await User.findById(id);
    if (!user) {
      return sendError(res, 'User not found', 404);
    }

    user.status = status;
    await user.save();

    await logAudit({
      userId: req.user._id,
      action: status === 'active' ? 'ACTIVATE_USER' : 'DEACTIVATE_USER',
      entity: 'User',
      entityId: user._id,
      details: { targetEmail: user.email, targetRole: user.role },
      req
    });

    return sendSuccess(res, user, `User account ${status} successfully`);
  } catch (error) {
    next(error);
  }
}

// @desc    Get audit logs
// @route   GET /api/admin/audit-logs
// @access  Private (Admin)
export async function getAuditLogs(req, res, next) {
  try {
    const { page = 1, limit = 50, action } = req.query;
    const query = {};
    if (action) {
      query.action = action;
    }

    const skip = (parseInt(page, 10) - 1) * parseInt(limit, 10);
    const [logs, total] = await Promise.all([
      AuditLog.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit, 10))
        .populate('user', 'name email role'),
      AuditLog.countDocuments(query)
    ]);

    return sendSuccess(res, {
      logs,
      pagination: {
        page: parseInt(page, 10),
        limit: parseInt(limit, 10),
        total,
        pages: Math.ceil(total / parseInt(limit, 10))
      }
    }, 'Audit logs retrieved');
  } catch (error) {
    next(error);
  }
}

// @desc    Provision a new administrator account (securely by an existing admin)
// @route   POST /api/admin/create-admin
// @access  Private (Admin)
export async function createAdmin(req, res, next) {
  try {
    const { name, email, password } = req.body;

    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) {
      return sendError(res, 'An account with this email already exists.', 400);
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    const admin = await User.create({
      name,
      email: email.toLowerCase(),
      passwordHash,
      role: 'admin',
      status: 'active',
      isVerified: true
    });

    await logAudit({
      userId: req.user._id,
      action: 'CREATE_ADMIN',
      entity: 'User',
      entityId: admin._id,
      details: { adminEmail: admin.email },
      req
    });

    return res.status(201).json({
      success: true,
      message: 'New administrator created successfully',
      admin: {
        _id: admin._id,
        name: admin.name,
        email: admin.email,
        role: admin.role
      }
    });
  } catch (error) {
    next(error);
  }
}
