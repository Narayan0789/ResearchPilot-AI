import express from 'express';
import {
  getProjects,
  createProject,
  getProject,
  updateProject,
  deleteProject,
} from '../controllers/projectController.js';
import {
  uploadPdfSource,
  ingestUrlSource,
  getProjectSources,
} from '../controllers/sourceController.js';
import {
  runResearchQuery,
  postChatMessage,
  getProjectConversations,
  getProjectResearchRuns,
} from '../controllers/researchController.js';
import {
  generateProjectReport,
  getProjectReports,
} from '../controllers/reportController.js';
import { requireAuth } from '../middleware/auth.js';
import { uploadPdf } from '../middleware/upload.js';
import { researchLimiter } from '../middleware/rateLimiter.js';
import {
  validateBody,
  createProjectSchema,
  updateProjectSchema,
  ingestUrlSchema,
  researchQuerySchema,
  chatMessageSchema,
  createReportSchema,
} from '../validators/index.js';

const router = express.Router();

// All project routes require authentication
router.use(requireAuth);

// Project CRUD
router.get('/', getProjects);
router.post('/', validateBody(createProjectSchema), createProject);
router.get('/:id', getProject);
router.patch('/:id', validateBody(updateProjectSchema), updateProject);
router.delete('/:id', deleteProject);

// Sources under Project
router.post('/:id/sources/upload', uploadPdf.single('file'), uploadPdfSource);
router.post('/:id/sources/url', validateBody(ingestUrlSchema), ingestUrlSource);
router.get('/:id/sources', getProjectSources);

// Research and Chat under Project
router.post('/:id/research', researchLimiter, validateBody(researchQuerySchema), runResearchQuery);
router.post('/:id/chat', researchLimiter, validateBody(chatMessageSchema), postChatMessage);
router.get('/:id/conversations', getProjectConversations);
router.get('/:id/research-runs', getProjectResearchRuns);

// Reports under Project
router.post('/:id/reports', validateBody(createReportSchema), generateProjectReport);
router.get('/:id/reports', getProjectReports);

export default router;
