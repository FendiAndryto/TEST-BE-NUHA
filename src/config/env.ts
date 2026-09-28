import dotenv from 'dotenv';

dotenv.config();

export const ENV = {
  PORT: process.env.PORT ? parseInt(process.env.PORT, 10) : 3000,
  NODE_ENV: process.env.NODE_ENV || 'development',
  DATABASE_URL: process.env.DATABASE_URL || 'postgresql://postgres:password@localhost:5432/test_be_nuha?schema=public',
  JWT_SECRET: process.env.JWT_SECRET || 'nuha_super_secret_jwt_key_2026_xyz',
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '1d',
  PREAUTH_JWT_SECRET: process.env.PREAUTH_JWT_SECRET || 'nuha_preauth_secret_key_2026_abc',
  PREAUTH_JWT_EXPIRES_IN: process.env.PREAUTH_JWT_EXPIRES_IN || '15m'
};
