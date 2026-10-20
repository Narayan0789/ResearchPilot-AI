import express from 'express';
import {
  createAttendanceSession,
  markAttendance,
  getCourseSessions,
  getSessionDetails,
  getStudentAttendanceSummary
} from '../controllers/attendanceController.js';
import { protect } from '../middleware/auth.js';
import { authorizeRoles } from '../middleware/rbac.js';

const router = express.Router();

router.use(protect);

router.post('/sessions', authorizeRoles('faculty', 'admin'), createAttendanceSession);
router.post('/sessions/:id/mark', authorizeRoles('faculty', 'admin'), markAttendance);
router.get('/course/:courseId/sessions', authorizeRoles('faculty', 'admin'), getCourseSessions);
router.get('/sessions/:id', authorizeRoles('faculty', 'admin'), getSessionDetails);
router.get('/my-summary', authorizeRoles('student'), getStudentAttendanceSummary);

export default router;
