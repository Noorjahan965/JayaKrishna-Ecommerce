import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { authApi } from '../services/api';

const AuthContext = createContext(null);
export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null); // null = guest
  const [ready, setReady] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    authApi.me().then((u) => setUser(u || null)).finally(() => setReady(true));
  }, []);

  const login = useCallback(async (creds) => {
    const u = await authApi.login(creds);
    setUser(u);
    return u;
  }, []);

  const register = useCallback(async (data) => {
    const u = await authApi.register(data);
    setUser(u);
    return u;
  }, []);

  const logout = useCallback(async () => {
    await authApi.logout();
    setUser(null);
  }, []);

  /**
   * The Amazon/Flipkart behaviour: guests browse freely; the moment they try to buy,
   * send them to /login and remember what they wanted (`intent`) plus where they were (`from`).
   * Returns true when the user is signed in and the action may proceed immediately.
   */
  const requireAuth = useCallback(
    (intent) => {
      if (user) return true;
      navigate('/login', { state: { from: location.pathname + location.search, intent } });
      return false;
    },
    [user, navigate, location]
  );

  const value = useMemo(
    () => ({ user, ready, isGuest: !user, login, register, logout, requireAuth }),
    [user, ready, login, register, logout, requireAuth]
  );
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
