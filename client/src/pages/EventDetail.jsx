import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useStore } from '../lib/store.jsx';
import { api } from '../lib/api.js';
import { statusAt, whenText } from '../lib/time.js';
import { Status } from '../components/EventCard.jsx';
import RegisterModal from '../components/RegisterModal.jsx';
import TicketModal from '../components/TicketModal.jsx';
import Lightbox from '../components/Lightbox.jsx';
import { posterFor } from '../lib/media.js';

const BACK = { workshop: '/workshops', competition: '/competitions', event: '/events' };

export default function EventDetail() {
  const { slug } = useParams();
  const { events, now, user, demo, refresh } = useStore();
  const nav = useNavigate();
  const e = events.find((x) => x.slug === slug);
  const [mine, setMine] = useState(null);
  const [open, setOpen] = useState(false), [ticket, setTicket] = useState(false), [zoom, setZoom] = useState(false);

  const load = () => { if (user && e && !demo) api('/registrations/mine').then((r) => setMine(r.find((g) => g.event._id === e._id) || null)).catch(() => {}); };
  useEffect(load, [user, e?._id, demo]); // eslint-disable-line

  if (!e) return <div className="empty">That event could not be found. <Link to="/" className="sun">Back to home</Link></div>;
  const st = statusAt(e, now); const poster = posterFor(e);
  const left = e.capacity ? Math.max(e.capacity - (e.registrationCount || 0), 0) : null;
  const F = ({ k, v }) => v ? <div><span>{k}</span><b>{v}</b></div> : null;

  let action;
  if (mine) action = <button className="btn primary" onClick={() => setTicket(true)}>View my ticket</button>;
  else if (st === 'past') action = <div className="empty">This event has finished.</div>;
  else if (!e.registrationOpen) action = <div className="empty">Registration is closed for this event.</div>;
  else if (left === 0) action = <div className="empty">This event is full.</div>;
  else if (!user) action = <button className="btn primary" onClick={() => nav(`/profile?next=/event/${e.slug}`)}>Log in to register</button>;
  else action = <button className="btn primary" onClick={() => setOpen(true)}>Register now</button>;

  return (
    <>
      <Link to={BACK[e.category]} className="back">‹ Back</Link>
      <div className="detail">
        <div className="detail-content">
          <div className="detail-intro">
            <div className="row" style={{ marginBottom: 10 }}><Status event={e} /><span className="badge upcoming" style={{ textTransform: 'capitalize' }}>{e.category}</span>{e.spotRegistration && <span className="badge spot">Spot registration</span>}</div>
            <h1 style={{ fontSize: 'clamp(1.7rem,5vw,2.8rem)' }}>{e.title}</h1>
            {e.tagline && <p className="sun" style={{ marginTop: 8, fontStyle: 'italic' }}>{e.tagline}</p>}
          </div>
          <div className="detail-info">
            <div className="detail-description">
              <p style={{ marginTop: 16 }}>{e.description}</p>
              {e.timeNote && !/full|announced/i.test(e.timeNote) && <p className="mute" style={{ marginTop: 10 }}>{e.timeNote}</p>}
              {e.contacts?.length > 0 && (
                <div style={{ marginTop: 22 }}>
                  <h3 style={{ marginBottom: 8 }}>Questions? Call the organisers</h3>
                  <div className="chips">{e.contacts.map((c) => <a key={c.phone} className="chip" href={`tel:+91${c.phone.slice(-10)}`}>{c.name} · {c.phone}</a>)}</div>
                </div>
              )}
            </div>
            <div className="detail-facts facts">
              <F k="When" v={whenText(e)} /><F k="Venue" v={e.venue} /><F k="Fee" v={e.feeText?.replace(/ \| /g, ' · ')} /><F k="Prize pool" v={e.prizePool} />
              <F k="Activity points" v={e.activityPoints} /><F k="Team size" v={e.teamSize} /><F k="Speaker" v={e.speaker} /><F k="Organised by" v={e.organizer} />
              <F k="Register by" v={e.registrationDeadline} /><F k="Registered" v={`${e.registrationCount || 0}${e.capacity ? ` of ${e.capacity}` : ''}`} />
            </div>
          </div>
        </div>
        <div className="detail-poster">
          {poster ? <button className="poster" onClick={() => setZoom(true)} aria-label="View poster full size"><img src={poster} alt={`${e.title} poster`} /></button>
            : <div className="poster empty-poster"><b>Poster coming soon</b><span>Organisers can add one in the admin panel.</span></div>}
        </div>
        <aside className="detail-registration">
          {action}
          {e.spotRegistration && st !== 'past' && <div className="banner" style={{ margin: 0 }}>Walk-in spot registration is available at the venue.</div>}
          {e.formLink && <a className="mute" style={{ fontSize: '.85rem' }} href={e.formLink} target="_blank" rel="noreferrer">Organisers' original registration form</a>}
        </aside>
      </div>
      {zoom && <Lightbox items={[{ src: poster, caption: e.title }]} onClose={() => setZoom(false)} />}
      {open && <RegisterModal event={e} onClose={() => setOpen(false)} onDone={() => { load(); refresh(); }} />}
      {ticket && mine && <TicketModal reg={mine} onClose={() => setTicket(false)} />}
    </>
  );
}
