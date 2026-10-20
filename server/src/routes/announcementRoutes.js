import express from 'express';
import { getAnnouncements, createAnnouncement } from '../controllers/communicationController.js';
import { protect } from '../middleware/auth.js';
import { authorizeRoles } from '../middleware/rbac.js';

const router = express.Router();

router.use(protect);

router.get('/', getAnnouncements);
router.post('/', authorizeRoles('faculty', 'admin'), createAnnouncement);

export default router;
