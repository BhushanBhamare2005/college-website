import { mkdir } from 'node:fs/promises';
import path from 'node:path';
import { createClient } from '@libsql/client';
import { env } from './env.js';

const schema = [
  `CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY, name TEXT NOT NULL, email TEXT NOT NULL UNIQUE, passwordHash TEXT NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('admin', 'faculty', 'student')),
    accountStatus TEXT NOT NULL DEFAULT 'approved' CHECK (accountStatus IN ('pending', 'approved', 'rejected')),
    mustChangePassword INTEGER NOT NULL DEFAULT 0, createdAt TEXT NOT NULL, updatedAt TEXT NOT NULL
  )`,
  `CREATE TABLE IF NOT EXISTS faculty (
    id TEXT PRIMARY KEY, name TEXT NOT NULL, designation TEXT NOT NULL, qualification TEXT NOT NULL,
    specialization TEXT NOT NULL, email TEXT, experience TEXT, bio TEXT, photoUrl TEXT,
    user TEXT REFERENCES users(id) ON DELETE SET NULL, isDemo INTEGER NOT NULL DEFAULT 0,
    createdAt TEXT NOT NULL, updatedAt TEXT NOT NULL
  )`,
  'CREATE UNIQUE INDEX IF NOT EXISTS faculty_email_unique ON faculty(email) WHERE email IS NOT NULL',
  `CREATE TABLE IF NOT EXISTS courses (
    id TEXT PRIMARY KEY, name TEXT NOT NULL, duration TEXT, level TEXT, description TEXT,
    subjects TEXT NOT NULL DEFAULT '[]', isDemo INTEGER NOT NULL DEFAULT 0, createdAt TEXT NOT NULL, updatedAt TEXT NOT NULL
  )`,
  `CREATE TABLE IF NOT EXISTS labs (
    id TEXT PRIMARY KEY, name TEXT NOT NULL, description TEXT, equipment TEXT NOT NULL DEFAULT '[]', incharge TEXT,
    isDemo INTEGER NOT NULL DEFAULT 0, createdAt TEXT NOT NULL, updatedAt TEXT NOT NULL
  )`,
  `CREATE TABLE IF NOT EXISTS notices (
    id TEXT PRIMARY KEY, title TEXT NOT NULL, category TEXT NOT NULL, description TEXT, date TEXT NOT NULL,
    pinned INTEGER NOT NULL DEFAULT 0, attachmentUrl TEXT, status TEXT NOT NULL DEFAULT 'published',
    createdBy TEXT REFERENCES users(id) ON DELETE SET NULL, isDemo INTEGER NOT NULL DEFAULT 0,
    createdAt TEXT NOT NULL, updatedAt TEXT NOT NULL
  )`,
  `CREATE TABLE IF NOT EXISTS events (
    id TEXT PRIMARY KEY, title TEXT NOT NULL, type TEXT NOT NULL, date TEXT NOT NULL, deadline TEXT NOT NULL,
    venue TEXT NOT NULL, capacity INTEGER NOT NULL DEFAULT 0, registeredCount INTEGER NOT NULL DEFAULT 0,
    description TEXT, bannerUrl TEXT, isDemo INTEGER NOT NULL DEFAULT 0, createdAt TEXT NOT NULL, updatedAt TEXT NOT NULL
  )`,
  `CREATE TABLE IF NOT EXISTS registrations (
    id TEXT PRIMARY KEY, event TEXT NOT NULL REFERENCES events(id) ON DELETE CASCADE, eventTitle TEXT NOT NULL,
    name TEXT NOT NULL, email TEXT NOT NULL, department TEXT, user TEXT REFERENCES users(id) ON DELETE SET NULL,
    isDemo INTEGER NOT NULL DEFAULT 0, createdAt TEXT NOT NULL, updatedAt TEXT NOT NULL, UNIQUE(event, email)
  )`,
  `CREATE TABLE IF NOT EXISTS projects (
    id TEXT PRIMARY KEY, type TEXT NOT NULL CHECK (type IN ('project', 'achievement')), title TEXT NOT NULL,
    team TEXT NOT NULL, summary TEXT NOT NULL, link TEXT, documentUrl TEXT, status TEXT NOT NULL DEFAULT 'pending',
    submittedBy TEXT REFERENCES users(id) ON DELETE SET NULL, isDemo INTEGER NOT NULL DEFAULT 0,
    createdAt TEXT NOT NULL, updatedAt TEXT NOT NULL
  )`,
  `CREATE TABLE IF NOT EXISTS resources (
    id TEXT PRIMARY KEY, title TEXT NOT NULL, category TEXT NOT NULL, description TEXT, url TEXT,
    status TEXT NOT NULL DEFAULT 'published', createdBy TEXT REFERENCES users(id) ON DELETE SET NULL,
    isDemo INTEGER NOT NULL DEFAULT 0, createdAt TEXT NOT NULL, updatedAt TEXT NOT NULL
  )`,
  `CREATE TABLE IF NOT EXISTS messages (
    id TEXT PRIMARY KEY, name TEXT NOT NULL, email TEXT NOT NULL, subject TEXT NOT NULL, message TEXT NOT NULL,
    read INTEGER NOT NULL DEFAULT 0, isDemo INTEGER NOT NULL DEFAULT 0, createdAt TEXT NOT NULL, updatedAt TEXT NOT NULL
  )`,
  'CREATE INDEX IF NOT EXISTS notices_date_idx ON notices(pinned DESC, date DESC)',
  'CREATE INDEX IF NOT EXISTS events_date_idx ON events(date)',
  'CREATE INDEX IF NOT EXISTS projects_status_idx ON projects(status)',
  'CREATE INDEX IF NOT EXISTS resources_status_idx ON resources(status)',
  'CREATE INDEX IF NOT EXISTS messages_created_idx ON messages(createdAt DESC)',
];

let client;
let connectionPromise;
let ready = false;

export async function connectDatabase() {
  if (ready) return client;
  if (!connectionPromise) {
    connectionPromise = (async () => {
      let url = env.TURSO_DATABASE_URL;
      if (!url) {
        if (env.NODE_ENV === 'test') {
          url = 'file::memory:';
        } else {
          const filename = path.resolve(env.SQLITE_PATH);
          await mkdir(path.dirname(filename), { recursive: true });
          url = `file:${filename.replaceAll('\\', '/')}`;
        }
      }
      client = createClient({ url, authToken: env.TURSO_AUTH_TOKEN });
      await client.execute('PRAGMA foreign_keys = ON');
      await client.batch(schema.map((sql) => ({ sql })), 'write');
      ready = true;
      return client;
    })().catch((error) => {
      connectionPromise = null;
      client?.close();
      client = undefined;
      throw error;
    });
  }
  return connectionPromise;
}

export async function disconnectDatabase() {
  client?.close();
  client = undefined;
  connectionPromise = null;
  ready = false;
}

export async function execute(statement) {
  await connectDatabase();
  return client.execute(statement);
}

export async function transaction() {
  await connectDatabase();
  return client.transaction('write');
}

export const databaseReady = () => ready;