import { Router } from 'express';
import mongoose from 'mongoose';
import { Event, Registration, Venue } from '../models/index.js';
import { requireAuth, requireAdmin } from '../middleware/auth.js';

const r = Router();
const slugify = (s) => s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
const find = (idOrSlug) => mongoose.isValidObjectId(idOrSlug) ? Event.findById(idOrSlug) : Event.findOne({ slug: idOrSlug });

async function withCounts(events) {
  const counts = await Registration.aggregate([
    { $match: { status: { $ne: 'cancelled' } } },
    { $group: { _id: '$event', n: { $sum: 1 } } },
  ]);
  const map = new Map(counts.map((c) => [String(c._id), c.n]));
  return events.map((e) => ({ ...e.toObject(), registrationCount: map.get(String(e._id)) || 0 }));
}

r.get('/venues', async (_req, res) => res.json(await Venue.find().sort('block label')));

r.put('/venues/:key', requireAuth, requireAdmin, async (req, res) => {
  const { lat, lng } = req.body;
  if (typeof lat !== 'number' || typeof lng !== 'number') return res.status(400).json({ error: 'lat and lng are required.' });
  const v = await Venue.findOneAndUpdate({ key: req.params.key }, { lat, lng }, { new: true });
  if (!v) return res.status(404).json({ error: 'Venue not found.' });
  res.json(v);
});

r.get('/', async (req, res) => {
  const q = req.query.category ? { category: req.query.category } : {};
  const events = await Event.find(q).sort('sessions.0.start title');
  res.json(await withCounts(events));
});

r.get('/:id', async (req, res) => {
  const e = await find(req.params.id);
  if (!e) return res.status(404).json({ error: 'Event not found.' });
  res.json((await withCounts([e]))[0]);
});

r.post('/', requireAuth, requireAdmin, async (req, res) => {
  try {
    const body = { ...req.body, slug: slugify(req.body.title || '') };
    if (await Event.exists({ slug: body.slug })) body.slug += '-' + Date.now().toString(36).slice(-3);
    res.status(201).json(await Event.create(body));
  } catch (e) { res.status(400).json({ error: e.message }); }
});

r.put('/:id', requireAuth, requireAdmin, async (req, res) => {
  try {
    const { slug, _id, ...body } = req.body;
    const e = await Event.findByIdAndUpdate(req.params.id, body, { new: true, runValidators: true });
    if (!e) return res.status(404).json({ error: 'Event not found.' });
    res.json(e);
  } catch (e) { res.status(400).json({ error: e.message }); }
});

r.delete('/:id', requireAuth, requireAdmin, async (req, res) => {
  await Registration.deleteMany({ event: req.params.id });
  await Event.findByIdAndDelete(req.params.id);
  res.json({ ok: true });
});

export default r;
