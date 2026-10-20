import { User, StudentProfile, FacultyProfile } from '../models/index.js';
import { sendSuccess, sendError } from '../utils/apiResponse.js';
import { logAudit } from '../utils/auditLogger.js';

// @desc    Update authenticated user's profile
// @route   PATCH /api/users/profile
// @access  Private
export async function updateProfile(req, res, next) {
  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      return sendError(res, 'User not found', 404);
    }

    // Editable basic user fields
    if (req.body.name) user.name = req.body.name.trim();
    if (req.body.notificationPreferences) {
      user.notificationPreferences = {
        ...user.notificationPreferences,
        ...req.body.notificationPreferences
      };
    }

    // Handle avatar upload if provided
    if (req.file) {
      user.avatar = `/uploads/${req.file.filename}`;
    }

    await user.save();

    let updatedProfile = null;

    if (user.role === 'student') {
      const studentFields = {};
      if (req.body.phone) studentFields.phone = req.body.phone;
      if (req.body.skills) {
        studentFields.skills = Array.isArray(req.body.skills) ? req.body.skills : req.body.skills.split(',').map(s => s.trim());
      }
      if (req.body.careerInterests) {
        studentFields.careerInterests = Array.isArray(req.body.careerInterests) ? req.body.careerInterests : req.body.careerInterests.split(',').map(s => s.trim());
      }

      updatedProfile = await StudentProfile.findOneAndUpdate(
        { userId: user._id },
        { $set: studentFields },
        { new: true }
      );
    } else if (user.role === 'faculty') {
      const facultyFields = {};
      if (req.body.officeHours) facultyFields.officeHours = req.body.officeHours;
      if (req.body.qualifications) {
        facultyFields.qualifications = Array.isArray(req.body.qualifications) ? req.body.qualifications : req.body.qualifications.split(',').map(s => s.trim());
      }

      updatedProfile = await FacultyProfile.findOneAndUpdate(
        { userId: user._id },
        { $set: facultyFields },
        { new: true }
      );
    }

    await logAudit({
      userId: user._id,
      action: 'UPDATE_PROFILE',
      entity: 'User',
      entityId: user._id,
      req
    });

    return sendSuccess(res, {
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        avatar: user.avatar,
        notificationPreferences: user.notificationPreferences,
        profile: updatedProfile
      }
    }, 'Profile updated successfully');
  } catch (error) {
    next(error);
  }
}
