import crypto from 'crypto';
import {ADMIN_PASS_SALT, ADMIN_PASS_SCRYPT, ADMIN_USER_SHA256} from './adminCred';

const sha256 = (s: string) => crypto.createHash('sha256').update(s).digest('hex');
const safeEq = (a: string, b: string) => {
  const x = Buffer.from(a);
  const y = Buffer.from(b);
  return x.length === y.length && crypto.timingSafeEqual(x, y);
};

// Khóa ký token: đặt SESSION_SECRET trên máy chủ để bảo mật tốt nhất.
const SECRET = process.env.SESSION_SECRET || sha256('hnhs-session-' + ADMIN_PASS_SCRYPT + (process.env.ADMIN_PASSWORD || ''));

const b64 = (b: Buffer | string) => Buffer.from(b).toString('base64url');

export type TokenPayload = {role: 'admin' | 'student'; sub: string; exp: number};

export function signToken(sub: string, role: TokenPayload['role'], ttlSec: number): string {
  const body = b64(JSON.stringify({role, sub, exp: Math.floor(Date.now() / 1000) + ttlSec} satisfies TokenPayload));
  const sig = crypto.createHmac('sha256', SECRET).update(body).digest('base64url');
  return body + '.' + sig;
}

export function verifyToken(token: string | undefined | null): TokenPayload | null {
  if (!token) return null;
  const [body, sig] = token.split('.');
  if (!body || !sig) return null;
  const expect = crypto.createHmac('sha256', SECRET).update(body).digest('base64url');
  if (!safeEq(sig, expect)) return null;
  try {
    const p = JSON.parse(Buffer.from(body, 'base64url').toString('utf8')) as TokenPayload;
    if (!p.exp || p.exp < Date.now() / 1000) return null;
    return p;
  } catch {
    return null;
  }
}

export function hashPassword(password: string) {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.scryptSync(password, salt, 64).toString('hex');
  return {salt, hash};
}

export function verifyPassword(password: string, salt: string, hash: string) {
  try {
    return safeEq(crypto.scryptSync(password, salt, 64).toString('hex'), hash);
  } catch {
    return false;
  }
}

export function checkAdmin(user: string, pass: string): boolean {
  const envU = process.env.ADMIN_USER;
  const envP = process.env.ADMIN_PASSWORD;
  if (envU && envP) {
    return safeEq(sha256(user.toLowerCase()), sha256(envU.toLowerCase())) && safeEq(sha256(pass), sha256(envP));
  }
  const okUser = safeEq(sha256(user.toLowerCase()), ADMIN_USER_SHA256);
  const okPass = verifyPassword(pass, ADMIN_PASS_SALT, ADMIN_PASS_SCRYPT);
  return okUser && okPass;
}

export function bearer(header: string | undefined): string | null {
  if (!header) return null;
  const m = /^Bearer\s+(.+)$/i.exec(header);
  return m ? m[1] : null;
}
