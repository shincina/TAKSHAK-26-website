import { Link } from 'react-router-dom';
import { statusAt, whenText } from '../lib/time.js';
import { useStore } from '../lib/store.jsx';
import { Reveal, useTilt } from './Fx.jsx';
import { posterFor } from '../lib/media.js';

export function Status({ event }) {
  const { now } = useStore();
  const s = statusAt(event, now);
  return <span className={`badge ${s}`}>{s === 'live' ? 'Live now' : s === 'upcoming' ? 'Upcoming' : 'Finished'}</span>;
}

export const feeLabel = (e) => (e.feeText ? (e.feeAmount === 0 ? 'Free' : e.feeText.split('|')[0].trim()) : 'See details');

export default function EventCard({ event: e, i = 0 }) {
  const { now } = useStore();
  const tilt = useTilt(); const poster = posterFor(e);
  const expired = statusAt(e, now) === 'past';
  return (
    <Reveal delay={(i % 6) * 70}>
    <Link to={`/event/${e.slug}`} className={`card tilt${expired ? ' expired' : ''}`} {...tilt}>
      <span className="glare" />
      {poster && <div className="thumb"><img src={poster} alt={`${e.title} poster`} loading="lazy" /></div>}
      <span className={`cat ${e.category}`} />
      <div className="row"><Status event={e} />{e.spotRegistration && <span className="badge spot">Spot registration</span>}{e.feeAmount === 0 && <span className="badge free">Free</span>}</div>
      <h3>{e.title}</h3>
      {e.tagline && <div className="tag">{e.tagline}</div>}
      <div className="meta">
        <div><b>{whenText(e)}</b></div>
        <div>{e.venue}</div>
        <div>{e.feeAmount === 0 ? 'Free entry' : feeLabel(e)}{e.prizePool ? ` · Prize ${e.prizePool}` : ''}</div>
      </div>
    </Link>
    </Reveal>
  );
}
