import express from 'express';
import {
  createAssessment,
  getAssessmentsByCourse,
  getAssessmentForTaking,
  submitAssessmentAttempt
} from '../controllers/assessmentController.js';
import { protect } from '../middleware/auth.js';
import { authorizeRoles } from '../middleware/rbac.js';

const router = express.Router();

router.use(protect);

router.post('/', authorizeRoles('faculty', 'admin'), createAssessment);
router.get('/course/:courseId', getAssessmentsByCourse);
router.get('/:id/take', authorizeRoles('student'), getAssessmentForTaking);
router.post('/:id/submit', authorizeRoles('student'), submitAssessmentAttempt);

export default router;
