import { randomUUID } from 'node:crypto';
import { execute } from '../config/db.js';

const columns = {
  users: ['name', 'email', 'passwordHash', 'role', 'accountStatus', 'mustChangePassword'],
  faculty: ['name', 'designation', 'qualification', 'specialization', 'email', 'experience', 'bio', 'photoUrl', 'user', 'isDemo'],
  courses: ['name', 'duration', 'level', 'description', 'subjects', 'isDemo'],
  labs: ['name', 'description', 'equipment', 'incharge', 'isDemo'],
  notices: ['title', 'category', 'description', 'date', 'pinned', 'attachmentUrl', 'status', 'createdBy', 'isDemo'],
  events: ['title', 'type', 'date', 'deadline', 'venue', 'capacity', 'registeredCount', 'description', 'bannerUrl', 'isDemo'],
  registrations: ['event', 'eventTitle', 'name', 'email', 'department', 'user', 'isDemo'],
  projects: ['type', 'title', 'team', 'summary', 'link', 'documentUrl', 'status', 'submittedBy', 'isDemo'],
  resources: ['title', 'category', 'description', 'url', 'status', 'createdBy', 'isDemo'],
  messages: ['name', 'email', 'subject', 'message', 'read', 'isDemo'],
};
const dateFields = new Set(['date', 'deadline', 'createdAt', 'updatedAt']);
const booleanFields = new Set(['mustChangePassword', 'pinned', 'isDemo', 'read']);
const jsonFields = new Set(['subjects', 'equipment']);
const defaults = {
  users: { role: 'student', accountStatus: 'approved', mustChangePassword: false },
  faculty: { isDemo: false },
  courses: { subjects: [], isDemo: false },
  labs: { equipment: [], isDemo: false },
  notices: { date: () => new Date(), pinned: false, status: 'published', isDemo: false },
  events: { capacity: 0, registeredCount: 0, isDemo: false },
  registrations: { isDemo: false },
  projects: { status: 'pending', isDemo: false },
  resources: { status: 'published', isDemo: false },
  messages: { read: false, isDemo: false },
};

export const tableName = (resource) => {
  if (!columns[resource]) throw new Error('Unknown database resource.');
  return resource;
};

export function mapRow(resource, row, { includeSensitive = false } = {}) {
  if (!row) return null;
  const mapped = { ...row, _id: row.id };
  delete mapped.id;
  if (resource === 'users' && !includeSensitive) delete mapped.passwordHash;
  for (const field of dateFields) {
    if (mapped[field]) mapped[field] = new Date(mapped[field]);
  }
  for (const field of booleanFields) {
    if (field in mapped) mapped[field] = Boolean(mapped[field]);
  }
  for (const field of jsonFields) {
    if (typeof mapped[field] === 'string') mapped[field] = JSON.parse(mapped[field]);
  }
  return mapped;
}

function toDatabaseValue(field, value) {
  if (value instanceof Date) return value.toISOString();
  if (dateFields.has(field) && value) return new Date(value).toISOString();
  if (booleanFields.has(field)) return value ? 1 : 0;
  if (jsonFields.has(field)) return JSON.stringify(value);
  return value;
}

export async function findRecord(resource, id, { includeSensitive = false, executor = null } = {}) {
  const table = tableName(resource);
  const result = await (executor || { execute }).execute({
    sql: `SELECT * FROM ${table} WHERE id = ? LIMIT 1`,
    args: [String(id)],
  });
  return mapRow(resource, result.rows[0], { includeSensitive });
}

export async function findByField(resource, field, value, { includeSensitive = false, executor = null } = {}) {
  const table = tableName(resource);
  if (field !== 'id' && !columns[resource].includes(field)) throw new Error('Unknown database field.');
  const result = await (executor || { execute }).execute({
    sql: `SELECT * FROM ${table} WHERE ${field} = ? LIMIT 1`,
    args: [toDatabaseValue(field, value)],
  });
  return mapRow(resource, result.rows[0], { includeSensitive });
}

export async function createRecord(resource, values, { executor = null } = {}) {
  const table = tableName(resource);
  const now = new Date().toISOString();
  const input = { ...Object.fromEntries(Object.entries(defaults[resource] || {}).map(([field, value]) => [field, typeof value === 'function' ? value() : value])), ...values };
  const id = String(input._id || randomUUID());
  delete input._id;
  const record = { id, ...input, createdAt: input.createdAt || now, updatedAt: input.updatedAt || now };
  const allowed = columns[resource].filter((field) => record[field] !== undefined);
  const names = ['id', ...allowed, 'createdAt', 'updatedAt'];
  const args = [id, ...allowed.map((field) => toDatabaseValue(field, record[field])), toDatabaseValue('createdAt', record.createdAt), toDatabaseValue('updatedAt', record.updatedAt)];
  await (executor || { execute }).execute({
    sql: `INSERT INTO ${table} (${names.join(', ')}) VALUES (${names.map(() => '?').join(', ')})`,
    args,
  });
  return findRecord(resource, id, { includeSensitive: true, executor });
}

export async function updateRecord(resource, id, values, { executor = null } = {}) {
  const table = tableName(resource);
  const allowed = columns[resource].filter((field) => values[field] !== undefined);
  if (!allowed.length) return findRecord(resource, id, { includeSensitive: true, executor });
  const now = new Date().toISOString();
  const assignments = [...allowed.map((field) => `${field} = ?`), 'updatedAt = ?'];
  const args = [...allowed.map((field) => toDatabaseValue(field, values[field])), now, String(id)];
  await (executor || { execute }).execute({ sql: `UPDATE ${table} SET ${assignments.join(', ')} WHERE id = ?`, args });
  return findRecord(resource, id, { includeSensitive: true, executor });
}

export async function countRecords(resource, { where = '', args = [], executor = null } = {}) {
  const table = tableName(resource);
  const result = await (executor || { execute }).execute({
    sql: `SELECT COUNT(*) AS total FROM ${table}${where ? ` WHERE ${where}` : ''}`,
    args,
  });
  return Number(result.rows[0].total);
}

export function isUniqueViolation(error) {
  return String(error?.code || '').includes('CONSTRAINT_UNIQUE')
    || String(error?.message || '').includes('UNIQUE constraint failed');
}