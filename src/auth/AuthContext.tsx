import {createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode} from 'react';
import {apiFetch, getToken, setToken} from './api';

export type BookId = 'q1' | 'q2' | 'q3';
export type AuthUser = {username: string; fullName: string; books: BookId[]; status: string; expired: boolean; expiresAt: string | null};
export type ServerState = {completed?: Record<string, boolean>; bookmarks?: Record<string, any>; attempts?: Record<string, any>};
export type LastPosition = {book: BookId; sectionId: string; page: number; at: string} | null;

type Ctx = {
  user: AuthUser | null;
  ready: boolean; // đã biết trạng thái đăng nhập
  serverState: ServerState | null;
  lastPosition: LastPosition;
  login: (username: string, password: string) => Promise<string | null>; // trả về lỗi nếu có
  logout: () => void;
  hasBook: (b: BookId) => boolean;
  loginOpen: boolean;
  openLogin: () => void;
  closeLogin: () => void;
};

const AuthCtx = createContext<Ctx | null>(null);

export function AuthProvider({children}: {children: ReactNode}) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [ready, setReady] = useState(!getToken());
  const [serverState, setServerState] = useState<ServerState | null>(null);
  const [lastPosition, setLast] = useState<LastPosition>(null);
  const [loginOpen, setLoginOpen] = useState(false);
  const alive = useRef(true);

  const loadMe = useCallback(async () => {
    try {
      const res = await apiFetch('/api/me');
      if (!alive.current) return;
      if (res.ok) {
        const d = await res.json();
        setUser(d.user);
        setServerState(d.state || {});
        setLast(d.last || null);
      } else {
        if (res.status === 401) setToken(null);
        setUser(null);
        setServerState(null);
      }
    } catch {
      // mất mạng: giữ nguyên trạng thái
    } finally {
      if (alive.current) setReady(true);
    }
  }, []);

  useEffect(() => {
    alive.current = true;
    if (getToken()) loadMe();
    return () => {
      alive.current = false;
    };
  }, [loadMe]);

  const login = useCallback(
    async (username: string, password: string) => {
      try {
        const res = await fetch('/api/auth/login', {
          method: 'POST',
          headers: {'Content-Type': 'application/json'},
          body: JSON.stringify({username, password}),
        });
        const d = await res.json().catch(() => ({}));
        if (!res.ok) return (d.error as string) || 'Đăng nhập thất bại';
        setToken(d.token);
        setReady(false);
        await loadMe();
        setLoginOpen(false);
        return null;
      } catch {
        return 'Không kết nối được máy chủ. Kiểm tra mạng rồi thử lại.';
      }
    },
    [loadMe]
  );

  const logout = useCallback(() => {
    setToken(null);
    setUser(null);
    setServerState(null);
    setLast(null);
  }, []);

  const value = useMemo<Ctx>(
    () => ({
      user,
      ready,
      serverState,
      lastPosition,
      login,
      logout,
      hasBook: (b) => !!user && user.books.includes(b),
      loginOpen,
      openLogin: () => setLoginOpen(true),
      closeLogin: () => setLoginOpen(false),
    }),
    [user, ready, serverState, lastPosition, login, logout, loginOpen]
  );
  return <AuthCtx.Provider value={value}>{children}</AuthCtx.Provider>;
}

export function useAuth(): Ctx {
  const c = useContext(AuthCtx);
  if (!c) throw new Error('useAuth must be used inside AuthProvider');
  return c;
}
