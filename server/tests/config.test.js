import { describe, expect, it } from 'vitest';
import { spawnSync } from 'node:child_process';

describe('production environment validation', () => {
  it('requires hosted SQL credentials in production', () => {
    const source = `import('./src/config/env.js').then(() => { process.exitCode = 1; }).catch((error) => { if (!error.message.includes('TURSO_DATABASE_URL and TURSO_AUTH_TOKEN')) process.exitCode = 2; else console.log('hosted SQL credentials required'); });`;
    const childEnv = { ...process.env, NODE_ENV: 'production', JWT_SECRET: 'test-secret-that-is-longer-than-32-chars' };
    delete childEnv.TURSO_DATABASE_URL;
    delete childEnv.TURSO_AUTH_TOKEN;
    const result = spawnSync(process.execPath, ['--input-type=module', '--eval', source], {
      cwd: process.cwd(),
      encoding: 'utf8',
      env: childEnv,
    });

    expect(result.status).toBe(0);
    expect(result.stdout.trim()).toBe('hosted SQL credentials required');
    expect(result.stderr).toBe('');
  });

  it('rejects an ephemeral SQLite file as the production database', () => {
    const source = `import('./src/config/env.js').then(() => { process.exitCode = 1; }).catch((error) => { if (!error.message.includes('remote libSQL endpoint')) process.exitCode = 2; else console.log('remote database URL required'); });`;
    const result = spawnSync(process.execPath, ['--input-type=module', '--eval', source], {
      cwd: process.cwd(),
      encoding: 'utf8',
      env: { ...process.env, NODE_ENV: 'production', TURSO_DATABASE_URL: 'file:./ephemeral.db', TURSO_AUTH_TOKEN: 'test-token', JWT_SECRET: 'test-secret-that-is-longer-than-32-chars' },
    });

    expect(result.status).toBe(0);
    expect(result.stdout.trim()).toBe('remote database URL required');
    expect(result.stderr).toBe('');
  });
});