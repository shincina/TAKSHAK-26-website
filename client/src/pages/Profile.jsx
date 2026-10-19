import { useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useStore } from '../lib/store.jsx';
import { api } from '../lib/api.js';
import { statusAt, whenText } from '../lib/time.js';
import TicketModal from '../components/TicketModal.jsx';

function AuthForm() {
  const { auth, demo } = useStore();
  const nav = useNavigate(); const [sp] = useSearchParams();
  const [mode, setMode] = useState('login'), [f, setF] = useState({ name: '', email: '', password: '', phone: '', college: '' }), [err, setErr] = useState(''), [busy, setBusy] = useState(false);
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });
  const submit = async (ev) => {
    ev.preventDefault(); setErr(''); setBusy(true);
    try { await auth(mode, mode === 'login' ? { email: f.email, password: f.password } : f); const next = sp.get('next'); if (next) nav(next); }
    catch (x) { setErr(x.message); } finally { setBusy(false); }
  };
  return (
    <div style={{ maxWidth: 460, margin: '10px auto' }}>
      <h1 style={{ fontSize: 'clamp(1.8rem,5vw,2.6rem)', marginBottom: 6 }}>{mode === 'login' ? 'Log in' : 'Create your account'}</h1>
      <p className="mute" style={{ marginBottom: 18 }}>{mode === 'login' ? 'See your tickets and register for events.' : 'One account for every event. Your ticket lives here.'}</p>
      <form className="form" onSubmit={submit}>
        {mode === 'signup' && <label className="field">Full name<input className="input" required value={f.name} onChange={set('name')} autoComplete="name" /></label>}
        <label className="field">Email<input className="input" type="email" required value={f.email} onChange={set('email')} autoComplete="email" /></label>
        <label className="field">Password<input className="input" type="password" required minLength={6} value={f.password} onChange={set('password')} autoComplete={mode === 'login' ? 'current-password' : 'new-password'} /></label>
        {mode === 'signup' && <div className="two">
          <label className="field">Phone<input className="input" type="tel" value={f.phone} onChange={set('phone')} autoComplete="tel" /></label>
          <label className="field">College<input className="input" placeholder="Mar Athanasius College of Engineering" value={f.college} onChange={set('college')} /></label>
        </div>}
        {demo && <div className="err">The server is not connected, so sign-in is unavailable in this preview.</div>}
        {err && <div className="err" role="alert">{err}</div>}
        <button className="btn primary" disabled={busy || demo}>{busy ? 'Please wait…' : mode === 'login' ? 'Log in' : 'Sign up'}</button>
      </form>
      <button className="chip" style={{ marginTop: 14 }} onClick={() => { setMode(mode === 'login' ? 'signup' : 'login'); setErr(''); }}>
        {mode === 'login' ? 'New here? Create an account' : 'Have an account? Log in'}
      </button>
    </div>
  );
}

export default function Profile() {
  const { user, logout, now, ready } = useStore();
  const [regs, setRegs] = useState(null), [ticket, setTicket] = useState(null);
  const load = () => api('/registrations/mine').then(setRegs).catch(() => setRegs([]));
  useEffect(() => { if (user) load(); }, [user]); // eslint-disable-line
  if (!ready) return null;
  if (!user) return <AuthForm />;

  const groups = { live: [], upcoming: [], past: [] };
  (regs || []).forEach((r) => groups[statusAt(r.event, now)].push(r));
  const cancel = async (r) => { if (confirm(`Cancel your registration for ${r.event.title}?`)) { await api(`/registrations/${r._id}`, { method: 'DELETE' }).catch((e) => alert(e.message)); load(); } };
  const Group = ({ title, list }) => list.length ? (
    <section className="block" style={{ margin: '24px 0' }}><h2 style={{ marginBottom: 12, fontSize: '1.25rem' }}>{title}</h2>
      <div className="grid">{list.map((r) => {
        const status = statusAt(r.event, now);
        return (
          <article key={r._id} className={`ticket-card ${r.event.category || 'event'}${status === 'past' ? ' expired' : ''}`}>
            <aside className="ticket-card-rail ticket-card-number" aria-label={`Ticket ${r.ticketId}`}>{r.ticketId}</aside>
            <div className="ticket-card-main">
              <div className="ticket-card-heading">
                <span>TAKSHAK '26 · ADMIT ONE</span>
                <div className="ticket-card-head">
                  <span className={`badge ${status}`}>{status === 'live' ? 'Live now' : status === 'upcoming' ? 'Upcoming' : 'Finished'}</span>
                  {r.status === 'checked_in' && <span className="badge ok">Checked in</span>}
                </div>
              </div>
              <Link className="ticket-card-title" to={`/event/${r.event.slug}`}><h3>{r.event.title}</h3></Link>
              <div className="ticket-card-details">
                <b>{whenText(r.event)}</b>
                <b>{r.event.venue}</b>
              </div>
              <div className="ticket-card-id">No. {r.ticketId}</div>
              <div className="ticket-card-actions">
                <button className="ticket-open" onClick={() => setTicket(r)}>Show ticket <span aria-hidden="true">→</span></button>
                {status === 'upcoming' && r.status !== 'checked_in' && <button className="btn danger small" onClick={() => cancel(r)}>Cancel</button>}
              </div>
            </div>
            <aside className="ticket-card-rail ticket-card-admit" aria-hidden="true">TAKSHAK '26</aside>
          </article>
        );
      })}</div></section>) : null;

  return (
    <>
      <div className="sec-head"><div><h1 style={{ fontSize: 'clamp(1.8rem,5vw,2.6rem)' }}>{user.name}</h1><div className="mute">{user.email}{user.college ? ` · ${user.college}` : ''}</div></div>
        <div className="row">{user.role === 'admin' && <Link className="btn primary small" to="/admin">Admin panel</Link>}<button className="btn ghost small" onClick={logout}>Log out</button></div></div>
      <h2 style={{ margin: '20px 0 4px' }}>My tickets</h2>
      {regs === null ? <p className="mute">Loading…</p> : regs.length === 0 ? <div className="empty" style={{ marginTop: 12 }}>You have not registered for anything yet. <Link className="sun" to="/competitions">Browse competitions</Link> or <Link className="sun" to="/workshops">workshops</Link>.</div> : null}
      <Group title="Happening now" list={groups.live} /><Group title="Upcoming" list={groups.upcoming} /><Group title="Past" list={groups.past} />
      {ticket && <TicketModal reg={ticket} onClose={() => setTicket(null)} />}
    </>
  );
}
