import { useMemo, useState } from 'react';
import { useStore } from '../lib/store.jsx';
import { statusAt, sessionsOf, dayKey, fmtDay, fmtWeekday } from '../lib/time.js';
import EventCard from '../components/EventCard.jsx';
import { Scramble } from '../components/Fx.jsx';

const META = {
  workshop: { title: 'Workshops', blurb: 'Hands-on sessions with mentors and speakers. Bring a laptop where asked.' },
  competition: { title: 'Competitions', blurb: 'Test your skills against the rest. Check team sizes and prize pools before you register.' },
  event: { title: 'Events', blurb: 'Talks, showcases and everything that is neither a workshop nor a competition.' },
};

export default function EventList({ category }) {
  const { events, now } = useStore();
  const [q, setQ] = useState(''), [day, setDay] = useState('all'), [st, setSt] = useState('all'), [spot, setSpot] = useState(false), [free, setFree] = useState(false), [online, setOnline] = useState(false);
  const base = useMemo(() => events.filter((e) => e.category === category), [events, category]);
  const days = useMemo(() => [...new Set(base.flatMap((e) => sessionsOf(e).map((s) => dayKey(s.start))))].sort(), [base]);
  const list = useMemo(() => base.filter((e) => {
    if (q && !`${e.title} ${e.organizer || ''} ${e.venue} ${e.tagline || ''}`.toLowerCase().includes(q.toLowerCase())) return false;
    if (day !== 'all' && !sessionsOf(e).some((s) => dayKey(s.start) === day)) return false;
    if (st !== 'all' && statusAt(e, now) !== st) return false;
    if (spot && !e.spotRegistration) return false;
    if (free && e.feeAmount !== 0) return false;
    if (online && !e.online) return false;
    return true;
  }).sort((a, b) => sessionsOf(a)[0].start - sessionsOf(b)[0].start), [base, q, day, st, spot, free, online, now]);
  const m = META[category];
  const Chip = ({ on, set, children }) => <button className={`chip ${on ? 'on' : ''}`} onClick={set}>{children}</button>;
  return (
    <>
      <Scramble as="h1" text={m.title} className="pagehead" />
      <p className="mute" style={{ marginTop: 8 }}>{m.blurb}</p>
      <div className="filters">
        <input className="input" type="search" placeholder={`Search ${m.title.toLowerCase()}`} value={q} onChange={(e) => setQ(e.target.value)} aria-label="Search" />
        <div className="chips">
          <Chip on={day === 'all'} set={() => setDay('all')}>All days</Chip>
          {days.map((d) => <Chip key={d} on={day === d} set={() => setDay(d)}>{fmtWeekday(d + 'T12:00:00+05:30')} {fmtDay(d + 'T12:00:00+05:30')}</Chip>)}
        </div>
        <div className="chips">
          {[['all', 'Any status'], ['live', 'Live'], ['upcoming', 'Upcoming'], ['past', 'Finished']].map(([k, l]) => <Chip key={k} on={st === k} set={() => setSt(k)}>{l}</Chip>)}
          <Chip on={spot} set={() => setSpot(!spot)}>Spot registration</Chip><Chip on={free} set={() => setFree(!free)}>Free</Chip><Chip on={online} set={() => setOnline(!online)}>Online</Chip>
        </div>
      </div>
      <div className="mute" style={{ marginBottom: 12 }}>{list.length} of {base.length} shown</div>
      {list.length ? <div className="grid">{list.map((e, i) => <EventCard key={e.slug} event={e} i={i} />)}</div>
        : <div className="empty">{base.length ? 'No matches. Try clearing a filter.' : 'Nothing here yet. Admins can add events from the admin panel.'}</div>}
    </>
  );
}
