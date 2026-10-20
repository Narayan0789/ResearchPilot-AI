import express from 'express';
import mongoose from 'mongoose';

const router = express.Router();

router.get('/', (req, res) => {
  const isDbConnected = mongoose.connection.readyState === 1;

  res.status(isDbConnected ? 200 : 503).json({
    status: isDbConnected ? 'healthy' : 'degraded',
    service: 'ResearchPilot AI Core API',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    uptime: Math.floor(process.uptime()),
    database: {
      status: isDbConnected ? 'connected' : 'disconnected',
      host: mongoose.connection.host || 'unknown',
    },
    system: {
      nodeVersion: process.version,
      memoryUsageMB: Math.round(process.memoryUsage().rss / 1024 / 1024),
    },
  });
});

export default router;
