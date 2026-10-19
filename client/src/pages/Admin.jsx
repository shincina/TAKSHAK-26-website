import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useStore } from '../lib/store.jsx';
import { api, getToken } from '../lib/api.js';
import CampusMap from '../components/CampusMap.jsx';
import { dayKey, sessionsOf, fmtTime } from '../lib/time.js';

const TABS = ['Overview', 'Events', 'Participants', 'Spot desk', 'Check-in', 'Map pins'];
const toLocal = (iso) => ({ date: dayKey(iso), start: fmtTime24(iso) });
const fmtTime24 = (iso) => new Date(iso).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Kolkata' });
const eventDate = (event) => event.sessions?.[0]?.start ? dayKey(event.sessions[0].start) : '—';

function Field({ label, children }) { return <label className="field">{label}{children}</label>; }

function EventForm({ initial, venues, onSave, onClose }) {
  const blank = { title: '', category: 'competition', organizer: '', tagline: '', description: '', poster: '', venue: '', online: false, feeText: '', feeAmount: '', prizePool: '', activityPoints: '', teamMin: '', teamMax: '', capacity: '', speaker: '', registrationDeadline: '', spotRegistration: false, registrationOpen: true, formLink: '', c1n: '', c1p: '', c2n: '', c2p: '' };
  const [f, setF] = useState(() => {
    if (!initial) return { ...blank, sessions: [{ date: '2026-09-25', start: '10:00', end: '12:00' }] };
    const c = initial.contacts || [];
    return { ...blank, ...initial, feeAmount: initial.feeAmount ?? '', teamMin: initial.teamMin ?? '', teamMax: initial.teamMax ?? '', capacity: initial.capacity ?? '', c1n: c[0]?.name || '', c1p: c[0]?.phone || '', c2n: c[1]?.name || '', c2p: c[1]?.phone || '',
      sessions: sessionsOf(initial).map((s) => ({ date: dayKey(s.start), start: fmtTime24(s.start), end: fmtTime24(s.end) })) };
  });
  const [err, setErr] = useState('');
  const set = (k) => (e) => setF({ ...f, [k]: e.target.type === 'checkbox' ? e.target.checked : e.target.value });
  const num = (v) => (v === '' || v === null ? undefined : Number(v));
  const setS = (i, k, v) => setF({ ...f, sessions: f.sessions.map((s, j) => (j === i ? { ...s, [k]: v } : s)) });
  const save = async (ev) => {
    ev.preventDefault(); setErr('');
    const body = { ...f, feeAmount: num(f.feeAmount), teamMin: num(f.teamMin), teamMax: num(f.teamMax), capacity: num(f.capacity),
      sessions: f.sessions.map((s) => ({ start: `${s.date}T${s.start}:00+05:30`, end: `${s.date}T${s.end}:00+05:30` })),
      contacts: [{ name: f.c1n, phone: f.c1p }, { name: f.c2n, phone: f.c2p }].filter((c) => c.name && c.phone) };
    ['c1n', 'c1p', 'c2n', 'c2p', 'registrationCount', '_id', '__v', 'createdAt', 'updatedAt'].forEach((k) => delete body[k]);
    try { await (initial ? api(`/events/${initial._id}`, { method: 'PUT', body }) : api('/events', { method: 'POST', body })); onSave(); } catch (x) { setErr(x.message); }
  };
  return (
    <div className="overlay" data-lenis-prevent onClick={onClose}>
      <form className="modal wide form" onClick={(e) => e.stopPropagation()} onSubmit={save}>
        <button type="button" className="x" onClick={onClose} aria-label="Close">×</button>
        <h2>{initial ? 'Edit event' : 'Add event'}</h2>
        <div className="two"><Field label="Title"><input className="input" required value={f.title} onChange={set('title')} /></Field>
          <Field label="Type"><select className="input" value={f.category} onChange={set('category')}><option value="workshop">Workshop</option><option value="competition">Competition</option><option value="event">Event (talk, show, music, dance)</option></select></Field></div>
        <Field label="Tagline"><input className="input" value={f.tagline || ''} onChange={set('tagline')} /></Field>
        <Field label="Poster link (optional, or put a file in src/assets/posters)"><input className="input" type="url" placeholder="https://…" value={f.poster || ''} onChange={set('poster')} /></Field>
        <Field label="Description"><textarea className="input" rows="3" value={f.description || ''} onChange={set('description')} /></Field>
        <div className="two"><Field label="Organised by"><input className="input" value={f.organizer || ''} onChange={set('organizer')} /></Field>
          <Field label="Speaker"><input className="input" value={f.speaker || ''} onChange={set('speaker')} /></Field></div>
        <div><div className="mute" style={{ fontSize: '.88rem', marginBottom: 6 }}>Schedule (add a row for each day or stage, times in IST)</div>
          {f.sessions.map((s, i) => (<div key={i} className="two" style={{ marginBottom: 8, alignItems: 'end' }}>
            <input className="input" type="date" required value={s.date} onChange={(e) => setS(i, 'date', e.target.value)} aria-label="Date" />
            <input className="input" type="time" required value={s.start} onChange={(e) => setS(i, 'start', e.target.value)} aria-label="Start" />
            <input className="input" type="time" required value={s.end} onChange={(e) => setS(i, 'end', e.target.value)} aria-label="End" />
            {f.sessions.length > 1 && <button type="button" className="btn danger small" onClick={() => setF({ ...f, sessions: f.sessions.filter((_, j) => j !== i) })}>Remove</button>}</div>))}
          <button type="button" className="btn ghost small" onClick={() => setF({ ...f, sessions: [...f.sessions, { ...f.sessions.at(-1) }] })}>Add day or stage</button></div>
        <div className="two"><Field label="Venue (pick a map venue, or type 'Online')"><input className="input" list="venues" required value={f.venue || ''} onChange={set('venue')} /><datalist id="venues">{venues.map((v) => <option key={v.key} value={v.label} />)}<option value="Online" /></datalist></Field>
          <Field label="Fee text (e.g. ₹100 / team)"><input className="input" value={f.feeText || ''} onChange={set('feeText')} /></Field>
          <Field label="Fee amount (0 = free)"><input className="input" type="number" min="0" value={f.feeAmount} onChange={set('feeAmount')} /></Field></div>
        <div className="two"><Field label="Prize pool"><input className="input" value={f.prizePool || ''} onChange={set('prizePool')} /></Field>
          <Field label="Activity points"><input className="input" value={f.activityPoints || ''} onChange={set('activityPoints')} /></Field>
          <Field label="Seats / team slots"><input className="input" type="number" min="1" value={f.capacity} onChange={set('capacity')} /></Field></div>
        <div className="two"><Field label="Min team size"><input className="input" type="number" min="1" value={f.teamMin} onChange={set('teamMin')} /></Field>
          <Field label="Max team size"><input className="input" type="number" min="1" value={f.teamMax} onChange={set('teamMax')} /></Field>
          <Field label="Register by"><input className="input" value={f.registrationDeadline || ''} onChange={set('registrationDeadline')} /></Field></div>
        <div className="two"><Field label="Contact 1 name"><input className="input" value={f.c1n} onChange={set('c1n')} /></Field><Field label="Contact 1 phone"><input className="input" value={f.c1p} onChange={set('c1p')} /></Field>
          <Field label="Contact 2 name"><input className="input" value={f.c2n} onChange={set('c2n')} /></Field><Field label="Contact 2 phone"><input className="input" value={f.c2p} onChange={set('c2p')} /></Field></div>
        <div className="row"><label className="chip"><input type="checkbox" checked={!!f.spotRegistration} onChange={set('spotRegistration')} /> Spot registration</label>
          <label className="chip"><input type="checkbox" checked={!!f.registrationOpen} onChange={set('registrationOpen')} /> Registration open</label>
          <label className="chip"><input type="checkbox" checked={!!f.online} onChange={set('online')} /> Online</label></div>
        {err && <div className="err">{err}</div>}
        <button className="btn primary">Save event</button>
      </form>
    </div>
  );
}

function Participants({ events, preset }) {
  const [id, setId] = useState(preset || events[0]?._id), [rows, setRows] = useState([]), [q, setQ] = useState('');
  const load = () => id && api(`/admin/events/${id}/participants`).then(setRows).catch(() => setRows([]));
  useEffect(() => { load(); }, [id]); // eslint-disable-line
  const patch = async (r, body) => { await api(`/admin/registrations/${r._id}`, { method: 'PATCH', body }); load(); };
  const csv = async () => {
    const res = await api(`/admin/events/${id}/participants.csv`, { raw: true }); const url = URL.createObjectURL(await res.blob());
    Object.assign(document.createElement('a'), { href: url, download: 'participants.csv' }).click(); URL.revokeObjectURL(url);
  };
  const shown = rows.filter((r) => `${r.participant?.name} ${r.participant?.email} ${r.ticketId} ${r.teamName}`.toLowerCase().includes(q.toLowerCase()));
  return (<>
    <div className="filters"><select className="input" value={id} onChange={(e) => setId(e.target.value)}>{events.map((e) => <option key={e._id} value={e._id}>{e.title}</option>)}</select>
      <input className="input" placeholder="Search name, email or ticket" value={q} onChange={(e) => setQ(e.target.value)} /><button className="btn ghost small" onClick={csv}>Download CSV</button></div>
    <div className="mute" style={{ marginBottom: 8 }}>{rows.filter((r) => r.status !== 'cancelled').length} registered · {rows.filter((r) => r.status === 'checked_in').length} checked in</div>
    {shown.length ? <div className="tablewrap"><table><thead><tr><th>Ticket</th><th>Name</th><th>Contact</th><th>Team</th><th>Payment</th><th>Status</th><th /></tr></thead><tbody>
      {shown.map((r) => (<tr key={r._id}><td>{r.ticketId}{r.spot ? ' · spot' : ''}</td><td>{r.participant?.name}<div className="mute">{r.participant?.college}</div></td><td>{r.participant?.phone}<div className="mute">{r.participant?.email}</div></td>
        <td>{r.teamName ? `${r.teamName} (${[r.participant?.name, ...(r.members || []).map((m) => m.name)].join(', ')})` : '-'}</td>
        <td><span className={`badge ${r.paymentStatus === 'pending' ? 'warn' : 'ok'}`}>{r.paymentStatus}</span></td><td>{r.status.replace('_', ' ')}</td>
        <td className="row">{r.paymentStatus === 'pending' && <button className="btn ghost small" onClick={() => patch(r, { paymentStatus: 'paid' })}>Mark paid</button>}
          {r.status === 'registered' && <button className="btn primary small" onClick={() => patch(r, { status: 'checked_in' })}>Check in</button>}
          {r.status !== 'cancelled' && <button className="btn danger small" onClick={() => patch(r, { status: 'cancelled' })}>Cancel</button>}</td></tr>))}</tbody></table></div>
      : <div className="empty">No participants yet.</div>}
  </>);
}

function SpotDesk({ events }) {
  const spotEvents = events.filter((e) => e.spotRegistration);
  const [id, setId] = useState(spotEvents[0]?._id), [f, setF] = useState({ name: '', phone: '', email: '', college: '', teamName: '', members: '', paid: true }), [msg, setMsg] = useState(null);
  const ev = events.find((e) => e._id === id);
  const set = (k) => (e) => setF({ ...f, [k]: e.target.type === 'checkbox' ? e.target.checked : e.target.value });
  const go = async (e) => {
    e.preventDefault(); setMsg(null);
    try { const r = await api(`/admin/events/${id}/spot`, { method: 'POST', body: { ...f, members: f.members.split(',').map((n) => ({ name: n.trim() })).filter((m) => m.name) } }); setMsg({ ok: `Registered. Ticket ${r.ticketId}` }); setF({ ...f, name: '', phone: '', email: '', teamName: '', members: '' }); }
    catch (x) { setMsg({ err: x.message }); }
  };
  return (<form className="form" style={{ maxWidth: 520 }} onSubmit={go}>
    <Field label="Event (only events with spot registration)"><select className="input" value={id} onChange={(e) => setId(e.target.value)}>{spotEvents.map((e) => <option key={e._id} value={e._id}>{e.title}</option>)}</select></Field>
    <div className="two"><Field label="Name"><input className="input" required value={f.name} onChange={set('name')} /></Field><Field label="Phone"><input className="input" value={f.phone} onChange={set('phone')} /></Field>
      <Field label="Email (optional)"><input className="input" type="email" value={f.email} onChange={set('email')} /></Field><Field label="College"><input className="input" value={f.college} onChange={set('college')} /></Field></div>
    {ev?.teamMax > 1 && <><Field label="Team name"><input className="input" value={f.teamName} onChange={set('teamName')} /></Field><Field label="Other team members (comma separated)"><input className="input" value={f.members} onChange={set('members')} /></Field></>}
    <label className="chip" style={{ width: 'fit-content' }}><input type="checkbox" checked={f.paid} onChange={set('paid')} /> Fee collected at the desk</label>
    {msg?.ok && <div className="okmsg">{msg.ok}</div>}{msg?.err && <div className="err">{msg.err}</div>}
    <button className="btn primary">Register participant</button></form>);
}

function CheckIn() {
  const [t, setT] = useState(''), [r, setR] = useState(null);
  const go = async (e) => { e.preventDefault(); try { setR(await api('/admin/checkin', { method: 'POST', body: { ticketId: t } })); } catch (x) { setR({ err: x.message }); } setT(''); };
  return (<div style={{ maxWidth: 480 }}><form className="form" onSubmit={go}><Field label="Ticket ID (type it or scan with a QR scanner app)"><input className="input" autoFocus placeholder="TKS26-XXXXXX" value={t} onChange={(e) => setT(e.target.value)} /></Field><button className="btn primary">Check in</button></form>
    {r?.err && <div className="err" style={{ marginTop: 12 }}>{r.err}</div>}
    {r?.registration && <div className="card" style={{ marginTop: 14 }}><span className="badge ok">{r.already ? 'Already checked in' : 'Checked in'}</span><h3>{r.registration.participant?.name}</h3><div className="mute">{r.registration.event?.title} · payment {r.registration.paymentStatus}</div></div>}</div>);
}

function MapPins({ events }) {
  const { venues, refresh } = useStore();
  const [key, setKey] = useState(venues[0]?.key), [msg, setMsg] = useState('');
  const place = async (lat, lng) => { try { await api(`/events/venues/${key}`, { method: 'PUT', body: { lat, lng } }); setMsg(`Moved ${venues.find((v) => v.key === key)?.label}.`); refresh(); } catch (e) { setMsg(e.message); } };
  return (<><p className="mute" style={{ marginBottom: 10 }}>Pick a venue, then click its exact spot on the real map to move the pin. Switch to Satellite to see the buildings. Zoom in for accuracy; changes save instantly.</p>
    <select className="input" style={{ maxWidth: 320, marginBottom: 10 }} value={key} onChange={(e) => setKey(e.target.value)}>{venues.map((v) => <option key={v.key} value={v.key}>{v.label}</option>)}</select>
    {msg && <div className="okmsg" style={{ marginBottom: 8 }}>{msg}</div>}
    <CampusMap venues={venues} events={events} now={new Date()} selected={key} onSelect={setKey} onPlace={place} /></>);
}

export default function Admin() {
  const { user, events, venues, refresh, ready, demo } = useStore();
  const [tab, setTab] = useState('Overview'), [stats, setStats] = useState(null), [edit, setEdit] = useState(undefined), [pe, setPe] = useState(null);
  useEffect(() => { if (user?.role === 'admin' && !demo) api('/admin/stats').then(setStats).catch(() => {}); }, [user, tab, events, demo]);
  const sorted = useMemo(() => [...events].sort((a, b) => a.title.localeCompare(b.title)), [events]);
  if (!ready) return null;
  if (user?.role !== 'admin') return <div className="empty">This area is for TAKSHAK admins. <Link className="sun" to="/profile">Log in</Link></div>;
  const del = async (e) => { if (confirm(`Delete "${e.title}" and all its registrations?`)) { await api(`/events/${e._id}`, { method: 'DELETE' }); refresh(); } };
  return (<>
    <h1 style={{ fontSize: 'clamp(1.8rem,5vw,2.6rem)', marginBottom: 14 }}>Admin panel</h1>
    <div className="tabs">{TABS.map((t) => <button key={t} className={`chip ${tab === t ? 'on' : ''}`} onClick={() => setTab(t)}>{t}</button>)}</div>
    {tab === 'Overview' && (stats ? <><div className="stats"><div className="stat"><b>{stats.events}</b>events</div><div className="stat"><b>{stats.registrations}</b>registrations</div><div className="stat"><b>{stats.students}</b>student accounts</div><div className="stat"><b>{stats.checkedIn}</b>checked in</div><div className="stat"><b>{stats.spot}</b>spot sign-ups</div></div>
      <h2 style={{ margin: '24px 0 10px', fontSize: '1.2rem' }}>Most registered events</h2>{stats.top.length ? <div className="tablewrap"><table><tbody>{stats.top.map((t) => <tr key={t.title}><td>{t.title}</td><td>{t.n}</td></tr>)}</tbody></table></div> : <div className="empty">No registrations yet.</div>}</> : <div className="empty">{demo ? 'Connect the server to see stats.' : 'Loading…'}</div>)}
    {tab === 'Events' && <><button className="btn primary" style={{ marginBottom: 14 }} onClick={() => setEdit(null)}>Add event</button>
      <div className="tablewrap"><table><thead><tr><th>Event</th><th>Type</th><th>Date</th><th>Venue</th><th>Registered</th><th /></tr></thead><tbody>{sorted.map((e) => <tr key={e._id}><td>{e.title}</td><td>{e.category}</td><td>{eventDate(e)}</td><td>{e.venue}</td><td>{e.registrationCount}{e.capacity ? ` / ${e.capacity}` : ''}</td>
        <td className="row"><button className="btn ghost small" onClick={() => setEdit(e)}>Edit</button><button className="btn ghost small" onClick={() => { setPe(e._id); setTab('Participants'); }}>Participants</button><button className="btn danger small" onClick={() => del(e)}>Delete</button></td></tr>)}</tbody></table></div></>}
    {tab === 'Participants' && <Participants key={pe} events={sorted} preset={pe} />}
    {tab === 'Spot desk' && <SpotDesk events={sorted} />}
    {tab === 'Check-in' && <CheckIn />}
    {tab === 'Map pins' && <MapPins events={events} />}
    {edit !== undefined && <EventForm initial={edit} venues={venues} onClose={() => setEdit(undefined)} onSave={() => { setEdit(undefined); refresh(); }} />}
  </>);
}
