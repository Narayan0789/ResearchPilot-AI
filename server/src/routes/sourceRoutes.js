import express from 'express';
import {
  getSource,
  getSourcePage,
  getSourceFile,
  deleteSource,
} from '../controllers/sourceController.js';
import { requireAuth } from '../middleware/auth.js';

const router = express.Router();

router.use(requireAuth);

router.get('/:id', getSource);
router.get('/:id/pages/:pageNumber', getSourcePage);
router.get('/:id/file', getSourceFile);
router.delete('/:id', deleteSource);

export default router;
