import express from 'express';
import {
  uploadAndAnalyzeResume,
  getCareerProfile,
  getJobs,
  createJob,
  applyToJob,
  triggerLiveJobSync,
  evaluateMockInterview
} from '../controllers/careerController.js';
import { protect } from '../middleware/auth.js';
import { authorizeRoles } from '../middleware/rbac.js';
import { upload } from '../middleware/upload.js';
import { aiLimiter } from '../middleware/rateLimiter.js';

const router = express.Router();

router.use(protect);

router.post('/resume', authorizeRoles('student'), upload.single('resume'), uploadAndAnalyzeResume);
router.get('/profile', authorizeRoles('student'), getCareerProfile);
router.get('/jobs', getJobs);
router.post('/jobs', authorizeRoles('faculty', 'admin'), createJob);
router.post('/jobs/sync-live', triggerLiveJobSync);
router.post('/jobs/:id/apply', authorizeRoles('student'), applyToJob);
router.post('/mock-interview/evaluate', authorizeRoles('student'), aiLimiter, evaluateMockInterview);

export default router;
