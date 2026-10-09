import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import { countRecords, createRecord, findByField, findRecord, isUniqueViolation, updateRecord } from '../models/index.js';
import { schemas, updateSchemas, contactSchema, loginSchema, passwordSchema, studentSignupSchema } from '../schemas/resources.js';
import { listRecords, getRecord, deleteRecord, modelFor } from '../services/crud.js';
import { dashboardStats, publicStats } from '../services/stats.js';
import { requireAuth, requireRole, cookieOptions, optionalAuth } from '../middleware/auth.js';
import { csrfProtection, setCsrfCookie } from '../middleware/csrf.js';
import { validateBody, validateId } from '../middleware/validate.js';
import { loginLimiter, signupLimiter, contactLimiter, registrationLimiter } from '../middleware/rateLimits.js';
import { uploadFor } from '../middleware/upload.js';
import { ApiError } from '../utils/ApiError.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { createCsrfToken } from '../utils/tokens.js';
import { env } from '../config/env.js';
import { connectDatabase, databaseReady, transaction } from '../config/db.js';

const dummyHash = await bcrypt.hash('timing-protection-only', 12);

export const apiRouter = Router();
const success = (res, data, status = 200, meta) => res.status(status).json({ success: true, data, ...(meta ? { meta } : {}) });
const adminOnly = new Set(['registrations', 'messages', 'users']);
const adminWrite = new Set(['faculty', 'courses', 'labs', 'events', 'registrations', 'messages', 'users']);
const facultyProfileSchema = z.object({
  bio: z.string().trim().max(3000).optional(), photoUrl: z.string().trim().max(1000).optional(),
  experience: z.string().trim().max(120).optional(), specialization: z.string().trim().max(200).optional(),
});

apiRouter.get('/health', asyncHandler(async (req, res) => {
  try {
    await connectDatabase();
    success(res, { status: 'ok', database: databaseReady() ? 'connected' : 'unavailable' });
  } catch (error) {
    req.log?.warn({ databaseError: { name: error.name, code: error.code } }, 'Database health check failed');
    res.status(503).json({ success: false, message: 'Service temporarily unavailable.', data: { status: 'degraded', database: 'unavailable' } });
  }
}));
apiRouter.get('/auth/csrf', (req, res) => {
  const token = createCsrfToken();
  setCsrfCookie(res, token);
  success(res, { csrfToken: token });
});

apiRouter.use(asyncHandler(async (req, _res, next) => {
  try {
    await connectDatabase();
    next();
  } catch (error) {
    req.log?.error({ databaseError: { name: error.name, code: error.code } }, 'Database unavailable');
    throw new ApiError(503, 'Service temporarily unavailable.');
  }
}));

apiRouter.post('/auth/register', csrfProtection, signupLimiter, validateBody(studentSignupSchema), asyncHandler(async (req, res) => {
  const { name, email, password } = req.validatedBody;
  if (await findByField('users', 'email', email)) throw new ApiError(409, 'An account with this email already exists.');
  const user = await createRecord('users', { name, email, passwordHash: await bcrypt.hash(password, 12), role: 'student', accountStatus: 'pending' });
  success(res, { _id: user._id, name: user.name, email: user.email, role: user.role, accountStatus: user.accountStatus }, 201);
}));

apiRouter.post('/auth/login', csrfProtection, loginLimiter, validateBody(loginSchema), asyncHandler(async (req, res) => {
  const { email, password } = req.validatedBody;
  const user = await findByField('users', 'email', email, { includeSensitive: true });
  const valid = await bcrypt.compare(password, user?.passwordHash || dummyHash);
  if (!user || !valid) throw new ApiError(401, 'Invalid email or password.');
  if (user.accountStatus && user.accountStatus !== 'approved') throw new ApiError(403, user.accountStatus === 'rejected' ? 'This account was not approved. Contact the department for help.' : 'Your account is waiting for administrator approval.');
  const token = jwt.sign({ sub: String(user._id), role: user.role }, env.JWT_SECRET, { algorithm: 'HS256', expiresIn: '2h' });
  res.cookie('token', token, cookieOptions);
  success(res, { _id: user._id, name: user.name, email: user.email, role: user.role, accountStatus: user.accountStatus, mustChangePassword: user.mustChangePassword });
}));
apiRouter.post('/auth/logout', csrfProtection, (_req, res) => {
  res.clearCookie('token', { ...cookieOptions, maxAge: undefined });
  success(res, null);
});
apiRouter.get('/auth/me', requireAuth, (req, res) => success(res, {
  _id: req.user._id, name: req.user.name, email: req.user.email, role: req.user.role, accountStatus: req.user.accountStatus, mustChangePassword: req.user.mustChangePassword,
}));
apiRouter.post('/auth/change-password', csrfProtection, requireAuth, validateBody(passwordSchema), asyncHandler(async (req, res) => {
  const user = await findRecord('users', req.user._id, { includeSensitive: true });
  if (!await bcrypt.compare(req.validatedBody.currentPassword, user.passwordHash)) throw new ApiError(400, 'Current password is incorrect.', { currentPassword: 'Current password is incorrect.' });
  await updateRecord('users', user._id, { passwordHash: await bcrypt.hash(req.validatedBody.newPassword, 12), mustChangePassword: false });
  success(res, { changed: true });
}));

apiRouter.get('/dashboard/public-stats', asyncHandler(async (_req, res) => success(res, await publicStats())));
apiRouter.get('/dashboard/stats', requireAuth, requireRole('admin', 'faculty'), asyncHandler(async (_req, res) => success(res, await dashboardStats())));

apiRouter.post('/contact', csrfProtection, contactLimiter, validateBody(contactSchema), asyncHandler(async (req, res) => {
  const { website, ...values } = req.validatedBody;
  if (website) return success(res, { received: true }, 201);
  await createRecord('messages', values);
  success(res, { received: true }, 201);
}));

apiRouter.put('/faculty/me', csrfProtection, requireAuth, requireRole('faculty', 'admin'), validateBody(facultyProfileSchema), asyncHandler(async (req, res) => {
  const profile = await findByField('faculty', 'user', req.user._id);
  if (!profile) throw new ApiError(404, 'No faculty profile is linked to this account.');
  success(res, await updateRecord('faculty', profile._id, req.validatedBody));
}));

apiRouter.post('/events/:id/register', csrfProtection, registrationLimiter, validateId, optionalAuth, validateBody(schemas.registrations), asyncHandler(async (req, res) => {
  const tx = await transaction();
  let committed = false;
  try {
    const event = await findRecord('events', req.params.id, { executor: tx });
    if (!event) throw new ApiError(404, 'Event not found.');
    const now = new Date();
    if (event.deadline < now) throw new ApiError(400, 'Registration for this event has closed.');
    const duplicate = await tx.execute({ sql: 'SELECT id FROM registrations WHERE event = ? AND email = ? LIMIT 1', args: [event._id, req.validatedBody.email] });
    if (duplicate.rows.length) throw new ApiError(409, 'This email is already registered for this event.');
    const updated = await tx.execute({
      sql: 'UPDATE events SET registeredCount = registeredCount + 1, updatedAt = ? WHERE id = ? AND deadline >= ? AND (capacity = 0 OR registeredCount < capacity)',
      args: [now.toISOString(), event._id, now.toISOString()],
    });
    if (!updated.rowsAffected) throw new ApiError(409, 'This event is full or registration has closed.');
    const registration = await createRecord('registrations', {
      ...req.validatedBody, event: event._id, eventTitle: event.title, user: req.user?._id || null,
    }, { executor: tx });
    await tx.commit();
    committed = true;
    success(res, registration, 201);
  } catch (error) {
    if (!committed) await tx.rollback();
    if (isUniqueViolation(error)) throw new ApiError(409, 'This email is already registered for this event.');
    throw error;
  }
}));

apiRouter.post('/uploads/:kind', csrfProtection, requireAuth, asyncHandler(async (req, _res, next) => {
  const { kind } = req.params;
  const admin = req.user.role === 'admin';
  const faculty = req.user.role === 'faculty';
  const allowed = admin || (faculty && ['event-banner', 'notice-attachment', 'resource', 'project-doc'].includes(kind)) || (req.user.role === 'student' && kind === 'project-doc');
  if (!allowed) throw new ApiError(403, 'You do not have permission to upload this file.');
  next();
}), (req, res, next) => {
  try { return uploadFor(req.params.kind)(req, res, next); } catch (error) { next(error); }
}, (req, res) => success(res, req.upload, 201));

const resources = ['faculty', 'courses', 'labs', 'notices', 'events', 'projects', 'resources', 'registrations', 'messages', 'users'];
for (const resource of resources) {
  const base = `/${resource}`;
  modelFor(resource);
  const privateRoute = adminOnly.has(resource);
  const readGate = privateRoute ? [requireAuth, requireRole('admin')] : [optionalAuth];
  const writeGate = adminWrite.has(resource) ? [requireAuth, requireRole('admin')] : [requireAuth, requireRole('admin', 'faculty', ...(resource === 'projects' ? ['student'] : []))];

  apiRouter.get(base, ...readGate, asyncHandler(async (req, res) => {
    const result = await listRecords(resource, req);
    success(res, result.data, 200, result.meta);
  }));
  apiRouter.get(`${base}/:id`, ...(privateRoute ? [requireAuth, requireRole('admin')] : [optionalAuth]), validateId, asyncHandler(async (req, res) => {
    const record = await getRecord(resource, req.params.id);
    if (resource === 'projects' && record.status !== 'approved' && req.user?.role !== 'admin' && String(record.submittedBy) !== String(req.user?._id)) throw new ApiError(404, 'Record not found.');
    if (['notices', 'resources'].includes(resource) && record.status !== 'published' && req.user?._id?.toString() !== record.createdBy?.toString() && req.user?.role !== 'admin') throw new ApiError(404, 'Record not found.');
    success(res, record);
  }));
  apiRouter.post(base, csrfProtection, ...writeGate, validateBody(schemas[resource]), asyncHandler(async (req, res) => {
    let values = { ...req.validatedBody };
    if (resource === 'users') {
      if (!values.password) throw new ApiError(400, 'An initial password is required.', { password: 'An initial password is required.' });
      values.passwordHash = await bcrypt.hash(values.password, 12);
      values.mustChangePassword = true;
      delete values.password;
    }
    if (resource === 'projects' && req.user.role !== 'admin') { values.status = 'pending'; values.submittedBy = req.user._id; }
    if (['notices', 'resources'].includes(resource)) { values.status = req.user.role === 'admin' ? (values.status || 'published') : 'pending'; values.createdBy = req.user._id; }
    const record = await createRecord(resource, values);
    if (resource === 'faculty') {
      const linkedUser = await findByField('users', 'email', record.email);
      if (linkedUser) await updateRecord(resource, record._id, { user: linkedUser._id });
    }
    if (resource === 'users' && record.role === 'faculty') {
      const faculty = await findByField('faculty', 'email', record.email);
      if (faculty) await updateRecord('faculty', faculty._id, { user: record._id });
    }
    const output = resource === 'users' ? await findRecord(resource, record._id) : record;
    success(res, output, 201);
  }));
  apiRouter.put(`${base}/:id`, csrfProtection, ...writeGate, validateId, validateBody(updateSchemas[resource]), asyncHandler(async (req, res) => {
    const record = await findRecord(resource, req.params.id, { includeSensitive: resource === 'users' });
    if (!record) throw new ApiError(404, 'Record not found.');
    if (resource === 'users' && String(record._id) === String(req.user._id) && req.validatedBody.role && req.validatedBody.role !== record.role) throw new ApiError(403, 'You cannot change your own role.');
    if (resource === 'users' && req.validatedBody.accountStatus && record.role !== 'student') throw new ApiError(403, 'Only student accounts can be approved or rejected.');
    if (resource === 'users' && record.role === 'admin' && req.validatedBody.role && req.validatedBody.role !== 'admin' && await countRecords('users', { where: "role = 'admin'" }) <= 1) throw new ApiError(409, 'The last administrator cannot be demoted.');
    if (['notices', 'resources'].includes(resource) && req.user.role !== 'admin' && (String(record.createdBy) !== String(req.user._id) || record.status !== 'pending')) throw new ApiError(403, 'You can only edit your own pending submission.');
    if (resource === 'projects' && req.user.role !== 'admin' && req.user.role !== 'faculty' && String(record.submittedBy) !== String(req.user._id)) throw new ApiError(403, 'You can only edit your own submission.');
    const values = { ...req.validatedBody };
    if (resource === 'events' && new Date(values.deadline ?? record.deadline) > new Date(values.date ?? record.date)) throw new ApiError(400, 'Deadline must be on or before the event date.', { deadline: 'Deadline must be on or before the event date.' });
    if (resource === 'users') { delete values.password; }
    if (['notices', 'resources'].includes(resource) && req.user.role !== 'admin') delete values.status;
    if (resource === 'projects' && req.user.role !== 'admin' && req.user.role !== 'faculty') { delete values.status; }
    const updated = await updateRecord(resource, record._id, values);
    const output = resource === 'users' ? await findRecord(resource, updated._id) : updated;
    success(res, output);
  }));
  apiRouter.delete(`${base}/:id`, csrfProtection, requireAuth, ...(resource === 'notices' || resource === 'resources' ? [requireRole('admin', 'faculty')] : [requireRole('admin')]), validateId, asyncHandler(async (req, res) => {
    if (['notices', 'resources'].includes(resource) && req.user.role !== 'admin') {
      const record = await findRecord(resource, req.params.id);
      if (!record || String(record.createdBy) !== String(req.user._id) || record.status !== 'pending') throw new ApiError(403, 'You can only delete your own pending submission.');
    }
    if (resource === 'users' && String(req.params.id) === String(req.user._id)) throw new ApiError(409, 'You cannot delete your own account.');
    if (resource === 'users') {
      const target = await findRecord('users', req.params.id);
      if (target?.role === 'admin' && await countRecords('users', { where: "role = 'admin'" }) <= 1) throw new ApiError(409, 'The last administrator cannot be deleted.');
    }
    success(res, await deleteRecord(resource, req.params.id));
  }));
}

apiRouter.use((req, _res, next) => {
  if (req.path.startsWith('/auth/') || req.path === '/contact' || req.path.startsWith('/uploads/')) return next();
  next();
});