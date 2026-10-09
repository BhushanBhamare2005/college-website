import { env } from '../config/env.js';
import { ApiError } from '../utils/ApiError.js';
import { safeEqual } from '../utils/tokens.js';

const cookieOptions = { httpOnly: false, secure: env.COOKIE_SECURE, sameSite: env.COOKIE_SAMESITE, path: '/api', maxAge: 2 * 60 * 60 * 1000 };

export function setCsrfCookie(res, token) {
  res.cookie('csrf', token, cookieOptions);
}

export function csrfProtection(req, _res, next) {
  if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) return next();
  if (!safeEqual(req.cookies?.csrf, req.get('X-CSRF-Token'))) return next(new ApiError(403, 'CSRF token missing or invalid.'));
  next();
}