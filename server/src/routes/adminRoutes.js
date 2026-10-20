import express from 'express';
import {
  getAdminStats,
  getUsers,
  updateFacultyApproval,
  toggleUserStatus,
  getAuditLogs,
  createAdmin
} from '../controllers/adminController.js';
import { protect } from '../middleware/auth.js';
import { authorizeRoles } from '../middleware/rbac.js';

const router = express.Router();

router.use(protect);
router.use(authorizeRoles('admin'));

router.get('/stats', getAdminStats);
router.get('/users', getUsers);
router.patch('/faculty/:id/approval', updateFacultyApproval);
router.patch('/users/:id/status', toggleUserStatus);
router.get('/audit-logs', getAuditLogs);
router.post('/create-admin', createAdmin);

export default router;
