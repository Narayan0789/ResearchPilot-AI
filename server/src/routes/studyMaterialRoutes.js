import express from 'express';
import { uploadStudyMaterial, getStudyMaterials } from '../controllers/studyAssistantController.js';
import { protect } from '../middleware/auth.js';
import { authorizeRoles } from '../middleware/rbac.js';
import { upload } from '../middleware/upload.js';

const router = express.Router();

router.use(protect);

router.post('/', authorizeRoles('faculty', 'admin'), upload.single('document'), uploadStudyMaterial);
router.get('/', getStudyMaterials);

export default router;
