import mongoose from 'mongoose';
const { Schema, model } = mongoose;

const userSchema = new Schema({
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  password: { type: String, required: true, select: false },
  phone: { type: String, trim: true },
  college: { type: String, trim: true, default: 'Mar Athanasius College of Engineering' },
  role: { type: String, enum: ['student', 'admin'], default: 'student' },
}, { timestamps: true });

const eventSchema = new Schema({
  slug: { type: String, unique: true, index: true },
  title: { type: String, required: true },
  category: { type: String, enum: ['workshop', 'competition', 'event'], required: true, index: true },
  organizer: String,
  tagline: String,
  description: String,
  poster: String,           // optional poster image link; otherwise client/src/assets/posters/<slug>.jpg is used
  // One entry per day the event runs (multi-day events have several)
  sessions: [{ start: { type: Date, required: true }, end: { type: Date, required: true }, _id: false }],
  timeNote: String,
  venue: String,
  online: { type: Boolean, default: false },
  feeText: String,
  feeAmount: Number,
  prizePool: String,
  activityPoints: String,
  teamSize: String,
  teamMin: Number,
  teamMax: Number,
  speaker: String,
  registrationDeadline: String,
  contacts: [{ name: String, phone: String, _id: false }],
  spotRegistration: { type: Boolean, default: false },
  registrationOpen: { type: Boolean, default: true },
  capacity: Number,
  formLink: String,
  tags: [String],
}, { timestamps: true });

const registrationSchema = new Schema({
  ticketId: { type: String, unique: true, index: true },
  event: { type: Schema.Types.ObjectId, ref: 'Event', required: true, index: true },
  user: { type: Schema.Types.ObjectId, ref: 'User', index: true },   // empty for walk-in (spot) registrations
  participant: { name: String, email: String, phone: String, college: String },
  teamName: String,
  members: [{ name: String, _id: false }],
  spot: { type: Boolean, default: false },
  status: { type: String, enum: ['registered', 'checked_in', 'cancelled'], default: 'registered' },
  paymentStatus: { type: String, enum: ['pending', 'paid', 'free'], default: 'pending' },
  checkedInAt: Date,
}, { timestamps: true });
registrationSchema.index({ event: 1, user: 1 }, { unique: true, partialFilterExpression: { user: { $type: 'objectId' } } });

const venueSchema = new Schema({
  key: { type: String, unique: true },
  label: String,
  block: String,
  aliases: [String],
  x: Number, y: Number,           // old schematic position (kept as a fallback)
  lat: Number, lng: Number,       // real position on the campus map
}, { timestamps: true });

export const User = model('User', userSchema);
export const Event = model('Event', eventSchema);
export const Registration = model('Registration', registrationSchema);
export const Venue = model('Venue', venueSchema);
