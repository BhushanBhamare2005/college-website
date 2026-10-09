import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { api, setUnauthorizedHandler } from '../services/api';

const AuthCtx = createContext(null);
export const useAuth = () => useContext(AuthCtx);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [sessionExpired, setSessionExpired] = useState(false);

  useEffect(() => {
    api.me().then((r) => setUser(r.data)).catch(() => setUser(null)).finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    setUnauthorizedHandler(() => { setUser((u) => { if (u) setSessionExpired(true); return null; }); });
  }, []);

  const login = useCallback(async (email, password) => {
    const r = await api.login({ email, password });
    setUser(r.data); setSessionExpired(false);
    return r.data;
  }, []);
  const logout = useCallback(async () => {
    try { await api.logout(); } finally { setUser(null); }
  }, []);

  return (
    <AuthCtx.Provider value={{ user, loading, login, logout, sessionExpired, clearExpired: () => setSessionExpired(false) }}>
      {children}
    </AuthCtx.Provider>
  );
}
