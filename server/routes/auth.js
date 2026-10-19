import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { User } from '../models/index.js';
import { requireAuth, signToken } from '../middleware/auth.js';

const r = Router();
const pub = (u) => ({ id: u._id, name: u.name, email: u.email, phone: u.phone, college: u.college, role: u.role });

r.post('/register', async (req, res) => {
  const { name, email, password, phone, college } = req.body;
  if (!name || !email || !password) return res.status(400).json({ error: 'Name, email and password are required.' });
  if (password.length < 6) return res.status(400).json({ error: 'Password needs at least 6 characters.' });
  if (await User.findOne({ email: email.toLowerCase() })) return res.status(409).json({ error: 'This email is already registered. Try logging in.' });
  const user = await User.create({ name, email, phone, college: college || undefined, password: await bcrypt.hash(password, 10) });
  res.status(201).json({ token: signToken(user), user: pub(user) });
});

r.post('/login', async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email: (email || '').toLowerCase() }).select('+password');
  if (!user || !(await bcrypt.compare(password || '', user.password)))
    return res.status(401).json({ error: 'Email or password is incorrect.' });
  res.json({ token: signToken(user), user: pub(user) });
});

r.get('/me', requireAuth, (req, res) => res.json({ user: pub(req.user) }));

r.put('/me', requireAuth, async (req, res) => {
  const { name, phone, college } = req.body;
  if (name) req.user.name = name;
  if (phone !== undefined) req.user.phone = phone;
  if (college) req.user.college = college;
  await req.user.save();
  res.json({ user: pub(req.user) });
});

export default r;
