import {useEffect, useMemo, useRef} from 'react';
import {motion, useScroll, useTransform, useSpring, useMotionValue, type MotionValue} from 'motion/react';
import {LilyPad, LotusStatic} from './Lotus';
import {makeKoi, stepKoi, drawKoi, type Koi} from './Koi';

function mulberry32(seed: number) {
  return function () {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

type Ripple = {x: number; y: number; r: number; max: number; a: number; w: number};
type Petal = {x: number; y: number; r: number; vr: number; vx: number; vy: number; s: number};
type Bubble = {x: number; y: number; r: number; vy: number; ph: number};

/** Canvas: cá chép bơi, gợn sóng, cánh hoa trôi, bọt nước, ánh nắng dưới nước. */
function PondCanvas() {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current!;
    const ctx = canvas.getContext('2d')!;
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    let W = 0;
    let H = 0;
    let dpr = 1;
    let raf = 0;
    let running = true;
    const rnd = mulberry32(7);
    const ripples: Ripple[] = [];
    const pointer = {x: -9999, y: -9999, lastRipple: 0, lastX: 0, lastY: 0};
    let lure: {x: number; y: number; t: number} | null = null;
    let fish: Koi[] = [];
    let petals: Petal[] = [];
    let bubbles: Bubble[] = [];

    const resize = () => {
      dpr = Math.min(window.devicePixelRatio || 1, 1.75);
      W = window.innerWidth;
      H = window.innerHeight;
      canvas.width = Math.floor(W * dpr);
      canvas.height = Math.floor(H * dpr);
      canvas.style.width = W + 'px';
      canvas.style.height = H + 'px';
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const mobile = W < 700;
      const nFish = mobile ? 4 : 7;
      const scale = mobile ? 0.72 : 1;
      fish = Array.from({length: nFish}, (_, i) => makeKoi(i, W, H, scale, rnd));
      petals = Array.from({length: mobile ? 8 : 16}, () => ({
        x: rnd() * W,
        y: rnd() * H,
        r: rnd() * 6.28,
        vr: (rnd() - 0.5) * 0.02,
        vx: (rnd() - 0.5) * 0.3,
        vy: 0.12 + rnd() * 0.3,
        s: 5 + rnd() * 6,
      }));
      bubbles = Array.from({length: mobile ? 18 : 40}, () => ({
        x: rnd() * W,
        y: rnd() * H,
        r: 1 + rnd() * 3,
        vy: 0.2 + rnd() * 0.6,
        ph: rnd() * 10,
      }));
    };
    resize();

    const addRipple = (x: number, y: number, big = false) => {
      ripples.push({x, y, r: 2, max: big ? Math.max(W, H) * 0.9 : 90 + Math.random() * 60, a: big ? 0.5 : 0.55, w: big ? 3 : 1.6});
      if (ripples.length > 40) ripples.shift();
    };

    const onMove = (e: PointerEvent) => {
      pointer.x = e.clientX;
      pointer.y = e.clientY;
      const now = performance.now();
      const d = Math.hypot(e.clientX - pointer.lastX, e.clientY - pointer.lastY);
      if (d > 60 && now - pointer.lastRipple > 110) {
        addRipple(e.clientX, e.clientY);
        pointer.lastRipple = now;
        pointer.lastX = e.clientX;
        pointer.lastY = e.clientY;
      }
    };
    const onDown = (e: PointerEvent) => {
      addRipple(e.clientX, e.clientY);
      setTimeout(() => addRipple(e.clientX, e.clientY), 140);
      lure = {x: e.clientX, y: e.clientY, t: performance.now()};
    };
    const onLeave = () => {
      pointer.x = pointer.y = -9999;
    };
    const onBig = (e: Event) => {
      const d = (e as CustomEvent).detail || {};
      addRipple(d.x ?? W / 2, d.y ?? H / 2, true);
    };
    const onVis = () => {
      running = !document.hidden;
      if (running && !reduce) {
        cancelAnimationFrame(raf);
        raf = requestAnimationFrame(frame);
      }
    };
    window.addEventListener('resize', resize);
    window.addEventListener('pointermove', onMove, {passive: true});
    window.addEventListener('pointerdown', onDown, {passive: true});
    window.addEventListener('pointerleave', onLeave);
    window.addEventListener('pond-ripple', onBig);
    document.addEventListener('visibilitychange', onVis);

    let last = performance.now();
    const frame = (now: number) => {
      if (!running) return;
      const dt = Math.min(2.2, (now - last) / 16.67);
      last = now;
      const t = now / 1000;
      ctx.clearRect(0, 0, W, H);

      // sun glints under water
      ctx.globalCompositeOperation = 'lighter';
      for (let i = 0; i < 5; i++) {
        const gx = (Math.sin(t * 0.07 + i * 1.7) * 0.5 + 0.5) * W;
        const gy = (Math.cos(t * 0.05 + i * 2.3) * 0.5 + 0.5) * H;
        const gr = Math.max(W, H) * (0.22 + 0.05 * Math.sin(t * 0.3 + i));
        const g = ctx.createRadialGradient(gx, gy, 0, gx, gy, gr);
        g.addColorStop(0, 'rgba(190,255,245,0.10)');
        g.addColorStop(1, 'rgba(190,255,245,0)');
        ctx.fillStyle = g;
        ctx.fillRect(gx - gr, gy - gr, gr * 2, gr * 2);
      }
      ctx.globalCompositeOperation = 'source-over';

      // bubbles
      ctx.fillStyle = 'rgba(255,255,255,0.35)';
      for (const b of bubbles) {
        b.y -= b.vy * dt;
        b.x += Math.sin(t + b.ph) * 0.25;
        if (b.y < -10) {
          b.y = H + 10;
          b.x = Math.random() * W;
        }
        ctx.globalAlpha = 0.4;
        ctx.beginPath();
        ctx.arc(b.x, b.y, b.r, 0, 6.3);
        ctx.fill();
      }
      ctx.globalAlpha = 1;

      // fish
      const lureAge = lure ? now - lure.t : 99999;
      if (lureAge > 2600) lure = null;
      for (const f of fish) {
        let desired = f.ang;
        // wander
        f.turn += (Math.random() - 0.5) * 0.02 * dt;
        f.turn *= 0.97;
        desired += f.turn;
        // soft borders
        const m = 140;
        if (f.x < m) desired = lerpAng(desired, 0, 0.04 * dt);
        if (f.x > W - m) desired = lerpAng(desired, Math.PI, 0.04 * dt);
        if (f.y < m) desired = lerpAng(desired, Math.PI / 2, 0.04 * dt);
        if (f.y > H - m) desired = lerpAng(desired, -Math.PI / 2, 0.04 * dt);
        let mul = 1;
        // flee from cursor
        const dx = f.x - pointer.x;
        const dy = f.y - pointer.y;
        const dist = Math.hypot(dx, dy);
        if (dist < 170) {
          desired = lerpAng(desired, Math.atan2(dy, dx), 0.5);
          mul = 1 + (170 - dist) / 70;
        } else if (lure && lureAge < 2400) {
          const lx = lure.x - f.x;
          const ly = lure.y - f.y;
          if (Math.hypot(lx, ly) > 26) desired = lerpAng(desired, Math.atan2(ly, lx), 0.3);
          mul = 1.3;
        }
        stepKoi(f, dt, desired, mul, now);
        drawKoi(ctx, f);
      }

      // petals
      for (const p of petals) {
        p.x += p.vx * dt + Math.sin(t * 0.6 + p.r) * 0.2;
        p.y += p.vy * dt;
        p.r += p.vr * dt;
        if (p.y > H + 20) {
          p.y = -20;
          p.x = Math.random() * W;
        }
        if (p.x < -20) p.x = W + 20;
        if (p.x > W + 20) p.x = -20;
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.r);
        ctx.globalAlpha = 0.85;
        const g = ctx.createLinearGradient(0, -p.s, 0, p.s);
        g.addColorStop(0, '#ffe3ea');
        g.addColorStop(1, '#ff9db8');
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.ellipse(0, 0, p.s * 0.55, p.s, 0, 0, 6.3);
        ctx.fill();
        ctx.restore();
      }
      ctx.globalAlpha = 1;

      // ripples
      for (let i = ripples.length - 1; i >= 0; i--) {
        const r = ripples[i];
        r.r += (r.max > 400 ? 9 : 2.2) * dt;
        const k = r.r / r.max;
        if (k >= 1) {
          ripples.splice(i, 1);
          continue;
        }
        for (let j = 0; j < 3; j++) {
          const rr = r.r - j * 14;
          if (rr <= 0) continue;
          ctx.globalAlpha = r.a * (1 - k) * (1 - j * 0.3);
          ctx.strokeStyle = 'rgba(230,255,252,1)';
          ctx.lineWidth = r.w * (1 - k * 0.5);
          ctx.beginPath();
          ctx.arc(r.x, r.y, rr, 0, 6.3);
          ctx.stroke();
        }
      }
      ctx.globalAlpha = 1;

      if (!reduce) raf = requestAnimationFrame(frame);
    };
    if (reduce) {
      frame(performance.now());
    } else {
      raf = requestAnimationFrame(frame);
    }

    return () => {
      cancelAnimationFrame(raf);
      running = false;
      window.removeEventListener('resize', resize);
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerdown', onDown);
      window.removeEventListener('pointerleave', onLeave);
      window.removeEventListener('pond-ripple', onBig);
      document.removeEventListener('visibilitychange', onVis);
    };
  }, []);

  return <canvas ref={ref} className="pond-canvas" aria-hidden="true" />;
}

function lerpAng(a: number, b: number, t: number) {
  let d = ((b - a + Math.PI) % (Math.PI * 2)) - Math.PI;
  if (d < -Math.PI) d += Math.PI * 2;
  return a + d * Math.min(1, t);
}

type PadSpec = {x: number; y: number; s: number; rot: number; flower: boolean; hue: number};

function PadLayer({factor, docH, vh, density, seed, scale, opacity}: {factor: number; docH: number; vh: number; density: number; seed: number; scale: number; opacity: number}) {
  const {scrollY} = useScroll();
  const y = useTransform(scrollY, (v) => -v * factor);
  const layerH = vh + factor * docH;
  const pads = useMemo<PadSpec[]>(() => {
    const rnd = mulberry32(seed);
    const count = Math.max(6, Math.round((layerH / 520) * density));
    return Array.from({length: count}, () => ({
      x: rnd() * 100,
      y: rnd() * 100,
      s: (0.8 + rnd() * 1.1) * scale,
      rot: rnd() * 360,
      flower: rnd() < 0.22,
      hue: rnd(),
    }));
  }, [layerH, density, seed, scale]);

  return (
    <motion.div className="pad-layer" style={{y, height: layerH, opacity}} aria-hidden="true">
      {pads.map((p, i) => (
        <div
          key={i}
          className="pad"
          style={{left: p.x + '%', top: p.y + '%', width: 100 * p.s, height: 100 * p.s, animationDelay: -p.hue * 8 + 's'}}
        >
          <LilyPad rot={p.rot} tone={p.hue} />
          {p.flower && (
            <div className="pad-flower" style={{width: 70 * p.s}}>
              <LotusStatic />
            </div>
          )}
        </div>
      ))}
    </motion.div>
  );
}

/** Nền ao sen cố định + "máy quay" lia theo cuộn trang và con trỏ. */
export default function PondScene({docH, descent}: {docH: number; descent?: MotionValue<number>}) {
  const done = useMotionValue(1);
  const d = descent ?? done;
  const introScale = useTransform(d, [0.5, 1], [2.6, 1]);
  const introY = useTransform(d, [0.5, 1], ['-8%', '0%']);
  const {scrollYProgress} = useScroll();
  const vh = typeof window === 'undefined' ? 800 : window.innerHeight;

  const bg = useTransform(
    scrollYProgress,
    [0, 0.2, 0.42, 0.62, 0.82, 1],
    ['#2fb0ac', '#1b93a0', '#0f6e84', '#0c5170', '#0b3f66', '#0a2f52']
  );
  const rotate = useTransform(scrollYProgress, [0, 0.16, 0.34, 0.5, 0.68, 0.84, 1], [0, -3, 2.5, -1.5, 3, -2, 0]);
  const scale = useTransform(scrollYProgress, [0, 0.16, 0.34, 0.5, 0.68, 0.84, 1], [1.12, 1.22, 1.14, 1.3, 1.16, 1.26, 1.14]);
  const panX = useTransform(scrollYProgress, [0, 0.2, 0.4, 0.6, 0.8, 1], [0, -50, 40, -30, 50, 0]);

  const mx = useMotionValue(0);
  const my = useMotionValue(0);
  const sx = useSpring(mx, {stiffness: 40, damping: 18});
  const sy = useSpring(my, {stiffness: 40, damping: 18});
  useEffect(() => {
    const move = (e: PointerEvent) => {
      mx.set((e.clientX / window.innerWidth - 0.5) * -34);
      my.set((e.clientY / window.innerHeight - 0.5) * -24);
    };
    window.addEventListener('pointermove', move, {passive: true});
    return () => window.removeEventListener('pointermove', move);
  }, [mx, my]);
  const x = useTransform([panX, sx] as never, ([a, b]: number[]) => a + b);

  return (
    <div className="scene" aria-hidden="true">
      <motion.div className="scene-intro" style={{scale: introScale, y: introY}}>
      <motion.div className="scene-cam" style={{backgroundColor: bg, rotate, scale, x, y: sy}}>
        <div className="scene-depth" />
        <PondCanvas />
        <PadLayer factor={0.12} docH={docH} vh={vh} density={1.3} seed={11} scale={0.8} opacity={0.75} />
        <PadLayer factor={0.3} docH={docH} vh={vh} density={0.9} seed={23} scale={1.15} opacity={0.9} />
        <PadLayer factor={0.55} docH={docH} vh={vh} density={0.5} seed={37} scale={1.8} opacity={0.95} />
      </motion.div>
      </motion.div>
      <div className="scene-vignette" />
    </div>
  );
}
