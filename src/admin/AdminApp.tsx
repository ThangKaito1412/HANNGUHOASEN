import {useCallback, useEffect, useMemo, useState} from 'react';
import {BarChart3, BookOpen, Copy, Download, KeyRound, Loader2, LogOut, Plus, RefreshCw, Search, ShieldAlert, ShieldCheck, Trash2, UserPlus, Users, X} from 'lucide-react';

type BookId = 'q1' | 'q2' | 'q3';
const BOOK_LABEL: Record<BookId, string> = {q1: 'Quyển 1', q2: 'Quyển 2', q3: 'Quyển 3'};
const BOOKS: BookId[] = ['q1', 'q2', 'q3'];

type Student = {
  username: string;
  fullName: string;
  phone: string;
  email: string;
  note: string;
  books: BookId[];
  effectiveBooks: BookId[];
  amountPaid: number;
  purchasedAt: string;
  expiresAt: string | null;
  status: 'active' | 'revoked';
  expired: boolean;
  createdAt: string;
  lastLoginAt: string | null;
  lastSeenAt: string | null;
  loginCount: number;
  lastPosition: {book: BookId; sectionId: string; page: number; at: string} | null;
  progress?: {lessonsOpened: number; completedCount: number; byBook: {book: BookId; opened: number}[]};
};
type Overview = {
  storage: 'file' | 'postgres';
  totals: Record<string, number>;
  byBook: {book: BookId; users: number}[];
  months: {month: string; revenue: number; sold: number}[];
  topLessons: {key: string; learners: number; visits: number}[];
  recent: {username: string; fullName: string; lastSeenAt: string; position: Student['lastPosition']}[];
};
type Curriculum = Record<BookId, {id: string; title: string}[]>;
type Detail = {user: Student; lessons: Record<string, {visits: number; firstAt: string; lastAt: string; maxPage: number}>; completed: Record<string, boolean>; state: {bookmarks: number; attempts: number}};

const TOKEN_KEY = 'hnhs_admin_token_v1';
const money = (n: number) => (n || 0).toLocaleString('vi-VN') + ' đ';
const fmtDate = (s: string | null) => (s ? new Date(s).toLocaleString('vi-VN', {dateStyle: 'short', timeStyle: 'short'}) : '—');
const fmtDay = (s: string | null) => (s ? s.split('-').reverse().join('/') : '—');
const ago = (s: string | null) => {
  if (!s) return 'chưa từng';
  const d = (Date.now() - Date.parse(s)) / 1000;
  if (d < 90) return 'vừa xong';
  if (d < 3600) return Math.round(d / 60) + ' phút trước';
  if (d < 86400) return Math.round(d / 3600) + ' giờ trước';
  return Math.round(d / 86400) + ' ngày trước';
};

function randomPassword(len = 8) {
  const chars = 'abcdefghjkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  const a = new Uint32Array(len);
  crypto.getRandomValues(a);
  return Array.from(a, (x) => chars[x % chars.length]).join('');
}
function slugName(name: string) {
  return name
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/gi, 'd')
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '')
    .slice(0, 14);
}

export default function AdminApp() {
  const [token, setToken] = useState<string | null>(() => {
    try {
      return sessionStorage.getItem(TOKEN_KEY);
    } catch {
      return null;
    }
  });

  const logout = useCallback(() => {
    try {
      sessionStorage.removeItem(TOKEN_KEY);
    } catch {
      // ignore
    }
    setToken(null);
  }, []);

  const api = useCallback(
    async (path: string, init: RequestInit = {}) => {
      const headers = new Headers(init.headers);
      if (token) headers.set('Authorization', 'Bearer ' + token);
      if (init.body) headers.set('Content-Type', 'application/json');
      const res = await fetch('/api/admin' + path, {...init, headers});
      const data = await res.json().catch(() => ({}));
      if (res.status === 401 && token) logout();
      if (!res.ok) throw new Error(data.error || 'Lỗi ' + res.status);
      return data;
    },
    [token, logout]
  );

  if (!token) {
    return (
      <Login
        onDone={(t) => {
          try {
            sessionStorage.setItem(TOKEN_KEY, t);
          } catch {
            // ignore
          }
          setToken(t);
        }}
      />
    );
  }
  return <Dashboard api={api} onLogout={logout} />;
}

// ------------------------------------------------------------------ đăng nhập
function Login({onDone}: {onDone: (token: string) => void}) {
  const [u, setU] = useState('');
  const [p, setP] = useState('');
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setErr(null);
    try {
      const res = await fetch('/api/admin/login', {method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({username: u, password: p})});
      const d = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(d.error || 'Đăng nhập thất bại');
      onDone(d.token);
    } catch (e2) {
      setErr(e2 instanceof Error ? e2.message : 'Lỗi kết nối');
    } finally {
      setBusy(false);
    }
  };
  return (
    <div className="flex min-h-screen items-center justify-center bg-stone-900 p-4">
      <form onSubmit={submit} className="w-full max-w-sm rounded-2xl bg-white p-7 shadow-2xl">
        <div className="flex items-center gap-2 text-amber-800">
          <ShieldCheck className="h-6 w-6" />
          <h1 className="font-['Fraunces'] text-2xl font-bold text-stone-900">Quản trị Hoa Sen</h1>
        </div>
        <p className="mt-1 text-xs text-stone-500">Chỉ dành cho quản trị viên của Hán Ngữ Hoa Sen.</p>
        <label className="mt-5 block text-xs font-semibold text-stone-700">
          Tài khoản
          <input autoFocus autoCapitalize="none" value={u} onChange={(e) => setU(e.target.value)} className="mt-1 w-full rounded-xl border border-stone-300 px-3 py-2.5 text-sm outline-none focus:border-amber-600 focus:ring-2 focus:ring-amber-200" />
        </label>
        <label className="mt-3 block text-xs font-semibold text-stone-700">
          Mật khẩu
          <input type="password" value={p} onChange={(e) => setP(e.target.value)} className="mt-1 w-full rounded-xl border border-stone-300 px-3 py-2.5 text-sm outline-none focus:border-amber-600 focus:ring-2 focus:ring-amber-200" />
        </label>
        {err && <p className="mt-3 rounded-lg bg-rose-50 px-3 py-2 text-xs font-medium text-rose-700">{err}</p>}
        <button disabled={busy || !u || !p} className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-amber-700 px-4 py-2.5 text-sm font-bold text-white hover:bg-amber-800 disabled:opacity-50">
          {busy && <Loader2 className="h-4 w-4 animate-spin" />} Đăng nhập
        </button>
        <a href="/" className="mt-4 block text-center text-xs text-stone-500 hover:text-stone-800">
          ← Về trang chủ
        </a>
      </form>
    </div>
  );
}

// ------------------------------------------------------------------ bảng điều khiển
type Api = (path: string, init?: RequestInit) => Promise<any>;
type Tab = 'overview' | 'students' | 'new';

function Dashboard({api, onLogout}: {api: Api; onLogout: () => void}) {
  const [tab, setTab] = useState<Tab>('overview');
  const [students, setStudents] = useState<Student[]>([]);
  const [overview, setOverview] = useState<Overview | null>(null);
  const [curr, setCurr] = useState<Curriculum | null>(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [detail, setDetail] = useState<string | null>(null);
  const [edit, setEdit] = useState<Student | null>(null);

  const reload = useCallback(async () => {
    setLoading(true);
    setErr(null);
    try {
      const [o, s, c] = await Promise.all([api('/overview'), api('/users'), api('/curriculum')]);
      setOverview(o);
      setStudents(s);
      setCurr(c);
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Lỗi tải dữ liệu');
    } finally {
      setLoading(false);
    }
  }, [api]);
  useEffect(() => {
    reload();
  }, [reload]);

  const titleOf = useCallback(
    (key: string) => {
      const [b, id] = key.split(':');
      const t = curr?.[b as BookId]?.find((x) => x.id === id)?.title;
      return `${BOOK_LABEL[b as BookId] || b} · ${t || id}`;
    },
    [curr]
  );

  const TabBtn = ({id, icon: Icon, label}: {id: Tab; icon: any; label: string}) => (
    <button onClick={() => setTab(id)} className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold transition ${tab === id ? 'bg-amber-700 text-white' : 'text-stone-700 hover:bg-stone-200/70'}`}>
      <Icon className="h-4 w-4" />
      {label}
    </button>
  );

  return (
    <div className="min-h-screen bg-[#F6F4EE] text-stone-900">
      <header className="sticky top-0 z-30 border-b border-stone-200 bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-4 py-3">
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-amber-700" />
            <span className="font-['Fraunces'] text-lg font-bold">Quản trị Hán Ngữ Hoa Sen</span>
          </div>
          <nav className="flex flex-wrap items-center gap-1">
            <TabBtn id="overview" icon={BarChart3} label="Tổng quan" />
            <TabBtn id="students" icon={Users} label={`Học viên (${students.length})`} />
            <TabBtn id="new" icon={UserPlus} label="Thêm học viên" />
          </nav>
          <div className="flex items-center gap-2">
            <button onClick={reload} className="rounded-lg border border-stone-200 p-2 text-stone-600 hover:bg-stone-100" title="Tải lại">
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
            <a href="/" className="rounded-lg border border-stone-200 px-3 py-2 text-xs font-medium text-stone-600 hover:bg-stone-100">
              Trang chủ
            </a>
            <button onClick={onLogout} className="inline-flex items-center gap-1.5 rounded-lg bg-stone-900 px-3 py-2 text-xs font-semibold text-white hover:bg-stone-700">
              <LogOut className="h-3.5 w-3.5" /> Thoát
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl space-y-5 px-4 py-6">
        {err && <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-800">{err}</div>}
        {overview?.storage === 'file' && (
          <div className="flex items-start gap-3 rounded-xl border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-900">
            <ShieldAlert className="mt-0.5 h-5 w-5 shrink-0" />
            <div>
              <b>Dữ liệu đang lưu tạm trên máy chủ</b> và sẽ <b>mất khi deploy lại hoặc khởi động lại</b> (gói Free của Render). Hãy tạo cơ sở dữ liệu PostgreSQL miễn phí (Neon hoặc Supabase) và đặt biến môi trường <code className="rounded bg-amber-100 px-1">DATABASE_URL</code> trên Render để dữ liệu học viên được lưu vĩnh viễn.
            </div>
          </div>
        )}

        {tab === 'overview' && overview && <OverviewView o={overview} titleOf={titleOf} onOpen={(u) => setDetail(u)} />}
        {tab === 'students' && <StudentsView students={students} onDetail={(u) => setDetail(u)} onEdit={setEdit} api={api} reload={reload} />}
        {tab === 'new' && (
          <div className="mx-auto max-w-2xl rounded-2xl border border-stone-200 bg-white p-5 shadow-xs">
            <h2 className="mb-4 font-['Fraunces'] text-xl font-bold">Cấp tài khoản mới</h2>
            <StudentForm
              api={api}
              onSaved={() => {
                reload();
              }}
            />
          </div>
        )}
      </main>

      {detail && curr && <DetailModal username={detail} api={api} curr={curr} onClose={() => setDetail(null)} />}
      {edit && (
        <Modal onClose={() => setEdit(null)} title={`Sửa học viên: ${edit.username}`}>
          <StudentForm
            api={api}
            initial={edit}
            onSaved={() => {
              setEdit(null);
              reload();
            }}
          />
        </Modal>
      )}
    </div>
  );
}

function Modal({title, onClose, children}: {title: string; onClose: () => void; children: React.ReactNode}) {
  useEffect(() => {
    const k = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', k);
    return () => window.removeEventListener('keydown', k);
  }, [onClose]);
  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-stone-900/60 p-4" onClick={onClose}>
      <div className="relative my-6 w-full max-w-3xl rounded-2xl bg-white p-5 shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="mb-4 flex items-center justify-between gap-3">
          <h2 className="font-['Fraunces'] text-xl font-bold">{title}</h2>
          <button onClick={onClose} className="rounded-lg p-1.5 text-stone-500 hover:bg-stone-100">
            <X className="h-5 w-5" />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

// ------------------------------------------------------------------ tổng quan
function Stat({label, value, sub, tone = 'stone'}: {label: string; value: string | number; sub?: string; tone?: 'stone' | 'green' | 'amber' | 'rose'}) {
  const c = {stone: 'text-stone-900', green: 'text-emerald-700', amber: 'text-amber-700', rose: 'text-rose-700'}[tone];
  return (
    <div className="rounded-2xl border border-stone-200 bg-white p-4 shadow-xs">
      <div className="text-xs font-medium text-stone-500">{label}</div>
      <div className={`mt-1 text-2xl font-bold tabular-nums ${c}`}>{value}</div>
      {sub && <div className="mt-0.5 text-[11px] text-stone-500">{sub}</div>}
    </div>
  );
}

function Bars({items, fmt}: {items: {label: string; value: number}[]; fmt?: (n: number) => string}) {
  const max = Math.max(1, ...items.map((i) => i.value));
  return (
    <div className="space-y-2">
      {items.map((i) => (
        <div key={i.label} className="flex items-center gap-3 text-xs">
          <div className="w-24 shrink-0 text-stone-600">{i.label}</div>
          <div className="h-5 flex-1 overflow-hidden rounded-md bg-stone-100">
            <div className="h-full rounded-md bg-amber-600 transition-all" style={{width: `${(i.value / max) * 100}%`}} />
          </div>
          <div className="w-28 shrink-0 text-right font-semibold tabular-nums text-stone-800">{fmt ? fmt(i.value) : i.value}</div>
        </div>
      ))}
    </div>
  );
}

function OverviewView({o, titleOf, onOpen}: {o: Overview; titleOf: (k: string) => string; onOpen: (u: string) => void}) {
  const t = o.totals;
  return (
    <>
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <Stat label="Tổng tài khoản" value={t.users} />
        <Stat label="Đang hoạt động" value={t.active} tone="green" />
        <Stat label="Đã thu hồi" value={t.revoked} tone="rose" />
        <Stat label="Hết hạn" value={t.expired} tone="amber" />
        <Stat label="Doanh thu tháng này" value={money(t.revenueThisMonth)} tone="green" />
        <Stat label="Tổng doanh thu" value={money(t.revenueTotal)} />
        <Stat label="Học viên mới (30 ngày)" value={t.newLast30} />
        <Stat label="Hoạt động 7 ngày qua" value={t.activeLast7} sub={`${t.neverLoggedIn} tài khoản chưa đăng nhập lần nào`} />
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <section className="rounded-2xl border border-stone-200 bg-white p-4 shadow-xs">
          <h3 className="mb-3 text-sm font-bold">Doanh thu 6 tháng gần nhất</h3>
          <Bars items={o.months.map((m) => ({label: m.month.split('-').reverse().join('/'), value: m.revenue}))} fmt={money} />
          <h3 className="mb-3 mt-5 text-sm font-bold">Số tài khoản theo sách (đang hoạt động)</h3>
          <Bars items={o.byBook.map((b) => ({label: BOOK_LABEL[b.book], value: b.users}))} />
        </section>
        <section className="rounded-2xl border border-stone-200 bg-white p-4 shadow-xs">
          <h3 className="mb-3 text-sm font-bold">Bài được học nhiều nhất</h3>
          {o.topLessons.length === 0 ? (
            <p className="text-xs text-stone-500">Chưa có dữ liệu học.</p>
          ) : (
            <table className="w-full text-left text-xs">
              <thead className="text-stone-500">
                <tr>
                  <th className="pb-1.5 font-medium">Bài</th>
                  <th className="pb-1.5 text-right font-medium">Học viên</th>
                  <th className="pb-1.5 text-right font-medium">Lượt mở</th>
                </tr>
              </thead>
              <tbody>
                {o.topLessons.map((l) => (
                  <tr key={l.key} className="border-t border-stone-100">
                    <td className="py-1.5 pr-2">{titleOf(l.key)}</td>
                    <td className="py-1.5 text-right tabular-nums">{l.learners}</td>
                    <td className="py-1.5 text-right font-semibold tabular-nums">{l.visits}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </section>
      </div>
      <section className="rounded-2xl border border-stone-200 bg-white p-4 shadow-xs">
        <h3 className="mb-3 text-sm font-bold">Hoạt động gần đây</h3>
        {o.recent.length === 0 ? (
          <p className="text-xs text-stone-500">Chưa có học viên nào đăng nhập.</p>
        ) : (
          <div className="divide-y divide-stone-100">
            {o.recent.map((r) => (
              <button key={r.username} onClick={() => onOpen(r.username)} className="flex w-full flex-wrap items-center justify-between gap-2 py-2 text-left text-xs hover:bg-stone-50">
                <span className="font-semibold text-stone-900">
                  {r.fullName || r.username} <span className="font-normal text-stone-500">({r.username})</span>
                </span>
                <span className="text-stone-600">{r.position ? `${BOOK_LABEL[r.position.book]} · trang ${r.position.page}` : '—'}</span>
                <span className="text-stone-500">{ago(r.lastSeenAt)}</span>
              </button>
            ))}
          </div>
        )}
      </section>
    </>
  );
}

// ------------------------------------------------------------------ danh sách học viên
function StatusPill({s}: {s: Student}) {
  if (s.status === 'revoked') return <span className="rounded-full bg-rose-100 px-2 py-0.5 text-[11px] font-semibold text-rose-700">Đã thu hồi</span>;
  if (s.expired) return <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-semibold text-amber-800">Hết hạn</span>;
  return <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[11px] font-semibold text-emerald-800">Hoạt động</span>;
}

function StudentsView({students, onDetail, onEdit, api, reload}: {students: Student[]; onDetail: (u: string) => void; onEdit: (s: Student) => void; api: Api; reload: () => void}) {
  const [q, setQ] = useState('');
  const [st, setSt] = useState<'all' | 'active' | 'revoked' | 'expired'>('all');
  const [book, setBook] = useState<'all' | BookId>('all');
  const [busy, setBusy] = useState<string | null>(null);

  const list = useMemo(() => {
    const k = q.trim().toLowerCase();
    return students.filter((s) => {
      if (k && !`${s.username} ${s.fullName} ${s.phone} ${s.email}`.toLowerCase().includes(k)) return false;
      if (st === 'active' && !(s.status === 'active' && !s.expired)) return false;
      if (st === 'revoked' && s.status !== 'revoked') return false;
      if (st === 'expired' && !(s.status === 'active' && s.expired)) return false;
      if (book !== 'all' && !s.books.includes(book)) return false;
      return true;
    });
  }, [students, q, st, book]);

  const act = async (u: Student, fn: () => Promise<any>) => {
    setBusy(u.username);
    try {
      await fn();
      reload();
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Lỗi');
    } finally {
      setBusy(null);
    }
  };

  const resetPw = (u: Student) => {
    const pw = randomPassword();
    if (!confirm(`Đặt lại mật khẩu cho "${u.username}"?\nMật khẩu mới: ${pw}\n(Hãy gửi cho học viên. Mật khẩu cũ sẽ không dùng được nữa.)`)) return;
    act(u, async () => {
      await api('/users/' + u.username, {method: 'PATCH', body: JSON.stringify({password: pw})});
      try {
        await navigator.clipboard.writeText(`Tài khoản: ${u.username}\nMật khẩu: ${pw}`);
        alert('Đã đặt lại và sao chép vào bộ nhớ tạm:\nTài khoản: ' + u.username + '\nMật khẩu: ' + pw);
      } catch {
        alert('Mật khẩu mới: ' + pw);
      }
    });
  };

  const exportCsv = () => {
    const rows = [['Tài khoản', 'Họ tên', 'SĐT', 'Email', 'Sách', 'Số tiền', 'Ngày mua', 'Hạn dùng', 'Trạng thái', 'Lần đăng nhập', 'Hoạt động gần nhất', 'Bài đã mở', 'Ghi chú']];
    for (const s of list) {
      rows.push([s.username, s.fullName, s.phone, s.email, s.books.map((b) => BOOK_LABEL[b]).join(' + '), String(s.amountPaid), s.purchasedAt, s.expiresAt || 'Vĩnh viễn', s.status === 'revoked' ? 'Đã thu hồi' : s.expired ? 'Hết hạn' : 'Hoạt động', String(s.loginCount), s.lastSeenAt || '', String(s.progress?.lessonsOpened || 0), s.note]);
    }
    const csv = '\ufeff' + rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\r\n');
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([csv], {type: 'text/csv;charset=utf-8'}));
    a.download = 'hoc-vien-hoa-sen.csv';
    a.click();
  };

  return (
    <section className="rounded-2xl border border-stone-200 bg-white p-4 shadow-xs">
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <div className="relative min-w-[200px] flex-1">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-stone-400" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Tìm tên, tài khoản, số điện thoại…" className="w-full rounded-xl border border-stone-300 py-2 pl-9 pr-3 text-sm outline-none focus:border-amber-600" />
        </div>
        <select value={st} onChange={(e) => setSt(e.target.value as typeof st)} className="rounded-xl border border-stone-300 px-3 py-2 text-sm">
          <option value="all">Mọi trạng thái</option>
          <option value="active">Đang hoạt động</option>
          <option value="expired">Hết hạn</option>
          <option value="revoked">Đã thu hồi</option>
        </select>
        <select value={book} onChange={(e) => setBook(e.target.value as typeof book)} className="rounded-xl border border-stone-300 px-3 py-2 text-sm">
          <option value="all">Mọi sách</option>
          {BOOKS.map((b) => (
            <option key={b} value={b}>
              {BOOK_LABEL[b]}
            </option>
          ))}
        </select>
        <button onClick={exportCsv} className="inline-flex items-center gap-1.5 rounded-xl border border-stone-300 px-3 py-2 text-sm font-medium hover:bg-stone-50">
          <Download className="h-4 w-4" /> Xuất CSV
        </button>
      </div>

      {list.length === 0 ? (
        <p className="py-10 text-center text-sm text-stone-500">Chưa có học viên phù hợp.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px] text-left text-xs">
            <thead className="border-b border-stone-200 text-stone-500">
              <tr>
                <th className="px-2 py-2 font-medium">Học viên</th>
                <th className="px-2 py-2 font-medium">Sách</th>
                <th className="px-2 py-2 font-medium">Mua / hạn</th>
                <th className="px-2 py-2 font-medium">Tiến độ</th>
                <th className="px-2 py-2 font-medium">Hoạt động</th>
                <th className="px-2 py-2 font-medium">Trạng thái</th>
                <th className="px-2 py-2 text-right font-medium">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {list.map((s) => (
                <tr key={s.username} className="border-b border-stone-100 align-top hover:bg-stone-50/70">
                  <td className="px-2 py-2.5">
                    <button onClick={() => onDetail(s.username)} className="text-left">
                      <div className="font-semibold text-stone-900 hover:text-amber-800">{s.fullName || '(chưa nhập tên)'}</div>
                      <div className="text-stone-500">
                        {s.username}
                        {s.phone && ` · ${s.phone}`}
                      </div>
                    </button>
                  </td>
                  <td className="px-2 py-2.5">{s.books.length ? s.books.map((b) => BOOK_LABEL[b]).join(', ') : <span className="text-stone-400">—</span>}</td>
                  <td className="px-2 py-2.5">
                    <div>{money(s.amountPaid)}</div>
                    <div className="text-stone-500">
                      {fmtDay(s.purchasedAt)} → {s.expiresAt ? fmtDay(s.expiresAt) : 'vĩnh viễn'}
                    </div>
                  </td>
                  <td className="px-2 py-2.5">
                    <div className="font-semibold tabular-nums">{s.progress?.lessonsOpened || 0} bài đã mở</div>
                    <div className="text-stone-500">{s.progress?.completedCount || 0} bài đánh dấu xong</div>
                    {s.lastPosition && (
                      <div className="text-stone-500">
                        Đang ở: {BOOK_LABEL[s.lastPosition.book]} · tr.{s.lastPosition.page}
                      </div>
                    )}
                  </td>
                  <td className="px-2 py-2.5">
                    <div>{ago(s.lastSeenAt)}</div>
                    <div className="text-stone-500">{s.loginCount} lần đăng nhập</div>
                  </td>
                  <td className="px-2 py-2.5">
                    <StatusPill s={s} />
                  </td>
                  <td className="px-2 py-2.5">
                    <div className="flex flex-wrap justify-end gap-1">
                      <button disabled={busy === s.username} onClick={() => onEdit(s)} className="rounded-lg border border-stone-200 px-2 py-1 font-medium hover:bg-stone-100">
                        Sửa
                      </button>
                      <button disabled={busy === s.username} onClick={() => resetPw(s)} className="rounded-lg border border-stone-200 px-2 py-1 font-medium hover:bg-stone-100" title="Đặt lại mật khẩu">
                        <KeyRound className="inline h-3.5 w-3.5" />
                      </button>
                      {s.status === 'active' ? (
                        <button
                          disabled={busy === s.username}
                          onClick={() => confirm(`Thu hồi tài khoản "${s.username}"? Học viên sẽ không đăng nhập hoặc học được nữa (có thể khôi phục).`) && act(s, () => api('/users/' + s.username, {method: 'PATCH', body: JSON.stringify({status: 'revoked'})}))}
                          className="rounded-lg border border-rose-200 px-2 py-1 font-medium text-rose-700 hover:bg-rose-50"
                        >
                          Thu hồi
                        </button>
                      ) : (
                        <button disabled={busy === s.username} onClick={() => act(s, () => api('/users/' + s.username, {method: 'PATCH', body: JSON.stringify({status: 'active'})}))} className="rounded-lg border border-emerald-200 px-2 py-1 font-medium text-emerald-700 hover:bg-emerald-50">
                          Khôi phục
                        </button>
                      )}
                      <button
                        disabled={busy === s.username}
                        onClick={() => confirm(`XÓA hẳn học viên "${s.username}" cùng toàn bộ tiến độ học? Không thể hoàn tác.`) && act(s, () => api('/users/' + s.username, {method: 'DELETE'}))}
                        className="rounded-lg border border-stone-200 px-2 py-1 text-stone-500 hover:bg-rose-50 hover:text-rose-700"
                        title="Xóa"
                      >
                        <Trash2 className="inline h-3.5 w-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

// ------------------------------------------------------------------ form thêm / sửa
function StudentForm({api, initial, onSaved}: {api: Api; initial?: Student; onSaved: () => void}) {
  const editing = !!initial;
  const [f, setF] = useState({
    fullName: initial?.fullName || '',
    phone: initial?.phone || '',
    email: initial?.email || '',
    username: initial?.username || '',
    password: editing ? '' : randomPassword(),
    books: (initial?.books || ['q1']) as BookId[],
    amountPaid: String(initial?.amountPaid ?? ''),
    purchasedAt: initial?.purchasedAt || new Date().toISOString().slice(0, 10),
    expiresAt: initial?.expiresAt || '',
    note: initial?.note || '',
  });
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [created, setCreated] = useState<{username: string; password: string} | null>(null);
  const set = (k: keyof typeof f, v: string | BookId[]) => setF((p) => ({...p, [k]: v}));

  const toggleBook = (b: BookId) => set('books', f.books.includes(b) ? f.books.filter((x) => x !== b) : [...f.books, b]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setErr(null);
    try {
      const body = {
        fullName: f.fullName,
        phone: f.phone,
        email: f.email,
        books: f.books,
        amountPaid: Number(String(f.amountPaid).replace(/[^\d]/g, '')) || 0,
        purchasedAt: f.purchasedAt,
        expiresAt: f.expiresAt || null,
        note: f.note,
      };
      if (editing) {
        await api('/users/' + initial!.username, {method: 'PATCH', body: JSON.stringify({...body, ...(f.password ? {password: f.password} : {})})});
        onSaved();
      } else {
        await api('/users', {method: 'POST', body: JSON.stringify({...body, username: f.username, password: f.password})});
        setCreated({username: f.username.toLowerCase(), password: f.password});
        onSaved();
      }
    } catch (e2) {
      setErr(e2 instanceof Error ? e2.message : 'Lỗi');
    } finally {
      setBusy(false);
    }
  };

  if (created) {
    const msg = `Hán Ngữ Hoa Sen – Tài khoản học sách điện tử\nTên đăng nhập: ${created.username}\nMật khẩu: ${created.password}\nĐăng nhập tại: ${location.origin}/sach`;
    return (
      <div className="space-y-4">
        <div className="rounded-xl border border-emerald-300 bg-emerald-50 p-4">
          <div className="mb-2 flex items-center gap-2 font-bold text-emerald-800">
            <ShieldCheck className="h-5 w-5" /> Đã tạo tài khoản
          </div>
          <pre className="whitespace-pre-wrap rounded-lg bg-white p-3 text-sm text-stone-800">{msg}</pre>
          <p className="mt-2 text-xs text-emerald-900">Mật khẩu chỉ hiển thị lúc này (hệ thống chỉ lưu bản mã hóa). Hãy gửi cho học viên ngay; sau này có thể đặt lại mật khẩu mới.</p>
          <div className="mt-3 flex gap-2">
            <button onClick={() => navigator.clipboard.writeText(msg)} className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-700 px-3 py-2 text-xs font-bold text-white hover:bg-emerald-800">
              <Copy className="h-3.5 w-3.5" /> Sao chép
            </button>
            <button onClick={() => setCreated(null)} className="inline-flex items-center gap-1.5 rounded-lg border border-stone-300 px-3 py-2 text-xs font-semibold hover:bg-white">
              <Plus className="h-3.5 w-3.5" /> Thêm học viên khác
            </button>
          </div>
        </div>
      </div>
    );
  }

  const field = 'mt-1 w-full rounded-xl border border-stone-300 px-3 py-2 text-sm outline-none focus:border-amber-600 focus:ring-2 focus:ring-amber-200';
  return (
    <form onSubmit={submit} className="grid gap-3 sm:grid-cols-2">
      <label className="text-xs font-semibold text-stone-700 sm:col-span-2">
        Họ và tên học viên
        <input
          value={f.fullName}
          onChange={(e) => {
            set('fullName', e.target.value);
            if (!editing && !f.username) setF((p) => ({...p, fullName: e.target.value, username: slugName(e.target.value)}));
          }}
          className={field}
        />
      </label>
      <label className="text-xs font-semibold text-stone-700">
        Số điện thoại
        <input value={f.phone} onChange={(e) => set('phone', e.target.value)} className={field} inputMode="tel" />
      </label>
      <label className="text-xs font-semibold text-stone-700">
        Email (không bắt buộc)
        <input value={f.email} onChange={(e) => set('email', e.target.value)} className={field} type="email" />
      </label>
      <label className="text-xs font-semibold text-stone-700">
        Tên đăng nhập
        <input value={f.username} onChange={(e) => set('username', e.target.value.toLowerCase())} disabled={editing} className={field + (editing ? ' bg-stone-100' : '')} placeholder="vd: nguyenvana" autoCapitalize="none" />
      </label>
      <label className="text-xs font-semibold text-stone-700">
        {editing ? 'Mật khẩu mới (bỏ trống nếu không đổi)' : 'Mật khẩu'}
        <div className="flex gap-1.5">
          <input value={f.password} onChange={(e) => set('password', e.target.value)} className={field} autoComplete="off" />
          <button type="button" onClick={() => set('password', randomPassword())} className="mt-1 shrink-0 rounded-xl border border-stone-300 px-2.5 text-xs font-medium hover:bg-stone-50" title="Tạo ngẫu nhiên">
            <RefreshCw className="h-4 w-4" />
          </button>
        </div>
      </label>
      <div className="sm:col-span-2">
        <div className="text-xs font-semibold text-stone-700">Sách được học (ngoài 3 bài đầu Quyển 1 + Phiên âm là miễn phí)</div>
        <div className="mt-1.5 flex flex-wrap gap-2">
          {BOOKS.map((b) => (
            <label key={b} className={`inline-flex cursor-pointer items-center gap-2 rounded-xl border px-3 py-2 text-sm font-medium ${f.books.includes(b) ? 'border-amber-600 bg-amber-50 text-amber-900' : 'border-stone-300 text-stone-700'}`}>
              <input type="checkbox" checked={f.books.includes(b)} onChange={() => toggleBook(b)} />
              <BookOpen className="h-4 w-4" /> {BOOK_LABEL[b]}
            </label>
          ))}
        </div>
      </div>
      <label className="text-xs font-semibold text-stone-700">
        Số tiền đã thanh toán (đồng)
        <input value={f.amountPaid} onChange={(e) => set('amountPaid', e.target.value)} className={field} inputMode="numeric" placeholder="vd: 300000" />
      </label>
      <label className="text-xs font-semibold text-stone-700">
        Ngày mua
        <input type="date" value={f.purchasedAt} onChange={(e) => set('purchasedAt', e.target.value)} className={field} />
      </label>
      <label className="text-xs font-semibold text-stone-700">
        Hạn sử dụng (bỏ trống = vĩnh viễn)
        <input type="date" value={f.expiresAt} onChange={(e) => set('expiresAt', e.target.value)} className={field} />
      </label>
      <label className="text-xs font-semibold text-stone-700">
        Ghi chú
        <input value={f.note} onChange={(e) => set('note', e.target.value)} className={field} placeholder="vd: chuyển khoản MB, lớp tối 2-4-6" />
      </label>
      {err && <p className="rounded-lg bg-rose-50 px-3 py-2 text-xs font-medium text-rose-700 sm:col-span-2">{err}</p>}
      <div className="sm:col-span-2">
        <button disabled={busy || (!editing && (!f.username || f.password.length < 6))} className="inline-flex items-center gap-2 rounded-xl bg-amber-700 px-5 py-2.5 text-sm font-bold text-white hover:bg-amber-800 disabled:opacity-50">
          {busy && <Loader2 className="h-4 w-4 animate-spin" />}
          {editing ? 'Lưu thay đổi' : 'Tạo tài khoản'}
        </button>
      </div>
    </form>
  );
}

// ------------------------------------------------------------------ chi tiết học viên
function DetailModal({username, api, curr, onClose}: {username: string; api: Api; curr: Curriculum; onClose: () => void}) {
  const [d, setD] = useState<Detail | null>(null);
  const [err, setErr] = useState<string | null>(null);
  useEffect(() => {
    api('/users/' + username)
      .then(setD)
      .catch((e) => setErr(e instanceof Error ? e.message : 'Lỗi'));
  }, [api, username]);

  return (
    <Modal onClose={onClose} title={d ? `${d.user.fullName || d.user.username}` : 'Đang tải…'}>
      {err && <p className="text-sm text-rose-700">{err}</p>}
      {!d && !err && <Loader2 className="mx-auto my-8 h-6 w-6 animate-spin text-amber-700" />}
      {d && (
        <div className="space-y-5">
          <div className="grid gap-2 rounded-xl bg-stone-50 p-3 text-xs sm:grid-cols-2">
            <div>Tài khoản: <b>{d.user.username}</b> <StatusPill s={d.user} /></div>
            <div>Điện thoại: <b>{d.user.phone || '—'}</b></div>
            <div>Sách: <b>{d.user.books.map((b) => BOOK_LABEL[b]).join(', ') || '—'}</b></div>
            <div>Đã thanh toán: <b>{money(d.user.amountPaid)}</b></div>
            <div>Ngày mua: <b>{fmtDay(d.user.purchasedAt)}</b> · Hạn: <b>{d.user.expiresAt ? fmtDay(d.user.expiresAt) : 'vĩnh viễn'}</b></div>
            <div>Đăng nhập: <b>{d.user.loginCount}</b> lần · gần nhất {fmtDate(d.user.lastLoginAt)}</div>
            <div>Hoạt động gần nhất: <b>{ago(d.user.lastSeenAt)}</b></div>
            <div>
              Đang học dở:{' '}
              <b>{d.user.lastPosition ? `${BOOK_LABEL[d.user.lastPosition.book]} · trang ${d.user.lastPosition.page}` : '—'}</b>
            </div>
            <div>Từ đã lưu sổ tay: <b>{d.state.bookmarks}</b> · Bài tập đã làm: <b>{d.state.attempts}</b></div>
            {d.user.note && <div className="sm:col-span-2">Ghi chú: {d.user.note}</div>}
          </div>

          {BOOKS.map((b) => {
            const secs = curr[b] || [];
            const opened = secs.filter((s) => d.lessons[`${b}:${s.id}`]).length;
            const done = secs.filter((s) => d.completed[s.id]).length;
            if (!secs.length) return null;
            return (
              <div key={b}>
                <div className="mb-1.5 flex items-center justify-between text-sm font-bold">
                  <span>{BOOK_LABEL[b]}</span>
                  <span className="text-xs font-medium text-stone-500">
                    Đã mở {opened}/{secs.length} bài · đánh dấu xong {done}
                  </span>
                </div>
                <div className="mb-2 h-2 overflow-hidden rounded-full bg-stone-200">
                  <div className="h-full bg-emerald-600" style={{width: `${(opened / secs.length) * 100}%`}} />
                </div>
                <div className="max-h-64 overflow-y-auto rounded-xl border border-stone-200">
                  <table className="w-full text-left text-xs">
                    <tbody>
                      {secs.map((s) => {
                        const l = d.lessons[`${b}:${s.id}`];
                        return (
                          <tr key={s.id} className="border-b border-stone-100 last:border-0">
                            <td className="px-2.5 py-1.5">{s.title}</td>
                            <td className="px-2.5 py-1.5 text-stone-500">{l ? `${l.visits} lượt · tr.${l.maxPage}` : <span className="text-stone-300">chưa mở</span>}</td>
                            <td className="px-2.5 py-1.5 text-stone-500">{l ? ago(l.lastAt) : ''}</td>
                            <td className="px-2.5 py-1.5 text-right">{d.completed[s.id] ? <span className="font-semibold text-emerald-700">✓ xong</span> : ''}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </Modal>
  );
}
