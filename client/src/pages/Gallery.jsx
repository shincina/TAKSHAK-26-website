import { useEffect, useState } from 'react';
import { gallery } from '../lib/media.js';
import Lightbox from '../components/Lightbox.jsx';
import { Reveal, Scramble } from '../components/Fx.jsx';

function getColumnCount() {
  if (window.innerWidth >= 820) return 3;
  if (window.innerWidth >= 540) return 2;
  return 1;
}

export default function Gallery() {
  const [open, setOpen] = useState(null);
  const [columns, setColumns] = useState(() => Array.from({ length: getColumnCount() }, () => []));

  useEffect(() => {
    let active = true;
    let arrangement = 0;
    const arrange = () => {
      const currentArrangement = ++arrangement;
      const count = getColumnCount();
      const heights = Array(count).fill(0);
      const next = Array.from({ length: count }, () => []);
      const ratios = gallery.map((item) => {
        const image = new Image();
        image.src = item.src;
        return image;
      });

      Promise.all(ratios.map((image) => image.decode().catch(() => null))).then(() => {
        const items = gallery.map((item, index) => {
          const image = ratios[index];
          const ratio = image.naturalWidth && image.naturalHeight ? image.naturalWidth / image.naturalHeight : 1;
          return { item, index, height: 1 / ratio };
        });
        items.sort((a, b) => b.height - a.height);
        items.forEach(({ item, index, height }) => {
          const shortest = heights.indexOf(Math.min(...heights));
          next[shortest].push({ item, index });
          heights[shortest] += height;
        });
        next.forEach((column) => column.sort((a, b) => a.index - b.index));
        if (active && currentArrangement === arrangement) setColumns(next);
      });
    };

    arrange();
    window.addEventListener('resize', arrange);
    return () => {
      active = false;
      window.removeEventListener('resize', arrange);
    };
  }, []);

  return (<>
    <Scramble as="h1" text="Gallery" className="pagehead" />
    <p className="mute" style={{ margin: '8px 0 20px' }}>Moments from TAKSHAK'26.</p>
    {gallery.length ? <div className="masonry">
      {columns.map((column, columnIndex) => <div className="m-column" key={columnIndex}>
        {column.map(({ item, index }) => (
          <Reveal key={item.src} delay={(index % 4) * 90} variant="zoom" className="m-wrap">
            <button className="m-item" onClick={() => setOpen(index)} aria-label={`Open photo: ${item.caption}`}><img src={item.src} alt={item.caption} loading="lazy" /><span>{item.caption}</span></button>
          </Reveal>))}
      </div>)}
    </div> : <div className="empty">No photos yet. Add images to client/src/assets/gallery and they appear here.</div>}
    {open !== null && <Lightbox items={gallery} start={open} onClose={() => setOpen(null)} />}
  </>);
}
