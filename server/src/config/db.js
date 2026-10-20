import mongoose from 'mongoose';
import dns from 'node:dns';
import { env } from './env.js';

// Configure standard DNS resolvers to prevent Windows SRV ECONNREFUSED issues on mongodb+srv://
try {
  dns.setServers(['8.8.8.8', '1.1.1.1']);
} catch {
  // Ignore if running in constrained environment
}

export async function connectDB() {
  try {
    const conn = await mongoose.connect(env.mongodbUri, {
      serverSelectionTimeoutMS: 5000,
    });
    console.log(`[MongoDB] Connected successfully: ${conn.connection.host}/${conn.connection.name}`);
    return conn;
  } catch (error) {
    console.error(`[MongoDB] Connection error: ${error.message}`);
    // If local mongodb is not running or URI invalid, log details
    console.warn('[MongoDB] Make sure MongoDB is running or configure MONGODB_URI in .env');
    throw error;
  }
}

mongoose.connection.on('disconnected', () => {
  console.warn('[MongoDB] Connection lost. Attempting to reconnect...');
});

mongoose.connection.on('error', (err) => {
  console.error('[MongoDB] Connection error:', err);
});
