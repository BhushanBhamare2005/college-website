import jwt from 'jsonwebtoken';
import { User } from '../models/index.js';
import { env } from '../config/env.js';
import { ApiError } from '../utils/ApiError.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export const cookieOptions = {
  httpOnly: true,
  secure: env.COOKIE_SECURE,
  sameSite: env.COOKIE_SAMESITE,
  maxAge: 2 * 60 * 60 * 1000,
  path: '/',
};

export const requireAuth = asyncHandler(async (req, _res, next) => {
  const token = req.cookies?.token;
  if (!token) throw new ApiError(401, 'Please sign in to continue.');
  let payload;
  try { payload = jwt.verify(token, env.JWT_SECRET, { algorithms: ['HS256'] }); }
  catch { throw new ApiError(401, 'Please sign in to continue.'); }
  const user = await User.findById(payload.sub).select('_id name email role accountStatus mustChangePassword');
  if (!user) throw new ApiError(401, 'Please sign in to continue.');
  req.user = user;
  next();
});

export const optionalAuth = asyncHandler(async (req, _res, next) => {
  if (!req.cookies?.token) return next();
  let payload;
  try { payload = jwt.verify(req.cookies.token, env.JWT_SECRET, { algorithms: ['HS256'] }); }
  catch { return next(); }
  req.user = await User.findById(payload.sub).select('_id name email role accountStatus mustChangePassword');
  next();
});

export const requireRole = (...roles) => (req, _res, next) => {
  if (!req.user) return next(new ApiError(401, 'Please sign in to continue.'));
  if (!roles.includes(req.user.role)) return next(new ApiError(403, 'You do not have permission to do that.'));
  next();
};