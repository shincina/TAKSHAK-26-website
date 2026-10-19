import { Router } from 'express';
import crypto from 'crypto';
import { Event, Registration } from '../models/index.js';
import { requireAuth, requireAdmin } from '../middleware/auth.js';

const r = Router();
const ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
const lastEnd = (e) => Math.max(...e.sessions.map((s) => +new Date(s.end)));
const firstStart = (e) => Math.min(...e.sessions.map((s) => +new Date(s.start)));

async function newTicketId() {
  for (let i = 0; i < 10; i++) {
    const id = 'TKS26-' + Array.from(crypto.randomBytes(6), (b) => ALPHABET[b % ALPHABET.length]).join('');
    if (!(await Registration.exists({ ticketId: id }))) return id;
  }
  throw new Error('Could not generate a ticket id');
}

// Shared checks for student sign-up and admin spot sign-up
async function createRegistration({ event, user, participant, teamName, members, spot, bypassOpen, previewNow }) {
  if (!bypassOpen && !event.registrationOpen) throw Object.assign(new Error('Registration is closed for this event.'), { status: 400 });
  const registrationTime = Number.isFinite(Number(previewNow)) ? Number(previewNow) : Date.now();
  if (registrationTime > lastEnd(event)) throw Object.assign(new Error('This event has already ended.'), { status: 400 });
  if (event.capacity) {
    const taken = await Registration.countDocuments({ event: event._id, status: { $ne: 'cancelled' } });
    if (taken >= event.capacity) throw Object.assign(new Error('This event is full.'), { status: 409 });
  }
  const cleanMembers = (members || []).map((m) => ({ name: String(m.name || '').trim() })).filter((m) => m.name);
  if (event.teamMax > 1 && cleanMembers.length + 1 > event.teamMax)
    throw Object.assign(new Error(`Teams can have at most ${event.teamMax} members including you.`), { status: 400 });
  if (event.teamMin > 1 && cleanMembers.length + 1 < event.teamMin)
    throw Object.assign(new Error(`Teams need at least ${event.teamMin} members including you.`), { status: 400 });
  return Registration.create({
    ticketId: await newTicketId(), event: event._id, user, participant, spot: !!spot,
    teamName: event.teamMax > 1 ? teamName : undefined, members: cleanMembers,
    paymentStatus: event.feeAmount === 0 ? 'free' : 'pending',
  });
}

const fail = (res) => (e) => res.status(e.status || (e.code === 11000 ? 409 : 500))
  .json({ error: e.code === 11000 ? 'You are already registered for this event.' : e.message });

r.post('/events/:id/register', requireAuth, async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) return res.status(404).json({ error: 'Event not found.' });
    const u = req.user;
    const reg = await createRegistration({
      event, user: u._id, participant: { name: u.name, email: u.email, phone: u.phone, college: u.college },
      teamName: req.body.teamName, members: req.body.members, previewNow: req.body.previewNow,
    });
    res.status(201).json(await reg.populate('event'));
  } catch (e) { fail(res)(e); }
});

r.get('/registrations/mine', requireAuth, async (req, res) => {
  res.json(await Registration.find({ user: req.user._id, status: { $ne: 'cancelled' } }).populate('event').sort('-createdAt'));
});

r.delete('/registrations/:id', requireAuth, async (req, res) => {
  const reg = await Registration.findOne({ _id: req.params.id, user: req.user._id }).populate('event');
  if (!reg) return res.status(404).json({ error: 'Registration not found.' });
  if (Date.now() >= firstStart(reg.event)) return res.status(400).json({ error: 'You cannot cancel after the event has started.' });
  reg.status = 'cancelled';
  await reg.save();
  res.json({ ok: true });
});

/* ---------------- admin ---------------- */
const admin = [requireAuth, requireAdmin];

r.get('/admin/stats', ...admin, async (_req, res) => {
  const [events, registrations, students, checkedIn, spot] = await Promise.all([
    Event.countDocuments(), Registration.countDocuments({ status: { $ne: 'cancelled' } }),
    (await import('../models/index.js')).User.countDocuments({ role: 'student' }),
    Registration.countDocuments({ status: 'checked_in' }), Registration.countDocuments({ spot: true, status: { $ne: 'cancelled' } }),
  ]);
  const perEvent = await Registration.aggregate([
    { $match: { status: { $ne: 'cancelled' } } }, { $group: { _id: '$event', n: { $sum: 1 } } }, { $sort: { n: -1 } }, { $limit: 8 },
    { $lookup: { from: 'events', localField: '_id', foreignField: '_id', as: 'e' } }, { $unwind: '$e' },
    { $project: { _id: 0, title: '$e.title', n: 1 } },
  ]);
  res.json({ events, registrations, students, checkedIn, spot, top: perEvent });
});

r.get('/admin/events/:id/participants', ...admin, async (req, res) => {
  res.json(await Registration.find({ event: req.params.id }).sort('-createdAt'));
});

r.get('/admin/events/:id/participants.csv', ...admin, async (req, res) => {
  const event = await Event.findById(req.params.id);
  const regs = await Registration.find({ event: req.params.id, status: { $ne: 'cancelled' } }).sort('createdAt');
  const q = (v) => `"${String(v ?? '').replace(/"/g, '""')}"`;
  const rows = [['Ticket', 'Name', 'Email', 'Phone', 'College', 'Team', 'Members', 'Spot', 'Payment', 'Status']].concat(
    regs.map((g) => [g.ticketId, g.participant?.name, g.participant?.email, g.participant?.phone, g.participant?.college,
      g.teamName, g.members.map((m) => m.name).join('; '), g.spot ? 'yes' : 'no', g.paymentStatus, g.status]));
  res.set('Content-Type', 'text/csv');
  res.set('Content-Disposition', `attachment; filename="${event?.slug || 'event'}-participants.csv"`);
  res.send(rows.map((row) => row.map(q).join(',')).join('\n'));
});

r.patch('/admin/registrations/:id', ...admin, async (req, res) => {
  const { status, paymentStatus } = req.body;
  const reg = await Registration.findById(req.params.id);
  if (!reg) return res.status(404).json({ error: 'Registration not found.' });
  if (status) { reg.status = status; reg.checkedInAt = status === 'checked_in' ? new Date() : undefined; }
  if (paymentStatus) reg.paymentStatus = paymentStatus;
  await reg.save();
  res.json(reg);
});

r.post('/admin/checkin', ...admin, async (req, res) => {
  const reg = await Registration.findOne({ ticketId: String(req.body.ticketId || '').trim().toUpperCase() }).populate('event', 'title');
  if (!reg) return res.status(404).json({ error: 'No ticket found with that id.' });
  if (reg.status === 'cancelled') return res.status(400).json({ error: 'This ticket was cancelled.' });
  const already = reg.status === 'checked_in';
  reg.status = 'checked_in';
  reg.checkedInAt = reg.checkedInAt || new Date();
  await reg.save();
  res.json({ already, registration: reg });
});

r.post('/admin/events/:id/spot', ...admin, async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) return res.status(404).json({ error: 'Event not found.' });
    const { name, email, phone, college, teamName, members } = req.body;
    if (!name) return res.status(400).json({ error: 'Participant name is required.' });
    const reg = await createRegistration({ event, participant: { name, email, phone, college }, teamName, members, spot: true, bypassOpen: true });
    if (req.body.paid) { reg.paymentStatus = 'paid'; await reg.save(); }
    res.status(201).json(reg);
  } catch (e) { fail(res)(e); }
});

export default r;

