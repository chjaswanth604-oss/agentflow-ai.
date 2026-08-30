const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env'), override: true });
require('dotenv').config({ path: path.join(__dirname, '../../../.env'), override: true });

module.exports = {
  PORT: process.env.PORT || 5000,
  NODE_ENV: process.env.NODE_ENV || 'development',
  MONGO_URI: process.env.MONGO_URI || 'mongodb://localhost:27017/agentflow_ai',
  JWT_SECRET: process.env.JWT_SECRET || 'agentflow_secret_jwt_key_2026_super_secure',
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '24h',
  REDIS_URL: process.env.REDIS_URL || 'redis://localhost:6379',
  CREDENTIAL_ENCRYPTION_KEY: process.env.CREDENTIAL_ENCRYPTION_KEY || '12345678901234567890123456789012', // 32 chars for AES-256
  CLIENT_URL: process.env.CLIENT_URL || 'http://localhost:3000',
  OPENROUTER_API_KEY: process.env.OPENROUTER_API_KEY || '',
  GEMINI_API_KEY: process.env.GEMINI_API_KEY || '',
  GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID || '',
  GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET || '',
  GOOGLE_CALLBACK_URL: process.env.GOOGLE_CALLBACK_URL || 'http://localhost:5000/api/integrations/oauth/google/callback',
  SUPABASE_URL: process.env.SUPABASE_URL || '',
  SUPABASE_ANON_KEY: process.env.SUPABASE_ANON_KEY || '',
  SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY || ''
};
