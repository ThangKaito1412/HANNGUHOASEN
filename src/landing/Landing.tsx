import {useEffect, useRef, useState, type ReactNode} from 'react';
import {AnimatePresence, animate, motion, useMotionValue, useScroll, useTransform, type MotionValue} from 'motion/react';
import {BookOpen, Clock, Factory, MapPin, Menu, MessageCircle, Phone, Sparkles, Users, X, Headphones, Search, PenLine} from 'lucide-react';
import PondScene from './PondScene';
import {LotusBloom, GlobalDefs} from './Lotus';
import SkyIntro from './SkyIntro';
import {LITE} from './lite';
import './landing.css';

const PHONE = '0813 616 813';
const PHONE_LINK = 'tel:0813616813';
const ZALO = 'https://zalo.me/0813616813';
const MAP = 'https://www.google.com/maps/search/?api=1&query=' + encodeURIComponent('Hán Ngữ Hoa Sen, 98 Đường Hòa Hội, Trảng Bàng, Tây Ninh');
const ADDRESS = '98 Đường Hòa Hội, Trảng Bàng, Tây Ninh (gần nhà thờ Tha La)';

const small = (u: string) => u.replace('.jpg', '_s.jpg');
const thumb = (u: string) => u.replace('/p', '/t');

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
  if (LITE) {
    return (
      <motion.div
        className={className}
        initial={{opacity: 0, y: 24}}
        whileInView={{opacity: 1, y: 0}}
        viewport={{once: true, margin: '0px 0px -8% 0px'}}
        transition={{duration: 0.55, delay: delay * 0.5, ease: 'easeOut'}}
      >
        {children}
      </motion.div>
    );
  }
  return (
    <motion.div
      className={className}
      initial={{opacity: 0, y: 70, rotateX: 14, clipPath: 'circle(8% at 50% 0%)'}}
      whileInView={{opacity: 1, y: 0, rotateX: 0, clipPath: 'circle(160% at 50% 0%)'}}
      viewport={{once: LITE, margin: '-3% 0px'}}
      transition={{duration: 1, delay, ease: [0.2, 0.8, 0.2, 1]}}
    >
      {children}
    </motion.div>
  );
}

/** Ảnh có thử tải lại 1 lần nếu lỗi mạng. */
function Img({src, alt, eager}: {src: string; alt: string; eager?: boolean}) {
  const [s, setS] = useState(src);
  return (
    <img
      src={s}
      alt={alt}
      decoding="async"
      loading={eager ? 'eager' : 'lazy'}
      draggable={false}
      onError={() => {
        if (!s.includes('?r=')) setTimeout(() => setS(src + '?r=' + Date.now()), 1200);
      }}
    />
  );
}

const TITLE_ITEM = {
  hidden: {opacity: 0, y: 34},
  show: {opacity: 1, y: 0, transition: {duration: 0.9, ease: [0.2, 0.8, 0.2, 1] as [number, number, number, number]}},
};

function SectionTitle({kicker, title, sub}: {kicker: string; title: string; sub?: string}) {
  return (
    <motion.div
      className="sec-title"
      initial="hidden"
      whileInView="show"
      viewport={{once: LITE, margin: '-3% 0px'}}
      variants={{hidden: {}, show: {transition: {staggerChildren: 0.2}}}}
    >
      <motion.span className="kicker" variants={TITLE_ITEM}>
        {kicker}
      </motion.span>
      <motion.h2 variants={TITLE_ITEM}>{title}</motion.h2>
      {sub && <motion.p variants={TITLE_ITEM}>{sub}</motion.p>}
    </motion.div>
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

type HeroFx = {y?: MotionValue<number>; s?: MotionValue<number>; o?: MotionValue<number>; ly?: MotionValue<number>; ls?: MotionValue<number>};

function Hero({ready}: {ready: boolean}) {
  return LITE ? <HeroView ready={ready} fx={{}} /> : <HeroScroll ready={ready} />;
}

function HeroScroll({ready}: {ready: boolean}) {
  const ref = useRef<HTMLElement>(null);
  const {scrollYProgress} = useScroll({target: ref, offset: ['start start', 'end start']});
  const y = useTransform(scrollYProgress, [0, 1], [0, -120]);
  const s = useTransform(scrollYProgress, [0, 1], [1, 1.35]);
  const o = useTransform(scrollYProgress, [0, 0.7], [1, 0]);
  const ly = useTransform(scrollYProgress, [0, 1], [0, 220]);
  const ls = useTransform(scrollYProgress, [0, 1], [1, 0.8]);
  return <HeroView ready={ready} fx={{y, s, o, ly, ls}} secRef={ref} />;
}

function HeroView({ready, fx, secRef}: {ready: boolean; fx: HeroFx; secRef?: React.RefObject<HTMLElement | null>}) {
  const {y, s, o, ly, ls} = fx;
  return (
    <section id="top" ref={secRef} className="hero">
      {ready && (
      <motion.div className="hero-copy" style={{y, scale: s, opacity: o}}>
        <motion.span className="hero-zh" initial={{opacity: 0, y: 30}} animate={{opacity: 1, y: 0}} transition={{duration: 1.4, delay: 0.2}}>
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
        <motion.div animate={LITE ? undefined : {y: [0, -10, 0], rotate: [-1.2, 1.2, -1.2]}} transition={{duration: 7, repeat: Infinity, ease: 'easeInOut'}}>
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
          <Reveal key={f.t} delay={0.55 + i * 0.16} className="card feature">
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
        <Reveal className="card sched-card" delay={0.5}>
          <Clock size={26} />
          <h3>Thứ 2 · 4 · 6</h3>
          <ul>
            <li>18h15 – 19h45</li>
            <li>20h00 – 21h30</li>
          </ul>
        </Reveal>
        <Reveal className="card sched-card alt" delay={0.7}>
          <Clock size={26} />
          <h3>Thứ 7 · Chủ nhật</h3>
          <ul>
            <li>18h00 – 19h30</li>
          </ul>
        </Reveal>
        <Reveal className="card sched-card addr" delay={0.9}>
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

function FanBook({b, i, n, show, w, vh, onOpen}: {b: Book; i: number; n: number; show: boolean; w: number; vh: number; onOpen: (b: Book) => void}) {
  const L = layoutFor(w, vh, n);
  const p = L.pos(i);
  const c = i - (n - 1) / 2;
  const width = L.h * b.ratio;
  return (
    <motion.button
      className="fanbook"
      style={{width, height: L.h, zIndex: 10 - Math.abs(Math.round(c))}}
      initial={false}
      animate={
        show
          ? {x: p.x, y: p.y, rotate: p.r, rotateY: 0, scale: 1, opacity: 1}
          : {x: c * 5, y: -c * 2, rotate: c * 2, rotateY: 88, scale: 0.5, opacity: 0}
      }
      transition={{type: 'spring', stiffness: 110, damping: 15, mass: 0.9, delay: show ? 0.12 + i * 0.09 : 0}}
      onClick={() => onOpen(b)}
      aria-label={`${b.title} ${b.vol}`}
    >
      <div className="fanbook-in">
        <img src={b.img} alt={`${b.title} ${b.vol}`} draggable={false} />
      </div>
      <motion.span className="fancap" animate={{opacity: show ? 1 : 0}} transition={{delay: show ? 0.9 : 0}}>
        {b.kind === 'gt' ? 'Giáo trình' : 'Luyện viết'} · {b.vol}
      </motion.span>
    </motion.button>
  );
}

function BookModal({open, setOpen}: {open: Book | null; setOpen: (b: Book | null) => void}) {
  return (
      <Lightbox open={!!open} onClose={() => setOpen(null)}>
        {open && (
          <div className="bookmodal">
            <img src={LITE ? small(open.img) : open.img} alt={`${open.title} ${open.vol}`} />
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
  );
}

function Books() {
  return LITE ? <BooksLite /> : <BooksFan />;
}

function BooksLite() {
  const [open, setOpen] = useState<Book | null>(null);
  return (
    <section id="giaotrinh" className="sec books-lite">
      <SectionTitle kicker="Giáo trình" title="Bộ sách Hán ngữ Hoa Sen" sub="Chạm vào từng quyển để xem" />
      <div className="books-grid">
        {BOOKS.map((b, i) => (
          <motion.button
            key={b.id}
            className="lbook"
            initial={{opacity: 0, scale: 0.55, y: 30, rotate: (i % 3 - 1) * 9}}
            whileInView={{opacity: 1, scale: 1, y: 0, rotate: 0}}
            viewport={{once: true, margin: '0px 0px -10% 0px'}}
            transition={{type: 'spring', stiffness: 140, damping: 16, delay: i * 0.09}}
            onClick={() => setOpen(b)}
            aria-label={`${b.title} ${b.vol}`}
          >
            <Img src={small(b.img)} alt={`${b.title} ${b.vol}`} eager />
            <span>
              {b.kind === 'gt' ? 'Giáo trình' : 'Luyện viết'}
              <br />
              {b.vol}
            </span>
          </motion.button>
        ))}
      </div>
      <BookModal open={open} setOpen={setOpen} />
    </section>
  );
}

function BooksFan() {
  const ref = useRef<HTMLElement>(null);
  const [show, setShow] = useState(false);
  const [w, setW] = useState(typeof window === 'undefined' ? 1280 : window.innerWidth || 1280);
  const [vh, setVh] = useState(typeof window === 'undefined' ? 800 : window.innerHeight || 800);
  const [open, setOpen] = useState<Book | null>(null);
  useEffect(() => {
    const r = () => {
      setW(window.innerWidth || 1280);
      setVh(window.innerHeight || 800);
    };
    r();
    window.addEventListener('resize', r);
    // sách bung ra mỗi khi trang này vào màn hình, xếp lại khi rời đi
    const io = new IntersectionObserver(([e]) => setShow(e.isIntersecting), {threshold: 0.55});
    if (ref.current) io.observe(ref.current);
    return () => {
      window.removeEventListener('resize', r);
      io.disconnect();
    };
  }, []);
  return (
    <section id="giaotrinh" ref={ref} className="books">
      <div className="books-stage">
        <div className="books-head">
          <span className="kicker">Giáo trình</span>
          <h2>Bộ sách Hán ngữ Hoa Sen</h2>
          <p>Sách bung ra như đóa sen nở · chạm vào từng quyển để xem</p>
        </div>
        <div className="books-fan">
          {BOOKS.map((b, i) => (
            <FanBook key={b.id} b={b} i={i} n={BOOKS.length} show={show} w={w} vh={vh} onOpen={setOpen} />
          ))}
        </div>
      </div>
      <BookModal open={open} setOpen={setOpen} />
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
      <Reveal className="card ebook" delay={0.3}>
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
          <motion.img src="/site/giaotrinh1_s.jpg" alt="Giáo trình Hán ngữ quyển 1" animate={{y: [0, -8, 0]}} transition={{duration: 6, repeat: Infinity, ease: 'easeInOut'}} />
          <motion.img src="/site/giaotrinh2_s.jpg" alt="Giáo trình Hán ngữ quyển 2" animate={{y: [0, 10, 0]}} transition={{duration: 7, repeat: Infinity, ease: 'easeInOut'}} />
          <motion.img src="/site/giaotrinh3_s.jpg" alt="Giáo trình Hán ngữ quyển 3" animate={{y: [0, -12, 0]}} transition={{duration: 8, repeat: Infinity, ease: 'easeInOut'}} />
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
            initial={LITE ? {opacity: 0, scale: 0.92} : {opacity: 0, scale: 0.9, clipPath: 'circle(6% at 50% 50%)'}}
            whileInView={LITE ? {opacity: 1, scale: 1} : {opacity: 1, scale: 1, clipPath: 'circle(100% at 50% 50%)'}}
            viewport={{once: LITE, margin: LITE ? '0px 0px -8% 0px' : '-3% 0px'}}
            transition={LITE ? {duration: 0.45, delay: i * 0.06} : {duration: 1.1, delay: 0.45 + i * 0.14, ease: [0.2, 0.8, 0.2, 1]}}
            onClick={() => setOpen(p)}
            aria-label={p.alt}
          >
            <Img src={thumb(p.src)} alt={p.alt} eager={LITE} />
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
        <Reveal className="card contact-card" delay={0.5}>
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
        <Reveal className="contact-photo" delay={0.75}>
          <Img src="/site/t1.jpg" alt="Bảng hiệu Hán Ngữ Hoa Sen" eager={LITE} />
        </Reveal>
      </div>
    </section>
  );
}

/** Desktop: một lần lăn chuột = một trang (mượt, có khóa chống nhảy nhiều trang). */
function usePager(active: boolean) {
  useEffect(() => {
    if (!active || LITE) return;
    let locked = false;
    let lastWheel = 0;
    let ctl: ReturnType<typeof animate> | null = null;
    const html = document.documentElement;
    const els = () => PAGE_IDS.map((id) => document.getElementById(id)!);
    const maxScroll = () => document.documentElement.scrollHeight - window.innerHeight;
    const topOf = (el: HTMLElement) => el.getBoundingClientRect().top + window.scrollY;

    const goTo = (target: number) => {
      target = Math.max(0, Math.min(maxScroll(), Math.round(target)));
      ctl?.stop();
      locked = true;
      ctl = animate(window.scrollY, target, {
        duration: 0.8,
        ease: [0.65, 0, 0.35, 1],
        onUpdate: (v) => window.scrollTo({top: v, behavior: 'instant' as ScrollBehavior}),
        onComplete: () => setTimeout(() => (locked = false), 140),
      });
    };

    const step = (dir: 1 | -1): boolean => {
      const list = els();
      const vh = window.innerHeight;
      const y = window.scrollY;
      let idx = 0;
      list.forEach((el, i) => {
        if (topOf(el) <= y + 4) idx = i;
      });
      const el = list[idx];
      const top = topOf(el);
      const bottom = idx === list.length - 1 ? document.documentElement.scrollHeight : topOf(list[idx + 1]);
      const tall = bottom - top > vh + 6;
      if (dir > 0) {
        if (tall && y + vh < bottom - 4) return false; // còn nội dung trong trang này: cuộn thường
        if (idx >= list.length - 1) return false;
        goTo(topOf(list[idx + 1]));
      } else {
        if (y > top + 4) {
          if (tall) return false;
          goTo(top);
        } else {
          if (idx === 0) return false;
          const prev = list[idx - 1];
          const ph = top - topOf(prev);
          goTo(topOf(prev) + Math.max(0, ph - vh));
        }
      }
      return true;
    };

    const busy = () => html.classList.contains('intro-sky') || html.style.overflow === 'hidden';
    const onWheel = (e: WheelEvent) => {
      if (busy() || e.ctrlKey || (e.target as HTMLElement | null)?.closest?.('.lightbox')) return;
      const now = performance.now();
      const gap = now - lastWheel;
      lastWheel = now;
      if (Math.abs(e.deltaY) < 2) return;
      if (locked || gap < 70) {
        e.preventDefault();
        return;
      }
      if (step(e.deltaY > 0 ? 1 : -1)) e.preventDefault();
    };
    const onKey = (e: KeyboardEvent) => {
      if (busy() || e.altKey || e.ctrlKey || e.metaKey) return;
      const t = e.target as HTMLElement | null;
      if (t && /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName)) return;
      if (document.querySelector('.lightbox')) return;
      const down = ['ArrowDown', 'PageDown'].includes(e.key) || (e.key === ' ' && !e.shiftKey);
      const up = ['ArrowUp', 'PageUp'].includes(e.key) || (e.key === ' ' && e.shiftKey);
      if (!down && !up && e.key !== 'Home' && e.key !== 'End') return;
      e.preventDefault();
      if (locked) return;
      if (e.key === 'Home') goTo(0);
      else if (e.key === 'End') goTo(maxScroll());
      else step(down ? 1 : -1);
    };
    const onClick = (e: MouseEvent) => {
      const a = (e.target as HTMLElement | null)?.closest?.('a[href^="#"]') as HTMLAnchorElement | null;
      if (!a) return;
      const id = a.getAttribute('href')!.slice(1);
      const el = document.getElementById(id);
      if (!el || !PAGE_IDS.includes(id)) return;
      e.preventDefault();
      goTo(topOf(el));
    };
    window.addEventListener('wheel', onWheel, {passive: false});
    window.addEventListener('keydown', onKey);
    document.addEventListener('click', onClick);
    return () => {
      ctl?.stop();
      window.removeEventListener('wheel', onWheel);
      window.removeEventListener('keydown', onKey);
      document.removeEventListener('click', onClick);
    };
  }, [active]);
}

const PAGE_IDS = ['top', 'gioithieu', 'lichhoc', 'giaotrinh', 'sachdientu', 'lophoc', 'lienhe'];

function PageDots({page}: {page: number}) {
  return (
    <nav className="dots" aria-label="Trang">
      {PAGE_IDS.map((id, i) => (
        <a key={id} href={'#' + id} className={i === page ? 'on' : ''} aria-label={'Trang ' + (i + 1)} />
      ))}
    </nav>
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
  const [page, setPage] = useState(0);
  const [zoom, setZoom] = useState(() => (typeof window === 'undefined' ? 1 : Math.max(0.62, Math.min(1, window.innerHeight / 780))));
  useEffect(() => {
    const r = () => setZoom(Math.max(0.62, Math.min(1, (window.innerHeight || 780) / 780)));
    window.addEventListener('resize', r);
    return () => window.removeEventListener('resize', r);
  }, []);
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
    anim.current = animate(descent, 1, {duration: LITE ? 5 : 7.5, ease: [0.45, 0.05, 0.4, 1], onComplete: finish});
    html.classList.add('intro-sky');
    const unsub = descent.on('change', (v) => {
      if (v > 0.5) html.classList.remove('intro-sky');
      if (v > 0.86) setReady(true);
    });
    const key = (e: KeyboardEvent) => e.key === 'Escape' && skip();
    window.addEventListener('keydown', key);
    return () => {
      html.style.overflow = prev;
      html.classList.remove('intro-sky');
      unsub();
      window.removeEventListener('keydown', key);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [playing]);

  useEffect(() => {
    if (LITE) return;
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

  // Chuyển cảnh: mỗi lần sang mục mới, một vòng sóng lớn lan ra; ghi nhận trang đang xem
  useEffect(() => {
    const seen = new Set<string>();
    const io = new IntersectionObserver(
      (es) =>
        es.forEach((e) => {
          if (!e.isIntersecting) return;
          const idx = PAGE_IDS.indexOf(e.target.id);
          if (idx >= 0) setPage(idx);
          if (!seen.has(e.target.id)) {
            seen.add(e.target.id);
            if (idx > 0) window.dispatchEvent(new CustomEvent('pond-ripple', {detail: {x: window.innerWidth / 2, y: window.innerHeight * 0.5}}));
          }
        }),
      {threshold: LITE ? 0.6 : 0.25}
    );
    PAGE_IDS.forEach((id) => {
      const el = document.getElementById(id);
      if (el) io.observe(el);
    });
    return () => io.disconnect();
  }, []);

  usePager(ready && !playing);

  // Cuộn theo từng khung (snap, mobile)
  useEffect(() => {
    if (!LITE) return;
    document.documentElement.classList.add('paged');
    return () => document.documentElement.classList.remove('paged');
  }, []);

  return (
    <div className={'landing' + (LITE ? ' lite' : '')} ref={rootRef} style={{['--z' as string]: LITE ? 1 : zoom}}>
      <GlobalDefs />
      <PondScene docH={docH} descent={descent} page={page} />
      {playing && <SkyIntro t={descent} onSkip={skip} lite={LITE} />}
      <Nav hidden={!ready} />
      {ready && <PageDots page={page} />}
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
