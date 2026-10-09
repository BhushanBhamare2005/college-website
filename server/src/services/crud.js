import { collections } from '../models/index.js';
import { escapeRegex } from '../utils/escapeRegex.js';
import { ApiError } from '../utils/ApiError.js';

const searchable = {
  faculty: ['name', 'designation', 'specialization', 'qualification'], courses: ['name', 'description'],
  labs: ['name', 'description'], notices: ['title', 'description', 'category'], events: ['title', 'description', 'venue', 'type'],
  projects: ['title', 'summary', 'team'], resources: ['title', 'description', 'category'], registrations: ['name', 'email', 'eventTitle'],
  messages: ['name', 'email', 'subject', 'message'], users: ['name', 'email', 'role'],
};
const sortOptions = { date: { date: -1 }, dateAsc: { date: 1 }, createdAt: { createdAt: -1 } };
const allowedFilters = ['category', 'designation', 'type', 'status', 'role'];
const andFilter = (filter, condition) => {
  if (filter.$or) {
    filter.$and = [{ $or: filter.$or }, condition];
    delete filter.$or;
  } else Object.assign(filter, condition);
};

export function modelFor(resource) {
  const Model = collections[resource];
  if (!Model) throw new ApiError(404, 'Resource not found.');
  return Model;
}

export async function listRecords(resource, req) {
  const Model = modelFor(resource);
  const page = Math.max(1, Math.floor(Number(req.query.page) || 1));
  const limit = Math.min(50, Math.max(1, Math.floor(Number(req.query.limit) || 10)));
  const filter = {};
  if (req.query.q) {
    const regex = new RegExp(escapeRegex(String(req.query.q).slice(0, 100)), 'i');
    filter.$or = (searchable[resource] || []).map((field) => ({ [field]: regex }));
  }
  for (const field of allowedFilters) {
    if (req.query[field] && req.query[field] !== 'all') filter[field] = String(req.query[field]).slice(0, 100);
  }
  if (req.query.upcoming === 'true' || req.query.upcoming === 'false') filter.date = { [req.query.upcoming === 'true' ? '$gte' : '$lt']: new Date() };
  if (resource === 'notices') {
    if (!['admin', 'faculty'].includes(req.user?.role)) filter.status = 'published';
    else if (req.user.role === 'faculty') andFilter(filter, { $or: [{ status: 'published' }, { status: 'pending', createdBy: req.user._id }] });
  }
  if (resource === 'resources') {
    if (!['admin', 'faculty'].includes(req.user?.role)) filter.status = 'published';
    else if (req.user.role === 'faculty') andFilter(filter, { $or: [{ status: 'published' }, { status: 'pending', createdBy: req.user._id }] });
  }
  if (resource === 'projects') {
    if (!['admin', 'faculty'].includes(req.user?.role)) filter.status = 'approved';
    else if (req.user.role === 'faculty') andFilter(filter, { $or: [{ status: 'approved' }, { submittedBy: req.user._id }] });
  }
  const sort = resource === 'notices' ? { pinned: -1, date: -1 } : (sortOptions[req.query.sort] || { createdAt: -1 });
  const [rows, total] = await Promise.all([
    Model.find(filter).sort(sort).skip((page - 1) * limit).limit(limit).select(resource === 'users' ? '-passwordHash' : undefined).lean(),
    Model.countDocuments(filter),
  ]);
  return { data: rows, meta: { page, limit, total, pages: Math.max(1, Math.ceil(total / limit)) } };
}

export async function getRecord(resource, id) {
  const row = await modelFor(resource).findById(id).select(resource === 'users' ? '-passwordHash' : undefined).lean();
  if (!row) throw new ApiError(404, 'Record not found.');
  return row;
}

export async function deleteRecord(resource, id) {
  const Model = modelFor(resource);
  const row = await Model.findById(id);
  if (!row) throw new ApiError(404, 'Record not found.');
  if (resource === 'events') await collections.registrations.deleteMany({ event: row._id });
  if (resource === 'registrations') await collections.events.updateOne({ _id: row.event, registeredCount: { $gt: 0 } }, { $inc: { registeredCount: -1 } });
  await row.deleteOne();
  return { _id: id };
}