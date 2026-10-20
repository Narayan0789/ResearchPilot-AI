import { validateEnv, env } from './config/env.js';
import { connectDB } from './config/db.js';
import app from './app.js';
import logger from './utils/logger.js';

// Validate environment variables on startup
validateEnv();

const PORT = env.port || 5000;

async function startServer() {
  try {
    // Connect to MongoDB
    await connectDB();

    const server = app.listen(PORT, () => {
      console.log(`\n======================================================`);
      console.log(`🔬 ResearchPilot AI Server running on port ${PORT}`);
      console.log(`📡 Environment: ${env.nodeEnv}`);
      console.log(`🔗 API Base: http://localhost:${PORT}/api/v1`);
      console.log(`🏥 Health Check: http://localhost:${PORT}/api/v1/health`);
      console.log(`======================================================\n`);
    });

    // Graceful shutdown handling
    const handleShutdown = (signal) => {
      logger.info(`Received ${signal}. Gracefully closing HTTP server...`);
      server.close(() => {
        logger.info('HTTP server closed.');
        process.exit(0);
      });
    };

    process.on('SIGTERM', () => handleShutdown('SIGTERM'));
    process.on('SIGINT', () => handleShutdown('SIGINT'));
  } catch (error) {
    logger.error(`Failed to start server: ${error.message}`);
    process.exit(1);
  }
}

startServer();
