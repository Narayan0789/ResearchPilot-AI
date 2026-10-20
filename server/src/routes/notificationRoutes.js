import express from 'express';
import {
  getMyNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead
} from '../controllers/communicationController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

router.use(protect);

router.get('/', getMyNotifications);
router.patch('/mark-all-read', markAllNotificationsAsRead);
router.patch('/:id/read', markNotificationAsRead);

export default router;
