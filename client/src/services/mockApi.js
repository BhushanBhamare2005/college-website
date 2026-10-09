// In-browser DEMO backend. Active only when VITE_USE_MOCK=true. Data lives in memory and resets on reload.
import { seed, DEMO_ACCOUNTS } from '../data/demo';

const db = JSON.parse(JSON.stringify(seed));
const demoPasswords = new Map(DEMO_ACCOUNTS.map((account) => [account.email, account.password]));
let session = null;
try { session = JSON.parse(sessionStorage.getItem('demoUser') || 'null'); } catch { /* ignore */ }

const delay = (ms = 250) => new Promise((r) => setTimeout(r, ms));
const uid = () => 'x' + Math.random().toString(36).slice(2, 10);

export class ApiError extends Error {
  constructor(message, status = 400, errors = null) {
    super(message);
    this.status = status;
    this.errors = errors;
  }
}

const SEARCH_FIELDS = {
  faculty: ['name', 'designation', 'specialization', 'qualification'],
  courses: ['name', 'description'],
  labs: ['name', 'description'],
  notices: ['title', 'description', 'category'],
  events: ['title', 'description', 'venue', 'type'],
  projects: ['title', 'summary', 'team'],
  resources: ['title', 'description', 'category'],
  registrations: ['name', 'email', 'eventTitle'],
  messages: ['name', 'email', 'subject', 'message'],
  users: ['name', 'email', 'role'],
};

const requireRole = (...roles) => {
  if (!session) throw new ApiError('Please sign in to continue.', 401);
  if (!roles.includes(session.role)) throw new ApiError('You do not have permission to do that.', 403);
};

const PRIVATE = new Set(['registrations', 'messages', 'users']);
const WRITE_ROLES = {
  faculty: ['admin'], courses: ['admin'], labs: ['admin'], events: ['admin'],
  notices: ['admin', 'faculty'], resources: ['admin', 'faculty'], projects: ['admin', 'faculty', 'student'],
  registrations: ['admin'], messages: ['admin'], users: ['admin'],
};
WRITE_ROLES.notices = ['admin', 'faculty'];
WRITE_ROLES.resources = ['admin', 'faculty'];

export const mock = {
  async list(resource, params = {}) {
    await delay();
    if (PRIVATE.has(resource)) requireRole('admin');
    let rows = [...(db[resource] || [])];
    if (['notices', 'resources'].includes(resource)) {
      rows = rows.filter((row) => row.status === 'published' || (session?.role === 'admin') || (session?.role === 'faculty' && row.status === 'pending' && row.createdBy === session.email));
    }
    // Public visitors only see approved projects.
    if (resource === 'projects' && !(session && ['admin', 'faculty'].includes(session.role))) {
      rows = rows.filter((r) => r.status === 'approved');
    } else if (resource === 'projects' && session?.role === 'faculty') {
      rows = rows.filter((r) => r.status === 'approved' || r.submittedBy === session.email);
    }
    const { q, page = 1, limit = 10, sort, ...filters } = params;
    if (q) {
      const needle = String(q).toLowerCase();
      rows = rows.filter((r) => (SEARCH_FIELDS[resource] || []).some((f) => String(r[f] || '').toLowerCase().includes(needle)));
    }
    Object.entries(filters).forEach(([k, v]) => {
      if (v === '' || v === undefined || v === null || v === 'all') return;
      if (k === 'upcoming') {
        const now = Date.now();
        rows = rows.filter((r) => (v === 'true' ? new Date(r.date) >= now : new Date(r.date) < now));
      } else rows = rows.filter((r) => String(r[k]) === String(v));
    });
    if (sort === 'date') rows.sort((a, b) => new Date(b.date) - new Date(a.date));
    else if (sort === 'dateAsc') rows.sort((a, b) => new Date(a.date) - new Date(b.date));
    else if (resource === 'notices') rows.sort((a, b) => (b.pinned - a.pinned) || (new Date(b.date) - new Date(a.date)));
    const total = rows.length;
    const lim = Math.max(1, Number(limit));
    const pg = Math.max(1, Number(page));
    return { data: rows.slice((pg - 1) * lim, pg * lim), meta: { page: pg, limit: lim, total, pages: Math.max(1, Math.ceil(total / lim)) } };
  },

  async get(resource, id) {
    await delay(150);
    const row = (db[resource] || []).find((r) => r._id === id);
    if (!row) throw new ApiError('Record not found.', 404);
    if (['notices', 'resources'].includes(resource) && row.status !== 'published' && session?.role !== 'admin' && !(session?.role === 'faculty' && row.createdBy === session.email)) throw new ApiError('Record not found.', 404);
    if (resource === 'projects' && row.status !== 'approved' && session?.role !== 'admin' && row.submittedBy !== session?.email) throw new ApiError('Record not found.', 404);
    return { data: row };
  },

  async create(resource, body) {
    await delay();
    requireRole(...(WRITE_ROLES[resource] || ['admin']));
    const row = { ...body, _id: uid(), createdAt: new Date().toISOString() };
    if (resource === 'users') {
      if (row.password) demoPasswords.set(row.email, row.password);
      delete row.password;
      row.accountStatus ||= 'approved';
    }
    if (['notices', 'resources'].includes(resource)) {
      row.status = session.role === 'admin' ? (row.status || 'published') : 'pending';
      row.createdBy = session.email;
    }
    if (resource === 'projects') {
      row.status = session.role === 'student' || session.role === 'faculty' ? 'pending' : row.status || 'pending';
      row.submittedBy = session.email;
    }
    if (resource === 'notices' && !row.date) row.date = new Date().toISOString();
    db[resource].unshift(row);
    return { data: row };
  },

  async update(resource, id, body) {
    await delay();
    requireRole(...(WRITE_ROLES[resource] === undefined ? ['admin'] : ['admin', ...(['projects', 'notices', 'resources'].includes(resource) ? ['faculty'] : [])]));
    const i = db[resource].findIndex((r) => r._id === id);
    if (i < 0) throw new ApiError('Record not found.', 404);
    const current = db[resource][i];
    if (session.role === 'faculty' && ['notices', 'resources'].includes(resource) && (current.createdBy !== session.email || current.status !== 'pending')) throw new ApiError('You can only edit your own pending submission.', 403);
    const changes = { ...body };
    if (resource === 'users' && changes.accountStatus && current.role !== 'student') throw new ApiError('Only student accounts can be approved or rejected.', 403);
    if (session.role !== 'admin' && ['notices', 'resources'].includes(resource)) delete changes.status;
    if (resource === 'users' && id === session._id && changes.role && changes.role !== current.role) throw new ApiError('You cannot change your own role.', 403);
    db[resource][i] = { ...current, ...changes, _id: id };
    return { data: db[resource][i] };
  },

  async remove(resource, id) {
    await delay();
    if (['notices', 'resources'].includes(resource) && session?.role === 'faculty') {
      const ownPending = db[resource].find((r) => r._id === id && r.createdBy === session.email && r.status === 'pending');
      if (!ownPending) throw new ApiError('You can only delete your own pending submission.', 403);
    } else requireRole('admin');
    const before = db[resource].length;
    db[resource] = db[resource].filter((r) => r._id !== id);
    if (db[resource].length === before) throw new ApiError('Record not found.', 404);
    return { data: { _id: id } };
  },

  async registerEvent(eventId, body) {
    await delay();
    const ev = db.events.find((e) => e._id === eventId);
    if (!ev) throw new ApiError('Event not found.', 404);
    if (new Date(ev.deadline) < new Date()) throw new ApiError('Registration for this event has closed.', 400);
    const email = String(body.email || '').trim().toLowerCase();
    if (db.registrations.some((r) => r.event === eventId && r.email === email)) {
      throw new ApiError('This email is already registered for this event.', 409);
    }
    if (ev.capacity && db.registrations.filter((r) => r.event === eventId).length >= ev.capacity) {
      throw new ApiError('This event is full.', 409);
    }
    const row = { _id: uid(), event: eventId, eventTitle: ev.title, name: body.name, email, createdAt: new Date().toISOString() };
    db.registrations.unshift(row);
    return { data: row };
  },

  async sendContact(body) {
    await delay(400);
    db.messages.unshift({ _id: uid(), ...body, read: false, createdAt: new Date().toISOString() });
    return { data: { received: true } };
  },

  async stats() {
    await delay();
    requireRole('admin', 'faculty');
    const byType = ['Workshop', 'Seminar', 'Technical Event', 'Program'].map((t) => ({
      name: t,
      registrations: db.registrations.filter((r) => db.events.find((e) => e._id === r.event)?.type === t).length,
    }));
    return {
      data: {
        totals: {
          faculty: db.faculty.length, courses: db.courses.length, notices: db.notices.length,
          events: db.events.length, registrations: db.registrations.length,
          pendingProjects: db.projects.filter((p) => p.status === 'pending').length,
          unreadMessages: db.messages.filter((m) => !m.read).length,
        },
        participation: db.events.map((e) => ({ name: e.title.replace(' (sample)', ''), registrations: db.registrations.filter((r) => r.event === e._id).length })),
        content: [
          { name: 'Faculty', count: db.faculty.length }, { name: 'Courses', count: db.courses.length },
          { name: 'Labs', count: db.labs.length }, { name: 'Notices', count: db.notices.length },
          { name: 'Events', count: db.events.length }, { name: 'Projects', count: db.projects.length },
        ],
        byType,
        recent: [
          ...db.registrations.slice(0, 3).map((r) => ({ id: r._id, text: `${r.name} registered for ${r.eventTitle}`, at: r.createdAt })),
          ...db.messages.slice(0, 3).map((m) => ({ id: m._id, text: `Message from ${m.name}: ${m.subject}`, at: m.createdAt })),
          ...db.projects.filter((p) => p.status === 'pending').map((p) => ({ id: p._id, text: `Pending approval: ${p.title}`, at: p.createdAt })),
        ].sort((a, b) => new Date(b.at) - new Date(a.at)).slice(0, 6),
      },
    };
  },

  async publicStats() {
    await delay(150);
    return { data: { faculty: db.faculty.length, courses: db.courses.length, labs: db.labs.length, events: db.events.length, notices: db.notices.length } };
  },

  async login({ email, password }) {
    await delay(400);
    const acc = db.users.find((user) => user.email === String(email).toLowerCase() && demoPasswords.get(user.email) === password);
    if (!acc) throw new ApiError('Invalid email or password.', 401);
    if (acc.accountStatus !== 'approved') throw new ApiError(acc.accountStatus === 'rejected' ? 'This account was not approved. Contact the department for help.' : 'Your account is waiting for administrator approval.', 403);
    session = { _id: acc._id, name: acc.name, email: acc.email, role: acc.role, accountStatus: acc.accountStatus };
    sessionStorage.setItem('demoUser', JSON.stringify(session));
    return { data: session };
  },
  async logout() { session = null; sessionStorage.removeItem('demoUser'); return { data: null }; },
  async me() { await delay(100); if (!session) throw new ApiError('Not signed in.', 401); return { data: session }; },
  async registerStudent({ name, email, password }) {
    await delay();
    const normalizedEmail = String(email || '').trim().toLowerCase();
    if (db.users.some((user) => user.email === normalizedEmail)) throw new ApiError('An account with this email already exists.', 409);
    const user = { _id: uid(), name: String(name).trim(), email: normalizedEmail, role: 'student', accountStatus: 'pending', createdAt: new Date().toISOString() };
    demoPasswords.set(normalizedEmail, password);
    db.users.unshift(user);
    return { data: user };
  },
  async changePassword({ currentPassword, newPassword }) {
    await delay();
    if (!session) throw new ApiError('Please sign in to continue.', 401);
    if (demoPasswords.get(session.email) !== currentPassword) throw new ApiError('Current password is incorrect.', 400);
    if (String(newPassword || '').length < 10) throw new ApiError('New password must be at least 10 characters.', 400);
    demoPasswords.set(session.email, newPassword);
    return { data: { changed: true } };
  },
  async upload(kind, file) {
    await delay();
    const roles = {
      'faculty-photo': ['admin'], 'event-banner': ['admin'], 'notice-attachment': ['admin', 'faculty'],
      resource: ['admin', 'faculty'], 'project-doc': ['admin', 'faculty', 'student'],
    };
    requireRole(...(roles[kind] || []));
    if (!file) throw new ApiError('Choose a file to upload.', 400);
    return { data: { url: URL.createObjectURL(file), originalName: file.name, mime: file.type } };
  },
};
