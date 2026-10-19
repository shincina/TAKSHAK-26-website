import { useEffect, useRef, useState } from 'react';
import Aura from './Aura.jsx';

const FILL_MS = 3800;
const LOG = ['Booting the neon grid', 'Charging the emblem', 'Routing power to campus', 'Signal locked'];

export default function Splash({ onDone }) {
  const emblem = useRef(null);
  const [pct, setPct] = useState(0), [out, setOut] = useState(false);
  const finish = useRef(() => {});
  finish.current = () => { if (out) return; setOut(true); setTimeout(onDone, 800); };

  useEffect(() => {
    const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
    let raf, done = false; const start = performance.now();
    const frame = (t) => {
      const p = Math.min((t - start) / (reduce ? 400 : FILL_MS), 1), e = 1 - Math.pow(1 - p, 2.2);
      emblem.current?.style.setProperty('--rest', `${(1 - e) * 100}%`);
      emblem.current?.style.setProperty('--scan', `${(1 - e) * 100}%`);
      setPct(Math.round(e * 100));
      if (p >= 1 && !done) { done = true; setTimeout(() => finish.current(), reduce ? 200 : 1500); }
      raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(raf);
  }, []);

  const titled = pct > 78;
  return (
    <div className={`splash ${out ? 'out' : ''}`} role="status" aria-label="Loading TAKSHAK'26">
      <div className="splash-grid" aria-hidden="true" />
      <div className="splash-inner">
        <div className="emblem-wrap">
          <Aura intensity={pct / 100} />
          <div className="emblem" ref={emblem}>
            <img className="base" src="/logo-emblem.png" alt="" />
            <img className="lit" src="/logo-emblem.png" alt="TAKSHAK'26 logo" />
            <div className="scan" />
          </div>
        </div>
        <h1 className={titled ? 'on' : ''} data-text="TAKSHAK'26">TAKSHAK'26</h1>
        <div className={`sub ${titled ? 'on' : ''}`}>beyond the neon horizon</div>
        <div className="bar"><i style={{ width: `${pct}%` }} /></div>
        <div className="pct">{pct}% · {LOG[Math.min(Math.floor(pct / 26), 3)]}</div>
      </div>
      <div className="by">Mar Athanasius College of Engineering, Kothamangalam</div>
      <button className="skip" onClick={() => finish.current()}>Skip intro</button>
    </div>
  );
}
