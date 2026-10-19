import { useEffect, useRef, useState } from 'react';

// Full-screen viewer: arrow keys, swipe, and a zoom-in entrance
export default function Lightbox({ items, start = 0, onClose }) {
  const [i, setI] = useState(start), [dir, setDir] = useState(0), drag = useRef(null);
  const go = (d) => { setDir(d); setI((n) => (n + d + items.length) % items.length); };
  useEffect(() => {
    window.__lenis?.stop();
    const key = (e) => { if (e.key === 'Escape') onClose(); if (e.key === 'ArrowRight') go(1); if (e.key === 'ArrowLeft') go(-1); };
    addEventListener('keydown', key);
    return () => { removeEventListener('keydown', key); window.__lenis?.start(); };
  }, []); // eslint-disable-line
  const it = items[i];
  return (
    <div className="lb" data-lenis-prevent onClick={onClose} role="dialog" aria-modal="true" aria-label="Image viewer"
      onPointerDown={(e) => { drag.current = e.clientX; }}
      onPointerUp={(e) => { if (drag.current !== null && Math.abs(e.clientX - drag.current) > 60) go(e.clientX < drag.current ? 1 : -1); drag.current = null; }}>
      <button className="lb-x" onClick={onClose} aria-label="Close">×</button>
      {items.length > 1 && <button className="lb-n prev" onClick={(e) => { e.stopPropagation(); go(-1); }} aria-label="Previous">‹</button>}
      <figure key={i} className={`lb-fig ${dir < 0 ? 'from-l' : dir > 0 ? 'from-r' : ''}`} onClick={(e) => e.stopPropagation()}>
        <img src={it.src} alt={it.caption || ''} draggable="false" />
        {it.caption && <figcaption>{it.caption}<span>{i + 1} / {items.length}</span></figcaption>}
      </figure>
      {items.length > 1 && <button className="lb-n next" onClick={(e) => { e.stopPropagation(); go(1); }} aria-label="Next">›</button>}
    </div>
  );
}
