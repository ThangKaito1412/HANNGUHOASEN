import express, {type NextFunction, type Request, type Response} from 'express';
import fs from 'fs';
import path from 'path';
import {bearer, checkAdmin, hashPassword, signToken, verifyPassword, verifyToken} from './auth';
import type {Store} from './store';

type BookId = 'q1' | 'q2' | 'q3';
const BOOKS: BookId[] = ['q1', 'q2', 'q3'];

/** Phần miễn phí cho mọi người: 3 bài đầu Quyển 1 (Phiên âm luôn miễn phí, nằm ngoài sách). */
const FREE_SECTIONS: Partial<Record<BookId, string[]>> = {q1: ['bai_01', 'bai_02', 'bai_03']};
const FREE_EXERCISES: Partial<Record<BookId, string[]>> = {q1: ['q1_b01', 'q1_b02', 'q1_b03']};

const CONTENT_DIR = path.join(process.cwd(), 'private', 'aistudio');
const FILES: Record<BookId, {textbook: string; exercises: string}> = {
  q1: {textbook: 'giao_trinh_tieng_trung_q1_13d0c89b.json', exercises: 'bai_tap_tieng_trung_q1_c99e6c3e.json'},
  q2: {textbook: 'giao_trinh_tieng_trung_q2_9478e204.json', exercises: 'bai_tap_tieng_trung_q2_794d6e50.json'},
  q3: {textbook: 'giao_trinh_tieng_trung_q3_02b0244c.json', exercises: 'bai_tap_tieng_trung_q3_534a5904.json'},
};
const contentCache = new Map<string, any>();
function loadContent(book: BookId, kind: 'textbook' | 'exercises') {
  const key = book + ':' + kind;
  if (!contentCache.has(key)) {
    contentCache.set(key, JSON.parse(fs.readFileSync(path.join(CONTENT_DIR, FILES[book][kind]), 'utf8')));
  }
  return contentCache.get(key);
}

type UserDoc = {
  username: string;
  fullName: string;
  phone: string;
  email: string;
  note: string;
  books: BookId[];
  amountPaid: number;
  purchasedAt: string; // yyyy-mm-dd
  expiresAt: string | null; // yyyy-mm-dd | null = vĩnh viễn
  status: 'active' | 'revoked';
  salt: string;
  hash: string;
  createdAt: string;
  lastLoginAt: string | null;
  lastSeenAt: string | null;
  loginCount: number;
  lastPosition: {book: BookId; sectionId: string; page: number; at: string} | null;
};

const now = () => new Date().toISOString();
const todayStr = () => new Date().toISOString().slice(0, 10);

function isExpired(u: UserDoc) {
  return !!u.expiresAt && Date.parse(u.expiresAt + 'T23:59:59') < Date.now();
}
function effectiveBooks(u: UserDoc): BookId[] {
  if (u.status !== 'active' || isExpired(u)) return [];
  return (u.books || []).filter((b) => BOOKS.includes(b));
}
function publicUser(u: UserDoc) {
  return {
    username: u.username,
    fullName: u.fullName,
    books: effectiveBooks(u),
    status: u.status,
    expired: isExpired(u),
    expiresAt: u.expiresAt,
  };
}
function adminUser(u: UserDoc) {
  const {salt: _s, hash: _h, ...rest} = u;
  void _s;
  void _h;
  return {...rest, expired: isExpired(u), effectiveBooks: effectiveBooks(u)};
}

// --- chống đoán mật khẩu: tối đa 10 lần / 10 phút / IP cho mỗi loại đăng nhập
const attempts = new Map<string, {n: number; reset: number}>();
function loginLimiter(scope: string) {
  return (req: Request, res: Response, next: NextFunction) => {
    const k = scope + ':' + (req.ip || '?');
    const t = Date.now();
    const rec = attempts.get(k);
    if (!rec || rec.reset < t) {
      attempts.set(k, {n: 1, reset: t + 600_000});
      return next();
    }
    if (++rec.n > 10) {
      return res.status(429).json({error: 'Thử đăng nhập quá nhiều lần. Vui lòng đợi vài phút rồi thử lại.'});
    }
    next();
  };
}
function clearAttempts(scope: string, ip?: string) {
  attempts.delete(scope + ':' + (ip || '?'));
}

export function createApiRouter(store: Store) {
  const r = express.Router();

  const getUser = async (username: string): Promise<UserDoc | null> => store.get('users', username.toLowerCase());

  async function studentFrom(req: Request): Promise<UserDoc | null> {
    const p = verifyToken(bearer(req.headers.authorization));
    if (!p || p.role !== 'student') return null;
    const u = await getUser(p.sub);
    if (!u || u.status !== 'active' || isExpired(u)) return null;
    return u;
  }
  const requireStudent = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const u = await studentFrom(req);
      if (!u) return res.status(401).json({error: 'Phiên đăng nhập hết hạn hoặc tài khoản không còn hiệu lực.'});
      (req as any).user = u;
      next();
    } catch (e) {
      next(e);
    }
  };
  const requireAdmin = (req: Request, res: Response, next: NextFunction) => {
    const p = verifyToken(bearer(req.headers.authorization));
    if (!p || p.role !== 'admin') return res.status(401).json({error: 'Cần đăng nhập quản trị.'});
    next();
  };

  // ---------------------------------------------------------------- học viên
  r.post('/auth/login', loginLimiter('login'), async (req, res, next) => {
    try {
      const username = String(req.body?.username || '').trim().toLowerCase();
      const password = String(req.body?.password || '');
      const u = username ? await getUser(username) : null;
      if (!u || !verifyPassword(password, u.salt, u.hash)) {
        return res.status(401).json({error: 'Sai tên đăng nhập hoặc mật khẩu.'});
      }
      if (u.status !== 'active') {
        return res.status(403).json({error: 'Tài khoản này đã bị thu hồi. Vui lòng liên hệ trung tâm.'});
      }
      if (isExpired(u)) {
        return res.status(403).json({error: 'Tài khoản đã hết hạn. Vui lòng liên hệ trung tâm để gia hạn.'});
      }
      u.lastLoginAt = u.lastSeenAt = now();
      u.loginCount = (u.loginCount || 0) + 1;
      await store.put('users', u.username, u);
      clearAttempts('login', req.ip);
      res.json({token: signToken(u.username, 'student', 60 * 86400), user: publicUser(u)});
    } catch (e) {
      next(e);
    }
  });

  r.get('/me', requireStudent, async (req, res, next) => {
    try {
      const u = (req as any).user as UserDoc;
      const state = (await store.get('state', u.username)) || {};
      res.json({user: publicUser(u), state, last: u.lastPosition});
    } catch (e) {
      next(e);
    }
  });

  r.put('/state', requireStudent, async (req, res, next) => {
    try {
      const u = (req as any).user as UserDoc;
      const cur = (await store.get('state', u.username)) || {};
      const b = req.body || {};
      const next_ = {...cur};
      for (const k of ['completed', 'bookmarks', 'attempts']) {
        if (b[k] && typeof b[k] === 'object') next_[k] = b[k];
      }
      if (JSON.stringify(next_).length > 1_500_000) return res.status(413).json({error: 'Dữ liệu quá lớn'});
      next_.updatedAt = now();
      await store.put('state', u.username, next_);
      res.json({ok: true});
    } catch (e) {
      next(e);
    }
  });

  r.post('/track', requireStudent, async (req, res, next) => {
    try {
      const u = (req as any).user as UserDoc;
      const book = String(req.body?.book) as BookId;
      const sectionId = String(req.body?.sectionId || '').slice(0, 80);
      const page = Number(req.body?.page) || 1;
      if (!BOOKS.includes(book) || !sectionId) return res.status(400).json({error: 'Dữ liệu không hợp lệ'});
      const allowed = effectiveBooks(u).includes(book) || (FREE_SECTIONS[book] || []).includes(sectionId);
      if (!allowed) return res.json({ok: false});
      const t = (await store.get('track', u.username)) || {lessons: {}};
      const key = `${book}:${sectionId}`;
      const l = t.lessons[key] || {visits: 0, firstAt: now(), maxPage: 0};
      const lastAt = l.lastAt ? Date.parse(l.lastAt) : 0;
      if (Date.now() - lastAt > 5 * 60_000) l.visits += 1; // 1 lượt = lần mở mới cách >5 phút
      l.lastAt = now();
      l.maxPage = Math.max(l.maxPage || 0, page);
      t.lessons[key] = l;
      await store.put('track', u.username, t);
      u.lastSeenAt = now();
      u.lastPosition = {book, sectionId, page, at: now()};
      await store.put('users', u.username, u);
      res.json({ok: true});
    } catch (e) {
      next(e);
    }
  });

  // ---------------------------------------------------------------- nội dung sách (lọc theo quyền)
  r.get('/content/:book/:kind', async (req, res, next) => {
    try {
      const book = req.params.book as BookId;
      const kind = req.params.kind as 'textbook' | 'exercises';
      if (!BOOKS.includes(book) || (kind !== 'textbook' && kind !== 'exercises')) return res.status(404).end();
      const u = await studentFrom(req);
      const full = !!u && effectiveBooks(u).includes(book);
      res.setHeader('Cache-Control', 'private, no-store');
      const data = loadContent(book, kind);
      if (full) return res.json(data);
      const free = (kind === 'textbook' ? FREE_SECTIONS : FREE_EXERCISES)[book];
      if (!free) return res.status(403).json({error: 'locked'});
      if (kind === 'textbook') {
        const sections = data.sections.map((s: any) =>
          free.includes(s.id) ? s : {...s, vocabulary: [], vocab_count: 0, locked: true}
        );
        return res.json({...data, sections});
      }
      const lessons = data.lessons.map((l: any) => (free.includes(l.lesson_id) ? l : {...l, exercises: [], locked: true}));
      res.json({...data, lessons});
    } catch (e) {
      next(e);
    }
  });

  // ---------------------------------------------------------------- quản trị
  r.post('/admin/login', loginLimiter('admin'), (req, res) => {
    const user = String(req.body?.username || '');
    const pass = String(req.body?.password || '');
    if (!user || !pass || !checkAdmin(user, pass)) {
      return res.status(401).json({error: 'Sai tài khoản hoặc mật khẩu quản trị.'});
    }
    clearAttempts('admin', req.ip);
    res.json({token: signToken('admin', 'admin', 12 * 3600), storage: store.kind});
  });

  r.get('/admin/curriculum', requireAdmin, (_req, res) => {
    const out: Record<string, {id: string; title: string}[]> = {};
    for (const b of BOOKS) {
      try {
        out[b] = loadContent(b, 'textbook').sections.map((s: any) => ({id: s.id, title: s.title_vi}));
      } catch {
        out[b] = [];
      }
    }
    res.json(out);
  });

  const progressSummary = (u: UserDoc, t: any, state: any) => {
    const lessons = t?.lessons || {};
    const keys = Object.keys(lessons);
    const completed = Object.keys(state?.completed || {}).filter((k) => state.completed[k]);
    return {
      lessonsOpened: keys.length,
      completedCount: completed.length,
      byBook: BOOKS.map((b) => ({
        book: b,
        opened: keys.filter((k) => k.startsWith(b + ':')).length,
      })),
    };
  };

  r.get('/admin/users', requireAdmin, async (_req, res, next) => {
    try {
      const [users, tracks, states] = await Promise.all([store.list('users'), store.list('track'), store.list('state')]);
      const tMap = new Map(tracks.map((x) => [x.id, x.data]));
      const sMap = new Map(states.map((x) => [x.id, x.data]));
      res.json(
        users
          .map((x) => x.data as UserDoc)
          .sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''))
          .map((u) => ({...adminUser(u), progress: progressSummary(u, tMap.get(u.username), sMap.get(u.username))}))
      );
    } catch (e) {
      next(e);
    }
  });

  r.get('/admin/users/:u', requireAdmin, async (req, res, next) => {
    try {
      const u = await getUser(req.params.u);
      if (!u) return res.status(404).json({error: 'Không tìm thấy học viên'});
      const [t, s] = await Promise.all([store.get('track', u.username), store.get('state', u.username)]);
      res.json({user: adminUser(u), lessons: t?.lessons || {}, completed: s?.completed || {}, state: {bookmarks: Object.keys(s?.bookmarks || {}).length, attempts: Object.keys(s?.attempts || {}).length}});
    } catch (e) {
      next(e);
    }
  });

  const cleanBooks = (v: any): BookId[] => (Array.isArray(v) ? v.filter((b) => BOOKS.includes(b)) : []);
  const cleanDate = (v: any): string | null => (typeof v === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(v) ? v : null);

  r.post('/admin/users', requireAdmin, async (req, res, next) => {
    try {
      const b = req.body || {};
      const username = String(b.username || '').trim().toLowerCase();
      const password = String(b.password || '');
      if (!/^[a-z0-9._-]{3,32}$/.test(username)) {
        return res.status(400).json({error: 'Tên đăng nhập 3–32 ký tự: chữ thường không dấu, số, . _ -'});
      }
      if (password.length < 6) return res.status(400).json({error: 'Mật khẩu tối thiểu 6 ký tự'});
      if (await getUser(username)) return res.status(409).json({error: 'Tên đăng nhập đã tồn tại'});
      const {salt, hash} = hashPassword(password);
      const u: UserDoc = {
        username,
        fullName: String(b.fullName || '').slice(0, 120),
        phone: String(b.phone || '').slice(0, 30),
        email: String(b.email || '').slice(0, 120),
        note: String(b.note || '').slice(0, 1000),
        books: cleanBooks(b.books),
        amountPaid: Math.max(0, Number(b.amountPaid) || 0),
        purchasedAt: cleanDate(b.purchasedAt) || todayStr(),
        expiresAt: cleanDate(b.expiresAt),
        status: 'active',
        salt,
        hash,
        createdAt: now(),
        lastLoginAt: null,
        lastSeenAt: null,
        loginCount: 0,
        lastPosition: null,
      };
      await store.put('users', username, u);
      res.json({user: adminUser(u)});
    } catch (e) {
      next(e);
    }
  });

  r.patch('/admin/users/:u', requireAdmin, async (req, res, next) => {
    try {
      const u = await getUser(req.params.u);
      if (!u) return res.status(404).json({error: 'Không tìm thấy học viên'});
      const b = req.body || {};
      if (typeof b.fullName === 'string') u.fullName = b.fullName.slice(0, 120);
      if (typeof b.phone === 'string') u.phone = b.phone.slice(0, 30);
      if (typeof b.email === 'string') u.email = b.email.slice(0, 120);
      if (typeof b.note === 'string') u.note = b.note.slice(0, 1000);
      if (b.books !== undefined) u.books = cleanBooks(b.books);
      if (b.amountPaid !== undefined) u.amountPaid = Math.max(0, Number(b.amountPaid) || 0);
      if (b.purchasedAt !== undefined) u.purchasedAt = cleanDate(b.purchasedAt) || u.purchasedAt;
      if (b.expiresAt !== undefined) u.expiresAt = cleanDate(b.expiresAt);
      if (b.status === 'active' || b.status === 'revoked') u.status = b.status;
      if (typeof b.password === 'string' && b.password) {
        if (b.password.length < 6) return res.status(400).json({error: 'Mật khẩu tối thiểu 6 ký tự'});
        const {salt, hash} = hashPassword(b.password);
        u.salt = salt;
        u.hash = hash;
      }
      await store.put('users', u.username, u);
      res.json({user: adminUser(u)});
    } catch (e) {
      next(e);
    }
  });

  r.delete('/admin/users/:u', requireAdmin, async (req, res, next) => {
    try {
      const name = req.params.u.toLowerCase();
      await Promise.all([store.del('users', name), store.del('state', name), store.del('track', name)]);
      res.json({ok: true});
    } catch (e) {
      next(e);
    }
  });

  r.get('/admin/overview', requireAdmin, async (_req, res, next) => {
    try {
      const [users, tracks] = await Promise.all([store.list('users'), store.list('track')]);
      const us = users.map((x) => x.data as UserDoc);
      const day = 86400000;
      const t = Date.now();
      const active = us.filter((u) => u.status === 'active' && !isExpired(u));
      const revoked = us.filter((u) => u.status === 'revoked');
      const expired = us.filter((u) => u.status === 'active' && isExpired(u));
      const ym = (d: string) => d.slice(0, 7);
      const thisMonth = ym(todayStr());
      const months: {month: string; revenue: number; sold: number}[] = [];
      for (let i = 5; i >= 0; i--) {
        const d = new Date();
        d.setDate(1);
        d.setMonth(d.getMonth() - i);
        months.push({month: d.toISOString().slice(0, 7), revenue: 0, sold: 0});
      }
      for (const u of us) {
        const m = months.find((x) => x.month === ym(u.purchasedAt || ''));
        if (m) {
          m.revenue += u.amountPaid || 0;
          m.sold += 1;
        }
      }
      const lessonAgg = new Map<string, {learners: number; visits: number}>();
      for (const tr of tracks) {
        for (const [k, l] of Object.entries<any>(tr.data?.lessons || {})) {
          const a = lessonAgg.get(k) || {learners: 0, visits: 0};
          a.learners += 1;
          a.visits += l.visits || 0;
          lessonAgg.set(k, a);
        }
      }
      const topLessons = [...lessonAgg.entries()]
        .map(([key, v]) => ({key, ...v}))
        .sort((a, b) => b.visits - a.visits)
        .slice(0, 10);
      res.json({
        storage: store.kind,
        totals: {
          users: us.length,
          active: active.length,
          revoked: revoked.length,
          expired: expired.length,
          revenueTotal: us.reduce((s, u) => s + (u.amountPaid || 0), 0),
          revenueThisMonth: us.filter((u) => ym(u.purchasedAt || '') === thisMonth).reduce((s, u) => s + (u.amountPaid || 0), 0),
          newLast30: us.filter((u) => t - Date.parse(u.createdAt) < 30 * day).length,
          activeLast7: us.filter((u) => u.lastSeenAt && t - Date.parse(u.lastSeenAt) < 7 * day).length,
          neverLoggedIn: us.filter((u) => !u.lastLoginAt).length,
          logins: us.reduce((s, u) => s + (u.loginCount || 0), 0),
        },
        byBook: BOOKS.map((b) => ({book: b, users: active.filter((u) => (u.books || []).includes(b)).length})),
        months,
        topLessons,
        recent: us
          .filter((u) => u.lastSeenAt)
          .sort((a, b) => (b.lastSeenAt || '').localeCompare(a.lastSeenAt || ''))
          .slice(0, 8)
          .map((u) => ({username: u.username, fullName: u.fullName, lastSeenAt: u.lastSeenAt, position: u.lastPosition})),
      });
    } catch (e) {
      next(e);
    }
  });

  return r;
}
