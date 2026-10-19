import { useEffect, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';

const reduced = () => matchMedia('(prefers-reduced-motion: reduce)').matches;

/* Fade/slide in when scrolled into view */
export function Reveal({ as: Tag = 'div', variant = 'up', delay = 0, className = '', children, ...rest }) {
  const ref = useRef(null), [on, setOn] = useState(false);
  useEffect(() => {
    if (!('IntersectionObserver' in window) || reduced()) return setOn(true);
    const io = new IntersectionObserver(([en]) => { if (en.isIntersecting) { setOn(true); io.disconnect(); } }, { threshold: 0.12, rootMargin: '0px 0px -6% 0px' });
    io.observe(ref.current); return () => io.disconnect();
  }, []);
  return <Tag ref={ref} className={`rv rv-${variant} ${on ? 'in' : ''} ${className}`} style={{ '--d': `${delay}ms` }} {...rest}>{children}</Tag>;
}

/* Text that decodes from glitch characters, .hack-style */
const GLYPHS = '█▓▒░<>/\\+*#%&01';
export function Scramble({ as: Tag = 'h2', text, className = '', speed = 28 }) {
  const ref = useRef(null), [shown, setShown] = useState(text);
  useEffect(() => {
    if (reduced() || !('IntersectionObserver' in window)) return;
    setShown(text.replace(/[^ ]/g, ' '));
    const io = new IntersectionObserver(([en]) => {
      if (!en.isIntersecting) return; io.disconnect();
      let i = 0; const id = setInterval(() => {
        i += 0.6; const k = Math.floor(i);
        setShown(text.split('').map((ch, j) => (ch === ' ' ? ' ' : j < k ? ch : GLYPHS[Math.floor(Math.random() * GLYPHS.length)])).join(''));
        if (k >= text.length) { clearInterval(id); setShown(text); }
      }, speed);
    }, { threshold: 0.4 });
    io.observe(ref.current); return () => io.disconnect();
  }, [text, speed]);
  return <Tag ref={ref} className={`scr ${className}`} aria-label={text}><span aria-hidden="true">{shown}</span></Tag>;
}

export function CountUp({ to, ms = 1400 }) {
  const ref = useRef(null), [n, setN] = useState(0);
  useEffect(() => {
    if (reduced()) return setN(to);
    const io = new IntersectionObserver(([en]) => {
      if (!en.isIntersecting) return; io.disconnect();
      const t0 = performance.now(); const step = (t) => { const p = Math.min((t - t0) / ms, 1); setN(Math.round(to * (1 - Math.pow(1 - p, 3)))); if (p < 1) requestAnimationFrame(step); };
      requestAnimationFrame(step);
    }, { threshold: 0.5 });
    io.observe(ref.current); return () => io.disconnect();
  }, [to, ms]);
  return <span ref={ref}>{n}</span>;
}

/* 3D tilt with a light glare that follows the pointer */
export function useTilt(max = 7) {
  const ref = useRef(null);
  const onMove = (e) => {
    if (e.pointerType === 'touch' || reduced()) return;
    const r = ref.current.getBoundingClientRect(), x = (e.clientX - r.left) / r.width, y = (e.clientY - r.top) / r.height;
    const s = ref.current.style; s.setProperty('--rx', `${(0.5 - y) * max}deg`); s.setProperty('--ry', `${(x - 0.5) * max}deg`); s.setProperty('--gx', `${x * 100}%`); s.setProperty('--gy', `${y * 100}%`);
  };
  const onLeave = () => { const s = ref.current.style; s.setProperty('--rx', '0deg'); s.setProperty('--ry', '0deg'); };
  return { ref, onPointerMove: onMove, onPointerLeave: onLeave };
}

/* Scrolling ticker */
export function Marquee({ items, reverse = false, outline = false }) {
  const row = (copy) => items.map((t, i) => <span key={`${copy}-${i}`} className="mq-item">{t}<i>✦</i></span>);
  return <div className={`marq ${reverse ? 'rev' : ''} ${outline ? 'outline' : ''}`} aria-hidden="true"><div className="marq-track">{row('a')}{row('b')}</div></div>;
}

/* Ticking digit */
export const Digit = ({ v }) => <b key={v} className="dg">{String(v).padStart(2, '0')}</b>;

/* Writes scroll progress (0..1) of an element through the viewport to --p */
export function useScrollProgress() {
  const ref = useRef(null);
  useEffect(() => {
    const on = () => { const el = ref.current; if (!el) return; const r = el.getBoundingClientRect(), vh = innerHeight; el.style.setProperty('--p', Math.min(Math.max((vh * 0.6 - r.top) / r.height, 0), 1)); };
    on(); addEventListener('scroll', on, { passive: true }); addEventListener('resize', on);
    return () => { removeEventListener('scroll', on); removeEventListener('resize', on); };
  }, []);
  return ref;
}

/* Global layer: scroll bar, cursor ring + sparks, magnetic buttons, particle field, page wipe */
export function GlobalFx() {
  const bar = useRef(null), dot = useRef(null), ring = useRef(null), field = useRef(null), spark = useRef(null);
  const { pathname } = useLocation(); const [wipe, setWipe] = useState(0); const first = useRef(true);
  useEffect(() => { if (first.current) { first.current = false; return; } setWipe((n) => n + 1); }, [pathname]);

  useEffect(() => {
    const onScroll = () => { const h = document.documentElement; bar.current.style.transform = `scaleX(${h.scrollTop / Math.max(h.scrollHeight - innerHeight, 1)})`; };
    onScroll(); addEventListener('scroll', onScroll, { passive: true }); return () => removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => { // particles
    if (reduced()) return;
    const c = field.current, ctx = c.getContext('2d'); let raf, W, H, mx = 0, my = 0, lastY = scrollY, vy = 0;
    const N = innerWidth < 700 ? 38 : 80, P = [];
    const size = () => { const d = Math.min(devicePixelRatio || 1, 2); W = c.width = innerWidth * d; H = c.height = innerHeight * d; ctx.setTransform(d, 0, 0, d, 0, 0); W /= d; H /= d; };
    size(); addEventListener('resize', size);
    const cols = ['255,43,214', '255,210,31', '180,92,255', '255,138,31'];
    for (let i = 0; i < N; i++) P.push({ x: Math.random() * innerWidth, y: Math.random() * innerHeight, z: 0.3 + Math.random() * 0.9, c: cols[i % 4], s: Math.random() * 1.8 + 0.6 });
    const move = (e) => { mx = e.clientX / innerWidth - 0.5; my = e.clientY / innerHeight - 0.5; };
    addEventListener('pointermove', move, { passive: true });
    const frame = () => {
      vy += ((scrollY - lastY) - vy) * 0.15; lastY = scrollY;
      ctx.clearRect(0, 0, W, H);
      P.forEach((p) => {
        p.y -= p.z * 0.35 + vy * p.z * 0.35; p.x += Math.sin(p.y / 90 + p.z) * 0.15;
        if (p.y < -20) { p.y = H + 10; p.x = Math.random() * W; } if (p.y > H + 20) p.y = -10;
        const x = p.x + mx * 40 * p.z, y = p.y + my * 40 * p.z, streak = Math.min(Math.abs(vy) * p.z * 1.4, 26);
        ctx.fillStyle = `rgba(${p.c},${0.25 + p.z * 0.5})`; ctx.shadowColor = `rgb(${p.c})`; ctx.shadowBlur = 8;
        ctx.fillRect(x, y, p.s, p.s + streak);
      });
      raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);
    return () => { cancelAnimationFrame(raf); removeEventListener('resize', size); removeEventListener('pointermove', move); };
  }, []);

  useEffect(() => { // cursor + sparks + magnetic buttons (mouse only)
    if (!matchMedia('(pointer: fine)').matches || reduced()) return;
    const sc = spark.current, sx = sc.getContext('2d'); let raf, rx = -50, ry = -50, x = -50, y = -50, parts = [];
    const size = () => { sc.width = innerWidth; sc.height = innerHeight; }; size(); addEventListener('resize', size);
    let mag = null;
    const move = (e) => {
      x = e.clientX; y = e.clientY; dot.current.style.transform = `translate(${x}px,${y}px)`;
      for (let i = 0; i < 2; i++) parts.push({ x, y, vx: (Math.random() - 0.5) * 1.4, vy: (Math.random() - 0.5) * 1.4, l: 1, c: Math.random() > 0.5 ? '255,43,214' : '255,210,31' });
      const hot = e.target.closest?.('a,button,.card,input,select,textarea,label'); ring.current.classList.toggle('hot', !!hot);
      const b = e.target.closest?.('.btn');
      if (mag && mag !== b) { mag.style.transform = ''; mag = null; }
      if (b) { const r = b.getBoundingClientRect(); b.style.transform = `translate(${(e.clientX - r.left - r.width / 2) * 0.22}px,${(e.clientY - r.top - r.height / 2) * 0.3}px)`; mag = b; }
    };
    const down = () => ring.current.classList.add('press'), up = () => ring.current.classList.remove('press');
    addEventListener('pointermove', move, { passive: true }); addEventListener('pointerdown', down); addEventListener('pointerup', up);
    document.documentElement.classList.add('fx-cursor');
    const frame = () => {
      if (!ring.current) return; rx += (x - rx) * 0.16; ry += (y - ry) * 0.16; ring.current.style.transform = `translate(${rx}px,${ry}px)`;
      sx.clearRect(0, 0, sc.width, sc.height);
      parts = parts.filter((p) => p.l > 0.02);
      parts.forEach((p) => { p.x += p.vx; p.y += p.vy; p.l *= 0.93; sx.fillStyle = `rgba(${p.c},${p.l})`; sx.fillRect(p.x, p.y, 2.2 * p.l + 0.6, 2.2 * p.l + 0.6); });
      raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);
    return () => { cancelAnimationFrame(raf); removeEventListener('pointermove', move); removeEventListener('pointerdown', down); removeEventListener('pointerup', up); removeEventListener('resize', size); document.documentElement.classList.remove('fx-cursor'); };
  }, []);

  return (<>
    <canvas ref={field} className="particle-field" aria-hidden="true" />
    <div className="progress" ref={bar} aria-hidden="true" />
    <canvas ref={spark} className="sparks" aria-hidden="true" />
    <div ref={ring} className="cur-ring" aria-hidden="true" /><div ref={dot} className="cur-dot" aria-hidden="true" />
    {wipe > 0 && <div key={wipe} className="wipe" aria-hidden="true"><span>TAKSHAK'26</span></div>}
  </>);
}
