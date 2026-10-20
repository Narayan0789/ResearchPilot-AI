import express from 'express';
import { getDepartments, createDepartment, updateDepartment } from '../controllers/departmentController.js';
import { protect } from '../middleware/auth.js';
import { authorizeRoles } from '../middleware/rbac.js';

const router = express.Router();

router.get('/', protect, getDepartments);
router.post('/', protect, authorizeRoles('admin'), createDepartment);
router.put('/:id', protect, authorizeRoles('admin'), updateDepartment);

export default router;
