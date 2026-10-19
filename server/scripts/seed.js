import 'dotenv/config';
import fs from 'fs';
import bcrypt from 'bcryptjs';
import mongoose from 'mongoose';
import { Event, Venue, User } from '../models/index.js';

const read = (f) => JSON.parse(fs.readFileSync(new URL(`../data/${f}`, import.meta.url)));
await mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/takshak26');

// Events: upsert by slug so re-running never wipes registrations
let created = 0;
for (const e of read('events.json')) {
  const { formLink, ...rest } = e;
  const res = await Event.updateOne({ slug: e.slug }, { $setOnInsert: { ...rest, formLink } }, { upsert: true });
  created += res.upsertedCount;
}
// Venues: never overwrite positions the admin has moved
for (const v of read('venues.json')) {
  await Venue.updateOne({ key: v.key }, { $setOnInsert: v }, { upsert: true });
  // venues seeded before the real map existed get their first coordinates; moved pins are never touched
  await Venue.updateOne({ key: v.key, lat: { $exists: false } }, { $set: { lat: v.lat, lng: v.lng } });
}

const email = (process.env.ADMIN_EMAIL || 'admin@takshak.in').toLowerCase();
if (!(await User.exists({ email }))) {
  await User.create({ name: 'TAKSHAK Admin', email, role: 'admin', password: await bcrypt.hash(process.env.ADMIN_PASSWORD || 'ChangeMe123!', 10) });
  console.log(`Admin created: ${email}`);
}
console.log(`Seeded ${created} new events (${await Event.countDocuments()} total), ${await Venue.countDocuments()} venues.`);
await mongoose.disconnect();
