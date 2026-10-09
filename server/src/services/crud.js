import { execute, transaction } from '../config/db.js';
import { countRecords, findRecord, mapRow, tableName } from '../models/index.js';
import { ApiError } from '../utils/ApiError.js';

const searchable = {
  faculty: ['name', 'designation', 'specialization', 'qualification'], courses: ['name', 'description'],
  labs: ['name', 'description'], notices: ['title', 'description', 'category'], events: ['title', 'description', 'venue', 'type'],
  projects: ['title', 'summary', 'team'], resources: ['title', 'description', 'category'], registrations: ['name', 'email', 'eventTitle'],
  messages: ['name', 'email', 'subject', 'message'], users: ['name', 'email', 'role'],
};
const sortOptions = { date: 'date DESC', dateAsc: 'date ASC', createdAt: 'createdAt DESC' };
const allowedFilters = ['category', 'designation', 'type', 'status', 'role'];

export function modelFor(resource) {
  try { return tableName(resource); } catch { throw new ApiError(404, 'Resource not found.'); }
}

export async function listRecords(resource, req) {
  const table = modelFor(resource);
  const page = Math.max(1, Math.floor(Number(req.query.page) || 1));
  const limit = Math.min(50, Math.max(1, Math.floor(Number(req.query.limit) || 10)));
  const conditions = [];
  const args = [];
  if (req.query.q) {
    const pattern = `%${String(req.query.q).slice(0, 100).replace(/[!%_]/g, '!$&')}%`;
    const searchFields = searchable[resource] || [];
    conditions.push(`(${searchFields.map((field) => `LOWER(COALESCE(${field}, '')) LIKE LOWER(?) ESCAPE '!'`).join(' OR ')})`);
    args.push(...searchFields.map(() => pattern));
  }
  for (const field of allowedFilters) {
    if (req.query[field] && req.query[field] !== 'all') {
      conditions.push(`${field} = ?`);
      args.push(String(req.query[field]).slice(0, 100));
    }
  }
  if (req.query.upcoming === 'true' || req.query.upcoming === 'false') {
    conditions.push(`date ${req.query.upcoming === 'true' ? '>=' : '<'} ?`);
    args.push(new Date().toISOString());
  }
  if (resource === 'notices') {
    if (!['admin', 'faculty'].includes(req.user?.role)) conditions.push("status = 'published'");
    else if (req.user.role === 'faculty') {
      conditions.push("(status = 'published' OR (status = 'pending' AND createdBy = ?))");
      args.push(String(req.user._id));
    }
  }
  if (resource === 'resources') {
    if (!['admin', 'faculty'].includes(req.user?.role)) conditions.push("status = 'published'");
    else if (req.user.role === 'faculty') {
      conditions.push("(status = 'published' OR (status = 'pending' AND createdBy = ?))");
      args.push(String(req.user._id));
    }
  }
  if (resource === 'projects') {
    if (!['admin', 'faculty'].includes(req.user?.role)) conditions.push("status = 'approved'");
    else if (req.user.role === 'faculty') {
      conditions.push("(status = 'approved' OR submittedBy = ?)");
      args.push(String(req.user._id));
    }
  }
  const where = conditions.length ? conditions.join(' AND ') : '';
  const sort = resource === 'notices' ? 'pinned DESC, date DESC' : (sortOptions[req.query.sort] || 'createdAt DESC');
  const [result, total] = await Promise.all([
    execute({ sql: `SELECT * FROM ${table}${where ? ` WHERE ${where}` : ''} ORDER BY ${sort} LIMIT ? OFFSET ?`, args: [...args, limit, (page - 1) * limit] }),
    countRecords(resource, { where, args }),
  ]);
  const rows = result.rows.map((row) => mapRow(resource, row));
  return { data: rows, meta: { page, limit, total, pages: Math.max(1, Math.ceil(total / limit)) } };
}

export async function getRecord(resource, id) {
  modelFor(resource);
  const row = await findRecord(resource, id);
  if (!row) throw new ApiError(404, 'Record not found.');
  return row;
}

export async function deleteRecord(resource, id) {
  const table = modelFor(resource);
  const tx = await transaction();
  try {
    const row = await findRecord(resource, id, { executor: tx });
    if (!row) throw new ApiError(404, 'Record not found.');
    if (resource === 'events') await tx.execute({ sql: 'DELETE FROM registrations WHERE event = ?', args: [String(id)] });
    if (resource === 'registrations') await tx.execute({ sql: 'UPDATE events SET registeredCount = MAX(0, registeredCount - 1), updatedAt = ? WHERE id = ?', args: [new Date().toISOString(), row.event] });
    await tx.execute({ sql: `DELETE FROM ${table} WHERE id = ?`, args: [String(id)] });
    await tx.commit();
    return { _id: String(id) };
  } catch (error) {
    await tx.rollback();
    throw error;
  }
}