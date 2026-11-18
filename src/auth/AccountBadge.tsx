import {LogIn, LogOut, UserRound} from 'lucide-react';
import {useAuth} from './AuthContext';

export function AccountBadge({compact = false}: {compact?: boolean}) {
  const {user, ready, openLogin, logout} = useAuth();
  if (!ready) return null;
  if (!user) {
    return (
      <button
        onClick={openLogin}
        className="inline-flex items-center gap-1.5 rounded-lg bg-amber-700 px-3 py-1.5 text-xs font-bold text-white shadow-2xs transition hover:bg-amber-800 whitespace-nowrap shrink-0"
      >
        <LogIn className="h-3.5 w-3.5" /> Đăng nhập
      </button>
    );
  }
  return (
    <div className="flex items-center gap-2 shrink-0">
      <span
        className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-50 px-2.5 py-1.5 text-xs font-semibold text-emerald-800 border border-emerald-200 whitespace-nowrap"
        title={'Tài khoản: ' + user.username}
      >
        <UserRound className="h-3.5 w-3.5" />
        {compact ? user.username : user.fullName || user.username}
      </span>
      <button
        onClick={logout}
        className="inline-flex items-center gap-1 rounded-lg border border-stone-200 px-2 py-1.5 text-xs font-medium text-stone-600 hover:bg-stone-100 whitespace-nowrap"
        title="Đăng xuất"
      >
        <LogOut className="h-3.5 w-3.5" />
        <span className="hidden sm:inline">Thoát</span>
      </button>
    </div>
  );
}
