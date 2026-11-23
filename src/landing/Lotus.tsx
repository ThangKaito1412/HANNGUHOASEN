import {motion} from 'motion/react';

const PETAL = 'M0 0 C-30 -30 -46 -98 -4 -158 Q0 -162 4 -158 C46 -98 30 -30 0 0Z';
const VEIN = 'M0 -8 C-5 -55 -7 -105 -2 -148 M0 -8 C-16 -50 -24 -95 -10 -138 M0 -8 C16 -50 24 -95 10 -138';

type Layer = {angles: number[]; scale: number; fill: string; delay: number};
// Cánh phía sau (vẽ trước), rồi nhụy, rồi cánh phía trước ôm lấy đài sen
const BACK: Layer[] = [
  {angles: [-80, -54, 54, 80], scale: 0.84, fill: 'url(#petalBack)', delay: 0},
  {angles: [-62, -36, 0, 36, 62], scale: 0.98, fill: 'url(#petalMid)', delay: 0.25},
];
const FRONT: Layer[] = [
  {angles: [-62, -40, 40, 62], scale: 0.64, fill: 'url(#petalMid)', delay: 1.3},
  {angles: [-22, 22], scale: 0.44, fill: 'url(#petalFront)', delay: 1.5},
];

const hash = (k: number) => {
  const x = Math.sin(k * 12.9898 + 78.233) * 43758.5453;
  return x - Math.floor(x);
};

/** Nhụy sen: đài sen (gương sen) màu xanh lục nhạt có lỗ hạt, bao quanh là nhiều tơ nhị vàng đầu có bao phấn. */
function Stamens({detail = true}: {detail?: boolean}) {
  const N = detail ? 46 : 30;
  const filaments = Array.from({length: N}, (_, k) => {
    const t = k / (N - 1);
    const a = ((-84 + t * 168) * Math.PI) / 180; // 0 = hướng lên
    const L = 8 + hash(k + 1) * 16;
    const outer = k % 3 === 0;
    const reach = (outer ? 40 : 30) + L;
    const rise = (outer ? 34 : 26) + L * 0.9;
    const x0 = Math.sin(a) * 13;
    const y0 = -88;
    const x1 = Math.sin(a) * reach;
    const y1 = -92 - Math.cos(a) * rise;
    const cx = Math.sin(a) * (reach * 0.55);
    const cy = -90 - Math.cos(a) * (rise * 0.25);
    return {x0, y0, x1, y1, cx, cy, deg: (a * 180) / Math.PI, outer, k};
  });
  return (
    <g>
      {filaments.map((f) => (
        <g key={f.k}>
          <path d={`M${f.x0.toFixed(1)} ${f.y0} Q${f.cx.toFixed(1)} ${f.cy.toFixed(1)} ${f.x1.toFixed(1)} ${f.y1.toFixed(1)}`} stroke={f.outer ? '#f4d874' : '#f1cd5c'} strokeWidth="1.4" fill="none" strokeLinecap="round" />
          <ellipse cx={f.x1.toFixed(1)} cy={f.y1.toFixed(1)} rx="2" ry="4.4" transform={`rotate(${f.deg.toFixed(1)} ${f.x1.toFixed(1)} ${f.y1.toFixed(1)})`} fill="#eeab00" stroke="#c98a00" strokeWidth="0.4" />
        </g>
      ))}
      {/* đài sen */}
      <path d="M-18 -100 C-17 -91 -10 -83 0 -78 C10 -83 17 -91 18 -100 Z" fill="url(#podGrad)" />
      <ellipse cx="0" cy="-100" rx="18.5" ry="6.6" fill="#c7d96a" stroke="#93a93a" strokeWidth="0.8" />
      {detail &&
        [[-10, -100], [0, -98.4], [10, -100], [-5, -102.4], [5, -102.4], [0, -101.4], [-13, -101], [13, -101]].map(([x, y], i) => (
          <ellipse key={i} cx={x} cy={y} rx="2.1" ry="1" fill="#6f8a26" opacity="0.85" />
        ))}
    </g>
  );
}

function PetalShape({a, layer, detail}: {a: number; layer: Layer; detail: boolean}) {
  return (
    <g transform={`rotate(${a}) scale(${layer.scale})`}>
      <path d={PETAL} fill={layer.fill} stroke="rgba(255,255,255,0.5)" strokeWidth="1.2" />
      {detail && <path d={VEIN} fill="none" stroke="rgba(214,110,150,0.28)" strokeWidth="0.9" />}
    </g>
  );
}

/** Gradient dùng chung: đặt đúng 1 lần ở gốc trang (giảm hàng trăm bản sao trong DOM). */
export function GlobalDefs() {
  return (
    <svg width="0" height="0" style={{position: 'absolute'}} aria-hidden="true">
      <defs>
      <linearGradient id="petalBack" x1="0" y1="0" x2="0" y2="-1">
        <stop offset="0" stopColor="#f6a8c0" />
        <stop offset="1" stopColor="#fde1ea" />
      </linearGradient>
      <linearGradient id="petalMid" x1="0" y1="0" x2="0" y2="-1">
        <stop offset="0" stopColor="#fff1f4" />
        <stop offset="0.55" stopColor="#ffd0de" />
        <stop offset="1" stopColor="#ff8fb1" />
      </linearGradient>
      <linearGradient id="petalFront" x1="0" y1="0" x2="0" y2="-1">
        <stop offset="0" stopColor="#ffffff" />
        <stop offset="0.6" stopColor="#ffe6ee" />
        <stop offset="1" stopColor="#ffb3ca" />
      </linearGradient>
      <linearGradient id="podGrad" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor="#b9cb55" />
        <stop offset="1" stopColor="#7d9630" />
      </linearGradient>
      <radialGradient id="padGrad" cx="0.45" cy="0.4" r="0.7">
        <stop offset="0" stopColor="#58c27f" />
        <stop offset="1" stopColor="#1d7a52" />
      </radialGradient>
      <radialGradient id="padGrad2" cx="0.45" cy="0.4" r="0.7">
        <stop offset="0" stopColor="#3fb09a" />
        <stop offset="1" stopColor="#14675c" />
      </radialGradient>
      </defs>
    </svg>
  );
}

/** Hoa sen nở ra khi tải trang. */
export function LotusBloom({className}: {className?: string}) {
  const grow = (layer: Layer) =>
    layer.angles.map((a, i) => (
      <g key={`${layer.delay}-${i}`} transform={`rotate(${a})`}>
        <motion.g
          style={{originX: 0.5, originY: 1}}
          initial={{scale: 0.05, opacity: 0}}
          animate={{scale: layer.scale, opacity: 1}}
          transition={{duration: 1.6, delay: 0.3 + layer.delay + i * 0.05, ease: [0.2, 0.8, 0.2, 1]}}
        >
          <path d={PETAL} fill={layer.fill} stroke="rgba(255,255,255,0.5)" strokeWidth="1.2" />
          <path d={VEIN} fill="none" stroke="rgba(214,110,150,0.28)" strokeWidth="0.9" />
        </motion.g>
      </g>
    ));
  return (
    <svg viewBox="0 0 400 300" className={className} role="img" aria-label="Hoa sen">
      <ellipse cx="200" cy="268" rx="150" ry="16" fill="rgba(0,50,60,0.25)" />
      <g transform="translate(200 262)">
        {BACK.map(grow)}
        <motion.g initial={{opacity: 0, scale: 0.3}} animate={{opacity: 1, scale: 1}} transition={{delay: 1.1, duration: 1}} style={{originX: 0.5, originY: 1}}>
          <g transform="translate(0 24) scale(0.78)">
            <Stamens />
          </g>
        </motion.g>
        {FRONT.map(grow)}
      </g>
    </svg>
  );
}

/** Hoa sen tĩnh (đặt trên lá sen). */
export function LotusStatic() {
  return (
    <svg viewBox="0 0 400 300" aria-hidden="true">
      <g transform="translate(200 262)">
        {BACK.map((layer, li) => layer.angles.map((a, i) => <PetalShape key={`b${li}-${i}`} a={a} layer={layer} detail={false} />))}
        <g transform="translate(0 24) scale(0.78)">
          <Stamens detail={false} />
        </g>
        {FRONT.map((layer, li) => layer.angles.map((a, i) => <PetalShape key={`f${li}-${i}`} a={a} layer={layer} detail={false} />))}
      </g>
    </svg>
  );
}

const R = 50;
const a1 = (-14 * Math.PI) / 180;
const a2 = (14 * Math.PI) / 180;
const PAD_PATH = `M0 0 L${R * Math.cos(a1)} ${R * Math.sin(a1)} A${R} ${R} 0 1 0 ${R * Math.cos(a2)} ${R * Math.sin(a2)} Z`;

const VEINS = Array.from({length: 9}, (_, i) => {
  const a = ((18 + i * 36) * Math.PI) / 180;
  return `M0 0L${(R * 0.9 * Math.cos(a)).toFixed(1)} ${(R * 0.9 * Math.sin(a)).toFixed(1)}`;
}).join('');

export function LilyPad({rot, tone}: {rot: number; tone: number}) {
  return (
    <svg viewBox="-56 -56 112 112" aria-hidden="true">
      <g transform={`rotate(${rot})`}>
        <path d={PAD_PATH} transform="translate(5 7)" fill="rgba(0,40,40,0.22)" />
        <path d={PAD_PATH} fill={tone > 0.5 ? 'url(#padGrad)' : 'url(#padGrad2)'} stroke="rgba(190,255,210,0.35)" strokeWidth="1" />
        <path d={VEINS} stroke="rgba(200,255,220,0.28)" strokeWidth="0.8" fill="none" />
      </g>
    </svg>
  );
}
