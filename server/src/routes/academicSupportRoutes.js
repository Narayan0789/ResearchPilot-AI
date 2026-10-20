import express from 'express';
import {
  getStudentSuccessOverview,
  getFacultyClassInsights,
  setAcademicGoal
} from '../controllers/academicSupportController.js';
import { protect } from '../middleware/auth.js';
import { authorizeRoles } from '../middleware/rbac.js';

const router = express.Router();

router.use(protect);

router.get('/student-overview', authorizeRoles('student'), getStudentSuccessOverview);
router.get('/faculty-insights', authorizeRoles('faculty', 'admin'), getFacultyClassInsights);
router.post('/goals', authorizeRoles('student'), setAcademicGoal);

export default router;
