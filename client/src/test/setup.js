import '@testing-library/jest-dom/vitest';
import { afterEach } from 'vitest';
import { cleanup } from '@testing-library/react';
import { mock } from '../services/mockApi';

afterEach(async () => { cleanup(); await mock.logout(); });
window.scrollTo = () => {};
window.matchMedia = window.matchMedia || ((q) => ({ matches: false, media: q, addEventListener() {}, removeEventListener() {}, addListener() {}, removeListener() {} }));
class RO { observe() {} unobserve() {} disconnect() {} }
window.ResizeObserver = window.ResizeObserver || RO;
