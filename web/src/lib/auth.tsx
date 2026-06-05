import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { api } from './api';

export type User = { id: string; email: string; name: string };

type AuthCtx = {
  user: User | null;
  checked: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
};

const AuthContext = createContext<AuthCtx | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [checked, setChecked] = useState(false);

  const init = useCallback(async () => {
    const token = localStorage.getItem('token');
    if (!token) { setChecked(true); return; }
    try {
      const me = await api.get<User>('/auth/me');
      setUser(me);
    } catch {
      localStorage.removeItem('token');
    } finally {
      setChecked(true);
    }
  }, []);

  useEffect(() => { init(); }, [init]);

  const login = async (email: string, password: string) => {
    const res = await api.post<{ token: string; user: User }>('/auth/login', { email, password });
    localStorage.setItem('token', res.token);
    setUser(res.user);
  };

  const logout = () => {
    localStorage.removeItem('token');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, checked, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}
