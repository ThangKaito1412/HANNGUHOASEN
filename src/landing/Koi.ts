/** Cá chép Koi nhìn từ trên xuống: thân thon có đốm màu, vây trong suốt, sóng bơi lan từ đầu đến đuôi. */

type Pt = {x: number; y: number};
type Patch = {u: number; v: number; rx: number; ry: number; c: string};

export type Koi = {
  x: number;
  y: number;
  ang: number;
  size: number;
  speed: number;
  spd: number; // tốc độ hiện tại (0..~2.5)
  turn: number;
  trail: Pt[];
  phase: number;
  wph: number;
  base: string;
  fin: string;
  patches: Patch[];
};

const SEGMENTS = 24;

type Variety = {base: string; fin: string; make: (r: () => number) => Patch[]};

const RED = '#e5432a';
const ORANGE = '#f0742a';
const INK = '#1b212b';
const WHITE = '#f7f2ea';

const VARIETIES: Variety[] = [
  {
    // Kohaku: trắng - đỏ
    base: WHITE,
    fin: '#ffffff',
    make: (r) => [
      {u: 0.1, v: (r() - 0.5) * 0.3, rx: 0.9, ry: 0.85, c: RED},
      {u: 0.38, v: (r() - 0.5) * 0.5, rx: 1.5, ry: 0.8, c: RED},
      {u: 0.62, v: (r() - 0.5) * 0.4, rx: 1.1, ry: 0.6, c: RED},
    ],
  },
  {
    // Sanke: trắng - đỏ - đen
    base: WHITE,
    fin: '#ffffff',
    make: (r) => [
      {u: 0.14, v: 0, rx: 1.0, ry: 0.8, c: ORANGE},
      {u: 0.45, v: (r() - 0.5) * 0.5, rx: 1.4, ry: 0.85, c: RED},
      {u: 0.3, v: 0.5, rx: 0.5, ry: 0.35, c: INK},
      {u: 0.55, v: -0.4, rx: 0.45, ry: 0.35, c: INK},
      {u: 0.75, v: 0.2, rx: 0.4, ry: 0.3, c: INK},
    ],
  },
  {
    // Cam trơn có đốm trắng
    base: ORANGE,
    fin: '#ffd9b0',
    make: (r) => [
      {u: 0.12, v: (r() - 0.5) * 0.3, rx: 0.8, ry: 0.7, c: '#fff1dc'},
      {u: 0.5, v: (r() - 0.5) * 0.5, rx: 1.3, ry: 0.6, c: '#fff1dc'},
      {u: 0.7, v: (r() - 0.5) * 0.3, rx: 0.9, ry: 0.5, c: RED},
    ],
  },
  {
    // Ogon vàng kim
    base: '#f0b93f',
    fin: '#ffe9a8',
    make: () => [
      {u: 0.25, v: 0, rx: 2.4, ry: 0.35, c: '#ffe08a'},
      {u: 0.6, v: 0.15, rx: 1.4, ry: 0.4, c: '#f7cf62'},
    ],
  },
  {
    // Showa: đen - đỏ - trắng
    base: INK,
    fin: '#c9d6e4',
    make: (r) => [
      {u: 0.1, v: 0, rx: 1.0, ry: 0.9, c: RED},
      {u: 0.4, v: (r() - 0.5) * 0.4, rx: 1.6, ry: 0.7, c: RED},
      {u: 0.68, v: (r() - 0.5) * 0.4, rx: 1.0, ry: 0.6, c: WHITE},
    ],
  },
  {
    // Trắng - cam nhạt
    base: '#fbf4ea',
    fin: '#ffffff',
    make: (r) => [
      {u: 0.08, v: 0, rx: 0.85, ry: 0.8, c: ORANGE},
      {u: 0.52, v: (r() - 0.5) * 0.5, rx: 1.7, ry: 0.75, c: ORANGE},
    ],
  },
];

export function makeKoi(i: number, W: number, H: number, scale: number, r: () => number): Koi {
  const v = VARIETIES[i % VARIETIES.length];
  const size = (11 + r() * 6) * scale;
  const x = r() * W;
  const y = r() * H;
  return {
    x,
    y,
    ang: r() * Math.PI * 2,
    size,
    speed: 0.65 + r() * 0.5,
    spd: 1,
    turn: 0,
    trail: Array.from({length: SEGMENTS}, () => ({x, y})),
    phase: r() * 10,
    wph: r() * 10,
    base: v.base,
    fin: v.fin,
    patches: v.make(r),
  };
}

// ------------------------------------------------------------------
const PU = [0, 0.05, 0.15, 0.3, 0.5, 0.72, 0.9, 1];
const PV = [0.26, 0.66, 0.95, 1.0, 0.8, 0.44, 0.24, 0.18];
function profile(u: number) {
  for (let i = 1; i < PU.length; i++) {
    if (u <= PU[i]) {
      const k = (u - PU[i - 1]) / (PU[i] - PU[i - 1]);
      const s = k * k * (3 - 2 * k);
      return PV[i - 1] + (PV[i] - PV[i - 1]) * s;
    }
  }
  return PV[PV.length - 1];
}

function smoothClosed(ctx: CanvasRenderingContext2D, pts: Pt[]) {
  const n = pts.length;
  const mid = (a: Pt, b: Pt) => ({x: (a.x + b.x) / 2, y: (a.y + b.y) / 2});
  const s = mid(pts[n - 1], pts[0]);
  ctx.beginPath();
  ctx.moveTo(s.x, s.y);
  for (let i = 0; i < n; i++) {
    const m = mid(pts[i], pts[(i + 1) % n]);
    ctx.quadraticCurveTo(pts[i].x, pts[i].y, m.x, m.y);
  }
  ctx.closePath();
}

function fin(ctx: CanvasRenderingContext2D, x: number, y: number, ang: number, len: number, wid: number, color: string, alpha: number) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(ang);
  const g = ctx.createLinearGradient(0, 0, len, 0);
  g.addColorStop(0, color);
  g.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.globalAlpha = alpha;
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.bezierCurveTo(len * 0.3, -wid, len * 0.75, -wid * 0.7, len, -wid * 0.1);
  ctx.bezierCurveTo(len * 0.85, wid * 0.1, len * 0.75, wid * 0.7, len * 0.3, wid);
  ctx.bezierCurveTo(len * 0.15, wid * 0.7, 0, wid * 0.3, 0, 0);
  ctx.fill();
  // fin rays
  ctx.globalAlpha = alpha * 0.35;
  ctx.strokeStyle = 'rgba(255,255,255,0.9)';
  ctx.lineWidth = 0.6;
  for (let k = -2; k <= 2; k++) {
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(len * 0.92, k * wid * 0.28);
    ctx.stroke();
  }
  ctx.restore();
}

export function stepKoi(f: Koi, dt: number, desiredAng: number, speedMul: number, now: number) {
  // burst & glide: tốc độ lên xuống nhịp nhàng
  const glide = 0.72 + 0.4 * (0.5 + 0.5 * Math.sin(now / 1000 * 0.55 + f.phase));
  const target = f.speed * glide * speedMul;
  f.spd += (target - f.spd) * 0.05 * dt;
  // giới hạn tốc độ quay để cá không "bẻ góc" đột ngột
  let d = ((desiredAng - f.ang + Math.PI) % (Math.PI * 2)) - Math.PI;
  if (d < -Math.PI) d += Math.PI * 2;
  const maxTurn = 0.05 * dt;
  f.ang += Math.max(-maxTurn, Math.min(maxTurn, d * 0.09 * dt));
  f.x += Math.cos(f.ang) * f.spd * dt * 1.45;
  f.y += Math.sin(f.ang) * f.spd * dt * 1.45;
  f.wph += (0.05 + 0.07 * f.spd) * dt;
  f.trail[0].x = f.x;
  f.trail[0].y = f.y;
  const seg = f.size * 0.58;
  for (let i = 1; i < f.trail.length; i++) {
    const p = f.trail[i];
    const q = f.trail[i - 1];
    const dx = q.x - p.x;
    const dy = q.y - p.y;
    const dist = Math.hypot(dx, dy) || 1;
    if (dist > seg) {
      p.x = q.x - (dx / dist) * seg;
      p.y = q.y - (dy / dist) * seg;
    }
  }
}

export function drawKoi(ctx: CanvasRenderingContext2D, f: Koi) {
  const n = f.trail.length;
  const S = f.size;

  // 1. xương sống có sóng bơi
  const tang: Pt[] = f.trail.map((p, i) => {
    const a = f.trail[Math.max(0, i - 1)];
    const b = f.trail[Math.min(n - 1, i + 1)];
    const dx = b.x - a.x;
    const dy = a.y - b.y; // đảo để dùng (dy) cho pháp tuyến
    const l = Math.hypot(dx, dy) || 1;
    return {x: dx / l, y: -dy / l};
  });
  const amp = S * (0.35 + f.spd * 0.45);
  const spine: Pt[] = f.trail.map((p, i) => {
    const u = i / (n - 1);
    const nx = -tang[i].y;
    const ny = tang[i].x;
    const lat = Math.sin(f.wph - u * 3.6) * amp * (0.04 + u * u * 1.0);
    return {x: p.x + nx * lat, y: p.y + ny * lat};
  });
  const norm: Pt[] = spine.map((p, i) => {
    const a = spine[Math.max(0, i - 1)];
    const b = spine[Math.min(n - 1, i + 1)];
    const dx = b.x - a.x;
    const dy = b.y - a.y;
    const l = Math.hypot(dx, dy) || 1;
    return {x: -dy / l, y: dx / l};
  });
  const wid = (i: number) => S * profile(i / (n - 1));

  // 2. đường viền thân
  const outline: Pt[] = [];
  const hd = {x: spine[0].x - spine[2].x, y: spine[0].y - spine[2].y};
  const hl = Math.hypot(hd.x, hd.y) || 1;
  outline.push({x: spine[0].x + (hd.x / hl) * S * 0.38, y: spine[0].y + (hd.y / hl) * S * 0.38});
  for (let i = 0; i < n; i++) outline.push({x: spine[i].x + norm[i].x * wid(i), y: spine[i].y + norm[i].y * wid(i)});
  const td = {x: spine[n - 1].x - spine[n - 3].x, y: spine[n - 1].y - spine[n - 3].y};
  const tl = Math.hypot(td.x, td.y) || 1;
  const tdir = {x: td.x / tl, y: td.y / tl};
  outline.push({x: spine[n - 1].x + tdir.x * S * 0.2, y: spine[n - 1].y + tdir.y * S * 0.2});
  for (let i = n - 1; i >= 0; i--) outline.push({x: spine[i].x - norm[i].x * wid(i), y: spine[i].y - norm[i].y * wid(i)});

  // 3. bóng cá trên đáy ao (mềm)
  ctx.save();
  ctx.translate(9, 13);
  smoothClosed(ctx, outline);
  ctx.fillStyle = 'rgba(0,28,38,0.16)';
  ctx.fill();
  ctx.lineWidth = 5;
  ctx.strokeStyle = 'rgba(0,28,38,0.07)';
  ctx.stroke();
  ctx.restore();

  const tailAng = Math.atan2(tdir.y, tdir.x);
  const sway = Math.sin(f.wph - 3.6 - 0.9);
  const t = performance.now() / 1000;

  // 4. vây bụng + vây ngực (trong suốt, vỗ nhẹ)
  const pairFin = (idx: number, len: number, wd: number, base: number, flap: number, alpha: number) => {
    const p = spine[idx];
    const nm = norm[idx];
    const w = wid(idx);
    const back = Math.atan2(spine[idx + 2].y - spine[idx - 1].y, spine[idx + 2].x - spine[idx - 1].x);
    for (const s of [-1, 1]) {
      const ang = back + s * (base + flap * Math.sin(t * 3 + f.phase + (s > 0 ? 0 : 1.2)));
      fin(ctx, p.x + nm.x * w * 0.8 * s, p.y + nm.y * w * 0.8 * s, ang, len, wd, f.fin, alpha);
    }
  };
  pairFin(5, S * 2.0, S * 0.55, 0.85, 0.22, 0.7);
  pairFin(12, S * 1.2, S * 0.4, 0.7, 0.12, 0.6);

  // 5. vây đuôi: 3 thùy mềm, đung đưa trễ pha so với thân
  const tx = spine[n - 1].x;
  const ty = spine[n - 1].y;
  fin(ctx, tx, ty, tailAng + 0.55 + sway * 0.5, S * 3.4, S * 1.1, f.fin, 0.72);
  fin(ctx, tx, ty, tailAng - 0.55 + sway * 0.5, S * 3.4, S * 1.1, f.fin, 0.72);
  fin(ctx, tx, ty, tailAng + sway * 0.55, S * 4.1, S * 1.2, f.fin, 0.8);

  // 6. thân: màu nền + đốm (cắt theo thân) + bóng khối
  ctx.save();
  smoothClosed(ctx, outline);
  ctx.clip();
  ctx.fillStyle = f.base;
  ctx.globalAlpha = 1;
  smoothClosed(ctx, outline);
  ctx.fill();
  for (const p of f.patches) {
    const fi = Math.min(n - 1.001, Math.max(0, p.u * (n - 1)));
    const i0 = Math.floor(fi);
    const k = fi - i0;
    const cx = spine[i0].x + (spine[i0 + 1].x - spine[i0].x) * k;
    const cy = spine[i0].y + (spine[i0 + 1].y - spine[i0].y) * k;
    const nx = norm[i0].x;
    const ny = norm[i0].y;
    const w = wid(i0);
    const ang = Math.atan2(spine[i0 + 1].y - spine[i0].y, spine[i0 + 1].x - spine[i0].x);
    const ox = cx + nx * p.v * w;
    const oy = cy + ny * p.v * w;
    ctx.fillStyle = p.c;
    ctx.globalAlpha = 0.96;
    ctx.beginPath();
    ctx.ellipse(ox, oy, p.rx * S * 0.9, p.ry * S * 0.8, ang, 0, 6.3);
    ctx.ellipse(ox + Math.cos(ang) * S * 0.7, oy + Math.sin(ang) * S * 0.7 + p.v * 2, p.rx * S * 0.55, p.ry * S * 0.7, ang + 0.4, 0, 6.3);
    ctx.fill();
  }
  ctx.globalAlpha = 1;
  // vệt sáng sống lưng
  ctx.beginPath();
  spine.forEach((p, i) => (i ? ctx.lineTo(p.x, p.y) : ctx.moveTo(p.x, p.y)));
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.strokeStyle = 'rgba(255,255,255,0.2)';
  ctx.lineWidth = S * 0.7;
  ctx.stroke();
  ctx.strokeStyle = 'rgba(255,255,255,0.18)';
  ctx.lineWidth = S * 0.25;
  ctx.stroke();
  // tối dần ra mép thân
  smoothClosed(ctx, outline);
  ctx.strokeStyle = 'rgba(0,25,40,0.3)';
  ctx.lineWidth = S * 0.55;
  ctx.stroke();
  // vảy: các đường cong mảnh
  ctx.strokeStyle = 'rgba(0,0,0,0.07)';
  ctx.lineWidth = 0.8;
  for (let i = 3; i < n - 4; i += 2) {
    const p = spine[i];
    const nm = norm[i];
    const w = wid(i);
    ctx.beginPath();
    ctx.moveTo(p.x - nm.x * w, p.y - nm.y * w);
    ctx.quadraticCurveTo(p.x + (spine[i + 1].x - p.x) * 1.6, p.y + (spine[i + 1].y - p.y) * 1.6, p.x + nm.x * w, p.y + nm.y * w);
    ctx.stroke();
  }
  ctx.restore();

  // 7. đầu: râu, mang, mắt
  const nose = outline[0];
  const nn = norm[0];
  ctx.strokeStyle = 'rgba(40,30,20,0.55)';
  ctx.lineWidth = 0.9;
  ctx.lineCap = 'round';
  for (const s of [-1, 1]) {
    ctx.beginPath();
    ctx.moveTo(nose.x, nose.y);
    ctx.quadraticCurveTo(nose.x + (hd.x / hl) * S * 0.3 + nn.x * S * 0.5 * s, nose.y + (hd.y / hl) * S * 0.3 + nn.y * S * 0.5 * s, nose.x + nn.x * S * 0.8 * s, nose.y + nn.y * S * 0.8 * s - (hd.y / hl) * 2);
    ctx.stroke();
  }
  // mang
  ctx.strokeStyle = 'rgba(0,0,0,0.18)';
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  const g1 = spine[3];
  const gn = norm[3];
  const gw = wid(3);
  ctx.moveTo(g1.x + gn.x * gw * 0.9, g1.y + gn.y * gw * 0.9);
  ctx.quadraticCurveTo(spine[2].x, spine[2].y, g1.x - gn.x * gw * 0.9, g1.y - gn.y * gw * 0.9);
  ctx.stroke();
  // mắt
  const ei = 2;
  for (const s of [-1, 1]) {
    const ex = spine[ei].x + norm[ei].x * wid(ei) * 0.82 * s;
    const ey = spine[ei].y + norm[ei].y * wid(ei) * 0.82 * s;
    ctx.fillStyle = '#10181f';
    ctx.beginPath();
    ctx.arc(ex, ey, S * 0.2, 0, 6.3);
    ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.85)';
    ctx.beginPath();
    ctx.arc(ex - S * 0.06, ey - S * 0.07, S * 0.06, 0, 6.3);
    ctx.fill();
  }
  ctx.globalAlpha = 1;
}
