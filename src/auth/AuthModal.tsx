import {useEffect, useState} from 'react';
import {KeyRound, Loader2, MessageCircle, Phone, X} from 'lucide-react';
import {useAuth} from './AuthContext';
import {CENTER} from './api';

export function AuthModal() {
  const {loginOpen, closeLogin, login} = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!loginOpen) return;
    const k = (e: KeyboardEvent) => e.key === 'Escape' && closeLogin();
    window.addEventListener('keydown', k);
    return () => window.removeEventListener('keydown', k);
  }, [loginOpen, closeLogin]);

  if (!loginOpen) return null;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    setErr(null);
    const msg = await login(username.trim(), password);
    setBusy(false);
    if (msg) setErr(msg);
    else setPassword('');
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-stone-900/60 p-4" onClick={closeLogin}>
      <div className="relative w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <button onClick={closeLogin} className="absolute right-3 top-3 rounded-lg p-1.5 text-stone-500 hover:bg-stone-100" aria-label="Đóng">
          <X className="h-5 w-5" />
        </button>
        <div className="flex items-center gap-2 text-amber-800">
          <KeyRound className="h-5 w-5" />
          <h2 className="font-['Fraunces'] text-xl font-bold text-stone-900">Đăng nhập học viên</h2>
        </div>
        <p className="mt-1 text-xs text-stone-600">Dùng tài khoản do Hán Ngữ Hoa Sen cấp. Tiến độ học được lưu theo tài khoản, đổi thiết bị vẫn còn.</p>
        <form onSubmit={submit} className="mt-4 space-y-3">
          <label className="block text-xs font-semibold text-stone-700">
            Tên đăng nhập
            <input
              autoFocus
              autoCapitalize="none"
              autoCorrect="off"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="mt-1 w-full rounded-xl border border-stone-300 px-3 py-2.5 text-sm outline-none focus:border-amber-600 focus:ring-2 focus:ring-amber-200"
            />
          </label>
          <label className="block text-xs font-semibold text-stone-700">
            Mật khẩu
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1 w-full rounded-xl border border-stone-300 px-3 py-2.5 text-sm outline-none focus:border-amber-600 focus:ring-2 focus:ring-amber-200"
            />
          </label>
          {err && <p className="rounded-lg bg-rose-50 px-3 py-2 text-xs font-medium text-rose-700">{err}</p>}
          <button
            disabled={busy || !username || !password}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-amber-700 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-amber-800 disabled:opacity-50"
          >
            {busy && <Loader2 className="h-4 w-4 animate-spin" />} Đăng nhập
          </button>
        </form>
        <div className="mt-4 border-t border-stone-100 pt-3 text-xs text-stone-600">
          Chưa có tài khoản? Liên hệ trung tâm để đăng ký:
          <div className="mt-2 flex flex-wrap gap-2">
            <a href={CENTER.phoneLink} className="inline-flex items-center gap-1.5 rounded-lg border border-stone-200 px-3 py-1.5 font-semibold text-stone-800 hover:bg-stone-50">
              <Phone className="h-3.5 w-3.5" /> {CENTER.phone}
            </a>
            <a href={CENTER.zalo} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 rounded-lg bg-sky-600 px-3 py-1.5 font-semibold text-white hover:bg-sky-700">
              <MessageCircle className="h-3.5 w-3.5" /> Nhắn Zalo
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
