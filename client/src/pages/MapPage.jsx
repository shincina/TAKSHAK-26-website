import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useStore } from '../lib/store.jsx';
import CampusMap from '../components/CampusMap.jsx';
import { statusAt, whenText } from '../lib/time.js';
import { findVenue } from '../lib/venues.js';
import { Scramble } from '../components/Fx.jsx';

export default function MapPage() {
  const { events, venues, now } = useStore();
  const [sel, setSel] = useState(null);
  const [all, setAll] = useState(true);
  const live = useMemo(() => events.filter((e) => statusAt(e, now) === 'live'), [events, now]);
  const liveOnMap = live.filter((e) => findVenue(venues, e.venue));
  const liveOnline = live.filter((e) => e.online);
  return (
    <>
      <Scramble as="h1" text="Campus map" className="pagehead" />
      <p className="mute" style={{ margin: '8px 0 16px' }}>Each pin shows an event poster and pulses while that event is live. Tap a pin to see what is on there.</p>
      <div className="chips" style={{ marginBottom: 12 }}>
        <button className={`chip ${all ? 'on' : ''}`} onClick={() => setAll(true)}>All venues</button>
        <button className={`chip ${!all ? 'on' : ''}`} onClick={() => setAll(false)}>Live only</button>
      </div>
      <div className="mapwrap">
        <CampusMap venues={venues} events={events} now={now} selected={sel} onSelect={setSel} showAll={all} />
        <div style={{ display: 'grid', gap: 14 }}>
          <div>
            <h2 style={{ fontSize: '1.2rem', marginBottom: 10 }}>Live now{live.length ? ` (${live.length})` : ''}</h2>
            {liveOnMap.length ? liveOnMap.map((e) => (
              <button key={e.slug} className="livecard" style={{ width: '100%', textAlign: 'left', marginBottom: 8 }} onClick={() => setSel(findVenue(venues, e.venue).key)}>
                <span className="badge live">Live</span><div><h3>{e.title}</h3><div className="mute" style={{ fontSize: '.82rem' }}>{e.venue}</div></div>
              </button>
            )) : <div className="empty">No on-campus events are live at the moment.</div>}
            {liveOnline.length > 0 && <div className="mute" style={{ marginTop: 8 }}>Also live online: {liveOnline.map((e) => <Link key={e.slug} to={`/event/${e.slug}`} className="sun">{e.title}</Link>).reduce((a, b) => [a, ', ', b])}</div>}
          </div>
        </div>
      </div>
      <p className="mute" style={{ marginTop: 16, fontSize: '.85rem' }}>This is a simplified schematic of MACE blocks and venues, not a surveyed plan.</p>
    </>
  );
}
