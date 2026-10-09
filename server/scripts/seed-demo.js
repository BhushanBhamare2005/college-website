import bcrypt from 'bcryptjs';
import { seed } from '../../client/src/data/demo.js';
import { connectDatabase, disconnectDatabase } from '../src/config/db.js';
import { collections, User } from '../src/models/index.js';

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
  await connectDatabase(process.env.MONGO_URI);
  const count = await Promise.all(Object.values(collections).map((Model) => Model.estimatedDocumentCount()));
  if (count.some(Boolean)) throw new Error('The database is not empty; refusing to overwrite existing records.');
  const userRows = await Promise.all(accounts.map(async ({ password, ...account }) => ({
    ...account, passwordHash: await bcrypt.hash(password, 12), mustChangePassword: false,
  })));
  const users = await User.insertMany(userRows);
  const admin = users.find((user) => user.role === 'admin');
  const student = users.find((user) => user.role === 'student');
  const ids = {};
  for (const key of ['faculty', 'courses', 'labs', 'notices', 'events', 'projects', 'resources']) {
    ids[key] = await collections[key].insertMany(seed[key].map(({ _id, ...row }) => row));
  }
  const eventIds = ids.events;
  const registrations = await collections.registrations.insertMany(seed.registrations.map(({ _id, event, ...row }) => ({
    ...row, event: eventIds[Number(String(event).slice(1)) - 1]._id,
  })));
  for (const event of eventIds) {
    const registeredCount = registrations.filter((row) => String(row.event) === String(event._id)).length;
    if (registeredCount) await collections.events.updateOne({ _id: event._id }, { $set: { registeredCount } });
  }
  await collections.messages.insertMany(seed.messages.map(({ _id, ...row }) => row));
  await collections.projects.updateOne({ title: 'Sample pending submission' }, { $set: { submittedBy: student._id } });
  await collections.notices.updateMany({}, { $set: { createdBy: admin._id } });
  await collections.resources.updateMany({}, { $set: { createdBy: admin._id } });
  console.info('Demo records created. Demo accounts are enabled for local development only.');
} catch (error) {
  console.error('Could not seed demo data:', error.message);
  process.exitCode = 1;
} finally { await disconnectDatabase(); }