import { useEffect, useState } from 'react';
import Lenis from 'lenis';
import { GlobalFx } from './components/Fx.jsx';
import { Route, Routes } from 'react-router-dom';
import Layout from './components/Layout.jsx';
import Splash from './components/Splash.jsx';
import Home from './pages/Home.jsx';
import EventList from './pages/EventList.jsx';
import EventDetail from './pages/EventDetail.jsx';
import MapPage from './pages/MapPage.jsx';
import Profile from './pages/Profile.jsx';
import Admin from './pages/Admin.jsx';
import Gallery from './pages/Gallery.jsx';

export default function App() {
  // The intro plays once per browser session
  const [intro, setIntro] = useState(() => !sessionStorage.getItem('tk-intro'));
  useEffect(() => { if (!intro) document.documentElement.classList.add('ready'); }, [intro]);
  useEffect(() => {
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const l = new Lenis({ lerp: 0.09, wheelMultiplier: 0.95 }); window.__lenis = l; let raf;
    const loop = (t) => { l.raf(t); raf = requestAnimationFrame(loop); }; raf = requestAnimationFrame(loop);
    return () => { cancelAnimationFrame(raf); l.destroy(); window.__lenis = null; };
  }, []);
  return (
    <>
      <GlobalFx />
      {intro && <Splash onDone={() => { sessionStorage.setItem('tk-intro', '1'); setIntro(false); }} />}
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<Home />} />
          <Route path="/workshops" element={<EventList category="workshop" />} />
          <Route path="/competitions" element={<EventList category="competition" />} />
          <Route path="/events" element={<EventList category="event" />} />
          <Route path="/map" element={<MapPage />} />
          <Route path="/event/:slug" element={<EventDetail />} />
          <Route path="/gallery" element={<Gallery />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/admin" element={<Admin />} />
          <Route path="*" element={<div className="empty">Page not found.</div>} />
        </Route>
      </Routes>
    </>
  );
}
