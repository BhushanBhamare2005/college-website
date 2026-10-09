import bcrypt from 'bcryptjs';
import { seed } from '../../client/src/data/demo.js';
import { connectDatabase, disconnectDatabase } from '../src/config/db.js';
import { countRecords, createRecord, findByField, updateRecord } from '../src/models/index.js';

if (process.env.NODE_ENV === 'production') {
  console.error('seed:demo is disabled in production.');
  process.exit(1);
}

const accounts = [
  { name: 'Demo Admin', email: 'admin@demo.local', password: 'demo-admin', role: 'admin' },
  { name: 'Demo Faculty', email: 'faculty@demo.local', password: 'demo-faculty', role: 'faculty' },
  { name: 'Demo Student', email: 'student@demo.local', password: 'demo-student', role: 'student' },
];

try {
  await connectDatabase();
  const resources = ['users', 'faculty', 'courses', 'labs', 'notices', 'events', 'registrations', 'projects', 'resources', 'messages'];
  const count = await Promise.all(resources.map((resource) => countRecords(resource)));
  if (count.some(Boolean)) throw new Error('The database is not empty; refusing to overwrite existing records.');
  const userRows = await Promise.all(accounts.map(async ({ password, ...account }) => ({
    ...account, passwordHash: await bcrypt.hash(password, 12), mustChangePassword: false,
  })));
  const users = await Promise.all(userRows.map((row) => createRecord('users', row)));
  const admin = users.find((user) => user.role === 'admin');
  const student = users.find((user) => user.role === 'student');
  const ids = {};
  for (const key of ['faculty', 'courses', 'labs', 'notices', 'events', 'projects', 'resources']) {
    ids[key] = await Promise.all(seed[key].map((row) => createRecord(key, row)));
  }
  const registrations = await Promise.all(seed.registrations.map((row) => createRecord('registrations', row)));
  for (const event of ids.events) {
    const registeredCount = registrations.filter((row) => row.event === event._id).length;
    if (registeredCount) await updateRecord('events', event._id, { registeredCount });
  }
  await Promise.all(seed.messages.map((row) => createRecord('messages', row)));
  const pendingProject = await findByField('projects', 'title', 'Sample pending submission');
  if (pendingProject) await updateRecord('projects', pendingProject._id, { submittedBy: student._id });
  for (const row of ids.notices) await updateRecord('notices', row._id, { createdBy: admin._id });
  for (const row of ids.resources) await updateRecord('resources', row._id, { createdBy: admin._id });
  console.info('Demo records created. Demo accounts are enabled for local development only.');
} catch (error) {
  console.error('Could not seed demo data:', error.message);
  process.exitCode = 1;
} finally { await disconnectDatabase(); }