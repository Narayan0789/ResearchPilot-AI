import express from 'express';
import {
  getCourses,
  getCourseById,
  createCourse,
  updateCourse,
  enrollCourse,
  getMyEnrolledCourses,
  getMyAssignedCourses
} from '../controllers/courseController.js';
import { protect } from '../middleware/auth.js';
import { authorizeRoles } from '../middleware/rbac.js';

const router = express.Router();

router.use(protect);

router.get('/', getCourses);
router.get('/my/enrolled', authorizeRoles('student'), getMyEnrolledCourses);
router.get('/my/assigned', authorizeRoles('faculty'), getMyAssignedCourses);
router.get('/:id', getCourseById);
router.post('/', authorizeRoles('admin'), createCourse);
router.put('/:id', authorizeRoles('admin', 'faculty'), updateCourse);
router.post('/:id/enroll', authorizeRoles('student'), enrollCourse);

export default router;
