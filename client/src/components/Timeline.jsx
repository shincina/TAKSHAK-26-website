import { Link } from 'react-router-dom';
import { useMemo, useState } from 'react';
import { sessionsOf, statusAt, dayKey, fmtDay, fmtWeekday, fmtTime } from '../lib/time.js';
import { useStore } from '../lib/store.jsx';
import { Reveal, useScrollProgress } from './Fx.jsx';

// One line per session, grouped by day, sorted by start time
export default function Timeline({ events, initialDay }) {
  const { now } = useStore();
  const items = useMemo(() => events.flatMap((e) => sessionsOf(e).map((s) => ({ e, s }))).sort((a, b) => a.s.start - b.s.start || a.e.title.localeCompare(b.e.title)), [events]);
  const days = useMemo(() => [...new Set(items.map((i) => dayKey(i.s.start)))], [items]);
  const today = dayKey(now);
  const [day, setDay] = useState(initialDay || (days.includes(today) ? today : days[0]));
  const shown = items.filter((i) => dayKey(i.s.start) === day);
  const prog = useScrollProgress();
  const live = (e, s) => now >= s.start && now <= s.end;
  return (
    <div>
      <div className="days" role="tablist">
        {days.map((d) => (
          <button key={d} role="tab" aria-selected={d === day} className={`chip ${d === day ? 'on' : ''}`} onClick={() => setDay(d)}>
            {fmtWeekday(d + 'T12:00:00+05:30')} {fmtDay(d + 'T12:00:00+05:30')}{d === today ? ' · today' : ''}
          </button>
        ))}
      </div>
      <div className="tl" ref={prog}>
        {shown.map(({ e, s }, i) => {
          const st = live(e, s) ? 'live' : s.end < now ? 'past' : 'upcoming';
          return (
            <Reveal key={e.slug + i} variant="left" delay={(i % 4) * 60} className={`tl-item ${st}`}>
              <div className="tl-time">{fmtTime(s.start)} – {fmtTime(s.end)}{e.timeNote && /full|announced/i.test(e.timeNote) ? ` (${e.timeNote.toLowerCase()})` : ''}</div>
              <Link to={`/event/${e.slug}`} className="card">
                <span className={`cat ${e.category}`} />
                <div className="row"><span className={`badge ${st}`}>{st === 'live' ? 'Live now' : st === 'upcoming' ? 'Upcoming' : 'Finished'}</span>{e.spotRegistration && <span className="badge spot">Spot registration</span>}</div>
                <h3>{e.title}</h3>
                <div className="meta"><div>{e.venue}</div></div>
              </Link>
            </Reveal>
          );
        })}
        {!shown.length && <div className="empty">Nothing scheduled for this day yet.</div>}
      </div>
    </div>
  );
}
