import { QRCodeSVG } from 'qrcode.react';
import { sessionsOf, fmtDay, fmtTime, whenText } from '../lib/time.js';

export default function TicketModal({ reg, onClose }) {
  const e = reg.event, p = reg.participant || {};
  const first = sessionsOf(e)[0];
  return (
    <div className="overlay" data-lenis-prevent onClick={onClose}>
      <div className="modal" onClick={(ev) => ev.stopPropagation()} style={{ padding: 14, background: 'transparent', border: 0 }}>
        <div className="ticket">
          <button className="x" onClick={onClose} aria-label="Close ticket">×</button>
          <aside className="ticket-modal-rail ticket-modal-number" aria-label={`Ticket ${reg.ticketId}`}>{reg.ticketId}</aside>
          <div className="ticket-main">
            <div className="ticket-kicker">TAKSHAK '26 · ADMIT ONE</div>
            <div className="mute ticket-college">Mar Athanasius College of Engineering</div>
            <h2 style={{ margin: '6px 0 4px' }}>{e.title}</h2>
            <div className="ticket-event-details"><span>{whenText(e)}</span><span>{e.venue}</span></div>
            <div className="ticket-tear" />
            <div className="two ticket-participant-details">
              <div><div className="mute" style={{ fontSize: '.78rem' }}>Participant</div><b>{p.name}</b></div>
              <div><div className="mute" style={{ fontSize: '.78rem' }}>Entry</div><b>{reg.status === 'checked_in' ? 'Checked in' : 'Not checked in'}</b></div>
              {reg.teamName && <div><div className="mute" style={{ fontSize: '.78rem' }}>Team</div><b>{reg.teamName}</b></div>}
              <div><div className="mute" style={{ fontSize: '.78rem' }}>Payment</div><b>{reg.paymentStatus === 'paid' ? 'Paid' : reg.paymentStatus === 'free' ? 'Free event' : 'Pay at the desk'}</b></div>
            </div>
            {reg.members?.length > 0 && <div className="mute ticket-members">With {reg.members.map((m) => m.name).join(', ')}</div>}
            <div className="qr"><QRCodeSVG value={reg.ticketId} size={150} /></div>
            <div className="tid">{reg.ticketId}</div>
            <p className="mute ticket-instructions">Show this ticket at the venue. The organisers scan or type the ticket ID to check you in.</p>
          </div>
          <aside className="ticket-modal-rail ticket-modal-admit" aria-hidden="true">TAKSHAK '26</aside>
        </div>
      </div>
    </div>
  );
}
