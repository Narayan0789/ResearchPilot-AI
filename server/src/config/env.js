import dotenv from 'dotenv';
dotenv.config();

const requiredEnvVars = ['PORT', 'MONGODB_URI', 'JWT_SECRET'];

export function validateEnv() {
  const missing = [];
  for (const envVar of requiredEnvVars) {
    if (!process.env[envVar]) {
      missing.push(envVar);
    }
  }

  if (missing.length > 0) {
    console.error(`FATAL: Missing required environment variables: ${missing.join(', ')}`);
    console.error('Please check your server/.env file.');
    process.exit(1);
  }
}

export const env = {
  port: parseInt(process.env.PORT || '5000', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  clientUrl: process.env.CLIENT_URL || process.env.FRONTEND_URL || 'http://localhost:5173',
  mongodbUri: process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/personal_research_ai',
  jwtSecret: process.env.JWT_SECRET || 'researchpilot_super_secret_jwt_key_2026_secure_hash_894321',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
  uploadDir: process.env.UPLOAD_DIR || 'uploads',
  maxUploadMb: parseInt(process.env.MAX_UPLOAD_MB || '20', 10),
  llmApiKey: process.env.LLM_API_KEY || '',
  llmProvider: process.env.LLM_PROVIDER || 'local',
  embeddingApiKey: process.env.EMBEDDING_API_KEY || '',
  embeddingProvider: process.env.EMBEDDING_PROVIDER || 'local',
  webSearchApiKey: process.env.WEB_SEARCH_API_KEY || '',
  webSearchProvider: process.env.WEB_SEARCH_PROVIDER || 'duckduckgo',
  googleClientId: process.env.GOOGLE_CLIENT_ID || '',
};
