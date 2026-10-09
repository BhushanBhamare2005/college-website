import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import request from 'supertest';
import bcrypt from 'bcryptjs';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { app } from '../src/app.js';
import { connectDatabase, disconnectDatabase } from '../src/config/db.js';
import { collections, User } from '../src/models/index.js';

let mongo;
let agent;
let csrf;

beforeAll(async () => {
  const uri = process.env.MONGO_URI_TEST;
  if (uri) await connectDatabase(uri);
  else {
    mongo = await MongoMemoryServer.create();
    await connectDatabase(mongo.getUri());
  }
}, 30000);

beforeEach(async () => {
  await mongoose.connection.dropDatabase();
  await User.create({ name: 'Test Administrator', email: 'admin@example.test', passwordHash: await bcrypt.hash('Long-Test-Password-123', 12), role: 'admin' });
  agent = request.agent(app);
  const csrfResponse = await agent.get('/api/auth/csrf').expect(200);
  csrf = csrfResponse.body.data.csrfToken;
});

afterAll(async () => {
  await disconnectDatabase();
  await mongo?.stop();
});

describe('API contract and security', () => {
  it('provides public counts and a stable health envelope', async () => {
    const health = await request(app).get('/api/health').expect(200);
    expect(health.body).toEqual({ success: true, data: { status: 'ok', database: 'connected' } });
    const stats = await request(app).get('/api/dashboard/public-stats').expect(200);
    expect(stats.body.data).toEqual({ faculty: 0, courses: 0, labs: 0, events: 0, notices: 0 });
  });

  it('allows the configured client origin and rejects an unknown origin', async () => {
    const allowed = await request(app).get('/api/health').set('Origin', 'http://localhost:5173').expect(200);
    expect(allowed.headers['access-control-allow-origin']).toBe('http://localhost:5173');
    expect(allowed.headers['access-control-allow-credentials']).toBe('true');
    const rejected = await request(app).get('/api/health').set('Origin', 'https://untrusted.example').expect(403);
    expect(rejected.body.message).toBe('Origin is not allowed.');
    expect(rejected.headers['access-control-allow-origin']).toBeUndefined();
  });

  it('rejects a mutation without a matching CSRF header', async () => {
    await agent.post('/api/auth/login').send({ email: 'admin@example.test', password: 'Long-Test-Password-123' }).expect(403);
  });

  it('uses an HTTP-only cookie for login and excludes password hashes', async () => {
    const response = await agent.post('/api/auth/login').set('X-CSRF-Token', csrf)
      .send({ email: 'admin@example.test', password: 'Long-Test-Password-123' }).expect(200);
    expect(response.headers['set-cookie'].join(';')).toContain('HttpOnly');
    expect(response.body.data).not.toHaveProperty('passwordHash');
    await agent.get('/api/auth/me').expect(200);
  });

  it('requires admin approval before a self-registered student can sign in', async () => {
    const signup = await agent.post('/api/auth/register').set('X-CSRF-Token', csrf).send({
      name: 'New Student', email: 'new.student@example.test', password: 'Student-Password-123', role: 'admin',
    }).expect(201);
    expect(signup.body.data.role).toBe('student');
    expect(signup.body.data.accountStatus).toBe('pending');
    await agent.post('/api/auth/login').set('X-CSRF-Token', csrf)
      .send({ email: 'new.student@example.test', password: 'Student-Password-123' }).expect(403);

    await agent.post('/api/auth/login').set('X-CSRF-Token', csrf)
      .send({ email: 'admin@example.test', password: 'Long-Test-Password-123' }).expect(200);
    await agent.put(`/api/users/${signup.body.data._id}`).set('X-CSRF-Token', csrf)
      .send({ accountStatus: 'approved' }).expect(200);
    const studentLogin = await agent.post('/api/auth/login').set('X-CSRF-Token', csrf)
      .send({ email: 'new.student@example.test', password: 'Student-Password-123' }).expect(200);
    expect(studentLogin.body.data.role).toBe('student');
  });

  it('requires admin role and strips unknown fields from create payloads', async () => {
    await agent.post('/api/faculty').set('X-CSRF-Token', csrf)
      .send({ name: 'Unauthenticated', designation: 'Lecturer', qualification: 'M.E.', specialization: 'Networks' }).expect(401);
    await agent.post('/api/auth/login').set('X-CSRF-Token', csrf)
      .send({ email: 'admin@example.test', password: 'Long-Test-Password-123' }).expect(200);
    const created = await agent.post('/api/faculty').set('X-CSRF-Token', csrf).send({
      name: 'Test Professor', designation: 'Lecturer', qualification: 'M.E.', specialization: 'Networks', role: 'admin', passwordHash: 'injected',
    }).expect(201);
    expect(created.body.data).not.toHaveProperty('role');
    expect(created.body.data).not.toHaveProperty('passwordHash');
    expect(created.body.data.name).toBe('Test Professor');
  });

  it('returns field validation errors and rejects malformed ids', async () => {
    await agent.post('/api/auth/login').set('X-CSRF-Token', csrf)
      .send({ email: 'admin@example.test', password: 'Long-Test-Password-123' }).expect(200);
    const invalid = await agent.post('/api/faculty').set('X-CSRF-Token', csrf).send({ name: '' }).expect(400);
    expect(invalid.body.errors.name).toBeTruthy();
    await agent.get('/api/faculty/not-an-object-id').expect(400);
  });

  it('registers once and prevents duplicate event registrations', async () => {
    const event = await collections.events.create({ title: 'Test Event', type: 'Workshop', date: new Date(Date.now() + 86400000 * 4), deadline: new Date(Date.now() + 86400000), venue: 'Hall', capacity: 1 });
    const payload = { name: 'Student One', email: 'student@example.test' };
    await agent.post(`/api/events/${event._id}/register`).set('X-CSRF-Token', csrf).send(payload).expect(201);
    const duplicate = await agent.post(`/api/events/${event._id}/register`).set('X-CSRF-Token', csrf).send(payload).expect(409);
    expect(duplicate.body.message).toContain('already registered');
    const updated = await collections.events.findById(event._id);
    expect(updated.registeredCount).toBe(1);
  });
});