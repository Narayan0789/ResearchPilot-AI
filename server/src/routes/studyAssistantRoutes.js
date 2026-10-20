import express from 'express';
import {
  chatWithStudyAssistant,
  getConversations,
  getConversationMessages,
  generatePracticeQuiz
} from '../controllers/studyAssistantController.js';
import { protect } from '../middleware/auth.js';
import { aiLimiter } from '../middleware/rateLimiter.js';

const router = express.Router();

router.use(protect);

router.post('/chat', aiLimiter, chatWithStudyAssistant);
router.get('/conversations', getConversations);
router.get('/conversations/:id/messages', getConversationMessages);
router.post('/generate-quiz', aiLimiter, generatePracticeQuiz);

export default router;
