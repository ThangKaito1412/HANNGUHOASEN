import {motion} from 'motion/react';

const PETAL = 'M0 0 C-36 -34 -40 -108 0 -156 C40 -108 36 -34 0 0Z';

const LAYERS: {angles: number[]; scale: number; fill: string; delay: number}[] = [
  {angles: [-74, -46, 46, 74], scale: 0.86, fill: 'url(#petalBack)', delay: 0},
  {angles: [-58, -30, 0, 30, 58], scale: 0.98, fill: 'url(#petalMid)', delay: 0.25},
  {angles: [-38, -13, 13, 38], scale: 1.0, fill: 'url(#petalMid)', delay: 0.5},
  {angles: [-20, 0, 20], scale: 0.9, fill: 'url(#petalFront)', delay: 0.75},
];

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
  return (
    <svg viewBox="0 0 400 300" className={className} role="img" aria-label="Hoa sen">
      <ellipse cx="200" cy="268" rx="150" ry="16" fill="rgba(0,50,60,0.25)" />
      <g transform="translate(200 262)">
        {LAYERS.map((layer, li) =>
          layer.angles.map((a, i) => (
            <g key={`${li}-${i}`} transform={`rotate(${a})`}>
              <motion.path
                d={PETAL}
                fill={layer.fill}
                stroke="rgba(255,255,255,0.55)"
                strokeWidth="1.2"
                style={{originX: 0, originY: 0}}
                initial={{scale: 0.05, opacity: 0}}
                animate={{scale: layer.scale, opacity: 1}}
                transition={{duration: 1.6, delay: 0.3 + layer.delay + i * 0.05, ease: [0.2, 0.8, 0.2, 1]}}
              />
            </g>
          ))
        )}
        <motion.g
          initial={{opacity: 0, scale: 0.3}}
          animate={{opacity: 1, scale: 1}}
          transition={{delay: 1.8, duration: 0.8}}
          style={{originX: 0, originY: 0}}
        >
          <circle cx="0" cy="-38" r="22" fill="#ffd45a" />
          {Array.from({length: 14}, (_, i) => {
            const a = (i / 14) * Math.PI - Math.PI;
            return <circle key={i} cx={Math.cos(a) * 26} cy={-38 + Math.sin(a) * 20} r="3.4" fill="#f3a712" />;
          })}
        </motion.g>
      </g>
    </svg>
  );
}

/** Hoa sen tĩnh (đặt trên lá sen). */
export function LotusStatic() {
  return (
    <svg viewBox="0 0 400 300" aria-hidden="true">
      <g transform="translate(200 262)">
        {LAYERS.map((layer, li) =>
          layer.angles.map((a, i) => (
            <g key={`${li}-${i}`} transform={`rotate(${a}) scale(${layer.scale})`}>
              <path d={PETAL} fill={layer.fill} stroke="rgba(255,255,255,0.5)" strokeWidth="1.4" />
            </g>
          ))
        )}
        <circle cx="0" cy="-38" r="22" fill="#ffd45a" />
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
