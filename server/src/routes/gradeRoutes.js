import express from 'express';
import { getMyGrades, updateGradeRecord } from '../controllers/assessmentController.js';
import { protect } from '../middleware/auth.js';
import { authorizeRoles } from '../middleware/rbac.js';

const router = express.Router();

router.use(protect);

router.get('/my-grades', authorizeRoles('student'), getMyGrades);
router.post('/', authorizeRoles('faculty', 'admin'), updateGradeRecord);

export default router;
