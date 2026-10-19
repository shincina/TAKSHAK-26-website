import { useState } from 'react';
import { api } from '../lib/api.js';
import { useStore } from '../lib/store.jsx';
import TicketModal from './TicketModal.jsx';

export default function RegisterModal({ event: e, onClose, onDone }) {
  const { user, demo, now } = useStore();
  const max = e.teamMax || 1, min = e.teamMin || 1;
  const [teamName, setTeamName] = useState('');
  const [members, setMembers] = useState(Array.from({ length: Math.max(min - 1, 0) }, () => ({ name: '' })));
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);
  const [reg, setReg] = useState(null);
  if (reg) return <TicketModal reg={reg} onClose={() => { onDone?.(); onClose(); }} />;

  const submit = async (ev) => {
    ev.preventDefault(); setErr(''); setBusy(true);
    try { setReg(await api(`/events/${e._id}/register`, { method: 'POST', body: { teamName, members, previewNow: now.getTime() } })); }
    catch (x) { setErr(x.message); } finally { setBusy(false); }
  };
  return (
    <div className="overlay" data-lenis-prevent onClick={onClose}>
      <form className="modal form" onClick={(ev) => ev.stopPropagation()} onSubmit={submit}>
        <button type="button" className="x" onClick={onClose} aria-label="Close">×</button>
        <h2>Register for {e.title}</h2>
        <div className="mute">Registering as <b style={{ color: 'var(--ice)' }}>{user.name}</b> ({user.email})</div>
        {max > 1 && (
          <>
            <label className="field">Team name<input className="input" required value={teamName} onChange={(x) => setTeamName(x.target.value)} /></label>
            <div className="mute" style={{ fontSize: '.85rem' }}>{min === max ? `Teams have ${max} members.` : `Teams have ${min} to ${max} members.`} You count as one, so add {min > 1 ? `${min - 1} to ` : 'up to '}{max - 1} teammate{max - 1 > 1 ? 's' : ''}.</div>
            {members.map((m, i) => (
              <label className="field" key={i}>Teammate {i + 1}
                <input className="input" required={i < min - 1} value={m.name} onChange={(x) => setMembers(members.map((y, j) => (j === i ? { name: x.target.value } : y)))} />
              </label>
            ))}
            {members.length < max - 1 && <button type="button" className="btn ghost small" onClick={() => setMembers([...members, { name: '' }])}>Add a teammate</button>}
          </>
        )}
        {e.feeAmount !== 0 && e.feeText && <div className="banner">Fee: {e.feeText}. The organisers collect the fee; your ticket shows whether it has been marked paid.</div>}
        {demo && <div className="err">The server is not connected, so registration is unavailable in this preview.</div>}
        {err && <div className="err" role="alert">{err}</div>}
        <button className="btn primary" disabled={busy || demo}>{busy ? 'Registering…' : 'Register and get ticket'}</button>
      </form>
    </div>
  );
}

