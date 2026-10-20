import express from 'express';
import authRoutes from './authRoutes.js';
import projectRoutes from './projectRoutes.js';
import sourceRoutes from './sourceRoutes.js';
import researchRoutes from './researchRoutes.js';
import healthRoutes from './healthRoutes.js';

const router = express.Router();

router.use('/health', healthRoutes);
router.use('/auth', authRoutes);
router.use('/projects', projectRoutes);
router.use('/sources', sourceRoutes);
router.use('/', researchRoutes);

export default router;
