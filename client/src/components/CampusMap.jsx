import { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { CAMPUS, findVenue, venuePos } from '../lib/venues.js';
import { statusAt, whenText } from '../lib/time.js';
import { posterFor } from '../lib/media.js';

const BASES = {
  neon: { label: 'Neon', url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', subdomains: 'abc', maxNativeZoom: 19, attribution: '© OpenStreetMap contributors', className: 'tiles-neon' },
};
const BOUNDS = L.latLngBounds([10.0455, 76.609], [10.0615, 76.6295]);
const FALLBACK = '/logo-emblem.png';
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const LABEL = { live: 'Live now', upcoming: 'Upcoming', past: 'Finished' };
const rank = { live: 0, upcoming: 1, past: 2 };
const firstSessionStart = (event) => {
  const start = event.sessions?.[0]?.start;
  const time = start ? new Date(start).getTime() : Infinity;
  return Number.isFinite(time) ? time : Infinity;
};

// Teardrop pin whose round "eye" is the event poster
function pinHtml(v, list, { selected, fresh, label, order }) {
  const state = list.some((x) => x.st === 'live') ? 'live' : list.some((x) => x.st === 'upcoming') ? 'up' : 'past';
  const pool = list.filter((x) => x.st !== 'past'); const use = pool.length ? pool : list;
  const posters = use.map((x) => posterFor(x.e) || FALLBACK);
  return `<div class="pin3 ${state} ${selected ? 'sel' : ''} ${fresh ? 'drop' : ''}" style="--o:${order * 45}ms">
    <span class="pin3-ring"></span><span class="pin3-ring r2"></span>
    <div class="pin3-body"><img data-posters='${esc(JSON.stringify(posters))}' src="${esc(posters[0])}" alt="" draggable="false"/></div>
    ${list.length > 1 ? `<b class="pin3-n">${list.length}</b>` : ''}
    ${label || selected ? `<em class="pin3-l">${esc(v.label)}</em>` : ''}</div>`;
}

export default function CampusMap({ venues, events, now, selected, onSelect, onPlace, showAll = true }) {
  const host = useRef(null), map = useRef(null), tiles = useRef(null), markers = useRef(new Map()), me = useRef(null), cb = useRef({});
  const [anchor, setAnchor] = useState(null), [geoMsg, setGeoMsg] = useState('');
  const admin = !!onPlace;
  cb.current = { onSelect, onPlace };

  const byVenue = useMemo(() => {
    const m = {};
    events.forEach((e) => { const v = findVenue(venues, e.venue); if (v) (m[v.key] ||= []).push({ e, st: statusAt(e, now) }); });
    Object.values(m).forEach((l) => l.sort((a, b) => rank[a.st] - rank[b.st] || firstSessionStart(a.e) - firstSessionStart(b.e)));
    return m;
  }, [events, venues, now]);

  // create the map once
  useEffect(() => {
    const m = L.map(host.current, { center: CAMPUS, zoom: 17, minZoom: 16, maxZoom: 21, maxBounds: BOUNDS.pad(0.2), maxBoundsViscosity: 0.85, zoomControl: false, attributionControl: true, zoomSnap: 0.5 });
    m.attributionControl.setPrefix(false); L.control.zoom({ position: 'bottomright' }).addTo(m);
    m.on('click', (ev) => (cb.current.onPlace ? cb.current.onPlace(+ev.latlng.lat.toFixed(6), +ev.latlng.lng.toFixed(6)) : cb.current.onSelect?.(null)));
    map.current = m;
    const ro = new ResizeObserver(() => m.invalidateSize()); ro.observe(host.current);
    return () => { ro.disconnect(); m.remove(); map.current = null; markers.current.clear(); };
  }, []);

  // Add the single campus map layer.
  useEffect(() => {
    const b = BASES.neon;
    tiles.current = L.tileLayer(b.url, { subdomains: b.subdomains, maxNativeZoom: b.maxNativeZoom, maxZoom: 21, attribution: b.attribution, className: b.className }).addTo(map.current);
  }, []);

  // pins: poster eye, pulse when live, count badge when a venue hosts several events
  const fitted = useRef(false);
  useEffect(() => {
    const m = map.current, seen = new Set();
    venues.forEach((v, idx) => {
      const list = byVenue[v.key] || [];
      const live = list.some((x) => x.st === 'live');
      const visible = admin || (list.length && (showAll || live));
      if (!visible) return; seen.add(v.key);
      const html = pinHtml(v, list.length ? list : [{ e: { slug: 'x' }, st: 'past' }], { selected: selected === v.key, label: admin, order: idx, fresh: !markers.current.has(v.key) });
      const icon = L.divIcon({ className: 'pin3-host', html, iconSize: [46, 58], iconAnchor: [23, 56] });
      let mk = markers.current.get(v.key);
      if (!mk) { mk = L.marker(venuePos(v), { icon, riseOnHover: true, keyboard: true, title: v.label }).addTo(m); mk.on('click', (ev) => { L.DomEvent.stopPropagation(ev); cb.current.onSelect?.(v.key); }); markers.current.set(v.key, mk); }
      else { mk.setIcon(icon); mk.setLatLng(venuePos(v)); }
      mk.setZIndexOffset(live ? 1000 : selected === v.key ? 900 : 0);
    });
    markers.current.forEach((mk, key) => { if (!seen.has(key)) { mk.remove(); markers.current.delete(key); } });
    if (!fitted.current && markers.current.size) {
      fitted.current = true; const pts = [...markers.current.values()].map((x) => x.getLatLng());
      m.fitBounds(L.latLngBounds(pts).pad(0.15), { maxBounds: undefined, maxZoom: 18, animate: false });
    }
  }, [venues, byVenue, selected, showAll, admin]);

  // posters take turns in the pin when a venue has several events
  useEffect(() => {
    const t = setInterval(() => {
      host.current?.querySelectorAll('.pin3-body img').forEach((img) => {
        let list; try { list = JSON.parse(img.dataset.posters); } catch { return; }
        if (list.length < 2) return;
        const next = list[(list.indexOf(img.getAttribute('src')) + 1) % list.length];
        img.classList.add('swap'); setTimeout(() => { img.src = next; img.classList.remove('swap'); }, 260);
      });
    }, 3200);
    return () => clearInterval(t);
  }, []);

  // floating box follows its pin
  const venue = venues.find((v) => v.key === selected);
  useEffect(() => {
    const m = map.current; if (!m || !venue || admin) return setAnchor(null);
    const upd = () => { const p = m.latLngToContainerPoint(venuePos(venue)), s = m.getSize(); setAnchor({ x: Math.min(Math.max(p.x, 170), s.x - 170), y: p.y, w: s.x, h: s.y }); };
    // park the pin low on desktop (card above it) or high on phones (card sheet below it)
    const z = Math.max(m.getZoom(), 19), sz = m.getSize(), shift = innerWidth < 700 ? -sz.y * 0.22 : sz.y * 0.2;
    if (innerWidth < 700) { const el = host.current.parentElement; window.__lenis ? window.__lenis.scrollTo(el, { offset: -70 }) : el.scrollIntoView({ behavior: 'smooth', block: 'start' }); }
    m.flyTo(m.unproject(m.project(venuePos(venue), z).subtract([0, shift]), z), z, { duration: 0.8 }); upd();
    m.on('move zoom resize', upd); return () => m.off('move zoom resize', upd);
  }, [selected, venue, admin]);
  useEffect(() => { const k = (e) => e.key === 'Escape' && onSelect?.(null); addEventListener('keydown', k); return () => removeEventListener('keydown', k); }, [onSelect]);

  const locate = () => {
    setGeoMsg('Finding you…');
    navigator.geolocation?.getCurrentPosition(({ coords }) => {
      const ll = [coords.latitude, coords.longitude];
      if (!BOUNDS.pad(0.3).contains(ll)) return setGeoMsg('You appear to be away from the campus.');
      me.current?.remove(); me.current = L.circleMarker(ll, { radius: 8, color: '#fff', weight: 3, fillColor: '#35a8ff', fillOpacity: 1, className: 'me-dot' }).addTo(map.current);
      map.current.flyTo(ll, 19, { duration: 0.9 }); setGeoMsg('');
    }, () => setGeoMsg('Location is blocked or unavailable.'), { enableHighAccuracy: true, timeout: 10000 });
  };

  const list = venue ? byVenue[venue.key] || [] : [];
  return (
    <div>
      <div className="map-bar">
        <button className="chip" onClick={locate}>Show my location</button>{geoMsg && <span className="mute" style={{ fontSize: '.85rem' }}>{geoMsg}</span>}
      </div>
      <div className="map-shell">
        <div ref={host} className="lmap" role="application" aria-label="Interactive campus map" />
        {venue && anchor && !admin && (
          <div className="fcard" role="dialog" aria-label={`Events at ${venue.label}`} style={{ '--x': `${anchor.x}px`, '--y': `${anchor.y - 64}px`, '--mh': `${Math.max(anchor.y - 84, 240)}px` }}>
            <button className="fc-x" onClick={() => onSelect(null)} aria-label="Close">×</button>
            <div className="fc-head"><h3>{venue.label}</h3><span className="mute">{venue.block}</span></div>
            {list.length ? <div className="fc-list">{list.map(({ e, st }) => (
              <article key={e.slug} className={`fc-ev ${st}`}>
                <img src={posterFor(e) || FALLBACK} alt={`${e.title} poster`} className={posterFor(e) ? '' : 'noposter'} />
                <div>
                  <span className={`badge ${st}`}>{LABEL[st]}</span>
                  <h4>{e.title}</h4>
                  <div className="mute">{whenText(e)}</div>
                  <div className="mute">{e.feeAmount === 0 ? 'Free entry' : e.feeText?.split('|')[0] || ''}{e.prizePool ? ` · Prize ${e.prizePool}` : ''}</div>
                  <Link to={`/event/${e.slug}`} className="btn primary small">Details and register</Link>
                </div>
              </article>))}</div> : <div className="mute">No events are scheduled here.</div>}
            <i className="fc-tip" />
          </div>
        )}
      </div>
      <div className="legend">
        <span><i style={{ background: 'var(--live)' }} />Live now</span>
        <span><i style={{ background: 'var(--sun)' }} />Coming up</span>
        <span><i style={{ background: '#6b5a8f' }} />Finished</span>
        <span>The number on a pin is how many events are at that spot</span>
      </div>
    </div>
  );
}
