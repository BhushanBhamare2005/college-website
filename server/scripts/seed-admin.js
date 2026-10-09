import bcrypt from 'bcryptjs';
import { connectDatabase, disconnectDatabase } from '../src/config/db.js';
import { User } from '../src/models/index.js';

const email = String(process.env.ADMIN_EMAIL || '').trim().toLowerCase();
const password = process.env.ADMIN_PASSWORD || '';
if (!email || password.length < 8) {
  console.error('Set ADMIN_EMAIL and an ADMIN_PASSWORD of at least 8 characters in the environment.');
  process.exit(1);
}

try {
  await connectDatabase(process.env.MONGO_URI);
  if (await User.exists({ email })) throw new Error('An account with ADMIN_EMAIL already exists.');
  const passwordHash = await bcrypt.hash(password, 12);
  await User.create({ name: 'Department Administrator', email, passwordHash, role: 'admin', mustChangePassword: false });
  console.info(`Administrator created: ${email}`);
} catch (error) {
  console.error('Could not seed administrator:', error.message);
  process.exitCode = 1;
} finally { await disconnectDatabase(); }