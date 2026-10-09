import crypto from 'node:crypto';

export const createCsrfToken = () => crypto.randomBytes(32).toString('hex');
export const safeEqual = (left, right) => {
  if (typeof left !== 'string' || typeof right !== 'string' || left.length !== right.length) return false;
  return crypto.timingSafeEqual(Buffer.from(left), Buffer.from(right));
};