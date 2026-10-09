import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import hpp from 'hpp';
import cookieParser from 'cookie-parser';
import pinoHttp from 'pino-http';
import path from 'node:path';
import { env } from './config/env.js';
import { apiRouter } from './routes/index.js';
import { globalLimiter } from './middleware/rateLimits.js';
import { errorHandler, notFound } from './middleware/errorHandler.js';
import { sanitizeInput } from './middleware/sanitize.js';

export const app = express();
app.disable('x-powered-by');
app.set('trust proxy', env.NODE_ENV === 'production' ? 1 : false);
app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
app.use(cors({ origin: (origin, callback) => {
  if (!origin || env.CLIENT_ORIGINS.includes(origin)) return callback(null, true);
  const error = new Error('Origin is not allowed by CORS.');
  error.code = 'CORS_ORIGIN_DENIED';
  error.status = 403;
  callback(error);
}, credentials: true }));
app.use(pinoHttp({ enabled: env.NODE_ENV !== 'test', redact: ['req.headers.cookie', 'req.headers.authorization'], serializers: {
  req: (req) => ({ method: req.method, url: req.url, remoteAddress: req.remoteAddress }),
  res: (res) => ({ statusCode: res.statusCode }),
} }));
app.use(express.json({ limit: '100kb' }));
app.use(cookieParser());
app.use(hpp());
app.use(sanitizeInput);
app.use('/api', globalLimiter, apiRouter);
app.use('/uploads', helmet.contentSecurityPolicy({ directives: { defaultSrc: ["'none'"], sandbox: [], 'form-action': ["'none'"] } }), express.static(path.resolve(env.UPLOAD_DIR), { dotfiles: 'deny', index: false, setHeaders: (res, filePath) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  if (filePath.toLowerCase().endsWith('.pdf')) res.setHeader('Content-Disposition', 'inline');
} }));
app.use('/api/uploads', helmet.contentSecurityPolicy({ directives: { defaultSrc: ["'none'"], sandbox: [], 'form-action': ["'none'"] } }), express.static(path.resolve(env.UPLOAD_DIR), { dotfiles: 'deny', index: false, setHeaders: (res, filePath) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  if (filePath.toLowerCase().endsWith('.pdf')) res.setHeader('Content-Disposition', 'inline');
} }));
app.use(notFound);
app.use(errorHandler);

export default app;