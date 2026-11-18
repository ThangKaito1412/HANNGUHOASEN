import {useEffect, useRef, useState, type ReactNode} from 'react';
import {AnimatePresence, animate, motion, useMotionValue, useScroll, useTransform, type MotionValue} from 'motion/react';
import {BookOpen, Clock, Factory, MapPin, Menu, MessageCircle, Phone, Sparkles, Users, X, Headphones, Search, PenLine} from 'lucide-react';
import PondScene from './PondScene';
import {LotusBloom} from './Lotus';
import SkyIntro from './SkyIntro';
import './landing.css';

const PHONE = '0813 616 813';
const PHONE_LINK = 'tel:0813616813';
const ZALO = 'https://zalo.me/0813616813';
const MAP = 'https://www.google.com/maps/search/?api=1&query=' + encodeURIComponent('Nhà thờ Tha La, An Hòa, Trảng Bàng');
const ADDRESS = 'Gần nhà thờ Tha La, An Hòa, Trảng Bàng';

type Book = {id: string; img: string; ratio: number; title: string; vol: string; kind: 'gt' | 'lv'; desc: string};
const BOOKS: Book[] = [
  {id: 'gt1', img: '/site/giaotrinh1.jpg', ratio: 1400 / 2355, title: 'Giáo trình Hán ngữ', vol: 'Quyển 1', kind: 'gt', desc: 'Giáo trình nền tảng cho người mới bắt đầu: phát âm, từ vựng, hội thoại và ngữ pháp cơ bản.'},
  {id: 'gt2', img: '/site/giaotrinh2.jpg', ratio: 0.594, title: 'Giáo trình Hán ngữ', vol: 'Quyển 2', kind: 'gt', desc: 'Tiếp nối quyển 1, mở rộng vốn từ và mẫu câu giao tiếp trong đời sống, công việc.'},
  {id: 'gt3', img: '/site/giaotrinh3.jpg', ratio: 0.594, title: 'Giáo trình Hán ngữ', vol: 'Quyển 3', kind: 'gt', desc: 'Nâng cao khả năng nghe – nói – đọc – viết với các chủ đề thực tế.'},
  {id: 'lv1', img: '/site/luyenviet1.jpg', ratio: 0.773, title: 'Luyện viết Hán ngữ', vol: 'Quyển 1', kind: 'lv', desc: 'Vở luyện viết chữ Hán đi cùng giáo trình quyển 1.'},
  {id: 'lv2', img: '/site/luyenviet2.jpg', ratio: 0.773, title: 'Luyện viết Hán ngữ', vol: 'Quyển 2', kind: 'lv', desc: 'Vở luyện viết chữ Hán đi cùng giáo trình quyển 2.'},
  {id: 'lv3', img: '/site/luyenviet3.jpg', ratio: 0.773, title: 'Luyện viết Hán ngữ', vol: 'Quyển 3', kind: 'lv', desc: 'Vở luyện viết chữ Hán đi cùng giáo trình quyển 3.'},
];

const PHOTOS = [
  {src: '/site/p3.jpg', alt: 'Lớp học tiếng Trung tại Hán Ngữ Hoa Sen', cls: 'g-wide'},
  {src: '/site/p2.jpg', alt: 'Học viên đang học bài', cls: 'g-tall'},
  {src: '/site/p0.jpg', alt: 'Phòng học thoáng mát, sạch sẽ', cls: 'g-wide'},
  {src: '/site/p4.jpg', alt: 'Lớp học buổi tối', cls: 'g-wide'},
  {src: '/site/p5.jpg', alt: 'Học viên luyện tập', cls: 'g-tall'},
  {src: '/site/p6.jpg', alt: 'Lớp tiếng Trung cấp tốc', cls: 'g-tall'},
];

const NAV = [
  ['#gioithieu', 'Giới thiệu'],
  ['#lichhoc', 'Lịch học'],
  ['#giaotrinh', 'Giáo trình'],
  ['#sachdientu', 'Sách điện tử'],
  ['#lophoc', 'Lớp học'],
  ['#lienhe', 'Liên hệ'],
] as const;

function Reveal({children, className = '', delay = 0}: {children: ReactNode; className?: string; delay?: number}) {
  return (
    <motion.div
      className={className}
      initial={{opacity: 0, y: 70, rotateX: 14, clipPath: 'circle(8% at 50% 100%)'}}
      whileInView={{opacity: 1, y: 0, rotateX: 0, clipPath: 'circle(140% at 50% 100%)'}}
      viewport={{once: true, margin: '-12% 0px'}}
      transition={{duration: 1, delay, ease: [0.2, 0.8, 0.2, 1]}}
    >
      {children}
    </motion.div>
  );
}

function SectionTitle({kicker, title, sub}: {kicker: string; title: string; sub?: string}) {
  return (
    <Reveal className="sec-title">
      <span className="kicker">{kicker}</span>
      <h2>{title}</h2>
      {sub && <p>{sub}</p>}
    </Reveal>
  );
}

function Nav({hidden}: {hidden: boolean}) {
  const [open, setOpen] = useState(false);
  const [solid, setSolid] = useState(false);
  useEffect(() => {
    const on = () => setSolid(window.scrollY > 40);
    on();
    window.addEventListener('scroll', on, {passive: true});
    return () => window.removeEventListener('scroll', on);
  }, []);
  return (
    <header className={'nav' + (solid ? ' nav-solid' : '') + (hidden ? ' nav-hidden' : '')}>
      <a href="#top" className="brand" aria-label="Hán Ngữ Hoa Sen">
        <span className="brand-zh">莲花汉语</span>
        <span className="brand-vi">Hán Ngữ Hoa Sen</span>
      </a>
      <nav className={'nav-links' + (open ? ' open' : '')}>
        {NAV.map(([h, l]) => (
          <a key={h} href={h} onClick={() => setOpen(false)}>
            {l}
          </a>
        ))}
        <a href="/sach" className="nav-cta">
          Vào sách điện tử
        </a>
      </nav>
      <button className="nav-burger" onClick={() => setOpen((o) => !o)} aria-label="Menu">
        {open ? <X size={24} /> : <Menu size={24} />}
      </button>
    </header>
  );
}

function Hero({ready}: {ready: boolean}) {
  const ref = useRef<HTMLElement>(null);
  const {scrollYProgress} = useScroll({target: ref, offset: ['start start', 'end start']});
  const y = useTransform(scrollYProgress, [0, 1], [0, -120]);
  const s = useTransform(scrollYProgress, [0, 1], [1, 1.35]);
  const o = useTransform(scrollYProgress, [0, 0.7], [1, 0]);
  const ly = useTransform(scrollYProgress, [0, 1], [0, 220]);
  const ls = useTransform(scrollYProgress, [0, 1], [1, 0.8]);
  return (
    <section id="top" ref={ref} className="hero">
      {ready && (
      <motion.div className="hero-copy" style={{y, scale: s, opacity: o}}>
        <motion.span className="hero-zh" initial={{opacity: 0, y: 30, filter: 'blur(12px)'}} animate={{opacity: 1, y: 0, filter: 'blur(0px)'}} transition={{duration: 1.4, delay: 0.2}}>
          莲花汉语
        </motion.span>
        <motion.h1 initial={{opacity: 0, y: 40}} animate={{opacity: 1, y: 0}} transition={{duration: 1.1, delay: 0.5}}>
          Hán Ngữ <em>Hoa Sen</em>
        </motion.h1>
        <motion.p className="hero-tag" initial={{opacity: 0}} animate={{opacity: 1}} transition={{duration: 1, delay: 0.9}}>
          Tiếng Trung dễ học – Ứng dụng ngay
        </motion.p>
        <motion.p className="hero-sub" initial={{opacity: 0}} animate={{opacity: 1}} transition={{duration: 1, delay: 1.1}}>
          Trang web chính thức · Học tiếng Trung giao tiếp · Sách điện tử · Giao tiếp cấp tốc cho người đi làm
        </motion.p>
        <motion.div className="hero-actions" initial={{opacity: 0, y: 20}} animate={{opacity: 1, y: 0}} transition={{duration: 0.9, delay: 1.3}}>
          <a href="/sach" className="btn btn-primary">
            <BookOpen size={18} /> Vào sách điện tử
          </a>
          <a href="#lienhe" className="btn btn-ghost">
            Đăng ký tư vấn
          </a>
        </motion.div>
      </motion.div>
      )}
      {ready && (
      <motion.div className="hero-lotus" style={{y: ly, scale: ls}}>
        <motion.div animate={{y: [0, -10, 0], rotate: [-1.2, 1.2, -1.2]}} transition={{duration: 7, repeat: Infinity, ease: 'easeInOut'}}>
          <LotusBloom />
        </motion.div>
      </motion.div>
      )}
      {ready && (
      <motion.div className="hero-hint" style={{opacity: o}}>
        <span>Chạm vào mặt nước – cá chép sẽ bơi đến</span>
        <i />
      </motion.div>
      )}
    </section>
  );
}

const FEATURES = [
  {icon: MessageCircle, t: 'Giao tiếp thực tế', d: 'Học theo tình huống thực tế trong công việc, đời sống.'},
  {icon: Users, t: 'Lớp học nhỏ', d: 'Tương tác nhiều, hiệu quả hơn.'},
  {icon: BookOpen, t: 'Giáo trình rõ ràng', d: 'Tập trung nghe – nói – đọc – viết cơ bản.'},
  {icon: Factory, t: 'Phù hợp người đi làm', d: 'Đặc biệt hữu ích cho công nhân, nhân viên công xưởng.'},
];

function About() {
  return (
    <section id="gioithieu" className="sec">
      <SectionTitle
        kicker="Giới thiệu"
        title="Nói được – Dùng được ngay trong công việc & cuộc sống"
        sub="Hán Ngữ Hoa Sen (莲花汉语) dạy tiếng Trung giao tiếp, dạy kèm và tiếng Trung cấp tốc cho công xưởng tại Trảng Bàng. Lớp học nhỏ, bám sát tình huống thực tế để học viên mở miệng nói được ngay."
      />
      <div className="features">
        {FEATURES.map((f, i) => (
          <Reveal key={f.t} delay={i * 0.12} className="card feature">
            <div className="ficon">
              <f.icon size={26} />
            </div>
            <h3>{f.t}</h3>
            <p>{f.d}</p>
          </Reveal>
        ))}
      </div>
    </section>
  );
}

function Schedule() {
  return (
    <section id="lichhoc" className="sec">
      <SectionTitle kicker="Khai giảng" title="Lớp tiếng Trung giao tiếp cấp tốc" sub="Khung giờ buổi tối, thuận tiện cho người đi làm." />
      <div className="sched">
        <Reveal className="card sched-card">
          <Clock size={26} />
          <h3>Thứ 2 · 4 · 6</h3>
          <ul>
            <li>18h15 – 19h45</li>
            <li>20h00 – 21h30</li>
          </ul>
        </Reveal>
        <Reveal className="card sched-card alt" delay={0.15}>
          <Clock size={26} />
          <h3>Thứ 7 · Chủ nhật</h3>
          <ul>
            <li>18h00 – 19h30</li>
          </ul>
        </Reveal>
        <Reveal className="card sched-card addr" delay={0.3}>
          <MapPin size={26} />
          <h3>Địa chỉ lớp học</h3>
          <p>{ADDRESS}</p>
          <a href={MAP} target="_blank" rel="noreferrer" className="link">
            Xem bản đồ →
          </a>
        </Reveal>
      </div>
    </section>
  );
}

function layoutFor(w: number, vh: number, n: number) {
  if (w >= 1100) {
    const gap = Math.min(210, (w - 100) / n);
    const h = Math.min(300, gap * 1.6, vh * 0.46);
    return {
      h,
      pos: (i: number) => {
        const c = i - (n - 1) / 2;
        return {x: c * gap, y: c * c * 7 - 10, r: c * 6};
      },
    };
  }
  const mobile = w < 700;
  const h = Math.max(100, Math.min(mobile ? 160 : 230, (vh - 230) / 2 - 34, mobile ? w * 0.36 : 230));
  const gx = mobile ? Math.min(124, w * 0.31) : h * 0.9 + 70;
  const gy = h + 44;
  return {
    h,
    pos: (i: number) => {
      const col = i % 3;
      const row = Math.floor(i / 3);
      return {x: (col - 1) * gx, y: (row - 0.5) * gy + 10, r: (col - 1) * 3};
    },
  };
}

function FanBook({b, i, n, t, w, vh, onOpen}: {b: Book; i: number; n: number; t: MotionValue<number>; w: number; vh: number; onOpen: (b: Book) => void}) {
  const L = layoutFor(w, vh, n);
  const p = L.pos(i);
  const c = i - (n - 1) / 2;
  const x = useTransform(t, [0.04, 0.5], [c * 5, p.x]);
  const y = useTransform(t, [0.04, 0.5], [-c * 2, p.y]);
  const rotate = useTransform(t, [0.04, 0.5], [c * 2, p.r]);
  const rotateY = useTransform(t, [0, 0.22, 0.5], [88, 50, 0]);
  const scale = useTransform(t, [0, 0.12], [0.5, 1]);
  const cap = useTransform(t, [0.46, 0.62], [0, 1]);
  const width = L.h * b.ratio;
  return (
    <motion.button
      className="fanbook"
      style={{x, y, rotate, rotateY, scale, width, height: L.h, zIndex: 10 - Math.abs(Math.round(c))}}
      whileHover={{scale: 1.08, y: p.y - 14, zIndex: 30}}
      transition={{type: 'spring', stiffness: 220, damping: 18}}
      onClick={() => onOpen(b)}
      aria-label={`${b.title} ${b.vol}`}
    >
      <img src={b.img} alt={`${b.title} ${b.vol}`} draggable={false} />
      <motion.span className="fancap" style={{opacity: cap}}>
        {b.kind === 'gt' ? 'Giáo trình' : 'Luyện viết'} · {b.vol}
      </motion.span>
    </motion.button>
  );
}

function Books() {
  const ref = useRef<HTMLElement>(null);
  const {scrollYProgress} = useScroll({target: ref, offset: ['start start', 'end end']});
  const [w, setW] = useState(typeof window === 'undefined' ? 1280 : window.innerWidth || 1280);
  const [vh, setVh] = useState(typeof window === 'undefined' ? 800 : window.innerHeight || 800);
  const [open, setOpen] = useState<Book | null>(null);
  useEffect(() => {
    const r = () => setW(window.innerWidth || document.documentElement.clientWidth || 1280);
    const rh = () => setVh(window.innerHeight || document.documentElement.clientHeight || 800);
    r();
    rh();
    window.addEventListener('resize', rh);
    window.addEventListener('resize', r);
    return () => {
      window.removeEventListener('resize', r);
      window.removeEventListener('resize', rh);
    };
  }, []);
  const head = useTransform(scrollYProgress, [0, 0.1, 0.9, 1], [0, 1, 1, 0.6]);
  return (
    <section id="giaotrinh" ref={ref} className="books">
      <div className="books-stage">
        <motion.div className="books-head" style={{opacity: head}}>
          <span className="kicker">Giáo trình</span>
          <h2>Bộ sách Hán ngữ Hoa Sen</h2>
          <p>Cuộn xuống để sách bung ra như đóa sen nở · chạm vào từng quyển để xem</p>
        </motion.div>
        <div className="books-fan">
          {BOOKS.map((b, i) => (
            <FanBook key={b.id} b={b} i={i} n={BOOKS.length} t={scrollYProgress} w={w} vh={vh} onOpen={setOpen} />
          ))}
        </div>
      </div>
      <Lightbox open={!!open} onClose={() => setOpen(null)}>
        {open && (
          <div className="bookmodal">
            <img src={open.img} alt={`${open.title} ${open.vol}`} />
            <div>
              <span className="kicker">{open.kind === 'gt' ? 'Giáo trình' : 'Vở luyện viết'}</span>
              <h3>
                {open.title} <em>{open.vol}</em>
              </h3>
              <p>{open.desc}</p>
              {open.kind === 'gt' ? (
                <a href="/sach" className="btn btn-primary">
                  <BookOpen size={18} /> Đọc trên sách điện tử
                </a>
              ) : (
                <a href="#lienhe" className="btn btn-ghost" onClick={() => setOpen(null)}>
                  Hỏi mua / tư vấn
                </a>
              )}
            </div>
          </div>
        )}
      </Lightbox>
    </section>
  );
}

function EbookCTA() {
  const items = [
    {icon: BookOpen, t: 'Lật trang như sách thật'},
    {icon: Headphones, t: 'Nghe phát âm từng câu, hội thoại'},
    {icon: Search, t: 'Từ điển & đánh dấu từ vựng'},
    {icon: PenLine, t: 'Luyện tập, AI sửa lỗi thông minh'},
  ];
  return (
    <section id="sachdientu" className="sec">
      <Reveal className="card ebook">
        <div className="ebook-copy">
          <span className="kicker">Sách điện tử</span>
          <h2>Học mọi lúc với sách điện tử tương tác</h2>
          <p>Giáo trình Hán ngữ Hoa Sen trên điện thoại và máy tính – nghe, tra từ, luyện tập ngay trên từng trang sách.</p>
          <ul>
            {items.map((it) => (
              <li key={it.t}>
                <it.icon size={18} /> {it.t}
              </li>
            ))}
          </ul>
          <a href="/sach" className="btn btn-primary big">
            <Sparkles size={18} /> Mở sách điện tử
          </a>
        </div>
        <div className="ebook-art">
          <motion.img src="/site/giaotrinh1.jpg" alt="Giáo trình Hán ngữ quyển 1" animate={{y: [0, -8, 0]}} transition={{duration: 6, repeat: Infinity, ease: 'easeInOut'}} />
          <motion.img src="/site/giaotrinh2.jpg" alt="Giáo trình Hán ngữ quyển 2" animate={{y: [0, 10, 0]}} transition={{duration: 7, repeat: Infinity, ease: 'easeInOut'}} />
          <motion.img src="/site/giaotrinh3.jpg" alt="Giáo trình Hán ngữ quyển 3" animate={{y: [0, -12, 0]}} transition={{duration: 8, repeat: Infinity, ease: 'easeInOut'}} />
        </div>
      </Reveal>
    </section>
  );
}

function Gallery() {
  const [open, setOpen] = useState<(typeof PHOTOS)[number] | null>(null);
  return (
    <section id="lophoc" className="sec">
      <SectionTitle kicker="Lớp học" title="Không gian học tập thân thiện" sub="Phòng học thoáng, sạch, lớp nhỏ – giáo viên theo sát từng học viên." />
      <div className="gallery">
        {PHOTOS.map((p, i) => (
          <motion.button
            key={p.src}
            className={'gitem ' + p.cls}
            initial={{opacity: 0, scale: 0.9, clipPath: 'circle(6% at 50% 50%)'}}
            whileInView={{opacity: 1, scale: 1, clipPath: 'circle(100% at 50% 50%)'}}
            viewport={{once: true, margin: '-10% 0px'}}
            transition={{duration: 1.1, delay: (i % 3) * 0.12, ease: [0.2, 0.8, 0.2, 1]}}
            onClick={() => setOpen(p)}
            aria-label={p.alt}
          >
            <img src={p.src} alt={p.alt} loading="lazy" />
          </motion.button>
        ))}
      </div>
      <Lightbox open={!!open} onClose={() => setOpen(null)}>
        {open && <img className="photobig" src={open.src} alt={open.alt} />}
      </Lightbox>
    </section>
  );
}

function Contact() {
  return (
    <section id="lienhe" className="sec contact">
      <SectionTitle kicker="Liên hệ" title="Đăng ký ngay để không bỏ lỡ lớp học" sub="Nhắn Zalo hoặc gọi điện để được tư vấn lớp phù hợp." />
      <div className="contact-grid">
        <Reveal className="card contact-card">
          <a href={PHONE_LINK} className="phone">
            <Phone size={26} /> {PHONE}
          </a>
          <div className="contact-btns">
            <a href={PHONE_LINK} className="btn btn-primary">
              <Phone size={18} /> Gọi ngay
            </a>
            <a href={ZALO} target="_blank" rel="noreferrer" className="btn btn-zalo">
              <MessageCircle size={18} /> Nhắn Zalo
            </a>
          </div>
          <p className="addr-line">
            <MapPin size={18} /> {ADDRESS}
          </p>
          <a href={MAP} target="_blank" rel="noreferrer" className="link">
            Chỉ đường trên Google Maps →
          </a>
        </Reveal>
        <Reveal className="contact-photo" delay={0.15}>
          <img src="/site/p1.jpg" alt="Bảng hiệu Hán Ngữ Hoa Sen" loading="lazy" />
        </Reveal>
      </div>
    </section>
  );
}

function Lightbox({open, onClose, children}: {open: boolean; onClose: () => void; children: ReactNode}) {
  useEffect(() => {
    if (!open) return;
    const k = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', k);
    return () => window.removeEventListener('keydown', k);
  }, [open, onClose]);
  return (
    <AnimatePresence>
      {open && (
        <motion.div className="lightbox" initial={{opacity: 0}} animate={{opacity: 1}} exit={{opacity: 0}} onClick={onClose}>
          <motion.div className="lightbox-in" initial={{scale: 0.85, y: 40, rotateX: 15}} animate={{scale: 1, y: 0, rotateX: 0}} exit={{scale: 0.9, opacity: 0}} transition={{type: 'spring', stiffness: 200, damping: 22}} onClick={(e) => e.stopPropagation()}>
            <button className="lightbox-x" onClick={onClose} aria-label="Đóng">
              <X size={22} />
            </button>
            {children}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export default function Landing() {
  const [docH, setDocH] = useState(6000);
  const rootRef = useRef<HTMLDivElement>(null);
  const reduce = typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const [playing, setPlaying] = useState(!reduce);
  const [ready, setReady] = useState(reduce);
  const descent = useMotionValue(reduce ? 1 : 0);
  const anim = useRef<ReturnType<typeof animate> | null>(null);

  const finish = () => {
    setReady(true);
    setPlaying(false);
  };
  const skip = () => {
    anim.current?.stop();
    anim.current = animate(descent, 1, {duration: 0.8, ease: 'easeOut', onComplete: finish});
  };

  // Cú lia máy từ trên trời xuống ao: cuộn trang bị khóa trong lúc phát
  useEffect(() => {
    if (!playing) return;
    window.scrollTo(0, 0);
    const html = document.documentElement;
    const prev = html.style.overflow;
    html.style.overflow = 'hidden';
    anim.current = animate(descent, 1, {duration: 7.5, ease: [0.45, 0.05, 0.4, 1], onComplete: finish});
    const unsub = descent.on('change', (v) => v > 0.86 && setReady(true));
    const key = (e: KeyboardEvent) => e.key === 'Escape' && skip();
    window.addEventListener('keydown', key);
    return () => {
      html.style.overflow = prev;
      unsub();
      window.removeEventListener('keydown', key);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [playing]);

  useEffect(() => {
    const m = () => setDocH(Math.max(document.documentElement.scrollHeight, 3000));
    m();
    const ro = new ResizeObserver(m);
    ro.observe(document.body);
    window.addEventListener('load', m);
    return () => {
      ro.disconnect();
      window.removeEventListener('load', m);
    };
  }, []);

  // Chuyển cảnh: mỗi lần sang mục mới, một vòng sóng lớn lan ra từ giữa màn hình
  useEffect(() => {
    const ids = ['gioithieu', 'lichhoc', 'giaotrinh', 'sachdientu', 'lophoc', 'lienhe'];
    const seen = new Set<string>();
    const io = new IntersectionObserver(
      (es) =>
        es.forEach((e) => {
          if (e.isIntersecting && !seen.has(e.target.id)) {
            seen.add(e.target.id);
            window.dispatchEvent(new CustomEvent('pond-ripple', {detail: {x: window.innerWidth / 2, y: window.innerHeight * 0.5}}));
          }
        }),
      {threshold: 0.25}
    );
    ids.forEach((id) => {
      const el = document.getElementById(id);
      if (el) io.observe(el);
    });
    return () => io.disconnect();
  }, []);

  return (
    <div className="landing" ref={rootRef}>
      <PondScene docH={docH} descent={descent} />
      {playing && <SkyIntro t={descent} onSkip={skip} />}
      <Nav hidden={!ready} />
      <main>
        <Hero ready={ready} />
        <About />
        <Schedule />
        <Books />
        <EbookCTA />
        <Gallery />
        <Contact />
      </main>
      <footer className="foot">
        <span className="brand-zh">莲花汉语</span>
        <p>© {new Date().getFullYear()} Hán Ngữ Hoa Sen · Tiếng Trung dễ học – Ứng dụng ngay</p>
        <p>
          <a href={PHONE_LINK}>{PHONE}</a> · {ADDRESS}
        </p>
      </footer>
    </div>
  );
}
