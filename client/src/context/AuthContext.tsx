import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import type { Role, User, PageId } from '../types';
import { USERS, ROLE_PAGES } from '../constants/rbac';

interface AuthState {
  user: User | null;
  currentRole: Role | null;
  allowedPages: PageId[];
  login: (loginInput: string, password: string) => boolean;
  logout: () => void;
}

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [currentRole, setCurrentRole] = useState<Role | null>(null);

  // Restore session from localStorage on mount
  useEffect(() => {
    const savedLogin = localStorage.getItem('skyframe-auth');
    if (savedLogin && USERS[savedLogin]) {
      const u = USERS[savedLogin];
      setUser({ login: savedLogin, role: u.role, name: u.name });
      setCurrentRole(u.role);
    }
  }, []);

  function login(loginInput: string, password: string): boolean {
    const key = loginInput.trim().toLowerCase();
    const pass = password.trim().toLowerCase();
    const found = USERS[key];
    if (!found || found.password !== pass) return false;
    localStorage.setItem('skyframe-auth', key);
    localStorage.setItem('skyframe-role', found.role);
    setUser({ login: key, role: found.role, name: found.name });
    setCurrentRole(found.role);
    return true;
  }

  function logout() {
    localStorage.removeItem('skyframe-auth');
    localStorage.removeItem('skyframe-role');
    setUser(null);
    setCurrentRole(null);
  }

  const allowedPages: PageId[] = currentRole ? ROLE_PAGES[currentRole] : [];

  return (
    <AuthContext.Provider value={{ user, currentRole, allowedPages, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthState {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}
