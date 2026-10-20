import express from 'express';
import { updateProfile } from '../controllers/profileController.js';
import { protect } from '../middleware/auth.js';
import { upload } from '../middleware/upload.js';

const router = express.Router();

router.use(protect);

router.patch('/profile', upload.single('avatar'), updateProfile);

export default router;
