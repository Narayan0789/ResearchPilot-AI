import { Notification, Announcement, User } from '../models/index.js';
import { sendSuccess, sendError } from '../utils/apiResponse.js';
import { logAudit } from '../utils/auditLogger.js';

// ======================== NOTIFICATIONS ========================

// @desc    Get current user's notifications and unread count
// @route   GET /api/notifications
// @access  Private
export async function getMyNotifications(req, res, next) {
  try {
    const [notifications, unreadCount] = await Promise.all([
      Notification.find({ user: req.user._id }).sort({ createdAt: -1 }).limit(40),
      Notification.countDocuments({ user: req.user._id, read: false })
    ]);

    return sendSuccess(res, { notifications, unreadCount }, 'Notifications retrieved');
  } catch (error) {
    next(error);
  }
}

// @desc    Mark a single notification as read
// @route   PATCH /api/notifications/:id/read
// @access  Private
export async function markNotificationAsRead(req, res, next) {
  try {
    const notification = await Notification.findOneAndUpdate(
      { _id: req.params.id, user: req.user._id },
      { read: true },
      { new: true }
    );

    if (!notification) {
      return sendError(res, 'Notification not found', 404);
    }

    return sendSuccess(res, notification, 'Notification marked as read');
  } catch (error) {
    next(error);
  }
}

// @desc    Mark all user notifications as read
// @route   PATCH /api/notifications/mark-all-read
// @access  Private
export async function markAllNotificationsAsRead(req, res, next) {
  try {
    await Notification.updateMany({ user: req.user._id, read: false }, { read: true });
    return sendSuccess(res, null, 'All notifications marked as read');
  } catch (error) {
    next(error);
  }
}

// ======================== ANNOUNCEMENTS ========================

// @desc    Get announcements relevant to user's role
// @route   GET /api/announcements
// @access  Private
export async function getAnnouncements(req, res, next) {
  try {
    const role = req.user.role;
    const query = {
      $or: [
        { targetRole: 'all' },
        { targetRole: role }
      ]
    };

    const announcements = await Announcement.find(query)
      .sort({ pinned: -1, createdAt: -1 })
      .populate('author', 'name email role')
      .populate('department', 'code name')
      .populate('course', 'code name');

    return sendSuccess(res, announcements, 'Announcements retrieved');
  } catch (error) {
    next(error);
  }
}

// @desc    Create an institutional or course announcement
// @route   POST /api/announcements
// @access  Private (Faculty, Admin)
export async function createAnnouncement(req, res, next) {
  try {
    const { title, content, targetRole, departmentId, courseId, priority, pinned } = req.body;

    const announcement = await Announcement.create({
      title,
      content,
      author: req.user._id,
      targetRole: targetRole || 'all',
      department: departmentId || null,
      course: courseId || null,
      priority: priority || 'medium',
      pinned: pinned === true || pinned === 'true'
    });

    // Notify targeted users
    const userQuery = {};
    if (targetRole && targetRole !== 'all') {
      userQuery.role = targetRole;
    }
    const recipients = await User.find(userQuery).select('_id');
    const notifs = recipients.slice(0, 100).map(u => ({
      user: u._id,
      title: `Campus Announcement: ${title}`,
      message: content.slice(0, 150) + (content.length > 150 ? '...' : ''),
      type: 'announcement',
      link: '/announcements'
    }));

    if (notifs.length > 0) {
      await Notification.insertMany(notifs);
    }

    await logAudit({
      userId: req.user._id,
      action: 'CREATE_ANNOUNCEMENT',
      entity: 'Announcement',
      entityId: announcement._id,
      details: { title, targetRole },
      req
    });

    return res.status(201).json({
      success: true,
      message: 'Announcement broadcasted successfully',
      data: announcement
    });
  } catch (error) {
    next(error);
  }
}
