import 'dotenv/config';
import { z } from 'zod';

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().positive().default(5000),
  SQLITE_PATH: z.string().min(1).default('./data/college.db'),
  TURSO_DATABASE_URL: z.string().min(1).optional(),
  TURSO_AUTH_TOKEN: z.string().min(1).optional(),
  JWT_SECRET: z.string().min(32, 'JWT_SECRET must be at least 32 characters.'),
  CLIENT_ORIGINS: z.string().default('http://localhost:5173'),
  COOKIE_SAMESITE: z.enum(['lax', 'strict', 'none']).default('lax'),
  COOKIE_SECURE: z.enum(['true', 'false']).optional(),
  UPLOAD_DIR: z.string().default('uploads'),
});

const parsed = envSchema.safeParse(process.env);
if (!parsed.success) {
  const fields = Object.keys(parsed.error.flatten().fieldErrors).join(', ');
  throw new Error(`Invalid environment configuration for: ${fields || 'unknown settings'}.`);
}

if (parsed.data.NODE_ENV === 'production' && (!parsed.data.TURSO_DATABASE_URL || !parsed.data.TURSO_AUTH_TOKEN)) {
  throw new Error('TURSO_DATABASE_URL and TURSO_AUTH_TOKEN must be configured in production.');
}
if (parsed.data.NODE_ENV === 'production' && !/^(libsql|https):\/\//.test(parsed.data.TURSO_DATABASE_URL)) {
  throw new Error('TURSO_DATABASE_URL must use a remote libSQL endpoint in production.');
}

export const env = {
  ...parsed.data,
  COOKIE_SECURE: parsed.data.COOKIE_SECURE === undefined
    ? parsed.data.NODE_ENV === 'production'
    : parsed.data.COOKIE_SECURE === 'true',
  CLIENT_ORIGINS: parsed.data.CLIENT_ORIGINS.split(',').map((origin) => origin.trim()).filter(Boolean),
};