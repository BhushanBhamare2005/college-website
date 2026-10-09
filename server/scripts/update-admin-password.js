import bcrypt from 'bcryptjs';
import { connectDatabase, disconnectDatabase } from '../src/config/db.js';
import { findByField, updateRecord } from '../src/models/index.js';

const email = String(process.env.ADMIN_EMAIL || '').trim().toLowerCase();
const password = process.env.ADMIN_PASSWORD || '';
if (!email || password.length < 8) {
  console.error('Set ADMIN_EMAIL and an ADMIN_PASSWORD of at least 8 characters.');
  process.exit(1);
}

try {
  await connectDatabase();
  const user = await findByField('users', 'email', email);
  if (!user) throw new Error(`No account found for ${email}.`);
  await updateRecord('users', user._id, { passwordHash: await bcrypt.hash(password, 12) });
  console.info(`Password updated for ${email}.`);
} catch (error) {
  console.error('Could not update administrator password:', error.message);
  process.exitCode = 1;
} finally { await disconnectDatabase(); }