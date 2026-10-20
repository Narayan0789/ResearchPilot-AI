import express from 'express';
import {
  getConversationMessages,
  getResearchRun,
} from '../controllers/researchController.js';
import { getReport } from '../controllers/reportController.js';
import { requireAuth } from '../middleware/auth.js';

const router = express.Router();

router.use(requireAuth);

router.get('/conversations/:id/messages', getConversationMessages);
router.get('/research-runs/:id', getResearchRun);
router.get('/reports/:id', getReport);

export default router;
