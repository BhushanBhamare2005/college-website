// Single API service layer. Components never call fetch directly.
// Real mode: cookie-based auth (HTTP-only cookie set by the backend) — no tokens in localStorage.
import { mock, ApiError } from './mockApi';

export { ApiError };
export const USE_MOCK = import.meta.env.MODE === 'test' || String(import.meta.env.VITE_USE_MOCK ?? 'false') === 'true';
const configuredBase = import.meta.env.VITE_API_URL || (import.meta.env.PROD ? '' : 'http://localhost:5000/api');
const normalizedBase = configuredBase.replace(/\/+$/, '');
const BASE = normalizedBase && !normalizedBase.endsWith('/api') ? `${normalizedBase}/api` : normalizedBase;

let onUnauthorized = null;
let csrfToken = null;
let csrfRequest = null;
export const setUnauthorizedHandler = (fn) => { onUnauthorized = fn; };

async function getCsrfToken() {
  if (!BASE) throw new ApiError('The production API URL is not configured.', 0);
  if (csrfToken) return csrfToken;
  if (!csrfRequest) {
    csrfRequest = fetch(`${BASE}/auth/csrf`, { credentials: 'include' })
      .then(async (res) => {
        const json = await res.json();
        if (!res.ok || !json?.data?.csrfToken) throw new ApiError(json?.message || 'Could not initialize secure session.', res.status);
        csrfToken = json.data.csrfToken;
        return csrfToken;
      })
      .finally(() => { csrfRequest = null; });
  }
  return csrfRequest;
}

function qs(params = {}) {
  const sp = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => { if (v !== '' && v !== undefined && v !== null) sp.set(k, v); });
  const s = sp.toString();
  return s ? `?${s}` : '';
}

async function request(path, { method = 'GET', body } = {}) {
  if (!BASE) throw new ApiError('The production API URL is not configured.', 0);
  let res;
  try {
    const mutating = !['GET', 'HEAD', 'OPTIONS'].includes(method);
    const formData = typeof FormData !== 'undefined' && body instanceof FormData;
    const headers = {};
    if (body && !formData) headers['Content-Type'] = 'application/json';
    if (mutating) headers['X-CSRF-Token'] = await getCsrfToken();
    res = await fetch(`${BASE}${path}`, {
      method,
      credentials: 'include',
      headers: Object.keys(headers).length ? headers : undefined,
      body: body ? (formData ? body : JSON.stringify(body)) : undefined,
    });
  } catch (error) {
    if (error instanceof ApiError) throw error;
    throw new ApiError('Cannot reach the server. Please check your connection or try again later.', 0);
  }
  let json = null;
  try { json = await res.json(); } catch { /* empty body */ }
  if (!res.ok) {
    if (res.status === 401 && onUnauthorized && !path.startsWith('/auth/')) onUnauthorized();
    throw new ApiError(json?.message || `Request failed (${res.status}).`, res.status, json?.errors || null);
  }
  return json;
}

// Wrap mock calls so 401s behave identically to the real API.
async function m(fn) {
  try { return await fn(); } catch (e) {
    if (e.status === 401 && onUnauthorized) onUnauthorized();
    throw e;
  }
}

export const api = {
  list: (resource, params) => (USE_MOCK ? m(() => mock.list(resource, params)) : request(`/${resource}${qs(params)}`)),
  get: (resource, id) => (USE_MOCK ? m(() => mock.get(resource, id)) : request(`/${resource}/${id}`)),
  create: (resource, body) => (USE_MOCK ? m(() => mock.create(resource, body)) : request(`/${resource}`, { method: 'POST', body })),
  update: (resource, id, body) => (USE_MOCK ? m(() => mock.update(resource, id, body)) : request(`/${resource}/${id}`, { method: 'PUT', body })),
  remove: (resource, id) => (USE_MOCK ? m(() => mock.remove(resource, id)) : request(`/${resource}/${id}`, { method: 'DELETE' })),
  registerEvent: (id, body) => (USE_MOCK ? mock.registerEvent(id, body) : request(`/events/${id}/register`, { method: 'POST', body })),
  sendContact: (body) => (USE_MOCK ? mock.sendContact(body) : request('/contact', { method: 'POST', body })),
  upload: (kind, file) => {
    if (USE_MOCK) return m(() => mock.upload(kind, file));
    const body = new FormData();
    body.append('file', file);
    return request(`/uploads/${kind}`, { method: 'POST', body });
  },
  stats: () => (USE_MOCK ? m(() => mock.stats()) : request('/dashboard/stats')),
  publicStats: () => (USE_MOCK ? mock.publicStats() : request('/dashboard/public-stats')),
  login: (body) => (USE_MOCK ? mock.login(body) : request('/auth/login', { method: 'POST', body })),
  registerStudent: (body) => (USE_MOCK ? m(() => mock.registerStudent(body)) : request('/auth/register', { method: 'POST', body })),
  logout: () => (USE_MOCK ? mock.logout() : request('/auth/logout', { method: 'POST' })),
  me: () => (USE_MOCK ? mock.me() : request('/auth/me')),
  changePassword: (body) => (USE_MOCK ? m(() => mock.changePassword(body)) : request('/auth/change-password', { method: 'POST', body })),
};
