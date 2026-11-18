import {useMemo} from 'react';
import {motion, useTransform, type MotionValue} from 'motion/react';

function mulberry32(seed: number) {
  return function () {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Vẽ sẵn vài đám mây thành ảnh (1 lần): mỗi đám mây chỉ còn là 1 ảnh, GPU kéo giãn rất nhẹ. */
let SPRITES: string[] | null = null;
function cloudSprites(): string[] {
  if (SPRITES) return SPRITES;
  SPRITES = [];
  if (typeof document === 'undefined') return SPRITES;
  for (let v = 0; v < 4; v++) {
    const r = mulberry32(900 + v * 13);
    const W = 640;
    const H = 280;
    const c = document.createElement('canvas');
    c.width = W;
    c.height = H;
    const g = c.getContext('2d')!;
    const puffs = Array.from({length: 9}, (_, i) => ({
      x: 90 + (i / 8) * (W - 180) + (r() - 0.5) * 40,
      y: H * 0.55 + (r() - 0.5) * 50 - Math.sin((i / 8) * Math.PI) * 38,
      r: 62 + r() * 54,
    }));
    const draw = (dy: number, inner: string, mid: string, scale: number) => {
      for (const p of puffs) {
        const grd = g.createRadialGradient(p.x, p.y + dy, 0, p.x, p.y + dy, p.r * scale);
        grd.addColorStop(0, inner);
        grd.addColorStop(0.5, mid);
        grd.addColorStop(1, 'rgba(255,255,255,0)');
        g.fillStyle = grd;
        g.beginPath();
        g.arc(p.x, p.y + dy, p.r * scale, 0, 6.3);
        g.fill();
      }
    };
    draw(26, 'rgba(150,188,232,0.5)', 'rgba(150,188,232,0.25)', 1); // bóng dưới
    draw(0, 'rgba(255,255,255,0.98)', 'rgba(255,255,255,0.8)', 1);
    SPRITES.push(c.toDataURL('image/png'));
  }
  return SPRITES;
}

function Cloud({x, y, w, seed}: {x: number; y: number; w: number; seed: number}) {
  const sprites = useMemo(cloudSprites, []);
  return <img className="cloud-img" src={sprites[seed % sprites.length]} alt="" draggable={false} style={{left: x + '%', top: y + '%', width: w + 'vw'}} />;
}

// layer 0 = xa nhất ... 4 = gần camera nhất
const LAYERS = [
  {count: 5, w: [22, 34], scale: 1.25, rise: 3, fade: [0.86, 1.0]},
  {count: 5, w: [26, 40], scale: 1.9, rise: 8, fade: [0.8, 0.96]},
  {count: 5, w: [34, 50], scale: 3.2, rise: 14, fade: [0.7, 0.9]},
  {count: 4, w: [44, 64], scale: 5.5, rise: 22, fade: [0.6, 0.82]},
  {count: 3, w: [60, 90], scale: 10, rise: 34, fade: [0.5, 0.74]},
] as const;

function CloudLayer({i, t, lite}: {i: number; t: MotionValue<number>; lite?: boolean}) {
  const L = LAYERS[i];
  const clouds = useMemo(() => {
    const r = mulberry32(100 + i * 17);
    return Array.from({length: lite ? Math.max(3, L.count - 2) : L.count}, (_, k) => ({
      x: -10 + (k / ((lite ? Math.max(3, L.count - 2) : L.count) - 1 || 1)) * 90 + (r() - 0.5) * 18,
      y: 4 + r() * 76,
      w: L.w[0] + r() * (L.w[1] - L.w[0]),
      seed: 1 + i * 31 + k * 7,
    }));
  }, [i, L, lite]);
  const scale = useTransform(t, [0, 0.88], [1, L.scale]);
  const vhPx = typeof window === 'undefined' ? 800 : window.innerHeight;
  const y = useTransform(t, [0, 0.88], [0, (-L.rise * vhPx) / 100]);
  const START = [1, 0.9, 0.45, 0.12, 0];
  const RAMP = [0.02, 0.12, 0.22, 0.32, 0.42];
  const opacity = useTransform(t, [0, RAMP[i], L.fade[0], L.fade[1]], [START[i], 1, 1, 0]);
  return (
    <motion.div className="cloud-layer" style={{scale, y, opacity}}>
      {clouds.map((c, k) => (
        <Cloud key={k} {...c} />
      ))}
    </motion.div>
  );
}

/** Cú lia máy từ trên trời, xuyên các tầng mây, hạ xuống ao sen. */
export default function SkyIntro({t, onSkip, lite}: {t: MotionValue<number>; onSkip: () => void; lite?: boolean}) {
  const overlay = useTransform(t, [0.84, 1], [1, 0]);
  const mist = useTransform(t, [0.3, 0.62, 0.8, 0.95], [0, 0.55, 0.95, 0]);
  const skyShift = useTransform(t, [0, 1], ['0%', '-25%']);
  const sunScale = useTransform(t, [0, 0.8], [1, 2.4]);
  const sunY = useTransform(t, [0, 0.8], ['0vh', '-18vh']);
  const titleO = useTransform(t, [0, 0.05, 0.2, 0.34], [0, 1, 1, 0]);
  const titleS = useTransform(t, [0, 0.34], [1, 1.7]);
  const titleY = useTransform(t, [0, 0.34], ['0vh', '-6vh']);
  const rays = useTransform(t, [0, 0.4, 0.8], [0.7, 0.9, 0]);
  const speed = useTransform(t, [0.35, 0.7, 0.85], [0, 0.5, 0]);

  return (
    <motion.div className="sky" style={{opacity: overlay}}>
      <motion.div className="sky-bg" style={{y: skyShift}} />
      <motion.div className="sky-sun" style={{scale: sunScale, y: sunY}} />
      <motion.div className="sky-rays" style={{opacity: rays}} />
      {LAYERS.map((_, i) => (lite && i % 2 === 1 ? null : <CloudLayer key={i} i={i} t={t} lite={lite} />))}
      <motion.div className="sky-streak" style={{opacity: speed}} />
      <motion.div className="sky-title" style={{opacity: titleO, scale: titleS, y: titleY}}>
        <span>莲花汉语</span>
        <small>Hán Ngữ Hoa Sen</small>
      </motion.div>
      <motion.div className="sky-mist" style={{opacity: mist}} />
      <button className="sky-skip" onClick={onSkip}>
        Bỏ qua ›
      </button>
    </motion.div>
  );
}
