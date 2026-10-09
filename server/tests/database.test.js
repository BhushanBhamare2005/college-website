import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { connectDatabase, databaseReady, disconnectDatabase, execute } from '../src/config/db.js';
import { createRecord, findRecord, updateRecord } from '../src/models/index.js';

beforeAll(connectDatabase);
afterAll(disconnectDatabase);

describe('SQLite database setup', () => {
  it('creates the application schema and supports parameterized writes', async () => {
    expect(databaseReady()).toBe(true);
    const tables = await execute("SELECT name FROM sqlite_master WHERE type = 'table'");
    expect(tables.rows.map((row) => row.name)).toEqual(expect.arrayContaining([
      'users', 'faculty', 'courses', 'labs', 'notices', 'events', 'registrations', 'projects', 'resources', 'messages',
    ]));

    await execute({
      sql: 'INSERT INTO users (id, name, email, passwordHash, role, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?, ?)',
      args: ['sqlite-test-user', 'SQLite Test', 'sqlite@example.test', 'test-hash', 'admin', new Date().toISOString(), new Date().toISOString()],
    });
    const inserted = await execute({ sql: 'SELECT email FROM users WHERE id = ?', args: ['sqlite-test-user'] });
    expect(inserted.rows[0].email).toBe('sqlite@example.test');
  });

  it('round-trips model values and updates records through the SQL repository', async () => {
    const course = await createRecord('courses', { name: 'SQL course', subjects: ['Data systems'], isDemo: true });
    expect(course._id).toBeTruthy();
    expect(course.subjects).toEqual(['Data systems']);
    expect(course.isDemo).toBe(true);

    await updateRecord('courses', course._id, { description: 'Stored in SQLite' });
    const stored = await findRecord('courses', course._id);
    expect(stored.description).toBe('Stored in SQLite');
  });
});