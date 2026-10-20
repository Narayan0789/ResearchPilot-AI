import { Course, Enrollment, Department, User, StudyMaterial, Assignment } from '../models/index.js';
import { sendSuccess, sendError } from '../utils/apiResponse.js';
import { logAudit } from '../utils/auditLogger.js';

// @desc    Get all active courses with optional filters
// @route   GET /api/courses
// @access  Private
export async function getCourses(req, res, next) {
  try {
    const { department, semester, search } = req.query;
    const query = { isActive: true };

    if (department) query.department = department;
    if (semester) query.semester = Number(semester);
    if (search) {
      query.$or = [
        { code: { $regex: search, $options: 'i' } },
        { name: { $regex: search, $options: 'i' } }
      ];
    }

    const courses = await Course.find(query)
      .populate('department', 'code name')
      .populate('faculty', 'name email');

    return sendSuccess(res, courses, 'Courses retrieved');
  } catch (error) {
    next(error);
  }
}

// @desc    Get course details by ID
// @route   GET /api/courses/:id
// @access  Private
export async function getCourseById(req, res, next) {
  try {
    const { id } = req.params;
    const course = await Course.findById(id)
      .populate('department', 'code name')
      .populate('faculty', 'name email avatar');

    if (!course) {
      return sendError(res, 'Course not found', 404);
    }

    const [enrolledCount, studyMaterials, assignments] = await Promise.all([
      Enrollment.countDocuments({ course: id, status: 'enrolled' }),
      StudyMaterial.find({ course: id }).select('title fileName fileUrl createdAt uploadedBy').populate('uploadedBy', 'name'),
      Assignment.find({ course: id, isPublished: true }).select('title dueDate maxMarks createdAt')
    ]);

    // Check if the current user is enrolled (if student)
    let isEnrolled = false;
    if (req.user.role === 'student') {
      const enrollment = await Enrollment.findOne({ course: id, student: req.user._id, status: 'enrolled' });
      isEnrolled = !!enrollment;
    }

    return sendSuccess(res, {
      course,
      enrolledCount,
      studyMaterials,
      assignments,
      isEnrolled
    }, 'Course details retrieved');
  } catch (error) {
    next(error);
  }
}

// @desc    Create a new course
// @route   POST /api/courses
// @access  Private (Admin)
export async function createCourse(req, res, next) {
  try {
    const { code, name, department, semester, credits, description, syllabus, faculty, schedule } = req.body;

    const existing = await Course.findOne({ code: code.toUpperCase() });
    if (existing) {
      return sendError(res, 'Course code already exists.', 400);
    }

    const course = await Course.create({
      code: code.toUpperCase(),
      name,
      department,
      semester: Number(semester),
      credits: Number(credits) || 3,
      description: description || '',
      syllabus: syllabus || '',
      faculty: faculty || [],
      schedule: schedule || []
    });

    await logAudit({
      userId: req.user._id,
      action: 'CREATE_COURSE',
      entity: 'Course',
      entityId: course._id,
      details: { code: course.code, name: course.name },
      req
    });

    return res.status(201).json({
      success: true,
      message: 'Course created successfully',
      data: course
    });
  } catch (error) {
    next(error);
  }
}

// @desc    Update course
// @route   PUT /api/courses/:id
// @access  Private (Admin or Assigned Faculty)
export async function updateCourse(req, res, next) {
  try {
    const { id } = req.params;
    const course = await Course.findById(id);
    if (!course) {
      return sendError(res, 'Course not found', 404);
    }

    // Role check: Only admin or assigned faculty
    if (req.user.role !== 'admin' && !course.faculty.some(f => String(f) === String(req.user._id))) {
      return sendError(res, 'You are not authorized to modify this course.', 403);
    }

    const updated = await Course.findByIdAndUpdate(id, req.body, { new: true, runValidators: true });

    await logAudit({
      userId: req.user._id,
      action: 'UPDATE_COURSE',
      entity: 'Course',
      entityId: id,
      details: { code: course.code },
      req
    });

    return sendSuccess(res, updated, 'Course updated successfully');
  } catch (error) {
    next(error);
  }
}

// @desc    Enroll authenticated student in a course
// @route   POST /api/courses/:id/enroll
// @access  Private (Student)
export async function enrollCourse(req, res, next) {
  try {
    const courseId = req.params.id;
    const course = await Course.findById(courseId);
    if (!course || !course.isActive) {
      return sendError(res, 'Course not found or inactive', 404);
    }

    const existingEnrollment = await Enrollment.findOne({
      student: req.user._id,
      course: courseId,
      academicYear: '2025-2026'
    });

    if (existingEnrollment) {
      if (existingEnrollment.status === 'enrolled') {
        return sendError(res, 'You are already actively enrolled in this course.', 400);
      }
      existingEnrollment.status = 'enrolled';
      await existingEnrollment.save();
      return sendSuccess(res, existingEnrollment, 'Re-enrolled in course successfully');
    }

    const enrollment = await Enrollment.create({
      student: req.user._id,
      course: courseId,
      semester: course.semester,
      academicYear: '2025-2026',
      status: 'enrolled'
    });

    await logAudit({
      userId: req.user._id,
      action: 'ENROLL_COURSE',
      entity: 'Enrollment',
      entityId: enrollment._id,
      details: { courseCode: course.code },
      req
    });

    return res.status(201).json({
      success: true,
      message: `Enrolled in ${course.code} - ${course.name} successfully`,
      data: enrollment
    });
  } catch (error) {
    next(error);
  }
}

// @desc    Get courses enrolled by current student
// @route   GET /api/courses/my/enrolled
// @access  Private (Student)
export async function getMyEnrolledCourses(req, res, next) {
  try {
    const enrollments = await Enrollment.find({
      student: req.user._id,
      status: 'enrolled'
    }).populate({
      path: 'course',
      populate: [
        { path: 'department', select: 'code name' },
        { path: 'faculty', select: 'name email' }
      ]
    });

    const courses = enrollments
      .filter(e => e.course != null)
      .map(e => ({
        enrollmentId: e._id,
        enrolledAt: e.enrolledAt,
        ...e.course.toObject()
      }));

    return sendSuccess(res, courses, 'Enrolled courses retrieved');
  } catch (error) {
    next(error);
  }
}

// @desc    Get courses assigned to current faculty
// @route   GET /api/courses/my/assigned
// @access  Private (Faculty)
export async function getMyAssignedCourses(req, res, next) {
  try {
    const courses = await Course.find({
      faculty: req.user._id,
      isActive: true
    }).populate('department', 'code name');

    // Attach student enrollment count
    const courseIds = courses.map(c => c._id);
    const enrollmentCounts = await Enrollment.aggregate([
      { $match: { course: { $in: courseIds }, status: 'enrolled' } },
      { $group: { _id: '$course', count: { $sum: 1 } } }
    ]);
    const countMap = new Map(enrollmentCounts.map(item => [String(item._id), item.count]));

    const result = courses.map(c => ({
      ...c.toObject(),
      studentCount: countMap.get(String(c._id)) || 0
    }));

    return sendSuccess(res, result, 'Assigned courses retrieved');
  } catch (error) {
    next(error);
  }
}
