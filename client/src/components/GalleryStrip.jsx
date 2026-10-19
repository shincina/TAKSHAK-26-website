import { useState } from 'react';
import { gallery } from '../lib/media.js';
import Lightbox from './Lightbox.jsx';

// Two auto-scrolling film strips running in opposite directions
export default function GalleryStrip() {
  const [open, setOpen] = useState(null);
  if (!gallery.length) return <div className="empty">Fest photos will appear here. Add images to client/src/assets/gallery.</div>;
  const fill = (rev) => { let a = rev ? [...gallery].reverse() : [...gallery]; while (a.length < 8) a = a.concat(a); return a; };
  const Row = ({ rev }) => {
    const row = fill(rev);
    return (<div className={`film ${rev ? 'rev' : ''}`}><div className="film-track">
      {[...row, ...row].map((g, k) => (
        <button key={k} className="film-item" onClick={() => setOpen(gallery.findIndex((x) => x.src === g.src))} aria-label={`Open photo: ${g.caption}`}>
          <img src={g.src} alt={g.caption} loading="lazy" /><span>{g.caption}</span>
        </button>))}
    </div></div>);
  };
  return (<><Row /><Row rev />{open !== null && <Lightbox items={gallery} start={open} onClose={() => setOpen(null)} />}</>);
}
