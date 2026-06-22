import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { api, setAuthToken } from '../services/api.js';
import { authApi } from '../services/auth.service.js';

const AuthContext = createContext(null);
const TOKEN_KEY = 'contabilidad.token';

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem(TOKEN_KEY));
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(Boolean(token));

  // Restaura la sesión al cargar: si hay token, valida con /me.
  useEffect(() => {
    let active = true;
    if (!token) {
      setLoading(false);
      return;
    }
    setAuthToken(token);
    authApi
      .me()
      .then((u) => active && setUser(u))
      .catch(() => {
        if (!active) return;
        localStorage.removeItem(TOKEN_KEY);
        setToken(null);
        setAuthToken(null);
      })
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, [token]);

  // Cierra sesión automáticamente ante un 401 de la API.
  useEffect(() => {
    const id = api.interceptors.response.use(
      (res) => res,
      (error) => {
        if (error.response?.status === 401 && token) {
          logout();
        }
        return Promise.reject(error);
      },
    );
    return () => api.interceptors.response.eject(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  const login = useCallback(async (credentials) => {
    const { token: newToken, usuario } = await authApi.login(credentials);
    localStorage.setItem(TOKEN_KEY, newToken);
    setAuthToken(newToken);
    setUser(usuario);
    setToken(newToken);
    return usuario;
  }, []);

  const logout = useCallback(async () => {
    try {
      await authApi.logout();
    } catch {
      // ignorar errores de red en logout
    }
    localStorage.removeItem(TOKEN_KEY);
    setAuthToken(null);
    setUser(null);
    setToken(null);
  }, []);

  const value = { token, user, loading, isAuthenticated: Boolean(user), login, logout };
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth debe usarse dentro de <AuthProvider>');
  return ctx;
}
