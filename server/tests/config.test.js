import { describe, expect, it } from 'vitest';
import { spawnSync } from 'node:child_process';

describe('production environment validation', () => {
  it('fails safely when MONGO_URI is missing', () => {
    const source = `import('./src/config/env.js').then(() => { process.exitCode = 1; }).catch((error) => { if (!error.message.includes('MONGO_URI')) process.exitCode = 2; else console.log('MONGO_URI required'); });`;
    const result = spawnSync(process.execPath, ['--input-type=module', '--eval', source], {
      cwd: process.cwd(),
      encoding: 'utf8',
      env: { ...process.env, NODE_ENV: 'production', MONGO_URI: '', JWT_SECRET: 'test-secret-that-is-longer-than-32-chars' },
    });

    expect(result.status).toBe(0);
    expect(result.stdout.trim()).toBe('MONGO_URI required');
    expect(result.stdout).not.toContain('mongodb://');
    expect(result.stderr).toBe('');
  });
});