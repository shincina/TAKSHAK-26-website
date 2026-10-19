import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { Icon } from './Icons.jsx';
import { useStore } from '../lib/store.jsx';
import { PRESETS, getOffset, setClockTo, fmtDay, fmtTime } from '../lib/time.js';

const TABS = [
  ['/', 'Home', 'home'], ['/workshops', 'Workshops', 'workshop'], ['/competitions', 'Competitions', 'competition'],
  ['/map', 'Map', 'map'], ['/events', 'Events', 'events'], ['/gallery', 'Gallery', 'gallery'], ['/profile', 'Profile', 'profile'],
];

export default function Layout() {
  const { pathname } = useLocation();
  const { now, bump } = useStore();
  const [picker, setPicker] = useState(false);
  useEffect(() => { (window.__lenis ? window.__lenis.scrollTo(0, { immediate: true }) : window.scrollTo(0, 0)); }, [pathname]);
  const shifted = getOffset() !== 0;
  const links = (cls) => TABS.map(([to, label, icon]) => (
    <NavLink key={to} to={to} end={to === '/'} className={({ isActive }) => (isActive ? 'active' : '')}>
      {cls === 'bar' && <Icon name={icon} />}<span>{label}</span>
    </NavLink>
  ));
  return (
    <>
      <div className="floor" aria-hidden="true" />
      <header className="top">
        <NavLink to="/" className="brand"><img src="/logo-emblem.png" alt="" /><div>TAKSHAK'26<small>beyond the neon horizon</small></div></NavLink>
        <nav className="nav" aria-label="Main">{links('top')}</nav>
      </header>
      <main><Outlet /></main>
      <footer className="foot">
        <img src="/mace-wordmark.png" alt="Mar Athanasius College of Engineering, Kothamangalam (Autonomous)" />
        <div>TAKSHAK'26 is presented by Mar Athanasius College of Engineering, Kothamangalam</div>
        <div className="row" style={{ justifyContent: "center", marginTop: 10 }}><button className="chip" onClick={() => setPicker(true)}>Preview the fest at another time</button></div>
      </footer>
      <nav className="tabbar" aria-label="Main">{links('bar')}</nav>
      {shifted && <button className="clock" onClick={() => setPicker(true)}>Preview time: {fmtDay(now)}, {fmtTime(now)}</button>}
      {picker && (
        <div className="overlay" data-lenis-prevent onClick={() => setPicker(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <button className="x" onClick={() => setPicker(false)} aria-label="Close">×</button>
            <h2>Preview the fest</h2>
            <p className="mute" style={{ margin: '8px 0 14px' }}>Jump the site's clock to see how live, upcoming and past events look during the fest. This only changes what you see in this browser.</p>
            <div className="chips">
              {PRESETS.map((p) => (
                <button key={p.label} className="chip" onClick={() => { setClockTo(p.iso); bump(); setPicker(false); }}>{p.label}</button>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
