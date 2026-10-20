import express from 'express';
import {
  createAssignment,
  getAssignmentsByCourse,
  getMyStudentAssignments,
  submitAssignment,
  gradeSubmission,
  getSubmissionsForAssignment
} from '../controllers/assignmentController.js';
import { protect } from '../middleware/auth.js';
import { authorizeRoles } from '../middleware/rbac.js';
import { upload } from '../middleware/upload.js';

const router = express.Router();

router.use(protect);

router.post('/', authorizeRoles('faculty', 'admin'), upload.single('attachment'), createAssignment);
router.get('/course/:courseId', getAssignmentsByCourse);
router.get('/my-assignments', authorizeRoles('student'), getMyStudentAssignments);
router.post('/:id/submit', authorizeRoles('student'), upload.single('submissionFile'), submitAssignment);
router.post('/submissions/:submissionId/grade', authorizeRoles('faculty', 'admin'), gradeSubmission);
router.get('/:id/submissions', authorizeRoles('faculty', 'admin'), getSubmissionsForAssignment);

export default router;
